const FANQIE_ORIGIN = "https://fanqienovel.com";
const DEFAULT_LIMIT = 10;

export default {
    async fetch(request) {
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

        try {
            const keyword = url.searchParams.get("keyword") || "";
            const genre = url.searchParams.get("genre") || "";
            const subgenre = url.searchParams.get("subgenre") || "";
            const limit = Math.max(5, Math.min(20, Number(url.searchParams.get("limit") || DEFAULT_LIMIT) || DEFAULT_LIMIT));

            const rankIndexHtml = await fetchHtml(`${FANQIE_ORIGIN}/rank/all`);
            const categories = parseCategoryLinks(rankIndexHtml);
            const selectedCategories = pickBestCategories(categories, { keyword, genre, subgenre }).slice(0, 3);
            const categoryTargets = selectedCategories.length
                ? selectedCategories
                : [{ name: "总榜参考", href: "/rank/all" }];

            const itemMap = new Map();
            for (const category of categoryTargets) {
                const categoryHtml = category.href === "/rank/all"
                    ? rankIndexHtml
                    : await fetchHtml(new URL(category.href, FANQIE_ORIGIN).toString());
                const books = parseRankBooks(categoryHtml, category.name).slice(0, limit);
                books.forEach((book) => {
                    if (!book.title) {
                        return;
                    }
                    const key = normalizeKey(book.title);
                    if (!itemMap.has(key)) {
                        itemMap.set(key, book);
                    }
                });
            }

            const items = Array.from(itemMap.values()).slice(0, limit);
            const summary = buildTrendSummary({
                keyword,
                genre,
                subgenre,
                categories: categoryTargets,
                items
            });

            return json({
                ok: true,
                keyword,
                genre,
                subgenre,
                selectedCategories: categoryTargets,
                items,
                summary,
                fetchedAt: new Date().toISOString()
            });
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

function json(data, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: corsHeaders()
    });
}

async function fetchHtml(url) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NovelOutlineWeb/1.0; +https://github.com/zhanludream-del/novel-outline-web)",
            "Accept-Language": "zh-CN,zh;q=0.9"
        }
    });
    if (!response.ok) {
        throw new Error(`抓取番茄榜单失败：${response.status}`);
    }
    return response.text();
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
        links.push({ name: text, href });
    }
    return uniqueBy(links, (item) => `${item.name}|${item.href}`);
}

function pickBestCategories(categories, context) {
    const keywordText = [context.keyword, context.subgenre, context.genre].filter(Boolean).join(" ");
    const aliasGroups = buildAliasGroups(keywordText);

    const scored = categories.map((item) => {
        let score = 0;
        const haystack = `${item.name} ${item.href}`;
        aliasGroups.forEach((aliases) => {
            if (aliases.some((alias) => alias && haystack.includes(alias))) {
                score += 8;
            }
        });
        if (keywordText && haystack.includes(keywordText)) {
            score += 12;
        }
        if (/女频|现言|古言|年代|悬疑|玄幻|都市|科幻|同人/.test(item.name)) {
            score += 1;
        }
        return { ...item, score };
    }).sort((a, b) => b.score - a.score);

    const picked = scored.filter((item) => item.score > 0);
    return picked.length ? picked : scored.slice(0, 3);
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
    if (structured.length) {
        return structured;
    }
    return parseTextBooks(html, categoryName);
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
    for (let offset = 1; offset <= 5; offset += 1) {
        const candidate = lines[index - offset];
        if (!candidate || candidate === title || candidate === author) {
            continue;
        }
        if (candidate.length >= 18 && candidate.length <= 120 && !/^连载中|已完结$/.test(candidate)) {
            return candidate;
        }
    }
    return "";
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
        status: cleanText(book.status || ""),
        readingCount: cleanText(book.readingCount || ""),
        category: cleanText(book.category || ""),
        tags: Array.isArray(book.tags) ? book.tags.filter(Boolean) : [],
        url: cleanText(book.url || "")
    };
}

function buildTrendSummary({ keyword, genre, subgenre, categories, items }) {
    const titles = items.slice(0, 8).map((item) => item.title).filter(Boolean);
    const categoriesText = categories.map((item) => item.name).filter(Boolean).join("、") || "总榜";
    const tagCounts = new Map();
    items.forEach((item) => {
        (item.tags || []).forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
    });
    const hotTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag]) => tag);

    return [
        `本次对标关键词：${keyword || "未指定"}。`,
        `参考榜单分类：${categoriesText}。`,
        titles.length ? `高位样本书名：${titles.join("、")}。` : "本次没有抓到足够多的样本书名。",
        hotTags.length ? `高频标签/卖点：${hotTags.join("、")}。` : "",
        `请提炼这些高位作品的共同钩子、冲突发动机和读者情绪抓手，但不要直接照搬书名、设定或剧情。`,
        (subgenre || genre) ? `当前项目题材参考：${subgenre || genre}。脑洞需要结合这个方向做对标和差异化。` : ""
    ].filter(Boolean).join("\n");
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
