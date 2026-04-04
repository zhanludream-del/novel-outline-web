const FANQIE_ORIGIN = "https://fanqienovel.com";
const DEFAULT_LIMIT = 10;
const FANQIE_APP_ID = "1967";
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
                let books = [];
                if (category.categoryId) {
                    books = await fetchRankCategoryBooks(category, limit);
                }
                if (!books.length) {
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
                    if (!itemMap.has(key)) {
                        itemMap.set(key, book);
                    }
                });
            }

            const items = Array.from(itemMap.values()).slice(0, limit);
            const diagnostics = buildTrendDiagnostics(items);
            const summary = buildTrendSummary({
                keyword,
                genre,
                subgenre,
                categories: categoryTargets,
                items,
                diagnostics
            });

            return json({
                ok: true,
                keyword,
                genre,
                subgenre,
                selectedCategories: categoryTargets,
                items,
                diagnostics,
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

    const response = await fetch(endpoint.toString(), {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; NovelOutlineWeb/1.0; +https://github.com/zhanludream-del/novel-outline-web)",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "Referer": new URL(category.href || "/rank/all", FANQIE_ORIGIN).toString()
        }
    });
    if (!response.ok) {
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
    const exactTerms = [context.keyword, context.subgenre, context.genre]
        .map((item) => cleanText(item))
        .filter(Boolean);

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
        hotTags.length ? `当前高位常见卖点：${hotTags.join("、")}。` : "当前榜单文本里可稳定提取到的标签不多，建议结合分类趋势理解赛道方向。",
        protagonistSignals.length ? `高频主角模板信号：${protagonistSignals.join("、")}。` : "",
        conflictSignals.length ? `高频冲突发动机：${conflictSignals.join("、")}。` : "",
        emotionSignals.length ? `高频情绪抓手：${emotionSignals.join("、")}。` : "",
        openingPatterns.length ? `常见高点击开局方式：${openingPatterns.join("；")}。` : "",
        introSamples.length ? `可用简介片段样本：${introSamples.join("；")}。` : "",
        diffSuggestions.length ? `建议优先做的差异化切口：${diffSuggestions.join("；")}。` : "",
        `不要照搬榜单书名和现成剧情，更适合提炼“赛道共性 + 读者情绪需求 + 缺口打法”。`,
        (subgenre || genre) ? `当前项目题材参考：${subgenre || genre}。请在同赛道内做升级或反差切入。` : ""
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
