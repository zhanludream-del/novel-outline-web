class NovelGenerator {
    constructor(apiClient) {
        this.api = apiClient;
    }

    async generateWorldbuilding({ title, concept, genre, theme }) {
        const systemPrompt = [
            "你是一名经验丰富的中文网文策划编辑。",
            "你的任务是根据小说标题、题材和故事概念，生成适合长篇连载的世界观设定。",
            "输出纯文本，不要使用 markdown 标题。"
        ].join("\n");

        const userPrompt = [
            `小说标题：${title}`,
            `题材：${genre || "未指定"}`,
            `核心主题：${theme || "未指定"}`,
            `故事概念：${concept}`,
            "",
            "请生成 300-500 字的世界观设定，要求：",
            "1. 解释世界规则、冲突来源和人物生存逻辑。",
            "2. 要能服务后续卷纲推进，而不是空泛背景介绍。",
            "3. 语言偏网文策划，不要写成百科。"
        ].join("\n");

        return (await this.api.callLLM(userPrompt, systemPrompt, {
            temperature: 0.75,
            maxTokens: 1800
        })).trim();
    }

    async generateVolumeSynopsis({ title, concept, genre, theme, worldbuilding, volumeCount, chaptersPerVolume }) {
        const systemPrompt = [
            "你是一名资深小说总规划师。",
            "请把一个故事拆成多卷卷纲，输出 JSON 数组。",
            "每一卷必须兼顾目标、冲突、高潮和卷尾钩子。"
        ].join("\n");

        const userPrompt = [
            `小说标题：${title}`,
            `题材：${genre || "未指定"}`,
            `核心主题：${theme || "未指定"}`,
            `故事概念：${concept}`,
            `计划卷数：${volumeCount}`,
            `每卷计划章节数：${chaptersPerVolume}`,
            `世界观：${worldbuilding || "暂无"}`,
            "",
            "请输出 JSON 数组，每个对象包含以下字段：",
            'volume_number: 卷序号',
            'title: 卷名',
            'summary: 本卷 150-220 字摘要，说明起承转合与高潮',
            'cliffhanger: 本卷结尾钩子，一句话',
            "",
            "不要输出任何 JSON 之外的说明。"
        ].join("\n");

        const parsed = await this.requestJSONArray(systemPrompt, userPrompt, {
            temperature: 0.72,
            maxTokens: 6000
        });

        return parsed.map((item, index) => ({
            volume_number: Number(item.volume_number || index + 1),
            title: item.title || `第${index + 1}卷`,
            summary: item.summary || "",
            cliffhanger: item.cliffhanger || ""
        }));
    }

    async generateChapterSynopsis({
        title,
        concept,
        genre,
        worldbuilding,
        volumeNumber,
        chapterCount,
        volumeSummary,
        existingSynopsis
    }) {
        const systemPrompt = [
            "你是一名章节策划编辑。",
            "你的任务是根据卷纲，拆出一卷的章节细纲。",
            "请输出 JSON 数组，不要输出任何额外说明。"
        ].join("\n");

        const userPrompt = [
            `小说标题：${title}`,
            `题材：${genre || "未指定"}`,
            `故事概念：${concept}`,
            `世界观：${worldbuilding || "暂无"}`,
            `当前卷：第${volumeNumber}卷`,
            `计划章节数：${chapterCount}`,
            `卷纲：${volumeSummary || "暂无"}`,
            existingSynopsis ? `已有细纲：${existingSynopsis}` : "",
            "",
            "请输出 JSON 数组，每个对象包含字段：",
            'chapter_number: 章节号',
            'title: 章节标题',
            'key_event: 核心事件',
            'emotion_curve: 情绪变化',
            'synopsis: 100-160 字的章节细纲',
            "",
            "章节之间要有递进，避免重复。"
        ].filter(Boolean).join("\n");

        const parsed = await this.requestJSONArray(systemPrompt, userPrompt, {
            temperature: 0.72,
            maxTokens: 8000
        });

        return parsed.map((item, index) => ({
            chapter_number: Number(item.chapter_number || index + 1),
            title: item.title || `第${index + 1}章`,
            key_event: item.key_event || "",
            emotion_curve: item.emotion_curve || "",
            synopsis: item.synopsis || ""
        }));
    }

    async generateGlobalPlan({ title, theme, concept, worldbuilding, volumes }) {
        const systemPrompt = [
            "你是一名长篇网文总编。",
            "请根据世界观和卷纲，写出整本书的全局规划。",
            "输出纯文本，不要用 markdown。"
        ].join("\n");

        const volumeText = volumes.map((volume, index) =>
            `第${index + 1}卷《${volume.title || `第${index + 1}卷`}》：${volume.summary || "暂无摘要"}`
        ).join("\n");

        const userPrompt = [
            `小说标题：${title}`,
            `核心主题：${theme || "未指定"}`,
            `故事概念：${concept || "暂无"}`,
            `世界观：${worldbuilding || "暂无"}`,
            "卷纲：",
            volumeText || "暂无",
            "",
            "请输出 400-700 字的全局规划，包含：主线推进、阶段转折、感情线/人物线、后期升级空间。"
        ].join("\n");

        return (await this.api.callLLM(userPrompt, systemPrompt, {
            temperature: 0.68,
            maxTokens: 2200
        })).trim();
    }

    async generateChapterOutlinesBatch({
        project,
        volume,
        volumeNumber,
        startChapter,
        endChapter,
        existingChapters
    }) {
        const existingSummary = (existingChapters || [])
            .slice(-4)
            .map((chapter) =>
                `第${chapter.number}章 ${chapter.title || ""}：${Utils.summarizeText(chapter.summary, 90)}`
            )
            .join("\n");

        const characterDigest = (project.outline.characters || [])
            .slice(0, 10)
            .map((character) =>
                `${character.name || "未命名"}：${Utils.summarizeText(character.identity || character.personality, 36)}`
            )
            .join("\n");
        const guardContext = this.buildGenerationGuards(project, volumeNumber, startChapter);

        const systemPrompt = [
            "你是一名章节大纲策划编辑。",
            "现在要为长篇小说批量生成章节大纲。",
            "请严格输出 JSON 数组，不要输出任何额外说明。",
            guardContext
        ].join("\n\n");

        const userPrompt = [
            `小说标题：${project.outline.title}`,
            `题材：${project.outline.subgenre || project.outline.genre || "未指定"}`,
            `故事概念：${project.outline.storyConcept || "暂无"}`,
            `世界观：${project.outline.worldbuilding || "暂无"}`,
            `全局规划：${project.outline.global_plan_text || project.outline.global_plan || "暂无"}`,
            `当前卷：第${volumeNumber}卷 ${volume.title || ""}`,
            `当前卷摘要：${volume.summary || "暂无"}`,
            `当前卷章节细纲：${volume.chapterSynopsis || "暂无"}`,
            characterDigest ? `主要人物：\n${characterDigest}` : "",
            existingSummary ? `前情提要：\n${existingSummary}` : "",
            "",
            `请生成第 ${startChapter} 章到第 ${endChapter} 章的章节大纲。`,
            "输出 JSON 数组，每个对象至少包含以下字段：",
            'chapter_number: 章节号',
            'title: 章节标题',
            'summary: 必须使用 System 9 风格模板，至少包含【章节目标】【出场人物】【场景】【核心事件】【情绪曲线】【情节推进】【伏笔处理】【下章铺垫】这些标签',
            'key_event: 核心事件',
            'emotion_curve: 情绪曲线',
            'characters: 出场人物数组',
            'foreshadows: 本章埋下或回收的伏笔数组',
            'plot_unit: { unit_number, unit_phase, unit_position, connects_to_previous, sets_up_next }',
            'next_chapter_setup: { state_setup, atmosphere_setup, suspense_hook, clue_hint, countdown }',
            'uuid: 章节 UUID',
            "",
            "要求：",
            "1. 相邻章节有推进关系，结尾尽量留钩子。",
            "2. 【下章铺垫】只能写状态、氛围、悬念和线索，不要直接剧透下章结果。",
            "3. 不要输出任何 JSON 之外的说明。"
        ].filter(Boolean).join("\n");

        const parsed = await this.requestJSONArray(systemPrompt, userPrompt, {
            temperature: 0.75,
            maxTokens: 12000,
            timeout: 240000
        });

        return parsed.map((item, index) => ({
            uuid: item.uuid || Utils.uid("chapter"),
            number: Number(item.chapter_number || startChapter + index),
            chapter_number: Number(item.chapter_number || startChapter + index),
            title: item.title || `第${startChapter + index}章`,
            summary: item.summary || item.synopsis || "",
            content: item.content || "",
            keyEvent: item.key_event || "",
            key_event: item.key_event || "",
            emotionCurve: item.emotion_curve || "",
            emotion_curve: item.emotion_curve || "",
            characters: Utils.ensureArrayFromText(item.characters),
            foreshadows: Utils.ensureArrayFromText(item.foreshadows),
            plot_unit: item.plot_unit || {},
            next_chapter_setup: item.next_chapter_setup || {}
        }));
    }

    async expandChapterContent({ project, volume, chapter }) {
        const relevantCharacters = this.collectRelevantCharacters(project, `${chapter.summary || ""}\n${chapter.content || ""}`);
        const characterDigest = this.buildRelevantCharactersInfo(relevantCharacters);
        const guardContext = this.buildGenerationGuards(project, null, chapter.number || 0);
        const promptTemplate = project.prompt_state?.current_prompt || "";
        const prevContent = this.getPreviousChapterContents(project, volume, chapter);
        const nextOutline = this.getNextChapterOutline(project, volume, chapter);
        const frequency = project.prompt_state?.chapter_frequency || "male";

        const systemPrompt = [
            "你是一名擅长中文网文的章节写手。",
            "请根据已经确认的章纲，扩写章节正文草稿。",
            "输出纯文本，不要使用 markdown 小标题。",
            guardContext
        ].join("\n\n");

        const userPrompt = this.composeChapterPrompt({
            project,
            volume,
            chapter,
            promptTemplate,
            prevContent,
            nextOutline,
            characterDigest,
            frequency
        });

        return (await this.api.callLLM(userPrompt, systemPrompt, {
            temperature: 0.82,
            maxTokens: 5000,
            timeout: 240000
        })).trim();
    }

    async requestJSONArray(systemPrompt, userPrompt, options) {
        const raw = await this.api.callLLM(userPrompt, systemPrompt, options);
        const parsed = Utils.parseJsonResponse(raw);
        if (!Array.isArray(parsed)) {
            throw new Error("AI 返回内容无法解析为 JSON 数组，请重试一次。");
        }
        return parsed;
    }

    buildGenerationGuards(project, volumeNumber, chapterNumber) {
        const blocks = [];
        const globalSetting = project.global_setting_note || "";
        if (globalSetting) {
            blocks.push(`【全局设定提醒】\n${globalSetting}`);
        }

        const hiddenSecrets = this.buildHiddenSecretGuard(project, chapterNumber);
        if (hiddenSecrets) {
            blocks.push(hiddenSecrets);
        }

        const storyState = this.buildStoryStateGuard(project);
        if (storyState) {
            blocks.push(storyState);
        }

        const nameLock = this.buildNameLockGuard(project);
        if (nameLock) {
            blocks.push(nameLock);
        }

        const timeline = this.buildTimelineGuard(project, chapterNumber);
        if (timeline) {
            blocks.push(timeline);
        }

        const foreshadow = this.buildForeshadowGuard(project, chapterNumber);
        if (foreshadow) {
            blocks.push(foreshadow);
        }

        const personality = this.buildPersonalityGuard(project);
        if (personality) {
            blocks.push(personality);
        }

        const appearance = this.buildAppearanceGuard(project);
        if (appearance) {
            blocks.push(appearance);
        }

        const dialogue = this.buildDialogueGuard(project, chapterNumber);
        if (dialogue) {
            blocks.push(dialogue);
        }

        const snapshot = this.buildSnapshotGuard(project, chapterNumber);
        if (snapshot) {
            blocks.push(snapshot);
        }

        const dynamicState = this.buildDynamicStateGuard(project);
        if (dynamicState) {
            blocks.push(dynamicState);
        }

        if (volumeNumber) {
            blocks.push(`【卷边界规则】当前只允许处理第${volumeNumber}卷范围内的剧情，不要提前透支后续卷的重要事件。`);
        }

        return blocks.filter(Boolean).join("\n\n");
    }

    buildHiddenSecretGuard(project, chapterNumber) {
        const text = [
            project.outline?.detailed_outline || "",
            project.outline?.global_plan_text || project.outline?.global_plan || "",
            project.outline?.user_context || ""
        ].join("\n");
        if (!text) {
            return "";
        }

        const found = [];
        const patterns = [
            /揭露在第\s*(\d+)\s*章/g,
            /直到第\s*(\d+)\s*章才(?:揭露|知道|发现)/g,
            /在第\s*(\d+)\s*章揭露/g,
            /隐瞒.*?第\s*(\d+)\s*章/g
        ];

        patterns.forEach((pattern) => {
            for (const match of text.matchAll(pattern)) {
                found.push(Number(match[1]));
            }
        });

        const sensitiveWords = [];
        const keywords = ["怀孕", "身世", "真实身份", "双重身份", "秘密", "隐瞒"];
        keywords.forEach((word) => {
            if (text.includes(word)) {
                sensitiveWords.push(word);
            }
        });

        if (!found.length && !sensitiveWords.length) {
            return "";
        }

        const earliestReveal = found.length ? Math.min(...found) : null;
        const mustHide = earliestReveal && chapterNumber && chapterNumber < earliestReveal;
        const lines = [
            "【剧透与伏笔控制】",
            "严禁在未明确允许的章节提前揭露重大秘密、真实身份、身世、怀孕等信息。"
        ];

        if (earliestReveal) {
            lines.push(`检测到最早明确揭露节点可能在第${earliestReveal}章。`);
        }
        if (sensitiveWords.length) {
            lines.push(`敏感设定关键词：${sensitiveWords.join("、")}`);
        }
        if (mustHide) {
            lines.push(`当前是第${chapterNumber}章，在揭露节点前只能保持模糊暗示，禁止确认性提示。`);
        }

        return lines.join("\n");
    }

    buildStoryStateGuard(project) {
        const storyState = project.outline?.story_state || project.story_state || {};
        const lines = [];
        if (storyState.current_location) {
            lines.push(`当前地点：${storyState.current_location}`);
        }
        if (storyState.timeline) {
            lines.push(`当前时间线：${Utils.summarizeText(storyState.timeline, 80)}`);
        }
        if (storyState.important_items) {
            lines.push(`重要物品：${Utils.summarizeText(storyState.important_items, 80)}`);
        }
        if (storyState.pending_plots) {
            lines.push(`待推进事项：${Utils.summarizeText(storyState.pending_plots, 100)}`);
        }

        const characters = storyState.characters || {};
        const names = Object.keys(characters).slice(0, 6);
        if (names.length) {
            lines.push(`角色状态：${names.map((name) => `${name}(${Utils.summarizeText(JSON.stringify(characters[name]), 24)})`).join("；")}`);
        }

        return lines.length ? `【当前故事状态（必须延续）】\n${lines.join("\n")}` : "";
    }

    buildNameLockGuard(project) {
        const lockedNames = project.name_locker?.locked_names || {};
        const lines = [];
        Object.entries(lockedNames).forEach(([category, names]) => {
            const entries = Object.keys(names || {}).slice(0, 8);
            if (entries.length) {
                lines.push(`${category}：${entries.join("、")}`);
            }
        });
        return lines.length ? `【名称锁定（防止改名）】\n${lines.join("\n")}` : "";
    }

    buildTimelineGuard(project, chapterNumber) {
        const tracker = project.timeline_tracker || {};
        const events = tracker.timeline_events || [];
        const constraints = tracker.time_constraints || [];
        const lines = [];
        if (events.length) {
            const latest = events.slice(-5).map((item) =>
                `第${item["章节"] || item.chapter || "?"}章：${item["时间点"] || item.time_point || item.event || item["事件"] || ""}`
            );
            lines.push(...latest);
        }
        if (constraints.length) {
            const active = constraints
                .filter((item) => !chapterNumber || !item["预计完成章节"] || Number(item["预计完成章节"]) >= chapterNumber)
                .slice(0, 4)
                .map((item) => `${item["设定"] || item.constraint_desc || ""}（持续：${item["持续时间"] || item.duration_desc || ""}）`);
            if (active.length) {
                lines.push(`时间约束：${active.join("；")}`);
            }
        }
        return lines.length ? `【时间线约束】\n${lines.join("\n")}` : "";
    }

    buildForeshadowGuard(project, chapterNumber) {
        const tracker = project.foreshadow_tracker?.foreshadows || {};
        const unresolved = Object.values(tracker)
            .filter((item) => item && item["状态"] !== "已回收")
            .sort((a, b) => Number(a["埋设章节"] || 0) - Number(b["埋设章节"] || 0))
            .slice(0, 6);

        if (!unresolved.length) {
            return "";
        }

        const lines = unresolved.map((item) => {
            const planned = item["计划回收"] ? `，计划回收：${item["计划回收"]}` : "";
            return `- 第${item["埋设章节"] || "?"}章埋设【${item["伏笔类型"] || "伏笔"}】${item["伏笔内容"] || ""}${planned}`;
        });

        if (chapterNumber) {
            lines.push(`当前第${chapterNumber}章，可适度回收接近节点的伏笔，但不要强行一次性清空。`);
        }

        return `【伏笔追踪】\n${lines.join("\n")}`;
    }

    buildPersonalityGuard(project) {
        const personalities = project.personality_enforcer?.character_personalities || {};
        const entries = Object.entries(personalities).slice(0, 8);
        if (!entries.length) {
            return "";
        }
        const lines = entries.map(([name, data]) => {
            const text = data?.原始设定 || data?.personality || data?.当前性格 || "";
            return `- ${name}：${Utils.summarizeText(text, 70)}`;
        });
        return `【人物性格约束】\n${lines.join("\n")}\n除非细纲明确要求，不要让人物性格突然反转。`;
    }

    buildAppearanceGuard(project) {
        const appearanceTracker = project.character_appearance_tracker?.appearances || {};
        const entries = Object.entries(appearanceTracker).slice(0, 8);
        if (!entries.length) {
            return "";
        }
        const lines = entries.map(([name, data]) =>
            `- ${name}：首次出场第${data["出场章节"] || "?"}章，身份=${data["身份"] || "未知"}`
        );
        return `【人物出场追踪】\n${lines.join("\n")}\n未正式出场或未见面的角色，不要随意安排同场互动。`;
    }

    buildDialogueGuard(project, chapterNumber) {
        const declarations = project.dialogue_tracker?.declarations || {};
        const lines = [];
        Object.entries(declarations).slice(0, 6).forEach(([name, items]) => {
            if (Array.isArray(items) && items.length) {
                const filtered = items
                    .filter((item) => !chapterNumber || Number(item.chapter_num || item["章节"] || 0) <= chapterNumber)
                    .slice(-2)
                    .map((item) => item.content || item["内容"] || "")
                    .filter(Boolean);
                if (filtered.length) {
                    lines.push(`- ${name}：近期明确说过/立过的点 -> ${filtered.join("；")}`);
                }
            }
        });
        return lines.length ? `【言行一致性】\n${lines.join("\n")}` : "";
    }

    buildDynamicStateGuard(project) {
        const tracker = project.dynamic_tracker || {};
        const lines = [];
        const items = Object.values(tracker.items || {}).slice(0, 5).map((item) =>
            `${item["名称"] || "物品"}(${item["持有者"] || "未知持有者"}，状态=${item["当前状态"] || "未知"})`
        );
        if (items.length) {
            lines.push(`物品状态：${items.join("；")}`);
        }

        const skills = Object.values(tracker.skills || {}).slice(0, 5).map((skill) =>
            `${skill["名称"] || "技能"}(${skill["使用者"] || "未知"}，熟练度=${skill["熟练度"] || "未知"})`
        );
        if (skills.length) {
            lines.push(`技能状态：${skills.join("；")}`);
        }

        const appearances = Object.entries(tracker.appearances || {}).slice(0, 5).map(([name, data]) =>
            `${name}(当前形象=${data["当前形象"] || data["初始形象"] || "未知"})`
        );
        if (appearances.length) {
            lines.push(`外貌状态：${appearances.join("；")}`);
        }

        return lines.length ? `【动态状态追踪】\n${lines.join("\n")}` : "";
    }

    buildSnapshotGuard(project, chapterNumber) {
        const snapshots = project.chapter_snapshot?.snapshots || project.outline?.state_snapshots || {};
        const keys = Object.keys(snapshots);
        if (!keys.length) {
            return "";
        }

        const latestKey = keys[keys.length - 1];
        const latest = snapshots[latestKey] || {};
        const parts = [];
        if (latest.current_location) {
            parts.push(`地点：${latest.current_location}`);
        }
        if (latest.timeline) {
            parts.push(`时间：${Utils.summarizeText(latest.timeline, 60)}`);
        }
        if (latest.pending_plots) {
            parts.push(`待续矛盾：${Utils.summarizeText(latest.pending_plots, 70)}`);
        }
        if (latest.important_items) {
            parts.push(`重要物品：${Utils.summarizeText(latest.important_items, 60)}`);
        }
        if (!parts.length) {
            return "";
        }

        return `【章末快照衔接】\n最近快照：${latestKey}\n${parts.join("\n")}\n新章节要承接这些状态，不要无故跳变。`;
    }

    composeChapterPrompt({ project, volume, chapter, promptTemplate, prevContent, nextOutline, characterDigest, frequency }) {
        const frequencyPrompt = frequency === "female"
            ? "【频道要求】这是女频向章节，优先强化情感推进、细腻心理和关系张力。"
            : "【频道要求】这是男频向章节，优先保证主线推进、冲突升级和成就反馈。";

        const basePrompt = promptTemplate && promptTemplate.trim()
            ? promptTemplate
            : [
                frequencyPrompt,
                "",
                "小说标题：{{title}}",
                "小说类型：{{genre}}",
                "中心思想：{{theme}}",
                "",
                "【详细细纲】",
                "{{outline}}",
                "",
                "【相关角色】",
                "{{relevant_characters}}",
                "",
                "【前文内容】",
                "{{prev_content}}",
                "",
                "【下一章边界】",
                "{{next_outline}}",
                "",
                "【全局设定提醒】",
                "{{global_setting_note}}",
                "",
                "【本章设定提醒】",
                "{{chapter_setting_note}}",
                "",
                "请扩写成完整正文，保持逻辑连续，结尾留钩子。"
            ].join("\n");

        const replacements = {
            title: project.outline.title || "",
            genre: project.outline.subgenre || project.outline.genre || "",
            theme: project.outline.theme || "",
            worldbuilding: project.outline.worldbuilding || "",
            relevant_characters: characterDigest || "暂无明确角色设定",
            chapter_number: chapter.number || "",
            chapter_title: chapter.title || "",
            outline: chapter.summary || "",
            prev_content: prevContent || "暂无前文",
            next_outline: nextOutline || "暂无下一章摘要",
            global_setting_note: project.global_setting_note || "暂无",
            chapter_setting_note: chapter.chapter_setting_note || "暂无",
            current_volume: volume.title || "",
            current_volume_summary: volume.summary || ""
        };

        let output = basePrompt;
        Object.entries(replacements).forEach(([key, value]) => {
            const pattern = new RegExp(`{{\\s*${key}\\s*}}`, "g");
            output = output.replace(pattern, value || "");
        });

        return `${frequencyPrompt}\n\n${output}`;
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
        return all.slice(Math.max(0, index - maxChapters), index)
            .map((item) => `【第${item.number}章 ${item.title}】\n${Utils.summarizeText(item.content, 1200)}`)
            .join("\n\n");
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
        if (index >= 0 && index < all.length - 1) {
            const next = all[index + 1];
            return `【下一章：第${next.number}章 ${next.title}】\n${next.summary || ""}`;
        }
        return "";
    }

    collectRelevantCharacters(project, contextText) {
        const chars = project.outline.characters || [];
        if (!contextText) {
            return chars.filter((character) => character.is_protagonist || character.is_main).slice(0, 6);
        }

        const found = [];
        const seen = new Set();
        chars.forEach((character) => {
            const names = [character.name, ...(Utils.ensureArrayFromText(character.aliases || character["别名"]))];
            const identities = Utils.ensureArrayFromText(character.identity || character["身份"] || "");
            const matched = [...names, ...identities].some((token) => token && token.length >= 2 && contextText.includes(token));
            if (matched && character.name && !seen.has(character.name)) {
                found.push(character);
                seen.add(character.name);
            }
        });

        if (!found.length) {
            return chars.slice(0, 6);
        }
        return found.slice(0, 8);
    }

    buildRelevantCharactersInfo(foundChars) {
        if (!foundChars?.length) {
            return "";
        }
        return foundChars.map((character) => {
            const chunks = [];
            if (character.identity) chunks.push(`身份：${character.identity}`);
            if (character.personality) chunks.push(`性格：${Utils.summarizeText(character.personality, 60)}`);
            if (character.background) chunks.push(`背景：${Utils.summarizeText(character.background, 70)}`);
            if (character.relationships) chunks.push(`关系：${Utils.summarizeText(character.relationships, 60)}`);
            return `- ${character.name || "未命名"}\n  ${chunks.join("\n  ")}`;
        }).join("\n");
    }
}
