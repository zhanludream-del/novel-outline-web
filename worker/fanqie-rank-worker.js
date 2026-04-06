const FANQIE_ORIGIN = "https://fanqienovel.com";
const DEFAULT_LIMIT = 10;
const FANQIE_APP_ID = "1967";
const CACHE_TTL_SECONDS = 900;
const HTML_FETCH_TIMEOUT_MS = 7000;
const API_FETCH_TIMEOUT_MS = 6000;
const FETCH_RETRY_COUNT = 2;
const MAX_CATEGORY_TARGETS = 2;
const SEARCH_API_PATH = "/api/author/search/search_book/v1";
const SEARCH_PAGE_FILTER = "127,127,127,127";
const SEARCH_QUERY_TYPE = "0";
const SEARCH_RESULT_PAGE_SIZE = 12;
const BROWSER_SEARCH_TIMEOUT_MS = 30000;
const EXTERNAL_SEARCH_MAX_QUERY_VARIANTS = 3;
const EXTERNAL_SEARCH_MAX_PAGE_FETCHES = 4;
const EXTERNAL_SEARCH_RESULT_MULTIPLIER = 3;
const FANQIE_GLYPH_MAP = {
    "58670": "0", "58413": "1", "58678": "2", "58371": "3", "58353": "4", "58480": "5", "58359": "6", "58449": "7", "58540": "8", "58692": "9",
    "58712": "a", "58542": "b", "58575": "c", "58626": "d", "58691": "e", "58561": "f", "58362": "g", "58619": "h", "58430": "i", "58531": "j",
    "58588": "k", "58440": "l", "58681": "m", "58631": "n", "58376": "o", "58429": "p", "58555": "q", "58498": "r", "58518": "s", "58453": "t",
    "58397": "u", "58356": "v", "58435": "w", "58514": "x", "58482": "y", "58529": "z", "58515": "A", "58688": "B", "58709": "C", "58344": "D",
    "58656": "E", "58381": "F", "58576": "G", "58516": "H", "58463": "I", "58649": "J", "58571": "K", "58558": "L", "58433": "M", "58517": "N",
    "58387": "O", "58687": "P", "58537": "Q", "58541": "R", "58458": "S", "58390": "T", "58466": "U", "58386": "V", "58697": "W", "58519": "X",
    "58511": "Y", "58634": "Z",
    "58611": "的", "58590": "一", "58398": "是", "58422": "了", "58657": "我", "58666": "不", "58562": "人", "58345": "在", "58510": "他", "58496": "有",
    "58654": "这", "58441": "个", "58493": "上", "58714": "们", "58618": "来", "58528": "到", "58620": "时", "58403": "大", "58461": "地", "58481": "为",
    "58700": "子", "58708": "中", "58503": "你", "58442": "说", "58639": "生", "58506": "国", "58663": "年", "58436": "着", "58563": "就", "58391": "那",
    "58357": "和", "58354": "要", "58695": "她", "58372": "出", "58696": "也", "58551": "得", "58445": "里", "58408": "后", "58599": "自", "58424": "以",
    "58394": "会", "58348": "家", "58426": "可", "58673": "下", "58417": "而", "58556": "过", "58603": "天", "58565": "去", "58604": "能", "58522": "对",
    "58632": "小", "58622": "多", "58350": "然", "58605": "于", "58617": "心", "58401": "学", "58637": "么", "58684": "之", "58382": "都", "58464": "好",
    "58487": "看", "58693": "起", "58608": "发", "58392": "当", "58474": "没", "58601": "成", "58355": "只", "58573": "如", "58499": "事", "58469": "把",
    "58361": "还", "58698": "用", "58489": "第", "58711": "样", "58457": "道", "58635": "想", "58492": "作", "58647": "种", "58623": "开", "58521": "美",
    "58609": "总", "58530": "从", "58665": "无", "58652": "情", "58676": "己", "58456": "面", "58581": "最", "58509": "女", "58488": "但", "58363": "现",
    "58685": "前", "58396": "些", "58523": "所", "58471": "同", "58485": "日", "58613": "手", "58533": "又", "58589": "行", "58527": "意", "58593": "动",
    "58699": "方", "58707": "期", "58414": "它", "58596": "头", "58570": "经", "58660": "长", "58364": "儿", "58526": "回", "58501": "位", "58638": "分",
    "58404": "爱", "58677": "老", "58535": "因", "58629": "很", "58577": "给", "58606": "名", "58497": "法", "58662": "间", "58479": "斯", "58532": "知",
    "58380": "世", "58385": "什", "58405": "两", "58644": "次", "58578": "使", "58505": "身", "58564": "者", "58412": "被", "58686": "高", "58624": "已",
    "58667": "亲", "58607": "其", "58616": "进", "58368": "此", "58427": "话", "58423": "常", "58633": "与", "58525": "活", "58543": "正", "58418": "感",
    "58597": "见", "58683": "明", "58507": "问", "58621": "力", "58703": "理", "58438": "尔", "58536": "点", "58384": "文", "58484": "几", "58539": "定",
    "58554": "本", "58421": "公", "58347": "特", "58569": "做", "58710": "外", "58574": "孩", "58375": "相", "58645": "西", "58592": "果", "58572": "走",
    "58388": "将", "58370": "月", "58399": "十", "58651": "实", "58546": "向", "58504": "声", "58419": "车", "58407": "全", "58672": "信", "58675": "重",
    "58538": "三", "58465": "机", "58374": "工", "58579": "物", "58402": "气", "58702": "每", "58553": "并", "58360": "别", "58389": "真", "58560": "打",
    "58690": "太", "58473": "新", "58512": "比", "58653": "才", "58704": "便", "58545": "夫", "58641": "再", "58475": "书", "58583": "部", "58472": "水",
    "58478": "像", "58664": "眼", "58586": "等", "58568": "体", "58674": "却", "58490": "加", "58476": "电", "58346": "主", "58630": "界", "58595": "门",
    "58502": "利", "58713": "海", "58587": "受", "58548": "听", "58351": "表", "58547": "德", "58443": "少", "58460": "克", "58636": "代", "58585": "员",
    "58625": "许", "58694": "稜", "58428": "先", "58640": "口", "58628": "由", "58612": "死", "58446": "安", "58468": "写", "58410": "性", "58508": "马",
    "58594": "光", "58483": "白", "58544": "或", "58495": "住", "58450": "难", "58643": "望", "58486": "教", "58406": "命", "58447": "花", "58669": "结",
    "58415": "乐", "58444": "色", "58549": "更", "58494": "拉", "58409": "东", "58658": "神", "58557": "记", "58602": "处", "58559": "让", "58610": "母",
    "58513": "父", "58500": "应", "58378": "直", "58680": "字", "58352": "场", "58383": "平", "58454": "报", "58671": "友", "58668": "关", "58452": "放",
    "58627": "至", "58400": "张", "58455": "认", "58416": "接", "58552": "告", "58614": "入", "58582": "笑", "58534": "内", "58701": "英", "58349": "军",
    "58491": "候", "58467": "民", "58365": "岁", "58598": "往", "58425": "何", "58462": "度", "58420": "山", "58661": "觉", "58615": "路", "58648": "带",
    "58470": "万", "58377": "男", "58520": "边", "58646": "风", "58600": "解", "58431": "叫", "58715": "任", "58524": "金", "58439": "快", "58566": "原",
    "58477": "吃", "58642": "妈", "58437": "变", "58411": "通", "58451": "师", "58395": "立", "58369": "象", "58706": "数", "58705": "四", "58379": "失",
    "58567": "满", "58373": "战", "58448": "远", "58659": "格", "58434": "士", "58679": "音", "58432": "轻", "58689": "目", "58591": "条", "58682": "呢"
};

export default {
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders()
            });
        }

        const url = new URL(request.url);
        if (url.pathname !== "/api/fanqie/trends") {
            return json(
                {
                    ok: false,
                    error: "Not Found"
                },
                404
            );
        }

        const refresh = url.searchParams.get("refresh") === "1";
        const cacheKey = new Request(url.toString(), {
            method: "GET",
            headers: request.headers
        });
        const cache = caches.default;

        if (!refresh) {
            const cached = await cache.match(cacheKey);
            if (cached) {
                return withResponseHeaders(cached, {
                    "X-Worker-Cache": "HIT"
                });
            }
        }

        try {
            const keyword = url.searchParams.get("keyword") || "";
            const genre = url.searchParams.get("genre") || "";
            const subgenre = url.searchParams.get("subgenre") || "";
            const limit = Math.max(5, Math.min(20, Number(url.searchParams.get("limit") || DEFAULT_LIMIT) || DEFAULT_LIMIT));

            const rankIndexHtml = await fetchHtml(`${FANQIE_ORIGIN}/rank/all`);
            const categories = parseCategoryLinks(rankIndexHtml);
            const selectedCategories = pickBestCategories(categories, { keyword, genre, subgenre }).slice(0, MAX_CATEGORY_TARGETS);
            const categoryTargets = selectedCategories.length
                ? selectedCategories
                : [{ name: "总榜参考", href: "/rank/all" }];

            const rankItemMap = new Map();
            for (const category of categoryTargets) {
                if (rankItemMap.size >= limit) {
                    break;
                }

                let books = [];
                if (category.categoryId) {
                    books = await fetchRankCategoryBooks(category, limit);
                }
                if (!books.length && category.href === "/rank/all") {
                    books = parseRankBooks(rankIndexHtml, category.name).slice(0, limit);
                }
                if (!books.length && rankItemMap.size === 0 && category.href && category.href !== "/rank/all") {
                    const categoryHtml = category.href === "/rank/all"
                        ? rankIndexHtml
                        : await fetchHtml(new URL(category.href, FANQIE_ORIGIN).toString());
                    books = parseRankBooks(categoryHtml, category.name).slice(0, limit);
                }
                books.forEach((book) => {
                    if (!book.title) {
                        return;
                    }
                    const key = normalizeKey(book.title);
                    if (!rankItemMap.has(key)) {
                        rankItemMap.set(key, book);
                    }
                });
            }

            const rankItems = Array.from(rankItemMap.values()).slice(0, limit);
            const rankDiagnostics = buildTrendDiagnostics(rankItems);
            const rankAssessment = assessTrendMatch({
                keyword,
                genre,
                subgenre,
                categories: categoryTargets,
                items: rankItems,
                diagnostics: rankDiagnostics
            });

            let searchResult = createEmptySearchResult();
            if (shouldFallbackToSearch(rankAssessment)) {
                searchResult = await fetchSearchBooks(env, keyword, limit);
            }

            let items = mergeTrendSources({
                rankItems,
                searchItems: searchResult.items,
                keyword,
                genre,
                subgenre,
                limit
            });
            if (!searchResult.used && shouldFallbackToSearch(rankAssessment) && rankAssessment.relevantCount === 0) {
                items = [];
            }
            const diagnostics = buildTrendDiagnostics(items);
            const sourceBreakdown = {
                rank: {
                    used: rankItems.length > 0,
                    categories: categoryTargets.map((item) => item.name).filter(Boolean),
                    itemCount: rankItems.length,
                    relevantCount: rankAssessment.relevantCount,
                    score: rankAssessment.score,
                    fallbackRecommended: rankAssessment.shouldFallback,
                    fallbackReason: rankAssessment.reason || ""
                },
                search: {
                    attempted: searchResult.attempted === true,
                    used: searchResult.used === true,
                    source: searchResult.source || "",
                    itemCount: Array.isArray(searchResult.items) ? searchResult.items.length : 0,
                    totalCount: Number(searchResult.totalCount || 0) || 0,
                    challengeDetected: searchResult.challengeDetected === true,
                    error: searchResult.error || ""
                },
                merged: {
                    itemCount: items.length,
                    sources: [
                        rankItems.length ? "rank" : "",
                        searchResult.used ? (searchResult.source || "search") : ""
                    ].filter(Boolean)
                }
            };
            const summary = buildTrendSummaryV3({
                keyword,
                genre,
                subgenre,
                categories: categoryTargets,
                items,
                diagnostics,
                sourceBreakdown
            });

            const response = json({
                ok: true,
                keyword,
                genre,
                subgenre,
                selectedCategories: categoryTargets,
                items,
                diagnostics,
                summary,
                searchFallbackUsed: searchResult.used === true,
                sourceBreakdown,
                fetchedAt: new Date().toISOString()
            }, 200, {
                "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, s-maxage=${CACHE_TTL_SECONDS}`,
                "X-Worker-Cache": "MISS"
            });

            ctx?.waitUntil(cache.put(cacheKey, response.clone()));
            return response;
        } catch (error) {
            return json(
                {
                    ok: false,
                    error: error instanceof Error ? error.message : String(error || "榜单抓取失败")
                },
                500
            );
        }
    }
};

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json; charset=utf-8"
    };
}

function json(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            ...corsHeaders(),
            ...extraHeaders
        }
    });
}

function withResponseHeaders(response, extraHeaders = {}) {
    const next = new Response(response.body, response);
    Object.entries(extraHeaders || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            next.headers.set(key, String(value));
        }
    });
    return next;
}

async function fetchWithTimeout(url, init = {}, timeoutMs = HTML_FETCH_TIMEOUT_MS, retryCount = FETCH_RETRY_COUNT) {
    let lastError = null;
    for (let attempt = 1; attempt <= retryCount; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(`timeout:${timeoutMs}`), timeoutMs);
        try {
            return await fetch(url, {
                ...init,
                signal: controller.signal
            });
        } catch (error) {
            lastError = error;
            if (attempt >= retryCount) {
                break;
            }
        } finally {
            clearTimeout(timer);
        }
    }
    throw normalizeFetchError(lastError, url, timeoutMs);
}

function normalizeFetchError(error, url, timeoutMs) {
    const message = String(error?.message || error || "请求失败");
    if (/abort|timeout/i.test(message)) {
        return new Error(`抓取超时：${url}（>${timeoutMs}ms）`);
    }
    return error instanceof Error ? error : new Error(message);
}

async function fetchHtml(url) {
    const response = await fetchWithTimeout(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NovelOutlineWeb/1.0; +https://github.com/zhanludream-del/novel-outline-web)",
            "Accept-Language": "zh-CN,zh;q=0.9"
        }
    }, HTML_FETCH_TIMEOUT_MS);
    if (!response.ok) {
        throw new Error(`抓取番茄榜单失败：${response.status}`);
    }
    return response.text();
}

async function fetchRankCategoryBooks(category, limit) {
    const endpoint = new URL("/api/rank/category/list", FANQIE_ORIGIN);
    endpoint.searchParams.set("app_id", FANQIE_APP_ID);
    endpoint.searchParams.set("rank_list_type", "3");
    endpoint.searchParams.set("offset", "0");
    endpoint.searchParams.set("limit", String(Math.max(10, Math.min(30, limit || DEFAULT_LIMIT))));
    endpoint.searchParams.set("category_id", String(category.categoryId || ""));
    endpoint.searchParams.set("rank_version", "");
    endpoint.searchParams.set("gender", String(category.gender || "1"));
    endpoint.searchParams.set("rankMold", String(category.rankMold || "2"));

    let response = null;
    try {
        response = await fetchWithTimeout(endpoint.toString(), {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; NovelOutlineWeb/1.0; +https://github.com/zhanludream-del/novel-outline-web)",
                "Accept": "application/json, text/plain, */*",
                "Accept-Language": "zh-CN,zh;q=0.9",
                "Referer": new URL(category.href || "/rank/all", FANQIE_ORIGIN).toString()
            }
        }, API_FETCH_TIMEOUT_MS);
    } catch (error) {
        return [];
    }
    if (!response || !response.ok) {
        return [];
    }

    const payload = await response.json().catch(() => null);
    const rawBooks = payload?.data?.book_list;
    if (!Array.isArray(rawBooks) || !rawBooks.length) {
        return [];
    }

    return rawBooks.map((book) => normalizeBook({
        title: decodeFanqieText(book.bookName || book.book_name || book.title || ""),
        author: decodeFanqieText(book.author || book.authorName || ""),
        intro: decodeFanqieText(
            book.abstract
            || book.introduction
            || book.intro
            || book.bookAbstract
            || book.bookIntro
            || book.description
            || ""
        ),
        status: String(book.creationStatus || "") === "1" ? "连载中" : (String(book.creationStatus || "") === "2" ? "已完结" : ""),
        readingCount: cleanText(book.read_count || book.readCount || ""),
        category: category.name,
        tags: collectApiBookTags(book),
        url: book.bookId ? `/page/${book.bookId}` : ""
    }));
}

function createEmptySearchResult() {
    return {
        attempted: false,
        used: false,
        source: "",
        items: [],
        totalCount: 0,
        challengeDetected: false,
        error: ""
    };
}

async function fetchSearchBooks(env, keyword, limit) {
    const cleanKeyword = cleanText(keyword);
    if (!cleanKeyword) {
        return createEmptySearchResult();
    }

    const apiResult = await fetchSearchBooksFromApi(cleanKeyword, limit);
    if (apiResult.used) {
        return apiResult;
    }

    const htmlResult = await fetchSearchBooksFromHtml(cleanKeyword, limit);
    if (htmlResult.used) {
        return {
            attempted: true,
            used: true,
            source: htmlResult.source || apiResult.source || "",
            items: htmlResult.items,
            totalCount: htmlResult.totalCount || apiResult.totalCount || 0,
            challengeDetected: apiResult.challengeDetected === true || htmlResult.challengeDetected === true,
            error: ""
        };
    }

    const browserResult = await fetchSearchBooksFromBrowserService(env, cleanKeyword, limit);
    if (browserResult.used) {
        return {
            attempted: true,
            used: true,
            source: browserResult.source || htmlResult.source || apiResult.source || "",
            items: browserResult.items,
            totalCount: browserResult.totalCount || htmlResult.totalCount || apiResult.totalCount || 0,
            challengeDetected: apiResult.challengeDetected === true || htmlResult.challengeDetected === true,
            error: ""
        };
    }

    const externalResult = await fetchSearchBooksFromExternalSearch(cleanKeyword, limit);
    return {
        attempted: true,
        used: externalResult.used,
        source: externalResult.source || browserResult.source || htmlResult.source || apiResult.source || "",
        items: externalResult.items,
        totalCount: externalResult.totalCount || browserResult.totalCount || htmlResult.totalCount || apiResult.totalCount || 0,
        challengeDetected: apiResult.challengeDetected === true || htmlResult.challengeDetected === true,
        error: externalResult.used ? "" : (externalResult.error || browserResult.error || htmlResult.error || apiResult.error || "")
    };
}

async function fetchSearchBooksFromBrowserService(env, keyword, limit) {
    const endpointText = cleanText(env?.BROWSER_SEARCH_API_URL || "");
    if (!endpointText) {
        return createEmptySearchResult();
    }

    let endpoint;
    try {
        endpoint = new URL(endpointText);
    } catch (_error) {
        return {
            attempted: true,
            used: false,
            source: "browser_service",
            items: [],
            totalCount: 0,
            challengeDetected: false,
            error: "browser service url invalid"
        };
    }

    endpoint.searchParams.set("keyword", keyword);
    endpoint.searchParams.set("limit", String(Math.max(1, Math.min(20, Number(limit) || SEARCH_RESULT_PAGE_SIZE))));

    let response;
    try {
        response = await fetchWithTimeout(endpoint.toString(), {
            headers: {
                Accept: "application/json"
            }
        }, BROWSER_SEARCH_TIMEOUT_MS, 1);
    } catch (error) {
        return {
            attempted: true,
            used: false,
            source: "browser_service",
            items: [],
            totalCount: 0,
            challengeDetected: false,
            error: error instanceof Error ? error.message : String(error || "browser service failed")
        };
    }

    const rawText = await response.text().catch(() => "");
    const payload = safeJsonParse(rawText);
    if (!response.ok) {
        return {
            attempted: true,
            used: false,
            source: "browser_service",
            items: [],
            totalCount: 0,
            challengeDetected: false,
            error: payload?.error || `browser service status ${response.status}`
        };
    }

    const rawBooks = Array.isArray(payload?.rawBooks)
        ? payload.rawBooks
        : (Array.isArray(payload?.data?.search_book_data_list) ? payload.data.search_book_data_list : []);
    const items = parseSearchApiBooks({
        data: {
            search_book_data_list: rawBooks,
            total_count: payload?.totalCount || payload?.data?.total_count || rawBooks.length
        }
    }).slice(0, limit);

    return {
        attempted: true,
        used: items.length > 0,
        source: "browser_service",
        items,
        totalCount: Number(payload?.totalCount || payload?.data?.total_count || 0) || items.length,
        challengeDetected: payload?.needsVerification === true || payload?.challengeObserved === true,
        error: items.length ? "" : cleanText(payload?.error || "browser service returned no books")
    };
}

async function fetchSearchBooksFromApi(keyword, limit) {
    const searchUrl = new URL(`/search/${encodeURIComponent(keyword)}`, FANQIE_ORIGIN).toString();
    let cookieHeader = "";
    try {
        const bootstrapResponse = await fetchWithTimeout(searchUrl, {
            headers: buildBrowserHeaders({
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                Referer: `${FANQIE_ORIGIN}/`
            })
        }, HTML_FETCH_TIMEOUT_MS, 1);
        cookieHeader = extractCookieHeader(bootstrapResponse.headers);
    } catch (_error) {
        cookieHeader = "";
    }

    const endpoint = new URL(SEARCH_API_PATH, FANQIE_ORIGIN);
    endpoint.searchParams.set("query_word", keyword);
    endpoint.searchParams.set("query_type", SEARCH_QUERY_TYPE);
    endpoint.searchParams.set("page_index", "0");
    endpoint.searchParams.set("page_count", String(Math.max(10, Math.min(20, limit || SEARCH_RESULT_PAGE_SIZE))));
    endpoint.searchParams.set("filter", SEARCH_PAGE_FILTER);

    let response = null;
    try {
        response = await fetchWithTimeout(endpoint.toString(), {
            headers: buildBrowserHeaders({
                Accept: "application/json, text/plain, */*",
                Referer: searchUrl,
                Origin: FANQIE_ORIGIN,
                ...(cookieHeader ? { Cookie: cookieHeader } : {})
            })
        }, API_FETCH_TIMEOUT_MS);
    } catch (error) {
        return {
            attempted: true,
            used: false,
            source: "search_api",
            items: [],
            totalCount: 0,
            challengeDetected: false,
            error: error instanceof Error ? error.message : String(error || "search api failed")
        };
    }

    const rawText = await response.text().catch(() => "");
    const challengeDetected = isSearchChallengeResponse(response, rawText);
    if (!response.ok) {
        return {
            attempted: true,
            used: false,
            source: "search_api",
            items: [],
            totalCount: 0,
            challengeDetected,
            error: `search api status ${response.status}`
        };
    }

    const payload = safeJsonParse(rawText);
    if (!payload) {
        return {
            attempted: true,
            used: false,
            source: "search_api",
            items: [],
            totalCount: 0,
            challengeDetected,
            error: rawText.trim() ? "search api invalid json" : "search api empty response"
        };
    }

    const items = parseSearchApiBooks(payload).slice(0, limit);
    return {
        attempted: true,
        used: items.length > 0,
        source: "search_api",
        items,
        totalCount: Number(payload?.data?.total_count || payload?.data?.totalCount || 0) || items.length,
        challengeDetected,
        error: items.length ? "" : "search api returned no books"
    };
}

async function fetchSearchBooksFromHtml(keyword, limit) {
    const searchUrl = new URL(`/search/${encodeURIComponent(keyword)}`, FANQIE_ORIGIN).toString();
    try {
        const html = await fetchHtml(searchUrl);
        const state = parseSearchStateFromHtml(html);
        const stateBooks = findSearchBookArray(state);
        if (stateBooks.length) {
            const items = parseSearchApiBooks({
                data: {
                    search_book_data_list: stateBooks,
                    total_count: stateBooks.length
                }
            }).slice(0, limit);
            return {
                attempted: true,
                used: items.length > 0,
                source: "search_html_state",
                items,
                totalCount: stateBooks.length,
                challengeDetected: false,
                error: items.length ? "" : "search html state had no usable books"
            };
        }

        const items = parseSearchBooksFromHtmlMarkup(html, keyword).slice(0, limit);
        return {
            attempted: true,
            used: items.length > 0,
            source: "search_html",
            items,
            totalCount: items.length,
            challengeDetected: false,
            error: items.length ? "" : "search html had no usable books"
        };
    } catch (error) {
        return {
            attempted: true,
            used: false,
            source: "search_html",
            items: [],
            totalCount: 0,
            challengeDetected: false,
            error: error instanceof Error ? error.message : String(error || "search html failed")
        };
    }
}

async function fetchSearchBooksFromExternalSearch(keyword, limit) {
    const queries = buildExternalSearchQueries(keyword).slice(0, EXTERNAL_SEARCH_MAX_QUERY_VARIANTS);
    const merged = new Map();
    let totalCount = 0;
    let lastError = "";

    for (const query of queries) {
        try {
            const rssItems = await fetchExternalSearchRss(query, Math.max(10, Math.min(30, (limit || SEARCH_RESULT_PAGE_SIZE) * EXTERNAL_SEARCH_RESULT_MULTIPLIER)));
            totalCount += rssItems.length;
            const candidates = rssItems
                .filter((item) => isFanqieBookPageUrl(item.link))
                .map((item) => normalizeExternalSearchCandidate(item))
                .filter(Boolean)
                .sort((left, right) => scoreBookForContext(right, { keyword }) - scoreBookForContext(left, { keyword }));

            if (!candidates.length) {
                continue;
            }

            const hydrated = await hydrateExternalSearchCandidates(candidates, keyword, limit);
            hydrated.forEach((book) => {
                if (!book?.title) {
                    return;
                }
                const key = normalizeKey(book.title);
                const existing = merged.get(key);
                if (!existing || scoreBookForContext(book, { keyword }) > scoreBookForContext(existing, { keyword })) {
                    merged.set(key, book);
                }
            });

            if (merged.size >= limit) {
                break;
            }
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error || "external search failed");
        }
    }

    const items = Array.from(merged.values())
        .sort((left, right) => {
            const rightScore = scoreBookForContext(right, { keyword });
            const leftScore = scoreBookForContext(left, { keyword });
            if (rightScore !== leftScore) {
                return rightScore - leftScore;
            }
            return cleanText(right.analysisIntro || right.intro || "").length - cleanText(left.analysisIntro || left.intro || "").length;
        })
        .slice(0, limit);

    return {
        attempted: true,
        used: items.length > 0,
        source: "search_external_rss",
        items,
        totalCount: totalCount || items.length,
        challengeDetected: false,
        error: items.length ? "" : (lastError || "external search returned no books")
    };
}

function buildBrowserHeaders(overrides = {}) {
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        ...overrides
    };
}

function buildExternalSearchQueries(keyword) {
    const cleanKeyword = cleanText(keyword);
    const compactKeyword = cleanKeyword.replace(/[^\p{L}\p{N}]+/gu, "");
    return uniqueBy(
        [
            `site:fanqienovel.com/page/ ${cleanKeyword}`,
            compactKeyword && compactKeyword !== cleanKeyword ? `site:fanqienovel.com/page/ ${compactKeyword}` : "",
            cleanKeyword ? `site:fanqienovel.com/page/ "${cleanKeyword}"` : ""
        ].map((item) => cleanText(item)).filter(Boolean),
        (item) => normalizeKey(item)
    );
}

async function fetchExternalSearchRss(query, count) {
    const endpoint = new URL("/search", "https://www.bing.com");
    endpoint.searchParams.set("format", "rss");
    endpoint.searchParams.set("setlang", "zh-Hans");
    endpoint.searchParams.set("mkt", "zh-CN");
    endpoint.searchParams.set("count", String(Math.max(10, Math.min(50, Number(count) || 20))));
    endpoint.searchParams.set("q", query);

    const response = await fetchWithTimeout(endpoint.toString(), {
        headers: buildBrowserHeaders({
            Accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.5",
            Referer: "https://www.bing.com/"
        })
    }, API_FETCH_TIMEOUT_MS, 1);

    if (!response.ok) {
        throw new Error(`external search status ${response.status}`);
    }

    const xml = await response.text().catch(() => "");
    const items = parseExternalSearchRss(xml);
    if (!items.length) {
        throw new Error("external search returned no rss items");
    }
    return items;
}

function parseExternalSearchRss(xml) {
    const items = [];
    const regex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = regex.exec(String(xml || "")))) {
        const block = match[1];
        const title = decodeXmlEntities(extractXmlTagValue(block, "title"));
        const link = decodeXmlEntities(extractXmlTagValue(block, "link"));
        const description = decodeXmlEntities(extractXmlTagValue(block, "description"));
        if (!link) {
            continue;
        }
        items.push({
            title: cleanText(title),
            link: cleanText(link),
            description: cleanText(description)
        });
    }

    return items;
}

function extractXmlTagValue(block, tagName) {
    const match = String(block || "").match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
    return stripCdata(match?.[1] || "");
}

function stripCdata(value) {
    return String(value || "")
        .replace(/^<!\[CDATA\[/, "")
        .replace(/\]\]>$/, "")
        .trim();
}

function decodeXmlEntities(value) {
    return cleanText(String(value || "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&"));
}

function isFanqieBookPageUrl(value) {
    try {
        const url = new URL(String(value || ""));
        return /(^|\.)fanqienovel\.com$/i.test(url.hostname) && /^\/page\/\d+/.test(url.pathname);
    } catch (_error) {
        return false;
    }
}

function normalizeExternalSearchCandidate(item) {
    const absoluteUrl = cleanText(item?.link || "");
    if (!isFanqieBookPageUrl(absoluteUrl)) {
        return null;
    }

    const url = normalizeBookUrl(absoluteUrl);
    const title = cleanExternalSearchTitle(item?.title || "");
    const intro = stripHtmlTags(item?.description || "");
    return normalizeBook({
        title,
        author: "",
        intro,
        category: "外部搜索",
        tags: extractTags(`${title} ${intro}`),
        url
    });
}

function cleanExternalSearchTitle(value) {
    return cleanText(String(value || "")
        .replace(/完整版在线免费阅读/gi, "")
        .replace(/在线免费阅读/gi, "")
        .replace(/_番茄小说官网/gi, "")
        .replace(/- 番茄小说官网/gi, "")
        .replace(/番茄小说官网/gi, "")
        .replace(/_小说$/gi, "")
        .replace(/小说$/gi, "")
        .replace(/[_\-\s]+$/g, ""));
}

async function hydrateExternalSearchCandidates(candidates, keyword, limit) {
    const toHydrate = candidates.slice(0, Math.max(2, Math.min(EXTERNAL_SEARCH_MAX_PAGE_FETCHES, (limit || 5) + 1)));
    const hydrated = await Promise.all(toHydrate.map(async (candidate) => {
        const url = cleanText(candidate?.url || "");
        if (!url) {
            return candidate;
        }

        try {
            const book = await fetchBookFromPageUrl(url);
            return mergeExternalCandidateWithPageBook(candidate, book);
        } catch (_error) {
            return candidate;
        }
    }));

    return uniqueBy(
        hydrated
            .filter(Boolean)
            .filter((item) => scoreBookForContext(item, { keyword }) >= 6 || cleanText(item.analysisIntro || item.intro || "").length >= 18),
        (item) => normalizeKey(item.title || item.url || "")
    );
}

async function fetchBookFromPageUrl(url) {
    const absoluteUrl = /^https?:\/\//i.test(url) ? url : new URL(url, FANQIE_ORIGIN).toString();
    const html = await fetchHtml(absoluteUrl);
    return parseBookPage(html, normalizeBookUrl(absoluteUrl));
}

function mergeExternalCandidateWithPageBook(candidate, pageBook) {
    if (!pageBook?.title) {
        return candidate;
    }

    return normalizeBook({
        title: pageBook.title || candidate.title,
        author: pageBook.author || candidate.author,
        intro: pageBook.intro || candidate.intro,
        status: pageBook.status || candidate.status,
        readingCount: pageBook.readingCount || candidate.readingCount,
        category: pageBook.category || candidate.category || "外部搜索",
        tags: uniqueBy([...(candidate.tags || []), ...(pageBook.tags || [])], (item) => item),
        url: pageBook.url || candidate.url
    });
}

function parseBookPage(html, fallbackUrl = "") {
    const structured = parsePrimaryStructuredBook(html, fallbackUrl);
    const lines = extractTextLines(html);
    const title = structured?.title || findBookPageTitle(lines);
    const introIndex = findBookPageIntroIndex(lines);
    const intro = structured?.intro || findBookPageIntro(lines, introIndex);
    const author = structured?.author || findBookPageAuthor(lines, title, introIndex);
    const statusCategory = findBookPageStatusAndCategory(lines, title);

    return normalizeBook({
        title,
        author,
        intro,
        status: structured?.status || statusCategory.status,
        category: structured?.category || statusCategory.category || "外部搜索",
        tags: uniqueBy([...(structured?.tags || []), ...extractTags(`${title} ${intro}`)], (item) => item),
        url: structured?.url || fallbackUrl
    });
}

function parsePrimaryStructuredBook(html, fallbackUrl = "") {
    const candidates = [];
    const scriptRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = scriptRegex.exec(String(html || "")))) {
        const parsed = safeJsonParse(match[1]);
        walkStructuredData(parsed, (item) => {
            const title = cleanExternalSearchTitle(item?.name || item?.headline || item?.title || "");
            if (!title) {
                return;
            }
            const intro = cleanText(item?.description || item?.summary || "");
            const author = cleanText(extractAuthorName(item?.author));
            const typeText = Array.isArray(item?.["@type"]) ? item["@type"].join(" ") : String(item?.["@type"] || "");
            const status = normalizeCreationStatusText(item?.creationStatus || item?.status || "");
            const url = normalizeBookUrl(item?.url || fallbackUrl);
            let score = 0;
            if (/\bBook\b/i.test(typeText)) {
                score += 20;
            }
            if (intro) {
                score += 8;
            }
            if (author) {
                score += 5;
            }
            if (/\/page\/\d+/.test(url)) {
                score += 3;
            }
            if (/^第.{1,20}章/.test(title)) {
                score -= 10;
            }

            candidates.push({
                score,
                book: normalizeBook({
                    title,
                    author,
                    intro,
                    status,
                    category: "",
                    tags: extractTags(`${title} ${intro}`),
                    url
                })
            });
        });
    }

    return candidates
        .sort((left, right) => right.score - left.score)
        .map((item) => item.book)
        .find((item) => item?.title) || null;
}

function extractTextLines(html) {
    return String(html || "")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<\/(p|div|li|h\d|section|article|header|footer|main|aside|nav|br)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .split(/\r?\n+/)
        .map((line) => cleanText(line))
        .filter(Boolean);
}

function findBookPageTitle(lines) {
    const candidates = Array.isArray(lines) ? lines : [];
    for (let index = 0; index < Math.min(25, candidates.length); index += 1) {
        const candidate = candidates[index];
        if (!candidate || candidate.length < 2 || candidate.length > 40) {
            continue;
        }
        if (/^首页\b|开始阅读|最近更新|番茄小说|目录|代表作|作者/.test(candidate)) {
            continue;
        }
        if (/已完结|连载中|\d+\.?\d*\s*万字/.test(candidate)) {
            continue;
        }
        if (/^第.{1,20}章/.test(candidate)) {
            continue;
        }
        return candidate;
    }
    return "";
}

function findBookPageIntroIndex(lines) {
    return (Array.isArray(lines) ? lines : []).findIndex((line) => /作品简介/.test(line));
}

function findBookPageIntro(lines, introIndex) {
    if (!Array.isArray(lines) || introIndex < 0) {
        return "";
    }

    const fragments = [];
    for (let index = introIndex + 1; index < lines.length; index += 1) {
        const candidate = lines[index];
        if (!candidate) {
            continue;
        }
        if (/^目录\b|^第一卷|^第二卷|^第三卷|^第四卷|^第五卷|^第六卷|^第七卷|^第八卷|^第\d+章/.test(candidate)) {
            break;
        }
        if (/^代表作|^开始阅读|^\d+\.?\d*\s*万字$/.test(candidate)) {
            continue;
        }
        fragments.push(candidate);
        if (fragments.join(" ").length >= 260) {
            break;
        }
    }
    return fragments.join(" ").trim();
}

function findBookPageAuthor(lines, title, introIndex) {
    if (!Array.isArray(lines) || !lines.length) {
        return "";
    }

    const start = introIndex > 0 ? Math.max(0, introIndex - 12) : 0;
    const end = introIndex > 0 ? introIndex : Math.min(lines.length, 20);
    for (let index = end - 1; index >= start; index -= 1) {
        const candidate = cleanText(lines[index]);
        if (!candidate || candidate === title) {
            continue;
        }
        if (candidate.length > 20) {
            continue;
        }
        if (/^首页\b|开始阅读|最近更新|代表作|作品简介|目录|番茄小说|已完结|连载中|\d+\.?\d*\s*万字/.test(candidate)) {
            continue;
        }
        if (/^第.{1,20}章/.test(candidate)) {
            continue;
        }
        return candidate;
    }
    return "";
}

function findBookPageStatusAndCategory(lines, title) {
    const candidates = Array.isArray(lines) ? lines : [];
    const titleIndex = candidates.findIndex((line) => line === title);
    const start = titleIndex >= 0 ? titleIndex + 1 : 0;
    const end = Math.min(candidates.length, start + 4);
    let status = "";
    let category = "";

    for (let index = start; index < end; index += 1) {
        const candidate = candidates[index];
        if (!candidate) {
            continue;
        }
        if (/已完结|连载中/.test(candidate) && !status) {
            const statusMatch = candidate.match(/已完结|连载中/);
            status = statusMatch?.[0] || "";
            category = cleanText(candidate.replace(/已完结|连载中/g, "").replace(/\d+\.?\d*\s*万字/g, ""));
            if (status || category) {
                break;
            }
        }
    }

    return { status, category };
}

function extractCookieHeader(headers) {
    if (!headers) {
        return "";
    }

    const collected = [];
    const pushCookies = (input) => {
        if (!input) {
            return;
        }
        String(input)
            .split(/,(?=[^;]+?=)/)
            .map((entry) => entry.trim())
            .forEach((entry) => {
                const pair = entry.split(";")[0].trim();
                if (pair && pair.includes("=")) {
                    collected.push(pair);
                }
            });
    };

    if (typeof headers.getSetCookie === "function") {
        headers.getSetCookie().forEach((value) => pushCookies(value));
    } else {
        pushCookies(headers.get("set-cookie"));
    }

    return uniqueBy(collected, (item) => item).join("; ");
}

function isSearchChallengeResponse(response, rawText = "") {
    if (!response || !response.headers) {
        return false;
    }

    const headers = response.headers;
    if (headers.get("bdturing-verify") || headers.get("x-vc-bdturing-parameters") || headers.get("x-ms-token")) {
        return true;
    }

    return !String(rawText || "").trim() && response.status === 200;
}

function parseSearchApiBooks(payload) {
    const rawBooks = Array.isArray(payload?.data?.search_book_data_list)
        ? payload.data.search_book_data_list
        : findSearchBookArray(payload);
    if (!Array.isArray(rawBooks) || !rawBooks.length) {
        return [];
    }

    const books = rawBooks
        .map((entry) => {
            const book = unwrapSearchBookEntry(entry);
            const title = decodeFanqieText(pickFirstString(book, [
                "book_name",
                "bookName",
                "title",
                "name",
                "book_title",
                "bookTitle"
            ]) || pickFirstString(entry, [
                "book_name",
                "bookName",
                "title",
                "name"
            ]));
            if (!title) {
                return null;
            }

            const author = decodeFanqieText(pickFirstString(book, [
                "author",
                "author_name",
                "authorName",
                "writer",
                "author_info.name",
                "authorInfo.name"
            ]) || pickFirstString(entry, [
                "author",
                "author_name",
                "authorName"
            ]));
            const intro = decodeFanqieText(stripHtmlTags(pickFirstString(book, [
                "abstract",
                "book_intro",
                "bookIntro",
                "intro",
                "description",
                "book_abstract",
                "bookAbstract",
                "summary"
            ]) || pickFirstString(entry, [
                "abstract",
                "book_intro",
                "bookIntro",
                "description",
                "summary",
                "matched_content",
                "matchedContent"
            ])));
            const status = normalizeCreationStatusText(
                pickFirstString(book, ["creation_status", "creationStatus", "status"])
                || pickFirstString(entry, ["creation_status", "creationStatus", "status"])
            );
            const bookId = pickFirstString(book, ["book_id", "bookId", "id"]) || pickFirstString(entry, ["book_id", "bookId", "id"]);
            const category = decodeFanqieText(pickFirstString(book, [
                "category_name",
                "categoryName",
                "subCategoryName",
                "firstCategoryName",
                "secondCategoryName"
            ]));
            const tags = uniqueBy(
                collectApiBookTags(book).concat(collectApiBookTags(entry)).concat(extractTags(intro)),
                (item) => item
            );

            return normalizeBook({
                title,
                author,
                intro,
                status,
                category: category || "搜索结果",
                tags,
                url: normalizeBookUrl(pickFirstString(book, ["book_url", "url"]) || pickFirstString(entry, ["book_url", "url"]), bookId)
            });
        })
        .filter(Boolean);

    return uniqueBy(books, (item) => normalizeKey(item.title));
}

function unwrapSearchBookEntry(entry) {
    if (!entry || typeof entry !== "object") {
        return {};
    }

    const nestedKeys = [
        "book_data",
        "bookData",
        "book_info",
        "bookInfo",
        "book",
        "novel",
        "item_data",
        "itemData"
    ];
    for (const key of nestedKeys) {
        if (entry[key] && typeof entry[key] === "object") {
            return entry[key];
        }
    }
    return entry;
}

function pickFirstString(source, paths) {
    for (const path of paths || []) {
        const value = getByPath(source, path);
        if (value === undefined || value === null) {
            continue;
        }
        const text = cleanText(String(value));
        if (text) {
            return text;
        }
    }
    return "";
}

function getByPath(source, path) {
    if (!source || typeof source !== "object") {
        return undefined;
    }

    return String(path || "")
        .split(".")
        .reduce((cursor, key) => (cursor == null ? undefined : cursor[key]), source);
}

function normalizeCreationStatusText(value) {
    const text = cleanText(value);
    if (!text) {
        return "";
    }
    if (text === "1") {
        return "连载中";
    }
    if (text === "2") {
        return "已完结";
    }
    return text;
}

function normalizeBookUrl(value, fallbackId = "") {
    const text = cleanText(value);
    if (text) {
        if (/^https?:\/\//i.test(text)) {
            return text;
        }
        return text.startsWith("/") ? text : `/${text}`;
    }
    return fallbackId ? `/page/${fallbackId}` : "";
}

function stripHtmlTags(value) {
    return cleanText(String(value || "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'"));
}

function parseSearchStateFromHtml(html) {
    if (!html) {
        return null;
    }

    const patterns = [
        /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\})\s*;/,
        /window\.__INITIAL_STATE__\s*=\s*JSON\.parse\('([\s\S]*?)'\)\s*;/,
        /window\.__NUXT__\s*=\s*(\{[\s\S]*?\})\s*;/
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (!match || !match[1]) {
            continue;
        }

        const candidate = match[1]
            .replace(/\\"/g, "\"")
            .replace(/\\u003C/g, "<")
            .replace(/\\u003E/g, ">");
        const parsed = safeJsonParse(candidate);
        if (parsed) {
            return parsed;
        }
    }

    return null;
}

function findSearchBookArray(node) {
    let found = [];

    const visit = (value) => {
        if (!value || found.length) {
            return;
        }
        if (Array.isArray(value)) {
            if (value.length && value.some((item) => isSearchBookLike(item))) {
                found = value;
                return;
            }
            value.forEach((item) => visit(item));
            return;
        }
        if (typeof value !== "object") {
            return;
        }
        Object.entries(value).forEach(([key, child]) => {
            if (found.length) {
                return;
            }
            if (key === "search_book_data_list" && Array.isArray(child)) {
                found = child;
                return;
            }
            visit(child);
        });
    };

    visit(node);
    return found;
}

function isSearchBookLike(item) {
    if (!item || typeof item !== "object") {
        return false;
    }

    const book = unwrapSearchBookEntry(item);
    return Boolean(
        pickFirstString(book, ["book_name", "bookName", "title", "name"])
        || pickFirstString(item, ["book_name", "bookName", "title", "name"])
    );
}

function parseSearchBooksFromHtmlMarkup(html, keyword) {
    const books = [];
    const regex = /<a[^>]+href="(\/page\/\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = regex.exec(html))) {
        const url = cleanText(match[1]);
        const inner = String(match[2] || "");
        const title = stripHtmlTags(inner);
        if (!title || !isReasonableSearchTitle(title)) {
            continue;
        }

        const nearby = html.slice(match.index, Math.min(html.length, match.index + 600));
        const intro = stripHtmlTags(nearby).replace(title, "").trim();
        books.push(normalizeBook({
            title,
            author: "",
            intro,
            category: "搜索页",
            tags: extractTags(intro),
            url
        }));
    }

    return uniqueBy(books, (item) => normalizeKey(item.title))
        .filter((item) => scoreBookForContext(item, { keyword }) >= 6);
}

function isReasonableSearchTitle(value) {
    const text = cleanText(value);
    return Boolean(
        text
        && text.length >= 2
        && text.length <= 40
        && !/登录|注册|下载|首页|作者|目录|继续阅读|立即阅读/.test(text)
    );
}

function assessTrendMatch({ keyword, genre, subgenre, categories, items, diagnostics }) {
    const scores = (items || []).map((item) => scoreBookForContext(item, { keyword, genre, subgenre }));
    const relevantCount = scores.filter((score) => score >= 8).length;
    const score = scores.reduce((sum, current) => sum + current, 0);
    const onlyGenericCategory = (categories || []).length === 1 && normalizeKey(categories[0]?.href || "") === "/rank/all";
    const usableIntroCount = Number(diagnostics?.usableIntroCount || 0) || 0;

    let shouldFallback = false;
    let reason = "";

    if (!cleanText(keyword)) {
        return {
            relevantCount,
            score,
            shouldFallback: false,
            reason: ""
        };
    }

    if (!items.length) {
        shouldFallback = true;
        reason = "rank_items_empty";
    } else if (relevantCount === 0) {
        shouldFallback = true;
        reason = "rank_keyword_unmatched";
    } else if (relevantCount < 2 && onlyGenericCategory) {
        shouldFallback = true;
        reason = "rank_match_too_weak";
    } else if (usableIntroCount === 0 && relevantCount < 3) {
        shouldFallback = true;
        reason = "rank_intro_too_weak";
    }

    return {
        relevantCount,
        score,
        shouldFallback,
        reason
    };
}

function shouldFallbackToSearch(assessment) {
    return assessment?.shouldFallback === true;
}

function scoreBookForContext(book, context = {}) {
    const terms = getContextTerms(context);
    if (!terms.length) {
        return 0;
    }

    const title = cleanText(book?.title || "");
    const intro = cleanText(book?.analysisIntro || book?.intro || "");
    const category = cleanText(book?.category || "");
    const tags = Array.isArray(book?.tags) ? book.tags.join(" ") : "";
    let score = 0;

    terms.forEach((term) => {
        if (title === term) {
            score += 18;
        } else if (title.includes(term)) {
            score += 12;
        }

        if (intro.includes(term)) {
            score += 6;
        }
        if (category.includes(term)) {
            score += 5;
        }
        if (tags.includes(term)) {
            score += 5;
        }
    });

    const aliasGroups = buildAliasGroups(terms.join(" "));
    aliasGroups.forEach((aliases) => {
        const titleHits = aliases.filter((alias) => alias && title.includes(alias)).length;
        const introHits = aliases.filter((alias) => alias && intro.includes(alias)).length;
        score += titleHits * 4 + introHits * 2;
    });

    if (isUsableIntro(intro)) {
        score += 3;
    }
    if (containsObfuscatedText(title)) {
        score -= 6;
    }
    if (containsObfuscatedText(intro)) {
        score -= 4;
    }

    return score;
}

function getContextTerms({ keyword, genre, subgenre } = {}) {
    const cleanKeyword = cleanText(keyword);
    const terms = cleanKeyword
        ? [cleanKeyword]
        : [subgenre, genre].map((item) => cleanText(item)).filter(Boolean);
    return uniqueBy(terms, (item) => normalizeKey(item));
}

function mergeTrendSources({ rankItems, searchItems, keyword, genre, subgenre, limit }) {
    const merged = new Map();
    [...(Array.isArray(rankItems) ? rankItems : []), ...(Array.isArray(searchItems) ? searchItems : [])].forEach((item) => {
        if (!item?.title) {
            return;
        }
        const key = normalizeKey(item.title);
        const existing = merged.get(key);
        if (!existing || scoreBookForContext(item, { keyword, genre, subgenre }) > scoreBookForContext(existing, { keyword, genre, subgenre })) {
            merged.set(key, item);
        }
    });

    return Array.from(merged.values())
        .sort((left, right) => {
            const rightScore = scoreBookForContext(right, { keyword, genre, subgenre });
            const leftScore = scoreBookForContext(left, { keyword, genre, subgenre });
            if (rightScore !== leftScore) {
                return rightScore - leftScore;
            }
            return cleanText(right.analysisIntro || right.intro || "").length - cleanText(left.analysisIntro || left.intro || "").length;
        })
        .slice(0, limit);
}

function parseCategoryLinks(html) {
    const links = [];
    const regex = /<a[^>]+href="(\/rank\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(html))) {
        const href = match[1];
        const text = cleanText(match[2]);
        if (!href || !text) {
            continue;
        }
        if (text.length > 12 || /规则|更多|榜单|阅读榜|新书榜|巅峰榜|排行榜/.test(text)) {
            continue;
        }
        links.push(enrichCategoryLink({ name: text, href }));
    }
    return uniqueBy(links, (item) => `${item.name}|${item.href}`);
}

function enrichCategoryLink(item) {
    const match = String(item.href || "").match(/\/rank\/(\d+)_(\d+)_([\d]+)/);
    if (!match) {
        return item;
    }
    return {
        ...item,
        gender: match[1],
        rankMold: match[2],
        categoryId: match[3]
    };
}

function pickBestCategories(categories, context) {
    const exactTerms = getContextTerms(context);

    const exactMatches = uniqueBy(
        categories.filter((item) => exactTerms.some((term) => item.name === term)),
        (item) => item.name
    );
    if (exactMatches.length) {
        return exactMatches;
    }

    const fuzzyMatches = uniqueBy(
        categories.filter((item) => exactTerms.some((term) => item.name.includes(term) || term.includes(item.name))),
        (item) => item.name
    );
    if (fuzzyMatches.length) {
        return fuzzyMatches.slice(0, 3);
    }

    const keywordText = exactTerms.join(" ");
    const aliasGroups = buildAliasGroups(keywordText);

    const scored = categories.map((item) => {
        let score = 0;
        const haystack = `${item.name} ${item.href}`;
        aliasGroups.forEach((aliases) => {
            const hits = aliases.filter((alias) => alias && haystack.includes(alias)).length;
            score += hits * 6;
        });
        if (keywordText && haystack.includes(keywordText)) {
            score += 10;
        }
        return { ...item, score };
    }).sort((a, b) => b.score - a.score);

    const picked = uniqueBy(
        scored.filter((item) => item.score > 0),
        (item) => item.name
    );
    return picked.length ? picked.slice(0, 3) : uniqueBy(scored.slice(0, 3), (item) => item.name);
}

function buildAliasGroups(text) {
    const groups = [];
    const input = String(text || "");
    const presets = {
        "年代": ["年代", "七零", "八零", "九零", "知青", "大院"],
        "古言": ["古言", "古代言情", "宫斗", "宅斗", "权谋"],
        "现言": ["现言", "现代言情", "总裁", "豪门", "婚恋"],
        "玄幻": ["玄幻", "东方玄幻", "高武", "异世"],
        "科幻": ["科幻", "赛博", "末世", "星际", "机甲"],
        "悬疑": ["悬疑", "推理", "怪谈", "规则", "刑侦"],
        "同人": ["同人", "衍生", "影视", "动漫", "原著"],
        "都市": ["都市", "职场", "娱乐圈", "神豪"],
        "女频": ["女频", "现言", "古言", "年代", "甜宠"],
        "男频": ["男频", "都市", "玄幻", "历史", "科幻"]
    };

    Object.entries(presets).forEach(([key, aliases]) => {
        if (input.includes(key)) {
            groups.push(aliases);
        }
    });

    input.split(/[\s,，、/]+/).map((part) => part.trim()).filter(Boolean).forEach((part) => {
        groups.push([part]);
    });
    return groups;
}

function parseRankBooks(html, categoryName) {
    const structured = parseStructuredBooks(html, categoryName);
    const textBooks = parseTextBooks(html, categoryName);
    if (!structured.length) {
        return textBooks;
    }
    if (!textBooks.length) {
        return structured;
    }
    return mergeBookSources(structured, textBooks);
}

function parseStructuredBooks(html, categoryName) {
    const results = [];
    const scriptRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html))) {
        const parsed = safeJsonParse(match[1]);
        walkStructuredData(parsed, (item) => {
            const title = item?.name || item?.headline || item?.title;
            const intro = item?.description || item?.summary || "";
            const author = extractAuthorName(item?.author);
            if (!title) {
                return;
            }
            results.push(normalizeBook({
                title,
                intro,
                author,
                category: categoryName,
                tags: extractTags(`${title} ${intro}`),
                url: item?.url || ""
            }));
        });
    }
    return uniqueBy(results, (item) => normalizeKey(item.title));
}

function walkStructuredData(node, visit) {
    if (!node) {
        return;
    }
    if (Array.isArray(node)) {
        node.forEach((item) => walkStructuredData(item, visit));
        return;
    }
    if (typeof node !== "object") {
        return;
    }
    if (node.name || node.headline || node.title) {
        visit(node);
    }
    Object.values(node).forEach((value) => walkStructuredData(value, visit));
}

function parseTextBooks(html, categoryName) {
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<\/(p|div|li|h\d|section|article|br)>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, "\"");

    const lines = text
        .split(/\r?\n+/)
        .map((line) => cleanText(line))
        .filter(Boolean)
        .filter((line) => !isNoiseLine(line));

    const items = [];
    for (let index = 0; index < lines.length; index += 1) {
        if (!/^在读[:：]/.test(lines[index])) {
            continue;
        }
        const title = findTitleCandidate(lines, index);
        if (!title) {
            continue;
        }
        const author = findAuthorCandidate(lines, index);
        const intro = findIntroCandidate(lines, index, title, author);
        const status = findStatusCandidate(lines, index);
        items.push(normalizeBook({
            title,
            author,
            intro,
            status,
            readingCount: lines[index].replace(/^在读[:：]\s*/, ""),
            category: categoryName,
            tags: extractTags(`${title} ${intro}`)
        }));
    }

    return uniqueBy(items, (item) => normalizeKey(item.title));
}

function findTitleCandidate(lines, index) {
    for (let offset = 4; offset <= 8; offset += 1) {
        const candidate = lines[index - offset];
        if (isLikelyTitle(candidate)) {
            return candidate;
        }
    }
    return "";
}

function findAuthorCandidate(lines, index) {
    for (let offset = 1; offset <= 4; offset += 1) {
        const candidate = lines[index - offset];
        if (candidate && !candidate.startsWith("在读") && !isLikelyTitle(candidate) && candidate.length <= 20) {
            return candidate;
        }
    }
    return "";
}

function findIntroCandidate(lines, index, title, author) {
    const fragments = [];
    for (let offset = 1; offset <= 5; offset += 1) {
        const candidate = lines[index - offset];
        if (!candidate || candidate === title || candidate === author) {
            continue;
        }
        if (candidate.length >= 18 && candidate.length <= 120 && !/^连载中|已完结$/.test(candidate)) {
            fragments.unshift(candidate);
        }
    }
    return fragments.join(" ").trim();
}

function findStatusCandidate(lines, index) {
    for (let offset = 1; offset <= 3; offset += 1) {
        const candidate = lines[index - offset];
        if (/^连载中$|^已完结$/.test(candidate)) {
            return candidate;
        }
    }
    return "";
}

function isLikelyTitle(value) {
    if (!value) {
        return false;
    }
    if (value.length < 2 || value.length > 28) {
        return false;
    }
    if (/在读|最近更新|排行榜|女频|男频|阅读榜|新书榜|巅峰榜/.test(value)) {
        return false;
    }
    return true;
}

function isNoiseLine(value) {
    return !value
        || /^\d+$/.test(value)
        || /^首页|分类|书架|我的$/.test(value)
        || /下载番茄小说/.test(value)
        || /排行榜说明|榜单规则/.test(value)
        || value.length > 140;
}

function extractAuthorName(author) {
    if (!author) {
        return "";
    }
    if (typeof author === "string") {
        return author;
    }
    if (Array.isArray(author)) {
        return extractAuthorName(author[0]);
    }
    if (typeof author === "object") {
        return author.name || author.authorName || "";
    }
    return "";
}

function extractTags(text) {
    const tags = [];
    const source = String(text || "");
    const regex = /[【\[]([^】\]]+)[】\]]|〖([^〗]+)〗/g;
    let match;
    while ((match = regex.exec(source))) {
        const value = cleanText(match[1] || match[2] || "");
        if (value) {
            tags.push(value);
        }
    }
    return uniqueBy(tags, (item) => item);
}

function normalizeBook(book) {
    return {
        title: cleanText(book.title || ""),
        author: cleanText(book.author || ""),
        intro: cleanText(book.intro || ""),
        analysisIntro: sanitizeIntroForAnalysis(book.intro || ""),
        status: cleanText(book.status || ""),
        readingCount: cleanText(book.readingCount || ""),
        category: cleanText(book.category || ""),
        tags: Array.isArray(book.tags) ? book.tags.filter(Boolean) : [],
        url: cleanText(book.url || "")
    };
}

function mergeBookSources(structured, textBooks) {
    const merged = new Map();
    const scoreBook = (item) => {
        const analysisLength = cleanText(item.analysisIntro || "").length;
        const introLength = cleanText(item.intro || "").length;
        const titlePenalty = containsObfuscatedText(item.title || "") ? 0 : 12;
        const authorBonus = item.author ? 4 : 0;
        const tagBonus = Array.isArray(item.tags) ? item.tags.length : 0;
        return analysisLength * 2 + introLength + titlePenalty + authorBonus + tagBonus;
    };

    [...structured, ...textBooks].forEach((item) => {
        const key = normalizeKey(item.title);
        if (!key) {
            return;
        }
        const existing = merged.get(key);
        if (!existing || scoreBook(item) > scoreBook(existing)) {
            merged.set(key, item);
        }
    });

    return Array.from(merged.values());
}

function buildTrendSummary({ keyword, genre, subgenre, categories, items, diagnostics }) {
    const cleanItems = items.filter((item) => isUsableIntro(item.analysisIntro || item.intro));
    const categoriesText = categories.map((item) => item.name).filter(Boolean).join("、") || "总榜";
    const hotTags = collectHotTags(cleanItems);
    const protagonistSignals = collectFrequentSignals(cleanItems, [
        "重生", "穿书", "穿越", "下乡", "知青", "大院", "军婚", "养娃", "带崽", "打脸",
        "创业", "种田", "返城", "离婚", "追妻", "团宠", "恶毒女配", "真假千金", "系统"
    ], 5);
    const conflictSignals = collectFrequentSignals(cleanItems, [
        "逆袭", "翻身", "报仇", "复仇", "救赎", "对照组", "退婚", "断亲", "分家",
        "致富", "守护", "上位", "破局", "反杀", "生存", "高考", "婚约", "身世"
    ], 5);
    const emotionSignals = collectFrequentSignals(cleanItems, [
        "爽", "甜", "宠", "虐", "燃", "温情", "治愈", "压抑", "拉扯", "悬疑"
    ], 4);
    const openingPatterns = inferOpeningPatterns(cleanItems);
    const diffSuggestions = buildDiffSuggestions({
        keyword,
        genre,
        subgenre,
        hotTags,
        protagonistSignals,
        conflictSignals
    });
    const introSamples = cleanItems
        .map((item) => limitText(item.analysisIntro || item.intro || "", 56))
        .filter(Boolean)
        .slice(0, 3);

    return [
        `本次对标关键词：${keyword || "未指定"}。`,
        `参考榜单分类：${categoriesText}。`,
        diagnostics ? `本次共抓到 ${diagnostics.totalItems} 本样本，可直接用于趋势提炼的简介有 ${diagnostics.usableIntroCount} 本，可抢救片段的简介有 ${diagnostics.salvagedIntroCount || 0} 本，书名混淆 ${diagnostics.obfuscatedTitleCount} 本。` : "",
        hotTags.length ? `当前高位常见卖点：${hotTags.join("、")}。` : "当前榜单文本里可稳定提取到的标签不多，建议继续围绕关键词补充人工判断。",
        protagonistSignals.length ? `高频主角模板信号：${protagonistSignals.join("、")}。` : "",
        conflictSignals.length ? `高频冲突发动机：${conflictSignals.join("、")}。` : "",
        emotionSignals.length ? `高频情绪抓手：${emotionSignals.join("、")}。` : "",
        openingPatterns.length ? `常见高点击开局方式：${openingPatterns.join("；")}。` : "",
        introSamples.length ? `可用简介片段样本：${introSamples.join("；")}。` : "",
        diffSuggestions.length ? `建议优先做的差异化切口：${diffSuggestions.join("；")}。` : "",
        `不要照搬榜单书名和现成剧情，更适合提炼“赛道共性 + 读者情绪需求 + 缺口打法”。`
    ].filter(Boolean).join("\n");
}

function buildTrendSourceNotes(sourceBreakdown) {
    if (!sourceBreakdown) {
        return "";
    }

    const rankInfo = sourceBreakdown.rank || {};
    const searchInfo = sourceBreakdown.search || {};

    if (searchInfo.used) {
        const sourceLabel = searchInfo.source === "search_api"
            ? "番茄搜索接口"
            : (searchInfo.source === "search_html_state" ? "搜索页状态数据" : "搜索页解析");
        return `榜单匹配偏弱，已自动补充搜索结果（来源：${sourceLabel}，补充 ${searchInfo.itemCount || 0} 个样本）。`;
    }

    if (searchInfo.attempted && !searchInfo.used) {
        const riskNote = searchInfo.challengeDetected ? " 搜索端疑似触发了风控或空响应。" : "";
        return `榜单匹配偏弱，本次已尝试番茄搜索补充，但暂未拿到可用搜索结果。${riskNote}`;
    }

    if (rankInfo.used) {
        return "本次样本主要来自番茄榜单。";
    }

    return "";
}

function buildTrendSummaryV2({ keyword, genre, subgenre, categories, items, diagnostics, sourceBreakdown = null }) {
    return buildTrendSummaryV3({ keyword, genre, subgenre, categories, items, diagnostics, sourceBreakdown });
}

function buildTrendSourceNotes(sourceBreakdown) {
    if (!sourceBreakdown) {
        return "";
    }

    const rankInfo = sourceBreakdown.rank || {};
    const searchInfo = sourceBreakdown.search || {};

    if (searchInfo.used) {
        const sourceLabel = searchInfo.source === "search_api"
            ? "番茄搜索接口"
            : (searchInfo.source === "search_html_state"
                ? "搜索页状态数据"
                : (searchInfo.source === "browser_service" ? "浏览器搜索服务" : "外部搜索补充"));
        return `榜单匹配偏弱，已自动补充搜索结果（来源：${sourceLabel}，补充 ${searchInfo.itemCount || 0} 条样本）。`;
    }

    if (searchInfo.attempted && !searchInfo.used) {
        const riskNote = searchInfo.challengeDetected ? " 搜索链路疑似触发了验证或空响应。" : "";
        return `榜单匹配偏弱，本次已尝试搜索补充，但暂时没有拿到可用搜索结果。${riskNote}`;
    }

    if (rankInfo.used) {
        return "本次样本主要来自番茄榜单。";
    }

    return "";
}
/*
    const cleanItems = items.filter((item) => isUsableIntro(item.analysisIntro || item.intro));
    const categoriesText = categories.map((item) => item.name).filter(Boolean).join("、") || "总榜";
    const hotTags = collectHotTags(cleanItems);
    const protagonistSignals = collectFrequentSignals(cleanItems, [
        "閲嶇敓", "绌夸功", "绌胯秺", "涓嬩埂", "鐭ヨ潚", "澶ч櫌", "鍐涘", "鍏诲▋", "甯﹀唇", "鎵撹劯",
        "鍒涗笟", "绉嶇敯", "杩斿煄", "绂诲", "杩藉", "鍥㈠疇", "鎭舵瘨濂抽厤", "鐪熷亣鍗冮噾", "绯荤粺"
    ], 5);
    const conflictSignals = collectFrequentSignals(cleanItems, [
        "閫嗚", "缈昏韩", "鎶ヤ粐", "澶嶄粐", "鏁戣祹", "瀵圭収缁?, "閫€濠?, "鏂翰", "鍒嗗",
        "鑷村瘜", "瀹堟姢", "涓婁綅", "鐮村眬", "鍙嶆潃", "鐢熷瓨", "楂樿€?, "濠氱害", "韬笘"
    ], 5);
    const emotionSignals = collectFrequentSignals(cleanItems, [
        "鐖?, "鐢?, "瀹?, "铏?, "鐕?, "娓╂儏", "娌绘剤", "鍘嬫姂", "鎷夋壇", "鎮枒"
    ], 4);
    const openingPatterns = inferOpeningPatterns(cleanItems);
    const diffSuggestions = buildDiffSuggestions({
        keyword,
        genre,
        subgenre,
        hotTags,
        protagonistSignals,
        conflictSignals
    });
    const introSamples = cleanItems
        .map((item) => limitText(item.analysisIntro || item.intro || "", 56))
        .filter(Boolean)
        .slice(0, 3);
    const sourceNotes = buildTrendSourceNotes(sourceBreakdown);

    return [
        `本次对标关键词：${keyword || "未指定"}。`,
        `参考入口：${categoriesText}。`,
        sourceNotes,
        diagnostics ? `本次共整理 ${diagnostics.totalItems} 个样本，可直接用于分析的简介 ${diagnostics.usableIntroCount} 个，可抢救片段 ${diagnostics.salvagedIntroCount || 0} 个，混淆书名 ${diagnostics.obfuscatedTitleCount} 个。` : "",
        hotTags.length ? `当前高频卖点：${hotTags.join("、")}。` : "当前样本文本里稳定可提取的标签不多，建议结合题材方向做人工判断。",
        protagonistSignals.length ? `高频主角模板信号：${protagonistSignals.join("、")}。` : "",
        conflictSignals.length ? `高频冲突发动机：${conflictSignals.join("、")}。` : "",
        emotionSignals.length ? `高频情绪抓手：${emotionSignals.join("、")}。` : "",
        openingPatterns.length ? `常见高点开局方式：${openingPatterns.join("；")}。` : "",
        introSamples.length ? `可用简介样本：${introSamples.join("；")}。` : "",
        diffSuggestions.length ? `建议优先做的差异化切口：${diffSuggestions.join("；")}。` : "",
        "不要照搬现成书名和剧情，更适合提炼“赛道共性 + 读者情绪 + 差异切口”。",
        (subgenre || genre) ? `当前项目题材参考：${subgenre || genre}，优先在同赛道里做升级或反差切入。` : ""
    ].filter(Boolean).join("\n");
}

*/
function buildTrendSummaryV3({ keyword, genre, subgenre, categories, items, diagnostics, sourceBreakdown = null }) {
    const cleanItems = items.filter((item) => isUsableIntro(item.analysisIntro || item.intro));
    const categoriesText = categories.map((item) => item.name).filter(Boolean).join("、") || "总榜";
    const hotTags = collectHotTags(cleanItems);
    const protagonistSignals = collectFrequentSignals(cleanItems, [
        "重生", "穿书", "穿越", "下乡", "知青", "大院", "军婚", "养娃", "带崽", "打脸",
        "创业", "种田", "返城", "离婚", "追妻", "团宠", "恶毒女配", "真假千金", "系统"
    ], 5);
    const conflictSignals = collectFrequentSignals(cleanItems, [
        "逆袭", "翻身", "报仇", "复仇", "救赎", "对照组", "退婚", "断亲", "分家",
        "致富", "守护", "上位", "破局", "反杀", "生存", "高考", "婚约", "身世"
    ], 5);
    const emotionSignals = collectFrequentSignals(cleanItems, [
        "爱", "恨", "家", "虐", "甜", "温情", "治愈", "压抑", "拉扯", "悬疑"
    ], 4);
    const openingPatterns = inferOpeningPatterns(cleanItems);
    const diffSuggestions = buildDiffSuggestions({
        keyword,
        genre,
        subgenre,
        hotTags,
        protagonistSignals,
        conflictSignals
    });
    const introSamples = cleanItems
        .map((item) => limitText(item.analysisIntro || item.intro || "", 56))
        .filter(Boolean)
        .slice(0, 3);
    const sourceNotes = buildTrendSourceNotes(sourceBreakdown);

    return [
        `本次对标关键词：${keyword || "未指定"}。`,
        `参考入口：${categoriesText}。`,
        sourceNotes,
        diagnostics ? `本次共整理 ${diagnostics.totalItems} 个样本，可直接用于分析的简介 ${diagnostics.usableIntroCount} 个，可抢救片段 ${diagnostics.salvagedIntroCount || 0} 个，混淆书名 ${diagnostics.obfuscatedTitleCount} 个。` : "",
        hotTags.length ? `当前高频卖点：${hotTags.join("、")}。` : "当前样本文本里稳定可提取的标签不多，建议继续围绕关键词做人工判断。",
        protagonistSignals.length ? `高频主角模板信号：${protagonistSignals.join("、")}。` : "",
        conflictSignals.length ? `高频冲突发动机：${conflictSignals.join("、")}。` : "",
        emotionSignals.length ? `高频情绪抓手：${emotionSignals.join("、")}。` : "",
        openingPatterns.length ? `常见高点开局方式：${openingPatterns.join("；")}。` : "",
        introSamples.length ? `可用简介样本：${introSamples.join("；")}。` : "",
        diffSuggestions.length ? `建议优先做的差异化切口：${diffSuggestions.join("；")}。` : "",
        "不要照搬现成书名和剧情，更适合提炼“赛道共性 + 读者情绪 + 差异切口”。"
    ].filter(Boolean).join("\n");
}

function buildTrendDiagnostics(items) {
    const diagnostics = {
        totalItems: items.length,
        usableIntroCount: 0,
        salvagedIntroCount: 0,
        obfuscatedTitleCount: 0,
        obfuscatedIntroCount: 0
    };

    items.forEach((item) => {
        if (containsObfuscatedText(item.title)) {
            diagnostics.obfuscatedTitleCount += 1;
        }
        if (containsObfuscatedText(item.intro)) {
            diagnostics.obfuscatedIntroCount += 1;
        }
        if (isUsableIntro(item.analysisIntro || item.intro)) {
            diagnostics.usableIntroCount += 1;
        } else if (cleanText(item.analysisIntro || "").length >= 18) {
            diagnostics.salvagedIntroCount += 1;
        }
    });

    return diagnostics;
}

function collectHotTags(items) {
    const tagCounts = new Map();
    items.forEach((item) => {
        const baseTags = Array.isArray(item.tags) ? item.tags : [];
        const merged = baseTags.concat(extractKeywordTags(item.analysisIntro || item.intro));
        merged.forEach((tag) => {
            const clean = cleanText(tag);
            if (!clean || containsObfuscatedText(clean) || clean.length > 12) {
                return;
            }
            tagCounts.set(clean, (tagCounts.get(clean) || 0) + 1);
        });
    });
    return Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag]) => tag);
}

function collectFrequentSignals(items, dictionary, limit = 5) {
    const counts = new Map();
    items.forEach((item) => {
        const text = `${item.title || ""} ${item.analysisIntro || item.intro || ""} ${item.category || ""}`;
        dictionary.forEach((token) => {
            if (text.includes(token)) {
                counts.set(token, (counts.get(token) || 0) + 1);
            }
        });
    });
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([token]) => token);
}

function inferOpeningPatterns(items) {
    const patterns = new Map();
    items.forEach((item) => {
        const intro = String(item.analysisIntro || item.intro || "");
        if (!isUsableIntro(intro)) {
            return;
        }
        if (/穿越|重生|穿书/.test(intro)) {
            patterns.set("开篇即身份切换/命运重启", (patterns.get("开篇即身份切换/命运重启") || 0) + 1);
        }
        if (/退婚|离婚|断亲|分家/.test(intro)) {
            patterns.set("开篇即关系决裂，迅速制造情绪落差", (patterns.get("开篇即关系决裂，迅速制造情绪落差") || 0) + 1);
        }
        if (/下乡|返城|大院|知青|军婚/.test(intro)) {
            patterns.set("开篇即强年代场景，让题材识别度拉满", (patterns.get("开篇即强年代场景，让题材识别度拉满") || 0) + 1);
        }
        if (/致富|创业|摆摊|美食|养娃/.test(intro)) {
            patterns.set("开篇即明确长期经营线或养成线", (patterns.get("开篇即明确长期经营线或养成线") || 0) + 1);
        }
        if (/身世|真假|秘密/.test(intro)) {
            patterns.set("开篇即抛身份悬念或秘密钩子", (patterns.get("开篇即抛身份悬念或秘密钩子") || 0) + 1);
        }
    });
    return Array.from(patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([label]) => label);
}

function buildDiffSuggestions({ keyword, genre, subgenre, hotTags, protagonistSignals, conflictSignals }) {
    const suggestions = [];
    if ((subgenre || genre || keyword).includes("年代")) {
        suggestions.push("别只做家长里短，可以把事业升级和家庭拉扯双线并行");
        suggestions.push("在年代氛围外，再加一个更强的个人秘密或身份钩子");
    }
    if (hotTags.includes("重生") || protagonistSignals.includes("重生")) {
        suggestions.push("如果继续做重生，最好换成更明确的代价机制或信息差玩法");
    }
    if (hotTags.includes("养娃") || protagonistSignals.includes("带崽")) {
        suggestions.push("亲情线可以保留，但最好叠加事业、权谋或生存压力，不要只剩温馨日常");
    }
    if (conflictSignals.includes("逆袭") || conflictSignals.includes("打脸")) {
        suggestions.push("避免纯重复打脸，改成阶段性目标升级和更强对手盘");
    }
    if (!suggestions.length) {
        suggestions.push("优先做强钩子开局，再在主角身份和长期主线里加一个明显反差点");
        suggestions.push("同赛道对标时，不要只换背景，最好换故事发动机和情绪路线");
    }
    return suggestions.slice(0, 4);
}

function extractKeywordTags(text) {
    const source = sanitizeIntroForAnalysis(text || "");
    const tokens = [
        "年代", "七零", "八零", "九零", "知青", "大院", "军婚", "养娃", "带崽", "重生",
        "穿书", "穿越", "创业", "致富", "种田", "美食", "真假千金", "恶毒女配", "团宠",
        "打脸", "逆袭", "退婚", "离婚", "复仇", "身世", "甜宠", "爽文", "悬疑", "治愈"
    ];
    return tokens.filter((token) => source.includes(token));
}

function collectApiBookTags(book) {
    const tags = [];
    const possibleLists = [
        book.tags,
        book.tagList,
        book.categoryTags,
        book.bookTags
    ];
    possibleLists.forEach((value) => {
        if (Array.isArray(value)) {
            value.forEach((item) => {
                const tag = cleanText(typeof item === "string" ? item : (item?.tagName || item?.name || ""));
                if (tag) {
                    tags.push(tag);
                }
            });
        }
    });

    [
        book.categoryName,
        book.subCategoryName,
        book.firstCategoryName,
        book.secondCategoryName
    ].forEach((value) => {
        const tag = cleanText(value || "");
        if (tag) {
            tags.push(tag);
        }
    });

    return uniqueBy(tags, (item) => item);
}

function decodeFanqieText(text) {
    const source = String(text || "");
    if (!source) {
        return "";
    }
    let decoded = "";
    for (const char of source) {
        const code = String(char.codePointAt(0));
        decoded += FANQIE_GLYPH_MAP[code] || char;
    }
    return decoded;
}

function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch (_error) {
        return null;
    }
}

function uniqueBy(items, keyFn) {
    const seen = new Set();
    const output = [];
    items.forEach((item) => {
        const key = keyFn(item);
        if (!key || seen.has(key)) {
            return;
        }
        seen.add(key);
        output.push(item);
    });
    return output;
}

function cleanText(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .trim();
}

function normalizeKey(value) {
    return cleanText(value).toLowerCase();
}

function isUsableIntro(value) {
    const text = sanitizeIntroForAnalysis(value);
    if (!text || text.length < 18) {
        return false;
    }
    if (countReadableCodepoints(text) < 12) {
        return false;
    }
    return true;
}

function sanitizeIntroForAnalysis(value) {
    return cleanText(value)
        .replace(/[\uE000-\uF8FF]/g, " ")
        .replace(/[^\u4E00-\u9FFFa-zA-Z0-9，。！？、；：“”‘’《》【】（）()\-—\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function countReadableCodepoints(value) {
    const text = String(value || "");
    const matches = text.match(/[\u4E00-\u9FFFa-zA-Z0-9]/g) || [];
    return matches.length;
}

function limitText(value, maxLength = 60) {
    const text = cleanText(value);
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength)}…`;
}

function containsObfuscatedText(value) {
    const text = String(value || "");
    if (!text) {
        return false;
    }
    const privateUseChars = text.match(/[\uE000-\uF8FF]/g) || [];
    if (privateUseChars.length >= 2) {
        return true;
    }
    const weirdGlyphs = text.match(/[-]/g) || [];
    return weirdGlyphs.length >= 2;
}
