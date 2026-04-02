const APP_CONFIG = {
    name: "晨曦微露小说大纲生成器 Web",
    version: "2.0.0",
    storageKey: "novel_outline_data_v2",
    settingsKey: "novel_outline_api_config_v2"
};

const NOVEL_GENRES = {
    "男频-都市": [
        "都市脑洞", "都市异能", "都市修真", "神豪系统", "职场商战", "娱乐明星", "现代创业"
    ],
    "男频-玄幻": [
        "东方玄幻", "高武世界", "异世大陆", "无敌流", "宗门经营", "血脉进化", "系统升级"
    ],
    "男频-仙侠": [
        "古典仙侠", "凡人修仙", "长生流", "宗门流", "神话修真", "灵田种田"
    ],
    "男频-科幻": [
        "星际文明", "赛博朋克", "末世危机", "时间循环", "机甲战争", "黑科技创业"
    ],
    "女频-现言": [
        "豪门总裁", "娱乐圈", "职场成长", "久别重逢", "双强互撩", "真假千金", "轻悬疑"
    ],
    "女频-古言": [
        "宫斗宅斗", "权谋朝堂", "经商种田", "穿越逆袭", "重生复仇", "女尊", "医妃"
    ],
    "女频-幻想": [
        "仙侠言情", "西幻恋爱", "灵异奇谈", "御兽成长", "异界冒险", "治愈奇幻"
    ],
    "悬疑-惊悚": [
        "悬疑推理", "规则怪谈", "民俗异闻", "密室逃生", "求生冒险", "诡秘调查"
    ]
};

const DEFAULT_API_CONFIG = {
    provider: "doubao",
    apiKey: "",
    apiBase: "https://ark.cn-beijing.volces.com/api/v3",
    model: "doubao-pro-32k-241215",
    temperature: 0.7,
    maxTokens: 4000,
    timeoutMs: 600000,
    retryCount: 3
};

const DEFAULT_NOVEL_DATA = {
    genre: "",
    subgenre: "",
    global_setting_note: "",
    outline: {
        title: "",
        genre: "",
        subgenre: "",
        theme: "",
        storyConcept: "",
        total_chapters: 100,
        worldbuilding: "",
        global_plan: "",
        global_plan_text: "",
        detailed_outline: "",
        user_context: "",
        story_state: {
            timeline: "",
            current_location: "",
            characters: {},
            key_memories: [],
            important_items: "",
            pending_plots: ""
        },
        state_snapshots: {},
        volumes: [],
        characters: []
    },
    synopsisData: {
        world_elements: {},
        plot_elements: {},
        detail_elements: {},
        mechanics_elements: {},
        story_concept: "",
        volumeCount: 5,
        chaptersPerVolume: 20,
        volumeSynopsis: "",
        vol_count: "5",
        chap_count: "20",
        synopsisOutput: "",
        synopsis_output: "",
        volume_synopsis: "",
        worldbuilding: "",
        synopsis_volumes: {},
        main_characters: {},
        locked_character_names: {},
        vague_to_name_mapping: {},
        vague_supporting_roles: {},
        currentVolume: 1
    },
    synopsis_data: {},
    story_state: {
        current_location: "",
        current_time: "",
        protagonist_status: "",
        tracked_items: {},
        tracked_appearances: {},
        tracked_skills: {}
    },
    name_locker: {
        locked_names: {},
        alias_map: {}
    },
    foreshadow_manager: {
        foreshadows: []
    },
    secret_matrix: {
        secrets: {},
        matrix: {}
    },
    dynamic_tracker: {
        items: {},
        appearances: {},
        skills: {},
        character_states: {},
        protection_rules: {},
        relationships: {},
        state_locks: {},
        dead_characters: []
    },
    timeline_tracker: {
        timeline_events: [],
        current_time: "",
        time_unit: "章",
        time_constraints: []
    },
    chapter_snapshot: {
        snapshots: {}
    },
    foreshadow_tracker: {
        foreshadows: {},
        next_id: 1,
        used_subplots: []
    },
    personality_enforcer: {
        character_personalities: {},
        personality_changes: {}
    },
    character_checker: {
        character_states: {}
    },
    character_appearance_tracker: {
        appearances: {},
        relationships: {}
    },
    dialogue_tracker: {
        declarations: {}
    },
    world_tracker: {
        locations: {},
        organizations: {},
        character_positions: {},
        offscreen_status: {},
        world_events: []
    },
    prompt_state: {
        current_prompt: "",
        saved_prompts: {},
        selected_prompt: "",
        chapter_frequency: "male"
    },
    generated_context: {
        worldbuilding: "",
        volume_synopsis: "",
        chapter_synopsis: ""
    },
    used_extras_characters: [],
    used_temp_subplots: [],
    chapters: {},
    generatedChapterTexts: {},
    meta: {
        createdAt: "",
        updatedAt: ""
    }
};
