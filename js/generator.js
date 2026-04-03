class NovelGenerator {
    constructor(apiClient) {
        this.api = apiClient;
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
            maxTokens: 1800
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
        const usedPlotsContext = this.buildUsedPlotsSummary(project, volumeNumber);
        const innovationPrompt = this.buildSynopsisInnovationPrompt(project, volumeNumber, concept, volumeSummary);
        const previousVolumeEnding = this.buildPreviousVolumeEnding(project, volumeNumber);
        const systemPrompt = [
            genreConstraint,
            "你是一名中文长篇小说章节细纲策划编辑。",
            "请严格根据当前卷卷纲、世界观、前置卷细纲、已用剧情去重要求和人物一致性约束，拆解出当前卷的章节细纲。",
            "输出必须是 JSON 数组，不要输出任何额外解释。"
        ].filter(Boolean).join("\n");

        const volumeSynopsisContext = this.buildVolumeSynopsisContext(project, volumeNumber);
        const previousChapterSynopsisContext = this.buildPreviousChapterSynopsisContext(project, volumeNumber);
        const synopsisConsistencyContext = this.buildSynopsisConsistencyContext(
            project,
            `${volumeSummary || ""}\n${existingSynopsis || ""}`,
            volumeNumber
        );

        const userPrompt = [
            `小说标题：《${title || "未命名小说"}》`,
            `题材：${subgenre || genre || "未指定"}`,
            `故事概念：${concept || "暂无"}`,
            `世界观：${worldbuilding || "暂无"}`,
            volumeSynopsisContext ? `【卷纲前置】\n${volumeSynopsisContext}` : "",
            previousChapterSynopsisContext ? `【前置细纲衔接】\n${previousChapterSynopsisContext}` : "",
            previousVolumeEnding ? `【上一卷结尾（用于衔接）】\n${previousVolumeEnding}` : "",
            usedPlotsContext,
            innovationPrompt ? `【反套路与创新建议】\n${innovationPrompt}` : "",
            synopsisConsistencyContext,
            `当前卷：第 ${volumeNumber} 卷`,
            `计划章节数：${chapterCount}`,
            `当前卷卷纲：${volumeSummary || "暂无"}`,
            existingSynopsis ? `已有细纲参考：${existingSynopsis}` : "",
            "",
            "请输出 JSON 数组，每个对象包含以下字段：",
            "chapter_number: 章节号",
            "title: 章节标题",
            "key_event: 核心事件",
            "emotion_curve: 情绪曲线",
            "synopsis: 100-180 字的章节细纲",
            "",
            "额外要求：",
            "1. 章节之间必须层层递进，不能重复同一冲突。",
            "2. 已经在前面卷细纲中使用过的核心情节，不得重复或变相重复。",
            "3. 每一章的核心事件必须是新的、不同的剧情推进点。",
            "4. 每章都要服务当前卷主线，同时兼顾支线、伏笔或人物关系推进。",
            "5. 如果桥段过于套路化，必须主动做变化，不要照搬常见模板。",
            "6. 要注意当前卷与上一卷结尾的衔接，不能断层。",
            "7. 人物说话方式、行为逻辑、关系进展必须符合已有人设。",
            "8. 如果出现男主、女主、师尊、反派等模糊代称，必须替换成真实姓名。",
            "9. 尚未正式见面的人物，不能在细纲里提前写成熟人互动。"
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

    async generateChapterOutlinesBatch({ project, volume, volumeNumber, startChapter, endChapter, existingChapters }) {
        const existingSummary = this.buildOutlineFrontContext(project, volumeNumber, startChapter, existingChapters);

        const characterDigest = this.buildRelevantCharactersInfo(project.outline.characters || []);
        const guardContext = this.buildGenerationGuards(project, volumeNumber, startChapter);
        const consistencyContext = this.buildCharacterConsistencyContext(
            project,
            `${volume.summary || ""}\n${volume.chapterSynopsis || volume.chapter_synopsis || ""}`,
            startChapter
        );
        const detailedOutlineContext = this.limitContext(project.outline.detailed_outline || "", 5000);
        const volumeSynopsisContext = this.buildVolumeSynopsisContext(project, volumeNumber);
        const allChapterSynopsisContext = this.buildAllChapterSynopsisContext(project, volumeNumber);
        const plotUnitContext = this.buildPlotUnitContext(startChapter, endChapter);

        const systemPrompt = [
            "你是一个执行力极强的网文主编助手。",
            "你的唯一任务是将用户提供的【详细细纲】转化为标准格式的章节大纲。",
            "不要自己编！不要自己编！严格照着细纲写！",
            "必须严格遵守当前卷边界，不得提前串卷，不得擅自改写主线。",
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
            plotUnitContext ? `【8章剧情单元规则】\n${plotUnitContext}` : "",
            `当前卷：第${volumeNumber}卷 ${volume.title || ""}`,
            `当前卷摘要：${volume.summary || "暂无"}`,
            `当前卷章节细纲：${volume.chapterSynopsis || volume.chapter_synopsis || "暂无"}`,
            characterDigest ? `【已有角色与人设】\n${characterDigest}` : "",
            existingSummary ? `【前情提要】\n${existingSummary}` : "",
            "",
            "【绝对原则】",
            "1. 剧情不可重复：已有章节已经写过的事件，后面不得再次出现相同或高度相似的桥段。",
            "2. 你本次生成的多个章节之间也不能重复，每一章的核心事件都必须是全新的。",
            "3. 角色状态必须延续前文：位置、伤势、情绪、装备、时间线都不能断裂。",
            "4. 新引入角色必须符合当前场景和剧情逻辑。",
            "5. 如果细纲里包含后续卷内容，严禁压缩写进当前卷。",
            "",
            "【输出格式标准（System 9）】",
            "summary 字段必须严格包含以下标签，并保留空行结构：",
            "【章节目标】",
            "【出场人物】",
            "【场景】",
            "【核心事件】",
            "【情绪曲线】",
            "【情节推进】",
            "【伏笔处理】",
            "【下章铺垫】",
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
            "3. summary 中的【情节推进】必须保留“1.【类型标签】内容”的格式。",
            "4. 【出场人物】必须使用“- 姓名（简介）”的格式。",
            "5. 细纲里涉及的人物称呼必须尽量使用真实姓名。",
            "6. 人物行为和关系推进必须与既有人设一致。",
            "7. 第 8 章、第 16 章等单元收束章要负责为下一单元做悬念铺垫。",
            "8. JSON 中严禁输出 markdown 代码块标记。"
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

    async generateCharactersFromOutlines({ project, chapters, volumeNumber }) {
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
        const existingCharsText = existingCharacters.length
            ? existingCharacters.map((character) => [
                `- ${character.name || "未命名"}`,
                character.identity ? `身份：${character.identity}` : "",
                character.personality ? `性格：${Utils.summarizeText(character.personality, 80)}` : "",
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

        for (let batchStart = 0; batchStart < rawItems.length; batchStart += CHAR_BATCH_SIZE) {
            const batchItems = rawItems.slice(batchStart, batchStart + CHAR_BATCH_SIZE);
            const batchStr = batchItems.map(([label, desc]) => `- ${label}${desc ? `（${desc}）` : ""}`).join("\n");

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
                "10. 不要包含任何 markdown 标记，直接返回纯 JSON 数组。",
                "",
                "【输出格式示例】",
                `[${JSON.stringify(exampleChar, null, 2)}]`
            ].join("\n");

            const parsed = await this.requestJSONArray(systemPrompt, `请为以上 ${batchItems.length} 个角色批量生成完整的人物设定，确保每个角色都有完整的中英文字段。`, {
                temperature: 0.75,
                maxTokens: 12000,
                timeout: 240000
            });

            parsed.forEach((character) => {
                const normalized = {
                    name: character.name || "",
                    identity: character.identity || "",
                    age: character.age || "",
                    gender: character.gender || "",
                    personality: character.personality || character["性格特点"] || "",
                    background: character.background || character["背景故事"] || "",
                    appearance: character.appearance || character["外貌描述"] || "",
                    abilities: character.abilities || character["能力特长"] || "",
                    goals: character.goals || character["目标动机"] || "",
                    relationships: character.relationships || character["人物关系"] || "",
                    aliases: Array.isArray(character.aliases)
                        ? character.aliases
                        : Utils.ensureArrayFromText(character.aliases || character["别名"]),
                    性格特点: character.personality || character["性格特点"] || "",
                    背景故事: character.background || character["背景故事"] || "",
                    外貌描述: character.appearance || character["外貌描述"] || "",
                    能力特长: character.abilities || character["能力特长"] || "",
                    目标动机: character.goals || character["目标动机"] || "",
                    人物关系: character.relationships || character["人物关系"] || "",
                    别名: Array.isArray(character.aliases)
                        ? character.aliases.join("、")
                        : (character["别名"] || "")
                };

                if (normalized.name) {
                    allCharacters.push(normalized);
                }
            });
        }

        return allCharacters;
    }

    async expandChapterContent({ project, volume, chapter }) {
        const relevantCharacters = this.collectRelevantCharacters(project, `${chapter.summary || ""}\n${chapter.content || ""}`);
        const characterDigest = this.buildRelevantCharactersInfo(relevantCharacters);
        const guardContext = this.buildGenerationGuards(project, null, chapter.number || 0);
        const characterConsistencyContext = this.buildCharacterConsistencyContext(
            project,
            `${chapter.summary || ""}\n${chapter.content || ""}`,
            chapter.number || 0
        );
        const promptTemplate = project.prompt_state?.current_prompt || "";
        const prevContent = this.getPreviousChapterContents(project, volume, chapter, 5);
        const nextOutline = this.getNextChapterOutline(project, volume, chapter);
        const frequency = project.prompt_state?.chapter_frequency || "male";
        const worldAndPlanContext = this.buildWorldAndPlanContext(project);
        const expansionHint = this.buildExpansionHint(chapter.summary || "", chapter.number || 0);
        const nextChapterSetupInstruction = this.buildNextChapterSetupInstruction(chapter);
        const nextChapterForbiddenPreview = this.buildNextChapterForbiddenPreview(nextOutline);
        const extraOutputProtocol = this.buildExtraOutputProtocol();
        const stateOutputProtocol = this.buildStateOutputProtocol(project, chapter, relevantCharacters);

        const systemPrompt = [
            "你是一名擅长长篇中文网文的章节写手。",
            "请根据已经确认的章节大纲扩写正文草稿。",
            "必须严格遵守：全局设定、本章设定、角色锁定、世界观、人物一致性、动态状态、章末快照衔接。",
            "必须完成本章结尾铺垫任务，但绝对不能把下一章核心事件提前写出来。",
            "正文写完后，必须按要求追加状态输出和追踪输出。",
            guardContext,
            characterConsistencyContext
        ].filter(Boolean).join("\n\n");

        const userPrompt = this.composeChapterPrompt({
            project,
            volume,
            chapter,
            promptTemplate,
            prevContent,
            nextOutline,
            characterDigest,
            frequency,
            worldAndPlanContext,
            expansionHint,
            nextChapterSetupInstruction,
            nextChapterForbiddenPreview,
            stateOutputProtocol,
            extraOutputProtocol
        });

        return (await this.api.callLLM(userPrompt, systemPrompt, {
            temperature: 0.82,
            maxTokens: 6500,
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

        [
            this.buildHiddenSecretGuard(project, chapterNumber),
            this.buildStoryStateGuard(project),
            this.buildNameLockGuard(project),
            this.buildTimelineGuard(project, chapterNumber),
            this.buildForeshadowGuard(project, chapterNumber),
            this.buildPersonalityGuard(project, "", chapterNumber),
            this.buildAppearanceGuard(project, "", chapterNumber),
            this.buildDialogueGuard(project, chapterNumber),
            this.buildSnapshotGuard(project, chapterNumber),
            this.buildDynamicStateGuard(project)
        ].filter(Boolean).forEach((block) => blocks.push(block));

        if (volumeNumber) {
            blocks.push(`【卷边界规则】当前只允许处理第 ${volumeNumber} 卷范围内的剧情，不要提前透支后续卷的重要事件。`);
        }

        return blocks.join("\n\n");
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
                lines.push(`- ${name}：首次出场第${firstAppearance}章，身份=${identity}`);
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
            `${item["名称"] || "物品"}(${item["持有者"] || "未知持有者"}，状态=${item["当前状态"] || "未知"})`
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

        return parts.length
            ? `【章末快照衔接】\n最近快照：${targetKey}\n${parts.join("\n")}\n新章节要承接这些状态，不要无故跳变。`
            : "";
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

        Object.entries(synopsisData.main_characters || {}).slice(0, 8).forEach(([role, name]) => {
            if (name) {
                lines.push(`${role} => ${name}`);
            }
        });

        Object.entries(synopsisData.vague_to_name_mapping || {}).slice(0, 12).forEach(([vague, real]) => {
            if (real) {
                lines.push(`${vague} => ${real}`);
            }
        });

        return lines.length
            ? `【模糊称呼转实名规则】\n以下代称必须替换成真实姓名：\n${lines.join("\n")}\n禁止长期使用“男主/女主/师尊/反派”代替真实姓名。`
            : "";
    }

    composeChapterPrompt({
        project,
        volume,
        chapter,
        promptTemplate,
        prevContent,
        nextOutline,
        characterDigest,
        frequency,
        worldAndPlanContext,
        expansionHint,
        nextChapterSetupInstruction,
        nextChapterForbiddenPreview,
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
                "【本章大纲】",
                "{{outline}}",
                "",
                "【相关人物设定】",
                "{{relevant_characters}}",
                "",
                "【前文五章】",
                "{{prev_content}}",
                "",
                "【全局设定提醒】",
                "{{global_setting_note}}",
                "",
                "【本章设定提醒】",
                "{{chapter_setting_note}}",
                "",
                "{{expansion_hint}}",
                "",
                "{{next_chapter_setup_instruction}}",
                "",
                "{{next_chapter_forbidden_preview}}",
                "",
                "写作要求：",
                "1. 必须严格遵守本章大纲、全局设定、本章设定、世界观、详细大纲参考和角色锁定。",
                "2. 开头必须承接前文五章和章末快照，中间推进剧情，结尾完成本章铺垫任务。",
                "3. 人物行为、对话、物品、技能、身份、时间地点必须与既有状态一致。",
                "4. 不要把下一章核心事件提前展开，只能做铺垫。",
                "5. 正文写完后，必须按下面协议追加追踪输出。",
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
            world_and_plan_context: worldAndPlanContext || "【世界观核心设定】暂无\n\n【详细大纲参考】暂无",
            relevant_characters: characterDigest || "暂无明确角色设定",
            outline: chapter.summary || "",
            prev_content: prevContent || "暂无前文",
            global_setting_note: project.global_setting_note || "暂无",
            chapter_setting_note: chapter.chapter_setting_note || "暂无",
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

        return output;
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
            '  "pending_plots": "本章留下的待推进事项",',
            '  "key_event": "本章最关键的一件事",',
            '  "world_changes": {',
            '    "new_locations": [],',
            '    "character_movements": [],',
            '    "org_changes": [],',
            '    "offscreen_status": []',
            "  },",
            '  "characters": {',
            '    "角色名": {',
            '      "cultivation": "修为/实力变化",',
            '      "location": "当前位置",',
            '      "identity": "身份变化",',
            '      "status": "身体/精神状态",',
            '      "possessions": "关键物品变化",',
            '      "relationships": "关系变化",',
            '      "goals": "当前目标",',
            '      "secrets": "知晓或暴露的秘密"',
            "    }",
            "  }",
            "}"
        ].join("\n");
    }

    buildExtraOutputProtocol() {
        return [
            "【附加追踪输出】",
            "正文后请继续按以下格式追加，便于系统追踪：",
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
            "<<<END_PERSONALITY_CHANGE>>>",
            "",
            "<<<CHARACTER_APPEARANCE>>>",
            "角色名|身份|首次出场",
            "角色A|角色B|关系描述|首次见面",
            "<<<END_APPEARANCE>>>"
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

        const lines = ["【智能扩写建议】"];
        if (chapterNumber) {
            lines.push(`当前章节：第 ${chapterNumber} 章`);
        }
        lines.push("扩写时请围绕章节骨架补足血肉，不要空转水字数。");
        lines.push("优先补充：动作过程、人物心理、场景反馈、对话博弈、伏笔呼应、结果余波。");

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
            "3. 不允许出现“下章将会”“马上就会”“下一章会”之类的预告句式。"
        ];

        if (setup.state_setup) lines.push(`- 状态铺垫：${setup.state_setup}`);
        if (setup.atmosphere_setup) lines.push(`- 氛围铺垫：${setup.atmosphere_setup}`);
        if (setup.suspense_hook) lines.push(`- 悬念钩子：${setup.suspense_hook}`);
        if (setup.clue_hint) lines.push(`- 线索暗示：${setup.clue_hint}`);
        if (setup.countdown) lines.push(`- 倒计时：${setup.countdown}`);

        lines.push("示例：可以写“他气息渐弱，医者摇头不语”，不能写“下章他将死去”。");
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
            "2. 可以做悬念和暗示，但不能提前完成下一章的冲突、揭露、突破、死亡、身份曝光、获宝等结果。"
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
        return index >= 0 && index < all.length - 1 ? all[index + 1] : null;
    }

    collectRelevantCharacters(project, contextText) {
        const chars = project.outline.characters || [];
        if (!contextText) {
            return chars.filter((character) => character.is_protagonist || character.is_main).slice(0, 6);
        }

        const found = [];
        const seen = new Set();
        chars.forEach((character) => {
            const aliases = Array.isArray(character.aliases)
                ? character.aliases
                : Utils.ensureArrayFromText(character.aliases || character["别名"]);
            const names = [character.name, ...aliases];
            const identities = Utils.ensureArrayFromText(character.identity || character["身份"] || "");
            const matched = [...names, ...identities].some((token) => token && token.length >= 2 && contextText.includes(token));
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

    buildVolumeSynopsisContext(project, currentVolumeNumber) {
        if (!project?.outline?.volumes?.length) {
            return "";
        }
        return project.outline.volumes.map((volume, index) => {
            if (!volume.summary && !volume.cliffhanger) {
                return "";
            }
            const prefix = index + 1 === currentVolumeNumber ? "【当前卷】" : "【参考卷】";
            return [
                `${prefix} 第${index + 1}卷 ${volume.title || ""}`,
                volume.summary || "",
                volume.cliffhanger ? `卷末钩子：${volume.cliffhanger}` : ""
            ].filter(Boolean).join("\n");
        }).filter(Boolean).join("\n\n");
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
                const synopsis = volume.chapterSynopsis || volume.chapter_synopsis || "";
                return synopsis ? `【第${index + 1}卷细纲】\n${this.limitContext(synopsis, 2400)}` : "";
            })
            .filter(Boolean)
            .join("\n\n");
    }

    buildUsedPlotsSummary(project, currentVolumeNumber) {
        const allPrevChapters = [];
        (project?.outline?.volumes || [])
            .slice(0, Math.max(0, currentVolumeNumber - 1))
            .forEach((volume) => {
                const synopsis = volume.chapterSynopsis || volume.chapter_synopsis || "";
                synopsis
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .forEach((line) => allPrevChapters.push(line));
            });

        if (!allPrevChapters.length) {
            return "";
        }

        return [
            "【以下情节已经使用过，绝对禁止重复或变相重复】",
            this.limitContext(allPrevChapters.join("\n"), 3600),
            `（共 ${allPrevChapters.length} 条前置细纲记录）`
        ].join("\n");
    }

    buildSynopsisInnovationPrompt(project, volumeNumber, concept, volumeSummary) {
        const recentSynopsis = [];
        (project?.outline?.volumes || [])
            .slice(0, Math.max(0, volumeNumber - 1))
            .forEach((volume) => {
                const synopsis = volume.chapterSynopsis || volume.chapter_synopsis || "";
                if (synopsis) {
                    recentSynopsis.push(synopsis);
                }
            });

        return [
            "优先规避套路化桥段：重复打脸、机械升级、无意义误会、为了反转而反转。",
            "如果当前卷需要战斗、修炼、探索、对话桥段，请尽量换角度设计，不要复制前文结构。",
            recentSynopsis.length ? `最近前文参考：\n${this.limitContext(recentSynopsis.slice(-2).join("\n"), 1200)}` : "",
            volumeSummary ? `当前卷方向：${this.limitContext(volumeSummary, 400)}` : "",
            concept ? `故事概念提醒：${this.limitContext(concept, 300)}` : ""
        ].filter(Boolean).join("\n");
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
                const synopsis = volume.chapterSynopsis || volume.chapter_synopsis || "";
                return synopsis ? `【第${index + 1}卷细纲】\n${this.limitContext(synopsis, 2400)}` : "";
            })
            .filter(Boolean)
            .join("\n\n");
    }

    buildOutlineFrontContext(project, volumeNumber, startChapter, existingChapters = []) {
        const parts = [];

        const explicitExisting = (existingChapters || [])
            .slice(-3)
            .map((chapter) => `章节：第${chapter.number}章 ${chapter.title || ""}\n梗概：${Utils.summarizeText(chapter.summary, 500)}`);
        if (explicitExisting.length) {
            parts.push(...explicitExisting);
        } else {
            const previousSummaries = [];
            (project.outline?.volumes || []).forEach((volume, index) => {
                const currentVolumeNumber = index + 1;
                const chapters = (volume.chapters || []).filter((chapter) => {
                    const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
                    if (currentVolumeNumber < volumeNumber) {
                        return true;
                    }
                    return currentVolumeNumber === volumeNumber && chapterNumber < startChapter;
                });

                chapters.slice(-3).forEach((chapter) => {
                    previousSummaries.push(
                        `章节：第${chapter.number}章 ${chapter.title || ""}\n梗概：${Utils.summarizeText(chapter.summary, 500)}`
                    );
                });
            });

            if (previousSummaries.length) {
                parts.push(...previousSummaries.slice(-3));
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
            return "收束";
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
        if (phaseFor(endChapter) === "收束") {
            lines.push(`当前批次结尾要为第 ${lastUnit + 1} 单元埋下悬念钩子。`);
        }

        lines.push("next_chapter_setup 字段必须严格遵守：只写铺垫，不写结果。");
        return lines.join("\n");
    }

    extractRoleCandidatesFromChapters(project, chapters, volumeNumber) {
        const existingNames = new Set((project.outline.characters || []).map((character) => character.name).filter(Boolean));
        const vagueLabels = new Set(["男主", "女主", "师尊", "反派", "主角", "配角", "众人", "路人", "黑衣人"]);
        const roleMap = {};

        const addRole = (name, description) => {
            const cleanName = String(name || "").trim();
            if (!cleanName || cleanName.length < 2 || vagueLabels.has(cleanName)) {
                return;
            }
            if (!roleMap[cleanName]) {
                roleMap[cleanName] = description || "";
            } else if (description && !roleMap[cleanName].includes(description)) {
                roleMap[cleanName] = `${roleMap[cleanName]}；${description}`.slice(0, 240);
            }
            if (existingNames.has(cleanName) && !roleMap[cleanName]) {
                roleMap[cleanName] = "已有角色";
            }
        };

        (chapters || []).forEach((chapter) => {
            Utils.ensureArrayFromText(chapter.characters).forEach((name) => addRole(name, `第${chapter.number}章出场人物`));

            const summary = chapter.summary || "";
            const sceneMatch = summary.match(/【出场人物】([\s\S]*?)(?:【|$)/);
            if (sceneMatch?.[1]) {
                sceneMatch[1]
                    .split(/[、,，\n]/)
                    .map((item) => item.replace(/（.*?）|\(.*?\)/g, "").trim())
                    .filter(Boolean)
                    .forEach((name) => addRole(name, `第${chapter.number}章出场人物`));
            }

            const namedChunks = summary.match(/([\u4e00-\u9fa5]{2,4})(?:（([^）]{2,30})）|\(([^)]{2,30})\))/g) || [];
            namedChunks.forEach((chunk) => {
                const matched = chunk.match(/^([\u4e00-\u9fa5]{2,4})(?:（([^）]{2,30})）|\(([^)]{2,30})\))$/);
                if (matched) {
                    addRole(matched[1], matched[2] || matched[3] || `第${chapter.number}章相关人物`);
                }
            });
        });

        const synopsisText = volumeNumber
            ? (project.outline.volumes?.[volumeNumber - 1]?.chapterSynopsis || project.outline.volumes?.[volumeNumber - 1]?.chapter_synopsis || "")
            : "";
        const mainMappings = project.synopsisData?.main_characters || project.synopsis_data?.main_characters || {};
        Object.values(mainMappings).forEach((name) => addRole(name, "主角映射角色"));

        const summaryNames = synopsisText.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
        summaryNames.slice(0, 80).forEach((name) => {
            if (!existingNames.has(name)) {
                addRole(name, "细纲中提及角色");
            }
        });

        return roleMap;
    }

    limitContext(text, max = 2000) {
        return Utils.summarizeText(text, max);
    }
}
