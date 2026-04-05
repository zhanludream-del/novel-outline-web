import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { URL } from "node:url";
import { chromium } from "playwright";

const PORT = normalizePositiveInteger(process.env.PORT, 8789);
const FANQIE_ORIGIN = String(process.env.FANQIE_ORIGIN || "https://fanqienovel.com").trim().replace(/\/$/, "");
const SEARCH_TIMEOUT_MS = normalizePositiveInteger(process.env.SEARCH_TIMEOUT_MS, 25000);
const MAX_RESULTS_LIMIT = clamp(normalizePositiveInteger(process.env.MAX_RESULTS_LIMIT, 20), 1, 50);
const PLAYWRIGHT_HEADLESS = String(process.env.PLAYWRIGHT_HEADLESS || "true").trim().toLowerCase() !== "false";
const SEARCH_API_PATH = "/api/author/search/search_book/v1";
const DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";
const SEARCH_POLL_INTERVAL_MS = 500;
const SEARCH_RELOAD_RETRY_COUNT = clamp(normalizePositiveInteger(process.env.SEARCH_RELOAD_RETRY_COUNT, 1), 0, 3);
const STORAGE_STATE_PATH = resolveStorageStatePath(process.env.STORAGE_STATE_PATH || "./data/storage-state.json");

let browserPromise = null;

const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

    try {
        if (requestUrl.pathname === "/health") {
            const storageStateStat = await getStorageStateStat();
            return writeJson(res, 200, {
                ok: true,
                service: "fanqie-browser-search-service",
                headless: PLAYWRIGHT_HEADLESS,
                storageStatePath: STORAGE_STATE_PATH,
                storageStateExists: storageStateStat.exists,
                storageStateUpdatedAt: storageStateStat.updatedAt,
                timestamp: new Date().toISOString()
            });
        }

        if (requestUrl.pathname === "/search") {
            const keyword = cleanText(requestUrl.searchParams.get("keyword") || "");
            const limit = clamp(normalizePositiveInteger(requestUrl.searchParams.get("limit"), 8), 1, MAX_RESULTS_LIMIT);
            if (!keyword) {
                return writeJson(res, 400, {
                    ok: false,
                    error: "keyword is required"
                });
            }

            const payload = await searchBooks(keyword, limit);
            return writeJson(res, 200, payload);
        }

        return writeJson(res, 404, {
            ok: false,
            error: "Not Found"
        });
    } catch (error) {
        return writeJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : String(error || "Unknown error")
        });
    }
});

server.listen(PORT, () => {
    console.log(`fanqie-browser-search-service listening on ${PORT}`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function searchBooks(keyword, limit) {
    const browser = await getBrowser();
    const contextOptions = {
        locale: "zh-CN",
        timezoneId: "Asia/Shanghai",
        userAgent: DEFAULT_USER_AGENT,
        viewport: { width: 1366, height: 900 },
        extraHTTPHeaders: {
            "Accept-Language": "zh-CN,zh;q=0.9"
        }
    };

    if (await fileExists(STORAGE_STATE_PATH)) {
        contextOptions.storageState = STORAGE_STATE_PATH;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    const state = {
        keyword,
        challengeObserved: false,
        requestLog: [],
        successPayload: null
    };

    page.on("response", async (response) => {
        const url = response.url();
        if (!url.includes(SEARCH_API_PATH)) {
            return;
        }

        let requestKeyword = "";
        let hasMsToken = false;
        let hasABogus = false;
        try {
            const parsed = new URL(url);
            requestKeyword = decodeURIComponent(parsed.searchParams.get("query_word") || "");
            hasMsToken = parsed.searchParams.has("msToken");
            hasABogus = parsed.searchParams.has("a_bogus");
        } catch (_error) {}

        const headers = response.headers();
        if (headers["bdturing-verify"] || headers["x-vc-bdturing-parameters"]) {
            state.challengeObserved = true;
        }

        state.requestLog.push({
            url,
            status: response.status(),
            requestKeyword,
            hasMsToken,
            hasABogus
        });

        if (requestKeyword !== keyword || response.status() !== 200) {
            return;
        }

        if (!(headers["content-type"] || "").includes("application/json")) {
            return;
        }

        try {
            const payload = await response.json();
            if (payload?.code === 0 && Array.isArray(payload?.data?.search_book_data_list)) {
                state.successPayload = payload;
            }
        } catch (_error) {}
    });

    try {
        const searchUrl = `${FANQIE_ORIGIN}/search/${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: SEARCH_TIMEOUT_MS
        });

        let payloadReady = false;
        for (let attempt = 0; attempt <= SEARCH_RELOAD_RETRY_COUNT; attempt += 1) {
            payloadReady = await waitForSearchPayload(page, state, SEARCH_TIMEOUT_MS);
            if (payloadReady) {
                break;
            }

            if (attempt < SEARCH_RELOAD_RETRY_COUNT) {
                await page.reload({
                    waitUntil: "domcontentloaded",
                    timeout: SEARCH_TIMEOUT_MS
                });
            }
        }

        const domSummary = await page.evaluate(() => {
            const text = document.body ? document.body.innerText : "";
            const totalMatch = text.match(/共\s*(\d+)\s*项相关的结果/);
            return {
                title: document.title,
                totalCount: totalMatch ? Number(totalMatch[1]) : 0,
                textPreview: text.slice(0, 2000)
            };
        });

        const rawBooks = Array.isArray(state.successPayload?.data?.search_book_data_list)
            ? state.successPayload.data.search_book_data_list.slice(0, limit)
            : [];
        const needsVerification = state.challengeObserved && rawBooks.length === 0;

        if (rawBooks.length) {
            await persistStorageState(context);
        }

        return {
            ok: true,
            keyword,
            source: rawBooks.length ? "browser_network" : "browser_dom",
            totalCount: Number(state.successPayload?.data?.total_count || 0) || domSummary.totalCount || rawBooks.length,
            rawBooks,
            challengeObserved: state.challengeObserved,
            needsVerification,
            error: needsVerification ? "verification required before browser session can continue searching" : "",
            domSummary,
            requestLog: state.requestLog.slice(-8),
            fetchedAt: new Date().toISOString()
        };
    } finally {
        await context.close().catch(() => {});
    }
}

async function getBrowser() {
    if (!browserPromise) {
        browserPromise = chromium.launch({
            headless: PLAYWRIGHT_HEADLESS,
            args: [
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox"
            ]
        }).catch((error) => {
            browserPromise = null;
            throw error;
        });
    }
    return browserPromise;
}

async function shutdown() {
    server.close();
    if (browserPromise) {
        const browser = await browserPromise.catch(() => null);
        await browser?.close().catch(() => {});
    }
    process.exit(0);
}

function writeJson(res, status, data) {
    const body = JSON.stringify(data, null, 2);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
    });
    res.end(body);
}

async function waitForSearchPayload(page, state, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (Array.isArray(state.successPayload?.data?.search_book_data_list) && state.successPayload.data.search_book_data_list.length) {
            return true;
        }
        await page.waitForTimeout(SEARCH_POLL_INTERVAL_MS);
    }
    return false;
}

async function persistStorageState(context) {
    await fs.mkdir(path.dirname(STORAGE_STATE_PATH), { recursive: true });
    await context.storageState({ path: STORAGE_STATE_PATH });
}

async function getStorageStateStat() {
    if (!STORAGE_STATE_PATH) {
        return { exists: false, updatedAt: "" };
    }

    try {
        const stats = await fs.stat(STORAGE_STATE_PATH);
        return {
            exists: true,
            updatedAt: stats.mtime.toISOString()
        };
    } catch (_error) {
        return {
            exists: false,
            updatedAt: ""
        };
    }
}

async function fileExists(filePath) {
    if (!filePath) {
        return false;
    }

    try {
        await fs.access(filePath);
        return true;
    } catch (_error) {
        return false;
    }
}

function resolveStorageStatePath(input) {
    const value = cleanText(input);
    return value ? path.resolve(value) : "";
}

function normalizePositiveInteger(value, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
        return fallback;
    }
    return Math.floor(num);
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function cleanText(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim();
}
