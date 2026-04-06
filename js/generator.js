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
            "【题材约束】",
            genreInfo.description ? `题材说明：${genreInfo.description}` : "",
            `1. 严格限定为${genre}题材${subgenre ? `，具体子题材为${subgenre}` : ""}。`,
            `2. 允许的元素：${(genreInfo.allowed || []).join("；") || "无"}`,
            `3. 禁止的元素：${(genreInfo.forbidden || []).join("；") || "无"}`,
            `4. 创作风格应符合${genre}题材特征，语言风格要与题材匹配。`
        ].filter(Boolean).join("\n");
    }

    async generateStoryIdeas({
        keyword,
        title,
        theme,
        genre,
        subgenre,
        concept,
        extraNote,
        marketTrendSummary,
        marketTrendItems,
        versionCount = 4
    }) {
        const safeCount = Math.min(5, Math.max(3, Number(versionCount || 4) || 4));
        const genreConstraint = this.buildGenreConstraint(genre, subgenre || genre);
        const systemPrompt = [
            genreConstraint,
            "你是专业的网络小说选题策划师，擅长为男频、女频、双向受众作品设计可长篇展开的商业化脑洞。",
            "现在请围绕用户给出的主题关键词，生成多个差异明显的小说脑洞版本，供作者在正式写细纲前筛选。",
            "",
            "【硬性要求】",
            `1. 你必须输出 ${safeCount} 个版本，格式必须是 JSON 数组。`,
            "2. 每个版本必须是明显不同的书，不允许只是换皮。",
            "3. 差异至少来自：主角身份、金手指/特殊能力、核心冲突、故事气质、感情线模式、世界规则中的三个以上。",
            "4. 不能只偏女频，必须根据关键词自动判断适合的赛道，可以出现男频、女频或双向受众版本。",
            "5. 每个版本都要具备长篇潜力，前30章有爆点，中后期有升级空间。",
            "6. 不要写正文，不要写细纲，不要写章节列表。",
            "7. 表达要具体可写，少空话，少行业黑话。",
            "",
            "【每个版本必须包含这些字段】",
            "id: 唯一ID，可用 idea_1 这种格式",
            "title: 标题，格式必须是【主题词+赛道标签+核心卖点】",
            "positioning: 题材定位与读者方向",
            "hook: 一句话故事钩子",
            "core_setup: 核心设定",
            "conflict_engine: 核心冲突与剧情发动机",
            "selling_points: 爽点/情绪点设计",
            "world_highlights: 适配世界观与前30章名场面",
            "longline: 长线展开与升级空间",
            "relationship_notes: 人物关系与感情线建议",
            "seed_summary: 一段150到250字的浓缩版故事方案，可直接给作者继续做后续细化",
            "",
            "【输出要求】",
            "1. 只能返回 JSON 数组，不要输出 markdown、说明文字或代码块。",
            "2. 每个字段都必须是中文字符串，内容充实。",
            "3. seed_summary 必须像创作输入文本，不要写成分析报告口吻。"
        ].filter(Boolean).join("\n");

        const userPrompt = [
            `主题关键词：${keyword || "未提供"}`,
            `小说标题参考：${title || "未命名小说"}`,
            `核心主题参考：${theme || "未指定"}`,
            `当前题材参考：${subgenre || genre || "未指定"}`,
            concept ? `已有故事概念参考：${this.limitContext(concept, 600)}` : "",
            marketTrendSummary ? `当前番茄榜摘要：\n${this.limitContext(marketTrendSummary, 2200)}` : "",
            Array.isArray(marketTrendItems) && marketTrendItems.length
                ? `榜单样本：\n${marketTrendItems.slice(0, 12).map((item, index) => {
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
                }).join("\n")}`
                : "",
            extraNote ? `用户补充要求：${this.limitContext(extraNote, 800)}` : "",
            "",
            "请围绕这个关键词输出多个差异明显的故事脑洞版本。",
            "至少覆盖两种不同创作方向，例如：不同赛道、不同故事气质、不同冲突发动机。",
            "每个版本都必须可写、可连载、可持续制造爽点。",
            marketTrendSummary ? "如果给了榜单摘要，请提炼当前高位作品的共同卖点和缺口，做出对标但不照抄的方案。" : ""
        ].filter(Boolean).join("\n");

        const parsed = await this.requestJSONArray(systemPrompt, userPrompt, {
            temperature: 0.9,
            maxTokens: this.getConfiguredMaxTokens(12000)
        });

        return parsed.slice(0, safeCount).map((item, index) => ({
            id: item.id || `idea_${index + 1}`,
            title: item.title || `【${keyword || "主题"}+方案${index + 1}】`,
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
        const weirdGlyphs = text.match(/[-]/g) || [];
        return weirdGlyphs.length >= 2;
    }

    async generateWorldbuilding({ title, concept, genre, subgenre, theme }) {
        const genreConstraint = this.buildGenreConstraint(genre, subgenre || genre);
        const systemPrompt = [
            genreConstraint,
            "你是世界书构建专家“默默”，一位资深网文策划编辑，擅长构建宏大且富有创意的世界观设定。",
            "请根据用户提供的世界观元素和故事概念，生成一段完整的世界观设定描述。",
            "",
            "【输出格式要求】",
            "输出一段连贯的世界观描述文字（200-350字），包含以下要素：",
            "1. 世界背景设定（时代、地点、基本规则）",
            "2. 核心能量/修炼体系",
            "3. 主要势力或组织",
            "4. 特殊设定（系统、金手指等）",
            "5. 核心冲突或矛盾",
            "",
            "【内容风格铁律】",
            "- 简单易懂、直白、口语化",
            "- 像讲故事一样描述，不要用论文式语言",
            "- 禁止使用晦涩、抽象的词汇",
            "- 直接输出世界观描述，不要任何标题、标记或额外说明"
        ].filter(Boolean).join("\n");

        const userPrompt = [
            `小说标题：《${title || "未命名小说"}》`,
            `题材：${subgenre || genre || "未指定"}`,
            `核心主题：${theme || "未指定"}`,
            "",
            "【故事概念】",
            concept || "暂无",
            "",
            "请根据以上信息，生成一段完整的世界观设定描述（200-350字），要求内容充实、层次丰富、逻辑清晰。"
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
            `你是世界书构建专家“默默”，一位资深网文策划编辑，擅长构建宏大且富有创意的故事架构。`,
            `请根据用户提供的世界观元素和故事概念，规划一部${volumeCount}卷的网络小说的卷概要。`,
            "",
            "【内容风格铁律】",
            "你的所有输出都必须简单易懂、直白、口语化。要像一个优秀的故事员对朋友讲故事一样，而不是一个学者在写论文。绝对禁止使用任何晦涩、抽象、拗口或“高概念”的词汇和句子。",
            "",
            "【创意设计原则】",
            "1. 使用分支节点思维：每卷都是一个关键的“故事节点”，代表故事中的重要转折点",
            "2. 设置明确的角色目标和动机：无论剧情如何发展，主角都有清晰的长期目标",
            "3. 利用世界设定作为故事框架：重要地点、事件和潜在冲突要贯穿始终",
            "4. 设计被动响应而非主导叙事：让读者感觉他们在跟随故事，同时故事自然引导",
            "",
            "【多分支剧情设计】",
            "- 每卷必须包含主线剧情和至少一条潜在支线",
            "- 主线是推动故事前进的核心事件",
            "- 支线是丰富世界观、深化人物的辅助剧情",
            "- 各卷之间要有“钩子”——前一卷埋下的伏笔在后续卷中揭晓",
            "",
            "【每卷结局指令（必须严格执行）】",
            `1. 非最终卷（第1卷到第${Math.max(1, volumeCount - 1)}卷）：每卷结尾必须设置强悬念钩子，引出下一卷的新冲突`,
            "- 卷末必须出现：新的敌人/新的秘密/新的目标/新的地点/新的人物",
            "- 禁止普通结尾，禁止“故事告一段落”的感觉",
            "- 必须让读者强烈期待下一卷的内容",
            `2. 最终卷（第${volumeCount}卷）：必须是真正的大结局`,
            "- 解决所有主要悬念和伏笔",
            "- 主角完成最终目标或获得最终成长",
            "- 给予读者满足感和完整感，可以有开放式余韵，但不能是“待续”",
            "",
            "【输出要求】",
            "1. 输出必须是 JSON 数组，不要输出任何额外说明或 markdown 标记",
            "2. 每卷必须体现目标、困难、转折、高潮和卷末钩子",
            "3. 各卷之间要有明确的剧情递进关系，体现“铺垫-冲突-高潮-缓和-新冲突”的节奏",
            "4. 绝对不能有重复的剧情元素",
            "5. 不能出现逻辑漏洞（如角色死而复生、能力忽高忽低、时间线混乱等）"
        ].filter(Boolean).join("\n");

        const userPrompt = [
            `小说标题：《${title || "未命名小说"}》`,
            `题材：${subgenre || genre || "未指定"}`,
            `核心主题：${theme || "未指定"}`,
            `故事概念：${concept || "暂无"}`,
            `计划卷数：${volumeCount}`,
            `每卷计划章节数：${chaptersPerVolume}`,
            `世界观：${worldbuilding || "暂无"}`,
            innovationPrompt ? `【反套路与创新建议】\n${innovationPrompt}` : "",
            "",
            "请输出 JSON 数组，每个对象包含：",
            "volume_number: 卷序号",
            "title: 卷名",
            "summary: 本卷 150-250 字剧情概要，务必包含主线和至少一条支线，并说明主角目标、困难、关键转折、成长或新信息",
            "cliffhanger: 卷末钩子，一句话",
            "",
            "不要输出 JSON 之外的说明。"
        ].join("\n");

        const parsed = await this.requestJSONArray(systemPrompt, userPrompt, {
            temperature: 0.72,
            maxTokens: this.getConfiguredMaxTokens(6000)
        });

        return parsed.map((item, index) => ({
            volume_number: Number(item.volume_number || index + 1),
            title: item.title || `第${index + 1}卷`,
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
            .map((line) => line.replace(/^[\-•*]\s*/, ""))
            .filter((line) => /第\s*\d+\s*章/.test(line));

        const parsed = [];
        lines.forEach((line, index) => {
            const match = line.match(/^第\s*(\d+)\s*章[：:、.\-）)]?\s*(.+?)\s*[—\-－–]\s*(.+)$/);
            if (match) {
                const chapterNumber = Number(match[1] || index + 1);
                const title = String(match[2] || "").trim();
                const synopsis = String(match[3] || "").trim();
                parsed.push({
                    chapter_number: chapterNumber,
                    title: title || `第${chapterNumber}章`,
                    key_event: synopsis,
                    emotion_curve: "",
                    synopsis,
                    line: `第${chapterNumber}章：${title || `第${chapterNumber}章`} - ${synopsis}`
                });
                return;
            }

            const fallback = line.match(/^第\s*(\d+)\s*章[：:、.\-）)]?\s*(.+)$/);
            if (fallback) {
                const chapterNumber = Number(fallback[1] || index + 1);
                const content = String(fallback[2] || "").trim();
                const parts = content.split(/\s*[—\-－–]\s*/);
                const title = String(parts.shift() || `第${chapterNumber}章`).trim();
                const synopsis = String(parts.join(" - ") || content).trim();
                parsed.push({
                    chapter_number: chapterNumber,
                    title,
                    key_event: synopsis,
                    emotion_curve: "",
                    synopsis,
                    line: `第${chapterNumber}章：${title} - ${synopsis}`
                });
            }
        });

        if (!parsed.length) {
            throw new Error("AI 没有按细纲格式返回内容。");
        }

        const targetCount = Math.max(0, Number(chapterCount || 0));
        const normalizedSynopsisItems = parsed.map((item, index) => this.buildNormalizedSynopsisItem(item, Number(item.chapter_number || index + 1)));
        return this.normalizeChapterSynopsisSequence(normalizedSynopsisItems, targetCount);
        return (targetCount ? parsed.slice(0, targetCount) : parsed).map((item, index) => ({
            ...item,
            chapter_number: Number(item.chapter_number || index + 1),
            title: item.title || `第${Number(item.chapter_number || index + 1)}章`,
            synopsis: item.synopsis || item.key_event || "",
            key_event: item.key_event || item.synopsis || "",
            line: item.line || `第${Number(item.chapter_number || index + 1)}章：${item.title || `第${Number(item.chapter_number || index + 1)}章`} - ${item.synopsis || item.key_event || ""}`
        }));
    }

    buildNormalizedSynopsisItem(item, chapterNumber) {
        const normalizedChapterNumber = Number(chapterNumber || item?.chapter_number || 1);
        const title = String(item?.title || `第${normalizedChapterNumber}章`).trim() || `第${normalizedChapterNumber}章`;
        const synopsis = String(item?.synopsis || item?.key_event || "").trim();
        return {
            ...item,
            chapter_number: normalizedChapterNumber,
            title,
            synopsis,
            key_event: synopsis,
            line: `第${normalizedChapterNumber}章：${title} - ${synopsis}`
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
            throw new Error(`章节细纲数量不足：要求 ${targetCount} 章，缺少 ${missingNumbers.map((num) => `第${num}章`).join("、")}。`);
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
            "你是一个执行力极强的网文主编助手。",
            "你的唯一任务是将用户提供的【详细细纲】转化为标准格式的章节大纲。",
            "不要自己编！不要自己编！严格照着细纲写！",
            "必须 100% 严格按照细纲内容进行扩充，严禁偏离原定剧情走向。",
            "如果细纲已经给出某章发生什么，就必须写什么；如果某章节信息较少，也必须补满所有字段，但不能改主线结果。",
            "必须严格遵守当前卷边界，不得提前串卷，不得擅自改写主线。",
            "续写必须紧接前文最后一章的剧情发展，不能跳跃、不能重复、不能回退。",
            "如果前文大纲存在矛盾、不合理或节奏失当，你要在新章纲里自然修顺，但不能改掉既定主线结果。",
            "每批生成的第一章，必须直接承接前文最后一章的【下章铺垫】与情绪尾调。",
            startChapter <= 1 ? "如果当前是卷首，必须迅速切入本卷新主题与新气象，不要重复上一卷的纠葛。" : "",
            "世界观设定不可违反，角色行为必须符合已建立的人设与关系。",
            guardContext,
            consistencyContext
        ].filter(Boolean).join("\n\n");

        const userPrompt = [
            detailedOutlineContext ? `【详细大纲（必须严格执行）】\n${detailedOutlineContext}` : "",
            `小说标题：${project.outline.title || ""}`,
            `题材：${project.outline.subgenre || project.outline.genre || "未指定"}`,
            `故事概念：${project.outline.storyConcept || "暂无"}`,
            `世界观：${project.outline.worldbuilding || "暂无"}`,
            volumeSynopsisContext ? `【卷纲前置】\n${volumeSynopsisContext}` : "",
            allChapterSynopsisContext ? `【细纲前置】\n${allChapterSynopsisContext}` : "",
            outlineSlice.adjacentSummary ? `【相邻卷衔接提示】\n${outlineSlice.adjacentSummary}` : "",
            storyStateSummary ? `【当前故事状态（必须延续）】\n${storyStateSummary}` : "",
            setupContinuityGuard || "",
            plotUnitContext ? `【8章剧情单元规则】\n${plotUnitContext}` : "",
            plotUnitReport,
            plotUnitSuggestions,
            `当前卷：第${volumeNumber}卷 ${volume.title || ""}`,
            `当前卷摘要：${volume.summary || "暂无"}`,
            `当前卷章节细纲：${volume.chapterSynopsis || volume.chapter_synopsis || "暂无"}`,
            characterDigest ? `【已有角色与人设】\n${characterDigest}` : "",
            existingSummary ? `【前情提要】\n${existingSummary}` : "",
            existingEventsContext,
            "",
            "【绝对原则】",
            "1. 剧情不可重复：已有章节已经写过的事件，后面不得再次出现相同或高度相似的桥段。",
            "2. 你本次生成的多个章节之间也不能重复，每一章的核心事件都必须是全新的。",
            "3. 角色状态必须延续前文：位置、伤势、情绪、装备、时间线都不能断裂。",
            "4. 新引入角色必须符合当前场景和剧情逻辑。",
            "5. 如果细纲里包含后续卷内容，严禁压缩写进当前卷。",
            "6. 如果某个细纲事件已经在已有章节中写过了，必须跳过，改写下一个新事件。",
            "7. 每章【下章铺垫】必须能被下一章【章节目标】或【核心事件】直接接住。",
            "8. 前一章情绪曲线的结尾，要能自然过渡到下一章情绪曲线的开头。",
            "9. 如果前文摘要里某个事件已经发生，后续章纲不能再写它“即将发生”。",
            "10. 世界观设定不可违反。",
            startChapter <= 1 ? "11. 如果当前是卷首，新的一卷应当有新的氛围和节奏，不要重复上一卷的纠葛，快速切入新主题。" : "",
            "",
            "【输出格式标准（System 9）】",
            "summary 字段必须严格包含以下标签，并保留空行结构：",
            "【章节目标】（本章核心目标，不少于20字）",
            "【出场人物】",
            "【场景】（具体场景描述）",
            "【核心事件】（核心事件描述，不少于50字）",
            "【情绪曲线】A→B→C",
            "【情节推进】",
            "【伏笔处理】",
            "【下章铺垫】（⚠️铺垫≠预告！只写状态/氛围/悬念，不写具体事件结果）",
            "",
            `请生成第 ${startChapter} 章到第 ${endChapter} 章的章节大纲。`,
            "输出 JSON 数组，每个对象必须包含：",
            "chapter_number: 章节号",
            "title: 章节标题",
            "summary: 严格遵守 System 9 模板，内容充实，不要缺字段",
            "key_event: 核心事件",
            "emotion_curve: 情绪曲线",
            "characters: 出场人物数组",
            "foreshadows: 本章埋下或回收的伏笔数组",
            "plot_unit: { unit_number, unit_phase, unit_position, connects_to_previous, sets_up_next }",
            "next_chapter_setup: { state_setup, atmosphere_setup, suspense_hook, clue_hint, countdown }",
            "uuid: 章节 UUID",
            "",
            "特别要求：",
            "1. next_chapter_setup 是下章铺垫，不是预告；只能写状态、氛围、悬念、暗示，不能直接写结果。",
            "2. summary 中的【下章铺垫】也必须遵守同样规则：只埋因，不写果。",
            "2.1 绝对禁止写“下章将会/下一章会/身份将曝光/敌人将来袭/马上会发生什么”这类预告句。",
            "2.2 正确写法是：重伤昏迷、异样眼神、远处异动、发现线索、空气骤沉、警报响起；错误写法是直接把下章事件和结果说出来。",
            "3. summary 中的【情节推进】必须保留“1.【类型标签】内容”的格式。",
            "4. 【出场人物】必须使用“- 姓名（简介）”的格式。",
            "5. 【章节目标】不得少于20字，【核心事件】不得少于50字。",
            "6. 【情节推进】至少写 5 条，每条不少于80字，且保留“序号 + 类型标签”的格式。",
            "7. 细纲里涉及的人物称呼必须尽量使用真实姓名。",
            "8. 人物行为和关系推进必须与既有人设一致。",
            "9. 第 8 章、第 16 章等单元收束章要负责为下一单元做悬念铺垫。",
            "10. 段落之间必须保留空行，不要把所有标签挤成一团。",
            "11. JSON 中严禁输出 markdown 代码块标记。"
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
            title: item.title || `第${startChapter + index}章`,
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

        const title = project.outline?.title || "未命名小说";
        const theme = project.outline?.theme || "暂无";
        const detailedOutline = project.outline?.detailed_outline || "";
        const worldbuilding = project.outline?.worldbuilding || "";
        const existingCharacters = project.outline?.characters || [];
        const establishedRelationshipText = this.buildEstablishedRelationshipText(project, rawItems.map(([name]) => name));
        const existingCharsText = existingCharacters.length
            ? existingCharacters.map((character) => [
                `- ${character.name || "未命名"}`,
                character.identity ? `身份：${character.identity}` : "",
                (character.aliases || character["别名"]) ? `别名：${Utils.ensureArrayFromText(character.aliases || character["别名"]).join("、")}` : "",
                character.personality ? `性格：${Utils.summarizeText(character.personality, 80)}` : "",
                character.background ? `背景：${Utils.summarizeText(character.background, 80)}` : "",
                character.relationships ? `关系：${Utils.summarizeText(character.relationships, 80)}` : ""
            ].filter(Boolean).join(" | ")).join("\n")
            : "暂无已有角色";

        const exampleChar = {
            name: "角色名",
            identity: "身份定位",
            age: "年龄",
            gender: "性别",
            personality: "核心性格特点，不少于30字",
            background: "背景故事，不少于50字",
            appearance: "外貌描述，不少于30字",
            abilities: "能力特长",
            goals: "目标动机",
            relationships: "与已有角色的关系",
            aliases: ["别名1"],
            性格特点: "同 personality",
            背景故事: "同 background",
            外貌描述: "同 appearance",
            能力特长: "同 abilities",
            目标动机: "同 goals",
            人物关系: "同 relationships",
            别名: "别名1"
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
                    ? `；原称呼/别名：${detail.aliases.join("、")}`
                    : "";
                const namingHint = detail.needsNaming
                    ? "；【需要先起一个具体中文名字，禁止继续用模糊称呼做name，并把原称呼写入aliases】"
                    : "";
                return `- ${label}${desc ? `（${desc}）` : ""}${aliasText}${namingHint}`;
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
                "你是一位资深网文主编，擅长设定复杂、立体、有反差感的人物角色。",
                `现在需要为小说《${title}》中的多个角色批量创建完整的人物设定。`,
                "",
                "【小说信息】",
                `标题：《${title}》`,
                `主题：${theme}`,
                "",
                "【世界观】",
                this.limitContext(worldbuilding, 600) || "暂无世界观",
                "",
                "【详细大纲】",
                this.limitContext(detailedOutline, 800) || "暂无细纲",
                "",
                "【已有角色及其背景（必须保持关系一致性！）】",
                existingCharsText,
                "",
                "【已建立的人物关系】",
                establishedRelationshipText,
                "",
                "【需要生成人设的角色描述】",
                batchStr,
                "",
                "【严格要求】",
                `1. 输出必须是 JSON 数组，包含 ${batchItems.length} 个角色对象。`,
                "2. 每个角色必须包含所有字段：name, identity, age, gender, personality, background, appearance, abilities, goals, relationships 以及对应中文字段。",
                "3. personality / 性格特点：必须包含核心性格特点，字数不少于30字。",
                "4. background / 背景故事：必须包含核心冲突和与故事的关联，字数不少于50字。",
                "5. appearance / 外貌描述：必须有画面感，字数不少于30字。",
                "6. 关系一致性极其重要：新角色的身份和背景必须与已有角色保持逻辑一致。",
                "7. 若已有角色设定了某个地位，新角色不能无故取代，必须在 relationships 字段中明确说明与已有角色的关系。",
                "8. 角色设定必须符合当前小说的世界观和剧情发展。",
                "9. 各角色之间要有差异化，避免雷同。",
                "10. 如果输入项本身已经是明确实名，必须保留原名字，不得擅自改名；如果已有别名或常见称呼，请写入 aliases / 别名 字段。",
                "11. 如果新角色和已有角色存在亲属、师门、敌对、上下级、旧识关系，必须在 relationships 字段中写清楚。",
                "12. 不要让新角色无故顶替已有角色的重要身份，也不要把已有角色的别名重复发给其他人。",
                "13. 如果输入项是“主角、女主、男主、龙神、审判官、同事A、某助理”这类模糊称呼或占位称呼，且尚未锁定实名，你必须在本次输出里直接起一个具体中文名字。",
                "14. 对这类待命名角色，name 字段绝对不能继续写成原称呼、代称、占位符、编号后缀或模糊身份词；原称呼只能放进 aliases / 别名。",
                "15. 如果某个模糊称呼其实已经对应已有角色，必须沿用已有名字，不能重复造一个新角色。",
                "16. 诸如“同事A、同事B、秘书甲、助理乙、主角、女主、男主、他、她、这人、那人、黑衣审判官”都不能直接出现在 name 字段。",
                "17. relationships / 人物关系 只能写与已有实名角色或明确角色的关系，尽量压缩成 1-3 条短句，例如“林书音的继姐（敌对）”“李桂香的女儿（同伙）”。",
                "18. 禁止把大段背景故事、剧情经过、心理活动塞进 relationships 字段；关系字段不能自相矛盾，也不能同时把一个角色写成两种冲突身份。",
                "19. 不要包含任何 markdown 标记，直接返回纯 JSON 数组。",
                "",
                "【输出格式示例】",
                `[${JSON.stringify(exampleChar, null, 2)}]`,
                "",
                "【待命名角色示例】",
                "输入：- 同事A（总针对林书音的办公室同事）",
                "正确输出：name 必须是具体中文名字，例如“周敏”或“李雅岚”；aliases 里再写“同事A”。",
                "错误输出：name 写成“同事A”“女同事”“办公室同事”都算不合格。"
            ].join("\n");

            const parsed = await this.requestJSONArray(systemPrompt, `请为以上 ${batchItems.length} 个角色批量生成完整的人物设定，确保每个角色都有完整的中英文字段。`, {
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
                    : Utils.ensureArrayFromText(character.aliases || character["别名"]);
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
                    personality: character.personality || character["性格特点"] || "",
                    background: character.background || character["背景故事"] || "",
                    appearance: character.appearance || character["外貌描述"] || "",
                    abilities: character.abilities || character["能力特长"] || "",
                    goals: character.goals || character["目标动机"] || "",
                    relationships: this.sanitizeGeneratedRelationshipText(project, chosenName || candidateName, character.relationships || character["人物关系"] || "", sourceMeta),
                    aliases: mergedAliases,
                    性格特点: character.personality || character["性格特点"] || "",
                    背景故事: character.background || character["背景故事"] || "",
                    外貌描述: character.appearance || character["外貌描述"] || "",
                    能力特长: character.abilities || character["能力特长"] || "",
                    目标动机: character.goals || character["目标动机"] || "",
                    人物关系: this.sanitizeGeneratedRelationshipText(project, chosenName || candidateName, character.relationships || character["人物关系"] || "", sourceMeta),
                    别名: mergedAliases.join("、")
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
            "你是一名擅长将章节大纲扩写成中文网文正文的章节写手。",
            "请根据已经确认的章节大纲扩写正文草稿。",
            "你必须严格遵守本章大纲、全局设定、本章设定、角色锁定、世界观、人物一致性、动态状态和章末快照衔接。",
            "你可以在不改变主线的前提下进行血肉填充、动作延展、心理补强和场景渲染，但绝不能偏离大纲主线。",
            "正文字数默认目标为3000-6000字，至少不要少于2500字；如果本章大纲信息很多，就要一次性充分展开，不要压缩成一千多字的短章。",
            "必须完成本章结尾铺垫任务，但绝对不能把下一章核心事件提前写出来。",
            "正文必须紧接前文最后一个有效场景和状态展开，不准平地重开，不准把已经发生的事再写成预告。",
            "前文五章原文只用于继承事实、名词、状态、对白口吻和动作延续，不是给你当作前情回顾模板。",
            "如果本章大纲或前文衔接略显生硬，你要在正文里自然补足因果与过桥动作，让读者读起来顺，但不能篡改主线结果。",
            "拒绝AI味：不要堆砌嘴角、眼神、瞳孔、喉结、指节等模板化微表情；不要写空泛比喻、总结腔和文绉绉的抽象抒情。",
            "短句优先，动词优先，口语化，少副词，少形容词，少套路比喻。",
            "正文写完后，必须按要求追加状态输出和追踪输出。",
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
                currentChapter: `第${chapter.number || "?"}章`,
                outlineLength: String(chapter.summary || "").trim().length,
                templateLength: String(promptTemplate || "").trim().length,
                finalUserPromptLength: String(userPrompt || "").length,
                finalSystemPromptLength: String(systemPrompt || "").length,
                injectedBlocks: [
                    {
                        label: "本章大纲",
                        length: String(chapter.summary || "").trim().length,
                        preview: this.limitContext(chapter.summary || "", 160)
                    },
                    {
                        label: "开篇接力棒",
                        length: String(openingRelayPacket || "").trim().length,
                        preview: this.limitContext(openingRelayPacket || "", 160)
                    },
                    {
                        label: "前文五章",
                        length: String(prevContent || "").trim().length,
                        preview: this.limitContext(prevContent || "", 160)
                    },
                    {
                        label: "前文大纲摘要",
                        length: String(previousOutlineContext || "").trim().length,
                        preview: this.limitContext(previousOutlineContext || "", 160)
                    },
                    {
                        label: "当前卷细纲参考",
                        length: String(currentVolumeOutlineContext || "").trim().length,
                        preview: this.limitContext(currentVolumeOutlineContext || "", 160)
                    },
                    {
                        label: "世界观与详细大纲",
                        length: String(worldAndPlanContext || "").trim().length,
                        preview: this.limitContext(worldAndPlanContext || "", 160)
                    },
                    {
                        label: "相关角色设定",
                        length: String(characterDigest || "").trim().length,
                        preview: this.limitContext(characterDigest || "", 160)
                    },
                    {
                        label: "全局设定提醒",
                        length: String(project?.global_setting_note || "").trim().length,
                        preview: this.limitContext(project?.global_setting_note || "", 120)
                    },
                    {
                        label: "本章设定提醒",
                        length: String(chapter.chapter_setting_note || "").trim().length,
                        preview: this.limitContext(chapter.chapter_setting_note || "", 120)
                    },
                    {
                        label: "故事状态摘要",
                        length: String(storyStateSummary || "").trim().length,
                        preview: this.limitContext(storyStateSummary || "", 160)
                    },
                    {
                        label: "章节执行骨架",
                        length: String(narrativeBridgePlan || "").trim().length,
                        preview: this.limitContext(narrativeBridgePlan || "", 160)
                    },
                    {
                        label: "章末快照衔接指导",
                        length: String(transitionGuide || "").trim().length,
                        preview: this.limitContext(transitionGuide || "", 160)
                    },
                    {
                        label: "开头防重复约束",
                        length: String(openingAntiRepeatGuard || "").trim().length,
                        preview: this.limitContext(openingAntiRepeatGuard || "", 160)
                    },
                    {
                        label: "智能扩充建议",
                        length: String(expansionHint || "").trim().length,
                        preview: this.limitContext(expansionHint || "", 160)
                    },
                    {
                        label: "本章结尾铺垫任务",
                        length: String(nextChapterSetupInstruction || "").trim().length,
                        preview: this.limitContext(nextChapterSetupInstruction || "", 160)
                    },
                    {
                        label: "下一章禁止预写预警",
                        length: String(nextChapterForbiddenPreview || "").trim().length,
                        preview: this.limitContext(nextChapterForbiddenPreview || "", 160)
                    },
                    {
                        label: "状态输出协议",
                        length: String(stateOutputProtocol || "").trim().length,
                        preview: this.limitContext(stateOutputProtocol || "", 120)
                    },
                    {
                        label: "附加追踪输出",
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
            "你是一个严格的中文小说状态抽取器。",
            "你的任务是根据章节正文和上下文，输出本章结束时的状态 JSON。",
            "你只能输出一个合法 JSON 对象。",
            "禁止输出解释、禁止输出 markdown 代码块、禁止输出 <<<STATE_JSON>>> 分隔符、禁止复述正文。",
            "如果正文里没有明确给出的信息，请使用空字符串、空数组或空对象，不要编造。"
        ].join("\n");

        const userPrompt = [
            `【当前章节】第${chapter.number || "?"}章《${chapter.title || "未命名章节"}》`,
            chapter.summary ? `【本章大纲】\n${chapter.summary}` : "",
            previousOutlineContext ? `【前文大纲摘要】\n${this.limitContext(previousOutlineContext, 1400)}` : "",
            storyStateSummary ? `【前文状态摘要】\n${storyStateSummary}` : "",
            currentVolumeOutlineContext ? `【当前卷细纲参考】\n${this.limitContext(currentVolumeOutlineContext, 1600)}` : "",
            characterDigest ? `【相关人物设定】\n${characterDigest}` : "",
            transitionGuide ? `【衔接提醒】\n${transitionGuide}` : "",
            nextChapterSetupInstruction ? `【本章结尾铺垫任务】\n${nextChapterSetupInstruction}` : "",
            rawStateBlock ? `【上次失败的状态输出残片】\n${this.limitContext(rawStateBlock, 1800)}` : "",
            `【章节正文】\n${this.limitContext(cleanedContent, 12000)}`,
            stateOutputProtocol,
            "现在只输出 JSON 对象本身，不要输出任何额外文字。"
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
        const suspiciousPatterns = this.getAiSuspiciousPatterns();
        const whitelist = this.getEffectiveAiWhitelist(project);
        const blacklist = this.getEffectiveAiBlacklist(project);
        const segments = this.splitSentencesForAiFilter(sourceText);
        const taintedIndices = [];
        const hitWords = new Set();

        segments.forEach((segment, index) => {
            const sentence = String(segment || "");
            if (!sentence.trim()) {
                return;
            }
            if (whitelist.some((item) => item && sentence.includes(item))) {
                return;
            }

            const forced = blacklist.some((item) => item && sentence.includes(item));
            let flagged = forced;

            if (forced) {
                blacklist.forEach((item) => {
                    if (item && sentence.includes(item)) {
                        hitWords.add(item);
                    }
                });
            }

            targetWords.forEach((word) => {
                if (word && sentence.includes(word)) {
                    hitWords.add(word);
                    flagged = true;
                }
            });

            if (!flagged) {
                flagged = suspiciousPatterns.some((pattern) => new RegExp(pattern).test(sentence));
            }

            if (flagged) {
                taintedIndices.push(index);
            }
        });

        if (!taintedIndices.length) {
            return sourceText;
        }

        const contextIndices = new Set();
        taintedIndices.forEach((index) => {
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
            .map((index) => `${taintedIndices.includes(index) ? "【需改】" : "【勿动】"}${segments[index].trim()}`);
        const excerptText = excerptLines.join("\n");
        const hitWordsStr = Array.from(hitWords).slice(0, 50).join("、");

        const polishPrompt = [
            "你是一位资深网文编辑，请对以下文本进行【精准去AI味】处理。",
            "",
            "【最高原则】",
            "- 只改标记为【需改】的句子，标记为【勿动】的句子一个字都不要动。",
            "- 改完之后的句子必须比原句更简洁或同等简洁，绝对不能变复杂。",
            "- 宁可少改，也不要乱改。如果一句话不确定有没有AI味，就不要改。",
            "- 你是编辑不是审核员，不要改题材，不要改事件，只改措辞。",
            "",
            "【什么是AI味】",
            "1. 模板化微表情：嘴角、眼神、瞳孔、喉结、指节等套路描写。",
            "2. 烂大街比喻：像一记重锤、空气凝滞、时间仿佛暂停等。",
            "3. 抽象情绪标签：心中一凛、心下了然、无法用言语形容等。",
            "4. 万能形容词堆砌：深邃、锐利、复杂的光芒、不容置疑等。",
            "5. 副词修饰依赖：缓缓地、死死地、精准地、平静地等。",
            "",
            `【文中检测到的AI味词汇】${hitWordsStr || "已命中可疑句式"}`,
            "",
            "【改写规则】",
            "1. 短句优先，动词优先，口语化，少比喻。",
            "2. 微表情类句子必须整句重写，换成动作、对话或直接删掉，不要只换个说法。",
            "3. 不要总结，不要拔高，不要文绉绉。",
            "4. 不要改没问题的句子。",
            "",
            "【输出格式】",
            "- 只输出【需改】句子的改写结果，每行一句。",
            "- 输出行数尽量与【需改】句子数量一致。",
            "- 不要解释，不要加标题。",
            "",
            "【待润色文本】",
            excerptText
        ].join("\n");

        const systemPrompt = "你是一位网文老编辑。只改真正有AI味的句子，没AI味的一个字不动。微表情必须整句换成动作或对话。改完后要更简洁，短句为主，动词优先，口语化，少比喻。";

        try {
            const response = await this.api.callLLM(polishPrompt, systemPrompt, {
                temperature: 0.35,
                maxTokens: Math.min(this.getConfiguredMaxTokens(8000), excerptText.length * 2 + 1200),
                timeout: this.getTaskTimeoutMs(300000)
            });
            const rewrittenLines = String(response || "")
                .split(/\r?\n/)
                .map((line) => line.replace(/^【需改】|^【勿动】/g, "").trim())
                .filter(Boolean);

            if (!rewrittenLines.length) {
                return sourceText;
            }

            const updated = [...segments];
            taintedIndices.forEach((index, position) => {
                const rewritten = rewrittenLines[position];
                if (rewritten) {
                    updated[index] = this.preserveSentenceEnding(segments[index], rewritten);
                }
            });

            return updated.join("").replace(/\n{3,}/g, "\n\n").trim();
        } catch (error) {
            return sourceText;
        }
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
            Utils.log(`JSON 数组解析失败，原始返回片段：${rawPreview || "空响应"}`, "error");
            throw new Error("AI 返回内容无法解析为 JSON 数组，请重试一次。");
        }
        return parsed;
    }

    async repairJSONArrayResponse(rawText, options = {}) {
        const raw = String(rawText || "").trim();
        if (!raw) {
            return raw;
        }

        const repairSystemPrompt = [
            "你是一个 JSON 修复器。",
            "你的唯一任务是把用户给你的内容整理成合法的 JSON 数组。",
            "不要补剧情，不要改字段含义，不要解释，不要加 markdown 代码块。",
            "如果原文里有多余说明、前言、后记，只保留 JSON 数组本体。",
            "如果有尾逗号、中文引号、包裹文字，请修正成标准 JSON。"
        ].join("\n");

        const repairUserPrompt = [
            "请把下面内容修复成合法的 JSON 数组，只输出数组本体：",
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
            blocks.push(`【全局设定提醒】\n${globalSetting}`);
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
            blocks.push(`【卷边界规则】当前只允许处理第 ${volumeNumber} 卷范围内的剧情，不要提前透支后续卷的重要事件。`);
        }

        return blocks.join("\n\n");
    }

    getAiHighFrequencyWords() {
        return [
            "嘴角勾起一抹弧度", "嘴角勾起一抹", "嘴角微微上扬", "勾起一抹", "勾起一丝",
            "微不可察地", "微不可察", "微不可查地", "微不可查",
            "眼中闪过一丝精光", "眼中闪过一丝惊讶", "眼中闪过一丝", "眼中闪着复杂的光芒",
            "眼中流露出名为", "笑意未达眼底", "眼神深邃", "眼神锐利", "眼神坚定", "眼神热切",
            "瞳孔剧烈收缩", "瞳孔收缩", "瞳孔猛地一缩",
            "深邃的眸子", "淬毒的眸子", "锐利的眼睛",
            "脸上浮现出一抹", "脸上堆满了笑", "脸上带着笑意",
            "轮廓分明的下颌", "修长的手指", "骨节分明的手", "指节泛白",
            "微微挑眉", "目光里毫不遮掩",
            "喉结滚动", "喉结上下滚动", "喉结",
            "舔了舔嘴唇", "舔了舔干裂的嘴唇", "舔了舔唇", "抿了抿唇",
            "像一记重锤", "像一盆冰水", "像一把精准的刻刀", "像千年寒冰",
            "像一根滚烫的钢针", "像淬了毒的匕首", "像个破布娃娃般被抽飞",
            "像在看一个已经死透的人", "却比西伯利亚的寒风还要冰冷",
            "嘴巴张得能塞下一个鸡蛋", "直接刺入心脏", "重重砸在心头",
            "时间仿佛被按下了暂停", "空气凝滞如铁", "让空气的温度都下降了几度",
            "心里某个地方软得一塌糊涂", "浑身上下都散发着一股",
            "破风箱般的荷荷声", "化作齑粉", "稳如磐石",
            "带着不容置疑的", "力道大得惊人",
            "死一般的寂静", "全场死寂", "死寂", "落针可闻", "鸦雀无声",
            "心中一凛", "心中一动", "心下了然", "心里隐隐有了猜测",
            "四肢百骸", "彻骨的冰寒", "不易察觉",
            "声音不大", "声音不高", "声音平直", "平静无波", "声音听不出情绪",
            "声音坚定", "冰冷的声音",
            "显得有些兴奋", "显得异常清晰", "无法用言语形容",
            "死死地", "缓缓地说", "精准地", "平静地", "激动地", "淡淡地应了一句",
            "淬了", "淬着", "淬毒", "涟漪", "深邃", "锐利",
            "凝住了", "凝固了", "凝滞了", "凝固",
            "毫无征兆", "戛然而止", "话锋一转",
            "取而代之", "取而代之的是", "不容置疑",
            "波涛汹涌", "行云流水", "不可估量",
            "不卑不亢", "近乎偏执",
            "以一种", "这不是...而是", "目光扫过", "深吸一口气",
            "他的嘴角微微上扬", "他的表情变暗"
        ].sort((a, b) => b.length - a.length);
    }

    getAiSuspiciousPatterns() {
        return [
            "嘴角[^。！？\\n]{0,12}?(勾|上扬|微不可|微微|露出|勾起|弯)",
            "眼中[^。！？\\n]{0,12}?(闪过|闪着|流露|有一丝|一丝)",
            "喉结[^。！？\\n]{0,8}?(动|滚|凸|一动)",
            "(指(关节|节)|手指)[^。！？\\n]{0,8}?(泛白|颤|发白)",
            "舔了?舔?嘴唇",
            "(死寂|全场死寂|落针可闻|鸦雀无声|死一般的寂静)",
            "(缓缓地|微不可察|微不可查|不易察觉)[^。！？\\n]{0,8}",
            "(眼神|目光)[^。！？\\n]{0,12}?(深邃|锐利|热切|复杂)",
            "(时间仿佛被按下了暂停|空气凝滞|仿佛被按下了暂停)"
        ];
    }

    getEffectiveAiWhitelist(project) {
        const projectList = project?.prompt_state?.ai_filter_whitelist;
        if (Array.isArray(projectList) && projectList.length) {
            return projectList;
        }
        return [
            "他笑了",
            "她笑了",
            "他看着窗外",
            "她看着窗外",
            "看着远方",
            "看着对方",
            "沉默了一会",
            "没人说话",
            "屋里很安静"
        ];
    }

    getEffectiveAiBlacklist(project) {
        const projectList = project?.prompt_state?.ai_filter_blacklist;
        if (Array.isArray(projectList) && projectList.length) {
            return projectList;
        }
        return [
            "指节泛白",
            "喉结滚动",
            "舔了舔嘴唇",
            "全场死寂",
            "空气凝滞",
            "时间仿佛被按下了暂停",
            "像一记重锤",
            "眼中闪过一丝",
            "嘴角勾起一抹弧度"
        ];
    }

    getAiWhitelist(project) {
        const projectList = project?.prompt_state?.ai_filter_whitelist;
        return Array.isArray(projectList) && projectList.length
            ? projectList
            : ["他笑了", "她笑了", "看着窗外", "看着远方"];
    }

    getAiBlacklist(project) {
        const projectList = project?.prompt_state?.ai_filter_blacklist;
        return Array.isArray(projectList) && projectList.length
            ? projectList
            : ["指关节泛白", "喉结滚动", "舔了舔嘴唇", "全场死寂"];
    }

    splitSentencesForAiFilter(text) {
        const matches = String(text || "").match(/[^。！？\n]+[。！？]?|\n/g);
        return matches && matches.length ? matches : [String(text || "")];
    }

    preserveSentenceEnding(original, rewritten) {
        const trimmed = String(rewritten || "").trim();
        if (!trimmed) {
            return original;
        }
        const match = String(original || "").match(/[。！？…]$/);
        if (match && !/[。！？…]$/.test(trimmed)) {
            return `${trimmed}${match[0]}`;
        }
        return trimmed;
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
            /揭露在第\s*(\d+)\s*章/g,
            /直到第\s*(\d+)\s*章才(?:揭露|知道|发现)/g,
            /在第\s*(\d+)\s*章揭晓/g,
            /隐藏.*?第\s*(\d+)\s*章/g
        ];

        patterns.forEach((pattern) => {
            for (const match of text.matchAll(pattern)) {
                found.push(Number(match[1]));
            }
        });

        const sensitiveWords = ["怀孕", "身世", "真实身份", "双重身份", "秘密", "隐藏"].filter((word) => text.includes(word));
        if (!found.length && !sensitiveWords.length) {
            return "";
        }

        const earliestReveal = found.length ? Math.min(...found) : null;
        const lines = [
            "【剧透与秘密保护】",
            "严禁在未明确允许的章节提前揭露重大秘密、真实身份、身世、怀孕等信息。"
        ];

        if (earliestReveal) {
            lines.push(`检测到最早揭露节点可能在第 ${earliestReveal} 章。`);
            if (chapterNumber && chapterNumber < earliestReveal) {
                lines.push(`当前是第 ${chapterNumber} 章，在揭露节点前只能保持模糊暗示，禁止确认性揭示。`);
            }
        }
        if (sensitiveWords.length) {
            lines.push(`敏感设定关键词：${sensitiveWords.join("、")}`);
        }

        return lines.join("\n");
    }

    buildStoryStateGuard(project) {
        const storyState = project.outline?.story_state || project.story_state || {};
        const lines = [];
        if (storyState.current_location) lines.push(`当前地点：${storyState.current_location}`);
        if (storyState.timeline) lines.push(`当前时间线：${Utils.summarizeText(storyState.timeline, 120)}`);
        if (storyState.important_items) lines.push(`重要物品：${Utils.summarizeText(storyState.important_items, 120)}`);
        if (storyState.pending_plots) lines.push(`待推进事项：${Utils.summarizeText(storyState.pending_plots, 140)}`);
        const names = Object.keys(storyState.characters || {}).slice(0, 8);
        if (names.length) {
            lines.push(`角色状态：${names.map((name) => `${name}(${Utils.summarizeText(JSON.stringify(storyState.characters[name]), 32)})`).join("、")}`);
        }
        return lines.length ? `【当前故事状态（必须延续）】\n${lines.join("\n")}` : "";
    }

    getOrderedChapterRecords(project) {
        const all = [];
        (project?.outline?.volumes || []).forEach((volume, volumeIndex) => {
            (volume?.chapters || []).forEach((chapter) => {
                all.push({
                    volumeIndex,
                    volumeNumber: volumeIndex + 1,
                    volumeTitle: volume.title || `第${volumeIndex + 1}卷`,
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
            .split(/(?<=[。！？!?…])/)
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
            setup.state_setup ? `状态：${setup.state_setup}` : "",
            setup.atmosphere_setup ? `氛围：${setup.atmosphere_setup}` : "",
            setup.suspense_hook ? `悬念：${setup.suspense_hook}` : "",
            setup.clue_hint ? `线索：${setup.clue_hint}` : "",
            setup.countdown ? `倒计时：${setup.countdown}` : ""
        ].filter(Boolean);
        return parts.join("；");
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
        const scene = snapshot.current_location || snapshot["位置"] || "";
        const timeline = snapshot.timeline || snapshot["时间"] || "";

        return [
            "【开篇接力棒】",
            `承接来源：第${previousChapter.number}章《${previousChapter.title || "未命名章节"}》`,
            "这里只提供结果、现场和未完事项，不提供可复述原句；本章开头必须继续往前写。",
            previousCore ? `- 上章已完成结果：${Utils.summarizeText(previousCore, 110)}` : "",
            scene ? `- 当前现场地点：${Utils.summarizeText(scene, 40)}` : "",
            timeline ? `- 当前现场时间：${Utils.summarizeText(timeline, 40)}` : "",
            tailAction ? `- 上章最后动作/画面：${tailAction}` : "",
            unresolved ? `- 当前仍未处理：${Utils.summarizeText(unresolved, 90)}` : "",
            hook ? `- 本章必须立刻接住：${Utils.summarizeText(hook, 110)}` : "",
            "硬规则：",
            "1. 第一段直接进入现场动作、对白或即时反应，不要先写前情回顾。",
            "2. 不要把上一章已完成结果再写成调查、解释、推理或大段复盘。",
            "3. 如果需要过桥，只能用很短的动作过渡，不能整段复述上一章。"
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
            "【开头防重复硬约束】",
            "1. 本章前3段必须直接承接上一章最后一个动作、情绪或状态变化，不要重新铺一遍上一章已经完成的主事件。",
            "2. 如果必须回顾上一章，最多只允许 1-2 句，而且只能作为承接，绝不能把上章核心发现重讲成大段前情。",
            "3. 上一章已经发生并确认过的核心信息，不能在本章开头重新推理、重新解释、重新铺陈。"
        ];

        if (previousCore) {
            lines.push(`上一章已完成核心事件：${Utils.summarizeText(previousCore, 130)}`);
        }
        if (previousHook) {
            lines.push(`上一章留给本章的承接钩子：${Utils.summarizeText(previousHook, 120)}`);
        }
        if (endingFocus) {
            lines.push(`上一章结尾动作锚点：${endingFocus}`);
        }
        lines.push("本章开头要从这些已知结果继续往前写，而不是再讲一遍它们是怎么发生的。");

        return lines.join("\n");
    }

    buildStoryStateSummary(project, volumeNumber, chapterNumber, contextText = "") {
        const lines = [];
        const previousChapter = this.getLatestChapterBefore(project, volumeNumber, chapterNumber);
        if (previousChapter) {
            const previousBrief = previousChapter.keyEvent
                || Utils.summarizeText(previousChapter.summary, 120)
                || previousChapter.title;
            lines.push(`上一章进度：第${previousChapter.number}章《${previousChapter.title || "未命名"}》 -> ${previousBrief}`);
            if (previousChapter.emotionCurve) {
                lines.push(`上一章情绪尾调：${Utils.summarizeText(previousChapter.emotionCurve, 60)}`);
            }
            const previousSetup = this.describeNextChapterSetup(previousChapter.nextChapterSetup);
            if (previousSetup) {
                lines.push(`上一章留下的下章铺垫：${Utils.summarizeText(previousSetup, 120)}`);
            }
        }

        const { snapshot } = this.getSnapshotBeforeChapter(project, chapterNumber);
        if (snapshot) {
            if (snapshot.current_location || snapshot["位置"]) {
                lines.push(`承接地点：${snapshot.current_location || snapshot["位置"]}`);
            }
            if (snapshot.timeline || snapshot["时间"]) {
                lines.push(`承接时间：${Utils.summarizeText(snapshot.timeline || snapshot["时间"], 80)}`);
            }
            if (snapshot.pending_plots) {
                lines.push(`未完事项：${Utils.summarizeText(snapshot.pending_plots, 90)}`);
            }
            if (snapshot.important_items) {
                lines.push(`重要物品状态：${Utils.summarizeText(snapshot.important_items, 90)}`);
            }
        }

        const storyState = project?.outline?.story_state || project?.story_state || {};
        if (storyState.current_location && !lines.some((line) => line.startsWith("承接地点："))) {
            lines.push(`当前地点：${storyState.current_location}`);
        }
        if (storyState.timeline && !lines.some((line) => line.startsWith("承接时间："))) {
            lines.push(`当前时间线：${Utils.summarizeText(storyState.timeline, 80)}`);
        }
        if (storyState.pending_plots && !lines.some((line) => line.startsWith("未完事项："))) {
            lines.push(`待推进事项：${Utils.summarizeText(storyState.pending_plots, 100)}`);
        }

        const unresolvedForeshadows = Object.values(project?.foreshadow_tracker?.foreshadows || {})
            .filter((item) => item && item["状态"] !== "已回收")
            .slice(0, 4)
            .map((item) => item["伏笔内容"] || item.content || "")
            .filter(Boolean);
        if (unresolvedForeshadows.length) {
            lines.push(`未回收伏笔：${unresolvedForeshadows.map((item) => Utils.summarizeText(item, 22)).join("、")}`);
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
            "【相关角色即时状态（不要串台）】",
            "以下角色的位置、伤势、关系和知情范围彼此独立，不能把一个人的状态写到另一个人身上。"
        ];

        names.forEach((name) => {
            const outlineCharacter = characterMap.get(name) || {};
            const storyState = storyStateCharacters[name] || compatibilityCharacters[name] || {};
            const checkerState = checkerStates[name] || {};
            const dynamicState = dynamicStates[name] || {};
            const appearanceState = appearanceStates[name] || {};
            const declarationItems = Array.isArray(dialogueDeclarations[name]) ? dialogueDeclarations[name] : [];
            const recentDeclaration = declarationItems
                .filter((item) => !chapterNumber || Number(item.chapter_num || item.chapter || item["章节"] || 0) < chapterNumber)
                .slice(-1)
                .map((item) => item.content || item["内容"] || "")
                .find(Boolean) || "";

            const parts = [];
            const identity = firstText(
                outlineCharacter.identity,
                outlineCharacter["身份"],
                appearanceState.identity,
                appearanceState["身份"]
            );
            const location = firstText(
                storyState.location,
                storyState.current_location,
                storyState["当前位置"],
                checkerState.location,
                checkerState.current_location,
                checkerState["当前位置"],
                dynamicState.location,
                dynamicState.current_location,
                dynamicState["当前位置"]
            );
            const status = firstText(
                storyState.status,
                storyState.current_status,
                storyState["状态"],
                checkerState.status,
                checkerState.current_status,
                checkerState["当前状态"],
                dynamicState.status,
                dynamicState.current_status,
                dynamicState["当前状态"]
            );
            const cultivation = firstText(
                storyState.cultivation,
                storyState["修为"],
                checkerState.cultivation,
                checkerState["修为"],
                dynamicState.cultivation,
                dynamicState["修为"]
            );
            const goal = firstText(
                storyState.goals,
                storyState.goal,
                storyState["目标"],
                dynamicState.goals,
                dynamicState.goal,
                outlineCharacter.goals,
                outlineCharacter["目标动机"]
            );
            const relationships = firstText(
                storyState.relationships,
                storyState["关系变化"],
                dynamicState.relationships,
                dynamicState["关系变化"],
                outlineCharacter.relationships,
                outlineCharacter["人物关系"]
            );
            const secrets = firstText(
                storyState.secrets,
                storyState["知晓的秘密"],
                dynamicState.secrets,
                dynamicState["知晓的秘密"]
            );
            const appearance = firstText(
                appearanceState.current_appearance,
                appearanceState["当前形象"],
                appearanceState["外貌形象/伪装当前状态"],
                storyState.appearance_changes,
                storyState["外貌形象/伪装当前状态"],
                dynamicState.appearance,
                dynamicState["当前形象"]
            );

            if (identity) parts.push(`身份=${Utils.summarizeText(identity, 18)}`);
            if (location) parts.push(`位置=${Utils.summarizeText(location, 24)}`);
            if (status) parts.push(`状态=${Utils.summarizeText(status, 24)}`);
            if (cultivation) parts.push(`实力=${Utils.summarizeText(cultivation, 18)}`);
            if (goal) parts.push(`目标=${Utils.summarizeText(goal, 24)}`);
            if (relationships) parts.push(`关系=${Utils.summarizeText(relationships, 22)}`);
            if (secrets) parts.push(`知情=${Utils.summarizeText(secrets, 20)}`);
            if (appearance) parts.push(`形象=${Utils.summarizeText(appearance, 18)}`);
            if (recentDeclaration) parts.push(`近期表态=${Utils.summarizeText(recentDeclaration, 18)}`);

            if (parts.length) {
                lines.push(`- ${name}：${parts.join("；")}`);
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
        const lines = ["【下章铺垫承接规则】"];
        if (setupText) {
            lines.push(`上一章明确留下的铺垫：${Utils.summarizeText(setupText, 160)}`);
        } else {
            const previousBrief = previousChapter.keyEvent
                || Utils.summarizeText(previousChapter.summary, 100)
                || previousChapter.title;
            lines.push(`上一章结尾重点：${Utils.summarizeText(previousBrief, 100)}`);
        }
        if (previousChapter.emotionCurve) {
            lines.push(`上一章情绪尾调：${Utils.summarizeText(previousChapter.emotionCurve, 70)}`);
        }
        if (currentText) {
            lines.push(`当前待写内容：${Utils.summarizeText(currentText, 150)}`);
        }
        lines.push("本次内容开头必须先接住上一章结尾留下的状态、氛围、悬念或未完事项，再展开新的推进。");
        lines.push("上一章已经发生的事件，不要再写成“即将发生”“正要发生”或重复发生。");
        lines.push("如果上章到本章之间需要过桥动作，请自然补上，不要生硬跳切。");
        return lines.join("\n");
    }

    containsSpoilerStyleHook(text) {
        const value = String(text || "").trim();
        if (!value) {
            return false;
        }
        const patterns = [
            /下章/,
            /下一章/,
            /将会/,
            /即将/,
            /马上(?:就)?会/,
            /随后(?:就)?会/,
            /身份(?:即将|将要|就要)?曝光/,
            /真相(?:即将|将要|就要)?大白/,
            /敌人(?:即将|将要|就要)?来袭/,
            /将获得/,
            /将死去/,
            /将突破/,
            /将揭露/,
            /将揭晓/
        ];
        return patterns.some((pattern) => pattern.test(value));
    }

    toHookStyleText(text) {
        const source = String(text || "").trim();
        if (!source) {
            return "";
        }

        let output = source
            .replace(/下一章[^。！？\n]*[。！？]?/g, "")
            .replace(/下章[^。！？\n]*[。！？]?/g, "")
            .replace(/将会|即将|马上(?:就)?会|随后(?:就)?会|就要/g, "")
            .replace(/身份曝光/g, "身份疑云浮动")
            .replace(/真相大白/g, "真相的裂缝露了出来")
            .replace(/敌人来袭/g, "远处异动逼近")
            .replace(/将获得[^，。！？\n]*/g, "隐约感到某种机缘正在逼近")
            .replace(/将突破[^，。！？\n]*/g, "体内的变化已经压不住")
            .replace(/将揭露[^，。！？\n]*/g, "异样的线索正在逼近核心")
            .replace(/将揭晓[^，。！？\n]*/g, "答案仿佛只差最后一层")
            .replace(/\s+/g, " ")
            .trim();

        output = output.replace(/^[，。；：、\s]+|[，；：、\s]+$/g, "").trim();
        if (!output) {
            output = "异样已经逼近，却还没人看清真正会发生什么。";
        }
        if (!/[。！？]$/.test(output)) {
            output += "。";
        }
        return output;
    }

    replaceSummarySection(summary, sectionTitle, transformer) {
        const text = String(summary || "");
        if (!text.trim()) {
            return text;
        }
        const pattern = new RegExp(`(【${sectionTitle}】)([\\s\\S]*?)(?=\\n【|$)`);
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
        const match = text.match(new RegExp(`【${sectionTitle}】([\\s\\S]*?)(?=\\n【|$)`));
        return match?.[1] ? String(match[1]).trim() : "";
    }

    buildFallbackProgressLines(item = {}, coreEvent = "") {
        const base = String(coreEvent || item.key_event || "").trim() || `围绕《${item.title || "当前章节"}》推进主线事件`;
        const progress = [
            `1.【承接】先承接上一章留下的状态、人物情绪与未完事项，把本章矛盾自然接起来，并让主角明确本章要处理的核心问题。`,
            `2.【推进】围绕“${Utils.summarizeText(base, 36)}”展开行动，让人物通过对话、博弈、观察或行动把局势往前推一步。`,
            `3.【受阻】在推进过程中加入新的阻力、误判、代价或局势变化，避免一条线平推到底，让本章中段真正形成波折。`,
            `4.【变化】让人物关系、信息认知、资源状态或场上局势发生实质变化，使本章读完后能看出主线确实前进了。`,
            `5.【收束】在本章结尾收住本章阶段结果，同时留下能被下一章直接接住的状态变化、悬念或余波。`
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
                .map((line) => line.startsWith("- ") ? line : `- ${line.replace(/^[•\-]\s*/, "")}`);
            return lines.join("\n");
        }

        const characters = Utils.ensureArrayFromText(item.characters);
        if (characters.length) {
            return characters.slice(0, 8).map((name) => `- ${name}（本章相关人物）`).join("\n");
        }

        return "- 主角（承接当前主线）";
    }

    normalizeForeshadowSection(item = {}, existingSection = "") {
        const existing = String(existingSection || "").trim();
        if (existing) {
            return existing;
        }
        const foreshadows = Utils.ensureArrayFromText(item.foreshadows);
        if (foreshadows.length) {
            return [
                `- 新埋：${foreshadows.slice(0, 2).join("；")}`,
                "- 回收：如无明确回收点，可在正文中通过细节呼应前文伏笔"
            ].join("\n");
        }
        return "- 新埋：结合当前冲突埋下轻度悬念或信息差\n- 回收：如有前文伏笔，可在本章做轻度呼应";
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
            if (/^\d+\.\s*【.+?】/.test(line)) {
                return line;
            }
            const cleaned = line.replace(/^[•\-]\s*/, "");
            return `${index + 1}.【推进】${cleaned}`;
        });

        while (normalized.length < 5) {
            const fallbackLines = this.buildFallbackProgressLines(item, coreEvent).split("\n");
            normalized.push(fallbackLines[normalized.length] || `${normalized.length + 1}.【推进】围绕当前主线继续推进，并补足必要的过程细节。`);
        }

        return normalized.slice(0, 5).join("\n");
    }

    normalizeSystem9Summary(item = {}) {
        const source = String(item.summary || "").trim();
        const chapterTitle = String(item.title || `第${item.chapter_number || item.number || "?"}章`).trim();
        const rawGoal = this.extractSummarySection(source, "章节目标");
        const rawCharacters = this.extractSummarySection(source, "出场人物");
        const rawScene = this.extractSummarySection(source, "场景");
        const rawCoreEvent = this.extractSummarySection(source, "核心事件");
        const rawEmotion = this.extractSummarySection(source, "情绪曲线");
        const rawProgress = this.extractSummarySection(source, "情节推进");
        const rawForeshadow = this.extractSummarySection(source, "伏笔处理");
        const rawHook = this.extractSummarySection(source, "下章铺垫");

        const coreEvent = String(rawCoreEvent || item.key_event || "").trim()
            || `${chapterTitle}围绕当前卷主线展开新的关键推进，并推动人物关系或局势发生明确变化。`;
        const goal = String(rawGoal || "").trim()
            || `围绕“${Utils.summarizeText(coreEvent, 30)}”推进本章主目标，并让当前矛盾取得阶段性结果。`;
        const scene = String(rawScene || "").trim()
            || "当前卷主场景中与本章冲突直接相关的地点，气氛需要服务本章主要矛盾。";
        const emotion = String(rawEmotion || item.emotion_curve || "").trim()
            || "承压→对抗→余波";
        const characters = this.normalizeCharacterSection(item, rawCharacters);
        const progress = this.normalizeProgressSection(item, rawProgress, coreEvent);
        const foreshadow = this.normalizeForeshadowSection(item, rawForeshadow);
        const hookRaw = String(rawHook || "").trim()
            || this.toHookStyleText(
                item.next_chapter_setup?.suspense_hook
                || item.next_chapter_setup?.state_setup
                || item.next_chapter_setup?.atmosphere_setup
                || "本章收尾后，异样已经逼近，但真正的变化还没有完全揭开。"
            );
        const hook = this.containsSpoilerStyleHook(hookRaw) ? this.toHookStyleText(hookRaw) : hookRaw;

        return [
            `【章节目标】\n${goal}`,
            `【出场人物】\n${characters}`,
            `【场景】\n${scene}`,
            `【核心事件】\n${coreEvent}`,
            `【情绪曲线】\n${emotion}`,
            `【情节推进】\n${progress}`,
            `【伏笔处理】\n${foreshadow}`,
            `【下章铺垫】\n${hook}`
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

        let summary = this.replaceSummarySection(item.summary || "", "下章铺垫", (body) => {
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
        body = body.replace(/\n?(?:龙套角色[:：][\s\S]*?)(?:<<<END_EXTRA>>>|\s*$)/u, "").trimEnd();
        body = body.replace(/\n?(?:临时支线[:：][\s\S]*?)(?:<<<END_EXTRA>>>|\s*$)/u, "").trimEnd();
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
                lines.push(`${category}：${entries.join("、")}`);
            }
        });

        const synopsisData = project.synopsisData || project.synopsis_data || {};
        Object.entries(synopsisData.locked_character_names || {}).slice(0, 12).forEach(([name, info]) => {
            const identity = info?.identity || info?.type || "";
            lines.push(`锁定角色：${name}${identity ? `（${identity}）` : ""}`);
        });

        Object.entries(synopsisData.main_characters || {}).slice(0, 8).forEach(([role, name]) => {
            if (name) {
                lines.push(`主角映射：${role} = ${name}`);
            }
        });

        return lines.length ? `【名称锁定（禁止漂移）】\n${lines.join("\n")}` : "";
    }

    buildTimelineGuard(project, chapterNumber) {
        const tracker = project.timeline_tracker || {};
        const lines = [];

        (tracker.timeline_events || []).slice(-6).forEach((item) => {
            lines.push(`第${item.chapter || item["章节"] || "?"}章：${item.time_point || item["时间点"] || item.event || item["事件"] || ""}`);
        });

        const active = (tracker.time_constraints || [])
            .filter((item) => !chapterNumber || !item["预计完成章节"] || Number(item["预计完成章节"]) >= chapterNumber)
            .slice(0, 5)
            .map((item) => `${item["设定"] || item.constraint_desc || ""}（持续：${item["持续时间"] || item.duration_desc || ""}）`);
        if (active.length) {
            lines.push(`时间约束：${active.join("、")}`);
        }

        return lines.length ? `【时间线约束】\n${lines.join("\n")}` : "";
    }

    buildForeshadowGuard(project, chapterNumber) {
        const tracker = project.foreshadow_tracker?.foreshadows || {};
        const unresolved = Object.values(tracker)
            .filter((item) => item && item["状态"] !== "已回收")
            .sort((a, b) => Number(a["埋设章节"] || 0) - Number(b["埋设章节"] || 0))
            .slice(0, 8);

        if (!unresolved.length) {
            return "";
        }

        const lines = unresolved.map((item) => {
            const planned = item["计划回收"] ? `，计划回收：${item["计划回收"]}` : "";
            return `- 第${item["埋设章节"] || "?"}章埋设【${item["伏笔类型"] || "伏笔"}】：${item["伏笔内容"] || ""}${planned}`;
        });
        if (chapterNumber) {
            lines.push(`当前第 ${chapterNumber} 章，可适度呼应接近节点的伏笔，但不要一次性清空。`);
        }
        return `【伏笔追踪】\n${lines.join("\n")}`;
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
            "【人物性格一致性约束（自动生成）】",
            "1. 对话必须符合人物既有性格，不要突然变口风。",
            "2. 高冷角色不要突然变话痨，古灵精怪角色不要突然爆粗口。",
            "3. 每个角色都要保留自己的说话特点和情绪习惯。"
        ];

        entries.forEach(([name, data]) => {
            const base = data?.当前性格 || data?.原始设定 || data?.personality || "";
            const change = chapterNumber && data?.personality_changes?.[chapterNumber]
                ? `；本章前已演变为：${data.personality_changes[chapterNumber]}`
                : "";
            lines.push(`- ${name}：${Utils.summarizeText(base, 80)}${change}`);
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
                const firstAppearance = data["首次出场"] || data["出场章节"] || data.chapter || "?";
                const identity = data["身份"] || data.identity || "未知";
                const currentAppearance = data["当前形象"] || data.current_appearance || "";
                const realAppearance = data["真实形象"] || data.real_appearance || "";
                const recentChange = Array.isArray(data["变化历史"]) && data["变化历史"].length
                    ? data["变化历史"][data["变化历史"].length - 1]
                    : null;
                const changeText = recentChange?.["类型"] || recentChange?.change_type
                    ? `，最近变化=${recentChange["类型"] || recentChange.change_type}`
                    : "";
                const appearanceText = currentAppearance
                    ? `，当前形象=${Utils.summarizeText(currentAppearance, 50)}`
                    : "";
                const truthText = realAppearance && realAppearance !== currentAppearance
                    ? `，真实形象=${Utils.summarizeText(realAppearance, 40)}`
                    : "";
                lines.push(`- ${name}：首次出场第${firstAppearance}章，身份=${identity}${appearanceText}${truthText}${changeText}`);
            });

        Object.entries(relationships)
            .slice(0, 8)
            .forEach(([key, rel]) => {
                const firstMeeting = rel["首次见面"] || rel.first_meeting || "?";
                const relation = rel["关系"] || rel.relationship || "相识";
                const [left, right] = String(key).split("|");
                if (!left || !right) {
                    return;
                }
                if (relevantNames.size && !relevantNames.has(left) && !relevantNames.has(right)) {
                    return;
                }
                if (!chapterNumber || Number(firstMeeting) < chapterNumber) {
                    lines.push(`- ${left} 与 ${right} 于第${firstMeeting}章已见面，关系：${relation}。不可再写成初见。`);
                }
            });

        return lines.length ? `【人物出场与关系追踪】\n${lines.join("\n")}` : "";
    }

    buildDialogueGuard(project, chapterNumber) {
        const declarations = project.dialogue_tracker?.declarations || {};
        const lines = [];
        Object.entries(declarations).slice(0, 8).forEach(([name, items]) => {
            if (!Array.isArray(items) || !items.length) {
                return;
            }
            const filtered = items
                .filter((item) => !chapterNumber || Number(item.chapter_num || item["章节"] || 0) < chapterNumber)
                .slice(-2)
                .map((item) => item.content || item["内容"] || "")
                .filter(Boolean);
            if (filtered.length) {
                lines.push(`- ${name}：此前明确表态/声明 -> ${filtered.join("；")}`);
            }
        });
        return lines.length ? `【角色言行一致性】\n${lines.join("\n")}` : "";
    }

    buildDynamicStateGuard(project) {
        const tracker = project.dynamic_tracker || {};
        const lines = [];

        const items = Object.values(tracker.items || {}).slice(0, 6).map((item) =>
            `${item["名称"] || "物品"}(${item["持有者"] || "未知持有者"}，状态=${item["当前状态"] || "未知"}${item["类型"] ? `，类型=${item["类型"]}` : ""}${item["描述"] ? `，说明=${Utils.summarizeText(item["描述"], 24)}` : ""})`
        );
        if (items.length) {
            lines.push(`物品状态：${items.join("、")}`);
        }

        const skills = Object.values(tracker.skills || {}).slice(0, 6).map((skill) =>
            `${skill["名称"] || "技能"}(${skill["使用者"] || "未知"}，熟练度=${skill["熟练度"] || "未知"})`
        );
        if (skills.length) {
            lines.push(`技能状态：${skills.join("、")}`);
        }

        const appearances = Object.entries(tracker.appearances || {}).slice(0, 6).map(([name, data]) =>
            `${name}(当前形象=${data["当前形象"] || data["初始形象"] || "未知"})`
        );
        if (appearances.length) {
            lines.push(`外貌状态：${appearances.join("、")}`);
        }

        const charStates = Object.entries(tracker.character_states || {}).slice(0, 6).map(([name, data]) =>
            `${name}=${Utils.summarizeText(JSON.stringify(data), 80)}`
        );
        if (charStates.length) {
            lines.push(`人物动态：${charStates.join("、")}`);
        }

        return lines.length ? `【动态状态追踪】\n${lines.join("\n")}` : "";
    }

    buildWorldTrackerGuard(project) {
        const tracker = project.world_tracker || {};
        const lines = [];

        const locations = Object.entries(tracker.locations || {}).slice(0, 6).map(([name, data]) =>
            `${name}(${Utils.summarizeText(JSON.stringify(data), 60)})`
        );
        if (locations.length) {
            lines.push(`地点状态：${locations.join("、")}`);
        }

        const organizations = Object.entries(tracker.organizations || {}).slice(0, 6).map(([name, data]) =>
            `${name}(${Utils.summarizeText(JSON.stringify(data), 60)})`
        );
        if (organizations.length) {
            lines.push(`势力状态：${organizations.join("、")}`);
        }

        const movements = (tracker.character_positions || tracker.character_movements || []);
        if (Array.isArray(movements) && movements.length) {
            lines.push(`人物位置/移动：${movements.slice(-6).map((item) => Utils.summarizeText(JSON.stringify(item), 40)).join("、")}`);
        }

        const worldEvents = (tracker.world_events || tracker.major_events || []);
        if (Array.isArray(worldEvents) && worldEvents.length) {
            lines.push(`世界事件：${worldEvents.slice(-5).map((item) => Utils.summarizeText(JSON.stringify(item), 50)).join("、")}`);
        }

        return lines.length ? `【世界观追踪约束】\n${lines.join("\n")}` : "";
    }

    buildGenreProgressGuard(project) {
        const tracker = project.genre_progress_tracker || {};
        const lines = [];

        const rankProgress = Object.entries(tracker.rank_progress || {})
            .slice(-5)
            .map(([name, data]) => `${name}=${data.rank || data.detail || "暂无"}`);
        if (rankProgress.length) {
            lines.push(`题材进度-位阶/修为：${rankProgress.join("、")}`);
        }

        const pregnancyProgress = Object.entries(tracker.pregnancy_progress || {})
            .slice(-4)
            .map(([name, data]) => `${name}=${data.months ? `${data.months}个月` : ""}${data.status ? `(${data.status})` : ""}${data.detail ? ` ${data.detail}` : ""}`.trim());
        if (pregnancyProgress.length) {
            lines.push(`题材进度-怀孕/阶段状态：${pregnancyProgress.join("、")}`);
        }

        const statusProgress = Object.entries(tracker.status_progress || {})
            .slice(-5)
            .map(([name, data]) => `${name}=${data.detail || "暂无"}`);
        if (statusProgress.length) {
            lines.push(`题材进度-其他状态：${statusProgress.join("、")}`);
        }

        const progressEvents = (tracker.progress_events || [])
            .slice(-6)
            .map((item) => `${item.role || "角色"}：${item.detail || ""}`)
            .filter(Boolean);
        if (progressEvents.length) {
            lines.push(`最近题材进度变化：${progressEvents.join("、")}`);
        }

        return lines.length ? `【题材进度追踪】\n${lines.join("\n")}` : "";
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
            .split(/[\n,，、；;]/)
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
                        const name = item.reward || item.name || item.item || item.title || item["名称"] || "";
                        if (!String(name || "").trim()) {
                            return null;
                        }
                        return {
                            reward: String(name || "").trim(),
                            name: String(name || "").trim(),
                            owner: String(item.owner || item.holder || item["持有者"] || item["归属"] || "").trim(),
                            status: String(item.status || item["当前状态"] || item["状态"] || "").trim(),
                            source: String(item.source || item["来源"] || "").trim(),
                            detail: String(item.detail || item.description || item["描述"] || name || "").trim(),
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
                system_name: String(panel.system_name || panel.name || panel["系统名"] || "").trim(),
                owner: String(panel.owner || panel.host || panel.user || panel["宿主"] || "").trim(),
                messages: this.normalizeWorldStateList(panel.messages || panel.logs || panel.broadcasts || panel["系统播报"]),
                rewards: normalizeRewardList(panel.rewards),
                benefits: this.normalizeWorldStateList(panel.benefits || panel.privileges || panel.perks || panel["特权"]),
                rules: this.normalizeWorldStateList(panel.rules || panel["规则"] || panel["核心规则"]),
                functions: this.normalizeWorldStateList(panel.functions || panel.features || panel["功能"]),
                statuses: this.normalizeWorldStateList(panel.statuses || panel["状态"] || panel["系统状态"]),
                pending_unlocks: this.normalizeWorldStateList(panel.pending_unlocks || panel.pending || panel["待解锁"] || panel["未解锁"]),
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
                if (data.identity) parts.push(`身份=${Utils.summarizeText(data.identity, 18)}`);
                if (data.location) parts.push(`位置=${Utils.summarizeText(data.location, 22)}`);
                if (data.status) parts.push(`状态=${Utils.summarizeText(data.status, 22)}`);
                if (data.cultivation) parts.push(`位阶=${Utils.summarizeText(data.cultivation, 18)}`);
                if (data.organization) parts.push(`归属=${Utils.summarizeText(data.organization, 18)}`);
                if (data.relationships) parts.push(`关系=${Utils.summarizeText(data.relationships, 22)}`);
                if (data.note) parts.push(`补充=${Utils.summarizeText(data.note, 20)}`);
                return parts.length ? `- ${name}：${parts.join("；")}` : "";
            })
            .filter(Boolean)
            .slice(0, 6);

        const focusOrganizations = new Set(
            focusNames.flatMap((name) => {
                const text = String(characters[name]?.organization || "").trim();
                return text ? text.split(/[，、,\/]/).map((item) => item.trim()).filter(Boolean) : [];
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
                if (data.type) parts.push(`类型=${data.type}`);
                if (data.leader) parts.push(`核心=${data.leader}`);
                if (Array.isArray(data.members) && data.members.length) parts.push(`成员=${data.members.slice(0, 5).join("、")}`);
                if (data.latest_change) parts.push(`变化=${Utils.summarizeText(data.latest_change, 28)}`);
                if (data.note) parts.push(`补充=${Utils.summarizeText(data.note, 20)}`);
                return parts.length ? `- ${name}：${parts.join("；")}` : "";
            })
            .filter(Boolean);

        const itemLines = Object.entries(items)
            .sort((left, right) => Number(right[1]?.last_updated_chapter || 0) - Number(left[1]?.last_updated_chapter || 0))
            .slice(0, 4)
            .map(([name, data]) => {
                const holder = data.持有者 || data.holder || data.owner || "";
                const status = data.当前状态 || data.status || "";
                const type = data.类型 || data.type || "";
                const parts = [holder ? `归属=${holder}` : "", status ? `状态=${status}` : "", type ? `类型=${type}` : "", data.note ? `补充=${Utils.summarizeText(data.note, 20)}` : ""]
                    .filter(Boolean);
                return parts.length ? `- ${name}：${parts.join("；")}` : "";
            })
            .filter(Boolean);
        const abilityLines = Object.entries(abilities)
            .sort((left, right) => Number(right[1]?.last_chapter || 0) - Number(left[1]?.last_chapter || 0))
            .slice(0, 3)
            .map(([name, data]) => {
                const parts = [data.owner ? `归属=${data.owner}` : "", data.level ? `位阶=${data.level}` : "", data.type ? `类型=${data.type}` : "", data.note ? `补充=${Utils.summarizeText(data.note, 20)}` : ""]
                    .filter(Boolean);
                return parts.length ? `- ${name}：${parts.join("；")}` : "";
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
                const parts = [rewardItem.owner ? `归属=${rewardItem.owner}` : "", rewardItem.status ? `状态=${rewardItem.status}` : "", rewardItem.source ? `来源=${rewardItem.source}` : ""]
                    .filter(Boolean);
                return parts.length ? `- ${name}：${parts.join("；")}` : "";
            })
            .filter(Boolean);
        const recentSystemMessages = systemPanel.messages.slice(-3).reverse();
        const systemRewardLines = systemPanel.rewards
            .slice()
            .sort((left, right) => Number(right.chapter || 0) - Number(left.chapter || 0))
            .slice(0, 4);
        const systemPanelLines = [];
        if (systemPanel.system_name || systemPanel.owner) {
            systemPanelLines.push(`- 面板=${[systemPanel.system_name || "系统面板", systemPanel.owner ? `宿主=${systemPanel.owner}` : ""].filter(Boolean).join("；")}`);
        }
        if (recentSystemMessages.length) {
            systemPanelLines.push(`- 最近播报=${recentSystemMessages.map((item) => Utils.summarizeText(item, 40)).join("｜")}`);
        }
        if (systemPanel.statuses.length) {
            systemPanelLines.push(`- 当前状态=${systemPanel.statuses.slice(-2).reverse().map((item) => Utils.summarizeText(item, 36)).join("｜")}`);
        }
        if (systemPanel.benefits.length) {
            systemPanelLines.push(`- 系统特权=${systemPanel.benefits.slice(0, 6).join("、")}`);
        }
        if (systemRewardLines.length) {
            systemPanelLines.push(`- 系统奖励=${systemRewardLines.map((item) => Utils.summarizeText(item.reward || item.name || "", 18)).filter(Boolean).join("、")}`);
        }
        if (systemPanel.rules.length) {
            systemPanelLines.push(`- 核心规则=${systemPanel.rules.slice(0, 2).map((item) => Utils.summarizeText(item, 40)).join("｜")}`);
        }
        if (systemPanel.functions.length) {
            systemPanelLines.push(`- 系统功能=${systemPanel.functions.slice(0, 3).join("、")}`);
        }
        if (systemPanel.pending_unlocks.length) {
            systemPanelLines.push(`- 待解锁=${systemPanel.pending_unlocks.slice(0, 3).join("、")}`);
        }

        const plotLines = [
            ...(Array.isArray(plotThreads.active) ? plotThreads.active.slice(0, 4).map((item) => `主线=${Utils.summarizeText(item, 34)}`) : []),
            ...(Array.isArray(plotThreads.temporary) ? plotThreads.temporary.slice(0, 3).map((item) => `支线=${Utils.summarizeText(item, 34)}`) : []),
            ...(Array.isArray(plotThreads.unresolved_foreshadows) ? plotThreads.unresolved_foreshadows.slice(0, 3).map((item) => `伏笔=${Utils.summarizeText(item, 36)}`) : [])
        ].slice(0, 8);

        const lines = [];
        if (meta.genre_profile || genreModules.length) {
            lines.push(`题材档案：${meta.genre_profile || "通用长篇连载"}${genreModules.length ? `；重点=${genreModules.join("、")}` : ""}`);
        }

        const timeAnchor = overview.current_time || "";
        const locationAnchor = overview.current_location || "";
        const chapterAnchor = Number(overview.latest_chapter || chapterNumber || 0);
        if (timeAnchor || locationAnchor || chapterAnchor) {
            lines.push(`当前时空锚点：${chapterAnchor ? `第${chapterAnchor}章后` : "当前"}${timeAnchor ? `；时间=${Utils.summarizeText(timeAnchor, 40)}` : ""}${locationAnchor ? `；地点=${Utils.summarizeText(locationAnchor, 30)}` : ""}`);
        }
        if (systemPanelLines.length) {
            lines.push(`系统面板：\n${systemPanelLines.join("\n")}`);
        }
        if (characterLines.length) {
            lines.push(`重点人物：\n${characterLines.join("\n")}`);
        }
        if (factionLines.length) {
            lines.push(`势力/部门：\n${factionLines.join("\n")}`);
        }
        if (itemLines.length || abilityLines.length || rewardLines.length) {
            lines.push(`关键物品/能力/奖励：\n${[...itemLines, ...abilityLines, ...rewardLines].join("\n")}`);
        }
        if (plotLines.length) {
            lines.push(`主线、支线与伏笔：${plotLines.join("；")}`);
        }
        if (overviewNotes.length) {
            lines.push(`手动总备注：${overviewNotes.join("；")}`);
        }
        if (hardRules.length) {
            lines.push(`硬性红线：${hardRules.join("；")}`);
        }
        if (customModules.length) {
            lines.push(`手动补充模块：${customModules.join("；")}`);
        }
        if (riskList.length) {
            lines.push(`连续性风险：${riskList.join("；")}`);
        }
        if (!lines.length) {
            return "";
        }

        lines.push("要求：本章动笔前先核对以上总表，再决定人物站位、称呼关系、物品归属、时间推进和结尾铺垫。");
        return `【世界状态总控】\n${lines.join("\n")}`;
    }

    buildSubplotGuard(project) {
        const subplots = Array.isArray(project.used_temp_subplots) ? project.used_temp_subplots.slice(-6) : [];
        if (!subplots.length) {
            return "";
        }

        return [
            "【支线剧情管理】",
            `当前活跃支线：${subplots.join("、")}`,
            "要求：本章如涉及支线，必须和主线行动或人物关系推进产生联系。",
            "要求：不要把同一条支线重复开一遍，也不要突然无因收束全部支线。"
        ].join("\n");
    }

    buildCharacterCheckerGuard(project) {
        const checker = project.character_checker || {};
        const states = checker.character_states || checker.states || {};
        const lines = [];

        Object.entries(states).slice(0, 8).forEach(([name, data]) => {
            const location = data.current_location || data.location || data["当前位置"] || "";
            const status = data.current_status || data.status || data["当前状态"] || "";
            const emotion = data.current_emotion || data.emotion || data["当前情绪"] || "";
            const summary = [location ? `位置=${location}` : "", status ? `状态=${status}` : "", emotion ? `情绪=${emotion}` : ""]
                .filter(Boolean)
                .join("，");
            if (summary) {
                lines.push(`- ${name}：${summary}`);
            }
        });

        return lines.length
            ? `【人物一致性检查】\n以下角色当前状态必须延续，不可瞬移、失忆、无故改口风：\n${lines.join("\n")}`
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
        if (latest.current_location || latest["位置"]) parts.push(`地点：${latest.current_location || latest["位置"]}`);
        if (latest.timeline || latest["时间"]) parts.push(`时间：${Utils.summarizeText(latest.timeline || latest["时间"], 80)}`);
        if (latest.pending_plots) parts.push(`待续矛盾：${Utils.summarizeText(latest.pending_plots, 90)}`);
        if (latest.important_items) parts.push(`重要物品：${Utils.summarizeText(latest.important_items, 80)}`);
        if (Array.isArray(latest["关键信息"]) && latest["关键信息"].length) parts.push(`关键信息：${latest["关键信息"].slice(0, 4).join("、")}`);
        if (latest["下一章预期"]) parts.push(`上章预期本章：${latest["下一章预期"]}`);
        if (latest.transition_focus) parts.push(`衔接重点：${Utils.summarizeText(latest.transition_focus, 80)}`);
        if (latest.next_chapter_setup && typeof latest.next_chapter_setup === "object") {
            const nextSetupParts = [
                latest.next_chapter_setup.state_setup ? `状态铺垫=${latest.next_chapter_setup.state_setup}` : "",
                latest.next_chapter_setup.atmosphere_setup ? `氛围铺垫=${latest.next_chapter_setup.atmosphere_setup}` : "",
                latest.next_chapter_setup.suspense_hook ? `悬念钩子=${latest.next_chapter_setup.suspense_hook}` : ""
            ].filter(Boolean);
            if (nextSetupParts.length) {
                parts.push(`快照内置下章任务：${nextSetupParts.join("；")}`);
            }
        }

        return parts.length
            ? `【章末快照衔接】\n最近快照：${targetKey}\n${parts.join("\n")}\n新章节要承接这些状态，不要无故跳变。`
            : "";
    }

    buildChapterTransitionGuide(project, currentVolume, currentChapter, prevContent = "") {
        const chapterNumber = Number(currentChapter?.number || currentChapter?.chapter_number || 0);
        const { key: targetKey, snapshot: latest } = this.getSnapshotBeforeChapter(project, chapterNumber);
        if (!latest) {
            return prevContent ? "【开章衔接指导】\n本章开头要紧接前文最后一个有效场景，不要平地跳场。" : "";
        }

        const lines = ["【开章衔接指导】", `请先承接上一章快照 ${targetKey}，再展开本章剧情。`];

        if (latest.current_location || latest["位置"]) {
            lines.push(`1. 开场地点优先承接：${latest.current_location || latest["位置"]}`);
        }
        if (latest.timeline || latest["时间"]) {
            lines.push(`2. 时间线继续沿用：${Utils.summarizeText(latest.timeline || latest["时间"], 70)}`);
        }
        if (latest.pending_plots) {
            lines.push(`3. 上章未完事项：${Utils.summarizeText(latest.pending_plots, 90)}`);
        }
        if (latest.important_items) {
            lines.push(`4. 重要物品状态别丢：${Utils.summarizeText(latest.important_items, 90)}`);
        }
        if (latest["下一章预期"]) {
            lines.push(`5. 上章对本章的预期：${Utils.summarizeText(latest["下一章预期"], 120)}`);
        }
        const previousChapter = this.getLatestChapterBefore(project, this.getVolumeNumber(project, currentVolume), chapterNumber);
        if (previousChapter?.emotionCurve) {
            lines.push(`6. 延续上一章情绪尾调：${Utils.summarizeText(previousChapter.emotionCurve, 60)}`);
        }
        const previousSetup = this.describeNextChapterSetup(previousChapter?.nextChapterSetup);
        if (previousSetup) {
            lines.push(`7. 先接住上一章铺垫：${Utils.summarizeText(previousSetup, 120)}`);
        }

        const setup = currentChapter?.next_chapter_setup || {};
        const setupHints = [
            setup.state_setup ? `状态起点：${setup.state_setup}` : "",
            setup.atmosphere_setup ? `氛围起点：${setup.atmosphere_setup}` : "",
            setup.suspense_hook ? `悬念起点：${setup.suspense_hook}` : ""
        ].filter(Boolean);
        if (setupHints.length) {
            lines.push(`本章章纲自带衔接任务：${setupHints.join("；")}`);
        }

        if (prevContent) {
            lines.push("开头前几段必须紧接前文结尾的动作、情绪或对话，不要无故跳天、跳地点、跳关系状态。");
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
            "【剧情单元阶段约束】",
            `当前章节位于第 ${unitNumber} 个剧情单元的${phase}阶段（单元内第 ${position} 章）。`
        ];

        const chapterPlotUnit = chapter?.plot_unit && typeof chapter.plot_unit === "object" ? chapter.plot_unit : {};
        if (unit?.core_conflict) {
            lines.push(`本单元核心冲突：${Utils.summarizeText(unit.core_conflict, 100)}`);
        }
        if (chapterPlotUnit.connects_to_previous) {
            lines.push(`本章承接重点：${Utils.summarizeText(chapterPlotUnit.connects_to_previous, 90)}`);
        }
        if (chapterPlotUnit.sets_up_next) {
            lines.push(`本章铺垫重点：${Utils.summarizeText(chapterPlotUnit.sets_up_next, 90)}`);
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
        const goal = this.extractSummarySection(chapter?.summary || "", "章节目标")
            || chapter?.key_event
            || chapter?.keyEvent
            || chapter?.title
            || "";
        const coreEvent = this.extractSummarySection(chapter?.summary || "", "核心事件")
            || chapter?.key_event
            || chapter?.keyEvent
            || chapter?.title
            || "";
        const scene = this.extractSummarySection(chapter?.summary || "", "场景");
        const emotion = this.extractSummarySection(chapter?.summary || "", "情绪曲线")
            || chapter?.emotion_curve
            || chapter?.emotionCurve
            || "";
        const previousSetup = this.describeNextChapterSetup(previousChapter?.nextChapterSetup || previousChapter?.next_chapter_setup || {});
        const currentSetup = this.describeNextChapterSetup(chapter?.next_chapter_setup || {});
        const openingAnchor = previousSetup
            || previousSnapshot.transition_focus
            || previousSnapshot["下一章预期"]
            || previousSnapshot.pending_plots
            || previousChapter?.keyEvent
            || previousChapter?.title
            || "";

        const lines = [
            "【本章节奏执行骨架】",
            `当前位于第 ${Math.floor((chapterNumber - 1) / 8) + 1} 单元的${phase}阶段（第 ${position} 章），不要写成散点拼贴。`,
            `1. 开场承接：先接住${Utils.summarizeText(openingAnchor || "上一章留下的动作、状态或情绪尾音", 90)}，用动作或对白把读者带回现场。`,
            `2. 本章目标：${Utils.summarizeText(goal || "围绕当前章纲主线继续推进", 100)}。`,
            `3. 主推进：围绕${Utils.summarizeText(coreEvent || "当前核心事件", 110)}展开，中段必须出现阻力、误判、代价或局势变化。`,
            "4. 实质变化：至少让人物关系、信息认知、资源状态、场上局势中的一项发生看得见的变化。"
        ];

        if (scene) {
            lines.push(`场景抓手：优先从「${Utils.summarizeText(scene, 40)}」或与它直接相连的场景起笔，转场必须写清过桥动作。`);
        }
        if (emotion) {
            lines.push(`情绪节奏：${Utils.summarizeText(emotion, 40)}，不要整章一个情绪平推到底。`);
        }
        lines.push(`5. 结尾收束：停在${Utils.summarizeText(currentSetup || "下一步压力、余波或未解悬念", 90)}对应的张力点上，只埋因，不写果。`);

        return lines.join("\n");
    }

    buildWorldAndPlanContext(project) {
        const sections = [];
        if (project.outline?.worldbuilding) {
            sections.push(`【世界观核心设定】\n${this.limitContext(project.outline.worldbuilding, 1200)}`);
        }
        const detailed = project.outline?.detailed_outline || "";
        if (detailed) {
            sections.push(`【详细大纲参考】\n${this.limitContext(detailed, 1800)}`);
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
            const identity = info?.identity || info?.type || "已锁定";
            lockedNameLines.push(`${name}（${identity}）`);
        });

        return lockedRoleLines.length || lines.length || lockedNameLines.length
            ? [
                "【模糊称呼转实名规则】",
                lockedRoleLines.length ? `已锁定主角：\n${lockedRoleLines.join("\n")}` : "",
                lines.length ? `以下代称必须替换成真实姓名：\n${lines.join("\n")}` : "",
                lockedNameLines.length ? `以下名字已锁定，后续卷必须沿用，不得改名或错绑：\n${lockedNameLines.join("、")}` : "",
                "禁止长期使用“男主/女主/主角/师尊/反派”代替真实姓名。",
                "如果用户输入里出现模糊称呼，也要优先按已锁定映射替换。"
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
            男主: ["男主", "男主角", "男主人公", "男一", "男一号", "男角"],
            女主: ["女主", "女主角", "女主人公", "女一", "女一号", "女角"],
            主角: ["主角", "主人公"],
            师尊: ["师尊"],
            反派: ["反派", "大反派", "反派boss"],
            男二: ["男二", "男二号"],
            女二: ["女二", "女二号"]
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
                    ...Utils.ensureArrayFromText(character?.aliases || character?.["别名"] || "")
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
        if (/(国师|质子|太医|尚书|侍郎|首领|总管|宫女|刺客|党羽|系统|皇孙|男宝|女宝|太女|王爷|宗令|掌门|师尊|长老)/.test(cleanName)) {
            return false;
        }
        if (cleanName.length >= 3 && /[多只察都差来稳武爹危知地们者后前内外上下时]/.test(cleanName.slice(-1))) {
            return false;
        }
        const compoundSurnames = [
            "欧阳", "上官", "司马", "慕容", "诸葛", "南宫", "夏侯", "令狐", "皇甫", "轩辕",
            "宇文", "长孙", "司徒", "司空", "西门", "东方", "独孤", "北冥", "公孙", "尉迟",
            "澹台", "拓跋", "百里", "钟离", "东郭", "闻人"
        ];
        const hasCompoundSurname = compoundSurnames.some((surname) => cleanName.startsWith(surname));
        if (cleanName.length === 4 && !hasCompoundSurname && !/^[阿小老][\u4e00-\u9fa5]{3}$/.test(cleanName)) {
            return false;
        }
        if (this.isLikelyChinesePersonName(cleanName)) {
            return true;
        }
        if (/^[阿小老][\u4e00-\u9fa5]{1,2}$/.test(cleanName)) {
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
                type: "主角",
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
            if (info?.type === "主角" && info?.identity && !synopsisData.main_characters[info.identity]) {
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
        const vagueNames = new Set(["男主", "女主", "主角", "主人公", "男一", "女一", "男一号", "女一号", "男角", "女角"]);
        const pendingRoles = new Set();
        const roleHints = [];

        (project?.outline?.characters || []).forEach((character) => {
            const rawName = String(character?.name || "").trim();
            const identity = String(character?.identity || character?.["身份"] || "").trim();
            if (!identity) {
                return;
            }

            let role = "";
            if (/女主|女主角|女一|女主人公|女角/.test(identity)) {
                role = "女主";
            } else if (/男主|男主角|男一|男主人公|男角/.test(identity)) {
                role = "男主";
            } else if (/主角|主人公/.test(identity)) {
                role = /女/.test(identity) ? "女主" : /男/.test(identity) ? "男主" : "";
            }

            if (!role) {
                return;
            }

            if (!rawName || vagueNames.has(rawName)) {
                pendingRoles.add(role);
                roleHints.push(`角色设定中【${role}】仍是模糊称呼：${rawName || "空"}`);
                return;
            }

            if (this.applySynopsisMainCharacter(project, role, rawName, lockedVolume)) {
                roleHints.push(`已从角色设定锁定【${role}】=${rawName}`);
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
            .map(([role, name]) => `【${role}】${name}`);
        const supportingLines = Object.entries(synopsisData.locked_character_names || {})
            .filter(([, info]) => info?.type !== "主角")
            .slice(0, 30)
            .map(([name]) => name);

        if (!protagonistLines.length && !supportingLines.length) {
            return "";
        }

        return [
            "【🔒🔒🔒 角色名字锁定表 - 已锁定的名字绝对禁止修改！🔒🔒🔒】",
            "",
            "一、主角名字（最高优先级 - 绝对不可修改）：",
            protagonistLines.length ? protagonistLines.join("\n") : "（暂无主角设定）",
            "",
            "二、配角名字（已出场配角 - 必须沿用原名）：",
            supportingLines.length ? supportingLines.join("、") : "（暂无配角）",
            "",
            "【强制性规则】：",
            "1. 以上所有名字已锁定，AI只能使用这些完整名字，不能做任何修改！",
            "2. 禁止使用简称、别名、昵称！例如“苏婉儿”不能写成“婉儿”“苏婉”“女主”！",
            "3. 禁止使用模糊称呼！“男主母亲”必须写成具体名字（如“林夫人”）！",
            "4. 新出场角色可以起名，但必须符合世界观且有辨识度！",
            "5. 已锁定名字的别名也禁止单独使用，避免同角漂移。",
            "",
            "【违反锁定表的后果】：生成的章节将被视为错误，需要重新生成！"
        ].join("\n");
    }

    buildSynopsisMappingHint(project) {
        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const mappingLines = Object.entries(synopsisData.vague_to_name_mapping || {})
            .filter(([, specificName]) => String(specificName || "").trim())
            .slice(0, 20)
            .map(([vagueTerm, specificName]) => `  · "${vagueTerm}" → ${specificName}`);

        if (!mappingLines.length) {
            return "";
        }

        return [
            "【🔒 模糊称呼→具体名字映射表（必须遵守！）】",
            "以下模糊称呼已经对应了具体名字，必须在所有章节中使用具体名字：",
            mappingLines.join("\n"),
            "",
            "⚠️ 绝对禁止继续使用映射表中的模糊称呼，必须写对应的具体名字！"
        ].join("\n");
    }

    getSynopsisClichePatterns() {
        return {
            开局套路: {
                patterns: [
                    "穿越重生获得金手指",
                    "废柴被退婚/羞辱后崛起",
                    "捡到神秘功法/传承",
                    "意外获得强大血脉觉醒",
                    "被家族/宗门驱逐后崛起"
                ],
                innovations: [
                    "【反向开局】开局就是巅峰，然后失去一切重新开始",
                    "【普通开局】没有金手指，完全靠努力和智慧",
                    "【反派开局】主角本身就是反派角色",
                    "【多重身份】开局就有复杂身份，需要在身份间周旋"
                ]
            },
            战斗套路: {
                patterns: [
                    "主角被压制后突然爆发反杀",
                    "关键时刻突破境界获胜",
                    "隐藏实力被低估后震惊全场",
                    "以弱胜强战胜天才",
                    "敌人临死前说你等着然后叫来更强的敌人"
                ],
                innovations: [
                    "【实力差距】主角确实打不过，只能智取或逃跑",
                    "【付出代价】胜利伴随着重大牺牲或损失",
                    "【敌人变友】战斗后不打不相识，成为盟友",
                    "【平局收场】双方都受伤撤退，留待后续",
                    "【第三方介入】战斗被第三方打断或收割"
                ]
            },
            感情套路: {
                patterns: [
                    "英雄救美后女主爱上男主",
                    "误会产生感情",
                    "青梅竹马打败天降",
                    "情敌出现后最终选择主角",
                    "家族反对的感情最终冲破阻碍"
                ],
                innovations: [
                    "【救助无用】救人后对方并不感激，反而引出新矛盾",
                    "【感情无关】感情线只是调味，不必次次抢主线",
                    "【多元关系】不要只做一对一，可以写更复杂的关系网络",
                    "【感情失败】感情线不圆满，但角色因此成长"
                ]
            },
            升级套路: {
                patterns: [
                    "每次遇到敌人都能刚好突破",
                    "吞噬吸收敌人力量快速升级",
                    "获得传承后实力暴涨",
                    "秘境历练后实力大增",
                    "濒死突破获得新生"
                ],
                innovations: [
                    "【渐进成长】没有突然飞跃，每一步都来之不易",
                    "【升级代价】突破要付出寿命、记忆、关系等代价",
                    "【瓶颈期】长时间卡住，逼角色换路径",
                    "【失去力量】实力倒退后重新积累"
                ]
            },
            势力套路: {
                patterns: [
                    "建立势力后一路扩张",
                    "敌人势力内部有叛徒",
                    "联盟对抗最终胜利",
                    "吞并敌对势力壮大自己"
                ],
                innovations: [
                    "【管理困境】扩张后要面对内部分裂和管理难题",
                    "【灰度势力】没有绝对正邪，各方都有合理性",
                    "【合作共赢】敌人变合作伙伴，而不是只能消灭",
                    "【势力崩塌】主角势力也可能因决策失误而受创"
                ]
            },
            揭秘套路: {
                patterns: [
                    "主角真实身份是某某之子或继承人",
                    "幕后黑手竟然是身边信任的人",
                    "敌人其实是被控制的受害者",
                    "一切阴谋都是为了主角好"
                ],
                innovations: [
                    "【身份无关】身份揭露不重要，重要的是角色如何选择",
                    "【多重真相】一层真相背后还有更深一层",
                    "【无真相】有些事情永远无法完全得知真相",
                    "【自我定义】身份不决定命运，选择才决定命运"
                ]
            },
            复仇套路: {
                patterns: [
                    "全家被杀踏上复仇路",
                    "最终发现仇人有苦衷",
                    "复仇成功后感到空虚",
                    "仇人临死前说出更大阴谋"
                ],
                innovations: [
                    "【复杂动机】仇恨背后不是简单对错，而是复杂因果",
                    "【超越仇恨】放下不是原谅，而是选择停止被仇恨驱动",
                    "【复仇代价】报仇成功却失去更重要的东西",
                    "【轮回困境】复仇之后自己也成了别人的复仇对象"
                ]
            },
            宝物套路: {
                patterns: [
                    "秘境中获得神级宝物",
                    "宝物内有器灵指导主角",
                    "宝物认主后无人可夺",
                    "拍卖会上捡漏宝物"
                ],
                innovations: [
                    "【宝物有价】宝物需要付出相应代价才能使用",
                    "【宝物有缺】宝物有缺陷或副作用",
                    "【宝物之争】宝物带来追杀、觊觎和连锁麻烦",
                    "【宝物无用】宝物未必真能解决问题，甚至会失效"
                ]
            }
        };
    }

    getSynopsisPlotElements() {
        return {
            冲突来源: ["资源争夺", "理念冲突", "误会引发", "利益纠葛", "情感矛盾", "势力博弈", "命运安排", "意外触发"],
            转折方式: ["第三方介入", "意外发现", "信息揭露", "能力突破", "心态转变", "外部变故", "盟友背叛", "敌人帮助"],
            解决路径: ["实力碾压", "智谋取胜", "妥协和解", "暂时回避", "借助外力", "付出代价", "改变目标", "时间化解"],
            影响范围: ["个人成长", "关系变化", "势力格局", "世界观揭示", "主线推进", "支线开启", "伏笔回收", "新谜团出现"],
            情感走向: ["热血沸腾", "温馨治愈", "虐心压抑", "轻松搞笑", "惊悚紧张", "感动落泪", "愤怒不平", "恍然大悟"]
        };
    }

    getSynopsisEventTypeSuggestions() {
        return {
            战斗: {
                avoid: ["重复的战斗场景", "相似的敌人类型", "同样的战斗结果模式"],
                suggest: ["不同类型的敌人（人/兽/机关/幻境）", "多样的战斗环境", "意外的战斗结果", "战斗的非战斗后果"]
            },
            修炼: {
                avoid: ["重复的突破描写", "同样的修炼方法", "无代价的提升"],
                suggest: ["不同的修炼瓶颈", "创新的突破方式", "突破后的副作用", "修炼的意外收获"]
            },
            对话: {
                avoid: ["重复的对话目的", "相似的信息揭露方式", "单向的信息传递"],
                suggest: ["多重目的的对话", "信息博弈与试探", "对话中的误会与暗示", "对话的后续影响"]
            },
            探索: {
                avoid: ["重复的发现模式", "同样的探索目的", "无风险的探索"],
                suggest: ["探索的意外发现", "探索的代价与风险", "探索的连锁反应", "探索的遗留问题"]
            },
            交易: {
                avoid: ["重复的交易类型", "顺利的交易过程", "无后续的交易"],
                suggest: ["交易背后的博弈", "交易的意外后果", "交易的道德困境", "交易的信息差"]
            }
        };
    }

    getSynopsisAllowedRepeatEvents() {
        return {
            修炼突破: {
                keywords: ["修炼", "突破", "闭关", "顿悟", "境界"],
                description: "每个境界都可能突破，但每次突破都该写出不同的新鲜感。",
                variations: [
                    "突破时机：闭关成功 / 战斗顿悟 / 机缘巧合 / 传承加持",
                    "突破场景：宗门密室 / 秘境禁地 / 战场之上 / 传承之地",
                    "突破代价或奖励：实力暴涨 / 获得神通 / 觉醒血脉 / 开启秘法",
                    "突破后续：碾压同阶 / 打脸嘲讽者 / 收获崇拜 / 开启新地图"
                ],
                examples: [
                    "可以从突破时机与突破代价入手，避免每次都只是“打着打着就升级”。",
                    "可以让突破改变人物关系或局势，而不只是数值提升。 "
                ]
            },
            生子怀孕: {
                keywords: ["怀孕", "生子", "胎", "生产", "子嗣"],
                description: "生子文里怀孕和生产可以重复出现，但每次都应当写出不同情绪、不同处境和不同后续。",
                variations: [
                    "惊喜来源：新婚即孕 / 求子得子 / 意外惊喜 / 天降祥瑞",
                    "孕期状态：丈夫宠爱 / 家族重视 / 身体异状 / 天赋预兆",
                    "生产结果：母子平安 / 龙凤呈祥 / 孩子天赋异禀 / 引发新局势",
                    "后续影响：家庭关系变化 / 势力态度变化 / 奖励降临 / 新目标开启"
                ],
                examples: [
                    "不要把每一胎都写成同样的“发现怀孕-众人高兴-顺利生产”。",
                    "可以从奖励、身份变化、子嗣天赋或宫斗压力上做差异。"
                ]
            },
            感情发展: {
                keywords: ["感情", "心动", "表白", "婚约", "成婚", "暧昧"],
                description: "感情推进可以重复，但每一段关系都该有不同的起点、阻力和落点。",
                variations: [
                    "相遇方式：偶然邂逅 / 身份曝光 / 英雄救美 / 青梅重逢",
                    "升温路径：共患难 / 日常相处 / 利益合作 / 价值观吸引",
                    "阻力类型：身份差距 / 家族反对 / 旧怨未解 / 目标冲突",
                    "结果落点：修成正果 / 暂时错过 / 关系升级 / 埋下更复杂的牵连"
                ],
                examples: [
                    "不要每条感情线都套“救人-心动-表白”同一模板。",
                    "同样是升温，也可以分别写利益同盟、命运牵扯、互相利用后转真心。"
                ]
            },
            获得宝物: {
                keywords: ["宝物", "法器", "神器", "功法", "传承", "至宝"],
                description: "获得宝物可以重复，但宝物来源、代价和作用必须变化。",
                variations: [
                    "获得方式：秘境所得 / 拍卖竞拍 / 击败强敌掉落 / 意外继承",
                    "宝物属性：稀有宝物 / 史诗神器 / 有缺之物 / 限制型底牌",
                    "副作用或争夺：被追杀 / 认主失败 / 需要代价 / 引发觊觎",
                    "后续效果：实力变化 / 身份变化 / 关系变化 / 新地图开启"
                ],
                examples: [
                    "不要每次都写成“随手捡到神级宝物然后立刻暴涨”。",
                    "可以写宝物有缺陷、有限制，或者带来追杀与连锁问题。"
                ]
            }
        };
    }

    extractSynopsisPatternKeywords(pattern) {
        return String(pattern || "")
            .replace(/[“”"'、，。！？；：:（）()\[\]【】]/g, " ")
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
                        message: `「${element}」已在之前章节中多次出现`
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
                sections.push(`【第${index + 1}卷已有章节 - 禁止重复这些情节】\n${synopsis}`);
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
                /[\u4e00-\u9fa5]{2,4}(?=说|道|笑|问|答|喊|叫|骂|点|看|走|站|坐|跑|想|觉|发现|看到|听到)/g,
                /([\u4e00-\u9fa5]{2,4})(?=的|之)/g,
                /["“”「」『』]([\u4e00-\u9fa5]{2,4})["“”「」『』]/g,
                /(?:与|和|跟|同|向|对)([\u4e00-\u9fa5]{2,4})(?=[，。、！？\s]|$)/g
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
                /([\u4e00-\u9fa5]{2,4})是([\u4e00-\u9fa5]{2,4})的(父亲|母亲|哥哥|弟弟|姐姐|妹妹|师父|徒弟|妻子|丈夫|儿子|女儿|朋友|敌人|对手|恋人|未婚妻|未婚夫)/g,
                /([\u4e00-\u9fa5]{2,4})的(父亲|母亲|哥哥|弟弟|姐姐|妹妹|师父|徒弟|妻子|丈夫|儿子|女儿|朋友|敌人|对手|恋人|未婚妻|未婚夫)是([\u4e00-\u9fa5]{2,4})/g,
                /([\u4e00-\u9fa5]{2,4})(?:与|和|跟)([\u4e00-\u9fa5]{2,4})(?:结盟|成婚|成为|建立)(.+?)(?=，|。|！|？)/g
            ];
            relationPatterns.forEach((pattern, index) => {
                Array.from(historyText.matchAll(pattern)).forEach((match) => {
                    if (index === 0) {
                        const [, left, right, relation] = match;
                        if (left && right && relation) {
                            relationships.set(`${left}-${right}`, `${left} ↔ ${right}：${relation}`);
                        }
                        return;
                    }
                    if (index === 1) {
                        const [, left, relation, right] = match;
                        if (left && right && relation) {
                            relationships.set(`${left}-${right}`, `${left} ↔ ${right}：${relation}`);
                        }
                        return;
                    }
                    const [, left, right, relation] = match;
                    if (left && right && relation) {
                        relationships.set(`${left}-${right}`, `${left} ↔ ${right}：${String(relation || "").trim()}`);
                    }
                });
            });
        }

        const excludeWords = new Set([
            "这个", "那个", "什么", "怎么", "如何", "为什么", "哪里", "那里", "这里",
            "此时", "彼时", "当时", "之后", "之前", "随后", "然后", "最后", "最初",
            "可是", "但是", "不过", "而且", "并且", "或者", "虽然", "即使", "如果",
            "一些", "所有", "全部", "部分", "大多", "少数", "很多", "许多", "某些",
            "主角", "男主", "女主", "配角", "龙套", "路人", "其他人", "众人", "世界",
            "地方", "东西", "事情", "情况", "问题", "原因", "结果", "办法", "时候",
            "瞬间", "片刻", "一直", "已经", "正在", "将要", "曾经", "终于"
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

        const commonSuffixes = new Set(["天", "地", "人", "子", "儿", "一", "二", "三"]);
        const repeatedPatterns = Array.from(suffixMap.entries())
            .filter(([suffix, values]) => suffix && values.length >= 2 && !commonSuffixes.has(suffix))
            .sort((left, right) => right[1].length - left[1].length)
            .slice(0, 5);

        if (!repeatedPatterns.length) {
            return "";
        }

        return [
            "【⚠️ 名字模式重复警告 - 极其重要！】",
            "检测到以下名字后缀重复过多，禁止再使用类似模式：",
            repeatedPatterns.map(([suffix, values]) => `  · “${suffix}”字重复：${Array.from(new Set(values)).join("、")}`).join("\n"),
            "",
            "【起名要求】",
            "1. 禁止继续使用上面这些重复名字后缀。",
            "2. 每个新角色的名字必须有辨识度，风格各异。",
            "3. 避免批量生成“X招娣、X翠花、X秀英”这种模式化名字。",
            "4. 名字要符合世界观和时代感，重点是稳定一致。"
        ].join("\n");
    }

    buildSynopsisPendingVagueHint(project, volumeNumber, text = "") {
        const pendingTerms = this.collectPendingSynopsisTerms(text, project);
        if (!pendingTerms.length) {
            return "";
        }

        if (Number(volumeNumber || 0) <= 1) {
            return [
                "【首次定名后必须锁定】",
                "以下角色如果还没有具体名字，可以在首次出场时补一个名字；但一旦定名，本卷后续和后面各卷都必须沿用同一个名字：",
                pendingTerms.slice(0, 12).map((term) => `  · “${term}”`).join("\n"),
                "",
                "【强制性要求】",
                "1. 同一个角色一旦用了具体名字，后续不能再换名。",
                "2. 已经有映射或已锁定的角色，只能沿用旧名字。",
                "3. 名字不需要刻意夸张，重点是稳定一致。"
            ].join("\n");
        }

        return [
            "【后续卷只做沿用，不要改名】",
            "以下称呼如果已经在前文对应过具体名字，本卷必须继续沿用原名；如果没有把握，就不要把旧角色改成新名字：",
            pendingTerms.slice(0, 12).map((term) => `  · “${term}”`).join("\n"),
            "",
            "【强制性要求】",
            "1. 已锁定角色只能沿用旧名字，不能一卷一个名字。",
            "2. 没有明确证据时，不要给旧角色重新起名。",
            "3. 重点是同一角色前后统一，不是追求每卷都改成新名字。"
        ].join("\n");
    }

    buildSynopsisNameGenerationHint(project, volumeNumber, text = "") {
        const roleRequirement = this.detectSynopsisRoleRequirements(project, text, volumeNumber);
        if (Number(volumeNumber || 0) !== 1 || !roleRequirement.pendingRoles?.length) {
            return "";
        }
        return [
            "【第一卷角色名字处理】",
            "检测到角色设定或输入里仍有模糊主角称呼：",
            roleRequirement.pendingRoles.map((role) => `【${role}】当前仍未稳定定名，可在首次出场时自然补具体名字`).join("\n"),
            "",
            "【规则】",
            "1. 如果本卷首次给这些角色起名，后续所有章节和后续所有卷都必须沿用同一个名字。",
            "2. 如果暂时没有自然的定名机会，不要为了起名而硬改剧情。",
            "3. 重点不是名字多华丽，而是同一个角色不要再改名。"
        ].join("\n");
    }

    buildSynopsisHardFactHint(project, volumeNumber, contextText = "") {
        const signals = this.collectHistoricalSynopsisCharacterSignals(project, volumeNumber, contextText);
        const relevantCharacters = this.collectRelevantCharacters(project, contextText, signals.names);
        const factLines = [];

        relevantCharacters.slice(0, 10).forEach((character) => {
            const identity = String(character?.identity || character?.["身份"] || "").trim();
            if (character?.name && identity) {
                factLines.push(`- ${character.name}：${identity}`);
            }
        });
        signals.relationships.slice(0, 8).forEach((line) => {
            factLines.push(`- ${line}`);
        });

        if (!factLines.length) {
            return [
                "【同批细纲硬事实锁定】",
                "同一批次里，角色的身份、位份、辈分、亲属关系、婚配、师徒、官职、阵营一旦首次明确，后文必须原样沿用，禁止改口。",
                "例如已经写成“太后的儿子是皇帝”，后文就不能改成“小皇子”；已经写成“太子妃”，后文也不能降回“秀女”。"
            ].join("\n");
        }

        return [
            "【同批细纲硬事实锁定】",
            "以下身份与关系一旦写定，后文必须保持一致，不能前后改口：",
            factLines.join("\n"),
            "如果本批后文需要继续提到这些人，必须沿用同样的身份、位份、辈分和关系。",
            "已经写成已登基、已成婚、已拜师、已认亲、已封爵、已怀孕、已生子等事实，后文不能回退成未发生。"
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
            .map(([role, name]) => `【${role}】${name}`);

        const parts = [];
        if (lockedMainNames.length) {
            parts.push([
                "【🔒 已锁定主角名字】",
                lockedMainNames.join("\n"),
                "",
                "后续所有卷的细纲都必须继续沿用以上主角名字，禁止改名，禁止退回成“男主”“女主”等模糊称呼！"
            ].join("\n"));
        }

        if (pendingVagueHint) {
            parts.push(pendingVagueHint);
        }

        if (historicalSignals.names.length) {
            const relationshipHint = historicalSignals.relationships.length
                ? `\n\n【已建立的人物关系】\n${historicalSignals.relationships.slice(0, 10).map((line) => `  · ${line}`).join("\n")}`
                : "";
            const mainCharHint = lockedMainNames.length
                ? [
                    "【🔴🔴🔴 核心角色名字 - 绝对禁止修改！🔴🔴🔴】",
                    lockedMainNames.map((line) => line.replace("】", "】= ")).join("\n").replace(/】= 】/g, "】"),
                    "",
                    "⚠️ 以上是本小说的核心主角，所有章节必须使用这些名字，绝对禁止改名！",
                    "⚠️ 例如：如果女主叫“苏婉儿”，就不能写成“苏婉”“婉儿”“女主”等其他称呼！"
                ].join("\n")
                : "";
            parts.push([
                mainCharHint,
                "【⚠️ 所有已出场角色名字一致性要求 ⚠️】",
                "以下角色已在本小说中出场，必须使用这些名字（主角+配角都不能改名）：",
                historicalSignals.names.slice(0, 24).join("、"),
                relationshipHint,
                "",
                "禁止改名、禁止使用“男主”“女主”“嫂子”“那家伙”等模糊称呼！",
                "必须沿用已出现的角色名字和人物关系！",
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
            currentVolumeTaskLabel: `${currentVolume.title || `第${volumeNumber}卷`}${volumeSummary ? ` - ${Utils.summarizeText(volumeSummary, 120)}` : ""}`,
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
            "你是世界书构建专家“默默”，一位资深网文策划编辑。请生成章节大纲。",
            "",
            lockedNamesTable,
            "",
            "【★★★ 最重要的规则 ★★★】",
            `1. 你必须一次性输出【恰好${chapterCount}章】,从第1章到第${chapterCount}章,不能多也不能少！`,
            `2. 不要说“以下是部分章节”或“由于篇幅限制”之类的话,必须完整输出所有${chapterCount}章！`,
            "3. 如果你只输出了一部分就停止,这是严重错误！",
            "",
            "【⚠️⚠️⚠️ 角色名字规范 - 极其重要！⚠️⚠️⚠️】",
            "1. 禁止同角改名：同一个角色一旦已经用过具体名字，后续所有章节和后续所有卷都必须继续沿用这个名字。",
            "2. 已有名字优先：所有已经建立映射或已经锁定的角色，必须继续使用原来的具体名字，不能一卷换一个名字。",
            "3. 不强制重新起名：后续卷的重点是沿用旧名字，不是给旧角色重新命名；没有把握时宁可保持原状。",
            "4. 模糊称呼只作辅助：如果输入里有“男主”“女主”“舅妈”“室友”等称呼，只能用于识别角色，最终不要把同一角色改成另一个新名字。",
            "",
            "【主角名字要求】",
            "1. 如果主角已经有名字，绝对禁止修改。",
            "2. 如果第一卷首次定名，只要名字前后一致即可，不要求刻意夸张或模式化。",
            "3. 配角同理，重点是前后统一，不是名字华丽程度。",
            "",
            "【严重警告】禁止模式化起名：",
            "1. 禁止批量生成“X招娣、X翠花、X秀英、X桂芳”这种同类型名字。",
            "2. 每个角色的名字必须有独特风格，避免重复后缀。",
            "3. 名字要多样化：可以参考诗词典故、自然意象、美好寓意等不同来源。",
            "",
            "【防止情节重复 - 记忆系统】",
            "1. 仔细阅读前面卷的章节内容,确保新章节的情节与之前完全不同。",
            "2. 禁止重复使用相同的：冲突类型、解决方式、场景设定、角色互动模式。",
            "3. 每个新章节必须推进故事,不能原地踏步或回到之前的情节。",
            "4. 如果前面有“主角获得宝物”,后面不能再有类似的“获得宝物”情节。",
            "5. 如果前面有“被人陷害后反杀”,后面不能再有类似的“陷害-反杀”套路。",
            "",
            "【剧情节点设计】",
            "1. 每个章节都是一个“剧情节点”,包含场景、冲突、转折。",
            "2. 章节之间要有“钩子”——本章结尾引出下章悬念。",
            "3. 遵循情绪曲线：紧张-缓和-更紧张-高潮-余韵。",
            "4. 每3-5章形成一个小高潮,卷末形成大高潮。",
            "",
            "【逻辑衔接铁律】",
            "1. 细纲必须紧接上一卷结尾或前文最后一章，不能跳场、回退、重写已发生事件。",
            "2. 同一批细纲里，身份、位份、辈分、亲属关系、婚配、师徒、官职、阵营一旦首次明确，后文必须保持一致。",
            "3. 例如已经写成“太后的儿子是皇帝”，后文就不能改成“小皇子”；已经写成“太子妃”，后文也不能降回“秀女”。",
            "4. 上一章的结果只能作为下一章的起点，不能换句话重复发生。",
            "5. 如果需要过桥章，过桥章也必须带来一个新的有效变化。",
            "",
            "【输出格式要求】",
            "1. 每章格式：第X章：章节标题 - 核心内容（20-40字描述）",
            `2. 从第1章连续输出到第${chapterCount}章,中间不要有任何说明文字。`,
            "3. 直接输出章节列表,开头和结尾都不要任何额外说明。",
            "",
            `【再次强调】你必须输出完整的${chapterCount}章,这是硬性要求！`
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
            `小说标题：《${title || "未命名小说"}》`,
            "",
            "故事概念：",
            concept || "暂无",
            "",
            "分卷概要：",
            volumeSynopsisContext || volumeSummary || "暂无",
            "",
            worldbuilding ? `世界观补充：\n${worldbuilding}` : "",
            currentVolumeOutlineContext ? `【当前卷详细大纲（必须优先执行）】\n${currentVolumeOutlineContext}` : "",
            adjacentOutlineSummary ? `【相邻卷边界提示】\n${adjacentOutlineSummary}` : "",
            `当前任务：为【${currentVolumeTaskLabel || `第${volumeNumber}卷`}】生成【恰好${chapterCount}章】的章节大纲。`,
            nameGenerationHint,
            mappingHint,
            characterConsistencyHint,
            synopsisConsistencyContext,
            usedPlotsContext,
            previousSynopsisContext,
            previousVolumeEnding ? `【上一卷结尾（用于衔接）：】\n${previousVolumeEnding}` : "",
            storyStateSummary ? `【前文状态摘要】\n${storyStateSummary}` : "",
            timelineGuard,
            foreshadowGuard,
            synopsisClarityGuard,
            volumeBoundaryGuard,
            innovationPrompt,
            existingSynopsis ? `【已有细纲参考】\n${existingSynopsis}` : "",
            "",
            `【最终确认】请现在输出第${volumeNumber}卷的全部${chapterCount}个章节大纲（从第1章到第${chapterCount}章,一个都不能少）：`
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
            `小说标题：《${title || "未命名小说"}》`,
            "",
            "故事概念：",
            concept || "暂无",
            "",
            "分卷概要：",
            volumeSynopsisContext || "暂无",
            "",
            worldbuilding ? `世界观补充：\n${worldbuilding}` : "",
            currentVolumeOutlineContext ? `【当前卷详细大纲（必须优先执行）】\n${currentVolumeOutlineContext}` : "",
            adjacentOutlineSummary ? `【相邻卷边界提示】\n${adjacentOutlineSummary}` : "",
            `当前任务：继续为【${currentVolumeTaskLabel || `第${volumeNumber}卷`}】补齐缺失章节，最终必须凑够${chapterCount}章。`,
            nameGenerationHint,
            mappingHint,
            characterConsistencyHint,
            synopsisConsistencyContext,
            usedPlotsContext,
            previousSynopsisContext,
            previousVolumeEnding ? `【上一卷结尾（用于衔接）：】\n${previousVolumeEnding}` : "",
            storyStateSummary ? `【前文状态摘要】\n${storyStateSummary}` : "",
            timelineGuard,
            foreshadowGuard,
            synopsisClarityGuard,
            volumeBoundaryGuard,
            innovationPrompt,
            existingSynopsis ? `【已有细纲参考】\n${existingSynopsis}` : "",
            "",
            "【已经成功生成的章节细纲】",
            knownLines || "暂无",
            "",
            "【只允许补齐以下缺失章节】",
            (missingNumbers || []).map((num) => `第${num}章`).join("、"),
            "",
            "请只输出缺失章节，一章一行，严格使用格式：",
            "第X章：章节标题 - 核心内容（20-40字描述）",
            "直接输出，不要任何说明，不要重复已经生成过的章节。"
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
                    "【🔒 模糊称呼→具体名字映射表（必须遵守）】",
                    "以下称呼已经有固定对应名字，本卷细纲必须沿用具体名字：",
                    mappingLines.join("\n")
                ].join("\n")
                : "",
            pendingHint: pendingTerms.length && Number(volumeNumber || 0) > 0
                ? `【待继续明确的模糊称呼】\n${[...new Set([...pendingTerms, ...(roleRequirement.pendingRoles || [])])].slice(0, 12).map((term) => `- ${term}`).join("\n")}\n如果本卷明确写出了真实名字，可以直接用真实名字，不要长期停留在模糊称呼。`
                : ""
        };
    }

    lockSynopsisCharacterName(project, name, charType = "配角", identity = "未知", lockedVolume = 1) {
        const cleanName = String(name || "").trim();
        if (!/^[\u4e00-\u9fa5]{2,4}$/.test(cleanName)) {
            return false;
        }

        const synopsisData = this.restoreSynopsisMainCharacters(project);
        const aliases = this.buildSynopsisNameAliases(cleanName);
        const existing = synopsisData.locked_character_names[cleanName];
        if (existing) {
            if (charType === "主角") {
                existing.type = "主角";
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
            "这时", "那时", "此时", "彼时", "什么", "怎么", "这个", "那个", "他的", "她的", "他们",
            "众人", "路人", "少年", "少女", "青年", "女子", "男人", "女人", "弟子", "长老", "掌门"
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
            if (role && existingLock.type === "主角" && existingLock.identity && existingLock.identity !== role) {
                return false;
            }
            if (!role && existingLock.type === "主角" && existingLock.identity && aliasToRole[cleanVagueTerm] && aliasToRole[cleanVagueTerm] !== existingLock.identity) {
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
        this.lockSynopsisCharacterName(project, cleanName, "主角", cleanRole, lockedVolume);
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
                isMainCharacter ? "主角" : "配角",
                isMainCharacter ? "主角" : (String(character?.identity || "").trim() || "未知"),
                volumeNumber
            )) {
                changed += 1;
            }

            Utils.ensureArrayFromText(character?.aliases || character?.["别名"] || "")
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
            "这时", "那时", "此时", "彼时", "什么", "怎么", "这个", "那个", "他的", "她的",
            "少年", "少女", "男人", "女人", "角色", "名字", "某人", "某某"
        ]);
        const results = [];
        const seen = new Set();

        vagueTerms
            .filter(Boolean)
            .sort((left, right) => right.length - left.length)
            .forEach((vagueTerm) => {
                const escaped = vagueTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const patterns = [
                    new RegExp(`${escaped}[：:]\\s*([\\u4e00-\\u9fa5]{2,4})`, "g"),
                    new RegExp(`${escaped}[（(]([\\u4e00-\\u9fa5]{2,4})[)）]`, "g"),
                    new RegExp(`([\\u4e00-\\u9fa5]{2,4})[（(]${escaped}[)）]`, "g"),
                    new RegExp(`${escaped}叫([\\u4e00-\\u9fa5]{2,4})`, "g"),
                    new RegExp(`${escaped}名叫([\\u4e00-\\u9fa5]{2,4})`, "g"),
                    new RegExp(`名叫([\\u4e00-\\u9fa5]{2,4})的${escaped}`, "g")
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
            "对她", "对他", "对她说", "对他说", "厂长", "副厂长", "食堂", "系统", "震惊", "提供",
            "发现", "看到", "听到", "受过", "恩惠", "天籁", "众人", "她的", "他的", "给她", "给他",
            "派副", "派人", "故事", "章节", "细纲", "卷纲", "正文", "面对", "偏心", "说八", "八道",
            "说八道", "面对偏心", "给林", "到图", "安抚", "护沈", "图书馆"
        ]);
        if (badFragments.has(cleanName)) {
            return false;
        }

        const badSuffixes = ["震惊", "说道", "说着", "提供", "恩惠", "厂长", "主任", "经理", "图书馆", "偏心", "八道"];
        if (badSuffixes.some((suffix) => cleanName.endsWith(suffix))) {
            return false;
        }

        const badPrefixes = ["了", "对", "把", "被", "向", "给", "派", "面对", "说", "到", "安抚", "护"];
        if (badPrefixes.some((prefix) => cleanName.startsWith(prefix))) {
            return false;
        }

        const badVerbs = ["面对", "安抚", "派", "给", "到", "去", "来", "说", "看到", "发现", "听到", "告诉", "扶住", "搀住", "拉住"];
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

        addCandidates(content.match(/[\u4e00-\u9fa5]{2,4}(?=说|道|笑|问|答|喊|叫|骂|点|看|走|站|坐|跑|想|觉|发现|看到|听到)/g) || []);

        const quotedNames = [];
        for (const match of content.matchAll(/["“”「」『』]([\u4e00-\u9fa5]{2,4})["“”「」『』]/g)) {
            quotedNames.push(String(match[1] || "").trim());
        }
        addCandidates(quotedNames);

        const relationTargets = [];
        for (const match of content.matchAll(/(?:与|和|跟|同|向|对)([\u4e00-\u9fa5]{2,4})(?=[，。、！？\s]|$)/g)) {
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
            "师兄", "师姐", "师弟", "师妹", "长老", "掌门", "师父", "师母", "同门", "死对头"
        ]);
        const explicitMappings = this.extractExplicitVagueNameMappings(text, Array.from(allVagueTerms));
        const appliedMainMappings = [];
        const appliedSupportingMappings = [];
        const pendingTerms = [];

        explicitMappings.forEach(({ vagueTerm, specificName }) => {
            const role = aliasToRole[vagueTerm];
            if (role) {
                if (this.applySynopsisMainCharacter(project, role, specificName, volumeNumber)) {
                    appliedMainMappings.push(`${vagueTerm}→${specificName}`);
                }
                return;
            }

            if (!this.isSafeSynopsisMapping(project, vagueTerm, specificName)) {
                return;
            }
            synopsisData.vague_to_name_mapping[vagueTerm] = specificName;
            this.lockSynopsisCharacterName(project, specificName, "配角", vagueTerm, volumeNumber);
            if (synopsisData.vague_supporting_roles[vagueTerm]) {
                synopsisData.vague_supporting_roles[vagueTerm].needs_name = false;
                synopsisData.vague_supporting_roles[vagueTerm].suggested_name = specificName;
            }
            appliedSupportingMappings.push(`${vagueTerm}→${specificName}`);
        });

        this.collectFrequentNamesFromText(text).forEach((name) => {
            const isMainCharacter = Object.values(synopsisData.main_characters || {}).includes(name);
            this.lockSynopsisCharacterName(project, name, isMainCharacter ? "主角" : "配角", isMainCharacter ? "主角" : "未知", volumeNumber);
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
            .map((chapter) => chapter.line || `第${chapter.chapter_number || chapter.number}章：${chapter.title || ""} - ${chapter.synopsis || chapter.key_event || ""}`)
            .filter(Boolean);

        if (!chapterLines.length) {
            return { appliedMappings: [], evidence: {} };
        }

        const unresolvedRoles = ["男主", "女主"].filter((role) => {
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
            `请根据以下信息，识别第${volumeNumber}卷章节细纲里已经明确建立的主角名字。`,
            "",
            `待识别角色：${unresolvedRoles.join("、")}`,
            "",
            "规则：",
            "1. 只能返回章节细纲里已经实际出现过的具体中文名字，绝对不能新起名。",
            "2. 如果证据不足，必须返回空字符串，不要猜。",
            "3. 同一个名字不能同时分配给两个角色。",
            "4. 如果某个角色已经有锁定名字，就不要改写。",
            "5. 重点是帮助后续卷沿用已确定名字，不要把配角误判成主角。",
            "",
            "输出严格 JSON：",
            '{',
            '  "main_characters": {"男主": "", "女主": ""},',
            '  "confidence": {"男主": "高/中/低", "女主": "高/中/低"},',
            '  "evidence": {"男主": "简述依据", "女主": "简述依据"}',
            '}',
            "",
            `故事概念：\n${concept || "暂无"}`,
            "",
            `分卷概要：\n${volumeSummary || "暂无"}`,
            "",
            `当前已知映射：\n${mappingLines.length ? mappingLines.join("\n") : "（暂无）"}`,
            "",
            `章节细纲：\n${chapterLines.join("\n")}`
        ].join("\n");

        let parsed = null;
        try {
            const raw = await this.api.callLLM(
                prompt,
                "你是角色映射校对助手。只做保守识别，不要补写剧情，不要发散解释。",
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
            if (!name || !["高", "中"].includes(confidence)) {
                return;
            }
            if (this.applySynopsisMainCharacter(project, role, name, volumeNumber)) {
                appliedMappings.push(`${role}→${name}`);
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
            ? "【频道要求】这是女频向章节，优先强化情感推进、细腻心理和关系张力。"
            : "【频道要求】这是男频向章节，优先保证主线推进、冲突升级和成就反馈。";

        const basePrompt = promptTemplate && promptTemplate.trim()
            ? promptTemplate
            : [
                "{{frequency_prompt}}",
                "",
                "小说标题：{{title}}",
                "小说类型：{{genre}}",
                "核心主题：{{theme}}",
                "",
                "{{world_and_plan_context}}",
                "",
                "【当前卷信息】",
                "卷名：{{current_volume}}",
                "卷摘要：{{current_volume_summary}}",
                "",
                "【当前卷细纲参考】",
                "{{current_volume_outline_context}}",
                "",
                "【本章大纲】",
                "{{outline}}",
                "",
                "{{opening_relay_packet}}",
                "",
                "【前文大纲摘要】",
                "{{previous_outline_context}}",
                "",
                "【前文状态摘要】",
                "{{story_state_summary}}",
                "",
                "{{narrative_bridge_plan}}",
                "",
                "【相关人物设定】",
                "{{relevant_characters}}",
                "",
                "【前文五章】",
                "用途：只用于继承名词、状态、口吻和动作延续，不要拿它当作本章开头的复述模板。",
                "{{prev_content}}",
                "",
                "【全局设定提醒】",
                "{{global_setting_note}}",
                "",
                "【本章设定提醒】",
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
                "写作铁律：",
                "1. 【名词与状态继承】请仔细阅读上方【前文五章】和系统约束。人物、物品、功法、修为、系统奖励、地点称呼等名词，必须无条件沿用前文已经确定好的固定名称和状态，绝不允许换名字或吃书。",
                "2. 【大纲执行优先】剧情主线必须遵守本章【大纲】的发展轨迹，绝不能脱离主线跑偏。",
                "3. 【血肉填充与适度扩充】大纲只是骨架，你要在严格遵守主线和前文设定的基础上，丰富动作、心理、对话、环境和博弈过程。",
                "4. 【拒绝流水账】如果大纲只有一句话，也要扩成有波折、有细节、有情绪起伏的完整章节，不能一笔带过。",
                "5. 【逻辑自洽】如果大纲表述略粗，你要自动补足合理因果，让剧情更顺，但不能改主线结果。",
                "6. 【卷边界】只能写当前卷范围内的剧情，不要提前写后续卷的核心地图、核心人物、核心冲突。",
                "7. 【承接上章铺垫】如果上一章结尾已经留下下章铺垫，本章开头必须先接住那条铺垫，再推进本章主事件。",
                "8. 【事件时态正确】前文已经发生的事，正文里不能再写成马上要发生或刚要发生。",
                "",
                "写作要求：",
                "1. 必须严格遵守本章大纲、全局设定、本章设定、世界观、详细大纲参考和角色锁定。",
                "2. 开头必须承接前文五章和章末快照，中间推进剧情，结尾完成本章铺垫任务。",
            "3. 人物行为、对话、物品、技能、身份、时间地点必须与既有状态一致。",
            "4. 不要把下一章核心事件提前展开，只能做铺垫。",
            "5. 尚未正式见面的角色，不能突然写成熟人互动；模糊称呼尽量改成真实姓名。",
            "6. 如果上一章情绪还没落下，本章开头要延续那股情绪，不要突然换频道。",
            "7. 如果前文交接略生硬，要用动作、对话、场景变化自然补桥，不要生硬跳切。",
            "8. 本章结尾必须停在钩子上，卡在下一章核心事件发生前最有张力的一刻，绝对不能把下一章内容先写进去。",
            "9. 正文写完后，必须按下面协议追加追踪输出。",
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
            world_and_plan_context: worldAndPlanContext || "【世界观核心设定】暂无\n\n【详细大纲参考】暂无",
            current_volume_outline_context: currentVolumeOutlineContext ? this.limitContext(currentVolumeOutlineContext, 1800) : "暂无明确当前卷细纲切片",
            relevant_characters: characterDigest || "暂无明确角色设定",
            outline: chapter.summary || "",
            chapter_number: chapter.number || "",
            chapter_title: chapter.title || "",
            opening_relay_packet: openingRelayPacket || "【开篇接力棒】\n本章开头直接承接上一章的结果与现场，不要复述前情。",
            previous_outline_context: previousOutlineContext || "暂无前文大纲",
            story_state_summary: storyStateSummary || "暂无明确前文状态摘要",
            narrative_bridge_plan: narrativeBridgePlan || "【本章节奏执行骨架】\n先接上章结果，再推进本章主事件，中段形成波折，结尾停在下一步张力点。",
            prev_content: prevContent || "暂无前文",
            next_outline: nextOutline || "暂无下一章章纲",
            global_setting_note: project.global_setting_note || "暂无",
            chapter_setting_note: chapter.chapter_setting_note || "暂无",
            transition_guide: transitionGuide || "【开章衔接指导】请直接承接上一章最后一个有效场景与状态展开，不要平地重开。",
            setup_continuity_guard: setupContinuityGuard || "【下章铺垫承接规则】如果上一章没有明确铺垫，就按本章大纲自然起势，不要硬插新冲突。",
            expansion_hint: expansionHint || "【智能扩写建议】可围绕本章核心事件补充动作细节、人物心理、对话博弈、环境反馈和伏笔呼应。",
            current_volume: volume.title || "",
            current_volume_summary: volume.summary || "",
            next_chapter_setup_instruction: nextChapterSetupInstruction || "【本章结尾铺垫任务】当前章纲未提供 next_chapter_setup，可自行做轻度悬念铺垫。",
            next_chapter_forbidden_preview: nextChapterForbiddenPreview || "【后续剧情预告（下一章剧情） - 绝对不可写】暂无下一章章纲。",
            state_output_protocol: stateOutputProtocol || "",
            extra_output_protocol: extraOutputProtocol || ""
        };

        let output = basePrompt;
        Object.entries(replacements).forEach(([key, value]) => {
            const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
            output = output.replace(pattern, value || "");
        });

        const hardPinnedFrontMatter = [
            "【最高优先级：当前章执行任务】",
            `当前只允许扩写第${chapter.number || "?"}章《${chapter.title || "未命名章节"}》的正文。`,
            "世界观、详细大纲、卷细纲、前文状态都只能辅助当前章，绝不能覆盖当前章的大纲要求。",
            "如果任一辅助信息与本章大纲看似冲突，以【本章大纲】和上一章结尾的直接衔接为准。",
            "",
            "【本章大纲（必须逐条落实）】",
            chapter.summary || "暂无本章大纲",
            "",
            openingRelayPacket || "",
            "",
            "【前文原文使用规则】",
            "前五章原文继续完整提供给模型，但只能用来继承事实、名词、状态和语气，不允许把其中已完成内容改写成新章开头。",
            "",
            "【前文五章（重点看最后一章结尾）】",
            prevContent || "暂无前文",
            "",
            "【开章衔接指导】",
            transitionGuide || "请直接承接上一章最后一个有效场景与状态展开，不要平地重开。"
        ].join("\n");

        const desktopInvariantBundle = [
            storyStateSummary ? `【当前故事状态（必须延续）】\n${storyStateSummary}` : "",
            narrativeBridgePlan || "",
            previousOutlineContext ? `【前文大纲摘要】\n${previousOutlineContext}` : "",
            currentVolumeOutlineContext ? `【当前卷细纲参考】\n${this.limitContext(currentVolumeOutlineContext, 1800)}` : "",
            worldAndPlanContext ? worldAndPlanContext : "",
            characterDigest ? `【本章出场/相关角色设定（防崩坏参考）】\n${characterDigest}` : "",
            project.global_setting_note ? `【全局设定提醒】\n${project.global_setting_note}` : "",
            chapter.chapter_setting_note ? `【本章设定提醒】\n${chapter.chapter_setting_note}` : "",
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
            "【补充写作模板】",
            "以下内容是补充写作要求，优先级低于前面的刚性约束，不得覆盖本章大纲与状态衔接规则。",
            output
        ].filter(Boolean).join("\n\n");
    }

    buildStateOutputProtocol(project, chapter, relevantCharacters) {
        const names = (relevantCharacters || []).map((character) => character.name).filter(Boolean);
        const fallbackNames = (project.outline.characters || []).slice(0, 8).map((character) => character.name).filter(Boolean);
        const characterNames = Array.from(new Set(names.length ? names : fallbackNames)).slice(0, 8);

        return [
            "【状态输出协议】",
            "正文完成后，请在文末追加分隔符 <<<STATE_JSON>>> ，然后输出一个 JSON 对象，用于系统追踪状态。",
            `重点跟踪角色：${characterNames.length ? characterNames.join("、") : "请自动识别本章主要角色"}`,
            "JSON 示例：",
            "<<<STATE_JSON>>>",
            "{",
            '  "timeline": "当前故事时间点",',
            '  "current_location": "本章结束时主角所在位置",',
            '  "important_items": "本章新增或变化的重要物品",',
            '  "item_updates": [',
            '    {',
            '      "name": "物品名",',
            '      "holder": "当前持有者",',
            '      "status": "持有/使用中/损坏/丢失/消耗",',
            '      "type": "物品类型",',
            '      "description": "本章里它现在是什么样",',
            '      "source": "获得/转移原因",',
            '      "temporary": false',
            "    }",
            "  ],",
            '  "pending_plots": "本章留下的待推进事项",',
            '  "key_event": "本章最关键的一件事",',
            '  "genre_progress": ["多题材进度（格式：角色名：变化）"],',
            '  "world_changes": {',
            '    "new_locations": [],',
            '    "character_movements": [],',
            '    "org_changes": [],',
            '    "offscreen_status": []',
            "  },",
            '  "time_constraints": ["仍在持续的时间约束或倒计时"],',
            '  "characters": {',
            '    "角色名": {',
            '      "cultivation": "修为/实力变化",',
            '      "location": "当前位置",',
            '      "identity": "身份变化",',
            '      "status": "身体/精神状态",',
            '      "appearance": "当前外貌/伪装/受伤/脏污等形象状态",',
            '      "real_appearance": "若本章出现伪装或变身，写真实形象",',
            '      "appearance_change": "本章形象变化摘要",',
            '      "possessions": "关键物品变化",',
            '      "relationships": "关系变化",',
            '      "goals": "当前目标",',
            '      "secrets": "知晓或暴露的秘密"',
            "    }",
            "  },",
            '  "appearance_changes": [',
            '    {',
            '      "name": "角色名",',
            '      "current_appearance": "本章结束时角色对外呈现的形象",',
            '      "real_appearance": "真实外貌（若有伪装/变身）",',
            '      "change_type": "正常/伪装/受伤/脏污/恢复/变身",',
            '      "reason": "变化原因",',
            '      "duration": "持续到何时，可留空"',
            "    }",
            "  ]",
            "}"
        ].join("\n");
    }

    buildExtraOutputProtocol() {
        return [
            "【附加追踪输出】",
            "正文后请继续按以下格式追加，便于系统追踪：",
            "先填写 <<<CHARACTER_APPEARANCE>>>，只记录本章正文里真正写出来的实名/固定称呼。",
            "角色名必须和正文逐字一致，可以写王干事、赵师傅、李婶子，不能写干事、人事科长、哭诉林书、她的老赵、不苟言笑、势利眼。",
            "不要根据大纲、身份、动作、情绪、代词去补造名字；正文里没明确写出来，就不要登记。",
            "",
            "<<<CHARACTER_APPEARANCE>>>",
            "角色名|身份|首次出场",
            "角色A|角色B|关系描述|首次见面",
            "<<<END_APPEARANCE>>>",
            "",
            "再填写 <<<EXTRA_CHARACTERS>>>。",
            "龙套角色只能从上面的 <<<CHARACTER_APPEARANCE>>> 角色名单里复制，且只保留【人物设定里没有】的新临时人物。",
            "如果本章没有新增龙套，就写：龙套角色：无",
            "",
            "<<<EXTRA_CHARACTERS>>>",
            "龙套角色：角色名1（简单特点），角色名2（简单特点）",
            "临时支线：支线描述",
            "<<<END_EXTRA>>>",
            "",
            "<<<FORESHADOWS>>>",
            "新埋：",
            "1. 伏笔内容（伏笔类型），计划第X章回收",
            "回收：",
            "1. 已回收的伏笔描述",
            "<<<END_FORESHADOWS>>>",
            "",
            "<<<PERSONALITY_CHANGE>>>",
            "角色名|事件描述|旧性格|新性格|转变原因",
            "<<<END_PERSONALITY_CHANGE>>>"
        ].join("\n");
    }

    buildExpansionHint(outlineText, chapterNumber = 0) {
        const text = String(outlineText || "");
        if (!text) {
            return "";
        }

        const keywordRules = [
            { pattern: /测灵|测试|考核|评估|选拔/, tips: ["突出规则压力与结果悬念", "加入围观者反应和评价反差"] },
            { pattern: /比武|擂台|竞赛|比赛|对决/, tips: ["细化战术博弈与节奏变化", "写出观众、裁判或对手的心理反馈"] },
            { pattern: /修炼|练功|突破|闭关|参悟/, tips: ["增加身体感受、瓶颈阻力与顿悟细节", "让突破和前文资源/伏笔形成因果"] },
            { pattern: /炼丹|炼器|炼药|锻造/, tips: ["补充步骤失败风险和材料细节", "写出成品带来的即时反馈"] },
            { pattern: /探险|寻宝|探索|发现|秘境/, tips: ["强化环境机关、未知感和探索层次", "让发现线索与后续冲突挂钩"] },
            { pattern: /进入|闯入|潜入|入侵/, tips: ["增加潜行风险、暴露风险和临场应变", "写清楚路线、阻碍和压迫感"] },
            { pattern: /战斗|对战|交手|厮杀/, tips: ["避免只报招式，要写局势变化和情绪起伏", "补足战斗后果，影响下一场剧情"] },
            { pattern: /冲突|争执|对峙|纠纷/, tips: ["让对话各自带立场和隐含诉求", "把冲突结果落到人物关系变化上"] },
            { pattern: /真相|秘密|身份|揭露|曝光/, tips: ["控制揭露节奏，先铺情绪再落信息", "重点写知情者反应和后续代价"] },
            { pattern: /告白|暧昧|心动|婚约|情感/, tips: ["补足心理拉扯和动作细节", "让关系推进与主线矛盾互相影响"] }
        ];

        const matched = keywordRules.filter((rule) => rule.pattern.test(text));
        const tips = matched.flatMap((rule) => rule.tips);

        const lines = ["【智能扩写建议】", "在不改变本章主线结果的前提下，自由补足细节、波折、心理、动作、环境和伏笔呼应，拒绝流水账。"];
        if (chapterNumber) {
            lines.push(`当前章节：第 ${chapterNumber} 章`);
        }
        lines.push("扩写时请围绕章节骨架补足血肉，不要空转水字数。");
        lines.push("本章默认目标是长章输出：尽量写到3000-6000字，至少不要少于2500字。");
        lines.push("优先补充：动作过程、人物心理、场景反馈、对话博弈、伏笔呼应、结果余波。");
        lines.push("如果章纲只有几句话，也要把每个情节点展开成完整场景，不要压缩成提要式短章。");

        if (tips.length) {
            lines.push("本章重点补强方向：");
            Array.from(new Set(tips)).slice(0, 6).forEach((tip, index) => {
                lines.push(`${index + 1}. ${tip}`);
            });
        } else {
            lines.push("本章重点补强方向：");
            lines.push("1. 每个情节点都要有具体触发、推进和反馈。");
            lines.push("2. 关键对话不要只传递信息，要体现立场与情绪。");
            lines.push("3. 结尾要留下余波、悬念或状态变化，服务下章铺垫。");
            lines.push("4. 如果大纲写得很短，请主动补足波折，不要写成提纲复述。");
        }

        return lines.join("\n");
    }

    buildNextChapterSetupInstruction(chapter) {
        const setup = chapter.next_chapter_setup || {};
        const lines = [
            "【本章结尾铺垫任务（必须完成）】",
            "⚠️ 重要：这是铺垫，不是预告。",
            "规则：",
            "1. 铺垫 = 埋下“因”，绝不直接写“果”。",
            "2. 只能写状态、氛围、悬念、暗示，不要直接写下一章会发生什么。",
            "3. 不允许出现“下章将会”“马上就会”“下一章会”之类的预告句式。",
            "4. 字数控制在 1-2 句话，不要写成长段预告。"
        ];

        if (setup.state_setup) lines.push(`- 状态铺垫：${setup.state_setup}`);
        if (setup.atmosphere_setup) lines.push(`- 氛围铺垫：${setup.atmosphere_setup}`);
        if (setup.suspense_hook) lines.push(`- 悬念钩子：${setup.suspense_hook}`);
        if (setup.clue_hint) lines.push(`- 线索暗示：${setup.clue_hint}`);
        if (setup.countdown) lines.push(`- 倒计时：${setup.countdown}`);

        lines.push("示例：可以写“他气息渐弱，医者摇头不语”，不能写“下章他将死去”。");
        lines.push("示例：可以写“远处忽然传来异响，空气一下子沉了下来”，不能写“下章敌人就会杀到”。");
        return lines.join("\n");
    }

    buildNextChapterForbiddenPreview(nextOutline) {
        if (!nextOutline) {
            return "";
        }

        return [
            "【后续剧情预告（下一章剧情） - 绝对不可写！仅供参考！】",
            `下一章：第${nextOutline.number}章 ${nextOutline.title || ""}`,
            nextOutline.summary || "",
            "红线规则：",
            "1. 下一章才发生的核心事件，本章绝对不能提前写出来。",
            "2. 可以做悬念和暗示，但不能提前完成下一章的冲突、揭露、突破、死亡、身份曝光、获宝等结果。",
            "3. 本章结尾只能对应下一章的【因】，不能把下一章的【果】先写完。"
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
                return `【第${item.number}章 ${item.title}】\n${contentText}`;
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
            return `- 第${item.number}章 ${item.title || ""}：${brief}`;
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

        const sectionMatch = summary.match(/【出场人物】\s*([\s\S]*?)(?=\n【|$)/);
        const section = sectionMatch?.[1] ? String(sectionMatch[1]).trim() : "";
        if (!section) {
            return [];
        }

        const names = [];
        section.split(/\r?\n/).forEach((line) => {
            const rawLine = String(line || "").trim();
            if (!rawLine || (!rawLine.startsWith("-") && !rawLine.startsWith("•"))) {
                return;
            }
            const cleaned = rawLine.replace(/^[•-]\s*/, "");
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
                : Utils.ensureArrayFromText(character.aliases || character["别名"]);
            const names = [character.name, ...aliases];
            const identities = Utils.ensureArrayFromText(character.identity || character["身份"] || "");
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
            if (character.identity) chunks.push(`身份：${character.identity}`);
            if (character.personality) chunks.push(`性格：${Utils.summarizeText(character.personality, 70)}`);
            if (character.background) chunks.push(`背景：${Utils.summarizeText(character.background, 90)}`);
            if (character.relationships) chunks.push(`关系：${Utils.summarizeText(character.relationships, 80)}`);
            if (character.appearance) chunks.push(`外貌：${Utils.summarizeText(character.appearance, 70)}`);
            if (character.abilities) chunks.push(`能力：${Utils.summarizeText(character.abilities, 70)}`);
            if (character.goals) chunks.push(`目标：${Utils.summarizeText(character.goals, 70)}`);
            return `- ${character.name || "未命名"}\n  ${chunks.join("\n  ")}`;
        }).join("\n");
    }

    buildRelevantCharactersInfo(foundChars) {
        if (!foundChars?.length) {
            return "";
        }

        const body = foundChars.map((character) => {
            const chunks = [];
            const aliases = Utils.ensureArrayFromText(character.aliases || character["别名"] || "");
            if (character.identity) chunks.push(`身份：${character.identity}`);
            if (aliases.length) chunks.push(`固定称呼/别名：${aliases.join("、")}`);
            if (character.personality) chunks.push(`性格：${Utils.summarizeText(character.personality, 70)}`);
            if (character.background) chunks.push(`背景：${Utils.summarizeText(character.background, 90)}`);
            if (character.relationships) chunks.push(`关系：${Utils.summarizeText(character.relationships, 80)}`);
            if (character.appearance) chunks.push(`外貌：${Utils.summarizeText(character.appearance, 70)}`);
            if (character.abilities) chunks.push(`能力：${Utils.summarizeText(character.abilities, 70)}`);
            if (character.goals) chunks.push(`目标：${Utils.summarizeText(character.goals, 70)}`);
            return `- ${character.name || "未命名"}\n  ${chunks.join("\n  ")}`;
        }).join("\n");

        return `【本章出场/相关角色设定（防崩坏参考）】\n以下是本章相关角色的设定和固定名字，在正文中必须严格使用这些名字和人设，不得自行更改：\n${body}`;
    }

    buildVolumeSynopsisContext(project, currentVolumeNumber) {
        if (!project?.outline?.volumes?.length) {
            return "";
        }
        return project.outline.volumes.map((volume, index) => {
            if (!volume.summary && !volume.cliffhanger) {
                return "";
            }
            const prefix = index + 1 === currentVolumeNumber ? "【当前卷】" : "【参考卷】";
            const normalizedSummary = this.normalizeSynopsisReferenceText(project, volume.summary || "");
            const normalizedCliffhanger = this.normalizeSynopsisReferenceText(project, volume.cliffhanger || "");
            return [
                `${prefix} 第${index + 1}卷 ${volume.title || ""}`,
                normalizedSummary,
                normalizedCliffhanger ? `卷末钩子：${normalizedCliffhanger}` : ""
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
                        const chapterMatch = line.match(/^第\s*(\d+)\s*章/);
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
        return `- 第${item?.volumeNumber || "?"}卷第${item?.chapterNumber || "?"}章：${body}`;
    }

    buildSynopsisHistoryContext(project, currentVolumeNumber) {
        const items = this.collectSynopsisHistoryItems(project, currentVolumeNumber);
        if (!items.length) {
            return "";
        }

        return items.map((item) => `第${item.volumeNumber}卷 ${item.line}`).join("\n");
    }

    buildSynopsisPhaseGuide(chapterCount) {
        const total = Math.max(0, Number(chapterCount || 0));
        if (!total) {
            return "";
        }
        if (total <= 5) {
            return [
                "【本卷节奏护栏】",
                `共 ${total} 章，前半段先承接上一卷结尾并立起本卷目标，后半段把冲突推高后完成阶段性收束，结尾再留钩子。`
            ].join("\n");
        }

        const openingEnd = Math.max(1, Math.min(total, Math.ceil(total * 0.25)));
        const escalationEnd = Math.max(openingEnd + 1, Math.min(total, Math.ceil(total * 0.65)));
        const turnEnd = Math.max(escalationEnd + 1, Math.min(total, Math.ceil(total * 0.85)));
        const formatRange = (start, end) => start >= end ? `第${start}章` : `第${start}-${end}章`;
        const lines = ["【本卷节奏护栏】"];

        lines.push(`${formatRange(1, openingEnd)}：先承接上一卷结尾，明确本卷目标、压力和行动方向，不要空转。`);
        if (openingEnd + 1 <= escalationEnd) {
            lines.push(`${formatRange(openingEnd + 1, escalationEnd)}：持续升级阻力，让信息、关系、代价或位置发生连续变化，避免反复围着同一冲突打转。`);
        }
        if (escalationEnd + 1 <= turnEnd) {
            lines.push(`${formatRange(escalationEnd + 1, turnEnd)}：安排关键转折、失控点或重大代价，让局势明显改道。`);
        }
        if (turnEnd + 1 <= total) {
            lines.push(`${formatRange(turnEnd + 1, total)}：完成本卷阶段性收束并留下卷末钩子，但不要直接展开下一卷主线。`);
        }
        return lines.join("\n");
    }

    buildSynopsisClarityGuard({ volumeNumber, chapterCount, hasDetailedOutline = false }) {
        const lines = ["【当前卷执行护栏】"];
        if (hasDetailedOutline) {
            lines.push(`第 ${volumeNumber} 卷存在详细大纲时，优先服从详细大纲；简略卷纲只负责提醒方向，不要只围着抽象词打转。`);
        }
        lines.push("如果当前卷卷纲只写了抽象方向，你必须先在脑中补全：开局承接事件、本卷显性目标、中段持续阻力、关键转折、卷末落点，再分配到章节。");
        lines.push("允许必要过桥章，但过桥章必须至少带来一个可见变化：新信息、新决定、新代价、新位置或新关系。");
        lines.push("不要把上一章结尾换句话再写一遍；上一章的结果只能作为下一章的起点。");
        lines.push("禁止用“继续调查”“继续修炼”“关系升温”“局势变化”“暗流涌动”这类抽象词单独充当核心事件，必须落到具体动作和结果。");

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
            .map((item) => `第${item.index + 1}卷：${item.summary}`)
            .slice(-4);

        return [
            "优先规避套路化卷纲：重复打脸、机械升级、同构副本、只靠反转硬拽剧情。",
            "每卷最好有新的目标、新的压力源、新的信息增量和新的卷末钩子。",
            history.length ? `已有卷纲参考：\n${history.join("\n")}` : "",
            concept ? `故事概念提醒：${this.limitContext(concept, 500)}` : "",
            worldbuilding ? `世界观提醒：${this.limitContext(worldbuilding, 500)}` : ""
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
                return synopsis ? `【第${index + 1}卷细纲】\n${this.limitContext(synopsis, 2400)}` : "";
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
            "【⚠️ 以下情节已经使用过，绝对禁止重复或变相重复！】",
            previousLines.join("\n"),
            "",
            `（共${previousLines.length}章）`
        ].filter(Boolean).join("\n");
    }

    extractSynopsisEventBody(line) {
        const text = String(line || "").trim();
        if (!text) {
            return "";
        }
        const match = text.match(/^第\s*\d+\s*章[：:、.\-）)]?\s*(.+?)\s*[—\-－–]\s*(.+)$/);
        if (match) {
            return `${match[1].trim()} ${match[2].trim()}`.trim();
        }
        return text.replace(/^第\s*\d+\s*章[：:、.\-）)]?\s*/, "").trim();
    }

    normalizeSynopsisEventFingerprint(text) {
        return String(text || "")
            .replace(/[第卷章节：:、.\-—－–\s]/g, "")
            .replace(/[，。！？；、“”"']/g, "")
            .slice(0, 24);
    }

    buildSynopsisRepeatRiskSummary(lines) {
        const eventMap = new Map();
        const keywordRules = [
            { label: "比赛/考核", pattern: /比武|擂台|竞赛|比赛|考核|测试/g },
            { label: "修炼/突破", pattern: /修炼|闭关|突破|参悟/g },
            { label: "探索/秘境", pattern: /探索|秘境|寻宝|探险/g },
            { label: "身份揭露", pattern: /身份|真相|揭露|曝光/g },
            { label: "冲突对峙", pattern: /争执|对峙|冲突|交锋/g }
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
            "【重复风险摘要】",
            repeatedEvents.length
                ? `这些事件表达在前文里已经多次出现，请避免同构复写：\n${repeatedEvents.map((item) => `- ${this.limitContext(item.body, 48)}（约 ${item.count} 次）`).join("\n")}`
                : "",
            repeatedPatterns.length
                ? `这些桥段类型在前文中偏多，本卷请换角度、换阻力、换结果：\n${repeatedPatterns.map((item) => `- ${item.label}（约 ${item.count} 次）`).join("\n")}`
                : ""
        ].filter(Boolean).join("\n");
    }

    buildSynopsisInnovationPrompt(project, volumeNumber, concept, volumeSummary) {
        const currentOutlineText = [concept || "", volumeSummary || ""].filter(Boolean).join("\n");
        const analysis = this.analyzeSynopsisInnovation(project, volumeNumber, currentOutlineText);
        const promptParts = [];

        if (analysis.allowedRepeatEvents.length) {
            promptParts.push("【✨ 核心情节创新启发】");
            promptParts.push("以下情节类型可以再次出现，但必须写出和前文不同的细节、阻力与后果：");
            promptParts.push("（以下内容仅作启发，鼓励自由发挥，不是硬性选项）");
            analysis.allowedRepeatEvents.slice(0, 4).forEach((event) => {
                promptParts.push(`【${event.type}】约已出现 ${event.count} 次`);
                promptParts.push(`  💡 思考方向：${event.description}`);
                (event.variations || []).slice(0, 2).forEach((variation) => {
                    const [dimension] = String(variation || "").split("：");
                    promptParts.push(`  - 可以从“${dimension || variation}”角度换写法`);
                });
                if (event.examples?.[0]) {
                    promptParts.push(`  ✨ 参考启发：${event.examples[0]}`);
                }
                promptParts.push("  以上只给方向，不限制你自由创新。");
            });
        }

        const eventTypeSuggestions = this.getSynopsisEventTypeSuggestions();
        const selectedEventTypes = [];
        if (/战|斗|打|杀|反杀|交锋/.test(currentOutlineText)) {
            selectedEventTypes.push("战斗");
        }
        if (/修炼|突破|境界|闭关|顿悟/.test(currentOutlineText)) {
            selectedEventTypes.push("修炼");
        }
        if (/探索|秘境|寻宝|探查|调查/.test(currentOutlineText)) {
            selectedEventTypes.push("探索");
        }
        if (/对话|谈判|商量|问答|试探/.test(currentOutlineText)) {
            selectedEventTypes.push("对话");
        }
        if (!selectedEventTypes.length) {
            selectedEventTypes.push("战斗", "修炼", "探索");
        }

        promptParts.push("【🎨 创作启发】");
        promptParts.push("以下内容仅供参考，鼓励大胆创新：");
        selectedEventTypes.slice(0, 3).forEach((eventType) => {
            const suggestion = eventTypeSuggestions[eventType];
            if (!suggestion) {
                return;
            }
            promptParts.push(`【${eventType}类情节】`);
            if (suggestion.avoid?.[0]) {
                promptParts.push(`  不建议：${suggestion.avoid[0]}`);
            }
            if (suggestion.suggest?.[0]) {
                promptParts.push(`  可以考虑：${suggestion.suggest[0]}`);
            }
            promptParts.push("  更鼓励你突破常规，自由创造。");
        });

        const plotElements = this.getSynopsisPlotElements();
        promptParts.push("【🌈 灵感元素】");
        promptParts.push("可自由组合、拆分、改造、忽略：");
        Object.entries(plotElements).slice(0, 2).forEach(([type, elements]) => {
            promptParts.push(`  - ${type}：${(elements || []).slice(0, 2).join("、")}`);
        });
        if (analysis.repetitionRisks.length) {
            promptParts.push("【🔁 重复风险提醒】");
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
            "【⚠️ 已检测到的套路警告】",
            ...warnings.map((item) => `• ${item.category}：${item.pattern}${item.suggestion?.[0] ? `\n  建议：${item.suggestion[0]}` : ""}`)
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
            "【当前卷边界规则】",
            `当前只允许编写第 ${volumeNumber} 卷的细纲：${currentVolume?.title || ""}`,
            "本卷要完成本卷自己的推进、高潮和收束，不能把后续卷核心剧情提前写进来。"
        ];

        if (nextVolume?.title || nextVolume?.summary) {
            lines.push(`下一卷存在：${nextVolume.title || `第${volumeNumber + 1}卷`}。当前卷结尾可以留钩子，但不能直接写成下一卷开篇。`);
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
                return synopsis ? `【第${index + 1}卷细纲】\n${this.limitContext(synopsis, 2400)}` : "";
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

        const volumeTitles = volumes.map((volume, index) => String(volume?.title || `第${index + 1}卷`).trim()).filter(Boolean);
        const patterns = [];
        for (let i = 0; i < volumes.length + 3; i += 1) {
            patterns.push(`第${i + 1}卷`);
        }
        volumeTitles.forEach((title) => {
            if (title.length >= 2) {
                patterns.push(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
            }
        });

        const splitPattern = new RegExp(`(?:^|\\n)(?:#{1,3}\\s*|【|={3,}\\s*)?(${patterns.join("|")})(?:】|：|:|\\s|={3,})`, "g");
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
                const generic = marker.match(/第(\d+)卷/);
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
            const fallbackTitle = volumeTitles[volumeNumber - 1] || `第${volumeNumber}卷`;
            const startPos = fullOutline.indexOf(fallbackTitle);
            if (startPos >= 0) {
                let endPos = fullOutline.length;
                const nextTitle = volumeTitles[volumeNumber] || `第${volumeNumber + 1}卷`;
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
            adjacent.push(`上一卷末尾摘要：${Utils.summarizeText(previousSection.slice(-240), 240)}`);
        }
        const nextSection = String(sections[`vol_${volumeNumber}`] || "").trim();
        if (nextSection) {
            adjacent.push(`下一卷方向提示（仅供边界参考，严禁提前写入）：${Utils.summarizeText(nextSection.slice(0, 120), 120)}`);
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
                events.push(`第${number || "?"}章：${text}`);
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
            "【已有剧情事件（严禁重复）】",
            "以下事件已在已有章节中发生过，新生成章节中不得出现相同或高度相似的情节：",
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
                const title = chapter.title || `第${chapter.number || chapter.chapter_number || "?"}章`;
                const keyEvent = chapter.key_event || chapter.keyEvent || "";
                const summary = chapter.summary || "";
                const brief = keyEvent || Utils.summarizeText(summary, 160);
                return `[${title}] ${brief}`;
            });
            parts.push(`【前文全部大纲摘要（共${previousChapters.length}章，压缩版，用于理解完整剧情脉络）】\n${briefLines.join("\n")}`);

            const recentFull = previousChapters.slice(-10).map((chapter) => {
                const title = chapter.title || `第${chapter.number || chapter.chapter_number || "?"}章`;
                return `【${title}】\n${Utils.summarizeText(chapter.summary || chapter.key_event || "", 600)}`;
            });
            if (recentFull.length) {
                parts.push(`【前文最近10章完整大纲（续写必须紧接最后一章的结尾）】\n${recentFull.join("\n\n")}`);
            }
        }

        const previousSynopsisContext = this.buildPreviousChapterSynopsisContext(project, volumeNumber);
        if (previousSynopsisContext) {
            parts.push(`【前面细纲汇总】\n${previousSynopsisContext}`);
        }

        return parts.join("\n---\n");
    }

    buildPlotUnitContext(startChapter, endChapter) {
        const firstUnit = Math.floor((Math.max(1, startChapter) - 1) / 8) + 1;
        const lastUnit = Math.floor((Math.max(1, endChapter) - 1) / 8) + 1;
        const phaseFor = (chapter) => {
            const pos = ((chapter - 1) % 8) + 1;
            if (pos <= 2) return "开端";
            if (pos <= 5) return "发展";
            if (pos <= 7) return "高潮";
            return "结尾";
        };

        const lines = [
            `生成章节范围：第 ${startChapter}-${endChapter} 章`,
            `涉及剧情单元：第 ${firstUnit}${lastUnit > firstUnit ? ` - ${lastUnit}` : ""} 单元`,
            "每 8 章组成一个完整小剧情单元：1-2 章开端，3-5 章发展，6-7 章高潮，第 8 章收束。",
            `起始章节所处阶段：${phaseFor(startChapter)}`,
            `结束章节所处阶段：${phaseFor(endChapter)}`
        ];

        if (phaseFor(startChapter) === "开端" && firstUnit > 1) {
            lines.push(`当前批次开头要承接第 ${firstUnit - 1} 单元结尾留下的伏笔。`);
        }
        if (phaseFor(endChapter) === "结尾") {
            lines.push(`当前批次结尾要为第 ${lastUnit + 1} 单元埋下悬念钩子。`);
        }

        lines.push("next_chapter_setup 字段必须严格遵守：只写铺垫，不写结果。");
        return lines.join("\n");
    }

    getPlotUnitPhaseBlueprint() {
        return {
            开端: {
                coreTasks: ["引入当前单元冲突", "承接上一单元余波", "建立本单元目标"],
                elements: {
                    引爆点: ["新的任务", "新的敌意", "新的误会", "新的线索"],
                    承接点: ["上章留下的异样", "未解释的动作", "未兑现的承诺", "仍在发酵的后果"]
                },
                guidance: "开端阶段要先把当前8章单元的核心矛盾立住，同时明确承接上一段剧情，不要一上来就把高潮写完。"
            },
            发展: {
                coreTasks: ["推进主冲突", "抬高代价", "让人物关系或信息发生变化"],
                elements: {
                    升级点: ["误判升级", "线索反转", "局势压迫", "资源受限"],
                    人物关系: ["合作生裂痕", "敌意加深", "信任试探", "利益交换"]
                },
                guidance: "发展阶段要持续推进，不要原地踏步。每章都要有新信息、新变化或新的代价。"
            },
            高潮: {
                coreTasks: ["集中爆发主要矛盾", "逼角色做关键选择", "让前文铺垫产生回响"],
                elements: {
                    爆发点: ["正面交锋", "真相撕开", "计划失控", "情绪失守"],
                    代价: ["失去筹码", "关系破裂", "暴露秘密", "局面反噬"]
                },
                guidance: "高潮阶段要有强烈冲突和明确代价，不能只是喊口号，必须真的改变局势。"
            },
            结尾: {
                coreTasks: ["完成本单元收束", "回收至少一项铺垫", "为下一单元留下钩子"],
                elements: {
                    收束方式: ["阶段性胜负", "局面暂稳", "误会加深", "新的任务落下"],
                    悬念钩子: ["更大的敌人", "新暴露的真相", "突如其来的消息", "尚未解释的异常"]
                },
                guidance: "结尾阶段要有阶段性结果，但不能平平落地。必须留出推动下一单元的悬念钩子。"
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
            return { phase: "开端", position };
        }
        if (position <= 5) {
            return { phase: "发展", position };
        }
        if (position <= 7) {
            return { phase: "高潮", position };
        }
        return { phase: "结尾", position };
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
                priority: "高",
                message: `建议创建第 ${unitNumber} 个剧情单元，明确当前8章的核心冲突和阶段目标。`,
                coreTasks: ["确定本单元主冲突", "安排与上一单元的承接", "提早埋下结尾钩子"],
                elements: ["新任务", "新敌意", "新秘密"],
                guidance: "如果这是新单元开端，先立目标和矛盾，不要一上来把结果说穿。"
            });
            return suggestions;
        }

        const currentPhaseInfo = phaseInfo[phase.phase] || {};
        const elementHints = Object.values(currentPhaseInfo.elements || {})
            .slice(0, 2)
            .map((list) => Array.isArray(list) ? list.slice(0, 2).join(" / ") : "")
            .filter(Boolean);

        suggestions.push({
            priority: "高",
            message: `第 ${unit.unit_number} 个单元当前处于${phase.phase}阶段（第 ${phase.position} 章）。`,
            coreTasks: currentPhaseInfo.coreTasks || [],
            elements: elementHints,
            guidance: currentPhaseInfo.guidance || ""
        });

        if (phase.phase === "开端" && unit.unit_number > 1) {
            const prevUnit = manager.plot_units[`pu_v${volumeNumber}_u${unit.unit_number - 1}`];
            if (prevUnit) {
                suggestions.push({
                    priority: "极高",
                    message: `必须承接第 ${unit.unit_number - 1} 个单元结尾留下的悬念。`,
                    coreTasks: prevUnit.connection_to_next ? [prevUnit.connection_to_next] : [],
                    elements: prevUnit.suspense_hook ? [prevUnit.suspense_hook] : [],
                    guidance: "开端阶段先接上前面留下的问题，再展开当前单元的主冲突。"
                });
            }
        }

        if (phase.phase === "结尾") {
            suggestions.push({
                priority: "极高",
                message: "本章段如果收在单元结尾，必须形成阶段性结果，并埋下下一单元钩子。",
                coreTasks: ["回收至少一项伏笔", "留下新悬念", "next_chapter_setup 只写因不写果"],
                elements: (phaseInfo.结尾?.elements?.悬念钩子 || []).slice(0, 3),
                guidance: phaseInfo.结尾?.guidance || ""
            });
        }

        return suggestions;
    }

    buildPlotUnitSuggestionText(project, volumeNumber, currentChapter) {
        const suggestions = this.buildPlotUnitSuggestionEntries(project, volumeNumber, currentChapter);
        if (!suggestions.length) {
            return "";
        }

        const lines = ["【剧情单元发展建议】"];
        suggestions.slice(0, 3).forEach((item) => {
            lines.push(`• [${item.priority}] ${item.message}`);
            if (item.coreTasks?.length) {
                lines.push(`  核心任务：${item.coreTasks.slice(0, 2).join("、")}`);
            }
            if (item.elements?.length) {
                lines.push(`  元素启发：${item.elements.join("、")}`);
            }
            if (item.guidance) {
                lines.push(`  提示：${item.guidance}`);
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

        const lines = ["", "════════════════════════════════════════════", "【剧情单元追踪报告】", "════════════════════════════════════════════"];
        if (activeUnits.length) {
            lines.push("【当前活跃单元】");
            activeUnits.forEach((unit) => {
                lines.push(`• 第${unit.unit_number}单元（第${unit.start_chapter}-${unit.end_chapter}章）`);
                lines.push(`  阶段：${unit.current_phase || "未知"} | 核心冲突：${unit.core_conflict || "待补充"}`);
                if (unit.suspense_hook) {
                    lines.push(`  悬念钩子：${unit.suspense_hook}`);
                }
                if (unit.connection_to_previous) {
                    lines.push(`  对上一单元承接：${unit.connection_to_previous}`);
                }
                if (unit.connection_to_next) {
                    lines.push(`  对下一单元铺垫：${unit.connection_to_next}`);
                }
            });
        }

        if (currentChapter && plotUnits.length > 1) {
            lines.push("", "【单元衔接提醒】");
            lines.push("• 前一单元的结尾，要自然变成后一单元的开端。");
            lines.push("• 单元结尾必须留下钩子，单元开端必须承接旧问题。");
            lines.push("• 不要把后续单元的大高潮提前压缩到当前批次。");
        }

        lines.push("════════════════════════════════════════════");
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
                && !background.includes("提及角色")
                && !background.includes("后续可补充背景");
            const shouldExclude = !this.isGenericCharacterCandidateName(primaryName)
                && (substantiveFieldCount >= 2 || hasGeneratedBackground);
            if (!shouldExclude) {
                return;
            }
            if (primaryName) {
                existingAllNames.add(primaryName);
            }
            Utils.ensureArrayFromText(character.aliases || character["别名"] || "")
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
                roleMap[cleanName].description = [roleMap[cleanName].description, String(description || "").trim()].filter(Boolean).join("；");
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
                if (line.includes("【出场人物】")) {
                    inCharSection = true;
                    return;
                }
                if (inCharSection && line.startsWith("【")) {
                    inCharSection = false;
                    return;
                }
                if (!inCharSection || (!line.startsWith("-") && !line.startsWith("•"))) {
                    return;
                }

                const content = line.slice(1).trim();
                if (!content) {
                    return;
                }

                let label = content;
                let desc = "";
                if (content.includes("（")) {
                    const parts = content.split("（", 2);
                    label = parts[0].trim();
                    desc = parts[1].replace(/）/g, "").trim();
                } else if (content.includes("(")) {
                    const parts = content.split("(", 2);
                    label = parts[0].trim();
                    desc = parts[1].replace(/\)/g, "").trim();
                } else if (content.includes("：")) {
                    const parts = content.split("：", 2);
                    label = parts[0].trim();
                    desc = parts[1].trim();
                } else if (content.includes(":")) {
                    const parts = content.split(":", 2);
                    label = parts[0].trim();
                    desc = parts[1].trim();
                }

                addRole(label, desc || `第${chapter.number}章出场人物`);
            });
        });

        return roleMap;
    }

    normalizeOutlineCharacterLabel(value) {
        let normalized = String(value || "")
            .replace(/^[•\-]\s*/, "")
            .replace(/\s+/g, " ")
            .replace(/^(她的|他的|我的|你的|其|这个|那个|这位|那位|这名|那名|该|他|她)/, "")
            .split(/[（(：:]/)[0]
            .trim();

        normalized = normalized.replace(/^(给|对|向|跟|和|把|被)(?=[\u4e00-\u9fa5]{2,8}$)/u, "");
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

        const rolePattern = "(?:龙神|神胎|审判官|骑士|圣骑士|主教|祭司|侍女|丫鬟|婢女|护卫|下属|手下|师兄|师姐|师弟|师妹|师父|师母|父亲|母亲|亲妈|后妈|养母|养父|继母|继父|哥哥|姐姐|妹妹|弟弟|继姐|继妹|继兄|继弟|老婆|老公|前夫|前妻|丈夫|妻子|未婚夫|未婚妻|婆婆|公公|岳母|岳父|嫂子|姐夫|妹夫|小姨|姨妈|婶子|姑妈|舅妈|舅舅|姑父|同门|同伴|邻居|室友|同事|上司|老板|老师|学生|某人|某助理|某同事|某老师|某医生|某护士|某警官|某秘书|助理|秘书|医生|护士|警官|路人|保镖|司机|管家|校医|同学|学长|学姐|前台|店员|经理|总监|院长|教授|导师|研究员|顾问|学徒|工程师|技工|组长|厂长|副厂长|技术员|组员|科员|检查组长|检查组组长)";
        const suffixIndexPattern = "[A-Za-z甲乙丙丁戊己庚辛壬癸一二三四五六七八九十0-9]*";
        if (new RegExp(`^[\\u4e00-\\u9fa5]{0,4}${rolePattern}${suffixIndexPattern}$`).test(cleanName)) {
            return true;
        }
        return /^(?:[\u4e00-\u9fa5]{1,6}的)?(?:亲妈|后妈|养母|养父|继母|继父|继姐|继妹|继兄|继弟|母亲|父亲|姐姐|哥哥|妹妹|弟弟|嫂子|姐夫|前夫|前妻|未婚夫|未婚妻)$/.test(cleanName);
    }

    isLikelyActionLikeCharacterCandidate(name) {
        const cleanName = String(name || "").trim();
        if (!cleanName) {
            return true;
        }

        if (/^(来到|走到|走向|回到|前往|进入|退出|安抚|搀扶|扶住|抱住|推开|拉住|护着|护住|陪着|跟着|看向|盯着|听见|说出|问道|低头|抬头|伸手|抬手|转身|起身|坐在|站在|站到|跑到|冲向|带着|带回|放下|拿起|递给|送到|拖着|抱着|扶着)/.test(cleanName)) {
            return true;
        }

        if (/^(护|救|追|找|送|陪|扶|拉|推|抱|背|拖|带|拦|追赶|安抚)[\u4e00-\u9fa5]{2,4}$/.test(cleanName) && !this.matchesGenericRolePattern(cleanName)) {
            return true;
        }

        if (/(图书馆|教室|办公室|公司|医院|宿舍|门口|楼下|楼上|会议室|洗手间|病房|大厅|车里|路边|街上|餐厅|书房|厨房)$/.test(cleanName)) {
            return true;
        }

        if (/[，。！？、,.!?]/.test(cleanName)) {
            return true;
        }

        if ((cleanName.includes("的") || cleanName.includes("了") || cleanName.includes("着") || cleanName.includes("地")) && !this.matchesGenericRolePattern(cleanName)) {
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
            "欧阳", "上官", "司马", "慕容", "诸葛", "南宫", "夏侯", "令狐", "皇甫", "轩辕",
            "宇文", "长孙", "司徒", "司空", "西门", "东方", "独孤", "北冥", "公孙", "尉迟",
            "澹台", "拓跋", "百里", "钟离", "东郭", "呼延"
        ];
        if (compoundSurnames.some((surname) => cleanName.startsWith(surname) && cleanName.length >= surname.length + 1)) {
            return true;
        }

        const commonSurnames = new Set("赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包左石崔吉钮龚程嵇邢裴陆荣翁荀羊於惠甄曲封储靳焦牧山蔡田樊胡霍司黎乔苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍璩桑桂濮牛寿通边扈燕冀郏浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东殴殳沃利蔚越夔隆师巩厍聂晁勾敖融冷辛阚那简饶空曾沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公仉督岳帅缑亢况郈有琴归海梁丘左丘东门南门商牟佘佟墨哈谯笪年爱阳佴伯赏南荣楚晋".split(""));
        if (commonSurnames.has(cleanName.charAt(0))) {
            return true;
        }

        if (/^[老小阿][\u4e00-\u9fa5]{1,3}$/.test(cleanName)) {
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
        if (/系统|空间|面板|任务|奖励|提示|雷达|通知/.test(cleanName)) {
            return false;
        }
        if (/^(男宝|女宝)$/.test(cleanName)) {
            return true;
        }
        return /(王爷|王妃|国师|质子|太医令|太医|侍郎|尚书|统领|首领|总管|宗令|宫女|嬷嬷|刺客|党羽|护卫|暗卫|侍卫|侍从|军师|知府|县令|公主|郡主|世子|皇子|皇女|皇孙|太子|太女|太后|皇后|掌柜|伙计|先生|姑娘|公子|王|令|官|使|卫|将|帅|师|医)$/.test(cleanName);
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

        if (/^[\u4e00-\u9fa5]{2,8}(先生|小姐|女士|老师|医生|护士|主任|教授)$/.test(cleanName)) {
            return true;
        }

        return false;
    }
    extractOutlineCharacterEntries(summary) {
        const text = String(summary || "");
        if (!text.trim()) {
            return [];
        }

        const sectionMatch = text.match(/【出场人物】\s*([\s\S]*?)(?=\n【|$)/);
        const section = sectionMatch?.[1] ? String(sectionMatch[1]).trim() : "";
        if (!section) {
            return [];
        }

        const entries = [];
        section.split(/\r?\n/).forEach((line) => {
            const rawLine = line.trim();
            if (!rawLine || (!rawLine.startsWith("-") && !rawLine.startsWith("•"))) {
                return;
            }

            const cleaned = rawLine.replace(/^[•-]\s*/, "");
            let label = cleaned;
            let description = "";

            if (cleaned.includes("（")) {
                const parts = cleaned.split("（", 2);
                label = parts[0].trim();
                description = String(parts[1] || "").replace(/）/g, "").trim();
            } else if (cleaned.includes("(")) {
                const parts = cleaned.split("(", 2);
                label = parts[0].trim();
                description = String(parts[1] || "").replace(/\)/g, "").trim();
            } else if (cleaned.includes("：")) {
                const parts = cleaned.split("：", 2);
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
            const relationships = String(character.relationships || character["人物关系"] || "").trim();
            if (!name || !relationships) {
                return;
            }
            if (!focusSet.size || focusSet.has(name) || Array.from(focusSet).some((target) => relationships.includes(target))) {
                pushLine(`- ${name}：${Utils.summarizeText(relationships, 120)}`);
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
            const relation = value?.关系 || value?.relationship || value?.relations || "相关";
            pushLine(`- ${left} <-> ${right}：${relation}`);
        });

        return lines.length ? lines.join("\n") : "暂无已建立关系";
    }

    getOutlineCharacterExcludedNames() {
        return new Set([
            "主角", "男主", "女主", "反派", "路人", "众人", "少年", "少女", "男人", "女人",
            "师尊", "掌门", "长老", "弟子", "同门", "敌人", "对手", "黑影", "来人", "医者"
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
            Utils.ensureArrayFromText(character.aliases || character["别名"] || "")
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
            ...(Array.isArray(character?.aliases) ? character.aliases : Utils.ensureArrayFromText(character?.aliases || character?.["别名"] || ""))
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
                    new RegExp(`(^|[：:、，；;（(\\s])${cleanAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=的|是|与|和|跟|及|、|，|；|。|）|\\)|\\s|$)`, "g"),
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
        const relationKeywords = /父亲|母亲|亲妈|后妈|养母|养父|继母|继父|继姐|继妹|继兄|继弟|哥哥|姐姐|妹妹|弟弟|夫妻|妻子|丈夫|恋人|未婚夫|未婚妻|朋友|敌对|敌人|仇敌|对手|同门|师徒|师兄妹|上下级|上司|下属|同事|盟友|帮凶|旧识|亲属|母女|父女|姐妹|兄妹/;
        const noiseKeywords = /后续可补充|信息后续补充|提及角色|剧情中|经历了|心理落差|不死心|想要报复|煽风点火|无情粉碎|装作|试图|企图|表面上|实则/;
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
            .replace(/^[，、；;：:\-•\s]+/, "")
            .replace(/[，、；;：:\-•\s]+$/, "")
            .replace(/([\u4e00-\u9fa5]{2,4})(?:\1){1,}/g, "$1")
            .replace(/([\u4e00-\u9fa5]{2,4})的\1的/g, "$1的")
            .trim();

        const clauses = normalized
            .split(/[\r\n]+|[；;。]+/)
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
            return deduped.join("；");
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
