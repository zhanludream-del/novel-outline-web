class NovelGenerator {
    constructor(apiClient) {
        this.api = apiClient;
    }

    getConfiguredMaxTokens(fallback = DEFAULT_API_CONFIG.maxTokens) {
        const configured = Number(this.api?.getConfig?.().maxTokens ?? fallback ?? DEFAULT_API_CONFIG.maxTokens);
        return Number.isFinite(configured) && configured > 0
            ? Math.round(configured)
            : DEFAULT_API_CONFIG.maxTokens;
    }

    getConfiguredTimeoutMs(fallback = DEFAULT_API_CONFIG.timeoutMs) {
        const configured = Number(this.api?.getConfig?.().timeoutMs ?? fallback ?? DEFAULT_API_CONFIG.timeoutMs);
        return Number.isFinite(configured) && configured > 0
            ? Math.round(configured)
            : DEFAULT_API_CONFIG.timeoutMs;
    }

    getTaskTimeoutMs(fallback = DEFAULT_API_CONFIG.timeoutMs) {
        return Math.max(this.getConfiguredTimeoutMs(fallback), fallback);
    }

    getGenreDefinition(genre) {
        if (!genre || !NOVEL_GENRES || typeof NOVEL_GENRES !== "object") {
            return null;
        }
        return NOVEL_GENRES[genre] || null;
    }

    buildGenreConstraint(genre, subgenre) {
        const genreInfo = this.getGenreDefinition(genre);
        if (!genreInfo) {
            return "";
        }

        return [
            "銆愰鏉愮害鏉熴€?,
            genreInfo.description ? `棰樻潗璇存槑锛?{genreInfo.description}` : "",
            `1. 涓ユ牸闄愬畾涓?{genre}棰樻潗${subgenre ? `锛屽叿浣撳瓙棰樻潗涓?{subgenre}` : ""}銆俙,
            `2. 鍏佽鐨勫厓绱狅細${(genreInfo.allowed || []).join("锛?) || "鏃?}`,
            `3. 绂佹鐨勫厓绱狅細${(genreInfo.forbidden || []).join("锛?) || "鏃?}`,
            `4. 鍒涗綔椋庢牸搴旂鍚?{genre}棰樻潗鐗瑰緛锛岃瑷€椋庢牸瑕佷笌棰樻潗鍖归厤銆俙
        ].filter(Boolean).join("\n");
    }

    async generateStoryIdeas({
        keyword,
        extraNote,
        marketTrendSummary,
        marketTrendItems,
        versionCount = 4
    }) {
        const safeCount = Math.min(5, Math.max(3, Number(versionCount || 4) || 4));
        const systemPrompt = [
            "你是资深网文选题策划编辑，负责输出可连载、可商业化、差异明显的小说脑洞方案。",
            "这是独立的选题发散任务，不是续写当前项目。",
            "",
            "硬性要求：",
            `1. 必须输出 ${safeCount} 个版本，格式只能是 JSON 数组。`,
            "2. 每个版本都要明显不同，不能只是换皮。",
            "3. 差异至少来自主角身份、核心能力、冲突发动机、情绪方向、世界规则中的三个以上。",
            "4. 不要沿用当前项目已经存在的人名、旧剧情、旧设定、旧世界观，除非用户在补充要求里明确要求保留。",
            "5. 不要吃当前项目题材、子题材、主题、故事概念，只围绕关键词、补充要求和榜单趋势发散。",
            "6. 不写正文，不写细纲，不写章节列表，只做选题方案。",
            "7. 每个方案都要能支撑长篇连载，前30章有爆点，中后期有升级空间。",
            "",
            "每个版本必须包含这些字段：",
            "id: 唯一ID，例如 idea_1",
            "title: 方案标题",
            "positioning: 题材定位与读者方向",
            "hook: 一句话故事钩子",
            "core_setup: 核心设定",
            "conflict_engine: 核心冲突与剧情发动机",
            "selling_points: 爽点或情绪点设计",
            "world_highlights: 适配世界观与前30章名场面",
            "longline: 长线展开与升级空间",
            "relationship_notes: 人物关系与感情线建议",
            "seed_summary: 150到250字的浓缩版故事方案",
            "",
            "输出要求：",
            "1. 只能返回 JSON 数组，不要返回 markdown、说明文字或代码块。",
            "2. 全部字段都用中文填写，内容具体可写。",
            "3. seed_summary 要像创作输入，不要写成分析报告口吻。"
        ].filter(Boolean).join("\n");

        const marketSamples = Array.isArray(marketTrendItems) && marketTrendItems.length
            ? marketTrendItems.slice(0, 12).map((item, index) => {
                const safeTitle = this.containsObfuscatedText(item.title || "") ? "书名已混淆" : (item.title || "未命名");
                const cleanedIntro = String(item.analysisIntro || item.intro || "").trim();
                const safeIntro = this.containsObfuscatedText(cleanedIntro) ? "" : this.limitContext(cleanedIntro, 100);
                const tags = Array.isArray(item.tags)
                    ? item.tags.filter((tag) => !this.containsObfuscatedText(tag || "")).join("、")
                    : "";
                return [
                    `${index + 1}. ${safeTitle} / ${item.author || "未知作者"}`,
                    item.category ? `分类：${item.category}` : "",
                    tags ? `标签：${tags}` : "",
                    safeIntro ? `简介：${safeIntro}` : "",
                    item.readingCount ? `在读：${item.readingCount}` : ""
                ].filter(Boolean).join(" | ");
            }).join("\n")
            : "";

        const userPrompt = [
            `主题关键词：${keyword || "未提供"}`,
            marketTrendSummary ? `当前番茄榜摘要：\n${this.limitContext(marketTrendSummary, 2200)}` : "",
            marketSamples ? `榜单样本：\n${marketSamples}` : "",
            extraNote ? `用户补充要求：${this.limitContext(extraNote, 800)}` : "",
            "",
            "请围绕这个关键词输出多个差异明显的故事脑洞版本。",
            "不要吸收当前项目已经写过的剧情摘要，不要沿用现有人名、旧设定、旧世界观。",
            "把这次当成全新的选题发散，只允许参考关键词、补充要求和榜单趋势。",
            "每个版本都必须可写、可连载、可持续制造爽点。",
            marketTrendSummary ? "如果给了榜单摘要，请提炼高位作品的共同卖点与缺口，做出对标但不照抄的方案。" : ""
        ].filter(Boolean).join("\n");

        const parsed = await this.requestJSONArray(systemPrompt, userPrompt, {
            temperature: 0.9,
            maxTokens: this.getConfiguredMaxTokens(12000)
        });

        return parsed.slice(0, safeCount).map((item, index) => ({
            id: item.id || `idea_${index + 1}`,
            title: item.title || `【${keyword || "主题"}】方案 ${index + 1}`,
            positioning: item.positioning || "",
            hook: item.hook || "",
            core_setup: item.core_setup || "",
            conflict_engine: item.conflict_engine || "",
            selling_points: item.selling_points || "",
            world_highlights: item.world_highlights || "",
            longline: item.longline || "",
            relationship_notes: item.relationship_notes || "",
            seed_summary: item.seed_summary || ""
        }));
    }

    containsObfuscatedText(value) {
        const text = String(value || "");
        if (!text) {
            return false;
        }
        const privateUseChars = text.match(/[\uE000-\uF8FF]/g) || [];
        if (privateUseChars.length >= 2) {
            return true;
        }
        const weirdGlyphs = text.match(/[類€-羁縘/g) || [];
        return weirdGlyphs.length >= 2;
    }

    async generateWorldbuilding({ title, concept, genre, subgenre, theme }) {
        const genreConstraint = this.buildGenreConstraint(genre, subgenre || genre);
        const systemPrompt = [
            genreConstraint,
            "浣犳槸涓栫晫涔︽瀯寤轰笓瀹垛€滈粯榛樷€濓紝涓€浣嶈祫娣辩綉鏂囩瓥鍒掔紪杈戯紝鎿呴暱鏋勫缓瀹忓ぇ涓斿瘜鏈夊垱鎰忕殑涓栫晫瑙傝瀹氥€?,
            "璇锋牴鎹敤鎴锋彁渚涚殑涓栫晫瑙傚厓绱犲拰鏁呬簨姒傚康锛岀敓鎴愪竴娈靛畬鏁寸殑涓栫晫瑙傝瀹氭弿杩般€?,
            "",
            "銆愯緭鍑烘牸寮忚姹傘€?,
            "杈撳嚭涓€娈佃繛璐殑涓栫晫瑙傛弿杩版枃瀛楋紙200-350瀛楋級锛屽寘鍚互涓嬭绱狅細",
            "1. 涓栫晫鑳屾櫙璁惧畾锛堟椂浠ｃ€佸湴鐐广€佸熀鏈鍒欙級",
            "2. 鏍稿績鑳介噺/淇偧浣撶郴",
            "3. 涓昏鍔垮姏鎴栫粍缁?,
            "4. 鐗规畩璁惧畾锛堢郴缁熴€侀噾鎵嬫寚绛夛級",
            "5. 鏍稿績鍐茬獊鎴栫煕鐩?,
            "",
            "銆愬唴瀹归鏍奸搧寰嬨€?,
            "- 绠€鍗曟槗鎳傘€佺洿鐧姐€佸彛璇寲",
            "- 鍍忚鏁呬簨涓€鏍锋弿杩帮紝涓嶈鐢ㄨ鏂囧紡璇█",
            "- 绂佹浣跨敤鏅︽订銆佹娊璞＄殑璇嶆眹",
            "- 鐩存帴杈撳嚭涓栫晫瑙傛弿杩帮紝涓嶈浠讳綍鏍囬銆佹爣璁版垨棰濆璇存槑"
        ].filter(Boolean).join("\n");

        const userPrompt = [
            `灏忚鏍囬锛氥€?{title || "鏈懡鍚嶅皬璇?}銆媊,
            `棰樻潗锛?{subgenre || genre || "鏈寚瀹?}`,
            `鏍稿績涓婚锛?{theme || "鏈寚瀹?}`,
            "",
            "銆愭晠浜嬫蹇点€?,
            concept || "鏆傛棤",
            "",
            "璇锋牴鎹互涓婁俊鎭紝鐢熸垚涓€娈靛畬鏁寸殑涓栫晫瑙傝瀹氭弿杩帮紙200-350瀛楋級锛岃姹傚唴瀹瑰厖瀹炪€佸眰娆′赴瀵屻€侀€昏緫娓呮櫚銆?
        ].filter(Boolean).join("\n");

        return (await this.api.callLLM(userPrompt, systemPrompt, {
            temperature: 0.75,
            maxTokens: this.getConfiguredMaxTokens(1800)
        })).trim();
    }

    async generateVolumeSynopsis({ project, title, concept, genre, theme, worldbuilding, volumeCount, chaptersPerVolume, subgenre }) {
        const genreConstraint = this.buildGenreConstraint(genre, subgenre || genre);
        const innovationPrompt = this.buildVolumeInnovationPrompt(project, concept, worldbuilding);
        const systemPrompt = [
            genreConstraint,
            `浣犳槸涓栫晫涔︽瀯寤轰笓瀹垛€滈粯榛樷€濓紝涓€浣嶈祫娣辩綉鏂囩瓥鍒掔紪杈戯紝鎿呴暱鏋勫缓瀹忓ぇ涓斿瘜鏈夊垱鎰忕殑鏁呬簨鏋舵瀯銆俙,
            `璇锋牴鎹敤鎴锋彁渚涚殑涓栫晫瑙傚厓绱犲拰鏁呬簨姒傚康锛岃鍒掍竴閮?{volumeCount}鍗风殑缃戠粶灏忚鐨勫嵎姒傝銆俙,
            "",
            "銆愬唴瀹归鏍奸搧寰嬨€?,
            "浣犵殑鎵€鏈夎緭鍑洪兘蹇呴』绠€鍗曟槗鎳傘€佺洿鐧姐€佸彛璇寲銆傝鍍忎竴涓紭绉€鐨勬晠浜嬪憳瀵规湅鍙嬭鏁呬簨涓€鏍凤紝鑰屼笉鏄竴涓鑰呭湪鍐欒鏂囥€傜粷瀵圭姝娇鐢ㄤ换浣曟櫐娑┿€佹娊璞°€佹嫍鍙ｆ垨鈥滈珮姒傚康鈥濈殑璇嶆眹鍜屽彞瀛愩€?,
            "",
            "銆愬垱鎰忚璁″師鍒欍€?,
            "1. 浣跨敤鍒嗘敮鑺傜偣鎬濈淮锛氭瘡鍗烽兘鏄竴涓叧閿殑鈥滄晠浜嬭妭鐐光€濓紝浠ｈ〃鏁呬簨涓殑閲嶈杞姌鐐?,
            "2. 璁剧疆鏄庣‘鐨勮鑹茬洰鏍囧拰鍔ㄦ満锛氭棤璁哄墽鎯呭浣曞彂灞曪紝涓昏閮芥湁娓呮櫚鐨勯暱鏈熺洰鏍?,
            "3. 鍒╃敤涓栫晫璁惧畾浣滀负鏁呬簨妗嗘灦锛氶噸瑕佸湴鐐广€佷簨浠跺拰娼滃湪鍐茬獊瑕佽疮绌垮缁?,
            "4. 璁捐琚姩鍝嶅簲鑰岄潪涓诲鍙欎簨锛氳璇昏€呮劅瑙変粬浠湪璺熼殢鏁呬簨锛屽悓鏃舵晠浜嬭嚜鐒跺紩瀵?,
            "",
            "銆愬鍒嗘敮鍓ф儏璁捐銆?,
            "- 姣忓嵎蹇呴』鍖呭惈涓荤嚎鍓ф儏鍜岃嚦灏戜竴鏉℃綔鍦ㄦ敮绾?,
            "- 涓荤嚎鏄帹鍔ㄦ晠浜嬪墠杩涚殑鏍稿績浜嬩欢",
            "- 鏀嚎鏄赴瀵屼笘鐣岃銆佹繁鍖栦汉鐗╃殑杈呭姪鍓ф儏",
            "- 鍚勫嵎涔嬮棿瑕佹湁鈥滈挬瀛愨€濃€斺€斿墠涓€鍗峰煁涓嬬殑浼忕瑪鍦ㄥ悗缁嵎涓彮鏅?,
            "",
            "銆愭瘡鍗风粨灞€鎸囦护锛堝繀椤讳弗鏍兼墽琛岋級銆?,
            `1. 闈炴渶缁堝嵎锛堢1鍗峰埌绗?{Math.max(1, volumeCount - 1)}鍗凤級锛氭瘡鍗风粨灏惧繀椤昏缃己鎮康閽╁瓙锛屽紩鍑轰笅涓€鍗风殑鏂板啿绐乣,
            "- 鍗锋湯蹇呴』鍑虹幇锛氭柊鐨勬晫浜?鏂扮殑绉樺瘑/鏂扮殑鐩爣/鏂扮殑鍦扮偣/鏂扮殑浜虹墿",
            "- 绂佹鏅€氱粨灏撅紝绂佹鈥滄晠浜嬪憡涓€娈佃惤鈥濈殑鎰熻",
            "- 蹇呴』璁╄鑰呭己鐑堟湡寰呬笅涓€鍗风殑鍐呭",
            `2. 鏈€缁堝嵎锛堢${volumeCount}鍗凤級锛氬繀椤绘槸鐪熸鐨勫ぇ缁撳眬`,
            "- 瑙ｅ喅鎵€鏈変富瑕佹偓蹇靛拰浼忕瑪",
            "- 涓昏瀹屾垚鏈€缁堢洰鏍囨垨鑾峰緱鏈€缁堟垚闀?,
            "- 缁欎簣璇昏€呮弧瓒虫劅鍜屽畬鏁存劅锛屽彲浠ユ湁寮€鏀惧紡浣欓煹锛屼絾涓嶈兘鏄€滃緟缁€?,
            "",
            "銆愯緭鍑鸿姹傘€?,
            "1. 杈撳嚭蹇呴』鏄?JSON 鏁扮粍锛屼笉瑕佽緭鍑轰换浣曢澶栬鏄庢垨 markdown 鏍囪",
            "2. 姣忓嵎蹇呴』浣撶幇鐩爣銆佸洶闅俱€佽浆鎶樸€侀珮娼拰鍗锋湯閽╁瓙",
            "3. 鍚勫嵎涔嬮棿瑕佹湁鏄庣‘鐨勫墽鎯呴€掕繘鍏崇郴锛屼綋鐜扳€滈摵鍨?鍐茬獊-楂樻疆-缂撳拰-鏂板啿绐佲€濈殑鑺傚",
            "4. 缁濆涓嶈兘鏈夐噸澶嶇殑鍓ф儏鍏冪礌",
            "5. 涓嶈兘鍑虹幇閫昏緫婕忔礊锛堝瑙掕壊姝昏€屽鐢熴€佽兘鍔涘拷楂樺拷浣庛€佹椂闂寸嚎娣蜂贡绛夛級"
        ].filter(Boolean).join("\n");

        const userPrompt = [
            `灏忚鏍囬锛氥€?{title || "鏈懡鍚嶅皬璇?}銆媊,
            `棰樻潗锛?{subgenre || genre || "鏈寚瀹?}`,
            `鏍稿績涓婚锛?{theme || "鏈寚瀹?}`,
            `鏁呬簨姒傚康锛?{concept || "鏆傛棤"}`,
            `璁″垝鍗锋暟锛?{volumeCount}`,
            `姣忓嵎璁″垝绔犺妭鏁帮細${chaptersPerVolume}`,
            `涓栫晫瑙傦細${worldbuilding || "鏆傛棤"}`,
            innovationPrompt ? `銆愬弽濂楄矾涓庡垱鏂板缓璁€慭n${innovationPrompt}` : "",
            "",
            "璇疯緭鍑?JSON 鏁扮粍锛屾瘡涓璞″寘鍚細",
            "volume_number: 鍗峰簭鍙?,
            "title: 鍗峰悕",
            "summary: 鏈嵎 150-250 瀛楀墽鎯呮瑕侊紝鍔″繀鍖呭惈涓荤嚎鍜岃嚦灏戜竴鏉℃敮绾匡紝骞惰鏄庝富瑙掔洰鏍囥€佸洶闅俱€佸叧閿浆鎶樸€佹垚闀挎垨鏂颁俊鎭?,
            "cliffhanger: 鍗锋湯閽╁瓙锛屼竴鍙ヨ瘽",
            "",
            "涓嶈杈撳嚭 JSON 涔嬪鐨勮鏄庛€?
        ].join("\n");

        const parsed = await this.requestJSONArray(systemPrompt, userPrompt, {
            temperature: 0.72,
            maxTokens: this.getConfiguredMaxTokens(6000)
        });

        return parsed.map((item, index) => ({
            volume_number: Number(item.volume_number || index + 1),
            title: item.title || `绗?{index + 1}鍗穈,
            summary: item.summary || "",
            cliffhanger: item.cliffhanger || ""
        }));
    }

    async generateChapterSynopsis({
        project,
        title,
        concept,
        genre,
        subgenre,
        worldbuilding,
        volumeNumber,
        chapterCount,
        volumeSummary,
        existingSynopsis
    }) {
        const genreConstraint = this.buildGenreConstraint(
            genre,
            subgenre || project?.outline?.subgenre || project?.subgenre || genre
        );
        const promptContext = this.buildDesktopSynopsisPromptContext({
            project,
            concept,
            volumeSummary,
            existingSynopsis,
            volumeNumber,
            chapterCount
        });
        const systemPrompt = this.buildDesktopSynopsisSystemPrompt({
            genreConstraint,
            chapterCount,
            lockedNamesTable: promptContext.lockedNamesTable
        });
        const userPrompt = this.buildDesktopSynopsisUserPrompt({
            title,
            genre,
            subgenre,
            worldbuilding,
            volumeNumber,
            chapterCount,
            concept,
            volumeSummary,
            existingSynopsis,
            ...promptContext
        });

        const raw = await this.api.callLLM(userPrompt, systemPrompt, {
            temperature: 0.72,
            maxTokens: this.getConfiguredMaxTokens(8000)
        });

        const parsed = this.parseChapterSynopsisLines(raw, chapterCount);
        return await this.ensureChapterSynopsisCount({
            project,
            title,
            concept,
            genre,
            subgenre,
            worldbuilding,
            volumeNumber,
            chapterCount,
            volumeSummary,
            existingSynopsis,
            systemPrompt,
            parsedSynopsis: parsed
        });
    }

    parseChapterSynopsisLines(rawText, chapterCount = 0) {
        const lines = String(rawText || "")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.replace(/^[\-鈥?]\s*/, ""))
            .filter((line) => /绗琝s*\d+\s*绔?.test(line));

        const parsed = [];
        lines.forEach((line, index) => {
            const match = line.match(/^绗琝s*(\d+)\s*绔燵锛?銆?\-锛?]?\s*(.+?)\s*[鈥擻-锛嶁€揮\s*(.+)$/);
            if (match) {
                const chapterNumber = Number(match[1] || index + 1);
                const title = String(match[2] || "").trim();
                const synopsis = String(match[3] || "").trim();
                parsed.push({
                    chapter_number: chapterNumber,
                    title: title || `绗?{chapterNumber}绔燻,
                    key_event: synopsis,
                    emotion_curve: "",
                    synopsis,
                    line: `绗?{chapterNumber}绔狅細${title || `绗?{chapterNumber}绔燻} - ${synopsis}`
                });
                return;
            }

            const fallback = line.match(/^绗琝s*(\d+)\s*绔燵锛?銆?\-锛?]?\s*(.+)$/);
            if (fallback) {
                const chapterNumber = Number(fallback[1] || index + 1);
                const content = String(fallback[2] || "").trim();
                const parts = content.split(/\s*[鈥擻-锛嶁€揮\s*/);
                const title = String(parts.shift() || `绗?{chapterNumber}绔燻).trim();
                const synopsis = String(parts.join(" - ") || content).trim();
                parsed.push({
                    chapter_number: chapterNumber,
                    title,
                    key_event: synopsis,
                    emotion_curve: "",
                    synopsis,
                    line: `绗?{chapterNumber}绔狅細${title} - ${synopsis}`
                });
            }
        });

        if (!parsed.length) {
            throw new Error("AI 娌℃湁鎸夌粏绾叉牸寮忚繑鍥炲唴瀹广€?);
        }

        const targetCount = Math.max(0, Number(chapterCount || 0));
        const normalizedSynopsisItems = parsed.map((item, index) => this.buildNormalizedSynopsisItem(item, Number(item.chapter_number || index + 1)));
        return this.normalizeChapterSynopsisSequence(normalizedSynopsisItems, targetCount);
        return (targetCount ? parsed.slice(0, targetCount) : parsed).map((item, index) => ({
            ...item,
            chapter_number: Number(item.chapter_number || index + 1),
            title: item.title || `绗?{Number(item.chapter_number || index + 1)}绔燻,
            synopsis: item.synopsis || item.key_event || "",
            key_event: item.key_event || item.synopsis || "",
            line: item.line || `绗?{Number(item.chapter_number || index + 1)}绔狅細${item.title || `绗?{Number(item.chapter_number || index + 1)}绔燻} - ${item.synopsis || item.key_event || ""}`
        }));
    }

    buildNormalizedSynopsisItem(item, chapterNumber) {
        const normalizedChapterNumber = Number(chapterNumber || item?.chapter_number || 1);
        const title = String(item?.title || `绗?{normalizedChapterNumber}绔燻).trim() || `绗?{normalizedChapterNumber}绔燻;
        const synopsis = String(item?.synopsis || item?.key_event || "").trim();
        return {
            ...item,
            chapter_number: normalizedChapterNumber,
            title,
            synopsis,
            key_event: synopsis,
            line: `绗?{normalizedChapterNumber}绔狅細${title} - ${synopsis}`
        };
    }

    normalizeChapterSynopsisSequence(items, chapterCount = 0) {
        const targetCount = Math.max(0, Number(chapterCount || 0));
        if (!targetCount) {
            return (items || []).map((item, index) => this.buildNormalizedSynopsisItem(item, Number(item.chapter_number || index + 1)));
        }

        const normalizedItems = (items || []).map((item, index) =>
            this.buildNormalizedSynopsisItem(item, Number(item.chapter_number || index + 1))
        );
        const assigned = new Map();
        const leftovers = [];

        normalizedItems.forEach((item) => {
            const chapterNumber = Number(item.chapter_number || 0);
            if (chapterNumber >= 1 && chapterNumber <= targetCount && !assigned.has(chapterNumber)) {
                assigned.set(chapterNumber, item);
            } else {
                leftovers.push(item);
            }
        });

        for (let chapterNumber = 1; chapterNumber <= targetCount && leftovers.length; chapterNumber += 1) {
            if (!assigned.has(chapterNumber)) {
                assigned.set(chapterNumber, this.buildNormalizedSynopsisItem(leftovers.shift(), chapterNumber));
            }
        }

        const result = [];
        for (let chapterNumber = 1; chapterNumber <= targetCount; chapterNumber += 1) {
            if (assigned.has(chapterNumber)) {
                result.push(this.buildNormalizedSynopsisItem(assigned.get(chapterNumber), chapterNumber));
            }
        }
        return result;
    }

    getMissingChapterNumbers(items, chapterCount = 0) {
        const targetCount = Math.max(0, Number(chapterCount || 0));
        const existing = new Set((items || []).map((item) => Number(item.chapter_number || 0)).filter(Boolean));
        const missing = [];
        for (let chapterNumber = 1; chapterNumber <= targetCount; chapterNumber += 1) {
            if (!existing.has(chapterNumber)) {
                missing.push(chapterNumber);
            }
        }
        return missing;
    }

    async ensureChapterSynopsisCount({
        project,
        title,
        concept,
        genre,
        subgenre,
        worldbuilding,
        volumeNumber,
        chapterCount,
        volumeSummary,
        existingSynopsis,
        systemPrompt,
        parsedSynopsis
    }) {
        const targetCount = Math.max(0, Number(chapterCount || 0));
        let synopsisItems = this.normalizeChapterSynopsisSequence(parsedSynopsis || [], targetCount);
        if (!targetCount) {
            return synopsisItems;
        }

        let missingNumbers = this.getMissingChapterNumbers(synopsisItems, targetCount);
        if (!missingNumbers.length) {
            return synopsisItems;
        }

        const promptContext = this.buildDesktopSynopsisPromptContext({
            project,
            concept,
            volumeSummary,
            existingSynopsis,
            volumeNumber,
            chapterCount: targetCount
        });

        for (let round = 0; round < 2 && missingNumbers.length; round += 1) {
            const knownLines = synopsisItems
                .sort((a, b) => Number(a.chapter_number || 0) - Number(b.chapter_number || 0))
                .map((item) => item.line)
                .join("\n");

            const repairPrompt = this.buildDesktopSynopsisRepairPrompt({
                title,
                genre,
                subgenre,
                worldbuilding,
                concept,
                volumeNumber,
                chapterCount: targetCount,
                volumeSummary,
                existingSynopsis,
                knownLines,
                missingNumbers,
                ...promptContext
            });

            const repairedRaw = await this.api.callLLM(repairPrompt, systemPrompt, {
                temperature: 0.55,
                maxTokens: this.getConfiguredMaxTokens(6000)
            });

            const repairedParsed = this.parseChapterSynopsisLines(repairedRaw, missingNumbers.length);
            const repairedAligned = missingNumbers
                .map((chapterNumber, index) => this.buildNormalizedSynopsisItem(repairedParsed[index] || {}, chapterNumber))
                .filter((item) => item.synopsis);

            synopsisItems = this.normalizeChapterSynopsisSequence([...synopsisItems, ...repairedAligned], targetCount);
            missingNumbers = this.getMissingChapterNumbers(synopsisItems, targetCount);
        }

        if (missingNumbers.length) {
            throw new Error(`绔犺妭缁嗙翰鏁伴噺涓嶈冻锛氳姹?${targetCount} 绔狅紝缂哄皯 ${missingNumbers.map((num) => `绗?{num}绔燻).join("銆?)}銆俙);
        }

        return synopsisItems;
    }

    async generateChapterOutlinesBatch({ project, volume, volumeNumber, startChapter, endChapter, existingChapters }) {
        const existingSummary = this.buildOutlineFrontContext(project, volumeNumber, startChapter, existingChapters);
        const existingEventsContext = this.buildExistingOutlineEventsContext(project, volumeNumber, startChapter, existingChapters);

        const characterDigest = this.buildRelevantCharactersInfo(project.outline.characters || []);
        const guardContext = this.buildGenerationGuards(project, volumeNumber, startChapter);
        const storyStateSummary = this.buildStoryStateSummary(project, volumeNumber, startChapter);
        const setupContinuityGuard = this.buildSetupContinuityGuard(project, volumeNumber, startChapter);
        const consistencyContext = this.buildCharacterConsistencyContext(
            project,
            `${volume.summary || ""}\n${volume.chapterSynopsis || volume.chapter_synopsis || ""}`,
            startChapter
        );
        const outlineSlice = this.extractCurrentVolumeOutlineContext(project, volumeNumber);
        const detailedOutlineContext = this.limitContext(
            outlineSlice.currentOutline || project.outline.detailed_outline || "",
            5000
        );
        const volumeSynopsisContext = this.buildVolumeSynopsisContext(project, volumeNumber);
        const allChapterSynopsisContext = this.buildAllChapterSynopsisContext(project, volumeNumber);
        const plotUnitContext = this.buildPlotUnitContext(startChapter, endChapter);
        const plotUnitReport = this.buildPlotUnitTrackerReport(project, volumeNumber, startChapter);
        const plotUnitSuggestions = this.buildPlotUnitSuggestionText(project, volumeNumber, startChapter);

        const systemPrompt = [
            "浣犳槸涓€涓墽琛屽姏鏋佸己鐨勭綉鏂囦富缂栧姪鎵嬨€?,
            "浣犵殑鍞竴浠诲姟鏄皢鐢ㄦ埛鎻愪緵鐨勩€愯缁嗙粏绾层€戣浆鍖栦负鏍囧噯鏍煎紡鐨勭珷鑺傚ぇ绾层€?,
            "涓嶈鑷繁缂栵紒涓嶈鑷繁缂栵紒涓ユ牸鐓х潃缁嗙翰鍐欙紒",
            "蹇呴』 100% 涓ユ牸鎸夌収缁嗙翰鍐呭杩涜鎵╁厖锛屼弗绂佸亸绂诲師瀹氬墽鎯呰蛋鍚戙€?,
            "濡傛灉缁嗙翰宸茬粡缁欏嚭鏌愮珷鍙戠敓浠€涔堬紝灏卞繀椤诲啓浠€涔堬紱濡傛灉鏌愮珷鑺備俊鎭緝灏戯紝涔熷繀椤昏ˉ婊℃墍鏈夊瓧娈碉紝浣嗕笉鑳芥敼涓荤嚎缁撴灉銆?,
            "蹇呴』涓ユ牸閬靛畧褰撳墠鍗疯竟鐣岋紝涓嶅緱鎻愬墠涓插嵎锛屼笉寰楁搮鑷敼鍐欎富绾裤€?,
            "缁啓蹇呴』绱ф帴鍓嶆枃鏈€鍚庝竴绔犵殑鍓ф儏鍙戝睍锛屼笉鑳借烦璺冦€佷笉鑳介噸澶嶃€佷笉鑳藉洖閫€銆?,
            "濡傛灉鍓嶆枃澶х翰瀛樺湪鐭涚浘銆佷笉鍚堢悊鎴栬妭濂忓け褰擄紝浣犺鍦ㄦ柊绔犵翰閲岃嚜鐒朵慨椤猴紝浣嗕笉鑳芥敼鎺夋棦瀹氫富绾跨粨鏋溿€?,
            "姣忔壒鐢熸垚鐨勭涓€绔狅紝蹇呴』鐩存帴鎵挎帴鍓嶆枃鏈€鍚庝竴绔犵殑銆愪笅绔犻摵鍨€戜笌鎯呯华灏捐皟銆?,
            startChapter <= 1 ? "濡傛灉褰撳墠鏄嵎棣栵紝蹇呴』杩呴€熷垏鍏ユ湰鍗锋柊涓婚涓庢柊姘旇薄锛屼笉瑕侀噸澶嶄笂涓€鍗风殑绾犺憶銆? : "",
            "涓栫晫瑙傝瀹氫笉鍙繚鍙嶏紝瑙掕壊琛屼负蹇呴』绗﹀悎宸插缓绔嬬殑浜鸿涓庡叧绯汇€?,
            guardContext,
            consistencyContext
        ].filter(Boolean).join("\n\n");

        const userPrompt = [
            detailedOutlineContext ? `銆愯缁嗗ぇ绾诧紙蹇呴』涓ユ牸鎵ц锛夈€慭n${detailedOutlineContext}` : "",
            `灏忚鏍囬锛?{project.outline.title || ""}`,
            `棰樻潗锛?{project.outline.subgenre || project.outline.genre || "鏈寚瀹?}`,
            `鏁呬簨姒傚康锛?{project.outline.storyConcept || "鏆傛棤"}`,
            `涓栫晫瑙傦細${project.outline.worldbuilding || "鏆傛棤"}`,
            volumeSynopsisContext ? `銆愬嵎绾插墠缃€慭n${volumeSynopsisContext}` : "",
            allChapterSynopsisContext ? `銆愮粏绾插墠缃€慭n${allChapterSynopsisContext}` : "",
            outlineSlice.adjacentSummary ? `銆愮浉閭诲嵎琛旀帴鎻愮ず銆慭n${outlineSlice.adjacentSummary}` : "",
            storyStateSummary ? `銆愬綋鍓嶆晠浜嬬姸鎬侊紙蹇呴』寤剁画锛夈€慭n${storyStateSummary}` : "",
            setupContinuityGuard || "",
            plotUnitContext ? `銆?绔犲墽鎯呭崟鍏冭鍒欍€慭n${plotUnitContext}` : "",
            plotUnitReport,
            plotUnitSuggestions,
            `褰撳墠鍗凤細绗?{volumeNumber}鍗?${volume.title || ""}`,
            `褰撳墠鍗锋憳瑕侊細${volume.summary || "鏆傛棤"}`,
            `褰撳墠鍗风珷鑺傜粏绾诧細${volume.chapterSynopsis || volume.chapter_synopsis || "鏆傛棤"}`,
            characterDigest ? `銆愬凡鏈夎鑹蹭笌浜鸿銆慭n${characterDigest}` : "",
            existingSummary ? `銆愬墠鎯呮彁瑕併€慭n${existingSummary}` : "",
            existingEventsContext,
            "",
            "銆愮粷瀵瑰師鍒欍€?,
            "1. 鍓ф儏涓嶅彲閲嶅锛氬凡鏈夌珷鑺傚凡缁忓啓杩囩殑浜嬩欢锛屽悗闈笉寰楀啀娆″嚭鐜扮浉鍚屾垨楂樺害鐩镐技鐨勬ˉ娈点€?,
            "2. 浣犳湰娆＄敓鎴愮殑澶氫釜绔犺妭涔嬮棿涔熶笉鑳介噸澶嶏紝姣忎竴绔犵殑鏍稿績浜嬩欢閮藉繀椤绘槸鍏ㄦ柊鐨勩€?,
            "3. 瑙掕壊鐘舵€佸繀椤诲欢缁墠鏂囷細浣嶇疆銆佷激鍔裤€佹儏缁€佽澶囥€佹椂闂寸嚎閮戒笉鑳芥柇瑁傘€?,
            "4. 鏂板紩鍏ヨ鑹插繀椤荤鍚堝綋鍓嶅満鏅拰鍓ф儏閫昏緫銆?,
            "5. 濡傛灉缁嗙翰閲屽寘鍚悗缁嵎鍐呭锛屼弗绂佸帇缂╁啓杩涘綋鍓嶅嵎銆?,
            "6. 濡傛灉鏌愪釜缁嗙翰浜嬩欢宸茬粡鍦ㄥ凡鏈夌珷鑺備腑鍐欒繃浜嗭紝蹇呴』璺宠繃锛屾敼鍐欎笅涓€涓柊浜嬩欢銆?,
            "7. 姣忕珷銆愪笅绔犻摵鍨€戝繀椤昏兘琚笅涓€绔犮€愮珷鑺傜洰鏍囥€戞垨銆愭牳蹇冧簨浠躲€戠洿鎺ユ帴浣忋€?,
            "8. 鍓嶄竴绔犳儏缁洸绾跨殑缁撳熬锛岃鑳借嚜鐒惰繃娓″埌涓嬩竴绔犳儏缁洸绾跨殑寮€澶淬€?,
            "9. 濡傛灉鍓嶆枃鎽樿閲屾煇涓簨浠跺凡缁忓彂鐢燂紝鍚庣画绔犵翰涓嶈兘鍐嶅啓瀹冣€滃嵆灏嗗彂鐢熲€濄€?,
            "10. 涓栫晫瑙傝瀹氫笉鍙繚鍙嶃€?,
            startChapter <= 1 ? "11. 濡傛灉褰撳墠鏄嵎棣栵紝鏂扮殑涓€鍗峰簲褰撴湁鏂扮殑姘涘洿鍜岃妭濂忥紝涓嶈閲嶅涓婁竴鍗风殑绾犺憶锛屽揩閫熷垏鍏ユ柊涓婚銆? : "",
            "",
            "銆愯緭鍑烘牸寮忔爣鍑嗭紙System 9锛夈€?,
            "summary 瀛楁蹇呴』涓ユ牸鍖呭惈浠ヤ笅鏍囩锛屽苟淇濈暀绌鸿缁撴瀯锛?,
            "銆愮珷鑺傜洰鏍囥€戯紙鏈珷鏍稿績鐩爣锛屼笉灏戜簬20瀛楋級",
            "銆愬嚭鍦轰汉鐗┿€?,
            "銆愬満鏅€戯紙鍏蜂綋鍦烘櫙鎻忚堪锛?,
            "銆愭牳蹇冧簨浠躲€戯紙鏍稿績浜嬩欢鎻忚堪锛屼笉灏戜簬50瀛楋級",
            "銆愭儏缁洸绾裤€慉鈫払鈫扖",
            "銆愭儏鑺傛帹杩涖€?,
            "銆愪紡绗斿鐞嗐€?,
            "銆愪笅绔犻摵鍨€戯紙鈿狅笍閾哄灚鈮犻鍛婏紒鍙啓鐘舵€?姘涘洿/鎮康锛屼笉鍐欏叿浣撲簨浠剁粨鏋滐級",
            "",
            `璇风敓鎴愮 ${startChapter} 绔犲埌绗?${endChapter} 绔犵殑绔犺妭澶х翰銆俙,
            "杈撳嚭 JSON 鏁扮粍锛屾瘡涓璞″繀椤诲寘鍚細",
            "chapter_number: 绔犺妭鍙?,
            "title: 绔犺妭鏍囬",
            "summary: 涓ユ牸閬靛畧 System 9 妯℃澘锛屽唴瀹瑰厖瀹烇紝涓嶈缂哄瓧娈?,
            "key_event: 鏍稿績浜嬩欢",
            "emotion_curve: 鎯呯华鏇茬嚎",
            "characters: 鍑哄満浜虹墿鏁扮粍",
            "foreshadows: 鏈珷鍩嬩笅鎴栧洖鏀剁殑浼忕瑪鏁扮粍",
            "plot_unit: { unit_number, unit_phase, unit_position, connects_to_previous, sets_up_next }",
            "next_chapter_setup: { state_setup, atmosphere_setup, suspense_hook, clue_hint, countdown }",
            "uuid: 绔犺妭 UUID",
            "",
            "鐗瑰埆瑕佹眰锛?,
            "1. next_chapter_setup 鏄笅绔犻摵鍨紝涓嶆槸棰勫憡锛涘彧鑳藉啓鐘舵€併€佹皼鍥淬€佹偓蹇点€佹殫绀猴紝涓嶈兘鐩存帴鍐欑粨鏋溿€?,
            "2. summary 涓殑銆愪笅绔犻摵鍨€戜篃蹇呴』閬靛畧鍚屾牱瑙勫垯锛氬彧鍩嬪洜锛屼笉鍐欐灉銆?,
            "2.1 缁濆绂佹鍐欌€滀笅绔犲皢浼?涓嬩竴绔犱細/韬唤灏嗘洕鍏?鏁屼汉灏嗘潵琚?椹笂浼氬彂鐢熶粈涔堚€濊繖绫婚鍛婂彞銆?,
            "2.2 姝ｇ‘鍐欐硶鏄細閲嶄激鏄忚糠銆佸紓鏍风溂绁炪€佽繙澶勫紓鍔ㄣ€佸彂鐜扮嚎绱€佺┖姘旈娌夈€佽鎶ュ搷璧凤紱閿欒鍐欐硶鏄洿鎺ユ妸涓嬬珷浜嬩欢鍜岀粨鏋滆鍑烘潵銆?,
            "3. summary 涓殑銆愭儏鑺傛帹杩涖€戝繀椤讳繚鐣欌€?.銆愮被鍨嬫爣绛俱€戝唴瀹光€濈殑鏍煎紡銆?,
            "4. 銆愬嚭鍦轰汉鐗┿€戝繀椤讳娇鐢ㄢ€? 濮撳悕锛堢畝浠嬶級鈥濈殑鏍煎紡銆?,
            "5. 銆愮珷鑺傜洰鏍囥€戜笉寰楀皯浜?0瀛楋紝銆愭牳蹇冧簨浠躲€戜笉寰楀皯浜?0瀛椼€?,
            "6. 銆愭儏鑺傛帹杩涖€戣嚦灏戝啓 5 鏉★紝姣忔潯涓嶅皯浜?0瀛楋紝涓斾繚鐣欌€滃簭鍙?+ 绫诲瀷鏍囩鈥濈殑鏍煎紡銆?,
            "7. 缁嗙翰閲屾秹鍙婄殑浜虹墿绉板懠蹇呴』灏介噺浣跨敤鐪熷疄濮撳悕銆?,
            "8. 浜虹墿琛屼负鍜屽叧绯绘帹杩涘繀椤讳笌鏃㈡湁浜鸿涓€鑷淬€?,
            "9. 绗?8 绔犮€佺 16 绔犵瓑鍗曞厓鏀舵潫绔犺璐熻矗涓轰笅涓€鍗曞厓鍋氭偓蹇甸摵鍨€?,
            "10. 娈佃惤涔嬮棿蹇呴』淇濈暀绌鸿锛屼笉瑕佹妸鎵€鏈夋爣绛炬尋鎴愪竴鍥€?,
            "11. JSON 涓弗绂佽緭鍑?markdown 浠ｇ爜鍧楁爣璁般€?
        ].filter(Boolean).join("\n");

        const parsed = await this.requestJSONArray(systemPrompt, userPrompt, {
            temperature: 0.75,
            maxTokens: this.getConfiguredMaxTokens(12000),
            timeout: this.getTaskTimeoutMs(240000)
        });

        return parsed.map((item, index) => {
            const normalized = this.sanitizeChapterOutlineHookData({
                ...item,
                summary: item.summary || item.synopsis || "",
                next_chapter_setup: item.next_chapter_setup || {}
            });
            return {
            uuid: item.uuid || Utils.uid("chapter"),
            number: Number(item.chapter_number || startChapter + index),
            chapter_number: Number(item.chapter_number || startChapter + index),
            title: item.title || `绗?{startChapter + index}绔燻,
            summary: normalized.summary || "",
            content: item.content || "",
            keyEvent: item.key_event || "",
            key_event: item.key_event || "",
            emotionCurve: item.emotion_curve || "",
            emotion_curve: item.emotion_curve || "",
            characters: this.sanitizeOutlineCharacterArray(item.characters),
            foreshadows: Utils.ensureArrayFromText(item.foreshadows),
            plot_unit: item.plot_unit || {},
            next_chapter_setup: normalized.next_chapter_setup || {}
        };
        });
    }

    async generateCharactersFromOutlines({ project, chapters, volumeNumber, onProgress = null }) {
        const rawRoleMap = this.extractRoleCandidatesFromChapters(project, chapters, volumeNumber);
        const rawItems = Object.entries(rawRoleMap);
        if (!rawItems.length) {
            return [];
        }

        const title = project.outline?.title || "鏈懡鍚嶅皬璇?;
        const theme = project.outline?.theme || "鏆傛棤";
        const detailedOutline = project.outline?.detailed_outline || "";
        const worldbuilding = project.outline?.worldbuilding || "";
        const existingCharacters = project.outline?.characters || [];
        const establishedRelationshipText = this.buildEstablishedRelationshipText(project, rawItems.map(([name]) => name));
        const existingCharsText = existingCharacters.length
            ? existingCharacters.map((character) => [
                `- ${character.name || "鏈懡鍚?}`,
                character.identity ? `韬唤锛?{character.identity}` : "",
                (character.aliases || character["鍒悕"]) ? `鍒悕锛?{Utils.ensureArrayFromText(character.aliases || character["鍒悕"]).join("銆?)}` : "",
                character.personality ? `鎬ф牸锛?{Utils.summarizeText(character.personality, 80)}` : "",
                character.background ? `鑳屾櫙锛?{Utils.summarizeText(character.background, 80)}` : "",
                character.relationships ? `鍏崇郴锛?{Utils.summarizeText(character.relationships, 80)}` : ""
            ].filter(Boolean).join(" | ")).join("\n")
            : "鏆傛棤宸叉湁瑙掕壊";

        const exampleChar = {
            name: "瑙掕壊鍚?,
            identity: "韬唤瀹氫綅",
            age: "骞撮緞",
            gender: "鎬у埆",
            personality: "鏍稿績鎬ф牸鐗圭偣锛屼笉灏戜簬30瀛?,
            background: "鑳屾櫙鏁呬簨锛屼笉灏戜簬50瀛?,
            appearance: "澶栬矊鎻忚堪锛屼笉灏戜簬30瀛?,
            abilities: "鑳藉姏鐗归暱",
            goals: "鐩爣鍔ㄦ満",
            relationships: "涓庡凡鏈夎鑹茬殑鍏崇郴",
            aliases: ["鍒悕1"],
            鎬ф牸鐗圭偣: "鍚?personality",
            鑳屾櫙鏁呬簨: "鍚?background",
            澶栬矊鎻忚堪: "鍚?appearance",
            鑳藉姏鐗归暱: "鍚?abilities",
            鐩爣鍔ㄦ満: "鍚?goals",
            浜虹墿鍏崇郴: "鍚?relationships",
            鍒悕: "鍒悕1"
        };

        const CHAR_BATCH_SIZE = 8;
        const allCharacters = [];
        const totalBatches = Math.max(1, Math.ceil(rawItems.length / CHAR_BATCH_SIZE));

        for (let batchStart = 0; batchStart < rawItems.length; batchStart += CHAR_BATCH_SIZE) {
            const batchItems = rawItems.slice(batchStart, batchStart + CHAR_BATCH_SIZE);
            const batchIndex = Math.floor(batchStart / CHAR_BATCH_SIZE) + 1;
            const batchStr = batchItems.map(([label, meta]) => {
                const detail = meta && typeof meta === "object"
                    ? meta
                    : { description: String(meta || "").trim(), needsNaming: false, aliases: [] };
                const desc = String(detail.description || "").trim();
                const aliasText = Array.isArray(detail.aliases) && detail.aliases.length
                    ? `锛涘師绉板懠/鍒悕锛?{detail.aliases.join("銆?)}`
                    : "";
                const namingHint = detail.needsNaming
                    ? "锛涖€愰渶瑕佸厛璧蜂竴涓叿浣撲腑鏂囧悕瀛楋紝绂佹缁х画鐢ㄦā绯婄О鍛煎仛name锛屽苟鎶婂師绉板懠鍐欏叆aliases銆?
                    : "";
                return `- ${label}${desc ? `锛?{desc}锛塦 : ""}${aliasText}${namingHint}`;
            }).join("\n");

            if (typeof onProgress === "function") {
                onProgress({
                    type: "batch_start",
                    batchIndex,
                    totalBatches,
                    batchSize: batchItems.length,
                    names: batchItems.map(([name]) => name)
                });
            }

            const systemPrompt = [
                "浣犳槸涓€浣嶈祫娣辩綉鏂囦富缂栵紝鎿呴暱璁惧畾澶嶆潅銆佺珛浣撱€佹湁鍙嶅樊鎰熺殑浜虹墿瑙掕壊銆?,
                `鐜板湪闇€瑕佷负灏忚銆?{title}銆嬩腑鐨勫涓鑹叉壒閲忓垱寤哄畬鏁寸殑浜虹墿璁惧畾銆俙,
                "",
                "銆愬皬璇翠俊鎭€?,
                `鏍囬锛氥€?{title}銆媊,
                `涓婚锛?{theme}`,
                "",
                "銆愪笘鐣岃銆?,
                this.limitContext(worldbuilding, 600) || "鏆傛棤涓栫晫瑙?,
                "",
                "銆愯缁嗗ぇ绾层€?,
                this.limitContext(detailedOutline, 800) || "鏆傛棤缁嗙翰",
                "",
                "銆愬凡鏈夎鑹插強鍏惰儗鏅紙蹇呴』淇濇寔鍏崇郴涓€鑷存€э紒锛夈€?,
                existingCharsText,
                "",
                "銆愬凡寤虹珛鐨勪汉鐗╁叧绯汇€?,
                establishedRelationshipText,
                "",
                "銆愰渶瑕佺敓鎴愪汉璁剧殑瑙掕壊鎻忚堪銆?,
                batchStr,
                "",
                "銆愪弗鏍艰姹傘€?,
                `1. 杈撳嚭蹇呴』鏄?JSON 鏁扮粍锛屽寘鍚?${batchItems.length} 涓鑹插璞°€俙,
                "2. 姣忎釜瑙掕壊蹇呴』鍖呭惈鎵€鏈夊瓧娈碉細name, identity, age, gender, personality, background, appearance, abilities, goals, relationships 浠ュ強瀵瑰簲涓枃瀛楁銆?,
                "3. personality / 鎬ф牸鐗圭偣锛氬繀椤诲寘鍚牳蹇冩€ф牸鐗圭偣锛屽瓧鏁颁笉灏戜簬30瀛椼€?,
                "4. background / 鑳屾櫙鏁呬簨锛氬繀椤诲寘鍚牳蹇冨啿绐佸拰涓庢晠浜嬬殑鍏宠仈锛屽瓧鏁颁笉灏戜簬50瀛椼€?,
                "5. appearance / 澶栬矊鎻忚堪锛氬繀椤绘湁鐢婚潰鎰燂紝瀛楁暟涓嶅皯浜?0瀛椼€?,
                "6. 鍏崇郴涓€鑷存€ф瀬鍏堕噸瑕侊細鏂拌鑹茬殑韬唤鍜岃儗鏅繀椤讳笌宸叉湁瑙掕壊淇濇寔閫昏緫涓€鑷淬€?,
                "7. 鑻ュ凡鏈夎鑹茶瀹氫簡鏌愪釜鍦颁綅锛屾柊瑙掕壊涓嶈兘鏃犳晠鍙栦唬锛屽繀椤诲湪 relationships 瀛楁涓槑纭鏄庝笌宸叉湁瑙掕壊鐨勫叧绯汇€?,
                "8. 瑙掕壊璁惧畾蹇呴』绗﹀悎褰撳墠灏忚鐨勪笘鐣岃鍜屽墽鎯呭彂灞曘€?,
                "9. 鍚勮鑹蹭箣闂磋鏈夊樊寮傚寲锛岄伩鍏嶉浄鍚屻€?,
                "10. 濡傛灉杈撳叆椤规湰韬凡缁忔槸鏄庣‘瀹炲悕锛屽繀椤讳繚鐣欏師鍚嶅瓧锛屼笉寰楁搮鑷敼鍚嶏紱濡傛灉宸叉湁鍒悕鎴栧父瑙佺О鍛硷紝璇峰啓鍏?aliases / 鍒悕 瀛楁銆?,
                "11. 濡傛灉鏂拌鑹插拰宸叉湁瑙掕壊瀛樺湪浜插睘銆佸笀闂ㄣ€佹晫瀵广€佷笂涓嬬骇銆佹棫璇嗗叧绯伙紝蹇呴』鍦?relationships 瀛楁涓啓娓呮銆?,
                "12. 涓嶈璁╂柊瑙掕壊鏃犳晠椤舵浛宸叉湁瑙掕壊鐨勯噸瑕佽韩浠斤紝涔熶笉瑕佹妸宸叉湁瑙掕壊鐨勫埆鍚嶉噸澶嶅彂缁欏叾浠栦汉銆?,
                "13. 濡傛灉杈撳叆椤规槸鈥滀富瑙掋€佸コ涓汇€佺敺涓汇€侀緳绁炪€佸鍒ゅ畼銆佸悓浜婣銆佹煇鍔╃悊鈥濊繖绫绘ā绯婄О鍛兼垨鍗犱綅绉板懠锛屼笖灏氭湭閿佸畾瀹炲悕锛屼綘蹇呴』鍦ㄦ湰娆¤緭鍑洪噷鐩存帴璧蜂竴涓叿浣撲腑鏂囧悕瀛椼€?,
                "14. 瀵硅繖绫诲緟鍛藉悕瑙掕壊锛宯ame 瀛楁缁濆涓嶈兘缁х画鍐欐垚鍘熺О鍛笺€佷唬绉般€佸崰浣嶇銆佺紪鍙峰悗缂€鎴栨ā绯婅韩浠借瘝锛涘師绉板懠鍙兘鏀捐繘 aliases / 鍒悕銆?,
                "15. 濡傛灉鏌愪釜妯＄硦绉板懠鍏跺疄宸茬粡瀵瑰簲宸叉湁瑙掕壊锛屽繀椤绘部鐢ㄥ凡鏈夊悕瀛楋紝涓嶈兘閲嶅閫犱竴涓柊瑙掕壊銆?,
                "16. 璇稿鈥滃悓浜婣銆佸悓浜婤銆佺涔︾敳銆佸姪鐞嗕箼銆佷富瑙掋€佸コ涓汇€佺敺涓汇€佷粬銆佸ス銆佽繖浜恒€侀偅浜恒€侀粦琛ｅ鍒ゅ畼鈥濋兘涓嶈兘鐩存帴鍑虹幇鍦?name 瀛楁銆?,
                "17. relationships / 浜虹墿鍏崇郴 鍙兘鍐欎笌宸叉湁瀹炲悕瑙掕壊鎴栨槑纭鑹茬殑鍏崇郴锛屽敖閲忓帇缂╂垚 1-3 鏉＄煭鍙ワ紝渚嬪鈥滄灄涔﹂煶鐨勭户濮愶紙鏁屽锛夆€濃€滄潕妗傞鐨勫コ鍎匡紙鍚屼紮锛夆€濄€?,
                "18. 绂佹鎶婂ぇ娈佃儗鏅晠浜嬨€佸墽鎯呯粡杩囥€佸績鐞嗘椿鍔ㄥ杩?relationships 瀛楁锛涘叧绯诲瓧娈典笉鑳借嚜鐩哥煕鐩撅紝涔熶笉鑳藉悓鏃舵妸涓€涓鑹插啓鎴愪袱绉嶅啿绐佽韩浠姐€?,
                "19. 涓嶈鍖呭惈浠讳綍 markdown 鏍囪锛岀洿鎺ヨ繑鍥炵函 JSON 鏁扮粍銆?,
                "",
                "銆愯緭鍑烘牸寮忕ず渚嬨€?,
                `[${JSON.stringify(exampleChar, null, 2)}]`,
                "",
                "銆愬緟鍛藉悕瑙掕壊绀轰緥銆?,
                "杈撳叆锛? 鍚屼簨A锛堟€婚拡瀵规灄涔﹂煶鐨勫姙鍏鍚屼簨锛?,
                "姝ｇ‘杈撳嚭锛歯ame 蹇呴』鏄叿浣撲腑鏂囧悕瀛楋紝渚嬪鈥滃懆鏁忊€濇垨鈥滄潕闆呭矚鈥濓紱aliases 閲屽啀鍐欌€滃悓浜婣鈥濄€?,
                "閿欒杈撳嚭锛歯ame 鍐欐垚鈥滃悓浜婣鈥濃€滃コ鍚屼簨鈥濃€滃姙鍏鍚屼簨鈥濋兘绠椾笉鍚堟牸銆?
            ].join("\n");

            const parsed = await this.requestJSONArray(systemPrompt, `璇蜂负浠ヤ笂 ${batchItems.length} 涓鑹叉壒閲忕敓鎴愬畬鏁寸殑浜虹墿璁惧畾锛岀‘淇濇瘡涓鑹查兘鏈夊畬鏁寸殑涓嫳鏂囧瓧娈点€俙, {
                temperature: 0.75,
                maxTokens: this.getConfiguredMaxTokens(12000),
                timeout: this.getTaskTimeoutMs(240000)
            });

            const usedIndexes = new Set();
            parsed.forEach((character) => {
                const matchedIndex = this.matchGeneratedCharacterToBatchIndex(batchItems, character, usedIndexes);
                if (matchedIndex < 0) {
                    return;
                }
                usedIndexes.add(matchedIndex);

                const sourceMeta = batchItems[matchedIndex]?.[1] && typeof batchItems[matchedIndex][1] === "object"
                    ? batchItems[matchedIndex][1]
                    : { description: String(batchItems[matchedIndex]?.[1] || "").trim(), needsNaming: false, aliases: [] };
                const candidateName = this.normalizeOutlineCharacterLabel(batchItems[matchedIndex]?.[0] || "");
                const rawReturnedName = String(character.name || character.real_name || character.realName || "").trim();
                const inputAliases = Array.isArray(sourceMeta.aliases) ? sourceMeta.aliases : [];
                const returnedAliases = Array.isArray(character.aliases)
                    ? character.aliases
                    : Utils.ensureArrayFromText(character.aliases || character["鍒悕"]);
                const returnedConcreteName = this.isLikelySynopsisPersonName(rawReturnedName) && !this.isGenericCharacterCandidateName(rawReturnedName)
                    ? rawReturnedName
                    : "";
                const candidateLooksConcrete = this.isLikelySynopsisPersonName(candidateName) && !this.isGenericCharacterCandidateName(candidateName);
                const chosenName = (sourceMeta.needsNaming || !candidateLooksConcrete)
                    ? returnedConcreteName
                    : (candidateName || returnedConcreteName);
                const mergedAliases = Array.from(new Set([
                    ...(sourceMeta.needsNaming && candidateName ? [candidateName] : []),
                    ...inputAliases,
                    ...returnedAliases
                ]))
                    .map((alias) => this.normalizeOutlineCharacterLabel(alias))
                    .filter((alias) => alias && alias !== chosenName);
                const normalized = {
                    name: chosenName || "",
                    identity: character.identity || "",
                    age: character.age || "",
                    gender: character.gender || "",
                    personality: character.personality || character["鎬ф牸鐗圭偣"] || "",
                    background: character.background || character["鑳屾櫙鏁呬簨"] || "",
                    appearance: character.appearance || character["澶栬矊鎻忚堪"] || "",
                    abilities: character.abilities || character["鑳藉姏鐗归暱"] || "",
                    goals: character.goals || character["鐩爣鍔ㄦ満"] || "",
                    relationships: this.sanitizeGeneratedRelationshipText(project, chosenName || candidateName, character.relationships || character["浜虹墿鍏崇郴"] || "", sourceMeta),
                    aliases: mergedAliases,
                    鎬ф牸鐗圭偣: character.personality || character["鎬ф牸鐗圭偣"] || "",
                    鑳屾櫙鏁呬簨: character.background || character["鑳屾櫙鏁呬簨"] || "",
                    澶栬矊鎻忚堪: character.appearance || character["澶栬矊鎻忚堪"] || "",
                    鑳藉姏鐗归暱: character.abilities || character["鑳藉姏鐗归暱"] || "",
                    鐩爣鍔ㄦ満: character.goals || character["鐩爣鍔ㄦ満"] || "",
                    浜虹墿鍏崇郴: this.sanitizeGeneratedRelationshipText(project, chosenName || candidateName, character.relationships || character["浜虹墿鍏崇郴"] || "", sourceMeta),
                    鍒悕: mergedAliases.join("銆?)
                };

                if (normalized.name && (!sourceMeta.needsNaming || !this.isGenericCharacterCandidateName(normalized.name))) {
                    allCharacters.push(normalized);
                }
            });

            if (typeof onProgress === "function") {
                onProgress({
                    type: "batch_success",
                    batchIndex,
                    totalBatches,
                    batchSize: batchItems.length,
                    generatedCount: parsed.length,
                    names: batchItems.map(([name]) => name)
                });
            }
        }

        return allCharacters;
    }

    async expandChapterContent({ project, volume, chapter, onDebugInfo = null }) {
        const chapterOutlineCharacterNames = this.extractChapterOutlineCharacterNames(chapter.summary || "");
        const relevantCharacters = this.collectRelevantCharacters(
            project,
            `${chapter.summary || ""}\n${chapter.content || ""}`,
            chapterOutlineCharacterNames
        );
        const characterDigest = this.buildRelevantCharactersInfo(relevantCharacters);
        const volumeNumber = this.getVolumeNumber(project, volume);
        const guardContext = this.buildGenerationGuards(project, volumeNumber, chapter.number || 0, chapter);
        const characterConsistencyContext = this.buildCharacterConsistencyContext(
            project,
            `${chapter.summary || ""}\n${chapter.content || ""}`,
            chapter.number || 0
        );
        const promptTemplate = project.prompt_state?.current_prompt || "";
        const openingRelayPacket = this.buildOpeningRelayPacket(project, volume, chapter);
        const prevContent = this.getPreviousChapterContents(project, volume, chapter, 5);
        const previousOutlineContext = this.buildPreviousOutlineSummary(project, volume, chapter);
        const nextOutline = this.getNextChapterOutline(project, volume, chapter);
        const frequency = project.prompt_state?.chapter_frequency || "male";
        const worldAndPlanContext = this.buildWorldAndPlanContext(project);
        const currentVolumeOutlineContext = this.extractCurrentVolumeOutlineContext(
            project,
            volumeNumber
        ).currentOutline;
        const expansionHint = this.buildExpansionHint(chapter.summary || "", chapter.number || 0);
        const nextChapterSetupInstruction = this.buildNextChapterSetupInstruction(chapter);
        const nextChapterForbiddenPreview = this.buildNextChapterForbiddenPreview(nextOutline);
        const transitionGuide = this.buildChapterTransitionGuide(project, volume, chapter, prevContent);
        const openingAntiRepeatGuard = this.buildOpeningAntiRepeatGuard(project, volume, chapter);
        const storyStateSummary = this.buildStoryStateSummary(
            project,
            volumeNumber,
            chapter.number || 0,
            `${chapter.title || ""}\n${chapter.summary || ""}\n${chapter.content || ""}`
        );
        const narrativeBridgePlan = this.buildNarrativeBridgePlan(project, volumeNumber, chapter);
        const setupContinuityGuard = this.buildSetupContinuityGuard(
            project,
            volumeNumber,
            chapter.number || 0,
            `${chapter.title || ""}\n${chapter.summary || ""}`
        );
        const extraOutputProtocol = this.buildExtraOutputProtocol();
        const stateOutputProtocol = this.buildStateOutputProtocol(project, chapter, relevantCharacters);

        const systemPrompt = [
            "浣犳槸涓€鍚嶆搮闀垮皢绔犺妭澶х翰鎵╁啓鎴愪腑鏂囩綉鏂囨鏂囩殑绔犺妭鍐欐墜銆?,
            "璇锋牴鎹凡缁忕‘璁ょ殑绔犺妭澶х翰鎵╁啓姝ｆ枃鑽夌銆?,
            "浣犲繀椤讳弗鏍奸伒瀹堟湰绔犲ぇ绾层€佸叏灞€璁惧畾銆佹湰绔犺瀹氥€佽鑹查攣瀹氥€佷笘鐣岃銆佷汉鐗╀竴鑷存€с€佸姩鎬佺姸鎬佸拰绔犳湯蹇収琛旀帴銆?,
            "浣犲彲浠ュ湪涓嶆敼鍙樹富绾跨殑鍓嶆彁涓嬭繘琛岃鑲夊～鍏呫€佸姩浣滃欢灞曘€佸績鐞嗚ˉ寮哄拰鍦烘櫙娓叉煋锛屼絾缁濅笉鑳藉亸绂诲ぇ绾蹭富绾裤€?,
            "姝ｆ枃瀛楁暟榛樿鐩爣涓?000-6000瀛楋紝鑷冲皯涓嶈灏戜簬2500瀛楋紱濡傛灉鏈珷澶х翰淇℃伅寰堝锛屽氨瑕佷竴娆℃€у厖鍒嗗睍寮€锛屼笉瑕佸帇缂╂垚涓€鍗冨瀛楃殑鐭珷銆?,
            "蹇呴』瀹屾垚鏈珷缁撳熬閾哄灚浠诲姟锛屼絾缁濆涓嶈兘鎶婁笅涓€绔犳牳蹇冧簨浠舵彁鍓嶅啓鍑烘潵銆?,
            "姝ｆ枃蹇呴』绱ф帴鍓嶆枃鏈€鍚庝竴涓湁鏁堝満鏅拰鐘舵€佸睍寮€锛屼笉鍑嗗钩鍦伴噸寮€锛屼笉鍑嗘妸宸茬粡鍙戠敓鐨勪簨鍐嶅啓鎴愰鍛娿€?,
            "鍓嶆枃浜旂珷鍘熸枃鍙敤浜庣户鎵夸簨瀹炪€佸悕璇嶃€佺姸鎬併€佸鐧藉彛鍚诲拰鍔ㄤ綔寤剁画锛屼笉鏄粰浣犲綋浣滃墠鎯呭洖椤炬ā鏉裤€?,
            "濡傛灉鏈珷澶х翰鎴栧墠鏂囪鎺ョ暐鏄剧敓纭紝浣犺鍦ㄦ鏂囬噷鑷劧琛ヨ冻鍥犳灉涓庤繃妗ュ姩浣滐紝璁╄鑰呰璧锋潵椤猴紝浣嗕笉鑳界鏀逛富绾跨粨鏋溿€?,
            "鎷掔粷AI鍛筹細涓嶈鍫嗙爩鍢磋銆佺溂绁炪€佺灣瀛斻€佸枆缁撱€佹寚鑺傜瓑妯℃澘鍖栧井琛ㄦ儏锛涗笉瑕佸啓绌烘硾姣斿柣銆佹€荤粨鑵斿拰鏂囩粔缁夌殑鎶借薄鎶掓儏銆?,
            "鐭彞浼樺厛锛屽姩璇嶄紭鍏堬紝鍙ｈ鍖栵紝灏戝壇璇嶏紝灏戝舰瀹硅瘝锛屽皯濂楄矾姣斿柣銆?,
            "姝ｆ枃鍐欏畬鍚庯紝蹇呴』鎸夎姹傝拷鍔犵姸鎬佽緭鍑哄拰杩借釜杈撳嚭銆?,
            guardContext,
            characterConsistencyContext
        ].filter(Boolean).join("\n\n");

        const userPrompt = this.composeChapterPrompt({
            project,
            volume,
            chapter,
            promptTemplate,
            openingRelayPacket,
            prevContent,
            nextOutline,
            characterDigest,
            frequency,
            worldAndPlanContext,
            currentVolumeOutlineContext,
            previousOutlineContext,
            storyStateSummary,
            narrativeBridgePlan,
            expansionHint,
            setupContinuityGuard,
            openingAntiRepeatGuard,
            nextChapterSetupInstruction,
            nextChapterForbiddenPreview,
            transitionGuide,
            stateOutputProtocol,
            extraOutputProtocol
        });

        if (typeof onDebugInfo === "function") {
            onDebugInfo({
                title: project?.outline?.title || "",
                theme: project?.outline?.theme || "",
                genre: project?.outline?.subgenre || project?.outline?.genre || "",
                currentVolume: volume?.title || "",
                currentChapter: `绗?{chapter.number || "?"}绔燻,
                outlineLength: String(chapter.summary || "").trim().length,
                templateLength: String(promptTemplate || "").trim().length,
                finalUserPromptLength: String(userPrompt || "").length,
                finalSystemPromptLength: String(systemPrompt || "").length,
                injectedBlocks: [
                    {
                        label: "鏈珷澶х翰",
                        length: String(chapter.summary || "").trim().length,
                        preview: this.limitContext(chapter.summary || "", 160)
                    },
                    {
                        label: "寮€绡囨帴鍔涙",
                        length: String(openingRelayPacket || "").trim().length,
                        preview: this.limitContext(openingRelayPacket || "", 160)
                    },
                    {
                        label: "鍓嶆枃浜旂珷",
                        length: String(prevContent || "").trim().length,
                        preview: this.limitContext(prevContent || "", 160)
                    },
                    {
                        label: "鍓嶆枃澶х翰鎽樿",
                        length: String(previousOutlineContext || "").trim().length,
                        preview: this.limitContext(previousOutlineContext || "", 160)
                    },
                    {
                        label: "褰撳墠鍗风粏绾插弬鑰?,
                        length: String(currentVolumeOutlineContext || "").trim().length,
                        preview: this.limitContext(currentVolumeOutlineContext || "", 160)
                    },
                    {
                        label: "涓栫晫瑙備笌璇︾粏澶х翰",
                        length: String(worldAndPlanContext || "").trim().length,
                        preview: this.limitContext(worldAndPlanContext || "", 160)
                    },
                    {
                        label: "鐩稿叧瑙掕壊璁惧畾",
                        length: String(characterDigest || "").trim().length,
                        preview: this.limitContext(characterDigest || "", 160)
                    },
                    {
                        label: "鍏ㄥ眬璁惧畾鎻愰啋",
                        length: String(project?.global_setting_note || "").trim().length,
                        preview: this.limitContext(project?.global_setting_note || "", 120)
                    },
                    {
                        label: "鏈珷璁惧畾鎻愰啋",
                        length: String(chapter.chapter_setting_note || "").trim().length,
                        preview: this.limitContext(chapter.chapter_setting_note || "", 120)
                    },
                    {
                        label: "鏁呬簨鐘舵€佹憳瑕?,
                        length: String(storyStateSummary || "").trim().length,
                        preview: this.limitContext(storyStateSummary || "", 160)
                    },
                    {
                        label: "绔犺妭鎵ц楠ㄦ灦",
                        length: String(narrativeBridgePlan || "").trim().length,
                        preview: this.limitContext(narrativeBridgePlan || "", 160)
                    },
                    {
                        label: "绔犳湯蹇収琛旀帴鎸囧",
                        length: String(transitionGuide || "").trim().length,
                        preview: this.limitContext(transitionGuide || "", 160)
                    },
                    {
                        label: "寮€澶撮槻閲嶅绾︽潫",
                        length: String(openingAntiRepeatGuard || "").trim().length,
                        preview: this.limitContext(openingAntiRepeatGuard || "", 160)
                    },
                    {
                        label: "鏅鸿兘鎵╁厖寤鸿",
                        length: String(expansionHint || "").trim().length,
                        preview: this.limitContext(expansionHint || "", 160)
                    },
                    {
                        label: "鏈珷缁撳熬閾哄灚浠诲姟",
                        length: String(nextChapterSetupInstruction || "").trim().length,
                        preview: this.limitContext(nextChapterSetupInstruction || "", 160)
                    },
                    {
                        label: "涓嬩竴绔犵姝㈤鍐欓璀?,
                        length: String(nextChapterForbiddenPreview || "").trim().length,
                        preview: this.limitContext(nextChapterForbiddenPreview || "", 160)
                    },
                    {
                        label: "鐘舵€佽緭鍑哄崗璁?,
                        length: String(stateOutputProtocol || "").trim().length,
                        preview: this.limitContext(stateOutputProtocol || "", 120)
                    },
                    {
                        label: "闄勫姞杩借釜杈撳嚭",
                        length: String(extraOutputProtocol || "").trim().length,
                        preview: this.limitContext(extraOutputProtocol || "", 120)
                    }
                ].filter((item) => item.length > 0)
            });
        }

        const rawContent = await this.api.callLLM(userPrompt, systemPrompt, {
            temperature: 0.82,
            maxTokens: this.getConfiguredMaxTokens(12000),
            timeout: this.getTaskTimeoutMs(240000)
        });

        return this.sanitizeGeneratedChapterContent(rawContent, nextOutline).trim();
    }

    async recoverChapterStateJson({ project, volume, chapter, content, rawStateBlock = "" }) {
        const cleanedContent = String(content || "").trim();
        if (!cleanedContent) {
            return "";
        }

        const volumeNumber = this.getVolumeNumber(project, volume);
        const chapterOutlineCharacterNames = this.extractChapterOutlineCharacterNames(chapter.summary || "");
        const relevantCharacters = this.collectRelevantCharacters(
            project,
            `${chapter.summary || ""}\n${cleanedContent}`,
            chapterOutlineCharacterNames
        );
        const characterDigest = this.buildRelevantCharactersInfo(relevantCharacters);
        const previousOutlineContext = this.buildPreviousOutlineSummary(project, volume, chapter);
        const currentVolumeOutlineContext = this.extractCurrentVolumeOutlineContext(project, volumeNumber).currentOutline;
        const storyStateSummary = this.buildStoryStateSummary(
            project,
            volumeNumber,
            chapter.number || 0,
            `${chapter.title || ""}\n${chapter.summary || ""}\n${cleanedContent}`
        );
        const prevContent = this.getPreviousChapterContents(project, volume, chapter, 3);
        const transitionGuide = this.buildChapterTransitionGuide(project, volume, chapter, prevContent);
        const nextChapterSetupInstruction = this.buildNextChapterSetupInstruction(chapter);
        const stateOutputProtocol = this.buildStateOutputProtocol(project, chapter, relevantCharacters);

        const systemPrompt = [
            "浣犳槸涓€涓弗鏍肩殑涓枃灏忚鐘舵€佹娊鍙栧櫒銆?,
            "浣犵殑浠诲姟鏄牴鎹珷鑺傛鏂囧拰涓婁笅鏂囷紝杈撳嚭鏈珷缁撴潫鏃剁殑鐘舵€?JSON銆?,
            "浣犲彧鑳借緭鍑轰竴涓悎娉?JSON 瀵硅薄銆?,
            "绂佹杈撳嚭瑙ｉ噴銆佺姝㈣緭鍑?markdown 浠ｇ爜鍧椼€佺姝㈣緭鍑?<<<STATE_JSON>>> 鍒嗛殧绗︺€佺姝㈠杩版鏂囥€?,
            "濡傛灉姝ｆ枃閲屾病鏈夋槑纭粰鍑虹殑淇℃伅锛岃浣跨敤绌哄瓧绗︿覆銆佺┖鏁扮粍鎴栫┖瀵硅薄锛屼笉瑕佺紪閫犮€?
        ].join("\n");

        const userPrompt = [
            `銆愬綋鍓嶇珷鑺傘€戠${chapter.number || "?"}绔犮€?{chapter.title || "鏈懡鍚嶇珷鑺?}銆媊,
            chapter.summary ? `銆愭湰绔犲ぇ绾层€慭n${chapter.summary}` : "",
            previousOutlineContext ? `銆愬墠鏂囧ぇ绾叉憳瑕併€慭n${this.limitContext(previousOutlineContext, 1400)}` : "",
            storyStateSummary ? `銆愬墠鏂囩姸鎬佹憳瑕併€慭n${storyStateSummary}` : "",
            currentVolumeOutlineContext ? `銆愬綋鍓嶅嵎缁嗙翰鍙傝€冦€慭n${this.limitContext(currentVolumeOutlineContext, 1600)}` : "",
            characterDigest ? `銆愮浉鍏充汉鐗╄瀹氥€慭n${characterDigest}` : "",
            transitionGuide ? `銆愯鎺ユ彁閱掋€慭n${transitionGuide}` : "",
            nextChapterSetupInstruction ? `銆愭湰绔犵粨灏鹃摵鍨换鍔°€慭n${nextChapterSetupInstruction}` : "",
            rawStateBlock ? `銆愪笂娆″け璐ョ殑鐘舵€佽緭鍑烘畫鐗囥€慭n${this.limitContext(rawStateBlock, 1800)}` : "",
            `銆愮珷鑺傛鏂囥€慭n${this.limitContext(cleanedContent, 12000)}`,
            stateOutputProtocol,
            "鐜板湪鍙緭鍑?JSON 瀵硅薄鏈韩锛屼笉瑕佽緭鍑轰换浣曢澶栨枃瀛椼€?
        ].filter(Boolean).join("\n\n");

        const raw = await this.api.callLLM(userPrompt, systemPrompt, {
            temperature: 0.1,
            maxTokens: Math.min(this.getConfiguredMaxTokens(4000), 4000),
            timeout: this.getTaskTimeoutMs(120000)
        });

        return String(raw || "").trim();
    }

    async filterAiFlavorText(text, project = {}) {
        const sourceText = String(text || "").trim();
        if (!sourceText) {
            return sourceText;
        }

        const targetWords = this.getAiHighFrequencyWords();
        const suspiciousPatterns = this.getAiSuspiciousPatterns().map((pattern) => new RegExp(pattern));
        const structuralPatterns = [
            ...this.getAiStructuralPatterns(),
            ...this.getAiGenreClichePatterns(project)
        ];
        const weakModifierWords = this.getAiWeakModifierWords();
        const abstractWords = this.getAiAbstractWords();
        const emotionLabelWords = this.getAiEmotionLabelWords();
        const genreClicheHint = this.getAiGenreClichePromptHint(project);
        const whitelist = this.getEffectiveAiWhitelist(project);
        const blacklist = this.getEffectiveAiBlacklist(project);
        const segments = this.splitSentencesForAiFilter(sourceText);
        const conflictProgressionMap = this.detectAiConflictProgressionSequence(segments);
        const taintedEntries = [];
        const hitWords = new Set();

        segments.forEach((segment, index) => {
            const detection = this.collectAiSentenceSignals(segment, {
                targetWords,
                suspiciousPatterns,
                structuralPatterns,
                weakModifierWords,
                abstractWords,
                emotionLabelWords,
                whitelist,
                blacklist,
                previousSentence: index > 0 ? segments[index - 1] : "",
                nextSentence: index < segments.length - 1 ? segments[index + 1] : "",
                conflictProgressionReason: conflictProgressionMap.get(index) || ""
            });
            if (detection.flagged) {
                taintedEntries.push({
                    index,
                    score: detection.score,
                    reasons: detection.reasons
                });
                detection.reasons.forEach((item) => hitWords.add(item));
            }
        });

        if (!taintedEntries.length) {
            return sourceText;
        }

        const taintedIndexSet = new Set(taintedEntries.map((item) => item.index));
        const taintedReasonMap = new Map(
            taintedEntries.map((item) => [item.index, (item.reasons || []).slice(0, 3).join("、") || "可疑句式"])
        );
        const contextIndices = new Set();
        taintedEntries.forEach(({ index }) => {
            contextIndices.add(index);
            if (index > 0) {
                contextIndices.add(index - 1);
            }
            if (index < segments.length - 1) {
                contextIndices.add(index + 1);
            }
        });

        const excerptLines = Array.from(contextIndices)
            .sort((a, b) => a - b)
            .map((index) => taintedIndexSet.has(index)
                ? `【需改｜${taintedReasonMap.get(index) || "可疑句式"}】${segments[index].trim()}`
                : `【勿动】${segments[index].trim()}`);
        const excerptText = excerptLines.join("\n");
        const hitWordsStr = Array.from(hitWords).slice(0, 50).join("、");

        const humanStyleGuide = this.getHumanStyleReferenceGuide();
        const polishPrompt = [
            "你是一位资深网文编辑，请对以下文本进行精准去AI味处理。",
            "",
            "【最高原则】",
            "- 只改标记为【需改】的句子，标记为【勿动】的句子一个字都不要动。",
            "- 改完后的句子必须更自然、更像人写的网文，优先短句、动作、对白，少抽象总结。",
            "- 宁可少改，也不要乱改。如果一句话只是信息普通、但不明显AI味，就不要动。",
            "- 你是编辑，不是续写作者。不要改剧情，不要改设定，不要补新信息，只改表达。",
            "",
            "【什么算AI味】",
            "1. 没有固定关键词，但句式明显模板化，比如微表情堆砌、抽象情绪标签、假细节、空泛比喻、万能形容词。",
            "2. 明明可以直接写动作或对白，却绕成‘气氛凝固’‘时间停住’‘心里某处一震’这种空话。",
            "3. 同一句里副词、形容词太多，显得像在摆句子，不像人物在动。",
            "4. 看起来文绉绉，但信息没有增加，只是在拔高气氛。",
            "5. 上一句已经用动作、对白、现场反应交代清楚，下一句又补一层解释或渲染，也算AI味。",
            "6. 连续几句凑成‘气氛凝固-众人震惊-主角冷静开口-对方恼羞成怒-旁人议论’这种标准冲突推进，也算AI味。",
            "7. 题材里反复出现的预制描写也算AI味，比如年代文反复‘领口洗得发白’，修仙文反复‘一袭白衣、衣袂翻飞、白衣猎猎’。",
            "",
            `【本轮命中的可疑信号】${hitWordsStr || "句式层面可疑"}`,
            genreClicheHint ? `【本题材额外提醒】${genreClicheHint}` : "",
            "",
            "【改写规则】",
            "1. 没有问题的句子不改。",
            "2. 微表情模板句必须整句重写，尽量换成动作、对白、现场反应，而不是同义替换。",
            "3. 抽象情绪标签如果一连两个以上，要落回动作、对白或场上变化，不要继续堆‘冷静、克制、危险、深邃、压迫感’这种词。",
            "4. 假细节句不要保留‘指尖微蜷、喉结滚动、呼吸微滞、眸光微闪、太阳穴轻跳’这种部位模板，改成真正有用的动作，或者直接删。",
            "5. 过度文学化的句子，比如硬拔高气氛、硬造比喻、硬写‘命运的齿轮’这类，可以直接删或改回朴素表达。",
            "6. 如果上一句已经把情绪或局势说明白了，后一句只是重复解释、重复渲染，可以直接删。",
            "7. 句子宁可更短更直，也不要更华丽。",
            "8. 纯气氛句、空镜头句、只负责渲染没有承载信息的句子，可以直接删掉。",
            "9. 禁止同义替换式去味。比如‘全场死寂’不能只改成‘没人说话’，‘骨节因用力而泛白’不能只改成‘骨节泛白’。",
            "10. 如果连续几句形成标准冲突模板，优先删掉‘众人震惊’‘旁人议论’这类凑节奏的句子，只保留真正推进剧情的动作、对白和结果。",
            "11. 如果一句话只是问题轻，可以只削掉AI腔，不必重写得太猛。",
            "12. 直白句、功能句、常见过渡句，只要信息清楚、动作清楚，就不要硬磨成文案腔。",
            "13. 题材套话优先改成具体可见的信息。不要老写‘居高临下地看着她’‘领口洗得发白’‘一袭白衣’‘白衣猎猎作响’，要换成当下这个人真正的站位、衣料、磨损、动作或现场效果。",
            "14. 像‘台下安静下来’‘连嗑瓜子的人都停了动作’这种只负责提示围观停顿、又不提供新信息的句子，直接删。",
            "15. 像‘手上用了死力气，指甲掐进肉里’这种局部受力痕迹模板，也和‘指节因用力而泛白’是一类。要改成实际动作结果，比如拽、拖、按、攥着不放，而不是继续写身体小部位受力。",
            "16. 少写‘胸口剧烈起伏’‘衣服随着呼吸上下起伏’‘手指用力抠住纸张边缘’这种假身体反应句。能删就删，能改就改成实际动作结果。",
            "17. 少用‘死死、狠狠、剧烈、用力’这类副词硬压强度。不要把力道和情绪全靠副词顶出来。",
            "18. 严禁错误句横跳。不要把一种坏句改成另一种坏句，比如把‘指节泛白’改成‘指甲掐进肉里’，把‘全场死寂’改成‘台下安静下来’，把‘死死抓着’改成‘狠狠攥着’。",
            "19. 不要老写‘连眼皮都没抬’‘看都没看’‘头也不抬’这种冷淡摆拍短句。人物可以冷淡，但要靠动作、对白、处理方式来体现，不要靠高频模板句。",
            "",
            "【真人感参考】",
            humanStyleGuide,
            "",
            "【输出格式】",
            "- 只输出【需改】句子的改写结果，每行一句。",
            "- 输出行数尽量与【需改】句子数量一致。",
            "- 如果整句应该删除，直接输出【删除】。",
            "- 不要解释，不要加标题，不要把【勿动】句子重写出来。",
            "",
            "【待润色文本】",
            excerptText
        ].join("\n");

        const systemPrompt = "你是网文老编辑。你要识别的是句子层面的AI腔，不只是关键词。只改真正有AI味的句子，没问题的句子一个字都不要动。";

        try {
            const response = await this.api.callLLM(polishPrompt, systemPrompt, {
                temperature: 0.35,
                maxTokens: Math.min(this.getConfiguredMaxTokens(8000), excerptText.length * 2 + 1200),
                timeout: this.getTaskTimeoutMs(300000)
            });
            const rewrittenLines = String(response || "")
                .split(/\r?\n/)
                .map((line) => line.replace(/^【(?:需改|勿动)(?:｜[^】]+)?】/g, "").trim())
                .filter(Boolean);

            if (!rewrittenLines.length) {
                return sourceText;
            }

            const updated = [...segments];
            const weakRewriteEntries = [];
            taintedEntries.forEach((entry, position) => {
                const { index } = entry;
                const rewritten = rewrittenLines[position];
                if (rewritten) {
                    if (this.isWeakAiFlavorRewrite(segments[index], rewritten, entry.reasons)) {
                        weakRewriteEntries.push({
                            ...entry,
                            original: segments[index],
                            rewritten
                        });
                    } else {
                        updated[index] = this.applyAiFlavorRewrite(segments[index], rewritten);
                    }
                }
            });

            if (weakRewriteEntries.length) {
                const strictRewriteMap = await this.rewriteWeakAiFlavorText(weakRewriteEntries);
                weakRewriteEntries.forEach((entry) => {
                    const retryRewrite = strictRewriteMap.get(entry.index) || entry.rewritten;
                    if (this.isWeakAiFlavorRewrite(entry.original, retryRewrite, entry.reasons)) {
                        const safeFallback = this.buildSafeAiFlavorRewriteFallback(entry.original, retryRewrite, entry.reasons);
                        if (safeFallback) {
                            updated[entry.index] = this.applyAiFlavorRewrite(entry.original, safeFallback);
                            return;
                        }
                        updated[entry.index] = this.canDeleteAiFlavorSentence(entry.original, entry.reasons)
                            ? ""
                            : entry.original;
                        return;
                    }
                    updated[entry.index] = this.applyAiFlavorRewrite(entry.original, retryRewrite);
                });
            }

            return updated.join("").replace(/\n{3,}/g, "\n\n").trim();
        } catch (error) {
            return sourceText;
        }
    }

    async rewriteWeakAiFlavorText(entries = []) {
        if (!Array.isArray(entries) || !entries.length) {
            return new Map();
        }

        const humanStyleGuide = this.getHumanStyleReferenceGuide();
        const prompt = entries.map((entry, index) => [
            `【第${index + 1}条】`,
            `原句：${String(entry.original || "").trim()}`,
            `失败改法：${String(entry.rewritten || "").trim()}`,
            `问题：${(entry.reasons || []).join("、") || "同义替换式去味"}`
        ].join("\n")).join("\n\n");

        const userPrompt = [
            "下面这些句子第一次去AI味失败了，问题是只是换了个说法，AI腔还在。",
            "",
            "处理规则：",
            "1. 纯气氛句、空镜头句、没有承载信息的句子，直接输出【删除】。",
            "2. 像‘全场死寂 -> 没人说话’这种同义降级是不合格的。",
            "3. 像‘骨节因用力而泛白 -> 骨节泛白’这种保留同一部位模板的不合格，要改成动作、反应，或者直接删。",
            "4. 像‘嘴角勾起一抹冷笑’可以改成‘他笑了笑’这种更自然的写法。",
            "5. ‘冷静、克制、危险、压迫感’这种情绪标签串不能原样保留，必须落地。",
            "6. ‘指尖微蜷、喉结滚动、呼吸微滞、眸光微闪、太阳穴轻跳’这类假细节不能继续保留部位模板。",
            "7. ‘命运的齿轮再次咬合’‘空气里浮着无形的压迫’这类过度文学化句子，优先删或改朴素。",
            "8. 如果几句连起来像‘气氛凝固-众人震惊-主角冷静开口-对方恼羞成怒-旁人议论’这种标准冲突模板，优先删掉凑套路感的环节。",
            "9. 每条只输出一个最终结果，每行一条，不要解释。",
            "10. 直白、顺口、带一点网文口语感也可以，不要硬修成精修文案。",
            "11. 题材套话也不合格。不要把句子改回‘居高临下’‘领口洗得发白’‘一袭白衣’‘衣袂翻飞’这一类预制描写。",
            "12. 像‘台下安静下来’‘连嗑瓜子的人都停了动作’这种围观停顿句，优先直接删，不要改成另一种围观静场句。",
            "13. 像‘手上用了死力气，指甲掐进肉里’这种局部受力痕迹句，也不合格。不要把‘指节泛白’换成同类的‘指甲掐进肉里’‘后槽牙咬紧’‘手背青筋暴起’。",
            "14. 像‘胸口剧烈起伏’‘衣服随着呼吸上下起伏’‘手指用力抠住纸张边缘’这种句子，也不要只换个近义说法，要么删掉，要么改成真实动作结果。",
            "15. 不要把‘死死抓着’改成‘狠狠攥着’‘用力抓着’这种同类强度副词句。",
            "16. 不能把一种错误句改成另一种错误句。只要还落在任何坏句家族里，就算改写失败。",
            "17. 不要把‘连眼皮都没抬’改成‘看都没看’‘头也不抬’‘眼皮都没掀一下’这种同一家族的冷淡摆拍句。",
            "",
            "真人感参考：",
            humanStyleGuide,
            "",
            prompt
        ].join("\n");

        const systemPrompt = "你是苛刻的网文编辑。你不接受同义替换式去AI味。要么改出自然动作，要么直接删掉。";

        try {
            const response = await this.api.callLLM(userPrompt, systemPrompt, {
                temperature: 0.25,
                maxTokens: Math.min(this.getConfiguredMaxTokens(4000), prompt.length * 2 + 800),
                timeout: this.getTaskTimeoutMs(180000)
            });
            const lines = String(response || "")
                .split(/\r?\n/)
                .map((line) => line.replace(/^\d+[.、]\s*/, "").replace(/^【第\d+条】/, "").trim())
                .filter(Boolean);
            return new Map(entries.map((entry, index) => [entry.index, lines[index] || entry.rewritten]));
        } catch (_error) {
            return new Map(entries.map((entry) => [entry.index, entry.rewritten]));
        }
    }

    applyAiFlavorRewrite(original, rewritten) {
        const trimmed = String(rewritten || "").trim();
        if (!trimmed || /^【?删除】?$/.test(trimmed)) {
            return "";
        }
        return this.preserveSentenceEnding(original, trimmed);
    }

    stripAiFlavorFragmentsFromSentence(sentence, reasons = []) {
        let text = String(sentence || "");
        if (!text) {
            return "";
        }

        const shouldStrip = (pattern) => Array.isArray(reasons) && reasons.some((item) => pattern.test(String(item || "")));
        if (shouldStrip(/冷淡摆拍模板/)) {
            text = text.replace(/(?:，|,)?\s*((连)?眼皮都没抬|眼皮都没掀(?:一下)?|看都没看|头也不抬|连头都没抬|连眼都没抬|连个眼神都没给|连余光都没分过去|连眼风都没扫过去)/g, "");
        }
        if (shouldStrip(/呼吸起伏模板/)) {
            text = text
                .replace(/(?:，|,)?\s*(胸口|胸膛|胸脯)(?:剧烈|明显|轻轻|微微)?起伏/g, "")
                .replace(/(衣襟|衣料|衣服|褂子|蓝布褂子|身上那件[^，。；！？\n]{0,12})(?:随着呼吸|随呼吸)(?:上下起伏|起伏)/g, "$1");
        }
        if (shouldStrip(/局部抠抓模板/)) {
            text = text.replace(/(?:，|,)?\s*(手指|指尖|手)(?:用力|死死|狠狠)?(?:抠住|扣住|攥住|抓住|捏住)(?:纸张边缘|纸页边缘|边缘|衣角|袖口|桌角|门框|杯沿)/g, "");
        }
        if (shouldStrip(/用力痕迹模板/)) {
            text = text
                .replace(/(?:，|,)?\s*(手上|手里|掌心)[^，。；！？\n]{0,6}(用了死力气|使了死劲|下了狠劲)/g, "")
                .replace(/(?:，|,)?\s*(指甲|指节|骨节|牙关|后槽牙|手背)[^，。；！？\n]{0,12}(掐进|陷进|嵌进|泛白|发白|绷紧|暴起|咬紧|发酸)(?:[^，。；！？\n]{0,10}(肉里|掌心|皮肉))?/g, "");
        }
        if (shouldStrip(/硬压强度词/)) {
            text = text.replace(/(死死|狠狠|剧烈|用力|拼命|死命)(?=(抓着|抓住|攥着|攥住|按着|按住|盯着|瞪着|咬着|咬住|抠住|扣住|拽着|扯着|起伏|喘息|呼吸))/g, "");
        }
        if (shouldStrip(/围观停顿模板/)) {
            text = text.replace(/(?:，|,)?\s*((台下|场下|人群|众人|周围|围观的人|围观者|旁边的人)[^，。；！？\n]{0,12}(安静下来|静下来|停了动作|停下动作|都停了动作|齐齐停住|全停了下来|都停下了手里的动作)|连[^，。；！？\n]{0,12}的人都停了动作)/g, "");
        }

        text = text
            .replace(/[，,]{2,}/g, "，")
            .replace(/^[，,\s]+|[，,\s]+$/g, "")
            .replace(/，([。！？])/g, "$1")
            .replace(/([。！？]){2,}/g, "$1")
            .trim();

        return text;
    }

    buildSafeAiFlavorRewriteFallback(original, rewritten, reasons = []) {
        const candidates = [rewritten, original]
            .map((item) => this.stripAiFlavorFragmentsFromSentence(item, reasons))
            .filter(Boolean);

        for (const candidate of candidates) {
            if (!this.collectAiRewriteBlockingSignals(candidate).length) {
                return candidate;
            }
        }
        return "";
    }

    isWeakAiFlavorRewrite(original, rewritten, reasons = []) {
        const originalText = String(original || "").trim();
        const rewrittenText = String(rewritten || "").trim();
        if (!rewrittenText || /^【?删除】?$/.test(rewrittenText)) {
            return false;
        }

        const bodyPartPattern = /(嘴角|唇角|眼神|目光|瞳孔|喉结|指节|骨节|下颌|眉梢|神情)/;
        const bodyStatePattern = /(泛白|发白|勾起|上扬|冷笑|闪过|流露|滚动|收缩)/;
        const fakeDetailPartPattern = /(指尖|指腹|喉结|呼吸|眸光|目光|太阳穴|后槽牙|肩线|脊背|手背|眼尾)/;
        const fakeDetailStatePattern = /(微蜷|滚动|微滞|微闪|轻跳|绷紧|发紧|紧绷|一跳)/;
        const forceTracePattern = /((手上|手里|掌心)[^。！？\n]{0,6}(用了死力气|使了死劲|下了狠劲))|((指甲|指节|骨节|牙关|后槽牙|手背)[^。！？\n]{0,12}(掐进|陷进|嵌进|泛白|发白|绷紧|暴起|咬紧|发酸))/;
        const breathMotionPattern = /((胸口|胸膛|胸脯)[^。！？\n]{0,8}(剧烈|明显|轻轻|微微)?[^。！？\n]{0,6}(起伏|上下起伏))|((衣襟|衣料|衣服|褂子|蓝布褂子|身上那件[^。！？\n]{0,12})[^。！？\n]{0,10}(随着呼吸|随呼吸)[^。！？\n]{0,6}(起伏|上下起伏))/;
        const fingerGripPattern = /((手指|指尖|手)[^。！？\n]{0,8}(用力|死死|狠狠)?[^。！？\n]{0,8}(抠住|扣住|攥住|抓住|捏住)[^。！？\n]{0,12}(纸张边缘|纸页边缘|边缘|衣角|袖口|桌角|门框|杯沿))/;
        const hardForceAdverbPattern = /(死死|狠狠|剧烈|用力|拼命|死命)[^。！？\n]{0,8}(抓着|抓住|攥着|攥住|按着|按住|盯着|瞪着|咬着|咬住|抠住|扣住|拽着|扯着|起伏|喘息|呼吸)/;
        const dismissivePosePattern = /((连)?眼皮都没抬|眼皮都没掀(?:一下)?|看都没看|头也不抬|连头都没抬|连眼都没抬|连个眼神都没给|连余光都没分过去|连眼风都没扫过去)/;
        const atmospherePattern = /(安静|寂静|死寂|沉默|没人说话|没有人说话|鸦雀无声|落针可闻|空气|时间|四周|全场|仿佛|似乎)/;
        const literaryPattern = /(命运的齿轮|无形的(?:压迫|巨手)|空气里[^。！？\n]{0,12}(压迫|冷意|危险)|夜色[^。！？\n]{0,12}(吞没|漫过)|沉默[^。！？\n]{0,12}(漫开|席卷)|压迫感[^。！？\n]{0,12}(铺开|漫开)|平整如镜|月光下[^。！？\n]{0,12}反射出[^。！？\n]{0,6}(寒光|冷光))/;
        const casualActionPattern = /(姿势|动作)[^。！？\n]{0,8}(极其|格外|十分|异常|过分)?[^。！？\n]{0,8}(随意|漫不经心|轻飘飘)[^。！？\n]{0,18}(像是|像|到了极点|到了极致)/;
        const emotionLabelWords = this.getAiEmotionLabelWords();

        if (/(骨节|指节)/.test(originalText) && /(骨节|指节)/.test(rewrittenText)) {
            return true;
        }
        if (bodyPartPattern.test(originalText) && bodyPartPattern.test(rewrittenText) && bodyStatePattern.test(rewrittenText)) {
            return true;
        }
        if (fakeDetailPartPattern.test(originalText) && fakeDetailPartPattern.test(rewrittenText) && fakeDetailStatePattern.test(rewrittenText)) {
            return true;
        }
        if ((forceTracePattern.test(originalText) || reasons.some((item) => /用力痕迹模板|微表情模板|假细节模板/.test(String(item || ""))))
            && forceTracePattern.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /呼吸起伏模板/.test(String(item || ""))) && breathMotionPattern.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /局部抠抓模板/.test(String(item || ""))) && fingerGripPattern.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /硬压强度词/.test(String(item || ""))) && hardForceAdverbPattern.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /冷淡摆拍模板/.test(String(item || ""))) && dismissivePosePattern.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /凝固停顿|空泛比喻|抽象情绪|镜头切换/.test(String(item || ""))) && atmospherePattern.test(rewrittenText)) {
            return true;
        }
        if (/(全场|空气|时间|四周)/.test(originalText) && /(全场|空气|时间|没人说话|沉默|安静|寂静)/.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /情绪标签堆叠/.test(String(item || ""))) && this.countAiKeywordHits(rewrittenText, emotionLabelWords) >= 2) {
            return true;
        }
        if (reasons.some((item) => /过度文学化/.test(String(item || ""))) && literaryPattern.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /摆拍比喻|空动作总结/.test(String(item || ""))) && casualActionPattern.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /段内重复解释|重复渲染/.test(String(item || ""))) && this.isAiSummaryOrAtmosphereSentence(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /围观停顿模板/.test(String(item || "")))
            && /((台下|场下|人群|众人|周围|围观的人|围观者|旁边的人)[^。！？\n]{0,12}(安静下来|静下来|停了动作|停下动作|都停了动作|齐齐停住|全停了下来))|(连[^。！？\n]{0,12}的人都停了动作)|((大家|众人|周围的人)[^。！？\n]{0,10}(都不说话了|一下子静了))/.test(rewrittenText)) {
            return true;
        }
        if (reasons.some((item) => /标准冲突推进/.test(String(item || ""))) && this.getAiConflictProgressionTag(rewrittenText)) {
            return true;
        }
        if (this.collectAiRewriteBlockingSignals(rewrittenText).length) {
            return true;
        }
        return false;
    }

    canDeleteAiFlavorSentence(sentence, reasons = []) {
        const text = String(sentence || "").trim();
        if (!text) {
            return false;
        }
        if (Array.isArray(reasons) && reasons.some((item) => /冷淡摆拍模板/.test(String(item || "")))) {
            return true;
        }
        if (/[“”「」『』]/.test(text)) {
            return false;
        }
        if (/(说|问|答|喊|骂|叫道|开口)/.test(text)) {
            return false;
        }
        const role = this.classifyAiSentenceRole(text);
        if (role === "action") {
            return false;
        }
        return reasons.some((item) => /凝固停顿|空泛比喻|抽象情绪|镜头切换|假细节模板|过度文学化|段内重复解释|重复渲染|标准冲突推进|围观停顿模板|呼吸起伏模板|局部抠抓模板|硬压强度词/.test(String(item || "")));
    }

    collectAiRewriteBlockingSignals(sentence) {
        const text = String(sentence || "").trim();
        if (!text || /^【?删除】?$/.test(text)) {
            return [];
        }

        const blockingLabels = new Set([
            "微表情模板",
            "假细节模板",
            "用力痕迹模板",
            "呼吸起伏模板",
            "局部抠抓模板",
            "硬压强度词",
            "冷淡摆拍模板",
            "过度文学化",
            "摆拍比喻",
            "空动作总结",
            "凝固停顿模板",
            "围观停顿模板",
            "情绪标签堆叠",
            "万能气息句"
        ]);
        const hits = [];

        this.getAiStructuralPatterns().forEach((rule) => {
            if (rule?.label && blockingLabels.has(rule.label) && rule.pattern?.test?.(text)) {
                hits.push(rule.label);
            }
        });

        const suspiciousHit = this.getAiSuspiciousPatterns().some((pattern) => {
            try {
                return new RegExp(pattern).test(text);
            } catch (_error) {
                return false;
            }
        });
        if (suspiciousHit) {
            hits.push("模板句式");
        }

        if (this.countAiKeywordHits(text, this.getAiEmotionLabelWords()) >= 2) {
            hits.push("情绪标签堆叠");
        }
        if (this.countAiKeywordHits(text, this.getAiWeakModifierWords()) >= 3 && text.length >= 16) {
            hits.push("副词过密");
        }

        return Array.from(new Set(hits)).slice(0, 6);
    }

    collectAiSentenceSignals(sentence, config = {}) {
        const text = String(sentence || "").trim();
        if (!text) {
            return { flagged: false, score: 0, reasons: [] };
        }

        const role = this.classifyAiSentenceRole(text);

        const whitelist = Array.isArray(config.whitelist) ? config.whitelist : [];
        if (whitelist.some((item) => item && text.includes(item))) {
            return { flagged: false, score: 0, reasons: [] };
        }

        const blacklistHits = (Array.isArray(config.blacklist) ? config.blacklist : [])
            .filter((item) => item && text.includes(item));
        const targetHits = (Array.isArray(config.targetWords) ? config.targetWords : [])
            .filter((item) => item && text.includes(item))
            .slice(0, 4);
        const reasons = [...blacklistHits, ...targetHits];
        let score = blacklistHits.length ? 4 + blacklistHits.length : 0;
        score += targetHits.length * 2;

        (Array.isArray(config.suspiciousPatterns) ? config.suspiciousPatterns : []).forEach((pattern) => {
            if (pattern?.test?.(text)) {
                score += 2;
                reasons.push("模板句式");
            }
        });

        (Array.isArray(config.structuralPatterns) ? config.structuralPatterns : []).forEach((rule) => {
            if (rule?.pattern?.test?.(text)) {
                score += Number(rule.score || 1);
                reasons.push(rule.label || "结构可疑");
            }
        });

        const weakModifierHits = this.countAiKeywordHits(text, config.weakModifierWords || []);
        if (weakModifierHits >= 2 && text.length >= 18) {
            score += 1;
            reasons.push("副词过密");
        }

        const abstractHits = this.countAiKeywordHits(text, config.abstractWords || []);
        if (abstractHits >= 2 && text.length >= 18) {
            score += 1;
            reasons.push("抽象判断");
        }

        const emotionLabelHits = this.countAiKeywordHits(text, config.emotionLabelWords || []);
        if (emotionLabelHits >= 2 && role !== "dialogue") {
            score += emotionLabelHits >= 3 ? 2 : 1;
            reasons.push("情绪标签堆叠");
        }

        if (this.getAiOpeningTemplate(text)) {
            score += 1;
            reasons.push("段首模板");
        }

        if (this.isAiRedundantFollowup(text, config.previousSentence, {
            abstractWords: config.abstractWords,
            emotionLabelWords: config.emotionLabelWords
        })) {
            score += 1;
            reasons.push(role === "atmosphere" ? "重复渲染" : "段内重复解释");
        }

        if (config.conflictProgressionReason) {
            score += 1;
            reasons.push(config.conflictProgressionReason);
        }

        if (/，/.test(text) && text.length >= 32 && reasons.length >= 2) {
            score += 1;
            reasons.push("长句堆砌");
        }

        const normalizedReasons = Array.from(new Set(reasons)).slice(0, 6);
        if (this.isPlainHumanNarrationSentence(text, role) && this.isWeakOnlyAiDetection(normalizedReasons)) {
            return { flagged: false, score: 0, reasons: [] };
        }

        return {
            flagged: score >= 2,
            score,
            reasons: normalizedReasons
        };
    }

    countAiKeywordHits(text, keywords = []) {
        const normalized = String(text || "");
        const hits = new Set();
        (keywords || []).forEach((word) => {
            if (word && normalized.includes(word)) {
                hits.add(word);
            }
        });
        return hits.size;
    }

    getAiStructuralPatterns() {
        return [
            {
                label: "微表情模板",
                score: 2,
                pattern: /(嘴角|唇角|眼神|目光|瞳孔|喉结|指节|骨节|下颌|眉梢|神情)[^。！？\n]{0,12}(微微|轻轻|缓缓|淡淡|一抹|勾起|上扬|闪过|流露|复杂|深邃|锐利|意味不明|泛白|发白)/
            },
            {
                label: "空泛比喻",
                score: 1,
                pattern: /(像|仿佛|如同)[^。！？\n]{0,18}(一般|一样|似的|般)/
            },
            {
                label: "摆拍比喻",
                score: 2,
                pattern: /(姿势|动作)[^。！？\n]{0,8}(极其|格外|十分|异常|过分)?[^。！？\n]{0,8}(随意|漫不经心|轻飘飘)[^。！？\n]{0,18}(像是|像)[^。！？\n]{0,24}(驱赶|拍苍蝇|赶蚊子|拂开|挥开)/
            },
            {
                label: "凝固停顿模板",
                score: 2,
                pattern: /(空气|时间|四周|全场)[^。！？\n]{0,12}(凝固|停住|停滞|静止|死寂|安静)/
            },
            {
                label: "围观停顿模板",
                score: 2,
                pattern: /((台下|场下|人群|众人|周围|围观的人|围观者|旁边的人)[^。！？\n]{0,12}(安静下来|静下来|停了动作|停下动作|都停了动作|齐齐停住|全停了下来|都停下了手里的动作))|(连[^。！？\n]{0,12}的人都停了动作)/
            },
            {
                label: "抽象情绪模板",
                score: 1,
                pattern: /(心头一|心下一|不由得|无法用言语形容|说不清|某个地方|意味不明|不容置疑|异常清晰|显得格外)/
            },
            {
                label: "假细节模板",
                score: 2,
                pattern: /(指尖|指腹|喉结|呼吸|眸光|目光|太阳穴|后槽牙|肩线|脊背|手背|眼尾)[^。！？\n]{0,10}(微蜷|滚动|微滞|微闪|轻跳|绷紧|发紧|紧绷|一跳)/
            },
            {
                label: "用力痕迹模板",
                score: 2,
                pattern: /((手上|手里|掌心)[^。！？\n]{0,6}(用了死力气|使了死劲|下了狠劲)[^。！？\n]{0,18}(指甲|指节|骨节|牙关|后槽牙|手背)?)|((指甲|指节|骨节|牙关|后槽牙|手背)[^。！？\n]{0,12}(掐进|陷进|嵌进|泛白|发白|绷紧|暴起|咬紧|发酸)[^。！？\n]{0,10}(肉里|掌心|皮肉)?)/
            },
            {
                label: "呼吸起伏模板",
                score: 2,
                pattern: /((胸口|胸膛|胸脯)[^。！？\n]{0,8}(剧烈|明显|轻轻|微微)?[^。！？\n]{0,6}(起伏|上下起伏))|((衣襟|衣料|衣服|褂子|蓝布褂子|身上那件[^。！？\n]{0,12})[^。！？\n]{0,10}(随着呼吸|随呼吸)[^。！？\n]{0,6}(起伏|上下起伏))/
            },
            {
                label: "局部抠抓模板",
                score: 2,
                pattern: /((手指|指尖|手)[^。！？\n]{0,8}(用力|死死|狠狠)?[^。！？\n]{0,8}(抠住|扣住|攥住|抓住|捏住)[^。！？\n]{0,12}(纸张边缘|纸页边缘|边缘|衣角|袖口|桌角|门框|杯沿))/
            },
            {
                label: "硬压强度词",
                score: 1,
                pattern: /(死死|狠狠|剧烈|用力|拼命|死命)[^。！？\n]{0,8}(抓着|抓住|攥着|攥住|按着|按住|盯着|瞪着|咬着|咬住|抠住|扣住|拽着|扯着|起伏|喘息|呼吸)/
            },
            {
                label: "冷淡摆拍模板",
                score: 2,
                pattern: /((连)?眼皮都没抬|眼皮都没掀(?:一下)?|看都没看|头也不抬|连头都没抬|连眼都没抬|连个眼神都没给|连余光都没分过去|连眼风都没扫过去)/
            },
            {
                label: "情绪标签堆叠",
                score: 1,
                pattern: /(冷静|克制|复杂|危险|深邃|锐利|压迫感|意味不明|不容置疑|沉稳|阴冷|森然)[^。！？\n]{0,6}(冷静|克制|复杂|危险|深邃|锐利|压迫感|意味不明|不容置疑|沉稳|阴冷|森然)/
            },
            {
                label: "万能气息句",
                score: 1,
                pattern: /(带着|透着|散发着)[^。！？\n]{0,12}(气息|意味|冷意|危险|压迫感|锋芒|情绪)/
            },
            {
                label: "过度文学化",
                score: 2,
                pattern: /(命运的齿轮|无形的(?:压迫|巨手)|空气里[^。！？\n]{0,12}(压迫|冷意|危险)|夜色[^。！？\n]{0,12}(吞没|漫过)|沉默[^。！？\n]{0,12}(漫开|席卷)|压迫感[^。！？\n]{0,12}(铺开|漫开)|平整如镜|月光下[^。！？\n]{0,12}反射出[^。！？\n]{0,6}(寒光|冷光))/
            },
            {
                label: "空动作总结",
                score: 2,
                pattern: /(动作|姿势)[^。！？\n]{0,8}(漫不经心|随意|轻飘飘|慵懒)[^。！？\n]{0,8}(到了极点|到了极致|得很|至极)/
            },
            {
                label: "镜头切换腔",
                score: 1,
                pattern: /(这一刻|下一刻|与此同时|只见|顿时|旋即|顷刻间)/
            },
            {
                label: "空泛转折",
                score: 1,
                pattern: /不是[^。！？\n]{0,20}而是[^。！？\n]{0,20}/
            }
        ];
    }

    getAiWeakModifierWords() {
        return [
            "微微", "缓缓", "轻轻", "淡淡", "静静", "死死", "直直", "冷冷",
            "慢慢", "悄悄", "无声", "不由得", "仿佛", "似乎"
        ];
    }

    getAiAbstractWords() {
        return [
            "复杂", "深邃", "锐利", "意味不明", "不容置疑", "异常清晰",
            "某种", "某个地方", "无法形容", "说不清", "压迫感", "气息"
        ];
    }

    getAiEmotionLabelWords() {
        return [
            "冷静", "克制", "复杂", "危险", "深邃", "锐利",
            "压迫感", "意味不明", "不容置疑", "沉稳", "阴冷", "森然"
        ];
    }

    getHumanStyleReferenceGuide() {
        return [
            "1. 真人网文常用‘主语+动作+结果’来推进，不会每句都先铺气氛再总结情绪。",
            "2. 对话冲突主要靠说了什么、怎么回、谁占上风，不要乱补‘全场一静’‘众人都惊了’。",
            "3. 战斗句优先写看得见的动作：挥、挡、退、扑、刺、砸、拉、站、看，不要写成大段玄乎感觉。",
            "4. 允许句子普通，甚至有一点直白重复。人写文会反复用‘看、走、说、笑、皱眉、点头’，不要为了避重就换成雕花句。",
            "5. 有信息的设定交代不要乱删。像等级、资源、规则、身份、利害判断，只要说得清楚，就属于真人常见写法。",
            "6. 情绪最好落在反应上：脸色变了、停了一下、没接话、往后退、直接骂回去，而不是‘压迫感、危险、深邃、宠溺满溢’。",
            "7. 真人文允许少量感叹、短句、反问，但不要连着堆成朗诵腔。",
            "8. 改写后的句子要像作者顺手写出来的，不要像精修文案。",
            "9. 写紧张、发狠、压迫时，优先写动作结果和场上变化。少写胸口起伏、衣料随呼吸起伏、手指抠边、死死抓着这类模板。"
        ].join("\n");
    }

    getAiOpeningTemplate(text) {
        const match = String(text || "").trim().match(/^(这一刻|下一刻|与此同时|只见|顿时|旋即|顷刻间|一时间|此刻|那一刻)/);
        return match ? match[1] : "";
    }

    isWeakOnlyAiDetection(reasons = []) {
        const list = Array.isArray(reasons) ? reasons.filter(Boolean) : [];
        if (!list.length) {
            return false;
        }
        const strongPattern = /(微表情模板|假细节模板|用力痕迹模板|呼吸起伏模板|局部抠抓模板|硬压强度词|冷淡摆拍模板|过度文学化|摆拍比喻|空动作总结|凝固停顿模板|围观停顿模板|情绪标签堆叠|标准冲突推进|重复渲染|段内重复解释)/;
        return !list.some((item) => strongPattern.test(String(item || "")));
    }

    isPlainHumanNarrationSentence(sentence, role = "") {
        const text = String(sentence || "").trim();
        if (!text) {
            return false;
        }
        const sentenceRole = role || this.classifyAiSentenceRole(text);
        if (sentenceRole === "dialogue" || sentenceRole === "atmosphere" || sentenceRole === "summary") {
            return false;
        }
        if (/(空气|时间|四周|全场|命运的齿轮|压迫感|无形的(?:压迫|巨手)|深邃|危险|意味不明|不容置疑)/.test(text)) {
            return false;
        }
        const actionVerbPattern = /(走|跑|推|拉|抬|拿|伸手|抬眼|转身|站起|坐下|后退|上前|点头|摇头|笑了笑|盯着|看向|握住|松开|抿了抿|皱了皱眉|冲|扑|刺|砸|挥|落下|掀开|按住|拽|扶|躲|退开|抬手|抬脚|开门|关门|回头|停下)/;
        const concreteNounPattern = /(手|脚|门|桌|椅|刀|剑|鞭|杯|茶|血|山|石|地|台|门口|院子|床|窗|信|纸|衣袖|袖子|腰|肩|脸|眉|眼)/;
        if (actionVerbPattern.test(text)) {
            return true;
        }
        return text.length <= 28 && concreteNounPattern.test(text) && !/(像|仿佛|如同)/.test(text);
    }

    classifyAiSentenceRole(sentence) {
        const text = String(sentence || "").trim();
        if (!text) {
            return "empty";
        }
        if (/[“”「」『』]/.test(text)) {
            return "dialogue";
        }
        if (/^(这|那|此|她知道|他知道|她明白|他明白|她很清楚|他很清楚|她意识到|他意识到|这意味着|这说明|显然|无疑|可见)/.test(text)
            || /(说明|意味着|代表着|足以证明|显得格外)/.test(text)) {
            return "summary";
        }
        if (/(空气|时间|四周|全场|夜色|风里|沉默|寂静|压迫感|气息|氛围)/.test(text)
            && !/(走|跑|推|拉|抬|拿|说|问|答|笑|哭|转身|站|坐|看|伸手)/.test(text)) {
            return "atmosphere";
        }
        if (/(走|跑|推|拉|抬|拿|伸手|抬眼|转身|站起|坐下|后退|上前|点头|摇头|笑了笑|看向|盯着)/.test(text)) {
            return "action";
        }
        return "narration";
    }

    isAiSummaryOrAtmosphereSentence(sentence) {
        const role = this.classifyAiSentenceRole(sentence);
        return role === "summary" || role === "atmosphere";
    }

    isAiRedundantFollowup(sentence, previousSentence, config = {}) {
        const currentText = String(sentence || "").trim();
        const previousText = String(previousSentence || "").trim();
        if (!currentText || !previousText) {
            return false;
        }

        const currentRole = this.classifyAiSentenceRole(currentText);
        const previousRole = this.classifyAiSentenceRole(previousText);
        const abstractHits = this.countAiKeywordHits(currentText, config.abstractWords || []);
        const emotionHits = this.countAiKeywordHits(currentText, config.emotionLabelWords || []);
        const explanationLead = /^(这|那|此|她知道|他知道|她明白|他明白|她很清楚|他很清楚|她意识到|他意识到|这意味着|这说明|显然|无疑|可见|一时间|此刻)/;
        const atmosphereWords = /(空气|时间|四周|全场|沉默|寂静|压迫|气息|氛围|夜色)/;

        if ((currentRole === "summary" || currentRole === "atmosphere")
            && (previousRole === "dialogue" || previousRole === "action")) {
            return explanationLead.test(currentText) || abstractHits >= 1 || emotionHits >= 2;
        }

        if (currentRole === "atmosphere" && previousRole === "atmosphere") {
            return atmosphereWords.test(currentText) && atmosphereWords.test(previousText);
        }

        return false;
    }

    getAiConflictProgressionTag(sentence) {
        const text = String(sentence || "").trim();
        if (!text) {
            return "";
        }
        if (/(全场|空气|四周|气氛|死寂|寂静|沉默|安静|凝固|落针可闻|鸦雀无声)/.test(text)) {
            return "atmosphere";
        }
        if (/((台下|场下|人群|众人|周围|围观的人|围观者|旁边的人)[^。！？\n]{0,12}(安静下来|静下来|停了动作|停下动作|都停了动作|齐齐停住|全停了下来))|(连[^。！？\n]{0,12}的人都停了动作)/.test(text)) {
            return "crowd";
        }
        if (/(众人|所有人|人群|周围|在场|台下|旁人|围观|邻居|弟子|内门弟子)[^。！？\n]{0,16}(震惊|愣住|怔住|倒吸一口凉气|瞪大了眼|哗然|惊呼|面面相觑|瞪出眼眶|吓傻)/.test(text)) {
            return "crowd";
        }
        if (/((冷静|平静|淡淡|不紧不慢|波澜不惊|慢条斯理|轻飘飘)[^。！？\n]{0,12}(开口|说道|说|问|答|挥|挥手|挥了挥|抬手))|((开口|说道|说|问|答|挥|挥手|挥了挥|抬手)[^。！？\n]{0,12}(冷静|平静|淡淡|不紧不慢|波澜不惊|慢条斯理|轻飘飘))|(^云清鸢没理他们[。！？]?$)/.test(text)) {
            return "composure";
        }
        if (/(恼羞成怒|气急败坏|尖声|怒道|咬牙|脸色一变|脸色发白|脸色铁青|失声|怒极反笑|两腿发软|牙关打颤|膝盖一软|瘫坐|哭腔|抖得像|吓傻了|往后缩)/.test(text)) {
            return "collapse";
        }
        if (/((旁人|周围|人群|邻居|有人|众人|台下|苏小瓜)[^。！？\n]{0,18}(议论|窃窃私语|低声议论|七嘴八舌|炸开了锅|指指点点|嘟囔|喃喃))|(((嘴里|低声|忍不住|不停地)[^。！？\n]{0,8}(嘟囔|喃喃)))/.test(text)) {
            return "bystander";
        }
        return "";
    }

    detectAiConflictProgressionSequence(segments = []) {
        const flagged = new Map();
        if (!Array.isArray(segments) || segments.length < 4) {
            return flagged;
        }

        const windowSize = 64;
        for (let start = 0; start < segments.length; start += 1) {
            const entries = [];
            for (let index = start; index < Math.min(segments.length, start + windowSize); index += 1) {
                const tag = this.getAiConflictProgressionTag(segments[index]);
                if (tag) {
                    entries.push({ index, tag });
                }
            }
            if (entries.length < 4) {
                continue;
            }
            const uniqueTags = new Set(entries.map((item) => item.tag));
            const hasAudience = uniqueTags.has("crowd") || uniqueTags.has("bystander");
            if (uniqueTags.has("atmosphere") && uniqueTags.has("composure") && uniqueTags.has("collapse") && hasAudience) {
                entries.forEach(({ index, tag }) => {
                    if (tag === "atmosphere" || tag === "crowd" || tag === "bystander") {
                        flagged.set(index, "标准冲突推进");
                    }
                });
            }
        }

        return flagged;
    }

    async requestJSONArray(systemPrompt, userPrompt, options) {
        const raw = await this.api.callLLM(userPrompt, systemPrompt, options);
        let parsed = Utils.coerceJSONArray(Utils.parseJsonResponse(raw) ?? raw);
        if (!Array.isArray(parsed)) {
            const repaired = await this.repairJSONArrayResponse(raw, options);
            parsed = Utils.coerceJSONArray(Utils.parseJsonResponse(repaired) ?? repaired);
        }
        if (!Array.isArray(parsed)) {
            const rawPreview = String(raw || "").replace(/\s+/g, " ").slice(0, 300);
            Utils.log(`JSON 鏁扮粍瑙ｆ瀽澶辫触锛屽師濮嬭繑鍥炵墖娈碉細${rawPreview || "绌哄搷搴?}`, "error");
            throw new Error("AI 杩斿洖鍐呭鏃犳硶瑙ｆ瀽涓?JSON 鏁扮粍锛岃閲嶈瘯涓€娆°€?);
        }
        return parsed;
    }

    async repairJSONArrayResponse(rawText, options = {}) {
        const raw = String(rawText || "").trim();
        if (!raw) {
            return raw;
        }

        const repairSystemPrompt = [
            "浣犳槸涓€涓?JSON 淇鍣ㄣ€?,
            "浣犵殑鍞竴浠诲姟鏄妸鐢ㄦ埛缁欎綘鐨勫唴瀹规暣鐞嗘垚鍚堟硶鐨?JSON 鏁扮粍銆?,
            "涓嶈琛ュ墽鎯咃紝涓嶈鏀瑰瓧娈靛惈涔夛紝涓嶈瑙ｉ噴锛屼笉瑕佸姞 markdown 浠ｇ爜鍧椼€?,
            "濡傛灉鍘熸枃閲屾湁澶氫綑璇存槑銆佸墠瑷€銆佸悗璁帮紝鍙繚鐣?JSON 鏁扮粍鏈綋銆?,
            "濡傛灉鏈夊熬閫楀彿銆佷腑鏂囧紩鍙枫€佸寘瑁规枃瀛楋紝璇蜂慨姝ｆ垚鏍囧噯 JSON銆?
        ].join("\n");

        const repairUserPrompt = [
            "璇锋妸涓嬮潰鍐呭淇鎴愬悎娉曠殑 JSON 鏁扮粍锛屽彧杈撳嚭鏁扮粍鏈綋锛?,
            raw
        ].join("\n\n");

        return this.api.callLLM(repairUserPrompt, repairSystemPrompt, {
            temperature: 0.1,
            maxTokens: Math.max(2000, Math.min(this.getConfiguredMaxTokens(12000), raw.length * 2)),
            timeout: Math.max(Number(options?.timeout || 0), this.getTaskTimeoutMs(180000)),
            retryCount: 1
        });
    }

    buildGenerationGuards(project, volumeNumber, chapterNumber, chapter = null) {
        const blocks = [];
        const globalSetting = project.global_setting_note || "";
        if (globalSetting) {
            blocks.push(`銆愬叏灞€璁惧畾鎻愰啋銆慭n${globalSetting}`);
        }

        [
            this.buildHiddenSecretGuard(project, chapterNumber),
            this.buildStoryStateGuard(project),
            this.buildNameLockGuard(project),
            this.buildTimelineGuard(project, chapterNumber),
            this.buildForeshadowGuard(project, chapterNumber),
            this.buildSubplotGuard(project),
            this.buildWorldTrackerGuard(project),
            this.buildWorldStateManagerGuard(project, chapterNumber, chapter),
            this.buildGenreProgressGuard(project),
            this.buildPersonalityGuard(project, "", chapterNumber),
            this.buildCharacterCheckerGuard(project),
            this.buildAppearanceGuard(project, "", chapterNumber),
            this.buildDialogueGuard(project, chapterNumber),
            this.buildSnapshotGuard(project, chapterNumber),
            this.buildDynamicStateGuard(project),
            this.buildPlotUnitChapterGuide(project, volumeNumber, chapterNumber, chapter)
        ].filter(Boolean).forEach((block) => blocks.push(block));

        if (volumeNumber) {
            blocks.push(`銆愬嵎杈圭晫瑙勫垯銆戝綋鍓嶅彧鍏佽澶勭悊绗?${volumeNumber} 鍗疯寖鍥村唴鐨勫墽鎯咃紝涓嶈鎻愬墠閫忔敮鍚庣画鍗风殑閲嶈浜嬩欢銆俙);
        }

        return blocks.join("\n\n");
    }

    getAiHighFrequencyWords() {
        return [
            "鍢磋鍕捐捣涓€鎶瑰姬搴?, "鍢磋鍕捐捣涓€鎶?, "鍢磋寰井涓婃壃", "鍕捐捣涓€鎶?, "鍕捐捣涓€涓?,
            "寰笉鍙療鍦?, "寰笉鍙療", "寰笉鍙煡鍦?, "寰笉鍙煡",
            "鐪间腑闂繃涓€涓濈簿鍏?, "鐪间腑闂繃涓€涓濇儕璁?, "鐪间腑闂繃涓€涓?, "鐪间腑闂潃澶嶆潅鐨勫厜鑺?,
            "鐪间腑娴侀湶鍑哄悕涓?, "绗戞剰鏈揪鐪煎簳", "鐪肩娣遍們", "鐪肩閿愬埄", "鐪肩鍧氬畾", "鐪肩鐑垏",
            "鐬冲瓟鍓х儓鏀剁缉", "鐬冲瓟鏀剁缉", "鐬冲瓟鐚涘湴涓€缂?,
            "娣遍們鐨勭湼瀛?, "娣瘨鐨勭湼瀛?, "閿愬埄鐨勭溂鐫?,
            "鑴镐笂娴幇鍑轰竴鎶?, "鑴镐笂鍫嗘弧浜嗙瑧", "鑴镐笂甯︾潃绗戞剰",
            "杞粨鍒嗘槑鐨勪笅棰?, "淇暱鐨勬墜鎸?, "楠ㄨ妭鍒嗘槑鐨勬墜", "鎸囪妭娉涚櫧",
            "寰井鎸戠湁", "鐩厜閲屾涓嶉伄鎺?,
            "鍠夌粨婊氬姩", "鍠夌粨涓婁笅婊氬姩", "鍠夌粨",
            "鑸斾簡鑸斿槾鍞?, "鑸斾簡鑸斿共瑁傜殑鍢村攪", "鑸斾簡鑸斿攪", "鎶夸簡鎶垮攪",
            "鍍忎竴璁伴噸閿?, "鍍忎竴鐩嗗啺姘?, "鍍忎竴鎶婄簿鍑嗙殑鍒诲垁", "鍍忓崈骞村瘨鍐?,
            "鍍忎竴鏍规粴鐑殑閽㈤拡", "鍍忔番浜嗘瘨鐨勫寱棣?, "鍍忎釜鐮村竷濞冨▋鑸鎶介",
            "鍍忓湪鐪嬩竴涓凡缁忔閫忕殑浜?, "鍗存瘮瑗夸集鍒╀簹鐨勫瘨椋庤繕瑕佸啺鍐?,
            "鍢村反寮犲緱鑳藉涓嬩竴涓浮铔?, "鐩存帴鍒哄叆蹇冭剰", "閲嶉噸鐮稿湪蹇冨ご",
            "鏃堕棿浠夸經琚寜涓嬩簡鏆傚仠", "绌烘皵鍑濇粸濡傞搧", "璁╃┖姘旂殑娓╁害閮戒笅闄嶄簡鍑犲害",
            "蹇冮噷鏌愪釜鍦版柟杞緱涓€濉岀硦娑?, "娴戣韩涓婁笅閮芥暎鍙戠潃涓€鑲?,
            "鐮撮绠辫埇鐨勮嵎鑽峰０", "鍖栦綔榻戠矇", "绋冲纾愮煶",
            "甯︾潃涓嶅缃枒鐨?, "鍔涢亾澶у緱鎯婁汉",
            "姝讳竴鑸殑瀵傞潤", "鍏ㄥ満姝诲瘋", "姝诲瘋", "钀介拡鍙椈", "楦﹂泙鏃犲０",
            "蹇冧腑涓€鍑?, "蹇冧腑涓€鍔?, "蹇冧笅浜嗙劧", "蹇冮噷闅愰殣鏈変簡鐚滄祴",
            "鍥涜偄鐧鹃", "褰婚鐨勫啺瀵?, "涓嶆槗瀵熻",
            "澹伴煶涓嶅ぇ", "澹伴煶涓嶉珮", "澹伴煶骞崇洿", "骞抽潤鏃犳尝", "澹伴煶鍚笉鍑烘儏缁?,
            "澹伴煶鍧氬畾", "鍐板喎鐨勫０闊?,
            "鏄惧緱鏈変簺鍏村", "鏄惧緱寮傚父娓呮櫚", "鏃犳硶鐢ㄨ█璇舰瀹?,
            "姝绘鍦?, "缂撶紦鍦拌", "绮惧噯鍦?, "骞抽潤鍦?, "婵€鍔ㄥ湴", "娣℃贰鍦板簲浜嗕竴鍙?,
            "娣簡", "娣潃", "娣瘨", "娑熸吉", "娣遍們", "閿愬埄",
            "鍑濅綇浜?, "鍑濆浐浜?, "鍑濇粸浜?, "鍑濆浐",
            "姣棤寰佸厗", "鎴涚劧鑰屾", "璇濋攱涓€杞?,
            "鍙栬€屼唬涔?, "鍙栬€屼唬涔嬬殑鏄?, "涓嶅缃枒",
            "娉㈡稕姹规秾", "琛屼簯娴佹按", "涓嶅彲浼伴噺",
            "涓嶅崙涓嶄孩", "杩戜箮鍋忔墽",
            "浠ヤ竴绉?, "杩欎笉鏄?..鑰屾槸", "鐩厜鎵繃", "娣卞惛涓€鍙ｆ皵",
            "浠栫殑鍢磋寰井涓婃壃", "浠栫殑琛ㄦ儏鍙樻殫"
        ].sort((a, b) => b.length - a.length);
    }

    getAiSuspiciousPatterns() {
        return [
            "鍢磋[^銆傦紒锛焅\n]{0,12}?(鍕緗涓婃壃|寰笉鍙瘄寰井|闇插嚭|鍕捐捣|寮?",
            "鐪间腑[^銆傦紒锛焅\n]{0,12}?(闂繃|闂潃|娴侀湶|鏈変竴涓潀涓€涓?",
            "鍠夌粨[^銆傦紒锛焅\n]{0,8}?(鍔▅婊殀鍑竱涓€鍔?",
            "(鎸?鍏宠妭|鑺?|鎵嬫寚)[^銆傦紒锛焅\n]{0,8}?(娉涚櫧|棰鍙戠櫧)",
            "鑸斾簡?鑸?鍢村攪",
            "(姝诲瘋|鍏ㄥ満姝诲瘋|钀介拡鍙椈|楦﹂泙鏃犲０|姝讳竴鑸殑瀵傞潤)",
            "(缂撶紦鍦皘寰笉鍙療|寰笉鍙煡|涓嶆槗瀵熻)[^銆傦紒锛焅\n]{0,8}",
            "(鐪肩|鐩厜)[^銆傦紒锛焅\n]{0,12}?(娣遍們|閿愬埄|鐑垏|澶嶆潅)",
            "(鏃堕棿浠夸經琚寜涓嬩簡鏆傚仠|绌烘皵鍑濇粸|浠夸經琚寜涓嬩簡鏆傚仠)"
        ];
    }

    getEffectiveAiWhitelist(project) {
        const projectList = project?.prompt_state?.ai_filter_whitelist;
        if (Array.isArray(projectList) && projectList.length) {
            return projectList;
        }
        return [
            "浠栫瑧浜?,
            "濂圭瑧浜?,
            "浠栫湅鐫€绐楀",
            "濂圭湅鐫€绐楀",
            "鐪嬬潃杩滄柟",
            "鐪嬬潃瀵规柟",
            "娌夐粯浜嗕竴浼?,
            "娌′汉璇磋瘽",
            "灞嬮噷寰堝畨闈?
        ];
    }

    getEffectiveAiBlacklist(project) {
        const projectList = project?.prompt_state?.ai_filter_blacklist;
        if (Array.isArray(projectList) && projectList.length) {
            return projectList;
        }
        return [
            "鎸囪妭娉涚櫧",
            "鍠夌粨婊氬姩",
            "鑸斾簡鑸斿槾鍞?,
            "鍏ㄥ満姝诲瘋",
            "绌烘皵鍑濇粸",
            "鏃堕棿浠夸經琚寜涓嬩簡鏆傚仠",
            "鍍忎竴璁伴噸閿?,
            "鐪间腑闂繃涓€涓?,
            "鍢磋鍕捐捣涓€鎶瑰姬搴?
        ];
    }

    getAiWhitelist(project) {
        const projectList = project?.prompt_state?.ai_filter_whitelist;
        return Array.isArray(projectList) && projectList.length
            ? projectList
            : ["浠栫瑧浜?, "濂圭瑧浜?, "鐪嬬潃绐楀", "鐪嬬潃杩滄柟"];
    }

    getAiBlacklist(project) {
        const projectList = project?.prompt_state?.ai_filter_blacklist;
        return Array.isArray(projectList) && projectList.length
            ? projectList
            : ["鎸囧叧鑺傛硾鐧?, "鍠夌粨婊氬姩", "鑸斾簡鑸斿槾鍞?, "鍏ㄥ満姝诲瘋"];
    }

    splitSentencesForAiFilter(text) {
        const input = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        if (!input) {
            return [""];
        }

        const segments = [];
        let buffer = "";
        for (let index = 0; index < input.length; index += 1) {
            const char = input[index];
            if (char === "\n") {
                if (buffer) {
                    segments.push(buffer);
                    buffer = "";
                }
                segments.push("\n");
                continue;
            }

            buffer += char;
            if (/[。！？!?…]/.test(char)) {
                while (index + 1 < input.length && /[”’"'」』）》】]/.test(input[index + 1])) {
                    index += 1;
                    buffer += input[index];
                }
                segments.push(buffer);
                buffer = "";
            }
        }

        if (buffer) {
            segments.push(buffer);
        }
        return segments.length ? segments : [input];
    }

    preserveSentenceEnding(original, rewritten) {
        const originalText = String(original || "");
        const trimmed = String(rewritten || "").trim();
        if (!trimmed) {
            return original;
        }

        const leading = originalText.match(/^[\t \u3000]*/)?.[0] || "";
        const trailing = originalText.match(/[\t \u3000]*$/)?.[0] || "";
        const originalTrimmed = originalText.trim();
        const match = originalTrimmed.match(/[。！？!?…][”’"'」』）》】]?$/);
        let output = trimmed;
        if (match && !/[。！？!?…][”’"'」』）》】]?$/.test(output)) {
            output = `${output}${match[0]}`;
        }
        return `${leading}${output}${trailing}`;
    }

    buildHiddenSecretGuard(project, chapterNumber) {
        const text = [
            project.outline?.detailed_outline || "",
            project.outline?.user_context || ""
        ].join("\n");
        if (!text) {
            return "";
        }

        const found = [];
        const patterns = [
            /鎻湶鍦ㄧ\s*(\d+)\s*绔?g,
            /鐩村埌绗琝s*(\d+)\s*绔犳墠(?:鎻湶|鐭ラ亾|鍙戠幇)/g,
            /鍦ㄧ\s*(\d+)\s*绔犳彮鏅?g,
            /闅愯棌.*?绗琝s*(\d+)\s*绔?g
        ];

        patterns.forEach((pattern) => {
            for (const match of text.matchAll(pattern)) {
                found.push(Number(match[1]));
            }
        });

        const sensitiveWords = ["鎬€瀛?, "韬笘", "鐪熷疄韬唤", "鍙岄噸韬唤", "绉樺瘑", "闅愯棌"].filter((word) => text.includes(word));
        if (!found.length && !sensitiveWords.length) {
            return "";
        }

        const earliestReveal = found.length ? Math.min(...found) : null;
        const lines = [
            "銆愬墽閫忎笌绉樺瘑淇濇姢銆?,
            "涓ョ鍦ㄦ湭鏄庣‘鍏佽鐨勭珷鑺傛彁鍓嶆彮闇查噸澶х瀵嗐€佺湡瀹炶韩浠姐€佽韩涓栥€佹€€瀛曠瓑淇℃伅銆?
        ];

        if (earliestReveal) {
            lines.push(`妫€娴嬪埌鏈€鏃╂彮闇茶妭鐐瑰彲鑳藉湪绗?${earliestReveal} 绔犮€俙);
            if (chapterNumber && chapterNumber < earliestReveal) {
                lines.push(`褰撳墠鏄 ${chapterNumber} 绔狅紝鍦ㄦ彮闇茶妭鐐瑰墠鍙兘淇濇寔妯＄硦鏆楃ず锛岀姝㈢‘璁ゆ€ф彮绀恒€俙);
            }
        }
        if (sensitiveWords.length) {
            lines.push(`鏁忔劅璁惧畾鍏抽敭璇嶏細${sensitiveWords.join("銆?)}`);
        }

        return lines.join("\n");
    }

    buildStoryStateGuard(project) {
        const storyState = project.outline?.story_state || project.story_state || {};
        const lines = [];
        if (storyState.current_location) lines.push(`褰撳墠鍦扮偣锛?{storyState.current_location}`);
        if (storyState.timeline) lines.push(`褰撳墠鏃堕棿绾匡細${Utils.summarizeText(storyState.timeline, 120)}`);
        if (storyState.important_items) lines.push(`閲嶈鐗╁搧锛?{Utils.summarizeText(storyState.important_items, 120)}`);
        if (storyState.pending_plots) lines.push(`寰呮帹杩涗簨椤癸細${Utils.summarizeText(storyState.pending_plots, 140)}`);
        const names = Object.keys(storyState.characters || {}).slice(0, 8);
        if (names.length) {
            lines.push(`瑙掕壊鐘舵€侊細${names.map((name) => `${name}(${Utils.summarizeText(JSON.stringify(storyState.characters[name]), 32)})`).join("銆?)}`);
        }
        return lines.length ? `銆愬綋鍓嶆晠浜嬬姸鎬侊紙蹇呴』寤剁画锛夈€慭n${lines.join("\n")}` : "";
    }

    getOrderedChapterRecords(project) {
        const all = [];
        (project?.outline?.volumes || []).forEach((volume, volumeIndex) => {
            (volume?.chapters || []).forEach((chapter) => {
                all.push({
                    volumeIndex,
                    volumeNumber: volumeIndex + 1,
                    volumeTitle: volume.title || `绗?{volumeIndex + 1}鍗穈,
                    volumeId: volume.id || volume.uuid || "",
                    chapterId: chapter.id || chapter.uuid || "",
                    uuid: chapter.uuid || chapter.id || "",
                    number: Number(chapter.number || chapter.chapter_number || 0),
                    title: chapter.title || "",
                    summary: chapter.summary || "",
                    content: chapter.content || (chapter.uuid ? project.chapters?.[chapter.uuid] : "") || "",
                    keyEvent: chapter.key_event || chapter.keyEvent || "",
                    emotionCurve: chapter.emotion_curve || chapter.emotionCurve || "",
                    nextChapterSetup: chapter.next_chapter_setup || {},
                    chapter
                });
            });
        });
        all.sort((left, right) => left.volumeIndex - right.volumeIndex || left.number - right.number);
        return all;
    }

    getLatestChapterBefore(project, volumeNumber, chapterNumber) {
        const records = this.getOrderedChapterRecords(project);
        return records
            .filter((item) =>
                item.volumeNumber < volumeNumber ||
                (item.volumeNumber === volumeNumber && item.number && item.number < chapterNumber)
            )
            .pop() || null;
    }

    getSnapshotBeforeChapter(project, chapterNumber) {
        const snapshots = project?.chapter_snapshot?.snapshots || project?.outline?.state_snapshots || {};
        const keys = Object.keys(snapshots || {});
        if (!keys.length) {
            return { key: "", snapshot: null };
        }

        const sorted = keys
            .map((key) => ({
                key,
                number: Number(String(key).replace(/[^\d]/g, "")) || 0
            }))
            .sort((left, right) => left.number - right.number);

        const target = chapterNumber
            ? sorted.filter((item) => item.number && item.number < chapterNumber).pop() || sorted[sorted.length - 1]
            : sorted[sorted.length - 1];
        if (!target?.key) {
            return { key: "", snapshot: null };
        }

        return {
            key: target.key,
            snapshot: snapshots[target.key] || null
        };
    }

    extractEndingParagraphs(content, count = 2, limit = 700) {
        const paragraphs = String(content || "")
            .split(/\n{2,}/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 20);
        if (!paragraphs.length) {
            return "";
        }
        return paragraphs.slice(-count).join("\n\n").slice(-limit);
    }

    extractLastMeaningfulSentence(content, limit = 100) {
        const paragraphs = String(content || "")
            .split(/\r?\n+/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 8);
        if (!paragraphs.length) {
            return "";
        }

        const tailText = paragraphs.slice(-3).join(" ");
        const sentences = tailText
            .split(/(?<=[銆傦紒锛??鈥)/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 8);
        const lastSentence = sentences[sentences.length - 1] || paragraphs[paragraphs.length - 1] || "";
        return Utils.summarizeText(lastSentence, limit);
    }

    describeNextChapterSetup(setup) {
        if (!setup || typeof setup !== "object") {
            return "";
        }
        const parts = [
            setup.state_setup ? `鐘舵€侊細${setup.state_setup}` : "",
            setup.atmosphere_setup ? `姘涘洿锛?{setup.atmosphere_setup}` : "",
            setup.suspense_hook ? `鎮康锛?{setup.suspense_hook}` : "",
            setup.clue_hint ? `绾跨储锛?{setup.clue_hint}` : "",
            setup.countdown ? `鍊掕鏃讹細${setup.countdown}` : ""
        ].filter(Boolean);
        return parts.join("锛?);
    }

    getSnapshotByChapter(project, chapterNumber) {
        const key = `chapter_${Number(chapterNumber || 0)}`;
        return project?.chapter_snapshot?.snapshots?.[key]
            || project?.outline?.state_snapshots?.[key]
            || null;
    }

    buildOpeningRelayPacket(project, currentVolume, currentChapter) {
        const volumeNumber = this.getVolumeNumber(project, currentVolume);
        const chapterNumber = Number(currentChapter?.number || currentChapter?.chapter_number || 0);
        const previousChapter = this.getLatestChapterBefore(project, volumeNumber, chapterNumber);
        if (!previousChapter) {
            return "";
        }

        const snapshot = this.getSnapshotByChapter(project, previousChapter.number)
            || this.getSnapshotBeforeChapter(project, chapterNumber).snapshot
            || {};
        const previousCore = previousChapter.keyEvent
            || Utils.summarizeText(previousChapter.summary || "", 120)
            || previousChapter.title
            || "";
        const tailAction = this.extractLastMeaningfulSentence(previousChapter.content || "", 100);
        const hook = this.describeNextChapterSetup(previousChapter.nextChapterSetup || previousChapter.next_chapter_setup || {});
        const unresolved = snapshot.pending_plots || previousChapter.nextChapterSetup?.state_setup || "";
        const scene = snapshot.current_location || snapshot["浣嶇疆"] || "";
        const timeline = snapshot.timeline || snapshot["鏃堕棿"] || "";

        return [
            "銆愬紑绡囨帴鍔涙銆?,
            `鎵挎帴鏉ユ簮锛氱${previousChapter.number}绔犮€?{previousChapter.title || "鏈懡鍚嶇珷鑺?}銆媊,
            "杩欓噷鍙彁渚涚粨鏋溿€佺幇鍦哄拰鏈畬浜嬮」锛屼笉鎻愪緵鍙杩板師鍙ワ紱鏈珷寮€澶村繀椤荤户缁線鍓嶅啓銆?,
            previousCore ? `- 涓婄珷宸插畬鎴愮粨鏋滐細${Utils.summarizeText(previousCore, 110)}` : "",
            scene ? `- 褰撳墠鐜板満鍦扮偣锛?{Utils.summarizeText(scene, 40)}` : "",
            timeline ? `- 褰撳墠鐜板満鏃堕棿锛?{Utils.summarizeText(timeline, 40)}` : "",
            tailAction ? `- 涓婄珷鏈€鍚庡姩浣?鐢婚潰锛?{tailAction}` : "",
            unresolved ? `- 褰撳墠浠嶆湭澶勭悊锛?{Utils.summarizeText(unresolved, 90)}` : "",
            hook ? `- 鏈珷蹇呴』绔嬪埢鎺ヤ綇锛?{Utils.summarizeText(hook, 110)}` : "",
            "纭鍒欙細",
            "1. 绗竴娈电洿鎺ヨ繘鍏ョ幇鍦哄姩浣溿€佸鐧芥垨鍗虫椂鍙嶅簲锛屼笉瑕佸厛鍐欏墠鎯呭洖椤俱€?,
            "2. 涓嶈鎶婁笂涓€绔犲凡瀹屾垚缁撴灉鍐嶅啓鎴愯皟鏌ャ€佽В閲娿€佹帹鐞嗘垨澶ф澶嶇洏銆?,
            "3. 濡傛灉闇€瑕佽繃妗ワ紝鍙兘鐢ㄥ緢鐭殑鍔ㄤ綔杩囨浮锛屼笉鑳芥暣娈靛杩颁笂涓€绔犮€?
        ].filter(Boolean).join("\n");
    }

    buildOpeningAntiRepeatGuard(project, currentVolume, currentChapter) {
        const volumeNumber = this.getVolumeNumber(project, currentVolume);
        const chapterNumber = Number(currentChapter?.number || currentChapter?.chapter_number || 0);
        const previousChapter = this.getLatestChapterBefore(project, volumeNumber, chapterNumber);
        if (!previousChapter) {
            return "";
        }

        const previousCore = previousChapter.keyEvent
            || Utils.summarizeText(previousChapter.summary || "", 120)
            || previousChapter.title
            || "";
        const previousHook = this.describeNextChapterSetup(previousChapter.nextChapterSetup || previousChapter.next_chapter_setup || {});
        const endingFocus = this.extractLastMeaningfulSentence(previousChapter.content || "", 100);

        const lines = [
            "銆愬紑澶撮槻閲嶅纭害鏉熴€?,
            "1. 鏈珷鍓?娈靛繀椤荤洿鎺ユ壙鎺ヤ笂涓€绔犳渶鍚庝竴涓姩浣溿€佹儏缁垨鐘舵€佸彉鍖栵紝涓嶈閲嶆柊閾轰竴閬嶄笂涓€绔犲凡缁忓畬鎴愮殑涓讳簨浠躲€?,
            "2. 濡傛灉蹇呴』鍥為【涓婁竴绔狅紝鏈€澶氬彧鍏佽 1-2 鍙ワ紝鑰屼笖鍙兘浣滀负鎵挎帴锛岀粷涓嶈兘鎶婁笂绔犳牳蹇冨彂鐜伴噸璁叉垚澶ф鍓嶆儏銆?,
            "3. 涓婁竴绔犲凡缁忓彂鐢熷苟纭杩囩殑鏍稿績淇℃伅锛屼笉鑳藉湪鏈珷寮€澶撮噸鏂版帹鐞嗐€侀噸鏂拌В閲娿€侀噸鏂伴摵闄堛€?
        ];

        if (previousCore) {
            lines.push(`涓婁竴绔犲凡瀹屾垚鏍稿績浜嬩欢锛?{Utils.summarizeText(previousCore, 130)}`);
        }
        if (previousHook) {
            lines.push(`涓婁竴绔犵暀缁欐湰绔犵殑鎵挎帴閽╁瓙锛?{Utils.summarizeText(previousHook, 120)}`);
        }
        if (endingFocus) {
            lines.push(`涓婁竴绔犵粨灏惧姩浣滈敋鐐癸細${endingFocus}`);
        }
        lines.push("鏈珷寮€澶磋浠庤繖浜涘凡鐭ョ粨鏋滅户缁線鍓嶅啓锛岃€屼笉鏄啀璁蹭竴閬嶅畠浠槸鎬庝箞鍙戠敓鐨勩€?);

        return lines.join("\n");
    }

    buildStoryStateSummary(project, volumeNumber, chapterNumber, contextText = "") {
        const lines = [];
        const previousChapter = this.getLatestChapterBefore(project, volumeNumber, chapterNumber);
        if (previousChapter) {
            const previousBrief = previousChapter.keyEvent
                || Utils.summarizeText(previousChapter.summary, 120)
                || previousChapter.title;
            lines.push(`涓婁竴绔犺繘搴︼細绗?{previousChapter.number}绔犮€?{previousChapter.title || "鏈懡鍚?}銆?-> ${previousBrief}`);
            if (previousChapter.emotionCurve) {
                lines.push(`涓婁竴绔犳儏缁熬璋冿細${Utils.summarizeText(previousChapter.emotionCurve, 60)}`);
            }
            const previousSetup = this.describeNextChapterSetup(previousChapter.nextChapterSetup);
            if (previousSetup) {
                lines.push(`涓婁竴绔犵暀涓嬬殑涓嬬珷閾哄灚锛?{Utils.summarizeText(previousSetup, 120)}`);
            }
        }

        const { snapshot } = this.getSnapshotBeforeChapter(project, chapterNumber);
        if (snapshot) {
            if (snapshot.current_location || snapshot["浣嶇疆"]) {
                lines.push(`鎵挎帴鍦扮偣锛?{snapshot.current_location || snapshot["浣嶇疆"]}`);
            }
            if (snapshot.timeline || snapshot["鏃堕棿"]) {
                lines.push(`鎵挎帴鏃堕棿锛?{Utils.summarizeText(snapshot.timeline || snapshot["鏃堕棿"], 80)}`);
            }
            if (snapshot.pending_plots) {
                lines.push(`鏈畬浜嬮」锛?{Utils.summarizeText(snapshot.pending_plots, 90)}`);
            }
            if (snapshot.important_items) {
                lines.push(`閲嶈鐗╁搧鐘舵€侊細${Utils.summarizeText(snapshot.important_items, 90)}`);
            }
        }

        const storyState = project?.outline?.story_state || project?.story_state || {};
        if (storyState.current_location && !lines.some((line) => line.startsWith("鎵挎帴鍦扮偣锛?))) {
            lines.push(`褰撳墠鍦扮偣锛?{storyState.current_location}`);
        }
        if (storyState.timeline && !lines.some((line) => line.startsWith("鎵挎帴鏃堕棿锛?))) {
            lines.push(`褰撳墠鏃堕棿绾匡細${Utils.summarizeText(storyState.timeline, 80)}`);
        }
        if (storyState.pending_plots && !lines.some((line) => line.startsWith("鏈畬浜嬮」锛?))) {
            lines.push(`寰呮帹杩涗簨椤癸細${Utils.summarizeText(storyState.pending_plots, 100)}`);
        }

        const unresolvedForeshadows = Object.values(project?.foreshadow_tracker?.foreshadows || {})
            .filter((item) => item && item["鐘舵€?] !== "宸插洖鏀?)
            .slice(0, 4)
            .map((item) => item["浼忕瑪鍐呭"] || item.content || "")
            .filter(Boolean);
        if (unresolvedForeshadows.length) {
            lines.push(`鏈洖鏀朵紡绗旓細${unresolvedForeshadows.map((item) => Utils.summarizeText(item, 22)).join("銆?)}`);
        }

        const relevantCharacterStates = this.buildRelevantCharacterStateDigest(project, contextText, chapterNumber);
        if (relevantCharacterStates) {
            lines.push(relevantCharacterStates);
        }

        return lines.join("\n");
    }

    buildRelevantCharacterStateDigest(project, contextText = "", chapterNumber = 0) {
        const storyStateCharacters = project?.outline?.story_state?.characters && typeof project.outline.story_state.characters === "object"
            ? project.outline.story_state.characters
            : {};
        const compatibilityCharacters = project?.story_state?.characters && typeof project.story_state.characters === "object"
            ? project.story_state.characters
            : {};
        const checkerStates = project?.character_checker?.character_states && typeof project.character_checker.character_states === "object"
            ? project.character_checker.character_states
            : {};
        const dynamicStates = project?.dynamic_tracker?.character_states && typeof project.dynamic_tracker.character_states === "object"
            ? project.dynamic_tracker.character_states
            : {};
        const appearanceStates = project?.character_appearance_tracker?.appearances && typeof project.character_appearance_tracker.appearances === "object"
            ? project.character_appearance_tracker.appearances
            : {};
        const dialogueDeclarations = project?.dialogue_tracker?.declarations && typeof project.dialogue_tracker.declarations === "object"
            ? project.dialogue_tracker.declarations
            : {};
        const characterMap = new Map(
            (project?.outline?.characters || [])
                .filter((character) => character?.name)
                .map((character) => [character.name, character])
        );

        const relevantNames = this.collectRelevantCharacters(project, contextText)
            .map((character) => character.name)
            .filter(Boolean);
        const fallbackNames = [
            ...Object.keys(storyStateCharacters || {}),
            ...Object.keys(checkerStates || {}),
            ...Object.keys(dynamicStates || {})
        ];
        const names = Array.from(new Set(relevantNames.length ? relevantNames : fallbackNames)).slice(0, 6);
        if (!names.length) {
            return "";
        }

        const firstText = (...values) => values
            .map((value) => String(value || "").trim())
            .find(Boolean) || "";

        const lines = [
            "銆愮浉鍏宠鑹插嵆鏃剁姸鎬侊紙涓嶈涓插彴锛夈€?,
            "浠ヤ笅瑙掕壊鐨勪綅缃€佷激鍔裤€佸叧绯诲拰鐭ユ儏鑼冨洿褰兼鐙珛锛屼笉鑳芥妸涓€涓汉鐨勭姸鎬佸啓鍒板彟涓€涓汉韬笂銆?
        ];

        names.forEach((name) => {
            const outlineCharacter = characterMap.get(name) || {};
            const storyState = storyStateCharacters[name] || compatibilityCharacters[name] || {};
            const checkerState = checkerStates[name] || {};
            const dynamicState = dynamicStates[name] || {};
            const appearanceState = appearanceStates[name] || {};
            const declarationItems = Array.isArray(dialogueDeclarations[name]) ? dialogueDeclarations[name] : [];
            const recentDeclaration = declarationItems
                .filter((item) => !chapterNumber || Number(item.chapter_num || item.chapter || item["绔犺妭"] || 0) < chapterNumber)
                .slice(-1)
                .map((item) => item.content || item["鍐呭"] || "")
                .find(Boolean) || "";

            const parts = [];
            const identity = firstText(
                outlineCharacter.identity,
                outlineCharacter["韬唤"],
                appearanceState.identity,
                appearanceState["韬唤"]
            );
            const location = firstText(
                storyState.location,
                storyState.current_location,
                storyState["褰撳墠浣嶇疆"],
                checkerState.location,
                checkerState.current_location,
                checkerState["褰撳墠浣嶇疆"],
                dynamicState.location,
                dynamicState.current_location,
                dynamicState["褰撳墠浣嶇疆"]
            );
            const status = firstText(
                storyState.status,
                storyState.current_status,
                storyState["鐘舵€?],
                checkerState.status,
                checkerState.current_status,
                checkerState["褰撳墠鐘舵€?],
                dynamicState.status,
                dynamicState.current_status,
                dynamicState["褰撳墠鐘舵€?]
            );
            const cultivation = firstText(
                storyState.cultivation,
                storyState["淇负"],
                checkerState.cultivation,
                checkerState["淇负"],
                dynamicState.cultivation,
                dynamicState["淇负"]
            );
            const goal = firstText(
                storyState.goals,
                storyState.goal,
                storyState["鐩爣"],
                dynamicState.goals,
                dynamicState.goal,
                outlineCharacter.goals,
                outlineCharacter["鐩爣鍔ㄦ満"]
            );
            const relationships = firstText(
                storyState.relationships,
                storyState["鍏崇郴鍙樺寲"],
                dynamicState.relationships,
                dynamicState["鍏崇郴鍙樺寲"],
                outlineCharacter.relationships,
                outlineCharacter["浜虹墿鍏崇郴"]
            );
            const secrets = firstText(
                storyState.secrets,
                storyState["鐭ユ檽鐨勭瀵?],
                dynamicState.secrets,
                dynamicState["鐭ユ檽鐨勭瀵?]
            );
            const appearance = firstText(
                appearanceState.current_appearance,
                appearanceState["褰撳墠褰㈣薄"],
                appearanceState["澶栬矊褰㈣薄/浼褰撳墠鐘舵€?],
                storyState.appearance_changes,
                storyState["澶栬矊褰㈣薄/浼褰撳墠鐘舵€?],
                dynamicState.appearance,
                dynamicState["褰撳墠褰㈣薄"]
            );

            if (identity) parts.push(`韬唤=${Utils.summarizeText(identity, 18)}`);
            if (location) parts.push(`浣嶇疆=${Utils.summarizeText(location, 24)}`);
            if (status) parts.push(`鐘舵€?${Utils.summarizeText(status, 24)}`);
            if (cultivation) parts.push(`瀹炲姏=${Utils.summarizeText(cultivation, 18)}`);
            if (goal) parts.push(`鐩爣=${Utils.summarizeText(goal, 24)}`);
            if (relationships) parts.push(`鍏崇郴=${Utils.summarizeText(relationships, 22)}`);
            if (secrets) parts.push(`鐭ユ儏=${Utils.summarizeText(secrets, 20)}`);
            if (appearance) parts.push(`褰㈣薄=${Utils.summarizeText(appearance, 18)}`);
            if (recentDeclaration) parts.push(`杩戞湡琛ㄦ€?${Utils.summarizeText(recentDeclaration, 18)}`);

            if (parts.length) {
                lines.push(`- ${name}锛?{parts.join("锛?)}`);
            }
        });

        return lines.length > 2 ? lines.join("\n") : "";
    }

    buildSetupContinuityGuard(project, volumeNumber, chapterNumber, currentText = "") {
        const previousChapter = this.getLatestChapterBefore(project, volumeNumber, chapterNumber);
        if (!previousChapter) {
            return "";
        }

        const setupText = this.describeNextChapterSetup(previousChapter.nextChapterSetup);
        const lines = ["銆愪笅绔犻摵鍨壙鎺ヨ鍒欍€?];
        if (setupText) {
            lines.push(`涓婁竴绔犳槑纭暀涓嬬殑閾哄灚锛?{Utils.summarizeText(setupText, 160)}`);
        } else {
            const previousBrief = previousChapter.keyEvent
                || Utils.summarizeText(previousChapter.summary, 100)
                || previousChapter.title;
            lines.push(`涓婁竴绔犵粨灏鹃噸鐐癸細${Utils.summarizeText(previousBrief, 100)}`);
        }
        if (previousChapter.emotionCurve) {
            lines.push(`涓婁竴绔犳儏缁熬璋冿細${Utils.summarizeText(previousChapter.emotionCurve, 70)}`);
        }
        if (currentText) {
            lines.push(`褰撳墠寰呭啓鍐呭锛?{Utils.summarizeText(currentText, 150)}`);
        }
        lines.push("鏈鍐呭寮€澶村繀椤诲厛鎺ヤ綇涓婁竴绔犵粨灏剧暀涓嬬殑鐘舵€併€佹皼鍥淬€佹偓蹇垫垨鏈畬浜嬮」锛屽啀灞曞紑鏂扮殑鎺ㄨ繘銆?);
        lines.push("涓婁竴绔犲凡缁忓彂鐢熺殑浜嬩欢锛屼笉瑕佸啀鍐欐垚鈥滃嵆灏嗗彂鐢熲€濃€滄瑕佸彂鐢熲€濇垨閲嶅鍙戠敓銆?);
        lines.push("濡傛灉涓婄珷鍒版湰绔犱箣闂撮渶瑕佽繃妗ュ姩浣滐紝璇疯嚜鐒惰ˉ涓婏紝涓嶈鐢熺‖璺冲垏銆?);
        return lines.join("\n");
    }

    containsSpoilerStyleHook(text) {
        const value = String(text || "").trim();
        if (!value) {
            return false;
        }
        const patterns = [
            /涓嬬珷/,
            /涓嬩竴绔?,
            /灏嗕細/,
            /鍗冲皢/,
            /椹笂(?:灏??浼?,
            /闅忓悗(?:灏??浼?,
            /韬唤(?:鍗冲皢|灏嗚|灏辫)?鏇濆厜/,
            /鐪熺浉(?:鍗冲皢|灏嗚|灏辫)?澶х櫧/,
            /鏁屼汉(?:鍗冲皢|灏嗚|灏辫)?鏉ヨ/,
            /灏嗚幏寰?,
            /灏嗘鍘?,
            /灏嗙獊鐮?,
            /灏嗘彮闇?,
            /灏嗘彮鏅?
        ];
        return patterns.some((pattern) => pattern.test(value));
    }

    toHookStyleText(text) {
        const source = String(text || "").trim();
        if (!source) {
            return "";
        }

        let output = source
            .replace(/涓嬩竴绔燵^銆傦紒锛焅n]*[銆傦紒锛焆?/g, "")
            .replace(/涓嬬珷[^銆傦紒锛焅n]*[銆傦紒锛焆?/g, "")
            .replace(/灏嗕細|鍗冲皢|椹笂(?:灏??浼殀闅忓悗(?:灏??浼殀灏辫/g, "")
            .replace(/韬唤鏇濆厜/g, "韬唤鐤戜簯娴姩")
            .replace(/鐪熺浉澶х櫧/g, "鐪熺浉鐨勮缂濋湶浜嗗嚭鏉?)
            .replace(/鏁屼汉鏉ヨ/g, "杩滃寮傚姩閫艰繎")
            .replace(/灏嗚幏寰梉^锛屻€傦紒锛焅n]*/g, "闅愮害鎰熷埌鏌愮鏈虹紭姝ｅ湪閫艰繎")
            .replace(/灏嗙獊鐮碵^锛屻€傦紒锛焅n]*/g, "浣撳唴鐨勫彉鍖栧凡缁忓帇涓嶄綇")
            .replace(/灏嗘彮闇瞇^锛屻€傦紒锛焅n]*/g, "寮傛牱鐨勭嚎绱㈡鍦ㄩ€艰繎鏍稿績")
            .replace(/灏嗘彮鏅揫^锛屻€傦紒锛焅n]*/g, "绛旀浠夸經鍙樊鏈€鍚庝竴灞?)
            .replace(/\s+/g, " ")
            .trim();

        output = output.replace(/^[锛屻€傦紱锛氥€乗s]+|[锛岋紱锛氥€乗s]+$/g, "").trim();
        if (!output) {
            output = "寮傛牱宸茬粡閫艰繎锛屽嵈杩樻病浜虹湅娓呯湡姝ｄ細鍙戠敓浠€涔堛€?;
        }
        if (!/[銆傦紒锛焆$/.test(output)) {
            output += "銆?;
        }
        return output;
    }

    replaceSummarySection(summary, sectionTitle, transformer) {
        const text = String(summary || "");
        if (!text.trim()) {
            return text;
        }
        const pattern = new RegExp(`(銆?{sectionTitle}銆?([\\s\\S]*?)(?=\\n銆恷$)`);
        return text.replace(pattern, (match, header, body) => {
            const nextBody = transformer(String(body || "").trim());
            return `${header}\n${nextBody}`;
        });
    }

    extractSummarySection(summary, sectionTitle) {
        const text = String(summary || "");
        if (!text.trim()) {
            return "";
        }
        const match = text.match(new RegExp(`銆?{sectionTitle}銆?[\\s\\S]*?)(?=\\n銆恷$)`));
        return match?.[1] ? String(match[1]).trim() : "";
    }

    buildFallbackProgressLines(item = {}, coreEvent = "") {
        const base = String(coreEvent || item.key_event || "").trim() || `鍥寸粫銆?{item.title || "褰撳墠绔犺妭"}銆嬫帹杩涗富绾夸簨浠禶;
        const progress = [
            `1.銆愭壙鎺ャ€戝厛鎵挎帴涓婁竴绔犵暀涓嬬殑鐘舵€併€佷汉鐗╂儏缁笌鏈畬浜嬮」锛屾妸鏈珷鐭涚浘鑷劧鎺ヨ捣鏉ワ紝骞惰涓昏鏄庣‘鏈珷瑕佸鐞嗙殑鏍稿績闂銆俙,
            `2.銆愭帹杩涖€戝洿缁曗€?{Utils.summarizeText(base, 36)}鈥濆睍寮€琛屽姩锛岃浜虹墿閫氳繃瀵硅瘽銆佸崥寮堛€佽瀵熸垨琛屽姩鎶婂眬鍔垮線鍓嶆帹涓€姝ャ€俙,
            `3.銆愬彈闃汇€戝湪鎺ㄨ繘杩囩▼涓姞鍏ユ柊鐨勯樆鍔涖€佽鍒ゃ€佷唬浠锋垨灞€鍔垮彉鍖栵紝閬垮厤涓€鏉＄嚎骞虫帹鍒板簳锛岃鏈珷涓鐪熸褰㈡垚娉㈡姌銆俙,
            `4.銆愬彉鍖栥€戣浜虹墿鍏崇郴銆佷俊鎭鐭ャ€佽祫婧愮姸鎬佹垨鍦轰笂灞€鍔垮彂鐢熷疄璐ㄥ彉鍖栵紝浣挎湰绔犺瀹屽悗鑳界湅鍑轰富绾跨‘瀹炲墠杩涗簡銆俙,
            `5.銆愭敹鏉熴€戝湪鏈珷缁撳熬鏀朵綇鏈珷闃舵缁撴灉锛屽悓鏃剁暀涓嬭兘琚笅涓€绔犵洿鎺ユ帴浣忕殑鐘舵€佸彉鍖栥€佹偓蹇垫垨浣欐尝銆俙
        ];
        return progress.join("\n");
    }

    normalizeCharacterSection(item = {}, existingSection = "") {
        const existing = String(existingSection || "").trim();
        if (existing) {
            const lines = existing
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => line.startsWith("- ") ? line : `- ${line.replace(/^[鈥-]\s*/, "")}`);
            return lines.join("\n");
        }

        const characters = Utils.ensureArrayFromText(item.characters);
        if (characters.length) {
            return characters.slice(0, 8).map((name) => `- ${name}锛堟湰绔犵浉鍏充汉鐗╋級`).join("\n");
        }

        return "- 涓昏锛堟壙鎺ュ綋鍓嶄富绾匡級";
    }

    normalizeForeshadowSection(item = {}, existingSection = "") {
        const existing = String(existingSection || "").trim();
        if (existing) {
            return existing;
        }
        const foreshadows = Utils.ensureArrayFromText(item.foreshadows);
        if (foreshadows.length) {
            return [
                `- 鏂板煁锛?{foreshadows.slice(0, 2).join("锛?)}`,
                "- 鍥炴敹锛氬鏃犳槑纭洖鏀剁偣锛屽彲鍦ㄦ鏂囦腑閫氳繃缁嗚妭鍛煎簲鍓嶆枃浼忕瑪"
            ].join("\n");
        }
        return "- 鏂板煁锛氱粨鍚堝綋鍓嶅啿绐佸煁涓嬭交搴︽偓蹇垫垨淇℃伅宸甛n- 鍥炴敹锛氬鏈夊墠鏂囦紡绗旓紝鍙湪鏈珷鍋氳交搴﹀懠搴?;
    }

    normalizeProgressSection(item = {}, existingSection = "", coreEvent = "") {
        const existing = String(existingSection || "").trim();
        if (!existing) {
            return this.buildFallbackProgressLines(item, coreEvent);
        }

        const lines = existing
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        const normalized = lines.map((line, index) => {
            if (/^\d+\.\s*銆?+?銆?.test(line)) {
                return line;
            }
            const cleaned = line.replace(/^[鈥-]\s*/, "");
            return `${index + 1}.銆愭帹杩涖€?{cleaned}`;
        });

        while (normalized.length < 5) {
            const fallbackLines = this.buildFallbackProgressLines(item, coreEvent).split("\n");
            normalized.push(fallbackLines[normalized.length] || `${normalized.length + 1}.銆愭帹杩涖€戝洿缁曞綋鍓嶄富绾跨户缁帹杩涳紝骞惰ˉ瓒冲繀瑕佺殑杩囩▼缁嗚妭銆俙);
        }

        return normalized.slice(0, 5).join("\n");
    }

    normalizeSystem9Summary(item = {}) {
        const source = String(item.summary || "").trim();
        const chapterTitle = String(item.title || `绗?{item.chapter_number || item.number || "?"}绔燻).trim();
        const rawGoal = this.extractSummarySection(source, "绔犺妭鐩爣");
        const rawCharacters = this.extractSummarySection(source, "鍑哄満浜虹墿");
        const rawScene = this.extractSummarySection(source, "鍦烘櫙");
        const rawCoreEvent = this.extractSummarySection(source, "鏍稿績浜嬩欢");
        const rawEmotion = this.extractSummarySection(source, "鎯呯华鏇茬嚎");
        const rawProgress = this.extractSummarySection(source, "鎯呰妭鎺ㄨ繘");
        const rawForeshadow = this.extractSummarySection(source, "浼忕瑪澶勭悊");
        const rawHook = this.extractSummarySection(source, "涓嬬珷閾哄灚");

        const coreEvent = String(rawCoreEvent || item.key_event || "").trim()
            || `${chapterTitle}鍥寸粫褰撳墠鍗蜂富绾垮睍寮€鏂扮殑鍏抽敭鎺ㄨ繘锛屽苟鎺ㄥ姩浜虹墿鍏崇郴鎴栧眬鍔垮彂鐢熸槑纭彉鍖栥€俙;
        const goal = String(rawGoal || "").trim()
            || `鍥寸粫鈥?{Utils.summarizeText(coreEvent, 30)}鈥濇帹杩涙湰绔犱富鐩爣锛屽苟璁╁綋鍓嶇煕鐩惧彇寰楅樁娈垫€х粨鏋溿€俙;
        const scene = String(rawScene || "").trim()
            || "褰撳墠鍗蜂富鍦烘櫙涓笌鏈珷鍐茬獊鐩存帴鐩稿叧鐨勫湴鐐癸紝姘旀皼闇€瑕佹湇鍔℃湰绔犱富瑕佺煕鐩俱€?;
        const emotion = String(rawEmotion || item.emotion_curve || "").trim()
            || "鎵垮帇鈫掑鎶椻啋浣欐尝";
        const characters = this.normalizeCharacterSection(item, rawCharacters);
        const progress = this.normalizeProgressSection(item, rawProgress, coreEvent);
        const foreshadow = this.normalizeForeshadowSection(item, rawForeshadow);
        const hookRaw = String(rawHook || "").trim()
            || this.toHookStyleText(
                item.next_chapter_setup?.suspense_hook
                || item.next_chapter_setup?.state_setup
                || item.next_chapter_setup?.atmosphere_setup
                || "鏈珷鏀跺熬鍚庯紝寮傛牱宸茬粡閫艰繎锛屼絾鐪熸鐨勫彉鍖栬繕娌℃湁瀹屽叏鎻紑銆?
            );
        const hook = this.containsSpoilerStyleHook(hookRaw) ? this.toHookStyleText(hookRaw) : hookRaw;

        return [
            `銆愮珷鑺傜洰鏍囥€慭n${goal}`,
            `銆愬嚭鍦轰汉鐗┿€慭n${characters}`,
            `銆愬満鏅€慭n${scene}`,
            `銆愭牳蹇冧簨浠躲€慭n${coreEvent}`,
            `銆愭儏缁洸绾裤€慭n${emotion}`,
            `銆愭儏鑺傛帹杩涖€慭n${progress}`,
            `銆愪紡绗斿鐞嗐€慭n${foreshadow}`,
            `銆愪笅绔犻摵鍨€慭n${hook}`
        ].join("\n\n");
    }

    sanitizeChapterOutlineHookData(item = {}) {
        const nextSetup = item.next_chapter_setup && typeof item.next_chapter_setup === "object"
            ? { ...item.next_chapter_setup }
            : {};

        Object.keys(nextSetup).forEach((key) => {
            if (this.containsSpoilerStyleHook(nextSetup[key])) {
                nextSetup[key] = this.toHookStyleText(nextSetup[key]);
            }
        });

        let summary = this.replaceSummarySection(item.summary || "", "涓嬬珷閾哄灚", (body) => {
            if (!body) {
                return body;
            }
            const cleanedLines = body
                .split(/\r?\n/)
                .map((line) => {
                    const trimmed = line.trim();
                    if (!trimmed) {
                        return "";
                    }
                    return this.containsSpoilerStyleHook(trimmed)
                        ? this.toHookStyleText(trimmed)
                        : trimmed;
                })
                .filter(Boolean);
            return cleanedLines.join("\n");
        });

        summary = this.normalizeSystem9Summary({
            ...item,
            summary,
            next_chapter_setup: nextSetup
        });

        return {
            ...item,
            summary,
            next_chapter_setup: nextSetup
        };
    }

    sanitizeGeneratedChapterContent(text, nextOutline) {
        const source = String(text || "");
        if (!source.trim()) {
            return source;
        }

        const markers = ["<<<STATE_JSON>>>", "<<<EXTRA_CHARACTERS>>>", "<<<FORESHADOWS>>>", "<<<PERSONALITY_CHANGE>>>", "<<<CHARACTER_APPEARANCE>>>"];
        let splitIndex = source.length;
        markers.forEach((marker) => {
            const index = source.indexOf(marker);
            if (index >= 0 && index < splitIndex) {
                splitIndex = index;
            }
        });

        let body = source.slice(0, splitIndex).trimEnd();
        const tail = source.slice(splitIndex);
        body = body.replace(/\n?(?:榫欏瑙掕壊[:锛歖[\s\S]*?)(?:<<<END_EXTRA>>>|\s*$)/u, "").trimEnd();
        body = body.replace(/\n?(?:涓存椂鏀嚎[:锛歖[\s\S]*?)(?:<<<END_EXTRA>>>|\s*$)/u, "").trimEnd();
        const paragraphs = body.split(/\r?\n{2,}/);
        if (!paragraphs.length) {
            return source;
        }

        const lastIndex = paragraphs.length - 1;
        const lastParagraph = paragraphs[lastIndex].trim();
        if (this.containsSpoilerStyleHook(lastParagraph)) {
            paragraphs[lastIndex] = this.toHookStyleText(lastParagraph);
        }

        if (nextOutline && paragraphs[lastIndex]) {
            const nextTitle = String(nextOutline.title || "").trim();
            const nextSummary = String(nextOutline.summary || "").trim();
            const forbiddenTokens = [
                nextTitle,
                ...nextSummary.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,8}/g) || []
            ].filter((token) => token && token.length >= 2).slice(0, 20);

            if (forbiddenTokens.some((token) => paragraphs[lastIndex].includes(token))) {
                paragraphs[lastIndex] = this.toHookStyleText(paragraphs[lastIndex]);
            }
        }

        return `${paragraphs.join("\n\n")}${tail}`;
    }

    buildNameLockGuard(project) {
        const lines = [];

        Object.entries(project.name_locker?.locked_names || {}).forEach(([category, names]) => {
            const entries = Object.keys(names || {}).slice(0, 12);
            if (entries.length) {
                lines.push(`${category}锛?{entries.join("銆?)}`);
            }
        });

        const synopsisData = project.synopsisData || project.synopsis_data || {};
        Object.entries(synopsisData.locked_character_names || {}).slice(0, 12).forEach(([name, info]) => {
            const identity = info?.identity || info?.type || "";
            lines.push(`閿佸畾瑙掕壊锛?{name}${identity ? `锛?{identity}锛塦 : ""}`);
        });

        Object.entries(synopsisData.main_characters || {}).slice(0, 8).forEach(([role, name]) => {
            if (name) {
                lines.push(`涓昏鏄犲皠锛?{role} = ${name}`);
            }
        });

        return lines.length ? `銆愬悕绉伴攣瀹氾紙绂佹婕傜Щ锛夈€慭n${lines.join("\n")}` : "";
    }

    buildTimelineGuard(project, chapterNumber) {
        const tracker = project.timeline_tracker || {};
        const lines = [];

        (tracker.timeline_events || []).slice(-6).forEach((item) => {
            lines.push(`绗?{item.chapter || item["绔犺妭"] || "?"}绔狅細${item.time_point || item["鏃堕棿鐐?] || item.event || item["浜嬩欢"] || ""}`);
        });

        const active = (tracker.time_constraints || [])
            .filter((item) => !chapterNumber || !item["棰勮瀹屾垚绔犺妭"] || Number(item["棰勮瀹屾垚绔犺妭"]) >= chapterNumber)
            .slice(0, 5)
            .map((item) => `${item["璁惧畾"] || item.constraint_desc || ""}锛堟寔缁細${item["鎸佺画鏃堕棿"] || item.duration_desc || ""}锛塦);
        if (active.length) {
            lines.push(`鏃堕棿绾︽潫锛?{active.join("銆?)}`);
        }

        return lines.length ? `銆愭椂闂寸嚎绾︽潫銆慭n${lines.join("\n")}` : "";
    }

    buildForeshadowGuard(project, chapterNumber) {
        const tracker = project.foreshadow_tracker?.foreshadows || {};
        const unresolved = Object.values(tracker)
            .filter((item) => item && item["鐘舵€?] !== "宸插洖鏀?)
            .sort((a, b) => Number(a["鍩嬭绔犺妭"] || 0) - Number(b["鍩嬭绔犺妭"] || 0))
            .slice(0, 8);

        if (!unresolved.length) {
            return "";
        }

        const lines = unresolved.map((item) => {
            const planned = item["璁″垝鍥炴敹"] ? `锛岃鍒掑洖鏀讹細${item["璁″垝鍥炴敹"]}` : "";
            return `- 绗?{item["鍩嬭绔犺妭"] || "?"}绔犲煁璁俱€?{item["浼忕瑪绫诲瀷"] || "浼忕瑪"}銆戯細${item["浼忕瑪鍐呭"] || ""}${planned}`;
        });
        if (chapterNumber) {
            lines.push(`褰撳墠绗?${chapterNumber} 绔狅紝鍙€傚害鍛煎簲鎺ヨ繎鑺傜偣鐨勪紡绗旓紝浣嗕笉瑕佷竴娆℃€ф竻绌恒€俙);
        }
        return `銆愪紡绗旇拷韪€慭n${lines.join("\n")}`;
    }

    buildPersonalityGuard(project, contextText = "", chapterNumber = 0) {
        const source = project.personality_enforcer?.character_personalities || {};
        const relevantNames = new Set(
            this.collectRelevantCharacters(project, contextText).map((character) => character.name).filter(Boolean)
        );

        const entries = Object.entries(source)
            .filter(([name]) => !relevantNames.size || relevantNames.has(name))
            .slice(0, 10);

        if (!entries.length) {
            return "";
        }

        const lines = [
            "銆愪汉鐗╂€ф牸涓€鑷存€х害鏉燂紙鑷姩鐢熸垚锛夈€?,
            "1. 瀵硅瘽蹇呴』绗﹀悎浜虹墿鏃㈡湁鎬ф牸锛屼笉瑕佺獊鐒跺彉鍙ｉ銆?,
            "2. 楂樺喎瑙掕壊涓嶈绐佺劧鍙樿瘽鐥紝鍙ょ伒绮炬€鑹蹭笉瑕佺獊鐒剁垎绮楀彛銆?,
            "3. 姣忎釜瑙掕壊閮借淇濈暀鑷繁鐨勮璇濈壒鐐瑰拰鎯呯华涔犳儻銆?
        ];

        entries.forEach(([name, data]) => {
            const base = data?.褰撳墠鎬ф牸 || data?.鍘熷璁惧畾 || data?.personality || "";
            const change = chapterNumber && data?.personality_changes?.[chapterNumber]
                ? `锛涙湰绔犲墠宸叉紨鍙樹负锛?{data.personality_changes[chapterNumber]}`
                : "";
            lines.push(`- ${name}锛?{Utils.summarizeText(base, 80)}${change}`);
        });

        return lines.join("\n");
    }

    buildAppearanceGuard(project, contextText = "", chapterNumber = 0) {
        const tracker = project.character_appearance_tracker || {};
        const appearances = tracker.appearances || {};
        const relationships = tracker.relationships || {};
        const relevantNames = new Set(
            this.collectRelevantCharacters(project, contextText).map((character) => character.name).filter(Boolean)
        );

        const lines = [];
        Object.entries(appearances)
            .filter(([name]) => !relevantNames.size || relevantNames.has(name))
            .slice(0, 10)
            .forEach(([name, data]) => {
                const firstAppearance = data["棣栨鍑哄満"] || data["鍑哄満绔犺妭"] || data.chapter || "?";
                const identity = data["韬唤"] || data.identity || "鏈煡";
                const currentAppearance = data["褰撳墠褰㈣薄"] || data.current_appearance || "";
                const realAppearance = data["鐪熷疄褰㈣薄"] || data.real_appearance || "";
                const recentChange = Array.isArray(data["鍙樺寲鍘嗗彶"]) && data["鍙樺寲鍘嗗彶"].length
                    ? data["鍙樺寲鍘嗗彶"][data["鍙樺寲鍘嗗彶"].length - 1]
                    : null;
                const changeText = recentChange?.["绫诲瀷"] || recentChange?.change_type
                    ? `锛屾渶杩戝彉鍖?${recentChange["绫诲瀷"] || recentChange.change_type}`
                    : "";
                const appearanceText = currentAppearance
                    ? `锛屽綋鍓嶅舰璞?${Utils.summarizeText(currentAppearance, 50)}`
                    : "";
                const truthText = realAppearance && realAppearance !== currentAppearance
                    ? `锛岀湡瀹炲舰璞?${Utils.summarizeText(realAppearance, 40)}`
                    : "";
                lines.push(`- ${name}锛氶娆″嚭鍦虹${firstAppearance}绔狅紝韬唤=${identity}${appearanceText}${truthText}${changeText}`);
            });

        Object.entries(relationships)
            .slice(0, 8)
            .forEach(([key, rel]) => {
                const firstMeeting = rel["棣栨瑙侀潰"] || rel.first_meeting || "?";
                const relation = rel["鍏崇郴"] || rel.relationship || "鐩歌瘑";
                const [left, right] = String(key).split("|");
                if (!left || !right) {
                    return;
                }
                if (relevantNames.size && !relevantNames.has(left) && !relevantNames.has(right)) {
                    return;
                }
                if (!chapterNumber || Number(firstMeeting) < chapterNumber) {
                    lines.push(`- ${left} 涓?${right} 浜庣${firstMeeting}绔犲凡瑙侀潰锛屽叧绯伙細${relation}銆備笉鍙啀鍐欐垚鍒濊銆俙);
                }
            });

        return lines.length ? `銆愪汉鐗╁嚭鍦轰笌鍏崇郴杩借釜銆慭n${lines.join("\n")}` : "";
    }

    buildDialogueGuard(project, chapterNumber) {
        const declarations = project.dialogue_tracker?.declarations || {};
        const lines = [];
        Object.entries(declarations).slice(0, 8).forEach(([name, items]) => {
            if (!Array.isArray(items) || !items.length) {
                return;
            }
            const filtered = items
                .filter((item) => !chapterNumber || Number(item.chapter_num || item["绔犺妭"] || 0) < chapterNumber)
                .slice(-2)
                .map((item) => item.content || item["鍐呭"] || "")
                .filter(Boolean);
            if (filtered.length) {
                lines.push(`- ${name}锛氭鍓嶆槑纭〃鎬?澹版槑 -> ${filtered.join("锛?)}`);
            }
        });
        return lines.length ? `銆愯鑹茶█琛屼竴鑷存€с€慭n${lines.join("\n")}` : "";
    }

    buildDynamicStateGuard(project) {
        const tracker = project.dynamic_tracker || {};
        const lines = [];

        const items = Object.values(tracker.items || {}).slice(0, 6).map((item) =>
            `${item["鍚嶇О"] || "鐗╁搧"}(${item["鎸佹湁鑰?] || "鏈煡鎸佹湁鑰?}锛岀姸鎬?${item["褰撳墠鐘舵€?] || "鏈煡"}${item["绫诲瀷"] ? `锛岀被鍨?${item["绫诲瀷"]}` : ""}${item["鎻忚堪"] ? `锛岃鏄?${Utils.summarizeText(item["鎻忚堪"], 24)}` : ""})`
        );
        if (items.length) {
            lines.push(`鐗╁搧鐘舵€侊細${items.join("銆?)}`);
        }

        const skills = Object.values(tracker.skills || {}).slice(0, 6).map((skill) =>
            `${skill["鍚嶇О"] || "鎶€鑳?}(${skill["浣跨敤鑰?] || "鏈煡"}锛岀啛缁冨害=${skill["鐔熺粌搴?] || "鏈煡"})`
        );
        if (skills.length) {
            lines.push(`鎶€鑳界姸鎬侊細${skills.join("銆?)}`);
        }

        const appearances = Object.entries(tracker.appearances || {}).slice(0, 6).map(([name, data]) =>
            `${name}(褰撳墠褰㈣薄=${data["褰撳墠褰㈣薄"] || data["鍒濆褰㈣薄"] || "鏈煡"})`
        );
        if (appearances.length) {
            lines.push(`澶栬矊鐘舵€侊細${appearances.join("銆?)}`);
        }

        const charStates = Object.entries(tracker.character_states || {}).slice(0, 6).map(([name, data]) =>
            `${name}=${Utils.summarizeText(JSON.stringify(data), 80)}`
        );
        if (charStates.length) {
            lines.push(`浜虹墿鍔ㄦ€侊細${charStates.join("銆?)}`);
        }

        return lines.length ? `銆愬姩鎬佺姸鎬佽拷韪€慭n${lines.join("\n")}` : "";
    }

    buildWorldTrackerGuard(project) {
        const tracker = project.world_tracker || {};
        const lines = [];

        const locations = Object.entries(tracker.locations || {}).slice(0, 6).map(([name, data]) =>
            `${name}(${Utils.summarizeText(JSON.stringify(data), 60)})`
        );
        if (locations.length) {
            lines.push(`鍦扮偣鐘舵€侊細${locations.join("銆?)}`);
        }

        const organizations = Object.entries(tracker.organizations || {}).slice(0, 6).map(([name, data]) =>
            `${name}(${Utils.summarizeText(JSON.stringify(data), 60)})`
        );
        if (organizations.length) {
            lines.push(`鍔垮姏鐘舵€侊細${organizations.join("銆?)}`);
        }

        const movements = (tracker.character_positions || tracker.character_movements || []);
        if (Array.isArray(movements) && movements.length) {
            lines.push(`浜虹墿浣嶇疆/绉诲姩锛?{movements.slice(-6).map((item) => Utils.summarizeText(JSON.stringify(item), 40)).join("銆?)}`);
        }

        const worldEvents = (tracker.world_events || tracker.major_events || []);
        if (Array.isArray(worldEvents) && worldEvents.length) {
            lines.push(`涓栫晫浜嬩欢锛?{worldEvents.slice(-5).map((item) => Utils.summarizeText(JSON.stringify(item), 50)).join("銆?)}`);
        }

        return lines.length ? `銆愪笘鐣岃杩借釜绾︽潫銆慭n${lines.join("\n")}` : "";
    }

    buildGenreProgressGuard(project) {
        const tracker = project.genre_progress_tracker || {};
        const lines = [];

        const rankProgress = Object.entries(tracker.rank_progress || {})
            .slice(-5)
            .map(([name, data]) => `${name}=${data.rank || data.detail || "鏆傛棤"}`);
        if (rankProgress.length) {
            lines.push(`棰樻潗杩涘害-浣嶉樁/淇负锛?{rankProgress.join("銆?)}`);
        }

        const pregnancyProgress = Object.entries(tracker.pregnancy_progress || {})
            .slice(-4)
            .map(([name, data]) => `${name}=${data.months ? `${data.months}涓湀` : ""}${data.status ? `(${data.status})` : ""}${data.detail ? ` ${data.detail}` : ""}`.trim());
        if (pregnancyProgress.length) {
            lines.push(`棰樻潗杩涘害-鎬€瀛?闃舵鐘舵€侊細${pregnancyProgress.join("銆?)}`);
        }

        const statusProgress = Object.entries(tracker.status_progress || {})
            .slice(-5)
            .map(([name, data]) => `${name}=${data.detail || "鏆傛棤"}`);
        if (statusProgress.length) {
            lines.push(`棰樻潗杩涘害-鍏朵粬鐘舵€侊細${statusProgress.join("銆?)}`);
        }

        const progressEvents = (tracker.progress_events || [])
            .slice(-6)
            .map((item) => `${item.role || "瑙掕壊"}锛?{item.detail || ""}`)
            .filter(Boolean);
        if (progressEvents.length) {
            lines.push(`鏈€杩戦鏉愯繘搴﹀彉鍖栵細${progressEvents.join("銆?)}`);
        }

        return lines.length ? `銆愰鏉愯繘搴﹁拷韪€慭n${lines.join("\n")}` : "";
    }

    normalizeWorldStateList(value) {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value
                .map((item) => String(item || "").trim())
                .filter(Boolean);
        }
        return String(value)
            .split(/[\n,锛屻€侊紱;]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    buildWorldStateManagerGuard(project, chapterNumber = 0, chapter = null) {
        const manager = project.world_state_manager || {};
        const meta = manager.meta || {};
        const autoState = manager.auto_state || {};
        const manualState = manager.manual_state || {};
        const mergeMap = (base = {}, extra = {}) => {
            const merged = { ...(base || {}) };
            Object.entries(extra || {}).forEach(([key, value]) => {
                if (value && typeof value === "object" && !Array.isArray(value)) {
                    merged[key] = {
                        ...(merged[key] && typeof merged[key] === "object" ? merged[key] : {}),
                        ...value
                    };
                    return;
                }
                merged[key] = {
                    ...(merged[key] && typeof merged[key] === "object" ? merged[key] : {}),
                    note: String(value || "").trim()
                };
            });
            return merged;
        };
        const normalizeRewardList = (value = []) => {
            const list = Array.isArray(value) ? value : this.normalizeWorldStateList(value);
            return list
                .map((item) => {
                    if (!item) {
                        return null;
                    }
                    if (typeof item === "object") {
                        const name = item.reward || item.name || item.item || item.title || item["鍚嶇О"] || "";
                        if (!String(name || "").trim()) {
                            return null;
                        }
                        return {
                            reward: String(name || "").trim(),
                            name: String(name || "").trim(),
                            owner: String(item.owner || item.holder || item["鎸佹湁鑰?] || item["褰掑睘"] || "").trim(),
                            status: String(item.status || item["褰撳墠鐘舵€?] || item["鐘舵€?] || "").trim(),
                            source: String(item.source || item["鏉ユ簮"] || "").trim(),
                            detail: String(item.detail || item.description || item["鎻忚堪"] || name || "").trim(),
                            chapter: Number(item.chapter || item.last_updated_chapter || 0)
                        };
                    }
                    const name = String(item || "").trim();
                    return name
                        ? { reward: name, name, owner: "", status: "", source: "", detail: name, chapter: 0 }
                        : null;
                })
                .filter(Boolean);
        };
        const mergeRewardLists = (...values) => {
            const merged = [];
            const seen = new Set();
            values.forEach((value) => {
                normalizeRewardList(value).forEach((item) => {
                    const key = [item.reward || item.name || "", item.owner || "", item.status || "", item.source || ""].join("|");
                    if (seen.has(key)) {
                        return;
                    }
                    seen.add(key);
                    merged.push(item);
                });
            });
            return merged;
        };
        const normalizeSystemPanel = (value = {}) => {
            const panel = value && typeof value === "object" ? value : {};
            return {
                system_name: String(panel.system_name || panel.name || panel["绯荤粺鍚?] || "").trim(),
                owner: String(panel.owner || panel.host || panel.user || panel["瀹夸富"] || "").trim(),
                messages: this.normalizeWorldStateList(panel.messages || panel.logs || panel.broadcasts || panel["绯荤粺鎾姤"]),
                rewards: normalizeRewardList(panel.rewards),
                benefits: this.normalizeWorldStateList(panel.benefits || panel.privileges || panel.perks || panel["鐗规潈"]),
                rules: this.normalizeWorldStateList(panel.rules || panel["瑙勫垯"] || panel["鏍稿績瑙勫垯"]),
                functions: this.normalizeWorldStateList(panel.functions || panel.features || panel["鍔熻兘"]),
                statuses: this.normalizeWorldStateList(panel.statuses || panel["鐘舵€?] || panel["绯荤粺鐘舵€?]),
                pending_unlocks: this.normalizeWorldStateList(panel.pending_unlocks || panel.pending || panel["寰呰В閿?] || panel["鏈В閿?]),
                last_seen_chapter: Number(panel.last_seen_chapter || panel.chapter || 0)
            };
        };
        const mergeSystemPanel = (...values) => {
            const merged = {
                system_name: "",
                owner: "",
                messages: [],
                rewards: [],
                benefits: [],
                rules: [],
                functions: [],
                statuses: [],
                pending_unlocks: [],
                last_seen_chapter: 0
            };
            const pushText = (key, text) => {
                const clean = String(text || "").trim();
                if (!clean || merged[key].includes(clean)) {
                    return;
                }
                merged[key].push(clean);
            };
            values.forEach((value) => {
                const panel = normalizeSystemPanel(value);
                if (panel.system_name) merged.system_name = panel.system_name;
                if (panel.owner) merged.owner = panel.owner;
                merged.last_seen_chapter = Math.max(merged.last_seen_chapter, Number(panel.last_seen_chapter || 0));
                panel.messages.forEach((item) => pushText("messages", item));
                panel.benefits.forEach((item) => pushText("benefits", item));
                panel.rules.forEach((item) => pushText("rules", item));
                panel.functions.forEach((item) => pushText("functions", item));
                panel.statuses.forEach((item) => pushText("statuses", item));
                panel.pending_unlocks.forEach((item) => pushText("pending_unlocks", item));
                merged.rewards = mergeRewardLists(merged.rewards, panel.rewards);
            });
            return merged;
        };

        const overview = autoState.overview || {};
        const characters = mergeMap(autoState.characters || {}, manualState.characters || {});
        const factions = mergeMap(autoState.factions || {}, manualState.factions || {});
        const items = mergeMap(autoState.items || {}, manualState.items || {});
        const abilities = mergeMap(autoState.abilities || {}, manualState.abilities || {});
        const rewards = [
            ...(Array.isArray(autoState.rewards) ? autoState.rewards : []),
            ...(Array.isArray(manualState.rewards) ? manualState.rewards : [])
        ];
        const systemPanel = mergeSystemPanel(autoState.system_panel || {}, manualState.system_panel || {});
        const plotThreads = autoState.plot_threads || {};
        const genreModules = Array.isArray(meta.genre_modules) ? meta.genre_modules.slice(0, 8) : [];
        const hardRules = this.normalizeWorldStateList(manualState.hard_rules).slice(0, 8);
        const riskList = [
            ...this.normalizeWorldStateList(autoState.continuity_risks),
            ...this.normalizeWorldStateList(manualState.continuity_risks)
        ].slice(0, 8);
        const overviewNotes = this.normalizeWorldStateList(manualState.overview_notes).slice(0, 4);
        const customModules = Object.entries(manualState.custom_modules || {})
            .slice(0, 4)
            .map(([key, value]) => `${key}=${Utils.summarizeText(typeof value === "string" ? value : JSON.stringify(value), 70)}`);

        const chapterFocusNames = chapter?.summary
            ? this.extractChapterOutlineCharacterNames(chapter.summary || "")
            : [];
        const mainNames = Object.values(project.synopsisData?.main_characters || project.synopsis_data?.main_characters || {})
            .map((item) => String(item || "").trim())
            .filter(Boolean);
        const sortedCharacterNames = Object.entries(characters)
            .sort((left, right) => Number(right[1]?.last_seen_chapter || 0) - Number(left[1]?.last_seen_chapter || 0))
            .map(([name]) => name);
        const focusNames = Array.from(new Set([
            ...chapterFocusNames,
            ...mainNames,
            ...sortedCharacterNames
        ])).slice(0, 8);
        const characterLines = focusNames
            .map((name) => {
                const data = characters[name];
                if (!data) {
                    return "";
                }
                const parts = [];
                if (data.identity) parts.push(`韬唤=${Utils.summarizeText(data.identity, 18)}`);
                if (data.location) parts.push(`浣嶇疆=${Utils.summarizeText(data.location, 22)}`);
                if (data.status) parts.push(`鐘舵€?${Utils.summarizeText(data.status, 22)}`);
                if (data.cultivation) parts.push(`浣嶉樁=${Utils.summarizeText(data.cultivation, 18)}`);
                if (data.organization) parts.push(`褰掑睘=${Utils.summarizeText(data.organization, 18)}`);
                if (data.relationships) parts.push(`鍏崇郴=${Utils.summarizeText(data.relationships, 22)}`);
                if (data.note) parts.push(`琛ュ厖=${Utils.summarizeText(data.note, 20)}`);
                return parts.length ? `- ${name}锛?{parts.join("锛?)}` : "";
            })
            .filter(Boolean)
            .slice(0, 6);

        const focusOrganizations = new Set(
            focusNames.flatMap((name) => {
                const text = String(characters[name]?.organization || "").trim();
                return text ? text.split(/[锛屻€?\/]/).map((item) => item.trim()).filter(Boolean) : [];
            })
        );
        const factionLines = Object.entries(factions)
            .sort((left, right) => {
                const leftScore = (focusOrganizations.has(left[0]) ? 100 : 0) + (Array.isArray(left[1]?.members) ? left[1].members.length : 0);
                const rightScore = (focusOrganizations.has(right[0]) ? 100 : 0) + (Array.isArray(right[1]?.members) ? right[1].members.length : 0);
                return rightScore - leftScore;
            })
            .slice(0, 5)
            .map(([name, data]) => {
                const parts = [];
                if (data.type) parts.push(`绫诲瀷=${data.type}`);
                if (data.leader) parts.push(`鏍稿績=${data.leader}`);
                if (Array.isArray(data.members) && data.members.length) parts.push(`鎴愬憳=${data.members.slice(0, 5).join("銆?)}`);
                if (data.latest_change) parts.push(`鍙樺寲=${Utils.summarizeText(data.latest_change, 28)}`);
                if (data.note) parts.push(`琛ュ厖=${Utils.summarizeText(data.note, 20)}`);
                return parts.length ? `- ${name}锛?{parts.join("锛?)}` : "";
            })
            .filter(Boolean);

        const itemLines = Object.entries(items)
            .sort((left, right) => Number(right[1]?.last_updated_chapter || 0) - Number(left[1]?.last_updated_chapter || 0))
            .slice(0, 4)
            .map(([name, data]) => {
                const holder = data.鎸佹湁鑰?|| data.holder || data.owner || "";
                const status = data.褰撳墠鐘舵€?|| data.status || "";
                const type = data.绫诲瀷 || data.type || "";
                const parts = [holder ? `褰掑睘=${holder}` : "", status ? `鐘舵€?${status}` : "", type ? `绫诲瀷=${type}` : "", data.note ? `琛ュ厖=${Utils.summarizeText(data.note, 20)}` : ""]
                    .filter(Boolean);
                return parts.length ? `- ${name}锛?{parts.join("锛?)}` : "";
            })
            .filter(Boolean);
        const abilityLines = Object.entries(abilities)
            .sort((left, right) => Number(right[1]?.last_chapter || 0) - Number(left[1]?.last_chapter || 0))
            .slice(0, 3)
            .map(([name, data]) => {
                const parts = [data.owner ? `褰掑睘=${data.owner}` : "", data.level ? `浣嶉樁=${data.level}` : "", data.type ? `绫诲瀷=${data.type}` : "", data.note ? `琛ュ厖=${Utils.summarizeText(data.note, 20)}` : ""]
                    .filter(Boolean);
                return parts.length ? `- ${name}锛?{parts.join("锛?)}` : "";
            })
            .filter(Boolean);
        const rewardLines = rewards
            .slice(0, 3)
            .map((item) => {
                const rewardItem = item && typeof item === "object" ? item : { name: String(item || "").trim() };
                const name = rewardItem.reward || rewardItem.name || "";
                if (!name) {
                    return "";
                }
                const parts = [rewardItem.owner ? `褰掑睘=${rewardItem.owner}` : "", rewardItem.status ? `鐘舵€?${rewardItem.status}` : "", rewardItem.source ? `鏉ユ簮=${rewardItem.source}` : ""]
                    .filter(Boolean);
                return parts.length ? `- ${name}锛?{parts.join("锛?)}` : "";
            })
            .filter(Boolean);
        const recentSystemMessages = systemPanel.messages.slice(-3).reverse();
        const systemRewardLines = systemPanel.rewards
            .slice()
            .sort((left, right) => Number(right.chapter || 0) - Number(left.chapter || 0))
            .slice(0, 4);
        const systemPanelLines = [];
        if (systemPanel.system_name || systemPanel.owner) {
            systemPanelLines.push(`- 闈㈡澘=${[systemPanel.system_name || "绯荤粺闈㈡澘", systemPanel.owner ? `瀹夸富=${systemPanel.owner}` : ""].filter(Boolean).join("锛?)}`);
        }
        if (recentSystemMessages.length) {
            systemPanelLines.push(`- 鏈€杩戞挱鎶?${recentSystemMessages.map((item) => Utils.summarizeText(item, 40)).join("锝?)}`);
        }
        if (systemPanel.statuses.length) {
            systemPanelLines.push(`- 褰撳墠鐘舵€?${systemPanel.statuses.slice(-2).reverse().map((item) => Utils.summarizeText(item, 36)).join("锝?)}`);
        }
        if (systemPanel.benefits.length) {
            systemPanelLines.push(`- 绯荤粺鐗规潈=${systemPanel.benefits.slice(0, 6).join("銆?)}`);
        }
        if (systemRewardLines.length) {
            systemPanelLines.push(`- 绯荤粺濂栧姳=${systemRewardLines.map((item) => Utils.summarizeText(item.reward || item.name || "", 18)).filter(Boolean).join("銆?)}`);
        }
        if (systemPanel.rules.length) {
            systemPanelLines.push(`- 鏍稿績瑙勫垯=${systemPanel.rules.slice(0, 2).map((item) => Utils.summarizeText(item, 40)).join("锝?)}`);
        }
        if (systemPanel.functions.length) {
            systemPanelLines.push(`- 绯荤粺鍔熻兘=${systemPanel.functions.slice(0, 3).join("銆?)}`);
        }
        if (systemPanel.pending_unlocks.length) {
            systemPanelLines.push(`- 寰呰В閿?${systemPanel.pending_unlocks.slice(0, 3).join("銆?)}`);
        }

        const plotLines = [
            ...(Array.isArray(plotThreads.active) ? plotThreads.active.slice(0, 4).map((item) => `涓荤嚎=${Utils.summarizeText(item, 34)}`) : []),
            ...(Array.isArray(plotThreads.temporary) ? plotThreads.temporary.slice(0, 3).map((item) => `鏀嚎=${Utils.summarizeText(item, 34)}`) : []),
            ...(Array.isArray(plotThreads.unresolved_foreshadows) ? plotThreads.unresolved_foreshadows.slice(0, 3).map((item) => `浼忕瑪=${Utils.summarizeText(item, 36)}`) : [])
        ].slice(0, 8);

        const lines = [];
        if (meta.genre_profile || genreModules.length) {
            lines.push(`棰樻潗妗ｆ锛?{meta.genre_profile || "閫氱敤闀跨瘒杩炶浇"}${genreModules.length ? `锛涢噸鐐?${genreModules.join("銆?)}` : ""}`);
        }

        const timeAnchor = overview.current_time || "";
        const locationAnchor = overview.current_location || "";
        const chapterAnchor = Number(overview.latest_chapter || chapterNumber || 0);
        if (timeAnchor || locationAnchor || chapterAnchor) {
            lines.push(`褰撳墠鏃剁┖閿氱偣锛?{chapterAnchor ? `绗?{chapterAnchor}绔犲悗` : "褰撳墠"}${timeAnchor ? `锛涙椂闂?${Utils.summarizeText(timeAnchor, 40)}` : ""}${locationAnchor ? `锛涘湴鐐?${Utils.summarizeText(locationAnchor, 30)}` : ""}`);
        }
        if (systemPanelLines.length) {
            lines.push(`绯荤粺闈㈡澘锛歕n${systemPanelLines.join("\n")}`);
        }
        if (characterLines.length) {
            lines.push(`閲嶇偣浜虹墿锛歕n${characterLines.join("\n")}`);
        }
        if (factionLines.length) {
            lines.push(`鍔垮姏/閮ㄩ棬锛歕n${factionLines.join("\n")}`);
        }
        if (itemLines.length || abilityLines.length || rewardLines.length) {
            lines.push(`鍏抽敭鐗╁搧/鑳藉姏/濂栧姳锛歕n${[...itemLines, ...abilityLines, ...rewardLines].join("\n")}`);
        }
        if (plotLines.length) {
            lines.push(`涓荤嚎銆佹敮绾夸笌浼忕瑪锛?{plotLines.join("锛?)}`);
        }
        if (overviewNotes.length) {
            lines.push(`鎵嬪姩鎬诲娉細${overviewNotes.join("锛?)}`);
        }
        if (hardRules.length) {
            lines.push(`纭€х孩绾匡細${hardRules.join("锛?)}`);
        }
        if (customModules.length) {
            lines.push(`鎵嬪姩琛ュ厖妯″潡锛?{customModules.join("锛?)}`);
        }
        if (riskList.length) {
            lines.push(`杩炵画鎬ч闄╋細${riskList.join("锛?)}`);
        }
        if (!lines.length) {
            return "";
        }

        lines.push("瑕佹眰锛氭湰绔犲姩绗斿墠鍏堟牳瀵逛互涓婃€昏〃锛屽啀鍐冲畾浜虹墿绔欎綅銆佺О鍛煎叧绯汇€佺墿鍝佸綊灞炪€佹椂闂存帹杩涘拰缁撳熬閾哄灚銆?);
        return `銆愪笘鐣岀姸鎬佹€绘帶銆慭n${lines.join("\n")}`;
    }

    buildSubplotGuard(project) {
        const subplots = Array.isArray(project.used_temp_subplots) ? project.used_temp_subplots.slice(-6) : [];
        if (!subplots.length) {
            return "";
        }

        return [
            "銆愭敮绾垮墽鎯呯鐞嗐€?,
            `褰撳墠娲昏穬鏀嚎锛?{subplots.join("銆?)}`,
            "瑕佹眰锛氭湰绔犲娑夊強鏀嚎锛屽繀椤诲拰涓荤嚎琛屽姩鎴栦汉鐗╁叧绯绘帹杩涗骇鐢熻仈绯汇€?,
            "瑕佹眰锛氫笉瑕佹妸鍚屼竴鏉℃敮绾块噸澶嶅紑涓€閬嶏紝涔熶笉瑕佺獊鐒舵棤鍥犳敹鏉熷叏閮ㄦ敮绾裤€?
        ].join("\n");
    }

    buildCharacterCheckerGuard(project) {
        const checker = project.character_checker || {};
        const states = checker.character_states || checker.states || {};
        const lines = [];

        Object.entries(states).slice(0, 8).forEach(([name, data]) => {
            const location = data.current_location || data.location || data["褰撳墠浣嶇疆"] || "";
            const status = data.current_status || data.status || data["褰撳墠鐘舵€?] || "";
            const emotion = data.current_emotion || data.emotion || data["褰撳墠鎯呯华"] || "";
            const summary = [location ? `浣嶇疆=${location}` : "", status ? `鐘舵€?${status}` : "", emotion ? `鎯呯华=${emotion}` : ""]
                .filter(Boolean)
                .join("锛?);
            if (summary) {
                lines.push(`- ${name}锛?{summary}`);
            }
        });

        return lines.length
            ? `銆愪汉鐗╀竴鑷存€ф鏌ャ€慭n浠ヤ笅瑙掕壊褰撳墠鐘舵€佸繀椤诲欢缁紝涓嶅彲鐬Щ銆佸け蹇嗐€佹棤鏁呮敼鍙ｉ锛歕n${lines.join("\n")}`
            : "";
    }

    buildSnapshotGuard(project, chapterNumber) {
        const snapshots = project.chapter_snapshot?.snapshots || project.outline?.state_snapshots || {};
        const keys = Object.keys(snapshots);
        if (!keys.length) {
            return "";
        }

        let targetKey = keys[keys.length - 1];
        if (chapterNumber) {
            const numeric = keys
                .map((key) => Number(String(key).replace(/[^\d]/g, "")))
                .filter(Boolean)
                .sort((a, b) => a - b);
            const previous = numeric.filter((num) => num < chapterNumber).pop();
            if (previous) {
                targetKey = Object.keys(snapshots).find((key) => Number(String(key).replace(/[^\d]/g, "")) === previous) || targetKey;
            }
        }

        const latest = snapshots[targetKey] || {};
        const parts = [];
        if (latest.current_location || latest["浣嶇疆"]) parts.push(`鍦扮偣锛?{latest.current_location || latest["浣嶇疆"]}`);
        if (latest.timeline || latest["鏃堕棿"]) parts.push(`鏃堕棿锛?{Utils.summarizeText(latest.timeline || latest["鏃堕棿"], 80)}`);
        if (latest.pending_plots) parts.push(`寰呯画鐭涚浘锛?{Utils.summarizeText(latest.pending_plots, 90)}`);
        if (latest.important_items) parts.push(`閲嶈鐗╁搧锛?{Utils.summarizeText(latest.important_items, 80)}`);
        if (Array.isArray(latest["鍏抽敭淇℃伅"]) && latest["鍏抽敭淇℃伅"].length) parts.push(`鍏抽敭淇℃伅锛?{latest["鍏抽敭淇℃伅"].slice(0, 4).join("銆?)}`);
        if (latest["涓嬩竴绔犻鏈?]) parts.push(`涓婄珷棰勬湡鏈珷锛?{latest["涓嬩竴绔犻鏈?]}`);
        if (latest.transition_focus) parts.push(`琛旀帴閲嶇偣锛?{Utils.summarizeText(latest.transition_focus, 80)}`);
        if (latest.next_chapter_setup && typeof latest.next_chapter_setup === "object") {
            const nextSetupParts = [
                latest.next_chapter_setup.state_setup ? `鐘舵€侀摵鍨?${latest.next_chapter_setup.state_setup}` : "",
                latest.next_chapter_setup.atmosphere_setup ? `姘涘洿閾哄灚=${latest.next_chapter_setup.atmosphere_setup}` : "",
                latest.next_chapter_setup.suspense_hook ? `鎮康閽╁瓙=${latest.next_chapter_setup.suspense_hook}` : ""
            ].filter(Boolean);
            if (nextSetupParts.length) {
                parts.push(`蹇収鍐呯疆涓嬬珷浠诲姟锛?{nextSetupParts.join("锛?)}`);
            }
        }

        return parts.length
            ? `銆愮珷鏈揩鐓ц鎺ャ€慭n鏈€杩戝揩鐓э細${targetKey}\n${parts.join("\n")}\n鏂扮珷鑺傝鎵挎帴杩欎簺鐘舵€侊紝涓嶈鏃犳晠璺冲彉銆俙
            : "";
    }

    buildChapterTransitionGuide(project, currentVolume, currentChapter, prevContent = "") {
        const chapterNumber = Number(currentChapter?.number || currentChapter?.chapter_number || 0);
        const { key: targetKey, snapshot: latest } = this.getSnapshotBeforeChapter(project, chapterNumber);
        if (!latest) {
            return prevContent ? "銆愬紑绔犺鎺ユ寚瀵笺€慭n鏈珷寮€澶磋绱ф帴鍓嶆枃鏈€鍚庝竴涓湁鏁堝満鏅紝涓嶈骞冲湴璺冲満銆? : "";
        }

        const lines = ["銆愬紑绔犺鎺ユ寚瀵笺€?, `璇峰厛鎵挎帴涓婁竴绔犲揩鐓?${targetKey}锛屽啀灞曞紑鏈珷鍓ф儏銆俙];

        if (latest.current_location || latest["浣嶇疆"]) {
            lines.push(`1. 寮€鍦哄湴鐐逛紭鍏堟壙鎺ワ細${latest.current_location || latest["浣嶇疆"]}`);
        }
        if (latest.timeline || latest["鏃堕棿"]) {
            lines.push(`2. 鏃堕棿绾跨户缁部鐢細${Utils.summarizeText(latest.timeline || latest["鏃堕棿"], 70)}`);
        }
        if (latest.pending_plots) {
            lines.push(`3. 涓婄珷鏈畬浜嬮」锛?{Utils.summarizeText(latest.pending_plots, 90)}`);
        }
        if (latest.important_items) {
            lines.push(`4. 閲嶈鐗╁搧鐘舵€佸埆涓細${Utils.summarizeText(latest.important_items, 90)}`);
        }
        if (latest["涓嬩竴绔犻鏈?]) {
            lines.push(`5. 涓婄珷瀵规湰绔犵殑棰勬湡锛?{Utils.summarizeText(latest["涓嬩竴绔犻鏈?], 120)}`);
        }
        const previousChapter = this.getLatestChapterBefore(project, this.getVolumeNumber(project, currentVolume), chapterNumber);
        if (previousChapter?.emotionCurve) {
            lines.push(`6. 寤剁画涓婁竴绔犳儏缁熬璋冿細${Utils.summarizeText(previousChapter.emotionCurve, 60)}`);
        }
        const previousSetup = this.describeNextChapterSetup(previousChapter?.nextChapterSetup);
        if (previousSetup) {
            lines.push(`7. 鍏堟帴浣忎笂涓€绔犻摵鍨細${Utils.summarizeText(previousSetup, 120)}`);
        }

        const setup = currentChapter?.next_chapter_setup || {};
        const setupHints = [
            setup.state_setup ? `鐘舵€佽捣鐐癸細${setup.state_setup}` : "",
            setup.atmosphere_setup ? `姘涘洿璧风偣锛?{setup.atmosphere_setup}` : "",
            setup.suspense_hook ? `鎮康璧风偣锛?{setup.suspense_hook}` : ""
        ].filter(Boolean);
        if (setupHints.length) {
            lines.push(`鏈珷绔犵翰鑷甫琛旀帴浠诲姟锛?{setupHints.join("锛?)}`);
        }

        if (prevContent) {
            lines.push("寮€澶村墠鍑犳蹇呴』绱ф帴鍓嶆枃缁撳熬鐨勫姩浣溿€佹儏缁垨瀵硅瘽锛屼笉瑕佹棤鏁呰烦澶┿€佽烦鍦扮偣銆佽烦鍏崇郴鐘舵€併€?);
        }

        return lines.join("\n");
    }

    buildPlotUnitChapterGuide(project, volumeNumber, chapterNumber, chapter = null) {
        if (!chapterNumber) {
            return "";
        }

        const { phase, position } = this.getPlotUnitPhase(chapterNumber);
        const { unitNumber, unit } = this.getPlotUnitForChapter(project, volumeNumber, chapterNumber);
        const lines = [
            "銆愬墽鎯呭崟鍏冮樁娈电害鏉熴€?,
            `褰撳墠绔犺妭浣嶄簬绗?${unitNumber} 涓墽鎯呭崟鍏冪殑${phase}闃舵锛堝崟鍏冨唴绗?${position} 绔狅級銆俙
        ];

        const chapterPlotUnit = chapter?.plot_unit && typeof chapter.plot_unit === "object" ? chapter.plot_unit : {};
        if (unit?.core_conflict) {
            lines.push(`鏈崟鍏冩牳蹇冨啿绐侊細${Utils.summarizeText(unit.core_conflict, 100)}`);
        }
        if (chapterPlotUnit.connects_to_previous) {
            lines.push(`鏈珷鎵挎帴閲嶇偣锛?{Utils.summarizeText(chapterPlotUnit.connects_to_previous, 90)}`);
        }
        if (chapterPlotUnit.sets_up_next) {
            lines.push(`鏈珷閾哄灚閲嶇偣锛?{Utils.summarizeText(chapterPlotUnit.sets_up_next, 90)}`);
        }

        const suggestionText = this.buildPlotUnitSuggestionText(project, volumeNumber, chapterNumber);
        if (suggestionText) {
            lines.push(suggestionText);
        }

        return lines.join("\n");
    }

    buildNarrativeBridgePlan(project, volumeNumber, chapter) {
        const chapterNumber = Number(chapter?.number || chapter?.chapter_number || 0);
        if (!chapterNumber) {
            return "";
        }

        const previousChapter = this.getLatestChapterBefore(project, volumeNumber, chapterNumber);
        const previousSnapshot = this.getSnapshotBeforeChapter(project, chapterNumber).snapshot || {};
        const { phase, position } = this.getPlotUnitPhase(chapterNumber);
        const goal = this.extractSummarySection(chapter?.summary || "", "绔犺妭鐩爣")
            || chapter?.key_event
            || chapter?.keyEvent
            || chapter?.title
            || "";
        const coreEvent = this.extractSummarySection(chapter?.summary || "", "鏍稿績浜嬩欢")
            || chapter?.key_event
            || chapter?.keyEvent
            || chapter?.title
            || "";
        const scene = this.extractSummarySection(chapter?.summary || "", "鍦烘櫙");
        const emotion = this.extractSummarySection(chapter?.summary || "", "鎯呯华鏇茬嚎")
            || chapter?.emotion_curve
            || chapter?.emotionCurve
            || "";
        const previousSetup = this.describeNextChapterSetup(previousChapter?.nextChapterSetup || previousChapter?.next_chapter_setup || {});
        const currentSetup = this.describeNextChapterSetup(chapter?.next_chapter_setup || {});
        const openingAnchor = previousSetup
            || previousSnapshot.transition_focus
            || previousSnapshot["涓嬩竴绔犻鏈?]
            || previousSnapshot.pending_plots
            || previousChapter?.keyEvent
            || previousChapter?.title
            || "";

        const lines = [
            "銆愭湰绔犺妭濂忔墽琛岄鏋躲€?,
            `褰撳墠浣嶄簬绗?${Math.floor((chapterNumber - 1) / 8) + 1} 鍗曞厓鐨?{phase}闃舵锛堢 ${position} 绔狅級锛屼笉瑕佸啓鎴愭暎鐐规嫾璐淬€俙,
            `1. 寮€鍦烘壙鎺ワ細鍏堟帴浣?{Utils.summarizeText(openingAnchor || "涓婁竴绔犵暀涓嬬殑鍔ㄤ綔銆佺姸鎬佹垨鎯呯华灏鹃煶", 90)}锛岀敤鍔ㄤ綔鎴栧鐧芥妸璇昏€呭甫鍥炵幇鍦恒€俙,
            `2. 鏈珷鐩爣锛?{Utils.summarizeText(goal || "鍥寸粫褰撳墠绔犵翰涓荤嚎缁х画鎺ㄨ繘", 100)}銆俙,
            `3. 涓绘帹杩涳細鍥寸粫${Utils.summarizeText(coreEvent || "褰撳墠鏍稿績浜嬩欢", 110)}灞曞紑锛屼腑娈靛繀椤诲嚭鐜伴樆鍔涖€佽鍒ゃ€佷唬浠锋垨灞€鍔垮彉鍖栥€俙,
            "4. 瀹炶川鍙樺寲锛氳嚦灏戣浜虹墿鍏崇郴銆佷俊鎭鐭ャ€佽祫婧愮姸鎬併€佸満涓婂眬鍔夸腑鐨勪竴椤瑰彂鐢熺湅寰楄鐨勫彉鍖栥€?
        ];

        if (scene) {
            lines.push(`鍦烘櫙鎶撴墜锛氫紭鍏堜粠銆?{Utils.summarizeText(scene, 40)}銆嶆垨涓庡畠鐩存帴鐩歌繛鐨勫満鏅捣绗旓紝杞満蹇呴』鍐欐竻杩囨ˉ鍔ㄤ綔銆俙);
        }
        if (emotion) {
            lines.push(`鎯呯华鑺傚锛?{Utils.summarizeText(emotion, 40)}锛屼笉瑕佹暣绔犱竴涓儏缁钩鎺ㄥ埌搴曘€俙);
        }
        lines.push(`5. 缁撳熬鏀舵潫锛氬仠鍦?{Utils.summarizeText(currentSetup || "涓嬩竴姝ュ帇鍔涖€佷綑娉㈡垨鏈В鎮康", 90)}瀵瑰簲鐨勫紶鍔涚偣涓婏紝鍙煁鍥狅紝涓嶅啓鏋溿€俙);

        return lines.join("\n");
    }

    buildWorldAndPlanContext(project) {
        const sections = [];
        if (project.outline?.worldbuilding) {
            sections.push(`銆愪笘鐣岃鏍稿績璁惧畾銆慭n${this.limitContext(project.outline.worldbuilding, 1200)}`);
        }
        const detailed = project.outline?.detailed_outline || "";
        if (detailed) {
            sections.push(`銆愯缁嗗ぇ绾插弬鑰冦€慭n${this.limitContext(detailed, 1800)}`);
        }
        return sections.join("\n\n");
    }

    buildSynopsisConsistencyContext(project, contextText, chapterNumber) {
        return [
            this.buildVagueNameGuard(project),
            this.buildPersonalityGuard(project, contextText, chapterNumber),
            this.buildAppearanceGuard(project, contextText, chapterNumber),
            this.buildDialogueGuard(project, chapterNumber),
            this.buildNameLockGuard(project)
        ].filter(Boolean).join("\n\n");
    }

    buildCharacterConsistencyContext(project, contextText, chapterNumber) {
        return [
            this.buildVagueNameGuard(project),
            this.buildPersonalityGuard(project, contextText, chapterNumber),
            this.buildAppearanceGuard(project, contextText, chapterNumber),
            this.buildDialogueGuard(project, chapterNumber)
        ].filter(Boolean).join("\n\n");
    }

    buildVagueNameGuard(project) {
        const synopsisData = project.synopsisData || project.synopsis_data || {};
        const lines = [];
        const lockedRoleLines = [];
        const lockedNameLines = [];

        Object.entries(synopsisData.main_characters || {}).slice(0, 8).forEach(([role, name]) => {
            if (name) {
                lockedRoleLines.push(`${role} => ${name}`);
            }
        });

        Object.entries(synopsisData.vague_to_name_mapping || {}).slice(0, 12).forEach(([vague, real]) => {
            if (real) {
                lines.push(`${vague} => ${real}`);
            }
        });

        Object.entries(synopsisData.locked_character_names || {}).slice(0, 12).forEach(([name, info]) => {
            const identity = info?.identity || info?.type || "宸查攣瀹?;
            lockedNameLines.push(`${name}锛?{identity}锛塦);
        });

        return lockedRoleLines.length || lines.length || lockedNameLines.length
            ? [
                "銆愭ā绯婄О鍛艰浆瀹炲悕瑙勫垯銆?,
                lockedRoleLines.length ? `宸查攣瀹氫富瑙掞細\n${lockedRoleLines.join("\n")}` : "",
                lines.length ? `浠ヤ笅浠ｇО蹇呴』鏇挎崲鎴愮湡瀹炲鍚嶏細\n${lines.join("\n")}` : "",
                lockedNameLines.length ? `浠ヤ笅鍚嶅瓧宸查攣瀹氾紝鍚庣画鍗峰繀椤绘部鐢紝涓嶅緱鏀瑰悕鎴栭敊缁戯細\n${lockedNameLines.join("銆?)}` : "",
                "绂佹闀挎湡浣跨敤鈥滅敺涓?濂充富/涓昏/甯堝皧/鍙嶆淳鈥濅唬鏇跨湡瀹炲鍚嶃€?,
                "濡傛灉鐢ㄦ埛杈撳叆閲屽嚭鐜版ā绯婄О鍛硷紝涔熻浼樺厛鎸夊凡閿佸畾鏄犲皠鏇挎崲銆?
            ].filter(Boolean).join("\n")
            : "";
    }

    getSynopsisData(project) {
        if (!project.synopsisData || typeof project.synopsisData !== "object") {
            project.synopsisData = project.synopsis_data && typeof project.synopsis_data === "object"
                ? project.synopsis_data
                : {};
        }
        if (!project.synopsis_data || typeof project.synopsis_data !== "object") {
            project.synopsis_data = project.synopsisData;
        }
        return project.synopsisData;
    }

    getSynopsisRoleAliases() {
        return {
            鐢蜂富: ["鐢蜂富", "鐢蜂富瑙?, "鐢蜂富浜哄叕", "鐢蜂竴", "鐢蜂竴鍙?, "鐢疯"],
            濂充富: ["濂充富", "濂充富瑙?, "濂充富浜哄叕", "濂充竴", "濂充竴鍙?, "濂宠"],
            涓昏: ["涓昏", "涓讳汉鍏?],
            甯堝皧: ["甯堝皧"],
            鍙嶆淳: ["鍙嶆淳", "澶у弽娲?, "鍙嶆淳boss"],
            鐢蜂簩: ["鐢蜂簩", "鐢蜂簩鍙?],
            濂充簩: ["濂充簩", "濂充簩鍙?]
        };
    }

    buildSynopsisAliasToRoleMap() {
        const aliasToRole = {};
        Object.entries(this.getSynopsisRoleAliases()).forEach(([role, aliases]) => {
            aliases.forEach((alias) => {
                aliasToRole[alias] = role;
            });
        });
        return aliasToRole;
    }

    buildSynopsisNameAliases(name) {
        const cleanName = String(name || "").trim();
        if (!/^[\u4e00-\u9fa5]{2,4}$/.test(cleanName)) {
            return [];
        }
        const aliases = new Set([cleanName]);
        if (cleanName.length === 3) {
            aliases.add(cleanName.slice(1));
        } else if (cleanName.length === 4) {
            aliases.add(cleanName.slice(2));
        }
        return Array.from(aliases).filter(Boolean).sort((left, right) => right.length - left.length);
    }

    isTrustedSynopsisConcreteName(project, name) {
        const cleanName = String(name || "").trim();
        if (!/^[\u4e00-\u9fa5]{2,4}$/.test(cleanName)) {
            return false;
        }
        const knownConcreteNames = new Set(
            [
                ...Object.values(this.getSynopsisData(project)?.main_characters || {}),
                ...(project?.outline?.characters || []).flatMap((character) => [
                    character?.name || "",
                    ...Utils.ensureArrayFromText(character?.aliases || character?.["鍒悕"] || "")
                ])
            ]
                .map((item) => String(item || "").trim())
                .filter(Boolean)
        );
        if (knownConcreteNames.has(cleanName)) {
            return true;
        }
        if (this.containsObfuscatedText(cleanName)) {
            return false;
        }
        if (this.isGenericCharacterCandidateName(cleanName) || this.isLikelyActionLikeCharacterCandidate(cleanName)) {
            return false;
        }
        if (Array.from(knownConcreteNames).some((knownName) =>
            knownName
            && knownName.length >= 2
            && cleanName !== knownName
            && (cleanName.startsWith(knownName) || cleanName.endsWith(knownName))
        )) {
            return false;
        }
        if (/(鍥藉笀|璐ㄥ瓙|澶尰|灏氫功|渚嶉儙|棣栭|鎬荤|瀹コ|鍒哄|鍏氱窘|绯荤粺|鐨囧瓩|鐢峰疂|濂冲疂|澶コ|鐜嬬埛|瀹椾护|鎺岄棬|甯堝皧|闀胯€?/.test(cleanName)) {
            return false;
        }
        if (cleanName.length >= 3 && /[澶氬彧瀵熼兘宸潵绋虫鐖瑰嵄鐭ュ湴浠€呭悗鍓嶅唴澶栦笂涓嬫椂]/.test(cleanName.slice(-1))) {
            return false;
        }
        const compoundSurnames = [
            "娆ч槼", "涓婂畼", "鍙搁┈", "鎱曞", "璇歌憶", "鍗楀", "澶忎警", "浠ょ嫄", "鐨囩敨", "杞╄緯",
            "瀹囨枃", "闀垮瓩", "鍙稿緬", "鍙哥┖", "瑗块棬", "涓滄柟", "鐙", "鍖楀啣", "鍏瓩", "灏夎繜",
            "婢瑰彴", "鎷撹穻", "鐧鹃噷", "閽熺", "涓滈儹", "闂讳汉"
        ];
        const hasCompoundSurname = compoundSurnames.some((surname) => cleanName.startsWith(surname));
        if (cleanName.length === 4 && !hasCompoundSurname && !/^[闃垮皬鑰乚[\u4e00-\u9fa5]{3}$/.test(cleanName)) {
            return false;
        }
        if (this.isLikelyChinesePersonName(cleanName)) {
            return true;
        }
        if (/^[闃垮皬鑰乚[\u4e00-\u9fa5]{1,2}$/.test(cleanName)) {
            return true;
        }
        return false;
    }

    sanitizeSynopsisNameAliases(project, name, aliases = []) {
        const cleanName = String(name || "").trim();
        const seen = new Set();
        return [cleanName, ...Utils.ensureArrayFromText(aliases)]
            .map((alias) => String(alias || "").trim())
            .filter(Boolean)
            .filter((alias) => alias === cleanName || alias.length >= 2)
            .filter((alias) => !this.containsObfuscatedText(alias))
            .filter((alias) => alias === cleanName || !this.isLikelyActionLikeCharacterCandidate(alias))
            .filter((alias) => alias === cleanName || !this.isGenericCharacterCandidateName(alias))
            .filter((alias) => {
                if (seen.has(alias)) {
                    return false;
                }
                seen.add(alias);
                return true;
            })
            .sort((left, right) => right.length - left.length);
    }

    restoreSynopsisMainCharacters(project) {
        const synopsisData = this.getSynopsisData(project);
        synopsisData.main_characters = synopsisData.main_characters && typeof synopsisData.main_characters === "object"
            ? synopsisData.main_characters
            : {};
        synopsisData.locked_character_names = synopsisData.locked_character_names && typeof synopsisData.locked_character_names === "object"
            ? synopsisData.locked_character_names
            : {};
        synopsisData.vague_to_name_mapping = synopsisData.vague_to_name_mapping && typeof synopsisData.vague_to_name_mapping === "object"
            ? synopsisData.vague_to_name_mapping
            : {};

        const cleanedLockedNames = {};
        Object.entries(synopsisData.locked_character_names).forEach(([name, info]) => {
            const cleanName = String(name || "").trim();
            if (!this.isTrustedSynopsisConcreteName(project, cleanName)) {
                return;
            }
            cleanedLockedNames[cleanName] = {
                ...(info && typeof info === "object" ? info : {}),
                aliases: this.sanitizeSynopsisNameAliases(
                    project,
                    cleanName,
                    [
                        ...this.buildSynopsisNameAliases(cleanName),
                        ...Utils.ensureArrayFromText(info?.aliases || [])
                    ]
                )
            };
        });

        Object.entries(synopsisData.main_characters).forEach(([role, name]) => {
            const cleanName = String(name || "").trim();
            if (!this.isTrustedSynopsisConcreteName(project, cleanName)) {
                return;
            }
            const existing = cleanedLockedNames[cleanName] || {};
            cleanedLockedNames[cleanName] = {
                ...existing,
                type: "涓昏",
                identity: role,
                locked_volume: existing.locked_volume || 1,
                aliases: this.sanitizeSynopsisNameAliases(
                    project,
                    cleanName,
                    [
                        ...this.buildSynopsisNameAliases(cleanName),
                        ...Utils.ensureArrayFromText(existing.aliases || [])
                    ]
                )
            };
        });

        synopsisData.locked_character_names = cleanedLockedNames;

        const aliasToRole = this.buildSynopsisAliasToRoleMap();
        synopsisData.vague_to_name_mapping = Object.fromEntries(
            Object.entries(synopsisData.vague_to_name_mapping)
                .map(([alias, realName]) => [String(alias || "").trim(), String(realName || "").trim()])
                .filter(([alias, realName]) => {
                    if (!alias || !realName || this.containsObfuscatedText(alias)) {
                        return false;
                    }
                    if (!this.isTrustedSynopsisConcreteName(project, realName)) {
                        return false;
                    }
                    if (aliasToRole[alias]) {
                        return true;
                    }
                    return alias.length >= 2 && !this.isLikelyActionLikeCharacterCandidate(alias);
                })
        );

        Object.entries(synopsisData.locked_character_names).forEach(([name, info]) => {
            if (info?.type === "涓昏" && info?.identity && !synopsisData.main_characters[info.identity]) {
                synopsisData.main_characters[info.identity] = name;
            }
        });

        return synopsisData;
    }

    applyKnownSynopsisMappings(text, mapping) {
        let output = String(text || "");
        Object.entries(mapping || {})
            .sort((left, right) => right[0].length - left[0].length)
            .forEach(([vagueTerm, specificName]) => {
                if (vagueTerm && specificName) {
                    output = output.replaceAll(vagueTerm, specificName);
                }
            });
        return output;
    }

    collectPendingSynopsisTerms(text, project) {
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const roleAliases = this.getSynopsisRoleAliases();
        const knownMappings = synopsisData.vague_to_name_mapping || {};
        const pending = new Set();

        Object.values(roleAliases).forEach((aliases) => {
            aliases.forEach((alias) => {
                if (String(text || "").includes(alias) && !knownMappings[alias]) {
                    pending.add(alias);
                }
            });
        });

        Object.keys(synopsisData.vague_supporting_roles || {}).forEach((term) => {
            if (String(text || "").includes(term) && !knownMappings[term]) {
                pending.add(term);
            }
        });

        return Array.from(pending).sort((left, right) => right.length - left.length);
    }

    detectSynopsisRoleRequirements(project, text = "", lockedVolume = 1) {
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const content = String(text || "");
        const vagueNames = new Set(["鐢蜂富", "濂充富", "涓昏", "涓讳汉鍏?, "鐢蜂竴", "濂充竴", "鐢蜂竴鍙?, "濂充竴鍙?, "鐢疯", "濂宠"]);
        const pendingRoles = new Set();
        const roleHints = [];

        (project?.outline?.characters || []).forEach((character) => {
            const rawName = String(character?.name || "").trim();
            const identity = String(character?.identity || character?.["韬唤"] || "").trim();
            if (!identity) {
                return;
            }

            let role = "";
            if (/濂充富|濂充富瑙抾濂充竴|濂充富浜哄叕|濂宠/.test(identity)) {
                role = "濂充富";
            } else if (/鐢蜂富|鐢蜂富瑙抾鐢蜂竴|鐢蜂富浜哄叕|鐢疯/.test(identity)) {
                role = "鐢蜂富";
            } else if (/涓昏|涓讳汉鍏?.test(identity)) {
                role = /濂?.test(identity) ? "濂充富" : /鐢?.test(identity) ? "鐢蜂富" : "";
            }

            if (!role) {
                return;
            }

            if (!rawName || vagueNames.has(rawName)) {
                pendingRoles.add(role);
                roleHints.push(`瑙掕壊璁惧畾涓€?{role}銆戜粛鏄ā绯婄О鍛硷細${rawName || "绌?}`);
                return;
            }

            if (this.applySynopsisMainCharacter(project, role, rawName, lockedVolume)) {
                roleHints.push(`宸蹭粠瑙掕壊璁惧畾閿佸畾銆?{role}銆?${rawName}`);
            }
        });

        Object.entries(this.getSynopsisRoleAliases()).forEach(([role, aliases]) => {
            if (synopsisData.main_characters?.[role]) {
                return;
            }
            if (aliases.some((alias) => content.includes(alias))) {
                pendingRoles.add(role);
            }
        });

        return {
            pendingRoles: Array.from(pendingRoles),
            roleHints
        };
    }

    buildSynopsisLockedNameTable(project) {
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const protagonistLines = Object.entries(synopsisData.main_characters || {})
            .filter(([, name]) => String(name || "").trim())
            .map(([role, name]) => `銆?{role}銆?{name}`);
        const supportingLines = Object.entries(synopsisData.locked_character_names || {})
            .filter(([, info]) => info?.type !== "涓昏")
            .slice(0, 30)
            .map(([name]) => name);

        if (!protagonistLines.length && !supportingLines.length) {
            return "";
        }

        return [
            "銆愷煍掟煍掟煍?瑙掕壊鍚嶅瓧閿佸畾琛?- 宸查攣瀹氱殑鍚嶅瓧缁濆绂佹淇敼锛侌煍掟煍掟煍掋€?,
            "",
            "涓€銆佷富瑙掑悕瀛楋紙鏈€楂樹紭鍏堢骇 - 缁濆涓嶅彲淇敼锛夛細",
            protagonistLines.length ? protagonistLines.join("\n") : "锛堟殏鏃犱富瑙掕瀹氾級",
            "",
            "浜屻€侀厤瑙掑悕瀛楋紙宸插嚭鍦洪厤瑙?- 蹇呴』娌跨敤鍘熷悕锛夛細",
            supportingLines.length ? supportingLines.join("銆?) : "锛堟殏鏃犻厤瑙掞級",
            "",
            "銆愬己鍒舵€ц鍒欍€戯細",
            "1. 浠ヤ笂鎵€鏈夊悕瀛楀凡閿佸畾锛孉I鍙兘浣跨敤杩欎簺瀹屾暣鍚嶅瓧锛屼笉鑳藉仛浠讳綍淇敼锛?,
            "2. 绂佹浣跨敤绠€绉般€佸埆鍚嶃€佹樀绉帮紒渚嬪鈥滆嫃濠夊効鈥濅笉鑳藉啓鎴愨€滃鍎库€濃€滆嫃濠夆€濃€滃コ涓烩€濓紒",
            "3. 绂佹浣跨敤妯＄硦绉板懠锛佲€滅敺涓绘瘝浜测€濆繀椤诲啓鎴愬叿浣撳悕瀛楋紙濡傗€滄灄澶汉鈥濓級锛?,
            "4. 鏂板嚭鍦鸿鑹插彲浠ヨ捣鍚嶏紝浣嗗繀椤荤鍚堜笘鐣岃涓旀湁杈ㄨ瘑搴︼紒",
            "5. 宸查攣瀹氬悕瀛楃殑鍒悕涔熺姝㈠崟鐙娇鐢紝閬垮厤鍚岃婕傜Щ銆?,
            "",
            "銆愯繚鍙嶉攣瀹氳〃鐨勫悗鏋溿€戯細鐢熸垚鐨勭珷鑺傚皢琚涓洪敊璇紝闇€瑕侀噸鏂扮敓鎴愶紒"
        ].join("\n");
    }

    buildSynopsisMappingHint(project) {
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const mappingLines = Object.entries(synopsisData.vague_to_name_mapping || {})
            .filter(([, specificName]) => String(specificName || "").trim())
            .slice(0, 20)
            .map(([vagueTerm, specificName]) => `  路 "${vagueTerm}" 鈫?${specificName}`);

        if (!mappingLines.length) {
            return "";
        }

        return [
            "銆愷煍?妯＄硦绉板懠鈫掑叿浣撳悕瀛楁槧灏勮〃锛堝繀椤婚伒瀹堬紒锛夈€?,
            "浠ヤ笅妯＄硦绉板懠宸茬粡瀵瑰簲浜嗗叿浣撳悕瀛楋紝蹇呴』鍦ㄦ墍鏈夌珷鑺備腑浣跨敤鍏蜂綋鍚嶅瓧锛?,
            mappingLines.join("\n"),
            "",
            "鈿狅笍 缁濆绂佹缁х画浣跨敤鏄犲皠琛ㄤ腑鐨勬ā绯婄О鍛硷紝蹇呴』鍐欏搴旂殑鍏蜂綋鍚嶅瓧锛?
        ].join("\n");
    }

    getSynopsisClichePatterns() {
        return {
            寮€灞€濂楄矾: {
                patterns: [
                    "绌胯秺閲嶇敓鑾峰緱閲戞墜鎸?,
                    "搴熸煷琚€€濠?缇炶颈鍚庡礇璧?,
                    "鎹″埌绁炵鍔熸硶/浼犳壙",
                    "鎰忓鑾峰緱寮哄ぇ琛€鑴夎閱?,
                    "琚鏃?瀹楅棬椹遍€愬悗宕涜捣"
                ],
                innovations: [
                    "銆愬弽鍚戝紑灞€銆戝紑灞€灏辨槸宸呭嘲锛岀劧鍚庡け鍘讳竴鍒囬噸鏂板紑濮?,
                    "銆愭櫘閫氬紑灞€銆戞病鏈夐噾鎵嬫寚锛屽畬鍏ㄩ潬鍔姏鍜屾櫤鎱?,
                    "銆愬弽娲惧紑灞€銆戜富瑙掓湰韬氨鏄弽娲捐鑹?,
                    "銆愬閲嶈韩浠姐€戝紑灞€灏辨湁澶嶆潅韬唤锛岄渶瑕佸湪韬唤闂村懆鏃?
                ]
            },
            鎴樻枟濂楄矾: {
                patterns: [
                    "涓昏琚帇鍒跺悗绐佺劧鐖嗗彂鍙嶆潃",
                    "鍏抽敭鏃跺埢绐佺牬澧冪晫鑾疯儨",
                    "闅愯棌瀹炲姏琚綆浼板悗闇囨儕鍏ㄥ満",
                    "浠ュ急鑳滃己鎴樿儨澶╂墠",
                    "鏁屼汉涓存鍓嶈浣犵瓑鐫€鐒跺悗鍙潵鏇村己鐨勬晫浜?
                ],
                innovations: [
                    "銆愬疄鍔涘樊璺濄€戜富瑙掔‘瀹炴墦涓嶈繃锛屽彧鑳芥櫤鍙栨垨閫冭窇",
                    "銆愪粯鍑轰唬浠枫€戣儨鍒╀即闅忕潃閲嶅ぇ鐗虹壊鎴栨崯澶?,
                    "銆愭晫浜哄彉鍙嬨€戞垬鏂楀悗涓嶆墦涓嶇浉璇嗭紝鎴愪负鐩熷弸",
                    "銆愬钩灞€鏀跺満銆戝弻鏂归兘鍙椾激鎾ら€€锛岀暀寰呭悗缁?,
                    "銆愮涓夋柟浠嬪叆銆戞垬鏂楄绗笁鏂规墦鏂垨鏀跺壊"
                ]
            },
            鎰熸儏濂楄矾: {
                patterns: [
                    "鑻遍泟鏁戠編鍚庡コ涓荤埍涓婄敺涓?,
                    "璇細浜х敓鎰熸儏",
                    "闈掓绔归┈鎵撹触澶╅檷",
                    "鎯呮晫鍑虹幇鍚庢渶缁堥€夋嫨涓昏",
                    "瀹舵棌鍙嶅鐨勬劅鎯呮渶缁堝啿鐮撮樆纰?
                ],
                innovations: [
                    "銆愭晳鍔╂棤鐢ㄣ€戞晳浜哄悗瀵规柟骞朵笉鎰熸縺锛屽弽鑰屽紩鍑烘柊鐭涚浘",
                    "銆愭劅鎯呮棤鍏炽€戞劅鎯呯嚎鍙槸璋冨懗锛屼笉蹇呮娆℃姠涓荤嚎",
                    "銆愬鍏冨叧绯汇€戜笉瑕佸彧鍋氫竴瀵逛竴锛屽彲浠ュ啓鏇村鏉傜殑鍏崇郴缃戠粶",
                    "銆愭劅鎯呭け璐ャ€戞劅鎯呯嚎涓嶅渾婊★紝浣嗚鑹插洜姝ゆ垚闀?
                ]
            },
            鍗囩骇濂楄矾: {
                patterns: [
                    "姣忔閬囧埌鏁屼汉閮借兘鍒氬ソ绐佺牬",
                    "鍚炲櫖鍚告敹鏁屼汉鍔涢噺蹇€熷崌绾?,
                    "鑾峰緱浼犳壙鍚庡疄鍔涙毚娑?,
                    "绉樺鍘嗙粌鍚庡疄鍔涘ぇ澧?,
                    "婵掓绐佺牬鑾峰緱鏂扮敓"
                ],
                innovations: [
                    "銆愭笎杩涙垚闀裤€戞病鏈夌獊鐒堕璺冿紝姣忎竴姝ラ兘鏉ヤ箣涓嶆槗",
                    "銆愬崌绾т唬浠枫€戠獊鐮磋浠樺嚭瀵垮懡銆佽蹇嗐€佸叧绯荤瓑浠ｄ环",
                    "銆愮摱棰堟湡銆戦暱鏃堕棿鍗′綇锛岄€艰鑹叉崲璺緞",
                    "銆愬け鍘诲姏閲忋€戝疄鍔涘€掗€€鍚庨噸鏂扮Н绱?
                ]
            },
            鍔垮姏濂楄矾: {
                patterns: [
                    "寤虹珛鍔垮姏鍚庝竴璺墿寮?,
                    "鏁屼汉鍔垮姏鍐呴儴鏈夊彌寰?,
                    "鑱旂洘瀵规姉鏈€缁堣儨鍒?,
                    "鍚炲苟鏁屽鍔垮姏澹ぇ鑷繁"
                ],
                innovations: [
                    "銆愮鐞嗗洶澧冦€戞墿寮犲悗瑕侀潰瀵瑰唴閮ㄥ垎瑁傚拰绠＄悊闅鹃",
                    "銆愮伆搴﹀娍鍔涖€戞病鏈夌粷瀵规閭紝鍚勬柟閮芥湁鍚堢悊鎬?,
                    "銆愬悎浣滃叡璧€戞晫浜哄彉鍚堜綔浼欎即锛岃€屼笉鏄彧鑳芥秷鐏?,
                    "銆愬娍鍔涘穿濉屻€戜富瑙掑娍鍔涗篃鍙兘鍥犲喅绛栧け璇€屽彈鍒?
                ]
            },
            鎻濂楄矾: {
                patterns: [
                    "涓昏鐪熷疄韬唤鏄煇鏌愪箣瀛愭垨缁ф壙浜?,
                    "骞曞悗榛戞墜绔熺劧鏄韩杈逛俊浠荤殑浜?,
                    "鏁屼汉鍏跺疄鏄鎺у埗鐨勫彈瀹宠€?,
                    "涓€鍒囬槾璋嬮兘鏄负浜嗕富瑙掑ソ"
                ],
                innovations: [
                    "銆愯韩浠芥棤鍏炽€戣韩浠芥彮闇蹭笉閲嶈锛岄噸瑕佺殑鏄鑹插浣曢€夋嫨",
                    "銆愬閲嶇湡鐩搞€戜竴灞傜湡鐩歌儗鍚庤繕鏈夋洿娣变竴灞?,
                    "銆愭棤鐪熺浉銆戞湁浜涗簨鎯呮案杩滄棤娉曞畬鍏ㄥ緱鐭ョ湡鐩?,
                    "銆愯嚜鎴戝畾涔夈€戣韩浠戒笉鍐冲畾鍛借繍锛岄€夋嫨鎵嶅喅瀹氬懡杩?
                ]
            },
            澶嶄粐濂楄矾: {
                patterns: [
                    "鍏ㄥ琚潃韪忎笂澶嶄粐璺?,
                    "鏈€缁堝彂鐜颁粐浜烘湁鑻﹁》",
                    "澶嶄粐鎴愬姛鍚庢劅鍒扮┖铏?,
                    "浠囦汉涓存鍓嶈鍑烘洿澶ч槾璋?
                ],
                innovations: [
                    "銆愬鏉傚姩鏈恒€戜粐鎭ㄨ儗鍚庝笉鏄畝鍗曞閿欙紝鑰屾槸澶嶆潅鍥犳灉",
                    "銆愯秴瓒婁粐鎭ㄣ€戞斁涓嬩笉鏄師璋咃紝鑰屾槸閫夋嫨鍋滄琚粐鎭ㄩ┍鍔?,
                    "銆愬浠囦唬浠枫€戞姤浠囨垚鍔熷嵈澶卞幓鏇撮噸瑕佺殑涓滆タ",
                    "銆愯疆鍥炲洶澧冦€戝浠囦箣鍚庤嚜宸变篃鎴愪簡鍒汉鐨勫浠囧璞?
                ]
            },
            瀹濈墿濂楄矾: {
                patterns: [
                    "绉樺涓幏寰楃绾у疂鐗?,
                    "瀹濈墿鍐呮湁鍣ㄧ伒鎸囧涓昏",
                    "瀹濈墿璁や富鍚庢棤浜哄彲澶?,
                    "鎷嶅崠浼氫笂鎹℃紡瀹濈墿"
                ],
                innovations: [
                    "銆愬疂鐗╂湁浠枫€戝疂鐗╅渶瑕佷粯鍑虹浉搴斾唬浠锋墠鑳戒娇鐢?,
                    "銆愬疂鐗╂湁缂恒€戝疂鐗╂湁缂洪櫡鎴栧壇浣滅敤",
                    "銆愬疂鐗╀箣浜夈€戝疂鐗╁甫鏉ヨ拷鏉€銆佽瑙庡拰杩為攣楹荤儲",
                    "銆愬疂鐗╂棤鐢ㄣ€戝疂鐗╂湭蹇呯湡鑳借В鍐抽棶棰橈紝鐢氳嚦浼氬け鏁?
                ]
            }
        };
    }

    getSynopsisPlotElements() {
        return {
            鍐茬獊鏉ユ簮: ["璧勬簮浜夊ず", "鐞嗗康鍐茬獊", "璇細寮曞彂", "鍒╃泭绾犺憶", "鎯呮劅鐭涚浘", "鍔垮姏鍗氬紙", "鍛借繍瀹夋帓", "鎰忓瑙﹀彂"],
            杞姌鏂瑰紡: ["绗笁鏂逛粙鍏?, "鎰忓鍙戠幇", "淇℃伅鎻湶", "鑳藉姏绐佺牬", "蹇冩€佽浆鍙?, "澶栭儴鍙樻晠", "鐩熷弸鑳屽彌", "鏁屼汉甯姪"],
            瑙ｅ喅璺緞: ["瀹炲姏纰惧帇", "鏅鸿皨鍙栬儨", "濡ュ崗鍜岃В", "鏆傛椂鍥為伩", "鍊熷姪澶栧姏", "浠樺嚭浠ｄ环", "鏀瑰彉鐩爣", "鏃堕棿鍖栬В"],
            褰卞搷鑼冨洿: ["涓汉鎴愰暱", "鍏崇郴鍙樺寲", "鍔垮姏鏍煎眬", "涓栫晫瑙傛彮绀?, "涓荤嚎鎺ㄨ繘", "鏀嚎寮€鍚?, "浼忕瑪鍥炴敹", "鏂拌皽鍥㈠嚭鐜?],
            鎯呮劅璧板悜: ["鐑娌歌吘", "娓╅Θ娌绘剤", "铏愬績鍘嬫姂", "杞绘澗鎼炵瑧", "鎯婃倸绱у紶", "鎰熷姩钀芥唱", "鎰ゆ€掍笉骞?, "鎭嶇劧澶ф偀"]
        };
    }

    getSynopsisEventTypeSuggestions() {
        return {
            鎴樻枟: {
                avoid: ["閲嶅鐨勬垬鏂楀満鏅?, "鐩镐技鐨勬晫浜虹被鍨?, "鍚屾牱鐨勬垬鏂楃粨鏋滄ā寮?],
                suggest: ["涓嶅悓绫诲瀷鐨勬晫浜猴紙浜?鍏?鏈哄叧/骞诲锛?, "澶氭牱鐨勬垬鏂楃幆澧?, "鎰忓鐨勬垬鏂楃粨鏋?, "鎴樻枟鐨勯潪鎴樻枟鍚庢灉"]
            },
            淇偧: {
                avoid: ["閲嶅鐨勭獊鐮存弿鍐?, "鍚屾牱鐨勪慨鐐兼柟娉?, "鏃犱唬浠风殑鎻愬崌"],
                suggest: ["涓嶅悓鐨勪慨鐐肩摱棰?, "鍒涙柊鐨勭獊鐮存柟寮?, "绐佺牬鍚庣殑鍓綔鐢?, "淇偧鐨勬剰澶栨敹鑾?]
            },
            瀵硅瘽: {
                avoid: ["閲嶅鐨勫璇濈洰鐨?, "鐩镐技鐨勪俊鎭彮闇叉柟寮?, "鍗曞悜鐨勪俊鎭紶閫?],
                suggest: ["澶氶噸鐩殑鐨勫璇?, "淇℃伅鍗氬紙涓庤瘯鎺?, "瀵硅瘽涓殑璇細涓庢殫绀?, "瀵硅瘽鐨勫悗缁奖鍝?]
            },
            鎺㈢储: {
                avoid: ["閲嶅鐨勫彂鐜版ā寮?, "鍚屾牱鐨勬帰绱㈢洰鐨?, "鏃犻闄╃殑鎺㈢储"],
                suggest: ["鎺㈢储鐨勬剰澶栧彂鐜?, "鎺㈢储鐨勪唬浠蜂笌椋庨櫓", "鎺㈢储鐨勮繛閿佸弽搴?, "鎺㈢储鐨勯仐鐣欓棶棰?]
            },
            浜ゆ槗: {
                avoid: ["閲嶅鐨勪氦鏄撶被鍨?, "椤哄埄鐨勪氦鏄撹繃绋?, "鏃犲悗缁殑浜ゆ槗"],
                suggest: ["浜ゆ槗鑳屽悗鐨勫崥寮?, "浜ゆ槗鐨勬剰澶栧悗鏋?, "浜ゆ槗鐨勯亾寰峰洶澧?, "浜ゆ槗鐨勪俊鎭樊"]
            }
        };
    }

    getSynopsisAllowedRepeatEvents() {
        return {
            淇偧绐佺牬: {
                keywords: ["淇偧", "绐佺牬", "闂叧", "椤挎偀", "澧冪晫"],
                description: "姣忎釜澧冪晫閮藉彲鑳界獊鐮达紝浣嗘瘡娆＄獊鐮撮兘璇ュ啓鍑轰笉鍚岀殑鏂伴矞鎰熴€?,
                variations: [
                    "绐佺牬鏃舵満锛氶棴鍏虫垚鍔?/ 鎴樻枟椤挎偀 / 鏈虹紭宸у悎 / 浼犳壙鍔犳寔",
                    "绐佺牬鍦烘櫙锛氬畻闂ㄥ瘑瀹?/ 绉樺绂佸湴 / 鎴樺満涔嬩笂 / 浼犳壙涔嬪湴",
                    "绐佺牬浠ｄ环鎴栧鍔憋細瀹炲姏鏆存定 / 鑾峰緱绁為€?/ 瑙夐啋琛€鑴?/ 寮€鍚娉?,
                    "绐佺牬鍚庣画锛氱⒕鍘嬪悓闃?/ 鎵撹劯鍢茶鑰?/ 鏀惰幏宕囨嫓 / 寮€鍚柊鍦板浘"
                ],
                examples: [
                    "鍙互浠庣獊鐮存椂鏈轰笌绐佺牬浠ｄ环鍏ユ墜锛岄伩鍏嶆瘡娆￠兘鍙槸鈥滄墦鐫€鎵撶潃灏卞崌绾р€濄€?,
                    "鍙互璁╃獊鐮存敼鍙樹汉鐗╁叧绯绘垨灞€鍔匡紝鑰屼笉鍙槸鏁板€兼彁鍗囥€?"
                ]
            },
            鐢熷瓙鎬€瀛? {
                keywords: ["鎬€瀛?, "鐢熷瓙", "鑳?, "鐢熶骇", "瀛愬棧"],
                description: "鐢熷瓙鏂囬噷鎬€瀛曞拰鐢熶骇鍙互閲嶅鍑虹幇锛屼絾姣忔閮藉簲褰撳啓鍑轰笉鍚屾儏缁€佷笉鍚屽澧冨拰涓嶅悓鍚庣画銆?,
                variations: [
                    "鎯婂枩鏉ユ簮锛氭柊濠氬嵆瀛?/ 姹傚瓙寰楀瓙 / 鎰忓鎯婂枩 / 澶╅檷绁ョ憺",
                    "瀛曟湡鐘舵€侊細涓堝か瀹犵埍 / 瀹舵棌閲嶈 / 韬綋寮傜姸 / 澶╄祴棰勫厗",
                    "鐢熶骇缁撴灉锛氭瘝瀛愬钩瀹?/ 榫欏嚖鍛堢ゥ / 瀛╁瓙澶╄祴寮傜 / 寮曞彂鏂板眬鍔?,
                    "鍚庣画褰卞搷锛氬搴叧绯诲彉鍖?/ 鍔垮姏鎬佸害鍙樺寲 / 濂栧姳闄嶄复 / 鏂扮洰鏍囧紑鍚?
                ],
                examples: [
                    "涓嶈鎶婃瘡涓€鑳庨兘鍐欐垚鍚屾牱鐨勨€滃彂鐜版€€瀛?浼椾汉楂樺叴-椤哄埄鐢熶骇鈥濄€?,
                    "鍙互浠庡鍔便€佽韩浠藉彉鍖栥€佸瓙鍡ｅぉ璧嬫垨瀹枟鍘嬪姏涓婂仛宸紓銆?
                ]
            },
            鎰熸儏鍙戝睍: {
                keywords: ["鎰熸儏", "蹇冨姩", "琛ㄧ櫧", "濠氱害", "鎴愬", "鏆ф槯"],
                description: "鎰熸儏鎺ㄨ繘鍙互閲嶅锛屼絾姣忎竴娈靛叧绯婚兘璇ユ湁涓嶅悓鐨勮捣鐐广€侀樆鍔涘拰钀界偣銆?,
                variations: [
                    "鐩搁亣鏂瑰紡锛氬伓鐒堕倐閫?/ 韬唤鏇濆厜 / 鑻遍泟鏁戠編 / 闈掓閲嶉€?,
                    "鍗囨俯璺緞锛氬叡鎮ｉ毦 / 鏃ュ父鐩稿 / 鍒╃泭鍚堜綔 / 浠峰€艰鍚稿紩",
                    "闃诲姏绫诲瀷锛氳韩浠藉樊璺?/ 瀹舵棌鍙嶅 / 鏃ф€ㄦ湭瑙?/ 鐩爣鍐茬獊",
                    "缁撴灉钀界偣锛氫慨鎴愭鏋?/ 鏆傛椂閿欒繃 / 鍏崇郴鍗囩骇 / 鍩嬩笅鏇村鏉傜殑鐗佃繛"
                ],
                examples: [
                    "涓嶈姣忔潯鎰熸儏绾块兘濂椻€滄晳浜?蹇冨姩-琛ㄧ櫧鈥濆悓涓€妯℃澘銆?,
                    "鍚屾牱鏄崌娓╋紝涔熷彲浠ュ垎鍒啓鍒╃泭鍚岀洘銆佸懡杩愮壍鎵€佷簰鐩稿埄鐢ㄥ悗杞湡蹇冦€?
                ]
            },
            鑾峰緱瀹濈墿: {
                keywords: ["瀹濈墿", "娉曞櫒", "绁炲櫒", "鍔熸硶", "浼犳壙", "鑷冲疂"],
                description: "鑾峰緱瀹濈墿鍙互閲嶅锛屼絾瀹濈墿鏉ユ簮銆佷唬浠峰拰浣滅敤蹇呴』鍙樺寲銆?,
                variations: [
                    "鑾峰緱鏂瑰紡锛氱澧冩墍寰?/ 鎷嶅崠绔炴媿 / 鍑昏触寮烘晫鎺夎惤 / 鎰忓缁ф壙",
                    "瀹濈墿灞炴€э細绋€鏈夊疂鐗?/ 鍙茶瘲绁炲櫒 / 鏈夌己涔嬬墿 / 闄愬埗鍨嬪簳鐗?,
                    "鍓綔鐢ㄦ垨浜夊ず锛氳杩芥潃 / 璁や富澶辫触 / 闇€瑕佷唬浠?/ 寮曞彂瑙婅",
                    "鍚庣画鏁堟灉锛氬疄鍔涘彉鍖?/ 韬唤鍙樺寲 / 鍏崇郴鍙樺寲 / 鏂板湴鍥惧紑鍚?
                ],
                examples: [
                    "涓嶈姣忔閮藉啓鎴愨€滈殢鎵嬫崱鍒扮绾у疂鐗╃劧鍚庣珛鍒绘毚娑ㄢ€濄€?,
                    "鍙互鍐欏疂鐗╂湁缂洪櫡銆佹湁闄愬埗锛屾垨鑰呭甫鏉ヨ拷鏉€涓庤繛閿侀棶棰樸€?
                ]
            }
        };
    }

    extractSynopsisPatternKeywords(pattern) {
        return String(pattern || "")
            .replace(/[鈥溾€?'銆侊紝銆傦紒锛燂紱锛?锛堬級()\[\]銆愩€慮/g, " ")
            .replace(/\//g, " ")
            .split(/\s+/)
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length >= 2);
    }

    matchSynopsisPattern(pattern, text) {
        const keywords = this.extractSynopsisPatternKeywords(pattern);
        if (!keywords.length) {
            return false;
        }
        const matchedCount = keywords.filter((keyword) => String(text || "").includes(keyword)).length;
        return matchedCount >= Math.max(1, Math.ceil(keywords.length * 0.5));
    }

    countSynopsisKeywordMatches(text, keywords = []) {
        const source = String(text || "");
        return (keywords || []).reduce((count, keyword) => {
            if (!keyword) {
                return count;
            }
            const escaped = String(keyword).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const matches = source.match(new RegExp(escaped, "g"));
            return count + (matches ? matches.length : 0);
        }, 0);
    }

    analyzeSynopsisInnovation(project, volumeNumber, currentOutlineText = "") {
        const previousLines = this.collectSynopsisHistoryLines(project, volumeNumber);
        const historyText = previousLines.join("\n");
        const recentHistoryText = previousLines.slice(-10).join("\n");
        const outlineText = String(currentOutlineText || "").trim();
        const clichePatterns = this.getSynopsisClichePatterns();
        const plotElements = this.getSynopsisPlotElements();
        const allowedRepeatEvents = this.getSynopsisAllowedRepeatEvents();

        const detectedCliches = [];
        Object.entries(clichePatterns).forEach(([category, info]) => {
            (info.patterns || []).forEach((pattern) => {
                if (!this.matchSynopsisPattern(pattern, recentHistoryText || historyText)) {
                    return;
                }
                detectedCliches.push({
                    category,
                    pattern,
                    suggestion: info.innovations || []
                });
            });
        });

        const repetitionRisks = [];
        Object.entries(plotElements).forEach(([type, elements]) => {
            (elements || []).forEach((element) => {
                if (outlineText && outlineText.includes(element) && historyText.includes(element)) {
                    repetitionRisks.push({
                        type,
                        element,
                        message: `銆?{element}銆嶅凡鍦ㄤ箣鍓嶇珷鑺備腑澶氭鍑虹幇`
                    });
                }
            });
        });

        const allowedRepeats = [];
        Object.entries(allowedRepeatEvents).forEach(([type, info]) => {
            const currentMatches = this.countSynopsisKeywordMatches(outlineText, info.keywords || []);
            const historyMatches = this.countSynopsisKeywordMatches(historyText, info.keywords || []);
            if (currentMatches > 0 && historyMatches > 0) {
                allowedRepeats.push({
                    type,
                    description: info.description,
                    count: historyMatches,
                    variations: info.variations || [],
                    examples: info.examples || []
                });
            }
        });

        return {
            previousLines,
            detectedCliches,
            repetitionRisks,
            allowedRepeatEvents: allowedRepeats
        };
    }

    collectSynopsisHistoryLines(project, currentVolumeNumber) {
        return this.collectSynopsisHistoryItems(project, currentVolumeNumber).map((item) => item.line);
    }

    buildDesktopSynopsisPreviousContext(project, currentVolumeNumber) {
        if (!project?.outline?.volumes?.length || currentVolumeNumber <= 1) {
            return "";
        }

        const sections = [];
        project.outline.volumes
            .slice(0, Math.max(0, currentVolumeNumber - 1))
            .forEach((volume, index) => {
                const synopsis = this.normalizeSynopsisReferenceText(
                    project,
                    volume.chapterSynopsis || volume.chapter_synopsis || ""
                );
                if (!String(synopsis || "").trim()) {
                    return;
                }
                sections.push(`銆愮${index + 1}鍗峰凡鏈夌珷鑺?- 绂佹閲嶅杩欎簺鎯呰妭銆慭n${synopsis}`);
            });
        return sections.join("\n\n");
    }

    collectHistoricalSynopsisCharacterSignals(project, currentVolumeNumber, extraText = "") {
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const historyText = [
            this.collectSynopsisHistoryLines(project, currentVolumeNumber).join("\n"),
            extraText || ""
        ].filter(Boolean).join("\n");
        const names = new Set();
        const relationships = new Map();

        Object.values(synopsisData.main_characters || {}).forEach((name) => {
            if (name) {
                names.add(name);
            }
        });
        Object.keys(synopsisData.locked_character_names || {}).forEach((name) => {
            if (name) {
                names.add(name);
            }
        });
        (project?.outline?.characters || []).forEach((character) => {
            const name = String(character?.name || "").trim();
            if (name) {
                names.add(name);
            }
        });

        if (historyText.trim()) {
            const namePatterns = [
                /[\u4e00-\u9fa5]{2,4}(?=璇磡閬搢绗憒闂畖绛攟鍠妡鍙珅楠倈鐐箌鐪媩璧皘绔檤鍧恷璺憒鎯硘瑙墊鍙戠幇|鐪嬪埌|鍚埌)/g,
                /([\u4e00-\u9fa5]{2,4})(?=鐨剕涔?/g,
                /["鈥溾€濄€屻€嶃€庛€廬([\u4e00-\u9fa5]{2,4})["鈥溾€濄€屻€嶃€庛€廬/g,
                /(?:涓巪鍜寍璺焲鍚寍鍚憒瀵?([\u4e00-\u9fa5]{2,4})(?=[锛屻€傘€侊紒锛焅s]|$)/g
            ];
            namePatterns.forEach((pattern) => {
                Array.from(historyText.matchAll(pattern)).forEach((match) => {
                    const name = String(match?.[1] || match?.[0] || "").trim();
                    if (name) {
                        names.add(name);
                    }
                });
            });

            const relationPatterns = [
                /([\u4e00-\u9fa5]{2,4})鏄?[\u4e00-\u9fa5]{2,4})鐨?鐖朵翰|姣嶄翰|鍝ュ摜|寮熷紵|濮愬|濡瑰|甯堢埗|寰掑紵|濡诲瓙|涓堝か|鍎垮瓙|濂冲効|鏈嬪弸|鏁屼汉|瀵规墜|鎭嬩汉|鏈濡粅鏈澶?/g,
                /([\u4e00-\u9fa5]{2,4})鐨?鐖朵翰|姣嶄翰|鍝ュ摜|寮熷紵|濮愬|濡瑰|甯堢埗|寰掑紵|濡诲瓙|涓堝か|鍎垮瓙|濂冲効|鏈嬪弸|鏁屼汉|瀵规墜|鎭嬩汉|鏈濡粅鏈澶?鏄?[\u4e00-\u9fa5]{2,4})/g,
                /([\u4e00-\u9fa5]{2,4})(?:涓巪鍜寍璺?([\u4e00-\u9fa5]{2,4})(?:缁撶洘|鎴愬|鎴愪负|寤虹珛)(.+?)(?=锛寍銆倈锛亅锛?/g
            ];
            relationPatterns.forEach((pattern, index) => {
                Array.from(historyText.matchAll(pattern)).forEach((match) => {
                    if (index === 0) {
                        const [, left, right, relation] = match;
                        if (left && right && relation) {
                            relationships.set(`${left}-${right}`, `${left} 鈫?${right}锛?{relation}`);
                        }
                        return;
                    }
                    if (index === 1) {
                        const [, left, relation, right] = match;
                        if (left && right && relation) {
                            relationships.set(`${left}-${right}`, `${left} 鈫?${right}锛?{relation}`);
                        }
                        return;
                    }
                    const [, left, right, relation] = match;
                    if (left && right && relation) {
                        relationships.set(`${left}-${right}`, `${left} 鈫?${right}锛?{String(relation || "").trim()}`);
                    }
                });
            });
        }

        const excludeWords = new Set([
            "杩欎釜", "閭ｄ釜", "浠€涔?, "鎬庝箞", "濡備綍", "涓轰粈涔?, "鍝噷", "閭ｉ噷", "杩欓噷",
            "姝ゆ椂", "褰兼椂", "褰撴椂", "涔嬪悗", "涔嬪墠", "闅忓悗", "鐒跺悗", "鏈€鍚?, "鏈€鍒?,
            "鍙槸", "浣嗘槸", "涓嶈繃", "鑰屼笖", "骞朵笖", "鎴栬€?, "铏界劧", "鍗充娇", "濡傛灉",
            "涓€浜?, "鎵€鏈?, "鍏ㄩ儴", "閮ㄥ垎", "澶у", "灏戞暟", "寰堝", "璁稿", "鏌愪簺",
            "涓昏", "鐢蜂富", "濂充富", "閰嶈", "榫欏", "璺汉", "鍏朵粬浜?, "浼椾汉", "涓栫晫",
            "鍦版柟", "涓滆タ", "浜嬫儏", "鎯呭喌", "闂", "鍘熷洜", "缁撴灉", "鍔炴硶", "鏃跺€?,
            "鐬棿", "鐗囧埢", "涓€鐩?, "宸茬粡", "姝ｅ湪", "灏嗚", "鏇剧粡", "缁堜簬"
        ]);
        const filteredNames = Array.from(names)
            .map((name) => String(name || "").trim())
            .filter((name) => /^[\u4e00-\u9fa5]{2,4}$/.test(name) && !excludeWords.has(name));

        return {
            names: Array.from(new Set(filteredNames)).sort((left, right) => left.localeCompare(right, "zh-Hans-CN")),
            relationships: Array.from(relationships.values()).slice(0, 12)
        };
    }

    buildSynopsisNamePatternWarning(names = []) {
        const cleanNames = Array.from(new Set((names || []).map((name) => String(name || "").trim()).filter(Boolean)));
        if (!cleanNames.length) {
            return "";
        }

        const suffixMap = new Map();
        cleanNames.forEach((name) => {
            if (name.length < 2) {
                return;
            }
            [2, 1].forEach((suffixLength) => {
                if (name.length >= suffixLength) {
                    const suffix = name.slice(-suffixLength);
                    const list = suffixMap.get(suffix) || [];
                    list.push(name);
                    suffixMap.set(suffix, list);
                }
            });
        });

        const commonSuffixes = new Set(["澶?, "鍦?, "浜?, "瀛?, "鍎?, "涓€", "浜?, "涓?]);
        const repeatedPatterns = Array.from(suffixMap.entries())
            .filter(([suffix, values]) => suffix && values.length >= 2 && !commonSuffixes.has(suffix))
            .sort((left, right) => right[1].length - left[1].length)
            .slice(0, 5);

        if (!repeatedPatterns.length) {
            return "";
        }

        return [
            "銆愨殸锔?鍚嶅瓧妯″紡閲嶅璀﹀憡 - 鏋佸叾閲嶈锛併€?,
            "妫€娴嬪埌浠ヤ笅鍚嶅瓧鍚庣紑閲嶅杩囧锛岀姝㈠啀浣跨敤绫讳技妯″紡锛?,
            repeatedPatterns.map(([suffix, values]) => `  路 鈥?{suffix}鈥濆瓧閲嶅锛?{Array.from(new Set(values)).join("銆?)}`).join("\n"),
            "",
            "銆愯捣鍚嶈姹傘€?,
            "1. 绂佹缁х画浣跨敤涓婇潰杩欎簺閲嶅鍚嶅瓧鍚庣紑銆?,
            "2. 姣忎釜鏂拌鑹茬殑鍚嶅瓧蹇呴』鏈夎鲸璇嗗害锛岄鏍煎悇寮傘€?,
            "3. 閬垮厤鎵归噺鐢熸垚鈥淴鎷涘ǎ銆乆缈犺姳銆乆绉€鑻扁€濊繖绉嶆ā寮忓寲鍚嶅瓧銆?,
            "4. 鍚嶅瓧瑕佺鍚堜笘鐣岃鍜屾椂浠ｆ劅锛岄噸鐐规槸绋冲畾涓€鑷淬€?
        ].join("\n");
    }

    buildSynopsisPendingVagueHint(project, volumeNumber, text = "") {
        const pendingTerms = this.collectPendingSynopsisTerms(text, project);
        if (!pendingTerms.length) {
            return "";
        }

        if (Number(volumeNumber || 0) <= 1) {
            return [
                "銆愰娆″畾鍚嶅悗蹇呴』閿佸畾銆?,
                "浠ヤ笅瑙掕壊濡傛灉杩樻病鏈夊叿浣撳悕瀛楋紝鍙互鍦ㄩ娆″嚭鍦烘椂琛ヤ竴涓悕瀛楋紱浣嗕竴鏃﹀畾鍚嶏紝鏈嵎鍚庣画鍜屽悗闈㈠悇鍗烽兘蹇呴』娌跨敤鍚屼竴涓悕瀛楋細",
                pendingTerms.slice(0, 12).map((term) => `  路 鈥?{term}鈥漙).join("\n"),
                "",
                "銆愬己鍒舵€ц姹傘€?,
                "1. 鍚屼竴涓鑹蹭竴鏃︾敤浜嗗叿浣撳悕瀛楋紝鍚庣画涓嶈兘鍐嶆崲鍚嶃€?,
                "2. 宸茬粡鏈夋槧灏勬垨宸查攣瀹氱殑瑙掕壊锛屽彧鑳芥部鐢ㄦ棫鍚嶅瓧銆?,
                "3. 鍚嶅瓧涓嶉渶瑕佸埢鎰忓じ寮狅紝閲嶇偣鏄ǔ瀹氫竴鑷淬€?
            ].join("\n");
        }

        return [
            "銆愬悗缁嵎鍙仛娌跨敤锛屼笉瑕佹敼鍚嶃€?,
            "浠ヤ笅绉板懠濡傛灉宸茬粡鍦ㄥ墠鏂囧搴旇繃鍏蜂綋鍚嶅瓧锛屾湰鍗峰繀椤荤户缁部鐢ㄥ師鍚嶏紱濡傛灉娌℃湁鎶婃彙锛屽氨涓嶈鎶婃棫瑙掕壊鏀规垚鏂板悕瀛楋細",
            pendingTerms.slice(0, 12).map((term) => `  路 鈥?{term}鈥漙).join("\n"),
            "",
            "銆愬己鍒舵€ц姹傘€?,
            "1. 宸查攣瀹氳鑹插彧鑳芥部鐢ㄦ棫鍚嶅瓧锛屼笉鑳戒竴鍗蜂竴涓悕瀛椼€?,
            "2. 娌℃湁鏄庣‘璇佹嵁鏃讹紝涓嶈缁欐棫瑙掕壊閲嶆柊璧峰悕銆?,
            "3. 閲嶇偣鏄悓涓€瑙掕壊鍓嶅悗缁熶竴锛屼笉鏄拷姹傛瘡鍗烽兘鏀规垚鏂板悕瀛椼€?
        ].join("\n");
    }

    buildSynopsisNameGenerationHint(project, volumeNumber, text = "") {
        const roleRequirement = this.detectSynopsisRoleRequirements(project, text, volumeNumber);
        if (Number(volumeNumber || 0) !== 1 || !roleRequirement.pendingRoles?.length) {
            return "";
        }
        return [
            "銆愮涓€鍗疯鑹插悕瀛楀鐞嗐€?,
            "妫€娴嬪埌瑙掕壊璁惧畾鎴栬緭鍏ラ噷浠嶆湁妯＄硦涓昏绉板懠锛?,
            roleRequirement.pendingRoles.map((role) => `銆?{role}銆戝綋鍓嶄粛鏈ǔ瀹氬畾鍚嶏紝鍙湪棣栨鍑哄満鏃惰嚜鐒惰ˉ鍏蜂綋鍚嶅瓧`).join("\n"),
            "",
            "銆愯鍒欍€?,
            "1. 濡傛灉鏈嵎棣栨缁欒繖浜涜鑹茶捣鍚嶏紝鍚庣画鎵€鏈夌珷鑺傚拰鍚庣画鎵€鏈夊嵎閮藉繀椤绘部鐢ㄥ悓涓€涓悕瀛椼€?,
            "2. 濡傛灉鏆傛椂娌℃湁鑷劧鐨勫畾鍚嶆満浼氾紝涓嶈涓轰簡璧峰悕鑰岀‖鏀瑰墽鎯呫€?,
            "3. 閲嶇偣涓嶆槸鍚嶅瓧澶氬崕涓斤紝鑰屾槸鍚屼竴涓鑹蹭笉瑕佸啀鏀瑰悕銆?
        ].join("\n");
    }

    buildSynopsisHardFactHint(project, volumeNumber, contextText = "") {
        const signals = this.collectHistoricalSynopsisCharacterSignals(project, volumeNumber, contextText);
        const relevantCharacters = this.collectRelevantCharacters(project, contextText, signals.names);
        const factLines = [];

        relevantCharacters.slice(0, 10).forEach((character) => {
            const identity = String(character?.identity || character?.["韬唤"] || "").trim();
            if (character?.name && identity) {
                factLines.push(`- ${character.name}锛?{identity}`);
            }
        });
        signals.relationships.slice(0, 8).forEach((line) => {
            factLines.push(`- ${line}`);
        });

        if (!factLines.length) {
            return [
                "銆愬悓鎵圭粏绾茬‖浜嬪疄閿佸畾銆?,
                "鍚屼竴鎵规閲岋紝瑙掕壊鐨勮韩浠姐€佷綅浠姐€佽緢鍒嗐€佷翰灞炲叧绯汇€佸閰嶃€佸笀寰掋€佸畼鑱屻€侀樀钀ヤ竴鏃﹂娆℃槑纭紝鍚庢枃蹇呴』鍘熸牱娌跨敤锛岀姝㈡敼鍙ｃ€?,
                "渚嬪宸茬粡鍐欐垚鈥滃お鍚庣殑鍎垮瓙鏄殗甯濃€濓紝鍚庢枃灏变笉鑳芥敼鎴愨€滃皬鐨囧瓙鈥濓紱宸茬粡鍐欐垚鈥滃お瀛愬鈥濓紝鍚庢枃涔熶笉鑳介檷鍥炩€滅濂斥€濄€?
            ].join("\n");
        }

        return [
            "銆愬悓鎵圭粏绾茬‖浜嬪疄閿佸畾銆?,
            "浠ヤ笅韬唤涓庡叧绯讳竴鏃﹀啓瀹氾紝鍚庢枃蹇呴』淇濇寔涓€鑷达紝涓嶈兘鍓嶅悗鏀瑰彛锛?,
            factLines.join("\n"),
            "濡傛灉鏈壒鍚庢枃闇€瑕佺户缁彁鍒拌繖浜涗汉锛屽繀椤绘部鐢ㄥ悓鏍风殑韬唤銆佷綅浠姐€佽緢鍒嗗拰鍏崇郴銆?,
            "宸茬粡鍐欐垚宸茬櫥鍩恒€佸凡鎴愬銆佸凡鎷滃笀銆佸凡璁や翰銆佸凡灏佺埖銆佸凡鎬€瀛曘€佸凡鐢熷瓙绛変簨瀹烇紝鍚庢枃涓嶈兘鍥為€€鎴愭湭鍙戠敓銆?
        ].join("\n");
    }

    buildDesktopSynopsisCharacterConsistencyHint(project, { volumeNumber, concept, volumeSummary, existingSynopsis, outlineContext = "" }) {
        const contextText = [concept || "", volumeSummary || "", existingSynopsis || "", outlineContext || ""].filter(Boolean).join("\n");
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const historicalSignals = this.collectHistoricalSynopsisCharacterSignals(project, volumeNumber, contextText);
        const pendingVagueHint = this.buildSynopsisPendingVagueHint(project, volumeNumber, contextText);
        const namePatternWarning = this.buildSynopsisNamePatternWarning(historicalSignals.names);
        const lockedMainNames = Object.entries(synopsisData.main_characters || {})
            .filter(([, name]) => String(name || "").trim())
            .map(([role, name]) => `銆?{role}銆?{name}`);

        const parts = [];
        if (lockedMainNames.length) {
            parts.push([
                "銆愷煍?宸查攣瀹氫富瑙掑悕瀛椼€?,
                lockedMainNames.join("\n"),
                "",
                "鍚庣画鎵€鏈夊嵎鐨勭粏绾查兘蹇呴』缁х画娌跨敤浠ヤ笂涓昏鍚嶅瓧锛岀姝㈡敼鍚嶏紝绂佹閫€鍥炴垚鈥滅敺涓烩€濃€滃コ涓烩€濈瓑妯＄硦绉板懠锛?
            ].join("\n"));
        }

        if (pendingVagueHint) {
            parts.push(pendingVagueHint);
        }

        if (historicalSignals.names.length) {
            const relationshipHint = historicalSignals.relationships.length
                ? `\n\n銆愬凡寤虹珛鐨勪汉鐗╁叧绯汇€慭n${historicalSignals.relationships.slice(0, 10).map((line) => `  路 ${line}`).join("\n")}`
                : "";
            const mainCharHint = lockedMainNames.length
                ? [
                    "銆愷煍答煍答煍?鏍稿績瑙掕壊鍚嶅瓧 - 缁濆绂佹淇敼锛侌煍答煍答煍淬€?,
                    lockedMainNames.map((line) => line.replace("銆?, "銆? ")).join("\n").replace(/銆? 銆?g, "銆?),
                    "",
                    "鈿狅笍 浠ヤ笂鏄湰灏忚鐨勬牳蹇冧富瑙掞紝鎵€鏈夌珷鑺傚繀椤讳娇鐢ㄨ繖浜涘悕瀛楋紝缁濆绂佹鏀瑰悕锛?,
                    "鈿狅笍 渚嬪锛氬鏋滃コ涓诲彨鈥滆嫃濠夊効鈥濓紝灏变笉鑳藉啓鎴愨€滆嫃濠夆€濃€滃鍎库€濃€滃コ涓烩€濈瓑鍏朵粬绉板懠锛?
                ].join("\n")
                : "";
            parts.push([
                mainCharHint,
                "銆愨殸锔?鎵€鏈夊凡鍑哄満瑙掕壊鍚嶅瓧涓€鑷存€ц姹?鈿狅笍銆?,
                "浠ヤ笅瑙掕壊宸插湪鏈皬璇翠腑鍑哄満锛屽繀椤讳娇鐢ㄨ繖浜涘悕瀛楋紙涓昏+閰嶈閮戒笉鑳芥敼鍚嶏級锛?,
                historicalSignals.names.slice(0, 24).join("銆?),
                relationshipHint,
                "",
                "绂佹鏀瑰悕銆佺姝娇鐢ㄢ€滅敺涓烩€濃€滃コ涓烩€濃€滃珎瀛愨€濃€滈偅瀹朵紮鈥濈瓑妯＄硦绉板懠锛?,
                "蹇呴』娌跨敤宸插嚭鐜扮殑瑙掕壊鍚嶅瓧鍜屼汉鐗╁叧绯伙紒",
                namePatternWarning
            ].filter(Boolean).join("\n"));
        } else if (namePatternWarning) {
            parts.push(namePatternWarning);
        }

        const hardFactHint = this.buildSynopsisHardFactHint(project, volumeNumber, contextText);
        if (hardFactHint) {
            parts.push(hardFactHint);
        }

        return parts.filter(Boolean).join("\n\n");
    }

    buildDesktopSynopsisPromptContext({ project, concept, volumeSummary, existingSynopsis, volumeNumber, chapterCount }) {
        const outlineSlice = this.extractCurrentVolumeOutlineContext(project, volumeNumber);
        const currentVolume = project?.outline?.volumes?.[volumeNumber - 1] || {};
        const contextText = [concept || "", volumeSummary || "", existingSynopsis || "", outlineSlice.currentOutline || ""].filter(Boolean).join("\n");
        const lockedNamesTable = this.buildSynopsisLockedNameTable(project);

        return {
            lockedNamesTable,
            currentVolume,
            currentVolumeTaskLabel: `${currentVolume.title || `绗?{volumeNumber}鍗穈}${volumeSummary ? ` - ${Utils.summarizeText(volumeSummary, 120)}` : ""}`,
            volumeSynopsisContext: this.buildVolumeSynopsisContext(project, volumeNumber),
            currentVolumeOutlineContext: String(outlineSlice.currentOutline || "").trim(),
            adjacentOutlineSummary: outlineSlice.adjacentSummary || "",
            mappingHint: this.buildSynopsisMappingHint(project),
            synopsisHistoryContext: this.buildSynopsisHistoryContext(project, volumeNumber),
            previousSynopsisContext: this.buildDesktopSynopsisPreviousContext(project, volumeNumber),
            previousVolumeEnding: this.buildPreviousVolumeEnding(project, volumeNumber),
            storyStateSummary: this.buildStoryStateSummary(project, volumeNumber, 1, contextText),
            timelineGuard: this.buildTimelineGuard(project, 1),
            foreshadowGuard: this.buildForeshadowGuard(project, 1),
            synopsisClarityGuard: this.buildSynopsisClarityGuard({
                volumeNumber,
                chapterCount,
                hasDetailedOutline: Boolean(String(outlineSlice.currentOutline || "").trim())
            }),
            volumeBoundaryGuard: this.buildSynopsisVolumeBoundaryGuard(project, volumeNumber),
            usedPlotsContext: this.buildUsedPlotsSummary(project, volumeNumber),
            clicheWarning: this.buildSynopsisClicheWarning(project, volumeNumber),
            innovationPrompt: this.buildSynopsisInnovationPrompt(project, volumeNumber, concept, volumeSummary),
            synopsisConsistencyContext: this.buildSynopsisConsistencyContext(project, contextText, volumeNumber),
            characterConsistencyHint: this.buildDesktopSynopsisCharacterConsistencyHint(project, {
                volumeNumber,
                concept,
                volumeSummary,
                existingSynopsis,
                outlineContext: outlineSlice.currentOutline || ""
            }),
            nameGenerationHint: this.buildSynopsisNameGenerationHint(project, volumeNumber, contextText)
        };
    }

    buildDesktopSynopsisSystemPrompt({ genreConstraint, chapterCount, lockedNamesTable }) {
        return [
            genreConstraint,
            "浣犳槸涓栫晫涔︽瀯寤轰笓瀹垛€滈粯榛樷€濓紝涓€浣嶈祫娣辩綉鏂囩瓥鍒掔紪杈戙€傝鐢熸垚绔犺妭澶х翰銆?,
            "",
            lockedNamesTable,
            "",
            "銆愨槄鈽呪槄 鏈€閲嶈鐨勮鍒?鈽呪槄鈽呫€?,
            `1. 浣犲繀椤讳竴娆℃€ц緭鍑恒€愭伆濂?{chapterCount}绔犮€?浠庣1绔犲埌绗?{chapterCount}绔?涓嶈兘澶氫篃涓嶈兘灏戯紒`,
            `2. 涓嶈璇粹€滀互涓嬫槸閮ㄥ垎绔犺妭鈥濇垨鈥滅敱浜庣瘒骞呴檺鍒垛€濅箣绫荤殑璇?蹇呴』瀹屾暣杈撳嚭鎵€鏈?{chapterCount}绔狅紒`,
            "3. 濡傛灉浣犲彧杈撳嚭浜嗕竴閮ㄥ垎灏卞仠姝?杩欐槸涓ラ噸閿欒锛?,
            "",
            "銆愨殸锔忊殸锔忊殸锔?瑙掕壊鍚嶅瓧瑙勮寖 - 鏋佸叾閲嶈锛佲殸锔忊殸锔忊殸锔忋€?,
            "1. 绂佹鍚岃鏀瑰悕锛氬悓涓€涓鑹蹭竴鏃﹀凡缁忕敤杩囧叿浣撳悕瀛楋紝鍚庣画鎵€鏈夌珷鑺傚拰鍚庣画鎵€鏈夊嵎閮藉繀椤荤户缁部鐢ㄨ繖涓悕瀛椼€?,
            "2. 宸叉湁鍚嶅瓧浼樺厛锛氭墍鏈夊凡缁忓缓绔嬫槧灏勬垨宸茬粡閿佸畾鐨勮鑹诧紝蹇呴』缁х画浣跨敤鍘熸潵鐨勫叿浣撳悕瀛楋紝涓嶈兘涓€鍗锋崲涓€涓悕瀛椼€?,
            "3. 涓嶅己鍒堕噸鏂拌捣鍚嶏細鍚庣画鍗风殑閲嶇偣鏄部鐢ㄦ棫鍚嶅瓧锛屼笉鏄粰鏃ц鑹查噸鏂板懡鍚嶏紱娌℃湁鎶婃彙鏃跺畞鍙繚鎸佸師鐘躲€?,
            "4. 妯＄硦绉板懠鍙綔杈呭姪锛氬鏋滆緭鍏ラ噷鏈夆€滅敺涓烩€濃€滃コ涓烩€濃€滆垍濡堚€濃€滃鍙嬧€濈瓑绉板懠锛屽彧鑳界敤浜庤瘑鍒鑹诧紝鏈€缁堜笉瑕佹妸鍚屼竴瑙掕壊鏀规垚鍙︿竴涓柊鍚嶅瓧銆?,
            "",
            "銆愪富瑙掑悕瀛楄姹傘€?,
            "1. 濡傛灉涓昏宸茬粡鏈夊悕瀛楋紝缁濆绂佹淇敼銆?,
            "2. 濡傛灉绗竴鍗烽娆″畾鍚嶏紝鍙鍚嶅瓧鍓嶅悗涓€鑷村嵆鍙紝涓嶈姹傚埢鎰忓じ寮犳垨妯″紡鍖栥€?,
            "3. 閰嶈鍚岀悊锛岄噸鐐规槸鍓嶅悗缁熶竴锛屼笉鏄悕瀛楀崕涓界▼搴︺€?,
            "",
            "銆愪弗閲嶈鍛娿€戠姝㈡ā寮忓寲璧峰悕锛?,
            "1. 绂佹鎵归噺鐢熸垚鈥淴鎷涘ǎ銆乆缈犺姳銆乆绉€鑻便€乆妗傝姵鈥濊繖绉嶅悓绫诲瀷鍚嶅瓧銆?,
            "2. 姣忎釜瑙掕壊鐨勫悕瀛楀繀椤绘湁鐙壒椋庢牸锛岄伩鍏嶉噸澶嶅悗缂€銆?,
            "3. 鍚嶅瓧瑕佸鏍峰寲锛氬彲浠ュ弬鑰冭瘲璇嶅吀鏁呫€佽嚜鐒舵剰璞°€佺編濂藉瘬鎰忕瓑涓嶅悓鏉ユ簮銆?,
            "",
            "銆愰槻姝㈡儏鑺傞噸澶?- 璁板繂绯荤粺銆?,
            "1. 浠旂粏闃呰鍓嶉潰鍗风殑绔犺妭鍐呭,纭繚鏂扮珷鑺傜殑鎯呰妭涓庝箣鍓嶅畬鍏ㄤ笉鍚屻€?,
            "2. 绂佹閲嶅浣跨敤鐩稿悓鐨勶細鍐茬獊绫诲瀷銆佽В鍐虫柟寮忋€佸満鏅瀹氥€佽鑹蹭簰鍔ㄦā寮忋€?,
            "3. 姣忎釜鏂扮珷鑺傚繀椤绘帹杩涙晠浜?涓嶈兘鍘熷湴韪忔鎴栧洖鍒颁箣鍓嶇殑鎯呰妭銆?,
            "4. 濡傛灉鍓嶉潰鏈夆€滀富瑙掕幏寰楀疂鐗┾€?鍚庨潰涓嶈兘鍐嶆湁绫讳技鐨勨€滆幏寰楀疂鐗┾€濇儏鑺傘€?,
            "5. 濡傛灉鍓嶉潰鏈夆€滆浜洪櫡瀹冲悗鍙嶆潃鈥?鍚庨潰涓嶈兘鍐嶆湁绫讳技鐨勨€滈櫡瀹?鍙嶆潃鈥濆璺€?,
            "",
            "銆愬墽鎯呰妭鐐硅璁°€?,
            "1. 姣忎釜绔犺妭閮芥槸涓€涓€滃墽鎯呰妭鐐光€?鍖呭惈鍦烘櫙銆佸啿绐併€佽浆鎶樸€?,
            "2. 绔犺妭涔嬮棿瑕佹湁鈥滈挬瀛愨€濃€斺€旀湰绔犵粨灏惧紩鍑轰笅绔犳偓蹇点€?,
            "3. 閬靛惊鎯呯华鏇茬嚎锛氱揣寮?缂撳拰-鏇寸揣寮?楂樻疆-浣欓煹銆?,
            "4. 姣?-5绔犲舰鎴愪竴涓皬楂樻疆,鍗锋湯褰㈡垚澶ч珮娼€?,
            "",
            "銆愰€昏緫琛旀帴閾佸緥銆?,
            "1. 缁嗙翰蹇呴』绱ф帴涓婁竴鍗风粨灏炬垨鍓嶆枃鏈€鍚庝竴绔狅紝涓嶈兘璺冲満銆佸洖閫€銆侀噸鍐欏凡鍙戠敓浜嬩欢銆?,
            "2. 鍚屼竴鎵圭粏绾查噷锛岃韩浠姐€佷綅浠姐€佽緢鍒嗐€佷翰灞炲叧绯汇€佸閰嶃€佸笀寰掋€佸畼鑱屻€侀樀钀ヤ竴鏃﹂娆℃槑纭紝鍚庢枃蹇呴』淇濇寔涓€鑷淬€?,
            "3. 渚嬪宸茬粡鍐欐垚鈥滃お鍚庣殑鍎垮瓙鏄殗甯濃€濓紝鍚庢枃灏变笉鑳芥敼鎴愨€滃皬鐨囧瓙鈥濓紱宸茬粡鍐欐垚鈥滃お瀛愬鈥濓紝鍚庢枃涔熶笉鑳介檷鍥炩€滅濂斥€濄€?,
            "4. 涓婁竴绔犵殑缁撴灉鍙兘浣滀负涓嬩竴绔犵殑璧风偣锛屼笉鑳芥崲鍙ヨ瘽閲嶅鍙戠敓銆?,
            "5. 濡傛灉闇€瑕佽繃妗ョ珷锛岃繃妗ョ珷涔熷繀椤诲甫鏉ヤ竴涓柊鐨勬湁鏁堝彉鍖栥€?,
            "",
            "銆愯緭鍑烘牸寮忚姹傘€?,
            "1. 姣忕珷鏍煎紡锛氱X绔狅細绔犺妭鏍囬 - 鏍稿績鍐呭锛?0-40瀛楁弿杩帮級",
            `2. 浠庣1绔犺繛缁緭鍑哄埌绗?{chapterCount}绔?涓棿涓嶈鏈変换浣曡鏄庢枃瀛椼€俙,
            "3. 鐩存帴杈撳嚭绔犺妭鍒楄〃,寮€澶村拰缁撳熬閮戒笉瑕佷换浣曢澶栬鏄庛€?,
            "",
            `銆愬啀娆″己璋冦€戜綘蹇呴』杈撳嚭瀹屾暣鐨?{chapterCount}绔?杩欐槸纭€ц姹傦紒`
        ].filter(Boolean).join("\n");
    }

    buildDesktopSynopsisUserPrompt({
        title,
        worldbuilding,
        volumeNumber,
        chapterCount,
        concept,
        volumeSummary,
        existingSynopsis,
        currentVolumeTaskLabel,
        volumeSynopsisContext,
        currentVolumeOutlineContext,
        adjacentOutlineSummary,
        mappingHint,
        previousSynopsisContext,
        previousVolumeEnding,
        storyStateSummary,
        timelineGuard,
        foreshadowGuard,
        synopsisClarityGuard,
        volumeBoundaryGuard,
        usedPlotsContext,
        innovationPrompt,
        synopsisConsistencyContext,
        characterConsistencyHint,
        nameGenerationHint
    }) {
        return [
            `灏忚鏍囬锛氥€?{title || "鏈懡鍚嶅皬璇?}銆媊,
            "",
            "鏁呬簨姒傚康锛?,
            concept || "鏆傛棤",
            "",
            "鍒嗗嵎姒傝锛?,
            volumeSynopsisContext || volumeSummary || "鏆傛棤",
            "",
            worldbuilding ? `涓栫晫瑙傝ˉ鍏咃細\n${worldbuilding}` : "",
            currentVolumeOutlineContext ? `銆愬綋鍓嶅嵎璇︾粏澶х翰锛堝繀椤讳紭鍏堟墽琛岋級銆慭n${currentVolumeOutlineContext}` : "",
            adjacentOutlineSummary ? `銆愮浉閭诲嵎杈圭晫鎻愮ず銆慭n${adjacentOutlineSummary}` : "",
            `褰撳墠浠诲姟锛氫负銆?{currentVolumeTaskLabel || `绗?{volumeNumber}鍗穈}銆戠敓鎴愩€愭伆濂?{chapterCount}绔犮€戠殑绔犺妭澶х翰銆俙,
            nameGenerationHint,
            mappingHint,
            characterConsistencyHint,
            synopsisConsistencyContext,
            usedPlotsContext,
            previousSynopsisContext,
            previousVolumeEnding ? `銆愪笂涓€鍗风粨灏撅紙鐢ㄤ簬琛旀帴锛夛細銆慭n${previousVolumeEnding}` : "",
            storyStateSummary ? `銆愬墠鏂囩姸鎬佹憳瑕併€慭n${storyStateSummary}` : "",
            timelineGuard,
            foreshadowGuard,
            synopsisClarityGuard,
            volumeBoundaryGuard,
            innovationPrompt,
            existingSynopsis ? `銆愬凡鏈夌粏绾插弬鑰冦€慭n${existingSynopsis}` : "",
            "",
            `銆愭渶缁堢‘璁ゃ€戣鐜板湪杈撳嚭绗?{volumeNumber}鍗风殑鍏ㄩ儴${chapterCount}涓珷鑺傚ぇ绾诧紙浠庣1绔犲埌绗?{chapterCount}绔?涓€涓兘涓嶈兘灏戯級锛歚
        ].filter(Boolean).join("\n\n");
    }

    buildDesktopSynopsisRepairPrompt({
        title,
        worldbuilding,
        volumeNumber,
        chapterCount,
        concept,
        currentVolumeTaskLabel,
        volumeSynopsisContext,
        currentVolumeOutlineContext,
        adjacentOutlineSummary,
        mappingHint,
        previousSynopsisContext,
        previousVolumeEnding,
        storyStateSummary,
        timelineGuard,
        foreshadowGuard,
        synopsisClarityGuard,
        volumeBoundaryGuard,
        usedPlotsContext,
        innovationPrompt,
        synopsisConsistencyContext,
        characterConsistencyHint,
        nameGenerationHint,
        knownLines,
        missingNumbers,
        existingSynopsis
    }) {
        return [
            `灏忚鏍囬锛氥€?{title || "鏈懡鍚嶅皬璇?}銆媊,
            "",
            "鏁呬簨姒傚康锛?,
            concept || "鏆傛棤",
            "",
            "鍒嗗嵎姒傝锛?,
            volumeSynopsisContext || "鏆傛棤",
            "",
            worldbuilding ? `涓栫晫瑙傝ˉ鍏咃細\n${worldbuilding}` : "",
            currentVolumeOutlineContext ? `銆愬綋鍓嶅嵎璇︾粏澶х翰锛堝繀椤讳紭鍏堟墽琛岋級銆慭n${currentVolumeOutlineContext}` : "",
            adjacentOutlineSummary ? `銆愮浉閭诲嵎杈圭晫鎻愮ず銆慭n${adjacentOutlineSummary}` : "",
            `褰撳墠浠诲姟锛氱户缁负銆?{currentVolumeTaskLabel || `绗?{volumeNumber}鍗穈}銆戣ˉ榻愮己澶辩珷鑺傦紝鏈€缁堝繀椤诲噾澶?{chapterCount}绔犮€俙,
            nameGenerationHint,
            mappingHint,
            characterConsistencyHint,
            synopsisConsistencyContext,
            usedPlotsContext,
            previousSynopsisContext,
            previousVolumeEnding ? `銆愪笂涓€鍗风粨灏撅紙鐢ㄤ簬琛旀帴锛夛細銆慭n${previousVolumeEnding}` : "",
            storyStateSummary ? `銆愬墠鏂囩姸鎬佹憳瑕併€慭n${storyStateSummary}` : "",
            timelineGuard,
            foreshadowGuard,
            synopsisClarityGuard,
            volumeBoundaryGuard,
            innovationPrompt,
            existingSynopsis ? `銆愬凡鏈夌粏绾插弬鑰冦€慭n${existingSynopsis}` : "",
            "",
            "銆愬凡缁忔垚鍔熺敓鎴愮殑绔犺妭缁嗙翰銆?,
            knownLines || "鏆傛棤",
            "",
            "銆愬彧鍏佽琛ラ綈浠ヤ笅缂哄け绔犺妭銆?,
            (missingNumbers || []).map((num) => `绗?{num}绔燻).join("銆?),
            "",
            "璇峰彧杈撳嚭缂哄け绔犺妭锛屼竴绔犱竴琛岋紝涓ユ牸浣跨敤鏍煎紡锛?,
            "绗琗绔狅細绔犺妭鏍囬 - 鏍稿績鍐呭锛?0-40瀛楁弿杩帮級",
            "鐩存帴杈撳嚭锛屼笉瑕佷换浣曡鏄庯紝涓嶈閲嶅宸茬粡鐢熸垚杩囩殑绔犺妭銆?
        ].filter(Boolean).join("\n\n");
    }

    prepareSynopsisGenerationInput(project, { concept, volumeSummary, existingSynopsis, volumeNumber }) {
        const roleRequirement = this.detectSynopsisRoleRequirements(
            project,
            `${concept || ""}\n${volumeSummary || ""}\n${existingSynopsis || ""}`,
            volumeNumber
        );
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        synopsisData.vague_to_name_mapping = synopsisData.vague_to_name_mapping && typeof synopsisData.vague_to_name_mapping === "object"
            ? synopsisData.vague_to_name_mapping
            : {};
        const mapping = synopsisData.vague_to_name_mapping;
        const processedConcept = this.applyKnownSynopsisMappings(concept, mapping);
        const processedVolumeSummary = this.applyKnownSynopsisMappings(volumeSummary, mapping);
        const processedExistingSynopsis = this.applyKnownSynopsisMappings(existingSynopsis, mapping);
        const mappingLines = Object.entries(mapping)
            .slice(0, 20)
            .map(([vagueTerm, specificName]) => `- ${vagueTerm} -> ${specificName}`);
        const pendingTerms = this.collectPendingSynopsisTerms(
            `${concept || ""}\n${volumeSummary || ""}\n${existingSynopsis || ""}`,
            project
        );

        return {
            processedConcept,
            processedVolumeSummary,
            processedExistingSynopsis,
            lockedNamesHint: this.buildSynopsisLockedNameTable(project),
            mappingHint: mappingLines.length
                ? [
                    "銆愷煍?妯＄硦绉板懠鈫掑叿浣撳悕瀛楁槧灏勮〃锛堝繀椤婚伒瀹堬級銆?,
                    "浠ヤ笅绉板懠宸茬粡鏈夊浐瀹氬搴斿悕瀛楋紝鏈嵎缁嗙翰蹇呴』娌跨敤鍏蜂綋鍚嶅瓧锛?,
                    mappingLines.join("\n")
                ].join("\n")
                : "",
            pendingHint: pendingTerms.length && Number(volumeNumber || 0) > 0
                ? `銆愬緟缁х画鏄庣‘鐨勬ā绯婄О鍛笺€慭n${[...new Set([...pendingTerms, ...(roleRequirement.pendingRoles || [])])].slice(0, 12).map((term) => `- ${term}`).join("\n")}\n濡傛灉鏈嵎鏄庣‘鍐欏嚭浜嗙湡瀹炲悕瀛楋紝鍙互鐩存帴鐢ㄧ湡瀹炲悕瀛楋紝涓嶈闀挎湡鍋滅暀鍦ㄦā绯婄О鍛笺€俙
                : ""
        };
    }

    lockSynopsisCharacterName(project, name, charType = "閰嶈", identity = "鏈煡", lockedVolume = 1) {
        const cleanName = String(name || "").trim();
        if (!/^[\u4e00-\u9fa5]{2,4}$/.test(cleanName)) {
            return false;
        }

        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const aliases = this.buildSynopsisNameAliases(cleanName);
        const existing = synopsisData.locked_character_names[cleanName];
        if (existing) {
            if (charType === "涓昏") {
                existing.type = "涓昏";
                existing.identity = identity;
            }
            existing.aliases = Array.from(new Set([...(existing.aliases || []), ...aliases]))
                .sort((left, right) => right.length - left.length);
            existing.locked_volume = existing.locked_volume || lockedVolume;
            return true;
        }

        synopsisData.locked_character_names[cleanName] = {
            type: charType,
            identity,
            locked_volume: lockedVolume,
            aliases
        };
        return true;
    }

    isSafeSynopsisMapping(project, vagueTerm, specificName, role = "") {
        const cleanVagueTerm = String(vagueTerm || "").trim();
        const cleanName = String(specificName || "").trim();
        if (!cleanVagueTerm || !/^[\u4e00-\u9fa5]{2,4}$/.test(cleanName)) {
            return false;
        }

        const excludedWords = new Set([
            "杩欐椂", "閭ｆ椂", "姝ゆ椂", "褰兼椂", "浠€涔?, "鎬庝箞", "杩欎釜", "閭ｄ釜", "浠栫殑", "濂圭殑", "浠栦滑",
            "浼椾汉", "璺汉", "灏戝勾", "灏戝コ", "闈掑勾", "濂冲瓙", "鐢蜂汉", "濂充汉", "寮熷瓙", "闀胯€?, "鎺岄棬"
        ]);
        if (excludedWords.has(cleanName) || cleanName === cleanVagueTerm) {
            return false;
        }

        const synopsisData = this.restoreSynopsisMainCharacters(project);
        synopsisData.vague_to_name_mapping = synopsisData.vague_to_name_mapping && typeof synopsisData.vague_to_name_mapping === "object"
            ? synopsisData.vague_to_name_mapping
            : {};

        const existingMapping = synopsisData.vague_to_name_mapping[cleanVagueTerm];
        if (existingMapping && existingMapping !== cleanName) {
            return false;
        }

        const aliasToRole = this.buildSynopsisAliasToRoleMap();
        const sameNameOwner = Object.entries(synopsisData.vague_to_name_mapping)
            .find(([term, mappedName]) => term !== cleanVagueTerm && mappedName === cleanName);
        if (sameNameOwner) {
            const [existingTerm] = sameNameOwner;
            const canShareAliasOwner = Boolean(
                (role && aliasToRole[existingTerm] === role)
                || this.isPseudoConcreteCharacterAlias(cleanVagueTerm)
                || this.isPseudoConcreteCharacterAlias(existingTerm)
                || this.matchesGenericRolePattern(cleanVagueTerm)
                || this.matchesGenericRolePattern(existingTerm)
                || cleanVagueTerm.includes(existingTerm)
                || existingTerm.includes(cleanVagueTerm)
            );
            if (!canShareAliasOwner) {
                return false;
            }
        }

        const existingLock = synopsisData.locked_character_names?.[cleanName];
        if (existingLock) {
            if (role && existingLock.type === "涓昏" && existingLock.identity && existingLock.identity !== role) {
                return false;
            }
            if (!role && existingLock.type === "涓昏" && existingLock.identity && aliasToRole[cleanVagueTerm] && aliasToRole[cleanVagueTerm] !== existingLock.identity) {
                return false;
            }
        }

        if (role) {
            const existingName = synopsisData.main_characters?.[role];
            if (existingName && existingName !== cleanName) {
                return false;
            }
            const conflictingRole = Object.entries(synopsisData.main_characters || {})
                .find(([otherRole, otherName]) => otherRole !== role && otherName === cleanName);
            if (conflictingRole) {
                return false;
            }
        }

        return true;
    }

    applySynopsisMainCharacter(project, role, name, lockedVolume) {
        const cleanRole = String(role || "").trim();
        const cleanName = String(name || "").trim();
        if (!this.getSynopsisRoleAliases()[cleanRole] || !cleanName) {
            return false;
        }
        if (!this.isSafeSynopsisMapping(project, cleanRole, cleanName, cleanRole)) {
            return false;
        }

        const synopsisData = this.restoreSynopsisMainCharacters(project);
        synopsisData.main_characters[cleanRole] = cleanName;
        this.lockSynopsisCharacterName(project, cleanName, "涓昏", cleanRole, lockedVolume);
        this.getSynopsisRoleAliases()[cleanRole].forEach((alias) => {
            const existing = synopsisData.vague_to_name_mapping[alias];
            if (!existing || existing === cleanName) {
                synopsisData.vague_to_name_mapping[alias] = cleanName;
            }
        });
        return true;
    }

    syncGeneratedCharacterMappings(project, characters = [], volumeNumber = 1) {
        if (!project || !Array.isArray(characters) || !characters.length) {
            return 0;
        }

        const synopsisData = this.restoreSynopsisMainCharacters(project);
        synopsisData.vague_to_name_mapping = synopsisData.vague_to_name_mapping && typeof synopsisData.vague_to_name_mapping === "object"
            ? synopsisData.vague_to_name_mapping
            : {};

        let changed = 0;
        characters.forEach((character) => {
            const realName = this.normalizeOutlineCharacterLabel(character?.name || "");
            if (!realName || this.isGenericCharacterCandidateName(realName) || !this.isLikelySynopsisPersonName(realName)) {
                return;
            }

            const isMainCharacter = Object.values(synopsisData.main_characters || {}).includes(realName);
            if (this.lockSynopsisCharacterName(
                project,
                realName,
                isMainCharacter ? "涓昏" : "閰嶈",
                isMainCharacter ? "涓昏" : (String(character?.identity || "").trim() || "鏈煡"),
                volumeNumber
            )) {
                changed += 1;
            }

            Utils.ensureArrayFromText(character?.aliases || character?.["鍒悕"] || "")
                .map((alias) => this.normalizeOutlineCharacterLabel(alias))
                .filter((alias) => alias && alias !== realName)
                .forEach((alias) => {
                    if (!this.isSafeSynopsisMapping(project, alias, realName)) {
                        return;
                    }
                    if (synopsisData.vague_to_name_mapping[alias] === realName) {
                        return;
                    }
                    synopsisData.vague_to_name_mapping[alias] = realName;
                    changed += 1;
                });
        });

        project.synopsis_data = JSON.parse(JSON.stringify(synopsisData));
        return changed;
    }

    extractExplicitVagueNameMappings(text, vagueTerms) {
        if (!text || !Array.isArray(vagueTerms) || !vagueTerms.length) {
            return [];
        }

        const content = String(text);
        const excludedWords = new Set([
            "杩欐椂", "閭ｆ椂", "姝ゆ椂", "褰兼椂", "浠€涔?, "鎬庝箞", "杩欎釜", "閭ｄ釜", "浠栫殑", "濂圭殑",
            "灏戝勾", "灏戝コ", "鐢蜂汉", "濂充汉", "瑙掕壊", "鍚嶅瓧", "鏌愪汉", "鏌愭煇"
        ]);
        const results = [];
        const seen = new Set();

        vagueTerms
            .filter(Boolean)
            .sort((left, right) => right.length - left.length)
            .forEach((vagueTerm) => {
                const escaped = vagueTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const patterns = [
                    new RegExp(`${escaped}[锛?]\\s*([\\u4e00-\\u9fa5]{2,4})`, "g"),
                    new RegExp(`${escaped}[锛?]([\\u4e00-\\u9fa5]{2,4})[)锛塢`, "g"),
                    new RegExp(`([\\u4e00-\\u9fa5]{2,4})[锛?]${escaped}[)锛塢`, "g"),
                    new RegExp(`${escaped}鍙?[\\u4e00-\\u9fa5]{2,4})`, "g"),
                    new RegExp(`${escaped}鍚嶅彨([\\u4e00-\\u9fa5]{2,4})`, "g"),
                    new RegExp(`鍚嶅彨([\\u4e00-\\u9fa5]{2,4})鐨?{escaped}`, "g")
                ];

                patterns.forEach((pattern) => {
                    for (const match of content.matchAll(pattern)) {
                        const name = String(match[1] || "").trim();
                        if (!name || excludedWords.has(name)) {
                            continue;
                        }
                        const key = `${vagueTerm}=>${name}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            results.push({ vagueTerm, specificName: name });
                        }
                    }
                });
            });

        return results;
    }

    isLikelySynopsisPersonName(name) {
        const cleanName = String(name || "").trim();
        if (!/^[\u4e00-\u9fa5]{2,4}$/.test(cleanName)) {
            return false;
        }

        const badFragments = new Set([
            "瀵瑰ス", "瀵逛粬", "瀵瑰ス璇?, "瀵逛粬璇?, "鍘傞暱", "鍓巶闀?, "椋熷爞", "绯荤粺", "闇囨儕", "鎻愪緵",
            "鍙戠幇", "鐪嬪埌", "鍚埌", "鍙楄繃", "鎭╂儬", "澶╃眮", "浼椾汉", "濂圭殑", "浠栫殑", "缁欏ス", "缁欎粬",
            "娲惧壇", "娲句汉", "鏁呬簨", "绔犺妭", "缁嗙翰", "鍗风翰", "姝ｆ枃", "闈㈠", "鍋忓績", "璇村叓", "鍏亾",
            "璇村叓閬?, "闈㈠鍋忓績", "缁欐灄", "鍒板浘", "瀹夋姎", "鎶ゆ矆", "鍥句功棣?
        ]);
        if (badFragments.has(cleanName)) {
            return false;
        }

        const badSuffixes = ["闇囨儕", "璇撮亾", "璇寸潃", "鎻愪緵", "鎭╂儬", "鍘傞暱", "涓讳换", "缁忕悊", "鍥句功棣?, "鍋忓績", "鍏亾"];
        if (badSuffixes.some((suffix) => cleanName.endsWith(suffix))) {
            return false;
        }

        const badPrefixes = ["浜?, "瀵?, "鎶?, "琚?, "鍚?, "缁?, "娲?, "闈㈠", "璇?, "鍒?, "瀹夋姎", "鎶?];
        if (badPrefixes.some((prefix) => cleanName.startsWith(prefix))) {
            return false;
        }

        const badVerbs = ["闈㈠", "瀹夋姎", "娲?, "缁?, "鍒?, "鍘?, "鏉?, "璇?, "鐪嬪埌", "鍙戠幇", "鍚埌", "鍛婅瘔", "鎵朵綇", "鎼€浣?, "鎷変綇"];
        if (badVerbs.some((verb) => cleanName.startsWith(verb))) {
            return false;
        }

        if (this.isGenericCharacterCandidateName(cleanName)) {
            return false;
        }

        return true;
    }

    collectFrequentNamesFromText(text) {
        const content = String(text || "");
        const candidates = new Set();
        const addCandidates = (matches = []) => {
            matches.forEach((name) => {
                const cleanName = String(name || "").trim();
                if (this.isLikelySynopsisPersonName(cleanName) && this.isLikelyChinesePersonName(cleanName)) {
                    candidates.add(cleanName);
                }
            });
        };

        addCandidates(content.match(/[\u4e00-\u9fa5]{2,4}(?=璇磡閬搢绗憒闂畖绛攟鍠妡鍙珅楠倈鐐箌鐪媩璧皘绔檤鍧恷璺憒鎯硘瑙墊鍙戠幇|鐪嬪埌|鍚埌)/g) || []);

        const quotedNames = [];
        for (const match of content.matchAll(/["鈥溾€濄€屻€嶃€庛€廬([\u4e00-\u9fa5]{2,4})["鈥溾€濄€屻€嶃€庛€廬/g)) {
            quotedNames.push(String(match[1] || "").trim());
        }
        addCandidates(quotedNames);

        const relationTargets = [];
        for (const match of content.matchAll(/(?:涓巪鍜寍璺焲鍚寍鍚憒瀵?([\u4e00-\u9fa5]{2,4})(?=[锛屻€傘€侊紒锛焅s]|$)/g)) {
            relationTargets.push(String(match[1] || "").trim());
        }
        addCandidates(relationTargets);

        return Array.from(candidates);
    }

    normalizeSynopsisReferenceText(project, text) {
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        return this.applyKnownSynopsisMappings(text, synopsisData.vague_to_name_mapping || {});
    }

    mergeSynopsisStateFromGeneratedChapters(project, chapters, volumeNumber, inputs = {}) {
        this.detectSynopsisRoleRequirements(
            project,
            `${inputs.concept || ""}\n${inputs.volumeSummary || ""}`,
            volumeNumber
        );
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        synopsisData.vague_to_name_mapping = synopsisData.vague_to_name_mapping && typeof synopsisData.vague_to_name_mapping === "object"
            ? synopsisData.vague_to_name_mapping
            : {};
        synopsisData.vague_supporting_roles = synopsisData.vague_supporting_roles && typeof synopsisData.vague_supporting_roles === "object"
            ? synopsisData.vague_supporting_roles
            : {};

        const aliasToRole = this.buildSynopsisAliasToRoleMap();
        const text = [
            inputs.concept || "",
            inputs.volumeSummary || "",
            ...(chapters || []).map((chapter) => [
                chapter.title || "",
                chapter.key_event || chapter.keyEvent || "",
                chapter.synopsis || chapter.summary || ""
            ].join("\n"))
        ].join("\n");

        const allVagueTerms = new Set([
            ...Object.keys(aliasToRole),
            ...Object.keys(synopsisData.vague_supporting_roles || {}),
            "甯堝厔", "甯堝", "甯堝紵", "甯堝", "闀胯€?, "鎺岄棬", "甯堢埗", "甯堟瘝", "鍚岄棬", "姝诲澶?
        ]);
        const explicitMappings = this.extractExplicitVagueNameMappings(text, Array.from(allVagueTerms));
        const appliedMainMappings = [];
        const appliedSupportingMappings = [];
        const pendingTerms = [];

        explicitMappings.forEach(({ vagueTerm, specificName }) => {
            const role = aliasToRole[vagueTerm];
            if (role) {
                if (this.applySynopsisMainCharacter(project, role, specificName, volumeNumber)) {
                    appliedMainMappings.push(`${vagueTerm}鈫?{specificName}`);
                }
                return;
            }

            if (!this.isSafeSynopsisMapping(project, vagueTerm, specificName)) {
                return;
            }
            synopsisData.vague_to_name_mapping[vagueTerm] = specificName;
            this.lockSynopsisCharacterName(project, specificName, "閰嶈", vagueTerm, volumeNumber);
            if (synopsisData.vague_supporting_roles[vagueTerm]) {
                synopsisData.vague_supporting_roles[vagueTerm].needs_name = false;
                synopsisData.vague_supporting_roles[vagueTerm].suggested_name = specificName;
            }
            appliedSupportingMappings.push(`${vagueTerm}鈫?{specificName}`);
        });

        this.collectFrequentNamesFromText(text).forEach((name) => {
            const isMainCharacter = Object.values(synopsisData.main_characters || {}).includes(name);
            this.lockSynopsisCharacterName(project, name, isMainCharacter ? "涓昏" : "閰嶈", isMainCharacter ? "涓昏" : "鏈煡", volumeNumber);
        });

        Array.from(allVagueTerms)
            .sort((left, right) => right.length - left.length)
            .forEach((term) => {
                if (!text.includes(term) || synopsisData.vague_to_name_mapping[term]) {
                    return;
                }
                const current = synopsisData.vague_supporting_roles[term] || {};
                synopsisData.vague_supporting_roles[term] = {
                    count: Number(current.count || 0) + 1,
                    needs_name: true,
                    suggested_name: current.suggested_name || ""
                };
                pendingTerms.push(term);
            });

        project.synopsis_data = JSON.parse(JSON.stringify(synopsisData));
        return {
            mainMappings: appliedMainMappings,
            supportingMappings: appliedSupportingMappings,
            pendingTerms: Array.from(new Set(pendingTerms)).slice(0, 12)
        };
    }

    async syncSynopsisStateFromGeneratedChapters(project, chapters, volumeNumber, inputs = {}) {
        const syncResult = this.mergeSynopsisStateFromGeneratedChapters(project, chapters, volumeNumber, inputs);
        const conservativeResult = await this.resolveMainCharacterNamesFromSynopsis({
            project,
            chapters,
            volumeNumber,
            concept: inputs.concept || "",
            volumeSummary: inputs.volumeSummary || ""
        });

        return {
            ...syncResult,
            conservativeMainMappings: conservativeResult.appliedMappings || [],
            conservativeEvidence: conservativeResult.evidence || {}
        };
    }

    async resolveMainCharacterNamesFromSynopsis({ project, chapters, volumeNumber, concept, volumeSummary }) {
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const chapterLines = (chapters || [])
            .map((chapter) => chapter.line || `绗?{chapter.chapter_number || chapter.number}绔狅細${chapter.title || ""} - ${chapter.synopsis || chapter.key_event || ""}`)
            .filter(Boolean);

        if (!chapterLines.length) {
            return { appliedMappings: [], evidence: {} };
        }

        const unresolvedRoles = ["鐢蜂富", "濂充富"].filter((role) => {
            if (synopsisData.main_characters?.[role]) {
                return false;
            }
            return (this.getSynopsisRoleAliases()[role] || []).some((alias) =>
                chapterLines.some((line) => String(line).includes(alias)) ||
                String(concept || "").includes(alias) ||
                String(volumeSummary || "").includes(alias)
            );
        });

        if (!unresolvedRoles.length) {
            return { appliedMappings: [], evidence: {} };
        }

        const mappingLines = Object.entries(synopsisData.vague_to_name_mapping || {})
            .slice(0, 20)
            .map(([vagueTerm, specificName]) => `- ${vagueTerm} -> ${specificName}`);
        const prompt = [
            `璇锋牴鎹互涓嬩俊鎭紝璇嗗埆绗?{volumeNumber}鍗风珷鑺傜粏绾查噷宸茬粡鏄庣‘寤虹珛鐨勪富瑙掑悕瀛椼€俙,
            "",
            `寰呰瘑鍒鑹诧細${unresolvedRoles.join("銆?)}`,
            "",
            "瑙勫垯锛?,
            "1. 鍙兘杩斿洖绔犺妭缁嗙翰閲屽凡缁忓疄闄呭嚭鐜拌繃鐨勫叿浣撲腑鏂囧悕瀛楋紝缁濆涓嶈兘鏂拌捣鍚嶃€?,
            "2. 濡傛灉璇佹嵁涓嶈冻锛屽繀椤昏繑鍥炵┖瀛楃涓诧紝涓嶈鐚溿€?,
            "3. 鍚屼竴涓悕瀛椾笉鑳藉悓鏃跺垎閰嶇粰涓や釜瑙掕壊銆?,
            "4. 濡傛灉鏌愪釜瑙掕壊宸茬粡鏈夐攣瀹氬悕瀛楋紝灏变笉瑕佹敼鍐欍€?,
            "5. 閲嶇偣鏄府鍔╁悗缁嵎娌跨敤宸茬‘瀹氬悕瀛楋紝涓嶈鎶婇厤瑙掕鍒ゆ垚涓昏銆?,
            "",
            "杈撳嚭涓ユ牸 JSON锛?,
            '{',
            '  "main_characters": {"鐢蜂富": "", "濂充富": ""},',
            '  "confidence": {"鐢蜂富": "楂?涓?浣?, "濂充富": "楂?涓?浣?},',
            '  "evidence": {"鐢蜂富": "绠€杩颁緷鎹?, "濂充富": "绠€杩颁緷鎹?}',
            '}',
            "",
            `鏁呬簨姒傚康锛歕n${concept || "鏆傛棤"}`,
            "",
            `鍒嗗嵎姒傝锛歕n${volumeSummary || "鏆傛棤"}`,
            "",
            `褰撳墠宸茬煡鏄犲皠锛歕n${mappingLines.length ? mappingLines.join("\n") : "锛堟殏鏃狅級"}`,
            "",
            `绔犺妭缁嗙翰锛歕n${chapterLines.join("\n")}`
        ].join("\n");

        let parsed = null;
        try {
            const raw = await this.api.callLLM(
                prompt,
                "浣犳槸瑙掕壊鏄犲皠鏍″鍔╂墜銆傚彧鍋氫繚瀹堣瘑鍒紝涓嶈琛ュ啓鍓ф儏锛屼笉瑕佸彂鏁ｈВ閲娿€?,
                {
                    temperature: 0.1,
                    maxTokens: Math.min(this.getConfiguredMaxTokens(1200), 4000)
                }
            );
            parsed = Utils.parseJsonResponse(raw);
        } catch (error) {
            return { appliedMappings: [], evidence: {} };
        }

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return { appliedMappings: [], evidence: {} };
        }

        const appliedMappings = [];
        const evidence = {};
        unresolvedRoles.forEach((role) => {
            const name = String(parsed.main_characters?.[role] || "").trim();
            const confidence = String(parsed.confidence?.[role] || "").trim();
            const reason = String(parsed.evidence?.[role] || "").trim();
            if (!name || !["楂?, "涓?].includes(confidence)) {
                return;
            }
            if (this.applySynopsisMainCharacter(project, role, name, volumeNumber)) {
                appliedMappings.push(`${role}鈫?{name}`);
                if (reason) {
                    evidence[role] = reason;
                }
            }
        });

        return { appliedMappings, evidence };
    }

    composeChapterPrompt({
        project,
        volume,
        chapter,
        promptTemplate,
        openingRelayPacket,
        prevContent,
        nextOutline,
        characterDigest,
        frequency,
        worldAndPlanContext,
        currentVolumeOutlineContext,
        previousOutlineContext,
        storyStateSummary,
        narrativeBridgePlan,
        expansionHint,
        setupContinuityGuard,
        openingAntiRepeatGuard,
        nextChapterSetupInstruction,
        nextChapterForbiddenPreview,
        transitionGuide,
        stateOutputProtocol,
        extraOutputProtocol
    }) {
        const frequencyPrompt = frequency === "female"
            ? "銆愰閬撹姹傘€戣繖鏄コ棰戝悜绔犺妭锛屼紭鍏堝己鍖栨儏鎰熸帹杩涖€佺粏鑵诲績鐞嗗拰鍏崇郴寮犲姏銆?
            : "銆愰閬撹姹傘€戣繖鏄敺棰戝悜绔犺妭锛屼紭鍏堜繚璇佷富绾挎帹杩涖€佸啿绐佸崌绾у拰鎴愬氨鍙嶉銆?;

        const basePrompt = promptTemplate && promptTemplate.trim()
            ? promptTemplate
            : [
                "{{frequency_prompt}}",
                "",
                "灏忚鏍囬锛歿{title}}",
                "灏忚绫诲瀷锛歿{genre}}",
                "鏍稿績涓婚锛歿{theme}}",
                "",
                "{{world_and_plan_context}}",
                "",
                "銆愬綋鍓嶅嵎淇℃伅銆?,
                "鍗峰悕锛歿{current_volume}}",
                "鍗锋憳瑕侊細{{current_volume_summary}}",
                "",
                "銆愬綋鍓嶅嵎缁嗙翰鍙傝€冦€?,
                "{{current_volume_outline_context}}",
                "",
                "銆愭湰绔犲ぇ绾层€?,
                "{{outline}}",
                "",
                "{{opening_relay_packet}}",
                "",
                "銆愬墠鏂囧ぇ绾叉憳瑕併€?,
                "{{previous_outline_context}}",
                "",
                "銆愬墠鏂囩姸鎬佹憳瑕併€?,
                "{{story_state_summary}}",
                "",
                "{{narrative_bridge_plan}}",
                "",
                "銆愮浉鍏充汉鐗╄瀹氥€?,
                "{{relevant_characters}}",
                "",
                "【角色设定使用规则】",
                "相关人物设定只用于锁定身份、关系、口吻、目标和外观事实，不要把设定里的原句、标签词、描述短语直接抄进正文。",
                "同一角色的标志性描述一章里最多点到一次，不要反复拿同一句当出场模板。",
                "不要反复使用‘死死、狠狠、剧烈、用力’这类副词硬顶强度，也不要老写‘胸口起伏’‘衣料随呼吸起伏’‘手指抠住边缘’这类假身体反应句。",
                "写人物冷淡、傲慢、敷衍时，不要老用‘连眼皮都没抬’‘看都没看’‘头也不抬’这种高频短句，要改用动作、停顿、回话方式来体现。",
                "",
                "銆愬墠鏂囦簲绔犮€?,
                "鐢ㄩ€旓細鍙敤浜庣户鎵垮悕璇嶃€佺姸鎬併€佸彛鍚诲拰鍔ㄤ綔寤剁画锛屼笉瑕佹嬁瀹冨綋浣滄湰绔犲紑澶寸殑澶嶈堪妯℃澘銆?,
                "{{prev_content}}",
                "",
                "銆愬叏灞€璁惧畾鎻愰啋銆?,
                "{{global_setting_note}}",
                "",
                "銆愭湰绔犺瀹氭彁閱掋€?,
                "{{chapter_setting_note}}",
                "",
                "{{transition_guide}}",
                "",
                "{{setup_continuity_guard}}",
                "",
                "{{expansion_hint}}",
                "",
                "{{next_chapter_setup_instruction}}",
                "",
                "{{next_chapter_forbidden_preview}}",
                "",
                "鍐欎綔閾佸緥锛?,
                "1. 銆愬悕璇嶄笌鐘舵€佺户鎵裤€戣浠旂粏闃呰涓婃柟銆愬墠鏂囦簲绔犮€戝拰绯荤粺绾︽潫銆備汉鐗┿€佺墿鍝併€佸姛娉曘€佷慨涓恒€佺郴缁熷鍔便€佸湴鐐圭О鍛肩瓑鍚嶈瘝锛屽繀椤绘棤鏉′欢娌跨敤鍓嶆枃宸茬粡纭畾濂界殑鍥哄畾鍚嶇О鍜岀姸鎬侊紝缁濅笉鍏佽鎹㈠悕瀛楁垨鍚冧功銆?,
                "2. 銆愬ぇ绾叉墽琛屼紭鍏堛€戝墽鎯呬富绾垮繀椤婚伒瀹堟湰绔犮€愬ぇ绾层€戠殑鍙戝睍杞ㄨ抗锛岀粷涓嶈兘鑴辩涓荤嚎璺戝亸銆?,
                "3. 銆愯鑲夊～鍏呬笌閫傚害鎵╁厖銆戝ぇ绾插彧鏄鏋讹紝浣犺鍦ㄤ弗鏍奸伒瀹堜富绾垮拰鍓嶆枃璁惧畾鐨勫熀纭€涓婏紝涓板瘜鍔ㄤ綔銆佸績鐞嗐€佸璇濄€佺幆澧冨拰鍗氬紙杩囩▼銆?,
                "4. 銆愭嫆缁濇祦姘磋处銆戝鏋滃ぇ绾插彧鏈変竴鍙ヨ瘽锛屼篃瑕佹墿鎴愭湁娉㈡姌銆佹湁缁嗚妭銆佹湁鎯呯华璧蜂紡鐨勫畬鏁寸珷鑺傦紝涓嶈兘涓€绗斿甫杩囥€?,
                "5. 銆愰€昏緫鑷唇銆戝鏋滃ぇ绾茶〃杩扮暐绮楋紝浣犺鑷姩琛ヨ冻鍚堢悊鍥犳灉锛岃鍓ф儏鏇撮『锛屼絾涓嶈兘鏀逛富绾跨粨鏋溿€?,
                "6. 銆愬嵎杈圭晫銆戝彧鑳藉啓褰撳墠鍗疯寖鍥村唴鐨勫墽鎯咃紝涓嶈鎻愬墠鍐欏悗缁嵎鐨勬牳蹇冨湴鍥俱€佹牳蹇冧汉鐗┿€佹牳蹇冨啿绐併€?,
                "7. 銆愭壙鎺ヤ笂绔犻摵鍨€戝鏋滀笂涓€绔犵粨灏惧凡缁忕暀涓嬩笅绔犻摵鍨紝鏈珷寮€澶村繀椤诲厛鎺ヤ綇閭ｆ潯閾哄灚锛屽啀鎺ㄨ繘鏈珷涓讳簨浠躲€?,
                "8. 銆愪簨浠舵椂鎬佹纭€戝墠鏂囧凡缁忓彂鐢熺殑浜嬶紝姝ｆ枃閲屼笉鑳藉啀鍐欐垚椹笂瑕佸彂鐢熸垨鍒氳鍙戠敓銆?,
                "",
                "鍐欎綔瑕佹眰锛?,
                "1. 蹇呴』涓ユ牸閬靛畧鏈珷澶х翰銆佸叏灞€璁惧畾銆佹湰绔犺瀹氥€佷笘鐣岃銆佽缁嗗ぇ绾插弬鑰冨拰瑙掕壊閿佸畾銆?,
                "2. 寮€澶村繀椤绘壙鎺ュ墠鏂囦簲绔犲拰绔犳湯蹇収锛屼腑闂存帹杩涘墽鎯咃紝缁撳熬瀹屾垚鏈珷閾哄灚浠诲姟銆?,
            "3. 浜虹墿琛屼负銆佸璇濄€佺墿鍝併€佹妧鑳姐€佽韩浠姐€佹椂闂村湴鐐瑰繀椤讳笌鏃㈡湁鐘舵€佷竴鑷淬€?,
            "4. 涓嶈鎶婁笅涓€绔犳牳蹇冧簨浠舵彁鍓嶅睍寮€锛屽彧鑳藉仛閾哄灚銆?,
            "5. 灏氭湭姝ｅ紡瑙侀潰鐨勮鑹诧紝涓嶈兘绐佺劧鍐欐垚鐔熶汉浜掑姩锛涙ā绯婄О鍛煎敖閲忔敼鎴愮湡瀹炲鍚嶃€?,
            "6. 濡傛灉涓婁竴绔犳儏缁繕娌¤惤涓嬶紝鏈珷寮€澶磋寤剁画閭ｈ偂鎯呯华锛屼笉瑕佺獊鐒舵崲棰戦亾銆?,
            "7. 濡傛灉鍓嶆枃浜ゆ帴鐣ョ敓纭紝瑕佺敤鍔ㄤ綔銆佸璇濄€佸満鏅彉鍖栬嚜鐒惰ˉ妗ワ紝涓嶈鐢熺‖璺冲垏銆?,
            "8. 鏈珷缁撳熬蹇呴』鍋滃湪閽╁瓙涓婏紝鍗″湪涓嬩竴绔犳牳蹇冧簨浠跺彂鐢熷墠鏈€鏈夊紶鍔涚殑涓€鍒伙紝缁濆涓嶈兘鎶婁笅涓€绔犲唴瀹瑰厛鍐欒繘鍘汇€?,
            "9. 姝ｆ枃鍐欏畬鍚庯紝蹇呴』鎸変笅闈㈠崗璁拷鍔犺拷韪緭鍑恒€?,
            "",
            "{{state_output_protocol}}",
            "",
            "{{extra_output_protocol}}"
        ].join("\n");

        const replacements = {
            frequency_prompt: frequencyPrompt,
            title: project.outline.title || "",
            genre: project.outline.subgenre || project.outline.genre || "",
            theme: project.outline.theme || "",
            worldbuilding: project.outline.worldbuilding || "",
            world_and_plan_context: worldAndPlanContext || "銆愪笘鐣岃鏍稿績璁惧畾銆戞殏鏃燶n\n銆愯缁嗗ぇ绾插弬鑰冦€戞殏鏃?,
            current_volume_outline_context: currentVolumeOutlineContext ? this.limitContext(currentVolumeOutlineContext, 1800) : "鏆傛棤鏄庣‘褰撳墠鍗风粏绾插垏鐗?,
            relevant_characters: characterDigest || "鏆傛棤鏄庣‘瑙掕壊璁惧畾",
            outline: chapter.summary || "",
            chapter_number: chapter.number || "",
            chapter_title: chapter.title || "",
            opening_relay_packet: openingRelayPacket || "銆愬紑绡囨帴鍔涙銆慭n鏈珷寮€澶寸洿鎺ユ壙鎺ヤ笂涓€绔犵殑缁撴灉涓庣幇鍦猴紝涓嶈澶嶈堪鍓嶆儏銆?,
            previous_outline_context: previousOutlineContext || "鏆傛棤鍓嶆枃澶х翰",
            story_state_summary: storyStateSummary || "鏆傛棤鏄庣‘鍓嶆枃鐘舵€佹憳瑕?,
            narrative_bridge_plan: narrativeBridgePlan || "銆愭湰绔犺妭濂忔墽琛岄鏋躲€慭n鍏堟帴涓婄珷缁撴灉锛屽啀鎺ㄨ繘鏈珷涓讳簨浠讹紝涓褰㈡垚娉㈡姌锛岀粨灏惧仠鍦ㄤ笅涓€姝ュ紶鍔涚偣銆?,
            prev_content: prevContent || "鏆傛棤鍓嶆枃",
            next_outline: nextOutline || "鏆傛棤涓嬩竴绔犵珷绾?,
            global_setting_note: project.global_setting_note || "鏆傛棤",
            chapter_setting_note: chapter.chapter_setting_note || "鏆傛棤",
            transition_guide: transitionGuide || "銆愬紑绔犺鎺ユ寚瀵笺€戣鐩存帴鎵挎帴涓婁竴绔犳渶鍚庝竴涓湁鏁堝満鏅笌鐘舵€佸睍寮€锛屼笉瑕佸钩鍦伴噸寮€銆?,
            setup_continuity_guard: setupContinuityGuard || "銆愪笅绔犻摵鍨壙鎺ヨ鍒欍€戝鏋滀笂涓€绔犳病鏈夋槑纭摵鍨紝灏辨寜鏈珷澶х翰鑷劧璧峰娍锛屼笉瑕佺‖鎻掓柊鍐茬獊銆?,
            expansion_hint: expansionHint || "銆愭櫤鑳芥墿鍐欏缓璁€戝彲鍥寸粫鏈珷鏍稿績浜嬩欢琛ュ厖鍔ㄤ綔缁嗚妭銆佷汉鐗╁績鐞嗐€佸璇濆崥寮堛€佺幆澧冨弽棣堝拰浼忕瑪鍛煎簲銆?,
            current_volume: volume.title || "",
            current_volume_summary: volume.summary || "",
            next_chapter_setup_instruction: nextChapterSetupInstruction || "銆愭湰绔犵粨灏鹃摵鍨换鍔°€戝綋鍓嶇珷绾叉湭鎻愪緵 next_chapter_setup锛屽彲鑷鍋氳交搴︽偓蹇甸摵鍨€?,
            next_chapter_forbidden_preview: nextChapterForbiddenPreview || "銆愬悗缁墽鎯呴鍛婏紙涓嬩竴绔犲墽鎯咃級 - 缁濆涓嶅彲鍐欍€戞殏鏃犱笅涓€绔犵珷绾层€?,
            state_output_protocol: stateOutputProtocol || "",
            extra_output_protocol: extraOutputProtocol || ""
        };

        let output = basePrompt;
        Object.entries(replacements).forEach(([key, value]) => {
            const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
            output = output.replace(pattern, value || "");
        });

        const hardPinnedFrontMatter = [
            "銆愭渶楂樹紭鍏堢骇锛氬綋鍓嶇珷鎵ц浠诲姟銆?,
            `褰撳墠鍙厑璁告墿鍐欑${chapter.number || "?"}绔犮€?{chapter.title || "鏈懡鍚嶇珷鑺?}銆嬬殑姝ｆ枃銆俙,
            "涓栫晫瑙傘€佽缁嗗ぇ绾层€佸嵎缁嗙翰銆佸墠鏂囩姸鎬侀兘鍙兘杈呭姪褰撳墠绔狅紝缁濅笉鑳借鐩栧綋鍓嶇珷鐨勫ぇ绾茶姹傘€?,
            "濡傛灉浠讳竴杈呭姪淇℃伅涓庢湰绔犲ぇ绾茬湅浼煎啿绐侊紝浠ャ€愭湰绔犲ぇ绾层€戝拰涓婁竴绔犵粨灏剧殑鐩存帴琛旀帴涓哄噯銆?,
            "",
            "銆愭湰绔犲ぇ绾诧紙蹇呴』閫愭潯钀藉疄锛夈€?,
            chapter.summary || "鏆傛棤鏈珷澶х翰",
            "",
            openingRelayPacket || "",
            "",
            "銆愬墠鏂囧師鏂囦娇鐢ㄨ鍒欍€?,
            "鍓嶄簲绔犲師鏂囩户缁畬鏁存彁渚涚粰妯″瀷锛屼絾鍙兘鐢ㄦ潵缁ф壙浜嬪疄銆佸悕璇嶃€佺姸鎬佸拰璇皵锛屼笉鍏佽鎶婂叾涓凡瀹屾垚鍐呭鏀瑰啓鎴愭柊绔犲紑澶淬€?,
            "",
            "銆愬墠鏂囦簲绔狅紙閲嶇偣鐪嬫渶鍚庝竴绔犵粨灏撅級銆?,
            prevContent || "鏆傛棤鍓嶆枃",
            "",
            "銆愬紑绔犺鎺ユ寚瀵笺€?,
            transitionGuide || "璇风洿鎺ユ壙鎺ヤ笂涓€绔犳渶鍚庝竴涓湁鏁堝満鏅笌鐘舵€佸睍寮€锛屼笉瑕佸钩鍦伴噸寮€銆?
        ].join("\n");

        const desktopInvariantBundle = [
            storyStateSummary ? `銆愬綋鍓嶆晠浜嬬姸鎬侊紙蹇呴』寤剁画锛夈€慭n${storyStateSummary}` : "",
            narrativeBridgePlan || "",
            previousOutlineContext ? `銆愬墠鏂囧ぇ绾叉憳瑕併€慭n${previousOutlineContext}` : "",
            currentVolumeOutlineContext ? `銆愬綋鍓嶅嵎缁嗙翰鍙傝€冦€慭n${this.limitContext(currentVolumeOutlineContext, 1800)}` : "",
            worldAndPlanContext ? worldAndPlanContext : "",
            characterDigest ? `銆愭湰绔犲嚭鍦?鐩稿叧瑙掕壊璁惧畾锛堥槻宕╁潖鍙傝€冿級銆慭n${characterDigest}` : "",
            project.global_setting_note ? `銆愬叏灞€璁惧畾鎻愰啋銆慭n${project.global_setting_note}` : "",
            chapter.chapter_setting_note ? `銆愭湰绔犺瀹氭彁閱掋€慭n${chapter.chapter_setting_note}` : "",
            setupContinuityGuard || "",
            openingAntiRepeatGuard || "",
            expansionHint || "",
            nextChapterSetupInstruction || "",
            nextChapterForbiddenPreview || "",
            stateOutputProtocol || "",
            extraOutputProtocol || ""
        ].filter(Boolean).join("\n\n");

        return [
            hardPinnedFrontMatter,
            desktopInvariantBundle,
            "銆愯ˉ鍏呭啓浣滄ā鏉裤€?,
            "浠ヤ笅鍐呭鏄ˉ鍏呭啓浣滆姹傦紝浼樺厛绾т綆浜庡墠闈㈢殑鍒氭€х害鏉燂紝涓嶅緱瑕嗙洊鏈珷澶х翰涓庣姸鎬佽鎺ヨ鍒欍€?,
            output
        ].filter(Boolean).join("\n\n");
    }

    buildStateOutputProtocol(project, chapter, relevantCharacters) {
        const names = (relevantCharacters || []).map((character) => character.name).filter(Boolean);
        const fallbackNames = (project.outline.characters || []).slice(0, 8).map((character) => character.name).filter(Boolean);
        const characterNames = Array.from(new Set(names.length ? names : fallbackNames)).slice(0, 8);

        return [
            "銆愮姸鎬佽緭鍑哄崗璁€?,
            "姝ｆ枃瀹屾垚鍚庯紝璇峰湪鏂囨湯杩藉姞鍒嗛殧绗?<<<STATE_JSON>>> 锛岀劧鍚庤緭鍑轰竴涓?JSON 瀵硅薄锛岀敤浜庣郴缁熻拷韪姸鎬併€?,
            `閲嶇偣璺熻釜瑙掕壊锛?{characterNames.length ? characterNames.join("銆?) : "璇疯嚜鍔ㄨ瘑鍒湰绔犱富瑕佽鑹?}`,
            "JSON 绀轰緥锛?,
            "<<<STATE_JSON>>>",
            "{",
            '  "timeline": "褰撳墠鏁呬簨鏃堕棿鐐?,',
            '  "current_location": "鏈珷缁撴潫鏃朵富瑙掓墍鍦ㄤ綅缃?,',
            '  "important_items": "鏈珷鏂板鎴栧彉鍖栫殑閲嶈鐗╁搧",',
            '  "item_updates": [',
            '    {',
            '      "name": "鐗╁搧鍚?,',
            '      "holder": "褰撳墠鎸佹湁鑰?,',
            '      "status": "鎸佹湁/浣跨敤涓?鎹熷潖/涓㈠け/娑堣€?,',
            '      "type": "鐗╁搧绫诲瀷",',
            '      "description": "鏈珷閲屽畠鐜板湪鏄粈涔堟牱",',
            '      "source": "鑾峰緱/杞Щ鍘熷洜",',
            '      "temporary": false',
            "    }",
            "  ],",
            '  "pending_plots": "鏈珷鐣欎笅鐨勫緟鎺ㄨ繘浜嬮」",',
            '  "key_event": "鏈珷鏈€鍏抽敭鐨勪竴浠朵簨",',
            '  "genre_progress": ["澶氶鏉愯繘搴︼紙鏍煎紡锛氳鑹插悕锛氬彉鍖栵級"],',
            '  "world_changes": {',
            '    "new_locations": [],',
            '    "character_movements": [],',
            '    "org_changes": [],',
            '    "offscreen_status": []',
            "  },",
            '  "time_constraints": ["浠嶅湪鎸佺画鐨勬椂闂寸害鏉熸垨鍊掕鏃?],',
            '  "characters": {',
            '    "瑙掕壊鍚?: {',
            '      "cultivation": "淇负/瀹炲姏鍙樺寲",',
            '      "location": "褰撳墠浣嶇疆",',
            '      "identity": "韬唤鍙樺寲",',
            '      "status": "韬綋/绮剧鐘舵€?,',
            '      "appearance": "褰撳墠澶栬矊/浼/鍙椾激/鑴忔薄绛夊舰璞＄姸鎬?,',
            '      "real_appearance": "鑻ユ湰绔犲嚭鐜颁吉瑁呮垨鍙樿韩锛屽啓鐪熷疄褰㈣薄",',
            '      "appearance_change": "鏈珷褰㈣薄鍙樺寲鎽樿",',
            '      "possessions": "鍏抽敭鐗╁搧鍙樺寲",',
            '      "relationships": "鍏崇郴鍙樺寲",',
            '      "goals": "褰撳墠鐩爣",',
            '      "secrets": "鐭ユ檽鎴栨毚闇茬殑绉樺瘑"',
            "    }",
            "  },",
            '  "appearance_changes": [',
            '    {',
            '      "name": "瑙掕壊鍚?,',
            '      "current_appearance": "鏈珷缁撴潫鏃惰鑹插澶栧憟鐜扮殑褰㈣薄",',
            '      "real_appearance": "鐪熷疄澶栬矊锛堣嫢鏈変吉瑁?鍙樿韩锛?,',
            '      "change_type": "姝ｅ父/浼/鍙椾激/鑴忔薄/鎭㈠/鍙樿韩",',
            '      "reason": "鍙樺寲鍘熷洜",',
            '      "duration": "鎸佺画鍒颁綍鏃讹紝鍙暀绌?',
            "    }",
            "  ]",
            "}"
        ].join("\n");
    }

    buildExtraOutputProtocol() {
        return [
            "銆愰檮鍔犺拷韪緭鍑恒€?,
            "姝ｆ枃鍚庤缁х画鎸変互涓嬫牸寮忚拷鍔狅紝渚夸簬绯荤粺杩借釜锛?,
            "鍏堝～鍐?<<<CHARACTER_APPEARANCE>>>锛屽彧璁板綍鏈珷姝ｆ枃閲岀湡姝ｅ啓鍑烘潵鐨勫疄鍚?鍥哄畾绉板懠銆?,
            "瑙掕壊鍚嶅繀椤诲拰姝ｆ枃閫愬瓧涓€鑷达紝鍙互鍐欑帇骞蹭簨銆佽档甯堝倕銆佹潕濠跺瓙锛屼笉鑳藉啓骞蹭簨銆佷汉浜嬬闀裤€佸摥璇夋灄涔︺€佸ス鐨勮€佽档銆佷笉鑻熻█绗戙€佸娍鍒╃溂銆?,
            "涓嶈鏍规嵁澶х翰銆佽韩浠姐€佸姩浣溿€佹儏缁€佷唬璇嶅幓琛ラ€犲悕瀛楋紱姝ｆ枃閲屾病鏄庣‘鍐欏嚭鏉ワ紝灏变笉瑕佺櫥璁般€?,
            "",
            "<<<CHARACTER_APPEARANCE>>>",
            "瑙掕壊鍚峾韬唤|棣栨鍑哄満",
            "瑙掕壊A|瑙掕壊B|鍏崇郴鎻忚堪|棣栨瑙侀潰",
            "<<<END_APPEARANCE>>>",
            "",
            "鍐嶅～鍐?<<<EXTRA_CHARACTERS>>>銆?,
            "榫欏瑙掕壊鍙兘浠庝笂闈㈢殑 <<<CHARACTER_APPEARANCE>>> 瑙掕壊鍚嶅崟閲屽鍒讹紝涓斿彧淇濈暀銆愪汉鐗╄瀹氶噷娌℃湁銆戠殑鏂颁复鏃朵汉鐗┿€?,
            "濡傛灉鏈珷娌℃湁鏂板榫欏锛屽氨鍐欙細榫欏瑙掕壊锛氭棤",
            "",
            "<<<EXTRA_CHARACTERS>>>",
            "榫欏瑙掕壊锛氳鑹插悕1锛堢畝鍗曠壒鐐癸級锛岃鑹插悕2锛堢畝鍗曠壒鐐癸級",
            "涓存椂鏀嚎锛氭敮绾挎弿杩?,
            "<<<END_EXTRA>>>",
            "",
            "<<<FORESHADOWS>>>",
            "鏂板煁锛?,
            "1. 浼忕瑪鍐呭锛堜紡绗旂被鍨嬶級锛岃鍒掔X绔犲洖鏀?,
            "鍥炴敹锛?,
            "1. 宸插洖鏀剁殑浼忕瑪鎻忚堪",
            "<<<END_FORESHADOWS>>>",
            "",
            "<<<PERSONALITY_CHANGE>>>",
            "瑙掕壊鍚峾浜嬩欢鎻忚堪|鏃ф€ф牸|鏂版€ф牸|杞彉鍘熷洜",
            "<<<END_PERSONALITY_CHANGE>>>"
        ].join("\n");
    }

    buildExpansionHint(outlineText, chapterNumber = 0) {
        const text = String(outlineText || "");
        if (!text) {
            return "";
        }

        const keywordRules = [
            { pattern: /娴嬬伒|娴嬭瘯|鑰冩牳|璇勪及|閫夋嫈/, tips: ["绐佸嚭瑙勫垯鍘嬪姏涓庣粨鏋滄偓蹇?, "鍔犲叆鍥磋鑰呭弽搴斿拰璇勪环鍙嶅樊"] },
            { pattern: /姣旀|鎿傚彴|绔炶禌|姣旇禌|瀵瑰喅/, tips: ["缁嗗寲鎴樻湳鍗氬紙涓庤妭濂忓彉鍖?, "鍐欏嚭瑙備紬銆佽鍒ゆ垨瀵规墜鐨勫績鐞嗗弽棣?] },
            { pattern: /淇偧|缁冨姛|绐佺牬|闂叧|鍙傛偀/, tips: ["澧炲姞韬綋鎰熷彈銆佺摱棰堥樆鍔涗笌椤挎偀缁嗚妭", "璁╃獊鐮村拰鍓嶆枃璧勬簮/浼忕瑪褰㈡垚鍥犳灉"] },
            { pattern: /鐐间腹|鐐煎櫒|鐐艰嵂|閿婚€?, tips: ["琛ュ厖姝ラ澶辫触椋庨櫓鍜屾潗鏂欑粏鑺?, "鍐欏嚭鎴愬搧甯︽潵鐨勫嵆鏃跺弽棣?] },
            { pattern: /鎺㈤櫓|瀵诲疂|鎺㈢储|鍙戠幇|绉樺/, tips: ["寮哄寲鐜鏈哄叧銆佹湭鐭ユ劅鍜屾帰绱㈠眰娆?, "璁╁彂鐜扮嚎绱笌鍚庣画鍐茬獊鎸傞挬"] },
            { pattern: /杩涘叆|闂叆|娼滃叆|鍏ヤ镜/, tips: ["澧炲姞娼滆椋庨櫓銆佹毚闇查闄╁拰涓村満搴斿彉", "鍐欐竻妤氳矾绾裤€侀樆纰嶅拰鍘嬭揩鎰?] },
            { pattern: /鎴樻枟|瀵规垬|浜ゆ墜|鍘潃/, tips: ["閬垮厤鍙姤鎷涘紡锛岃鍐欏眬鍔垮彉鍖栧拰鎯呯华璧蜂紡", "琛ヨ冻鎴樻枟鍚庢灉锛屽奖鍝嶄笅涓€鍦哄墽鎯?] },
            { pattern: /鍐茬獊|浜夋墽|瀵瑰硻|绾犵悍/, tips: ["璁╁璇濆悇鑷甫绔嬪満鍜岄殣鍚瘔姹?, "鎶婂啿绐佺粨鏋滆惤鍒颁汉鐗╁叧绯诲彉鍖栦笂"] },
            { pattern: /鐪熺浉|绉樺瘑|韬唤|鎻湶|鏇濆厜/, tips: ["鎺у埗鎻湶鑺傚锛屽厛閾烘儏缁啀钀戒俊鎭?, "閲嶇偣鍐欑煡鎯呰€呭弽搴斿拰鍚庣画浠ｄ环"] },
            { pattern: /鍛婄櫧|鏆ф槯|蹇冨姩|濠氱害|鎯呮劅/, tips: ["琛ヨ冻蹇冪悊鎷夋壇鍜屽姩浣滅粏鑺?, "璁╁叧绯绘帹杩涗笌涓荤嚎鐭涚浘浜掔浉褰卞搷"] }
        ];

        const matched = keywordRules.filter((rule) => rule.pattern.test(text));
        const tips = matched.flatMap((rule) => rule.tips);

        const lines = ["銆愭櫤鑳芥墿鍐欏缓璁€?, "鍦ㄤ笉鏀瑰彉鏈珷涓荤嚎缁撴灉鐨勫墠鎻愪笅锛岃嚜鐢辫ˉ瓒崇粏鑺傘€佹尝鎶樸€佸績鐞嗐€佸姩浣溿€佺幆澧冨拰浼忕瑪鍛煎簲锛屾嫆缁濇祦姘磋处銆?];
        if (chapterNumber) {
            lines.push(`褰撳墠绔犺妭锛氱 ${chapterNumber} 绔燻);
        }
        lines.push("鎵╁啓鏃惰鍥寸粫绔犺妭楠ㄦ灦琛ヨ冻琛€鑲夛紝涓嶈绌鸿浆姘村瓧鏁般€?);
        lines.push("鏈珷榛樿鐩爣鏄暱绔犺緭鍑猴細灏介噺鍐欏埌3000-6000瀛楋紝鑷冲皯涓嶈灏戜簬2500瀛椼€?);
        lines.push("浼樺厛琛ュ厖锛氬姩浣滆繃绋嬨€佷汉鐗╁績鐞嗐€佸満鏅弽棣堛€佸璇濆崥寮堛€佷紡绗斿懠搴斻€佺粨鏋滀綑娉€?);
        lines.push("濡傛灉绔犵翰鍙湁鍑犲彞璇濓紝涔熻鎶婃瘡涓儏鑺傜偣灞曞紑鎴愬畬鏁村満鏅紝涓嶈鍘嬬缉鎴愭彁瑕佸紡鐭珷銆?);

        if (tips.length) {
            lines.push("鏈珷閲嶇偣琛ュ己鏂瑰悜锛?);
            Array.from(new Set(tips)).slice(0, 6).forEach((tip, index) => {
                lines.push(`${index + 1}. ${tip}`);
            });
        } else {
            lines.push("鏈珷閲嶇偣琛ュ己鏂瑰悜锛?);
            lines.push("1. 姣忎釜鎯呰妭鐐归兘瑕佹湁鍏蜂綋瑙﹀彂銆佹帹杩涘拰鍙嶉銆?);
            lines.push("2. 鍏抽敭瀵硅瘽涓嶈鍙紶閫掍俊鎭紝瑕佷綋鐜扮珛鍦轰笌鎯呯华銆?);
            lines.push("3. 缁撳熬瑕佺暀涓嬩綑娉€佹偓蹇垫垨鐘舵€佸彉鍖栵紝鏈嶅姟涓嬬珷閾哄灚銆?);
            lines.push("4. 濡傛灉澶х翰鍐欏緱寰堢煭锛岃涓诲姩琛ヨ冻娉㈡姌锛屼笉瑕佸啓鎴愭彁绾插杩般€?);
        }

        return lines.join("\n");
    }

    buildNextChapterSetupInstruction(chapter) {
        const setup = chapter.next_chapter_setup || {};
        const lines = [
            "銆愭湰绔犵粨灏鹃摵鍨换鍔★紙蹇呴』瀹屾垚锛夈€?,
            "鈿狅笍 閲嶈锛氳繖鏄摵鍨紝涓嶆槸棰勫憡銆?,
            "瑙勫垯锛?,
            "1. 閾哄灚 = 鍩嬩笅鈥滃洜鈥濓紝缁濅笉鐩存帴鍐欌€滄灉鈥濄€?,
            "2. 鍙兘鍐欑姸鎬併€佹皼鍥淬€佹偓蹇点€佹殫绀猴紝涓嶈鐩存帴鍐欎笅涓€绔犱細鍙戠敓浠€涔堛€?,
            "3. 涓嶅厑璁稿嚭鐜扳€滀笅绔犲皢浼氣€濃€滈┈涓婂氨浼氣€濃€滀笅涓€绔犱細鈥濅箣绫荤殑棰勫憡鍙ュ紡銆?,
            "4. 瀛楁暟鎺у埗鍦?1-2 鍙ヨ瘽锛屼笉瑕佸啓鎴愰暱娈甸鍛娿€?
        ];

        if (setup.state_setup) lines.push(`- 鐘舵€侀摵鍨細${setup.state_setup}`);
        if (setup.atmosphere_setup) lines.push(`- 姘涘洿閾哄灚锛?{setup.atmosphere_setup}`);
        if (setup.suspense_hook) lines.push(`- 鎮康閽╁瓙锛?{setup.suspense_hook}`);
        if (setup.clue_hint) lines.push(`- 绾跨储鏆楃ず锛?{setup.clue_hint}`);
        if (setup.countdown) lines.push(`- 鍊掕鏃讹細${setup.countdown}`);

        lines.push("绀轰緥锛氬彲浠ュ啓鈥滀粬姘旀伅娓愬急锛屽尰鑰呮憞澶翠笉璇€濓紝涓嶈兘鍐欌€滀笅绔犱粬灏嗘鍘烩€濄€?);
        lines.push("绀轰緥锛氬彲浠ュ啓鈥滆繙澶勫拷鐒朵紶鏉ュ紓鍝嶏紝绌烘皵涓€涓嬪瓙娌変簡涓嬫潵鈥濓紝涓嶈兘鍐欌€滀笅绔犳晫浜哄氨浼氭潃鍒扳€濄€?);
        return lines.join("\n");
    }

    buildNextChapterForbiddenPreview(nextOutline) {
        if (!nextOutline) {
            return "";
        }

        return [
            "銆愬悗缁墽鎯呴鍛婏紙涓嬩竴绔犲墽鎯咃級 - 缁濆涓嶅彲鍐欙紒浠呬緵鍙傝€冿紒銆?,
            `涓嬩竴绔狅細绗?{nextOutline.number}绔?${nextOutline.title || ""}`,
            nextOutline.summary || "",
            "绾㈢嚎瑙勫垯锛?,
            "1. 涓嬩竴绔犳墠鍙戠敓鐨勬牳蹇冧簨浠讹紝鏈珷缁濆涓嶈兘鎻愬墠鍐欏嚭鏉ャ€?,
            "2. 鍙互鍋氭偓蹇靛拰鏆楃ず锛屼絾涓嶈兘鎻愬墠瀹屾垚涓嬩竴绔犵殑鍐茬獊銆佹彮闇层€佺獊鐮淬€佹浜°€佽韩浠芥洕鍏夈€佽幏瀹濈瓑缁撴灉銆?,
            "3. 鏈珷缁撳熬鍙兘瀵瑰簲涓嬩竴绔犵殑銆愬洜銆戯紝涓嶈兘鎶婁笅涓€绔犵殑銆愭灉銆戝厛鍐欏畬銆?
        ].join("\n");
    }

    getPreviousChapterContents(project, currentVolume, currentChapter, maxChapters = 5) {
        const all = [];
        (project.outline.volumes || []).forEach((volume, volumeIndex) => {
            (volume.chapters || []).forEach((chapter) => {
                all.push({
                    volumeIndex,
                    volumeId: volume.id || volume.uuid || "",
                    chapterId: chapter.id || chapter.uuid || "",
                    number: Number(chapter.number || chapter.chapter_number || 0),
                    title: chapter.title || "",
                    summary: chapter.summary || "",
                    keyEvent: chapter.key_event || chapter.keyEvent || "",
                    content: chapter.content || (chapter.uuid ? project.chapters?.[chapter.uuid] : "") || ""
                });
            });
        });
        all.sort((a, b) => a.volumeIndex - b.volumeIndex || a.number - b.number);
        const index = all.findIndex((item) =>
            item.volumeId === (currentVolume.id || currentVolume.uuid || "") &&
            item.chapterId === (currentChapter.id || currentChapter.uuid || "")
        );
        if (index <= 0) {
            return "";
        }
        const previousItems = all.slice(Math.max(0, index - maxChapters), index);
        return previousItems
            .map((item) => {
                const contentText = String(item.content || item.summary || item.keyEvent || "").trim();
                return `銆愮${item.number}绔?${item.title}銆慭n${contentText}`;
            })
            .join("\n\n");
    }

    getVolumeNumber(project, currentVolume) {
        const volumes = project?.outline?.volumes || [];
        const index = volumes.findIndex((volume) =>
            (volume.id || volume.uuid || "") === (currentVolume.id || currentVolume.uuid || "")
        );
        return index >= 0 ? index + 1 : 1;
    }

    buildPreviousOutlineSummary(project, currentVolume, currentChapter) {
        const all = [];
        (project.outline.volumes || []).forEach((volume, volumeIndex) => {
            (volume.chapters || []).forEach((chapter) => {
                all.push({
                    volumeIndex,
                    volumeId: volume.id || volume.uuid || "",
                    chapterId: chapter.id || chapter.uuid || "",
                    number: Number(chapter.number || chapter.chapter_number || 0),
                    title: chapter.title || "",
                    summary: chapter.summary || "",
                    keyEvent: chapter.key_event || chapter.keyEvent || ""
                });
            });
        });

        all.sort((a, b) => a.volumeIndex - b.volumeIndex || a.number - b.number);
        const index = all.findIndex((item) =>
            item.volumeId === (currentVolume.id || currentVolume.uuid || "") &&
            item.chapterId === (currentChapter.id || currentChapter.uuid || "")
        );
        if (index <= 0) {
            return "";
        }

        const previousItems = all.slice(Math.max(0, index - 10), index);
        return previousItems.map((item) => {
            const brief = item.keyEvent || Utils.summarizeText(item.summary, 180) || item.title;
            return `- 绗?{item.number}绔?${item.title || ""}锛?{brief}`;
        }).join("\n");
    }

    getNextChapterOutline(project, currentVolume, currentChapter) {
        const all = [];
        (project.outline.volumes || []).forEach((volume, volumeIndex) => {
            (volume.chapters || []).forEach((chapter) => {
                all.push({
                    volumeIndex,
                    volumeId: volume.id || volume.uuid || "",
                    chapterId: chapter.id || chapter.uuid || "",
                    number: Number(chapter.number || chapter.chapter_number || 0),
                    title: chapter.title || "",
                    summary: chapter.summary || ""
                });
            });
        });
        all.sort((a, b) => a.volumeIndex - b.volumeIndex || a.number - b.number);
        const index = all.findIndex((item) =>
            item.volumeId === (currentVolume.id || currentVolume.uuid || "") &&
            item.chapterId === (currentChapter.id || currentChapter.uuid || "")
        );
        return index >= 0 && index < all.length - 1 ? all[index + 1] : null;
    }

    extractChapterOutlineCharacterNames(summaryText) {
        const summary = String(summaryText || "");
        if (!summary.trim()) {
            return [];
        }

        const sectionMatch = summary.match(/銆愬嚭鍦轰汉鐗┿€慭s*([\s\S]*?)(?=\n銆恷$)/);
        const section = sectionMatch?.[1] ? String(sectionMatch[1]).trim() : "";
        if (!section) {
            return [];
        }

        const names = [];
        section.split(/\r?\n/).forEach((line) => {
            const rawLine = String(line || "").trim();
            if (!rawLine || (!rawLine.startsWith("-") && !rawLine.startsWith("鈥?))) {
                return;
            }
            const cleaned = rawLine.replace(/^[鈥?]\s*/, "");
            const match = cleaned.match(/^([\u4e00-\u9fa5]{2,4})/);
            const name = String(match?.[1] || "").trim();
            if (name) {
                names.push(name);
            }
        });

        return Array.from(new Set(names));
    }

    collectRelevantCharacters(project, contextText, preferredNames = []) {
        const chars = project.outline.characters || [];
        if (!contextText) {
            return chars.filter((character) => character.is_protagonist || character.is_main).slice(0, 6);
        }

        const found = [];
        const seen = new Set();
        const preferredNameSet = new Set((preferredNames || []).map((name) => String(name || "").trim()).filter(Boolean));
        chars.forEach((character) => {
            const aliases = Array.isArray(character.aliases)
                ? character.aliases
                : Utils.ensureArrayFromText(character.aliases || character["鍒悕"]);
            const names = [character.name, ...aliases];
            const identities = Utils.ensureArrayFromText(character.identity || character["韬唤"] || "");
            const matched = names.some((token) => token && preferredNameSet.has(token))
                || [...names, ...identities].some((token) => token && token.length >= 2 && contextText.includes(token));
            if (matched && character.name && !seen.has(character.name)) {
                found.push(character);
                seen.add(character.name);
            }
        });

        return found.length ? found.slice(0, 8) : chars.slice(0, 6);
    }

    buildRelevantCharactersInfo(foundChars) {
        if (!foundChars?.length) {
            return "";
        }
        return foundChars.map((character) => {
            const chunks = [];
            if (character.identity) chunks.push(`韬唤锛?{character.identity}`);
            if (character.personality) chunks.push(`鎬ф牸锛?{Utils.summarizeText(character.personality, 70)}`);
            if (character.background) chunks.push(`鑳屾櫙锛?{Utils.summarizeText(character.background, 90)}`);
            if (character.relationships) chunks.push(`鍏崇郴锛?{Utils.summarizeText(character.relationships, 80)}`);
            if (character.appearance) chunks.push(`澶栬矊锛?{Utils.summarizeText(character.appearance, 70)}`);
            if (character.abilities) chunks.push(`鑳藉姏锛?{Utils.summarizeText(character.abilities, 70)}`);
            if (character.goals) chunks.push(`鐩爣锛?{Utils.summarizeText(character.goals, 70)}`);
            return `- ${character.name || "鏈懡鍚?}\n  ${chunks.join("\n  ")}`;
        }).join("\n");
    }

    sanitizeCharacterPromptField(value, field = "general", max = 80) {
        const raw = Utils.summarizeText(String(value || "").replace(/\s+/g, " ").trim(), max * 2);
        if (!raw) {
            return "";
        }

        const clauses = raw
            .split(/[，。；、\n]/)
            .map((item) => this.rewriteCharacterPromptClause(item, field))
            .filter(Boolean);

        const deduped = Array.from(new Set(clauses)).slice(0, field === "appearance" ? 3 : 4);
        return Utils.summarizeText(deduped.join("；"), max);
    }

    rewriteCharacterPromptClause(clause, field = "general") {
        let text = String(clause || "").trim();
        if (!text) {
            return "";
        }

        const replacements = [
            [/(?:居高临下(?:地)?)(?:看着|盯着|望着)?[^，。；！？\n]{0,8}/g, ""],
            [/(领口|衣领)洗得发白/g, "衣领磨旧"],
            [/(袖口|衣角|衣摆)洗得发白/g, "$1磨旧"],
            [/(袖口|衣角|衣摆)磨得发白/g, "$1磨旧"],
            [/褪色的蓝布褂子/g, "旧蓝布褂子"],
            [/洗得发白的(?:确良|衬衫|衣领|外套)/g, "旧衣服"],
            [/一袭(白衣|青衣|红衣|黑衣)/g, "常穿$1"],
            [/(白衣|青衣|红衣|黑衣)猎猎(?:作响)?/g, "$1被风吹起"],
            [/衣袂(?:翻飞|飘飘|猎猎)/g, "衣摆被风带起"],
            [/墨发(?:如瀑|飞扬)/g, "长发"],
            [/仙风道骨/g, "气度出众"],
            [/手上用了死力气/g, ""],
            [/(指甲|指节|骨节)[^，。；！？\n]{0,8}(掐进|陷进|嵌进)[^，。；！？\n]{0,8}(肉里|皮肉)/g, ""],
            [/随着呼吸上下起伏/g, ""],
            [/胸口(?:剧烈|明显|轻轻|微微)?起伏/g, ""],
            [/(手指|指尖)(?:用力|死死|狠狠)?(?:抠住|扣住|攥住|抓住)[^；，。！？\n]{0,12}/g, ""],
            [/死死(抓着|抓住|攥着|攥住|按着|按住|盯着|瞪着|咬着|咬住)/g, "$1"],
            [/狠狠(抓着|抓住|攥着|攥住|按着|按住|盯着|瞪着|咬着|咬住)/g, "$1"]
        ];
        replacements.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });

        if (field !== "appearance" && /^(常穿白衣|常穿青衣|常穿红衣|常穿黑衣|衣摆被风带起|白衣被风吹起|青衣被风吹起|红衣被风吹起|黑衣被风吹起|衣领磨旧|袖口磨旧|旧衣服|长发|气度出众)$/.test(text)) {
            return "";
        }

        text = text
            .replace(/[，；、]{2,}/g, "；")
            .replace(/^[，；、\s]+|[，；、\s]+$/g, "")
            .trim();

        return text;
    }

    buildRelevantCharactersInfo(foundChars) {
        if (!foundChars?.length) {
            return "";
        }

        const body = foundChars.map((character) => {
            const chunks = [];
            const aliases = Utils.ensureArrayFromText(character.aliases || character["鍒悕"] || "");
            const identity = this.sanitizeCharacterPromptField(character.identity, "identity", 50);
            const personality = this.sanitizeCharacterPromptField(character.personality, "personality", 60);
            const background = this.sanitizeCharacterPromptField(character.background, "background", 80);
            const relationships = this.sanitizeCharacterPromptField(character.relationships, "relationships", 70);
            const appearance = this.sanitizeCharacterPromptField(character.appearance, "appearance", 55);
            const abilities = this.sanitizeCharacterPromptField(character.abilities, "abilities", 60);
            const goals = this.sanitizeCharacterPromptField(character.goals, "goals", 60);

            if (identity) chunks.push(`身份：${identity}`);
            if (aliases.length) chunks.push(`固定称呼/别名：${aliases.join("、")}`);
            if (personality) chunks.push(`性格事实：${personality}`);
            if (background) chunks.push(`背景事实：${background}`);
            if (relationships) chunks.push(`关系：${relationships}`);
            if (appearance) chunks.push(`外观事实：${appearance}`);
            if (abilities) chunks.push(`能力：${abilities}`);
            if (goals) chunks.push(`目标：${goals}`);
            return `- ${character.name || "未命名"}\n  ${chunks.join("\n  ")}`;
        }).join("\n");

        return [
            "【本章出场相关角色设定（防崩坏参考）】",
            "以下只用于锁定身份、关系、目标、固定称呼和外观事实。",
            "不要把设定里的原句、标签词、描写套话直接照抄进正文，更不要在同一章里反复复用同一描述词。",
            body
        ].join("\n");
    }

    buildVolumeSynopsisContext(project, currentVolumeNumber) {
        if (!project?.outline?.volumes?.length) {
            return "";
        }
        return project.outline.volumes.map((volume, index) => {
            if (!volume.summary && !volume.cliffhanger) {
                return "";
            }
            const prefix = index + 1 === currentVolumeNumber ? "銆愬綋鍓嶅嵎銆? : "銆愬弬鑰冨嵎銆?;
            const normalizedSummary = this.normalizeSynopsisReferenceText(project, volume.summary || "");
            const normalizedCliffhanger = this.normalizeSynopsisReferenceText(project, volume.cliffhanger || "");
            return [
                `${prefix} 绗?{index + 1}鍗?${volume.title || ""}`,
                normalizedSummary,
                normalizedCliffhanger ? `鍗锋湯閽╁瓙锛?{normalizedCliffhanger}` : ""
            ].filter(Boolean).join("\n");
        }).filter(Boolean).join("\n\n");
    }

    collectSynopsisHistoryItems(project, currentVolumeNumber) {
        const items = [];
        (project?.outline?.volumes || [])
            .slice(0, Math.max(0, currentVolumeNumber - 1))
            .forEach((volume, volumeIndex) => {
                const synopsis = this.normalizeSynopsisReferenceText(
                    project,
                    volume.chapterSynopsis || volume.chapter_synopsis || ""
                );
                synopsis
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .forEach((line, lineIndex) => {
                        const chapterMatch = line.match(/^绗琝s*(\d+)\s*绔?);
                        items.push({
                            volumeNumber: volumeIndex + 1,
                            chapterNumber: Number(chapterMatch?.[1] || lineIndex + 1),
                            line,
                            body: this.extractSynopsisEventBody(line)
                        });
                    });
            });
        return items;
    }

    formatSynopsisHistoryItem(item, bodyMax = 32) {
        const body = Utils.summarizeText(item?.body || item?.line || "", bodyMax);
        return `- 绗?{item?.volumeNumber || "?"}鍗风${item?.chapterNumber || "?"}绔狅細${body}`;
    }

    buildSynopsisHistoryContext(project, currentVolumeNumber) {
        const items = this.collectSynopsisHistoryItems(project, currentVolumeNumber);
        if (!items.length) {
            return "";
        }

        return items.map((item) => `绗?{item.volumeNumber}鍗?${item.line}`).join("\n");
    }

    buildSynopsisPhaseGuide(chapterCount) {
        const total = Math.max(0, Number(chapterCount || 0));
        if (!total) {
            return "";
        }
        if (total <= 5) {
            return [
                "銆愭湰鍗疯妭濂忔姢鏍忋€?,
                `鍏?${total} 绔狅紝鍓嶅崐娈靛厛鎵挎帴涓婁竴鍗风粨灏惧苟绔嬭捣鏈嵎鐩爣锛屽悗鍗婃鎶婂啿绐佹帹楂樺悗瀹屾垚闃舵鎬ф敹鏉燂紝缁撳熬鍐嶇暀閽╁瓙銆俙
            ].join("\n");
        }

        const openingEnd = Math.max(1, Math.min(total, Math.ceil(total * 0.25)));
        const escalationEnd = Math.max(openingEnd + 1, Math.min(total, Math.ceil(total * 0.65)));
        const turnEnd = Math.max(escalationEnd + 1, Math.min(total, Math.ceil(total * 0.85)));
        const formatRange = (start, end) => start >= end ? `绗?{start}绔燻 : `绗?{start}-${end}绔燻;
        const lines = ["銆愭湰鍗疯妭濂忔姢鏍忋€?];

        lines.push(`${formatRange(1, openingEnd)}锛氬厛鎵挎帴涓婁竴鍗风粨灏撅紝鏄庣‘鏈嵎鐩爣銆佸帇鍔涘拰琛屽姩鏂瑰悜锛屼笉瑕佺┖杞€俙);
        if (openingEnd + 1 <= escalationEnd) {
            lines.push(`${formatRange(openingEnd + 1, escalationEnd)}锛氭寔缁崌绾ч樆鍔涳紝璁╀俊鎭€佸叧绯汇€佷唬浠锋垨浣嶇疆鍙戠敓杩炵画鍙樺寲锛岄伩鍏嶅弽澶嶅洿鐫€鍚屼竴鍐茬獊鎵撹浆銆俙);
        }
        if (escalationEnd + 1 <= turnEnd) {
            lines.push(`${formatRange(escalationEnd + 1, turnEnd)}锛氬畨鎺掑叧閿浆鎶樸€佸け鎺х偣鎴栭噸澶т唬浠凤紝璁╁眬鍔挎槑鏄炬敼閬撱€俙);
        }
        if (turnEnd + 1 <= total) {
            lines.push(`${formatRange(turnEnd + 1, total)}锛氬畬鎴愭湰鍗烽樁娈垫€ф敹鏉熷苟鐣欎笅鍗锋湯閽╁瓙锛屼絾涓嶈鐩存帴灞曞紑涓嬩竴鍗蜂富绾裤€俙);
        }
        return lines.join("\n");
    }

    buildSynopsisClarityGuard({ volumeNumber, chapterCount, hasDetailedOutline = false }) {
        const lines = ["銆愬綋鍓嶅嵎鎵ц鎶ゆ爮銆?];
        if (hasDetailedOutline) {
            lines.push(`绗?${volumeNumber} 鍗峰瓨鍦ㄨ缁嗗ぇ绾叉椂锛屼紭鍏堟湇浠庤缁嗗ぇ绾诧紱绠€鐣ュ嵎绾插彧璐熻矗鎻愰啋鏂瑰悜锛屼笉瑕佸彧鍥寸潃鎶借薄璇嶆墦杞€俙);
        }
        lines.push("濡傛灉褰撳墠鍗峰嵎绾插彧鍐欎簡鎶借薄鏂瑰悜锛屼綘蹇呴』鍏堝湪鑴戜腑琛ュ叏锛氬紑灞€鎵挎帴浜嬩欢銆佹湰鍗锋樉鎬х洰鏍囥€佷腑娈垫寔缁樆鍔涖€佸叧閿浆鎶樸€佸嵎鏈惤鐐癸紝鍐嶅垎閰嶅埌绔犺妭銆?);
        lines.push("鍏佽蹇呰杩囨ˉ绔狅紝浣嗚繃妗ョ珷蹇呴』鑷冲皯甯︽潵涓€涓彲瑙佸彉鍖栵細鏂颁俊鎭€佹柊鍐冲畾銆佹柊浠ｄ环銆佹柊浣嶇疆鎴栨柊鍏崇郴銆?);
        lines.push("涓嶈鎶婁笂涓€绔犵粨灏炬崲鍙ヨ瘽鍐嶅啓涓€閬嶏紱涓婁竴绔犵殑缁撴灉鍙兘浣滀负涓嬩竴绔犵殑璧风偣銆?);
        lines.push("绂佹鐢ㄢ€滅户缁皟鏌モ€濃€滅户缁慨鐐尖€濃€滃叧绯诲崌娓┾€濃€滃眬鍔垮彉鍖栤€濃€滄殫娴佹秾鍔ㄢ€濊繖绫绘娊璞¤瘝鍗曠嫭鍏呭綋鏍稿績浜嬩欢锛屽繀椤昏惤鍒板叿浣撳姩浣滃拰缁撴灉銆?);

        const phaseGuide = this.buildSynopsisPhaseGuide(chapterCount);
        if (phaseGuide) {
            lines.push(phaseGuide);
        }
        return lines.join("\n");
    }

    buildVolumeInnovationPrompt(project, concept, worldbuilding) {
        const history = (project?.outline?.volumes || [])
            .map((volume, index) => ({ index, summary: volume.summary || "" }))
            .filter((item) => item.summary.trim())
            .map((item) => `绗?{item.index + 1}鍗凤細${item.summary}`)
            .slice(-4);

        return [
            "浼樺厛瑙勯伩濂楄矾鍖栧嵎绾诧細閲嶅鎵撹劯銆佹満姊板崌绾с€佸悓鏋勫壇鏈€佸彧闈犲弽杞‖鎷藉墽鎯呫€?,
            "姣忓嵎鏈€濂芥湁鏂扮殑鐩爣銆佹柊鐨勫帇鍔涙簮銆佹柊鐨勪俊鎭閲忓拰鏂扮殑鍗锋湯閽╁瓙銆?,
            history.length ? `宸叉湁鍗风翰鍙傝€冿細\n${history.join("\n")}` : "",
            concept ? `鏁呬簨姒傚康鎻愰啋锛?{this.limitContext(concept, 500)}` : "",
            worldbuilding ? `涓栫晫瑙傛彁閱掞細${this.limitContext(worldbuilding, 500)}` : ""
        ].filter(Boolean).join("\n");
    }

    buildPreviousChapterSynopsisContext(project, currentVolumeNumber) {
        if (!project?.outline?.volumes?.length || currentVolumeNumber <= 1) {
            return "";
        }
        return project.outline.volumes
            .slice(0, currentVolumeNumber - 1)
            .map((volume, index) => {
                const synopsis = this.normalizeSynopsisReferenceText(
                    project,
                    volume.chapterSynopsis || volume.chapter_synopsis || ""
                );
                return synopsis ? `銆愮${index + 1}鍗风粏绾层€慭n${this.limitContext(synopsis, 2400)}` : "";
            })
            .filter(Boolean)
            .join("\n\n");
    }

    buildUsedPlotsSummary(project, currentVolumeNumber) {
        const previousLines = this.collectSynopsisHistoryLines(project, currentVolumeNumber);
        if (!previousLines.length) {
            return "";
        }

        const clicheWarning = this.buildSynopsisClicheWarning(project, currentVolumeNumber);
        return [
            clicheWarning,
            "銆愨殸锔?浠ヤ笅鎯呰妭宸茬粡浣跨敤杩囷紝缁濆绂佹閲嶅鎴栧彉鐩搁噸澶嶏紒銆?,
            previousLines.join("\n"),
            "",
            `锛堝叡${previousLines.length}绔狅級`
        ].filter(Boolean).join("\n");
    }

    extractSynopsisEventBody(line) {
        const text = String(line || "").trim();
        if (!text) {
            return "";
        }
        const match = text.match(/^绗琝s*\d+\s*绔燵锛?銆?\-锛?]?\s*(.+?)\s*[鈥擻-锛嶁€揮\s*(.+)$/);
        if (match) {
            return `${match[1].trim()} ${match[2].trim()}`.trim();
        }
        return text.replace(/^绗琝s*\d+\s*绔燵锛?銆?\-锛?]?\s*/, "").trim();
    }

    normalizeSynopsisEventFingerprint(text) {
        return String(text || "")
            .replace(/[绗嵎绔犺妭锛?銆?\-鈥旓紞鈥揬s]/g, "")
            .replace(/[锛屻€傦紒锛燂紱銆佲€溾€?']/g, "")
            .slice(0, 24);
    }

    buildSynopsisRepeatRiskSummary(lines) {
        const eventMap = new Map();
        const keywordRules = [
            { label: "姣旇禌/鑰冩牳", pattern: /姣旀|鎿傚彴|绔炶禌|姣旇禌|鑰冩牳|娴嬭瘯/g },
            { label: "淇偧/绐佺牬", pattern: /淇偧|闂叧|绐佺牬|鍙傛偀/g },
            { label: "鎺㈢储/绉樺", pattern: /鎺㈢储|绉樺|瀵诲疂|鎺㈤櫓/g },
            { label: "韬唤鎻湶", pattern: /韬唤|鐪熺浉|鎻湶|鏇濆厜/g },
            { label: "鍐茬獊瀵瑰硻", pattern: /浜夋墽|瀵瑰硻|鍐茬獊|浜ら攱/g }
        ];

        (lines || []).forEach((line) => {
            const body = this.extractSynopsisEventBody(line);
            const fingerprint = this.normalizeSynopsisEventFingerprint(body);
            if (!fingerprint) {
                return;
            }
            if (!eventMap.has(fingerprint)) {
                eventMap.set(fingerprint, { body, count: 0 });
            }
            eventMap.get(fingerprint).count += 1;
        });

        const repeatedEvents = Array.from(eventMap.values())
            .filter((item) => item.count >= 2)
            .sort((left, right) => right.count - left.count)
            .slice(0, 5);

        const joinedText = (lines || []).join("\n");
        const repeatedPatterns = keywordRules
            .map((item) => ({ ...item, count: (joinedText.match(item.pattern) || []).length }))
            .filter((item) => item.count >= 4)
            .slice(0, 4);

        if (!repeatedEvents.length && !repeatedPatterns.length) {
            return "";
        }

        return [
            "銆愰噸澶嶉闄╂憳瑕併€?,
            repeatedEvents.length
                ? `杩欎簺浜嬩欢琛ㄨ揪鍦ㄥ墠鏂囬噷宸茬粡澶氭鍑虹幇锛岃閬垮厤鍚屾瀯澶嶅啓锛歕n${repeatedEvents.map((item) => `- ${this.limitContext(item.body, 48)}锛堢害 ${item.count} 娆★級`).join("\n")}`
                : "",
            repeatedPatterns.length
                ? `杩欎簺妗ユ绫诲瀷鍦ㄥ墠鏂囦腑鍋忓锛屾湰鍗疯鎹㈣搴︺€佹崲闃诲姏銆佹崲缁撴灉锛歕n${repeatedPatterns.map((item) => `- ${item.label}锛堢害 ${item.count} 娆★級`).join("\n")}`
                : ""
        ].filter(Boolean).join("\n");
    }

    buildSynopsisInnovationPrompt(project, volumeNumber, concept, volumeSummary) {
        const currentOutlineText = [concept || "", volumeSummary || ""].filter(Boolean).join("\n");
        const analysis = this.analyzeSynopsisInnovation(project, volumeNumber, currentOutlineText);
        const promptParts = [];

        if (analysis.allowedRepeatEvents.length) {
            promptParts.push("銆愨湪 鏍稿績鎯呰妭鍒涙柊鍚彂銆?);
            promptParts.push("浠ヤ笅鎯呰妭绫诲瀷鍙互鍐嶆鍑虹幇锛屼絾蹇呴』鍐欏嚭鍜屽墠鏂囦笉鍚岀殑缁嗚妭銆侀樆鍔涗笌鍚庢灉锛?);
            promptParts.push("锛堜互涓嬪唴瀹逛粎浣滃惎鍙戯紝榧撳姳鑷敱鍙戞尌锛屼笉鏄‖鎬ч€夐」锛?);
            analysis.allowedRepeatEvents.slice(0, 4).forEach((event) => {
                promptParts.push(`銆?{event.type}銆戠害宸插嚭鐜?${event.count} 娆);
                promptParts.push(`  馃挕 鎬濊€冩柟鍚戯細${event.description}`);
                (event.variations || []).slice(0, 2).forEach((variation) => {
                    const [dimension] = String(variation || "").split("锛?);
                    promptParts.push(`  - 鍙互浠庘€?{dimension || variation}鈥濊搴︽崲鍐欐硶`);
                });
                if (event.examples?.[0]) {
                    promptParts.push(`  鉁?鍙傝€冨惎鍙戯細${event.examples[0]}`);
                }
                promptParts.push("  浠ヤ笂鍙粰鏂瑰悜锛屼笉闄愬埗浣犺嚜鐢卞垱鏂般€?);
            });
        }

        const eventTypeSuggestions = this.getSynopsisEventTypeSuggestions();
        const selectedEventTypes = [];
        if (/鎴榺鏂梶鎵搢鏉€|鍙嶆潃|浜ら攱/.test(currentOutlineText)) {
            selectedEventTypes.push("鎴樻枟");
        }
        if (/淇偧|绐佺牬|澧冪晫|闂叧|椤挎偀/.test(currentOutlineText)) {
            selectedEventTypes.push("淇偧");
        }
        if (/鎺㈢储|绉樺|瀵诲疂|鎺㈡煡|璋冩煡/.test(currentOutlineText)) {
            selectedEventTypes.push("鎺㈢储");
        }
        if (/瀵硅瘽|璋堝垽|鍟嗛噺|闂瓟|璇曟帰/.test(currentOutlineText)) {
            selectedEventTypes.push("瀵硅瘽");
        }
        if (!selectedEventTypes.length) {
            selectedEventTypes.push("鎴樻枟", "淇偧", "鎺㈢储");
        }

        promptParts.push("銆愷煄?鍒涗綔鍚彂銆?);
        promptParts.push("浠ヤ笅鍐呭浠呬緵鍙傝€冿紝榧撳姳澶ц儐鍒涙柊锛?);
        selectedEventTypes.slice(0, 3).forEach((eventType) => {
            const suggestion = eventTypeSuggestions[eventType];
            if (!suggestion) {
                return;
            }
            promptParts.push(`銆?{eventType}绫绘儏鑺傘€慲);
            if (suggestion.avoid?.[0]) {
                promptParts.push(`  涓嶅缓璁細${suggestion.avoid[0]}`);
            }
            if (suggestion.suggest?.[0]) {
                promptParts.push(`  鍙互鑰冭檻锛?{suggestion.suggest[0]}`);
            }
            promptParts.push("  鏇撮紦鍔变綘绐佺牬甯歌锛岃嚜鐢卞垱閫犮€?);
        });

        const plotElements = this.getSynopsisPlotElements();
        promptParts.push("銆愷煂?鐏垫劅鍏冪礌銆?);
        promptParts.push("鍙嚜鐢辩粍鍚堛€佹媶鍒嗐€佹敼閫犮€佸拷鐣ワ細");
        Object.entries(plotElements).slice(0, 2).forEach(([type, elements]) => {
            promptParts.push(`  - ${type}锛?{(elements || []).slice(0, 2).join("銆?)}`);
        });
        if (analysis.repetitionRisks.length) {
            promptParts.push("銆愷煍?閲嶅椋庨櫓鎻愰啋銆?);
            analysis.repetitionRisks.slice(0, 3).forEach((risk) => {
                promptParts.push(`  - ${risk.message}`);
            });
        }

        return promptParts.filter(Boolean).join("\n");
    }

    buildSynopsisClicheWarning(project, volumeNumber) {
        const analysis = this.analyzeSynopsisInnovation(project, volumeNumber, "");
        const warnings = analysis.detectedCliches.slice(0, 3);
        if (!warnings.length) {
            return "";
        }

        return [
            "銆愨殸锔?宸叉娴嬪埌鐨勫璺鍛娿€?,
            ...warnings.map((item) => `鈥?${item.category}锛?{item.pattern}${item.suggestion?.[0] ? `\n  寤鸿锛?{item.suggestion[0]}` : ""}`)
        ].join("\n");
    }

    buildSynopsisVolumeBoundaryGuard(project, volumeNumber) {
        const volumes = project?.outline?.volumes || [];
        if (!volumes.length) {
            return "";
        }

        const currentVolume = volumes[volumeNumber - 1];
        const nextVolume = volumes[volumeNumber];
        const lines = [
            "銆愬綋鍓嶅嵎杈圭晫瑙勫垯銆?,
            `褰撳墠鍙厑璁哥紪鍐欑 ${volumeNumber} 鍗风殑缁嗙翰锛?{currentVolume?.title || ""}`,
            "鏈嵎瑕佸畬鎴愭湰鍗疯嚜宸辩殑鎺ㄨ繘銆侀珮娼拰鏀舵潫锛屼笉鑳芥妸鍚庣画鍗锋牳蹇冨墽鎯呮彁鍓嶅啓杩涙潵銆?
        ];

        if (nextVolume?.title || nextVolume?.summary) {
            lines.push(`涓嬩竴鍗峰瓨鍦細${nextVolume.title || `绗?{volumeNumber + 1}鍗穈}銆傚綋鍓嶅嵎缁撳熬鍙互鐣欓挬瀛愶紝浣嗕笉鑳界洿鎺ュ啓鎴愪笅涓€鍗峰紑绡囥€俙);
        }

        return lines.join("\n");
    }

    buildPreviousVolumeEnding(project, currentVolumeNumber) {
        if (!project?.outline?.volumes?.length || currentVolumeNumber <= 1) {
            return "";
        }
        const previousVolume = project.outline.volumes[currentVolumeNumber - 2];
        const synopsis = previousVolume?.chapterSynopsis || previousVolume?.chapter_synopsis || "";
        if (!synopsis) {
            return "";
        }
        return synopsis
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(-3)
            .join("\n");
    }

    buildAllChapterSynopsisContext(project, upToVolumeNumber) {
        if (!project?.outline?.volumes?.length) {
            return "";
        }
        return project.outline.volumes
            .filter((_, index) => index + 1 <= upToVolumeNumber)
            .map((volume, index) => {
                const synopsis = this.normalizeSynopsisReferenceText(
                    project,
                    volume.chapterSynopsis || volume.chapter_synopsis || ""
                );
                return synopsis ? `銆愮${index + 1}鍗风粏绾层€慭n${this.limitContext(synopsis, 2400)}` : "";
            })
            .filter(Boolean)
            .join("\n\n");
    }

    extractCurrentVolumeOutlineContext(project, volumeNumber) {
        const fullOutline = String(project?.outline?.detailed_outline || "").trim();
        const volumes = project?.outline?.volumes || [];
        if (!fullOutline || !volumes.length) {
            return { currentOutline: fullOutline, adjacentSummary: "" };
        }

        const volumeTitles = volumes.map((volume, index) => String(volume?.title || `绗?{index + 1}鍗穈).trim()).filter(Boolean);
        const patterns = [];
        for (let i = 0; i < volumes.length + 3; i += 1) {
            patterns.push(`绗?{i + 1}鍗穈);
        }
        volumeTitles.forEach((title) => {
            if (title.length >= 2) {
                patterns.push(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
            }
        });

        const splitPattern = new RegExp(`(?:^|\\n)(?:#{1,3}\\s*|銆恷={3,}\\s*)?(${patterns.join("|")})(?:銆憒锛殀:|\\s|={3,})`, "g");
        const sections = {};
        let currentKey = "__intro__";
        sections[currentKey] = "";

        let lastIndex = 0;
        let match;
        while ((match = splitPattern.exec(fullOutline)) !== null) {
            const before = fullOutline.slice(lastIndex, match.index);
            sections[currentKey] = (sections[currentKey] || "") + before;

            const marker = match[1];
            let matchedIndex = volumeTitles.findIndex((title) => title && marker.includes(title));
            if (matchedIndex < 0) {
                const generic = marker.match(/绗?\d+)鍗?);
                if (generic) {
                    matchedIndex = Number(generic[1]) - 1;
                }
            }

            currentKey = matchedIndex >= 0 ? `vol_${matchedIndex}` : currentKey;
            sections[currentKey] = (sections[currentKey] || "") + match[0];
            lastIndex = splitPattern.lastIndex;
        }
        sections[currentKey] = (sections[currentKey] || "") + fullOutline.slice(lastIndex);

        const targetKey = `vol_${Math.max(0, volumeNumber - 1)}`;
        let currentOutline = String(sections[targetKey] || "").trim();

        if (!currentOutline) {
            const fallbackTitle = volumeTitles[volumeNumber - 1] || `绗?{volumeNumber}鍗穈;
            const startPos = fullOutline.indexOf(fallbackTitle);
            if (startPos >= 0) {
                let endPos = fullOutline.length;
                const nextTitle = volumeTitles[volumeNumber] || `绗?{volumeNumber + 1}鍗穈;
                const nextPos = fullOutline.indexOf(nextTitle, startPos + fallbackTitle.length);
                if (nextPos > startPos) {
                    endPos = nextPos;
                }
                currentOutline = fullOutline.slice(startPos, endPos).trim();
            } else {
                currentOutline = fullOutline;
            }
        }

        const adjacent = [];
        const previousSection = String(sections[`vol_${volumeNumber - 2}`] || "").trim();
        if (previousSection) {
            adjacent.push(`涓婁竴鍗锋湯灏炬憳瑕侊細${Utils.summarizeText(previousSection.slice(-240), 240)}`);
        }
        const nextSection = String(sections[`vol_${volumeNumber}`] || "").trim();
        if (nextSection) {
            adjacent.push(`涓嬩竴鍗锋柟鍚戞彁绀猴紙浠呬緵杈圭晫鍙傝€冿紝涓ョ鎻愬墠鍐欏叆锛夛細${Utils.summarizeText(nextSection.slice(0, 120), 120)}`);
        }

        return {
            currentOutline,
            adjacentSummary: adjacent.join("\n")
        };
    }

    buildExistingOutlineEventsContext(project, volumeNumber, startChapter, existingChapters = []) {
        const events = [];
        const pushEvent = (chapter) => {
            const number = Number(chapter.number || chapter.chapter_number || 0);
            const keyEvent = String(chapter.key_event || chapter.keyEvent || "").trim();
            const summary = String(chapter.summary || "").trim();
            const title = String(chapter.title || "").trim();
            const text = keyEvent || Utils.summarizeText(summary, 120) || title;
            if (text) {
                events.push(`绗?{number || "?"}绔狅細${text}`);
            }
        };

        if (Array.isArray(existingChapters) && existingChapters.length) {
            existingChapters.forEach(pushEvent);
        } else {
            (project?.outline?.volumes || []).forEach((volume, index) => {
                const currentVolume = index + 1;
                (volume.chapters || []).forEach((chapter) => {
                    const number = Number(chapter.number || chapter.chapter_number || 0);
                    if (currentVolume < volumeNumber || (currentVolume === volumeNumber && number < startChapter)) {
                        pushEvent(chapter);
                    }
                });
            });
        }

        const uniqueEvents = Array.from(new Set(events.map((item) => item.trim()).filter(Boolean))).slice(-30);
        if (!uniqueEvents.length) {
            return "";
        }

        return [
            "銆愬凡鏈夊墽鎯呬簨浠讹紙涓ョ閲嶅锛夈€?,
            "浠ヤ笅浜嬩欢宸插湪宸叉湁绔犺妭涓彂鐢熻繃锛屾柊鐢熸垚绔犺妭涓笉寰楀嚭鐜扮浉鍚屾垨楂樺害鐩镐技鐨勬儏鑺傦細",
            ...uniqueEvents.map((item, index) => `${index + 1}. ${item}`)
        ].join("\n");
    }

    buildOutlineFrontContext(project, volumeNumber, startChapter, existingChapters = []) {
        const parts = [];
        const previousChapters = [];

        if (Array.isArray(existingChapters) && existingChapters.length) {
            previousChapters.push(...existingChapters);
        } else {
            (project.outline?.volumes || []).forEach((volume, index) => {
                const currentVolumeNumber = index + 1;
                (volume.chapters || []).forEach((chapter) => {
                    const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
                    if (currentVolumeNumber < volumeNumber || (currentVolumeNumber === volumeNumber && chapterNumber < startChapter)) {
                        previousChapters.push(chapter);
                    }
                });
            });
        }

        if (previousChapters.length) {
            const briefLines = previousChapters.map((chapter) => {
                const title = chapter.title || `绗?{chapter.number || chapter.chapter_number || "?"}绔燻;
                const keyEvent = chapter.key_event || chapter.keyEvent || "";
                const summary = chapter.summary || "";
                const brief = keyEvent || Utils.summarizeText(summary, 160);
                return `[${title}] ${brief}`;
            });
            parts.push(`銆愬墠鏂囧叏閮ㄥぇ绾叉憳瑕侊紙鍏?{previousChapters.length}绔狅紝鍘嬬缉鐗堬紝鐢ㄤ簬鐞嗚В瀹屾暣鍓ф儏鑴夌粶锛夈€慭n${briefLines.join("\n")}`);

            const recentFull = previousChapters.slice(-10).map((chapter) => {
                const title = chapter.title || `绗?{chapter.number || chapter.chapter_number || "?"}绔燻;
                return `銆?{title}銆慭n${Utils.summarizeText(chapter.summary || chapter.key_event || "", 600)}`;
            });
            if (recentFull.length) {
                parts.push(`銆愬墠鏂囨渶杩?0绔犲畬鏁村ぇ绾诧紙缁啓蹇呴』绱ф帴鏈€鍚庝竴绔犵殑缁撳熬锛夈€慭n${recentFull.join("\n\n")}`);
            }
        }

        const previousSynopsisContext = this.buildPreviousChapterSynopsisContext(project, volumeNumber);
        if (previousSynopsisContext) {
            parts.push(`銆愬墠闈㈢粏绾叉眹鎬汇€慭n${previousSynopsisContext}`);
        }

        return parts.join("\n---\n");
    }

    buildPlotUnitContext(startChapter, endChapter) {
        const firstUnit = Math.floor((Math.max(1, startChapter) - 1) / 8) + 1;
        const lastUnit = Math.floor((Math.max(1, endChapter) - 1) / 8) + 1;
        const phaseFor = (chapter) => {
            const pos = ((chapter - 1) % 8) + 1;
            if (pos <= 2) return "寮€绔?;
            if (pos <= 5) return "鍙戝睍";
            if (pos <= 7) return "楂樻疆";
            return "缁撳熬";
        };

        const lines = [
            `鐢熸垚绔犺妭鑼冨洿锛氱 ${startChapter}-${endChapter} 绔燻,
            `娑夊強鍓ф儏鍗曞厓锛氱 ${firstUnit}${lastUnit > firstUnit ? ` - ${lastUnit}` : ""} 鍗曞厓`,
            "姣?8 绔犵粍鎴愪竴涓畬鏁村皬鍓ф儏鍗曞厓锛?-2 绔犲紑绔紝3-5 绔犲彂灞曪紝6-7 绔犻珮娼紝绗?8 绔犳敹鏉熴€?,
            `璧峰绔犺妭鎵€澶勯樁娈碉細${phaseFor(startChapter)}`,
            `缁撴潫绔犺妭鎵€澶勯樁娈碉細${phaseFor(endChapter)}`
        ];

        if (phaseFor(startChapter) === "寮€绔? && firstUnit > 1) {
            lines.push(`褰撳墠鎵规寮€澶磋鎵挎帴绗?${firstUnit - 1} 鍗曞厓缁撳熬鐣欎笅鐨勪紡绗斻€俙);
        }
        if (phaseFor(endChapter) === "缁撳熬") {
            lines.push(`褰撳墠鎵规缁撳熬瑕佷负绗?${lastUnit + 1} 鍗曞厓鍩嬩笅鎮康閽╁瓙銆俙);
        }

        lines.push("next_chapter_setup 瀛楁蹇呴』涓ユ牸閬靛畧锛氬彧鍐欓摵鍨紝涓嶅啓缁撴灉銆?);
        return lines.join("\n");
    }

    getPlotUnitPhaseBlueprint() {
        return {
            寮€绔? {
                coreTasks: ["寮曞叆褰撳墠鍗曞厓鍐茬獊", "鎵挎帴涓婁竴鍗曞厓浣欐尝", "寤虹珛鏈崟鍏冪洰鏍?],
                elements: {
                    寮曠垎鐐? ["鏂扮殑浠诲姟", "鏂扮殑鏁屾剰", "鏂扮殑璇細", "鏂扮殑绾跨储"],
                    鎵挎帴鐐? ["涓婄珷鐣欎笅鐨勫紓鏍?, "鏈В閲婄殑鍔ㄤ綔", "鏈厬鐜扮殑鎵胯", "浠嶅湪鍙戦叺鐨勫悗鏋?]
                },
                guidance: "寮€绔樁娈佃鍏堟妸褰撳墠8绔犲崟鍏冪殑鏍稿績鐭涚浘绔嬩綇锛屽悓鏃舵槑纭壙鎺ヤ笂涓€娈靛墽鎯咃紝涓嶈涓€涓婃潵灏辨妸楂樻疆鍐欏畬銆?
            },
            鍙戝睍: {
                coreTasks: ["鎺ㄨ繘涓诲啿绐?, "鎶珮浠ｄ环", "璁╀汉鐗╁叧绯绘垨淇℃伅鍙戠敓鍙樺寲"],
                elements: {
                    鍗囩骇鐐? ["璇垽鍗囩骇", "绾跨储鍙嶈浆", "灞€鍔垮帇杩?, "璧勬簮鍙楅檺"],
                    浜虹墿鍏崇郴: ["鍚堜綔鐢熻鐥?, "鏁屾剰鍔犳繁", "淇′换璇曟帰", "鍒╃泭浜ゆ崲"]
                },
                guidance: "鍙戝睍闃舵瑕佹寔缁帹杩涳紝涓嶈鍘熷湴韪忔銆傛瘡绔犻兘瑕佹湁鏂颁俊鎭€佹柊鍙樺寲鎴栨柊鐨勪唬浠枫€?
            },
            楂樻疆: {
                coreTasks: ["闆嗕腑鐖嗗彂涓昏鐭涚浘", "閫艰鑹插仛鍏抽敭閫夋嫨", "璁╁墠鏂囬摵鍨骇鐢熷洖鍝?],
                elements: {
                    鐖嗗彂鐐? ["姝ｉ潰浜ら攱", "鐪熺浉鎾曞紑", "璁″垝澶辨帶", "鎯呯华澶卞畧"],
                    浠ｄ环: ["澶卞幓绛圭爜", "鍏崇郴鐮磋", "鏆撮湶绉樺瘑", "灞€闈㈠弽鍣?]
                },
                guidance: "楂樻疆闃舵瑕佹湁寮虹儓鍐茬獊鍜屾槑纭唬浠凤紝涓嶈兘鍙槸鍠婂彛鍙凤紝蹇呴』鐪熺殑鏀瑰彉灞€鍔裤€?
            },
            缁撳熬: {
                coreTasks: ["瀹屾垚鏈崟鍏冩敹鏉?, "鍥炴敹鑷冲皯涓€椤归摵鍨?, "涓轰笅涓€鍗曞厓鐣欎笅閽╁瓙"],
                elements: {
                    鏀舵潫鏂瑰紡: ["闃舵鎬ц儨璐?, "灞€闈㈡殏绋?, "璇細鍔犳繁", "鏂扮殑浠诲姟钀戒笅"],
                    鎮康閽╁瓙: ["鏇村ぇ鐨勬晫浜?, "鏂版毚闇茬殑鐪熺浉", "绐佸鍏舵潵鐨勬秷鎭?, "灏氭湭瑙ｉ噴鐨勫紓甯?]
                },
                guidance: "缁撳熬闃舵瑕佹湁闃舵鎬х粨鏋滐紝浣嗕笉鑳藉钩骞宠惤鍦般€傚繀椤荤暀鍑烘帹鍔ㄤ笅涓€鍗曞厓鐨勬偓蹇甸挬瀛愩€?
            }
        };
    }

    getPlotUnitManager(project) {
        const manager = project?.outline_plot_unit_manager;
        if (!manager || typeof manager !== "object") {
            return { plot_units: {}, next_id: 1, unit_history: [] };
        }
        return {
            plot_units: manager.plot_units && typeof manager.plot_units === "object" ? manager.plot_units : {},
            next_id: Number(manager.next_id || 1),
            unit_history: Array.isArray(manager.unit_history) ? manager.unit_history : []
        };
    }

    getPlotUnitPhase(chapterNumber) {
        const position = ((Math.max(1, Number(chapterNumber || 1)) - 1) % 8) + 1;
        if (position <= 2) {
            return { phase: "寮€绔?, position };
        }
        if (position <= 5) {
            return { phase: "鍙戝睍", position };
        }
        if (position <= 7) {
            return { phase: "楂樻疆", position };
        }
        return { phase: "缁撳熬", position };
    }

    getPlotUnitForChapter(project, volumeNumber, chapterNumber) {
        const unitNumber = Math.floor((Math.max(1, Number(chapterNumber || 1)) - 1) / 8) + 1;
        const unitId = `pu_v${volumeNumber}_u${unitNumber}`;
        const manager = this.getPlotUnitManager(project);
        return {
            unitId,
            unitNumber,
            unit: manager.plot_units[unitId] || null,
            manager
        };
    }

    buildPlotUnitSuggestionEntries(project, volumeNumber, currentChapter) {
        const { unitNumber, unit, manager } = this.getPlotUnitForChapter(project, volumeNumber, currentChapter);
        const phaseInfo = this.getPlotUnitPhaseBlueprint();
        const phase = this.getPlotUnitPhase(currentChapter);
        const suggestions = [];

        if (!unit) {
            suggestions.push({
                priority: "楂?,
                message: `寤鸿鍒涘缓绗?${unitNumber} 涓墽鎯呭崟鍏冿紝鏄庣‘褰撳墠8绔犵殑鏍稿績鍐茬獊鍜岄樁娈电洰鏍囥€俙,
                coreTasks: ["纭畾鏈崟鍏冧富鍐茬獊", "瀹夋帓涓庝笂涓€鍗曞厓鐨勬壙鎺?, "鎻愭棭鍩嬩笅缁撳熬閽╁瓙"],
                elements: ["鏂颁换鍔?, "鏂版晫鎰?, "鏂扮瀵?],
                guidance: "濡傛灉杩欐槸鏂板崟鍏冨紑绔紝鍏堢珛鐩爣鍜岀煕鐩撅紝涓嶈涓€涓婃潵鎶婄粨鏋滆绌裤€?
            });
            return suggestions;
        }

        const currentPhaseInfo = phaseInfo[phase.phase] || {};
        const elementHints = Object.values(currentPhaseInfo.elements || {})
            .slice(0, 2)
            .map((list) => Array.isArray(list) ? list.slice(0, 2).join(" / ") : "")
            .filter(Boolean);

        suggestions.push({
            priority: "楂?,
            message: `绗?${unit.unit_number} 涓崟鍏冨綋鍓嶅浜?{phase.phase}闃舵锛堢 ${phase.position} 绔狅級銆俙,
            coreTasks: currentPhaseInfo.coreTasks || [],
            elements: elementHints,
            guidance: currentPhaseInfo.guidance || ""
        });

        if (phase.phase === "寮€绔? && unit.unit_number > 1) {
            const prevUnit = manager.plot_units[`pu_v${volumeNumber}_u${unit.unit_number - 1}`];
            if (prevUnit) {
                suggestions.push({
                    priority: "鏋侀珮",
                    message: `蹇呴』鎵挎帴绗?${unit.unit_number - 1} 涓崟鍏冪粨灏剧暀涓嬬殑鎮康銆俙,
                    coreTasks: prevUnit.connection_to_next ? [prevUnit.connection_to_next] : [],
                    elements: prevUnit.suspense_hook ? [prevUnit.suspense_hook] : [],
                    guidance: "寮€绔樁娈靛厛鎺ヤ笂鍓嶉潰鐣欎笅鐨勯棶棰橈紝鍐嶅睍寮€褰撳墠鍗曞厓鐨勪富鍐茬獊銆?
                });
            }
        }

        if (phase.phase === "缁撳熬") {
            suggestions.push({
                priority: "鏋侀珮",
                message: "鏈珷娈靛鏋滄敹鍦ㄥ崟鍏冪粨灏撅紝蹇呴』褰㈡垚闃舵鎬х粨鏋滐紝骞跺煁涓嬩笅涓€鍗曞厓閽╁瓙銆?,
                coreTasks: ["鍥炴敹鑷冲皯涓€椤逛紡绗?, "鐣欎笅鏂版偓蹇?, "next_chapter_setup 鍙啓鍥犱笉鍐欐灉"],
                elements: (phaseInfo.缁撳熬?.elements?.鎮康閽╁瓙 || []).slice(0, 3),
                guidance: phaseInfo.缁撳熬?.guidance || ""
            });
        }

        return suggestions;
    }

    buildPlotUnitSuggestionText(project, volumeNumber, currentChapter) {
        const suggestions = this.buildPlotUnitSuggestionEntries(project, volumeNumber, currentChapter);
        if (!suggestions.length) {
            return "";
        }

        const lines = ["銆愬墽鎯呭崟鍏冨彂灞曞缓璁€?];
        suggestions.slice(0, 3).forEach((item) => {
            lines.push(`鈥?[${item.priority}] ${item.message}`);
            if (item.coreTasks?.length) {
                lines.push(`  鏍稿績浠诲姟锛?{item.coreTasks.slice(0, 2).join("銆?)}`);
            }
            if (item.elements?.length) {
                lines.push(`  鍏冪礌鍚彂锛?{item.elements.join("銆?)}`);
            }
            if (item.guidance) {
                lines.push(`  鎻愮ず锛?{item.guidance}`);
            }
        });
        return lines.join("\n");
    }

    buildPlotUnitTrackerReport(project, volumeNumber, currentChapter) {
        const manager = this.getPlotUnitManager(project);
        const plotUnits = Object.values(manager.plot_units || {});
        if (!plotUnits.length) {
            return "";
        }

        const activeUnits = plotUnits
            .filter((unit) => Number(unit.volume || 0) === Number(volumeNumber))
            .sort((left, right) => {
                if (Number(left.unit_number || 0) !== Number(right.unit_number || 0)) {
                    return Number(right.unit_number || 0) - Number(left.unit_number || 0);
                }
                return Number(right.current_position || 0) - Number(left.current_position || 0);
            })
            .slice(0, 3);

        const lines = ["", "鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲", "銆愬墽鎯呭崟鍏冭拷韪姤鍛娿€?, "鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲"];
        if (activeUnits.length) {
            lines.push("銆愬綋鍓嶆椿璺冨崟鍏冦€?);
            activeUnits.forEach((unit) => {
                lines.push(`鈥?绗?{unit.unit_number}鍗曞厓锛堢${unit.start_chapter}-${unit.end_chapter}绔狅級`);
                lines.push(`  闃舵锛?{unit.current_phase || "鏈煡"} | 鏍稿績鍐茬獊锛?{unit.core_conflict || "寰呰ˉ鍏?}`);
                if (unit.suspense_hook) {
                    lines.push(`  鎮康閽╁瓙锛?{unit.suspense_hook}`);
                }
                if (unit.connection_to_previous) {
                    lines.push(`  瀵逛笂涓€鍗曞厓鎵挎帴锛?{unit.connection_to_previous}`);
                }
                if (unit.connection_to_next) {
                    lines.push(`  瀵逛笅涓€鍗曞厓閾哄灚锛?{unit.connection_to_next}`);
                }
            });
        }

        if (currentChapter && plotUnits.length > 1) {
            lines.push("", "銆愬崟鍏冭鎺ユ彁閱掋€?);
            lines.push("鈥?鍓嶄竴鍗曞厓鐨勭粨灏撅紝瑕佽嚜鐒跺彉鎴愬悗涓€鍗曞厓鐨勫紑绔€?);
            lines.push("鈥?鍗曞厓缁撳熬蹇呴』鐣欎笅閽╁瓙锛屽崟鍏冨紑绔繀椤绘壙鎺ユ棫闂銆?);
            lines.push("鈥?涓嶈鎶婂悗缁崟鍏冪殑澶ч珮娼彁鍓嶅帇缂╁埌褰撳墠鎵规銆?);
        }

        lines.push("鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲");
        return lines.join("\n");
    }

    extractRoleCandidatesFromChapters(project, chapters, volumeNumber) {
        const existingAllNames = new Set();
        (project.outline.characters || []).forEach((character) => {
            const primaryName = String(character.name || "").trim();
            const substantiveFieldCount = [
                character.personality,
                character.appearance,
                character.abilities,
                character.goals,
                character.relationships
            ].filter((value) => String(value || "").trim()).length;
            const background = String(character.background || "").trim();
            const hasGeneratedBackground = background
                && !background.includes("鎻愬強瑙掕壊")
                && !background.includes("鍚庣画鍙ˉ鍏呰儗鏅?);
            const shouldExclude = !this.isGenericCharacterCandidateName(primaryName)
                && (substantiveFieldCount >= 2 || hasGeneratedBackground);
            if (!shouldExclude) {
                return;
            }
            if (primaryName) {
                existingAllNames.add(primaryName);
            }
            Utils.ensureArrayFromText(character.aliases || character["鍒悕"] || "")
                .map((alias) => String(alias || "").trim())
                .filter(Boolean)
                .forEach((alias) => existingAllNames.add(alias));
        });

        const roleMap = {};

        const addRole = (name, description) => {
            const cleanLabel = this.normalizeOutlineCharacterLabel(name);
            if (!cleanLabel || cleanLabel.length < 2) {
                return;
            }
            if (!this.isPlausibleOutlineCharacterLabel(cleanLabel)) {
                return;
            }
            const resolved = this.resolveOutlineCandidateName(project, cleanLabel, description);
            const cleanName = this.normalizeOutlineCharacterLabel(resolved.name);
            if (!cleanName || cleanName.length < 2) {
                return;
            }
            if (!resolved.needsNaming && !this.isPlausibleOutlineCharacterLabel(cleanName)) {
                return;
            }
            if (!resolved.needsNaming && existingAllNames.has(cleanName)) {
                return;
            }

            if (roleMap[cleanName]) {
                roleMap[cleanName].description = [roleMap[cleanName].description, String(description || "").trim()].filter(Boolean).join("锛?);
                roleMap[cleanName].needsNaming = roleMap[cleanName].needsNaming && resolved.needsNaming;
                roleMap[cleanName].aliases = Array.from(new Set([...(roleMap[cleanName].aliases || []), ...(resolved.aliases || [])])).filter(Boolean);
                return;
            }

            roleMap[cleanName] = {
                description: String(description || "").trim(),
                needsNaming: Boolean(resolved.needsNaming),
                aliases: Array.from(new Set(resolved.aliases || [])).filter(Boolean)
            };
        };

        (chapters || []).forEach((chapter) => {
            const summary = String(chapter.summary || "");
            const lines = summary.split(/\r?\n/);
            let inCharSection = false;

            lines.forEach((rawLine) => {
                const line = String(rawLine || "").trim();
                if (!line) {
                    return;
                }
                if (line.includes("銆愬嚭鍦轰汉鐗┿€?)) {
                    inCharSection = true;
                    return;
                }
                if (inCharSection && line.startsWith("銆?)) {
                    inCharSection = false;
                    return;
                }
                if (!inCharSection || (!line.startsWith("-") && !line.startsWith("鈥?))) {
                    return;
                }

                const content = line.slice(1).trim();
                if (!content) {
                    return;
                }

                let label = content;
                let desc = "";
                if (content.includes("锛?)) {
                    const parts = content.split("锛?, 2);
                    label = parts[0].trim();
                    desc = parts[1].replace(/锛?g, "").trim();
                } else if (content.includes("(")) {
                    const parts = content.split("(", 2);
                    label = parts[0].trim();
                    desc = parts[1].replace(/\)/g, "").trim();
                } else if (content.includes("锛?)) {
                    const parts = content.split("锛?, 2);
                    label = parts[0].trim();
                    desc = parts[1].trim();
                } else if (content.includes(":")) {
                    const parts = content.split(":", 2);
                    label = parts[0].trim();
                    desc = parts[1].trim();
                }

                addRole(label, desc || `绗?{chapter.number}绔犲嚭鍦轰汉鐗ー);
            });
        });

        return roleMap;
    }

    normalizeOutlineCharacterLabel(value) {
        let normalized = String(value || "")
            .replace(/^[鈥-]\s*/, "")
            .replace(/\s+/g, " ")
            .replace(/^(濂圭殑|浠栫殑|鎴戠殑|浣犵殑|鍏秥杩欎釜|閭ｄ釜|杩欎綅|閭ｄ綅|杩欏悕|閭ｅ悕|璇浠東濂?/, "")
            .split(/[锛?锛?]/)[0]
            .trim();

        normalized = normalized.replace(/^(缁檤瀵箌鍚憒璺焲鍜寍鎶妡琚?(?=[\u4e00-\u9fa5]{2,8}$)/u, "");
        normalized = normalized.replace(/^(?:\u5979\u7684|\u4ed6\u7684|\u6211\u7684|\u4f60\u7684|\u8fd9\u4e2a|\u90a3\u4e2a|\u8fd9\u4f4d|\u90a3\u4f4d|\u8fd9\u540d|\u90a3\u540d)/u, "");
        return normalized.trim();
    }

    sanitizeOutlineCharacterArray(value) {
        const seen = new Set();
        return Utils.ensureArrayFromText(value)
            .map((item) => this.normalizeOutlineCharacterLabel(item))
            .filter((item) => this.isPlausibleOutlineCharacterLabel(item))
            .filter((item) => {
                if (seen.has(item)) {
                    return false;
                }
                seen.add(item);
                return true;
            });
    }

    matchesGenericRolePattern(name) {
        const cleanName = String(name || "").trim();
        if (!cleanName) {
            return false;
        }

        const rolePattern = "(?:榫欑|绁炶儙|瀹″垽瀹榺楠戝＋|鍦ｉ獞澹珅涓绘暀|绁徃|渚嶅コ|涓瑹|濠㈠コ|鎶ゅ崼|涓嬪睘|鎵嬩笅|甯堝厔|甯堝|甯堝紵|甯堝|甯堢埗|甯堟瘝|鐖朵翰|姣嶄翰|浜插|鍚庡|鍏绘瘝|鍏荤埗|缁ф瘝|缁х埗|鍝ュ摜|濮愬|濡瑰|寮熷紵|缁у|缁у|缁у厔|缁у紵|鑰佸﹩|鑰佸叕|鍓嶅か|鍓嶅|涓堝か|濡诲瓙|鏈澶珅鏈濡粅濠嗗﹩|鍏叕|宀虫瘝|宀崇埗|瀚傚瓙|濮愬か|濡瑰か|灏忓Ж|濮ㄥ|濠跺瓙|濮戝|鑸呭|鑸呰垍|濮戠埗|鍚岄棬|鍚屼即|閭诲眳|瀹ゅ弸|鍚屼簨|涓婂徃|鑰佹澘|鑰佸笀|瀛︾敓|鏌愪汉|鏌愬姪鐞唡鏌愬悓浜媩鏌愯€佸笀|鏌愬尰鐢焲鏌愭姢澹珅鏌愯瀹榺鏌愮涔鍔╃悊|绉樹功|鍖荤敓|鎶ゅ＋|璀﹀畼|璺汉|淇濋晼|鍙告満|绠″|鏍″尰|鍚屽|瀛﹂暱|瀛﹀|鍓嶅彴|搴楀憳|缁忕悊|鎬荤洃|闄㈤暱|鏁欐巿|瀵煎笀|鐮旂┒鍛榺椤鹃棶|瀛﹀緬|宸ョ▼甯坾鎶€宸缁勯暱|鍘傞暱|鍓巶闀縷鎶€鏈憳|缁勫憳|绉戝憳|妫€鏌ョ粍闀縷妫€鏌ョ粍缁勯暱)";
        const suffixIndexPattern = "[A-Za-z鐢蹭箼涓欎竵鎴婂繁搴氳緵澹櫢涓€浜屼笁鍥涗簲鍏竷鍏節鍗?-9]*";
        if (new RegExp(`^[\\u4e00-\\u9fa5]{0,4}${rolePattern}${suffixIndexPattern}$`).test(cleanName)) {
            return true;
        }
        return /^(?:[\u4e00-\u9fa5]{1,6}鐨??(?:浜插|鍚庡|鍏绘瘝|鍏荤埗|缁ф瘝|缁х埗|缁у|缁у|缁у厔|缁у紵|姣嶄翰|鐖朵翰|濮愬|鍝ュ摜|濡瑰|寮熷紵|瀚傚瓙|濮愬か|鍓嶅か|鍓嶅|鏈澶珅鏈濡?$/.test(cleanName);
    }

    isLikelyActionLikeCharacterCandidate(name) {
        const cleanName = String(name || "").trim();
        if (!cleanName) {
            return true;
        }

        if (/^(鏉ュ埌|璧板埌|璧板悜|鍥炲埌|鍓嶅線|杩涘叆|閫€鍑簗瀹夋姎|鎼€鎵秥鎵朵綇|鎶变綇|鎺ㄥ紑|鎷変綇|鎶ょ潃|鎶や綇|闄潃|璺熺潃|鐪嬪悜|鐩潃|鍚|璇村嚭|闂亾|浣庡ご|鎶ご|浼告墜|鎶墜|杞韩|璧疯韩|鍧愬湪|绔欏湪|绔欏埌|璺戝埌|鍐插悜|甯︾潃|甯﹀洖|鏀句笅|鎷胯捣|閫掔粰|閫佸埌|鎷栫潃|鎶辩潃|鎵剁潃)/.test(cleanName)) {
            return true;
        }

        if (/^(鎶鏁憒杩絴鎵緗閫亅闄獆鎵秥鎷墊鎺▅鎶眧鑳寍鎷東甯鎷杩借刀|瀹夋姎)[\u4e00-\u9fa5]{2,4}$/.test(cleanName) && !this.matchesGenericRolePattern(cleanName)) {
            return true;
        }

        if (/(鍥句功棣唡鏁欏|鍔炲叕瀹鍏徃|鍖婚櫌|瀹胯垗|闂ㄥ彛|妤间笅|妤间笂|浼氳瀹娲楁墜闂磡鐥呮埧|澶у巺|杞﹂噷|璺竟|琛椾笂|椁愬巺|涔︽埧|鍘ㄦ埧)$/.test(cleanName)) {
            return true;
        }

        if (/[锛屻€傦紒锛熴€?.!?]/.test(cleanName)) {
            return true;
        }

        if ((cleanName.includes("鐨?) || cleanName.includes("浜?) || cleanName.includes("鐫€") || cleanName.includes("鍦?)) && !this.matchesGenericRolePattern(cleanName)) {
            return true;
        }

        return false;
    }

    isLikelyChinesePersonName(name) {
        const cleanName = String(name || "").trim();
        if (!/^[\u4e00-\u9fa5]{2,4}$/.test(cleanName)) {
            return false;
        }

        const compoundSurnames = [
            "娆ч槼", "涓婂畼", "鍙搁┈", "鎱曞", "璇歌憶", "鍗楀", "澶忎警", "浠ょ嫄", "鐨囩敨", "杞╄緯",
            "瀹囨枃", "闀垮瓩", "鍙稿緬", "鍙哥┖", "瑗块棬", "涓滄柟", "鐙", "鍖楀啣", "鍏瓩", "灏夎繜",
            "婢瑰彴", "鎷撹穻", "鐧鹃噷", "閽熺", "涓滈儹", "鍛煎欢"
        ];
        if (compoundSurnames.some((surname) => cleanName.startsWith(surname) && cleanName.length >= surname.length + 1)) {
            return true;
        }

        const commonSurnames = new Set("璧甸挶瀛欐潕鍛ㄥ惔閮戠帇鍐檲瑜氬崼钂嬫矆闊╂潹鏈辩Е灏よ浣曞悤鏂藉紶瀛旀浌涓ュ崕閲戦瓘闄跺鎴氳阿閭瑰柣鏌忔按绐︾珷浜戣嫃娼樿憶濂氳寖褰儙椴侀煢鏄岄┈鑻楀嚖鑺辨柟淇炰换琚佹煶椴嶅彶鍞愯垂寤夊矐钖涢浄璐哄€堡婊曟缃楁瘯閮濋偓瀹夊父涔愪簬鏃跺倕鐨崬榻愬悍浼嶄綑鍏冨崪椤惧瓱骞抽粍鍜岀﹩钀у肮濮氶偟婀涙豹绁佹瘺绂圭媱绫宠礉鏄庤嚙璁′紡鎴愭埓璋堝畫鑼呭簽鐔婄邯鑸掑眻椤圭钁ｆ鏉滈槷钃濋椀甯楹诲己璐捐矾濞勫嵄姹熺棰滈儹姊呯洓鏋楀垇閽熷緪閭遍獑楂樺钄＄敯妯婅儭鍑岄湇铏炰竾鏀煰鏄濈鍗㈣帿缁忔埧瑁樼吉骞茶В搴斿畻涓佸璐查倱閮佸崟鏉椽鍖呭乏鐭冲磾鍚夐挳榫氱▼宓囬偄瑁撮檰鑽ｇ縼鑽€缇婃柤鎯犵攧鏇插皝鍌ㄩ澇鐒︾墽灞辫敗鐢版▕鑳￠湇鍙搁粠涔旇媿鍙岄椈鑾樺厷缈熻碍璐″姵閫勫К鐢虫壎鍫靛唹瀹伴儲闆嶇挬妗戞婵墰瀵块€氳竟鎵堢嚂鍐€閮忔郸灏氬啘娓╁埆搴勬檹鏌寸灴闃庡厖鎱曡繛鑼逛範瀹﹁壘楸煎鍚戝彜鏄撴厧鎴堝粬搴剧粓鏆ㄥ眳琛℃閮借€挎弧寮樺尅鍥芥枃瀵囧箍绂勯槞涓滄娈虫矁鍒╄敋瓒婂闅嗗笀宸╁帊鑱傛檨鍕炬晼铻嶅喎杈涢槡閭ｇ畝楗剁┖鏇炬矙涔滃吇闉犻』涓板发鍏宠挴鐩告煡鍚庤崋绾㈡父绔烘潈閫洊鐩婃鍏粔鐫ｅ渤甯呯紤浜㈠喌閮堟湁鐞村綊娴锋涓樺乏涓樹笢闂ㄥ崡闂ㄥ晢鐗熶綐浣熷ⅷ鍝堣隘绗勾鐖遍槼浣翠集璧忓崡鑽ｆ鏅?.split(""));
        if (commonSurnames.has(cleanName.charAt(0))) {
            return true;
        }

        if (/^[鑰佸皬闃縘[\u4e00-\u9fa5]{1,3}$/.test(cleanName)) {
            const rest = cleanName.slice(1);
            if (compoundSurnames.some((surname) => rest.startsWith(surname)) || commonSurnames.has(rest.charAt(0))) {
                return true;
            }
        }

        return false;
    }

    isLikelyOutlineRoleLabel(name) {
        const cleanName = String(name || "").trim();
        if (!/^[\u4e00-\u9fa5]{2,8}$/.test(cleanName)) {
            return false;
        }
        if (this.isLikelyActionLikeCharacterCandidate(cleanName)) {
            return false;
        }
        if (/绯荤粺|绌洪棿|闈㈡澘|浠诲姟|濂栧姳|鎻愮ず|闆疯揪|閫氱煡/.test(cleanName)) {
            return false;
        }
        if (/^(鐢峰疂|濂冲疂)$/.test(cleanName)) {
            return true;
        }
        return /(鐜嬬埛|鐜嬪|鍥藉笀|璐ㄥ瓙|澶尰浠澶尰|渚嶉儙|灏氫功|缁熼|棣栭|鎬荤|瀹椾护|瀹コ|瀣峰|鍒哄|鍏氱窘|鎶ゅ崼|鏆楀崼|渚嶅崼|渚嶄粠|鍐涘笀|鐭ュ簻|鍘夸护|鍏富|閮′富|涓栧瓙|鐨囧瓙|鐨囧コ|鐨囧瓩|澶瓙|澶コ|澶悗|鐨囧悗|鎺屾煖|浼欒|鍏堢敓|濮戝|鍏瓙|鐜媩浠瀹榺浣縷鍗珅灏唡甯厊甯坾鍖?$/.test(cleanName);
    }

    isPlausibleOutlineCharacterLabel(name) {
        const cleanName = this.normalizeOutlineCharacterLabel(name);
        if (!cleanName || cleanName.length < 2 || cleanName.length > 12) {
            return false;
        }

        if (this.matchesGenericRolePattern(cleanName) || this.isGenericCharacterCandidateName(cleanName)) {
            return true;
        }

        if (this.isLikelyActionLikeCharacterCandidate(cleanName)) {
            return false;
        }

        if (this.isLikelyOutlineRoleLabel(cleanName)) {
            return true;
        }

        if (this.isLikelyChinesePersonName(cleanName)) {
            return true;
        }

        if (/^[A-Za-z][A-Za-z\s\-']{1,24}$/.test(cleanName)) {
            return true;
        }

        if (/^[\u4e00-\u9fa5]{2,8}(鍏堢敓|灏忓|濂冲＋|鑰佸笀|鍖荤敓|鎶ゅ＋|涓讳换|鏁欐巿)$/.test(cleanName)) {
            return true;
        }

        return false;
    }
    extractOutlineCharacterEntries(summary) {
        const text = String(summary || "");
        if (!text.trim()) {
            return [];
        }

        const sectionMatch = text.match(/銆愬嚭鍦轰汉鐗┿€慭s*([\s\S]*?)(?=\n銆恷$)/);
        const section = sectionMatch?.[1] ? String(sectionMatch[1]).trim() : "";
        if (!section) {
            return [];
        }

        const entries = [];
        section.split(/\r?\n/).forEach((line) => {
            const rawLine = line.trim();
            if (!rawLine || (!rawLine.startsWith("-") && !rawLine.startsWith("鈥?))) {
                return;
            }

            const cleaned = rawLine.replace(/^[鈥?]\s*/, "");
            let label = cleaned;
            let description = "";

            if (cleaned.includes("锛?)) {
                const parts = cleaned.split("锛?, 2);
                label = parts[0].trim();
                description = String(parts[1] || "").replace(/锛?g, "").trim();
            } else if (cleaned.includes("(")) {
                const parts = cleaned.split("(", 2);
                label = parts[0].trim();
                description = String(parts[1] || "").replace(/\)/g, "").trim();
            } else if (cleaned.includes("锛?)) {
                const parts = cleaned.split("锛?, 2);
                label = parts[0].trim();
                description = String(parts[1] || "").trim();
            } else if (cleaned.includes(":")) {
                const parts = cleaned.split(":", 2);
                label = parts[0].trim();
                description = String(parts[1] || "").trim();
            }

            const name = this.normalizeOutlineCharacterLabel(label);
            if (!name || !this.isPlausibleOutlineCharacterLabel(name)) {
                return;
            }

            entries.push({ name, description });
        });

        return entries;
    }

    buildEstablishedRelationshipText(project, focusNames = []) {
        const lines = [];
        const seen = new Set();
        const focusSet = new Set((focusNames || []).map((item) => String(item || "").trim()).filter(Boolean));
        const pushLine = (line) => {
            const clean = String(line || "").trim();
            if (!clean || seen.has(clean)) {
                return;
            }
            seen.add(clean);
            lines.push(clean);
        };

        (project.outline?.characters || []).forEach((character) => {
            const name = String(character.name || "").trim();
            const relationships = String(character.relationships || character["浜虹墿鍏崇郴"] || "").trim();
            if (!name || !relationships) {
                return;
            }
            if (!focusSet.size || focusSet.has(name) || Array.from(focusSet).some((target) => relationships.includes(target))) {
                pushLine(`- ${name}锛?{Utils.summarizeText(relationships, 120)}`);
            }
        });

        const trackerRelationships = project.character_appearance_tracker?.relationships || {};
        Object.entries(trackerRelationships).forEach(([key, value]) => {
            const [left, right] = String(key || "").split("|").map((item) => item.trim()).filter(Boolean);
            if (!left || !right) {
                return;
            }
            if (focusSet.size && !focusSet.has(left) && !focusSet.has(right)) {
                return;
            }
            const relation = value?.鍏崇郴 || value?.relationship || value?.relations || "鐩稿叧";
            pushLine(`- ${left} <-> ${right}锛?{relation}`);
        });

        return lines.length ? lines.join("\n") : "鏆傛棤宸插缓绔嬪叧绯?;
    }

    getOutlineCharacterExcludedNames() {
        return new Set([
            "涓昏", "鐢蜂富", "濂充富", "鍙嶆淳", "璺汉", "浼椾汉", "灏戝勾", "灏戝コ", "鐢蜂汉", "濂充汉",
            "甯堝皧", "鎺岄棬", "闀胯€?, "寮熷瓙", "鍚岄棬", "鏁屼汉", "瀵规墜", "榛戝奖", "鏉ヤ汉", "鍖昏€?
        ]);
    }

    buildKnownCharacterAliasMap(project) {
        const aliasMap = {};
        const addAlias = (alias, realName) => {
            const cleanAlias = String(alias || "").trim();
            const cleanName = String(realName || "").trim();
            if (!cleanAlias || !cleanName || aliasMap[cleanAlias]) {
                return;
            }
            aliasMap[cleanAlias] = cleanName;
        };

        const synopsisData = this.restoreSynopsisMainCharacters(project) || {};
        Object.entries(synopsisData.vague_to_name_mapping || {}).forEach(([alias, realName]) => addAlias(alias, realName));
        Object.entries(synopsisData.main_characters || {}).forEach(([role, realName]) => {
            addAlias(role, realName);
            (this.getSynopsisRoleAliases()[role] || []).forEach((alias) => addAlias(alias, realName));
        });
        Object.entries(synopsisData.locked_character_names || {}).forEach(([name, info]) => {
            if (!this.isTrustedSynopsisConcreteName(project, name)) {
                return;
            }
            addAlias(name, name);
            this.sanitizeSynopsisNameAliases(
                project,
                name,
                [
                    ...this.buildSynopsisNameAliases(name),
                    ...Utils.ensureArrayFromText(info?.aliases || [])
                ]
            ).forEach((alias) => addAlias(alias, name));
        });
        (project.outline?.characters || []).forEach((character) => {
            const primaryName = String(character.name || "").trim();
            if (!primaryName) {
                return;
            }
            addAlias(primaryName, primaryName);
            Utils.ensureArrayFromText(character.aliases || character["鍒悕"] || "")
                .filter((alias) => String(alias || "").trim().length >= 2)
                .forEach((alias) => addAlias(alias, primaryName));
        });

        return aliasMap;
    }

    isPseudoConcreteCharacterAlias(name) {
        const cleanName = this.normalizeOutlineCharacterLabel(name);
        if (!cleanName) {
            return false;
        }

        if (/^(?:\u8001|\u5c0f)[\u4e00-\u9fa5]{1,3}$/u.test(cleanName)) {
            return true;
        }

        if (/^[\u4e00-\u9fa5]{1,4}(?:\u4e3b\u4efb|\u79d1\u957f|\u5904\u957f|\u5382\u957f|\u961f\u957f|\u8fde\u957f|\u8425\u957f|\u6392\u957f|\u73ed\u957f|\u5e72\u4e8b|\u4ee3\u8868|\u533b\u751f|\u62a4\u58eb|\u8001\u5e08|\u8001\u677f|\u7ecf\u7406|\u603b\u76d1|\u7ec4\u957f|\u6821\u957f|\u9662\u957f|\u638c\u67dc|\u5e08\u5085|\u5e08\u7236|\u79d8\u4e66|\u52a9\u7406|\u4fdd\u5b89|\u53f8\u673a|\u8b66\u5b98|\u6cd5\u5b98|\u5927\u592b|\u53d4|\u53d4\u53d4|\u963f\u59e8|\u5a76\u5b50|\u5ac2\u5b50|\u5927\u59d0|\u5927\u5988|\u5927\u7237|\u5927\u53d4|\u4f2f\u7236|\u4f2f\u6bcd|\u59e8\u5988|\u59e8\u7236|\u59d1\u5988|\u59d1\u7236|\u8205\u8205|\u8205\u5988)$/u.test(cleanName)) {
            return true;
        }

        if (/^(?:\u4e3b\u4efb|\u79d1\u957f|\u5904\u957f|\u5382\u957f|\u961f\u957f|\u8fde\u957f|\u8425\u957f|\u6392\u957f|\u73ed\u957f|\u5e72\u4e8b|\u4ee3\u8868|\u533b\u751f|\u62a4\u58eb|\u8001\u5e08|\u8001\u677f|\u7ecf\u7406|\u603b\u76d1|\u7ec4\u957f|\u6821\u957f|\u9662\u957f|\u638c\u67dc|\u5e08\u5085|\u5e08\u7236|\u79d8\u4e66|\u52a9\u7406|\u4fdd\u5b89|\u53f8\u673a|\u8b66\u5b98|\u6cd5\u5b98|\u5927\u592b)[\u4e00-\u9fa5]{1,4}$/u.test(cleanName)) {
            return true;
        }

        return false;
    }

    isGenericCharacterCandidateName(name) {
        const cleanName = String(name || "").trim();
        if (!cleanName) {
            return true;
        }
        if (this.getOutlineCharacterExcludedNames().has(cleanName)) {
            return true;
        }
        if (this.isPseudoConcreteCharacterAlias(cleanName)) {
            return true;
        }
        const aliasToRole = this.buildSynopsisAliasToRoleMap();
        if (aliasToRole[cleanName]) {
            return true;
        }
        return this.matchesGenericRolePattern(cleanName);
    }

    resolveOutlineCandidateName(project, label, description = "") {
        const aliasMap = this.buildKnownCharacterAliasMap(project);
        const cleanLabel = this.normalizeOutlineCharacterLabel(label);
        const directMapped = String(aliasMap[cleanLabel] || "").trim();
        if (directMapped) {
            return {
                name: directMapped,
                needsNaming: false,
                aliases: cleanLabel && cleanLabel !== directMapped ? [cleanLabel] : []
            };
        }

        if (!this.isGenericCharacterCandidateName(cleanLabel)) {
            return {
                name: cleanLabel,
                needsNaming: false,
                aliases: []
            };
        }

        const descriptionText = String(description || "");
        const matchedAlias = Object.keys(aliasMap)
            .sort((left, right) => right.length - left.length)
            .find((alias) => alias && descriptionText.includes(alias));
        if (matchedAlias) {
            const realName = String(aliasMap[matchedAlias] || "").trim();
            if (realName) {
                return {
                    name: realName,
                    needsNaming: false,
                    aliases: Array.from(new Set([cleanLabel, matchedAlias].filter(Boolean)))
                };
            }
        }

        return {
            name: cleanLabel,
            needsNaming: true,
            aliases: cleanLabel ? [cleanLabel] : []
        };
    }

    matchGeneratedCharacterToBatchIndex(batchItems, character, usedIndexes = new Set()) {
        if (!Array.isArray(batchItems) || !batchItems.length) {
            return -1;
        }
        const rawName = this.normalizeOutlineCharacterLabel(character?.name || character?.real_name || character?.realName || "");
        const aliasValues = [
            ...(Array.isArray(character?.aliases) ? character.aliases : Utils.ensureArrayFromText(character?.aliases || character?.["鍒悕"] || ""))
        ]
            .map((value) => String(value || "").trim())
            .filter(Boolean);

        const normalizedTexts = [rawName, ...aliasValues.map((value) => this.normalizeOutlineCharacterLabel(value))]
            .filter(Boolean);

        for (let i = 0; i < batchItems.length; i += 1) {
            if (usedIndexes.has(i)) {
                continue;
            }
            const [label, meta] = batchItems[i];
            const cleanLabel = this.normalizeOutlineCharacterLabel(label);
            const aliases = Array.isArray(meta?.aliases) ? meta.aliases.map((alias) => this.normalizeOutlineCharacterLabel(alias)) : [];
            const targets = [cleanLabel, ...aliases].filter(Boolean);
            if (targets.some((target) => normalizedTexts.some((text) => text === target || text.includes(target) || target.includes(text)))) {
                return i;
            }
        }

        return batchItems.findIndex((_, index) => !usedIndexes.has(index));
    }

    applySafeAliasMappings(text, aliasMap = {}) {
        let normalized = String(text || "");
        if (!normalized || !aliasMap || typeof aliasMap !== "object") {
            return normalized;
        }

        const protectedNames = new Map();
        let protectedText = normalized;
        const realNames = Array.from(new Set(Object.values(aliasMap).map((name) => String(name || "").trim()).filter(Boolean)))
            .sort((left, right) => right.length - left.length);

        realNames.forEach((realName, index) => {
            const placeholder = `__REAL_NAME_${index}__`;
            protectedNames.set(placeholder, realName);
            protectedText = protectedText.replace(
                new RegExp(realName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
                placeholder
            );
        });

        Object.entries(aliasMap)
            .sort((left, right) => right[0].length - left[0].length)
            .forEach(([alias, realName]) => {
                const cleanAlias = String(alias || "").trim();
                const cleanRealName = String(realName || "").trim();
                if (!cleanAlias || !cleanRealName || cleanAlias === cleanRealName) {
                    return;
                }
                if (cleanRealName.includes(cleanAlias)) {
                    return;
                }
                protectedText = protectedText.replace(
                    new RegExp(`(^|[锛?銆侊紝锛?锛?\\s])${cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=鐨剕鏄瘄涓巪鍜寍璺焲鍙妡銆亅锛寍锛泑銆倈锛墊\\)|\\s|$)`, "g"),
                    (match, prefix) => `${prefix}${cleanRealName}`
                );
            });

        protectedNames.forEach((realName, placeholder) => {
            protectedText = protectedText.replace(new RegExp(placeholder, "g"), realName);
        });

        return protectedText;
    }

    sanitizeGeneratedRelationshipText(project, currentName, relationships, sourceMeta = {}) {
        const rawText = String(relationships || "").trim();
        const relationKeywords = /鐖朵翰|姣嶄翰|浜插|鍚庡|鍏绘瘝|鍏荤埗|缁ф瘝|缁х埗|缁у|缁у|缁у厔|缁у紵|鍝ュ摜|濮愬|濡瑰|寮熷紵|澶|濡诲瓙|涓堝か|鎭嬩汉|鏈澶珅鏈濡粅鏈嬪弸|鏁屽|鏁屼汉|浠囨晫|瀵规墜|鍚岄棬|甯堝緬|甯堝厔濡箌涓婁笅绾涓婂徃|涓嬪睘|鍚屼簨|鐩熷弸|甯嚩|鏃ц瘑|浜插睘|姣嶅コ|鐖跺コ|濮愬|鍏勫/;
        const noiseKeywords = /鍚庣画鍙ˉ鍏厊淇℃伅鍚庣画琛ュ厖|鎻愬強瑙掕壊|鍓ф儏涓瓅缁忓巻浜唡蹇冪悊钀藉樊|涓嶆蹇億鎯宠鎶ュ|鐓介鐐圭伀|鏃犳儏绮夌|瑁呬綔|璇曞浘|浼佸浘|琛ㄩ潰涓妡瀹炲垯/;
        const knownNames = new Set(
            (project?.outline?.characters || [])
                .map((character) => String(character?.name || "").trim())
                .filter(Boolean)
        );
        const aliasMap = this.buildKnownCharacterAliasMap(project);
        let normalized = this.applySafeAliasMappings(rawText, aliasMap);

        const cleanClause = (text) => String(text || "")
            .replace(/[\r\n]+/g, " ")
            .replace(/\s+/g, " ")
            .replace(/^[锛屻€侊紱;锛?\-鈥s]+/, "")
            .replace(/[锛屻€侊紱;锛?\-鈥s]+$/, "")
            .replace(/([\u4e00-\u9fa5]{2,4})(?:\1){1,}/g, "$1")
            .replace(/([\u4e00-\u9fa5]{2,4})鐨刓1鐨?g, "$1鐨?)
            .trim();

        const clauses = normalized
            .split(/[\r\n]+|[锛?銆俔+/)
            .map(cleanClause)
            .filter(Boolean)
            .filter((clause) => !noiseKeywords.test(clause))
            .filter((clause) => clause.length <= 40)
            .filter((clause) => {
                const containsKnownName = Array.from(knownNames).some((name) => name && clause.includes(name));
                return containsKnownName || relationKeywords.test(clause);
            });

        const deduped = Array.from(new Set(clauses))
            .filter((clause) => !currentName || !clause.startsWith(currentName))
            .slice(0, 3);

        if (deduped.length) {
            return deduped.join("锛?);
        }

        const fallbackDesc = cleanClause(sourceMeta?.description || "");
        if (fallbackDesc && relationKeywords.test(fallbackDesc) && fallbackDesc.length <= 28) {
            return fallbackDesc;
        }

        return "";
    }

    limitContext(text, max = 2000) {
        return Utils.summarizeText(text, max);
    }
}

