const APP_CONFIG = {
    name: "晨曦微露小说大纲生成器 Web",
    version: "2.0.0",
    storageKey: "novel_outline_data_v2",
    settingsKey: "novel_outline_api_config_v2"
};

const NOVEL_GENRES = {
    "男频-都市": {
        subgenres: [
            "都市脑洞", "都市修真", "都市异能", "都市神医", "都市鉴宝", "都市兵王",
            "校花", "神豪", "奶爸", "反派", "四合院", "年代", "文娱", "国术",
            "都市日常", "都市高武", "男频衍生", "职场商战", "官场沉浮", "求生类题材",
            "上交国家/系统", "举国之力", "回家过年", "前任后悔流", "少年歌行"
        ],
        description: "现代都市背景，包含异能、系统、修真或纯现实生活。",
        allowed: ["现代都市", "异能系统", "现实生活", "职场", "情感"],
        forbidden: ["纯古代背景", "纯架空异世"]
    },
    "男频-玄幻": {
        subgenres: [
            "东方玄幻", "异世大陆", "高武世界", "王朝争霸", "玄幻脑洞",
            "无敌流", "洪荒", "横推亿万里", "一拳仙帝", "完美同人", "斩神", "多子多福"
        ],
        description: "宏大的异世界背景，以修炼升级为主线。",
        allowed: ["修炼体系", "异世界", "热血战斗", "升级打怪"],
        forbidden: ["纯现代都市", "纯科学解释"]
    },
    "男频-仙侠": {
        subgenres: [
            "古典仙侠", "现代修真", "神话修真", "幻想修仙", "洪荒封神", "多女主"
        ],
        description: "中国传统仙侠文化背景，求长生、悟天道。",
        allowed: ["修仙", "法宝", "阵法", "丹药", "天劫"],
        forbidden: ["西方魔法", "纯科技武器"]
    },
    "男频-科幻": {
        subgenres: [
            "星际文明", "时空穿梭", "末世危机", "古武机甲", "超级科技",
            "进化变异", "诸天万界"
        ],
        description: "基于科学或伪科学设定的未来或异世界。",
        allowed: ["高科技", "外星文明", "机甲", "基因进化"],
        forbidden: ["纯魔法", "纯修仙（非科幻修仙）"]
    },
    "男频-历史": {
        subgenres: [
            "历史古代", "历史脑洞", "架空历史", "外国历史", "民间传说",
            "上交国家", "举国之力", "历史谋略"
        ],
        description: "基于真实历史或架空历史的争霸、权谋故事。",
        allowed: ["历史背景", "战争", "权谋", "改革"],
        forbidden: ["超自然力量（除特定脑洞）", "现代科技（除非穿越带入）"]
    },
    "男频-悬疑": {
        subgenres: [
            "悬疑侦探", "诡秘悬疑", "探险生存", "盗墓", "风水异术",
            "奇闻异事", "求生类", "斩神"
        ],
        description: "充满悬念、惊悚或解谜元素的故事。",
        allowed: ["解谜", "惊悚", "探险", "灵异"],
        forbidden: ["纯粹打怪升级", "无悬念平铺直叙"]
    },
    "男频-游戏": {
        subgenres: [
            "虚拟网游", "游戏异界", "电子竞技", "游戏主播", "体育竞技"
        ],
        description: "以游戏或竞技为核心背景。",
        allowed: ["游戏设定", "数据化", "比赛", "直播"],
        forbidden: ["完全脱离游戏规则"]
    },
    "女频-现代言情": {
        subgenres: [
            "豪门总裁", "都市生活", "都市异能", "商战职场", "娱乐明星",
            "青春校园", "婚恋情感", "军婚", "禁欲霸总", "带娃流",
            "军婚资本家大小姐", "替嫁", "青春甜宠", "重生", "先婚后爱",
            "破镜重圆", "欢喜冤家", "暗恋成真", "追妻火葬场", "大叔宠文",
            "姐弟恋", "青梅竹马", "日久生情", "契约婚姻", "闪婚",
            "假戏真做", "甜宠", "虐恋情深", "都市神话"
        ],
        description: "现代背景下的女性情感故事。",
        allowed: ["现代生活", "情感纠葛", "职场奋斗", "甜蜜互动"],
        forbidden: ["古代背景", "纯修仙"]
    },
    "女频-古代言情": {
        subgenres: [
            "宫闱侯府", "穿越时空", "经商种田", "古代历史", "江湖恩怨",
            "女尊", "宫斗宅斗", "多子多福", "多男主", "好孕", "种田",
            "权谋天下", "江山为聘", "帝王宠爱", "公主和亲", "权臣之妻",
            "穿越女强", "重生复仇", "嫡女重生", "庶女逆袭", "宅斗嫡庶",
            "医妃", "毒妃", "神医弃女", "将军宠妻", "王爷宠汉",
            "古言甜宠", "古言虐恋", "前世今生", "仙侠古言"
        ],
        description: "古代背景下的女性情感与成长故事。",
        allowed: ["古代生活", "宫斗宅斗", "权谋", "种田"],
        forbidden: ["现代科技", "现代思维（除非穿越）"]
    },
    "女频-年代文": {
        subgenres: [
            "七零年代", "八零年代", "九零年代", "民国", "解放前",
            "知青下乡", "军婚年代", "大院子弟", "工厂时代", "农村创业",
            "年代甜宠", "年代重生", "年代穿越", "家长里短", "致富奔小康",
            "年代励志", "年代养娃", "年代美食", "年代医术", "年代手艺人",
            "港风年代", "大院军婚", "下乡知青", "返城创业", "改革开放",
            "大院生活", "工人家庭", "知识分子", "文艺青年", "经商大潮"
        ],
        description: "以特定年代为背景的时代情感故事。",
        allowed: ["时代特色", "年代氛围", "历史变迁", "奋斗成长"],
        forbidden: ["现代科技（手机电脑等）", "超前思想"]
    },
    "女频-幻想言情": {
        subgenres: [
            "玄幻言情", "仙侠奇缘", "奇幻魔法", "末世危机", "快穿",
            "系统流", "重生", "快穿雄竞女配", "前任后悔流", "病娇", "恶毒女配",
            "多子多福", "人妖恋", "人仙恋", "魔尊宠妻", "神女下凡",
            "妖界公主", "龙族宠婚", "凤族千金", "精灵奇缘", "异世界穿越",
            "修仙双修", "渡劫情缘", "前世情债", "三生三世", "仙界甜宠"
        ],
        description: "包含超自然元素的女性情感故事。",
        allowed: ["超能力", "系统", "穿越", "魔法"],
        forbidden: ["纯现实逻辑"]
    },
    "女频-悬疑推理": {
        subgenres: [
            "古代探案", "现代推理", "悬疑解谜", "刑侦", "法医",
            "破案甜宠", "探案言情", "悬疑爱情", "侦探女王", "女警故事",
            "悬疑穿越", "古代女探", "推理甜文", "悬疑重生", "探案双强"
        ],
        description: "以推理破案为核心的女性向故事。",
        allowed: ["推理破案", "悬疑元素", "智斗", "感情线"],
        forbidden: ["纯恐怖无感情", "纯男频风格"]
    },
    "女频-短篇甜文": {
        subgenres: [
            "短篇甜宠", "短篇暗恋", "短篇破镜重圆", "短篇先婚后爱",
            "短篇年下", "短篇大叔", "短篇青梅", "短篇追妻",
            "微甜", "超短篇", "小甜饼", "睡前甜文"
        ],
        description: "短小精悍的甜蜜爱情故事。",
        allowed: ["甜宠", "短篇", "快节奏", "轻松治愈"],
        forbidden: ["长篇虐恋", "复杂世界观"]
    },
    "女频-衍生同人": {
        subgenres: [
            "动漫同人", "影视同人", "小说同人", "明星同人", "其他衍生",
            "盗墓(耽美)", "完美同人", "多男主", "CP同人",
            "原女配逆袭", "穿书自救", "女配洗白", "恶毒女配重生"
        ],
        description: "基于已有作品或人物的二次创作。",
        allowed: ["原作人物", "原作背景", "CP向"],
        forbidden: ["严重OOC（视读者接受度而定）"]
    },
    "女频-青春校园": {
        subgenres: [
            "校园甜宠", "青春暗恋", "校草宠文", "学霸甜文", "校园日常",
            "大学校园", "高中时代", "初恋故事", "同桌的你", "青梅竹马",
            "校园竞技", "校园音乐", "校园艺术", "校园科技", "留学故事"
        ],
        description: "以校园生活为背景的青春爱情故事。",
        allowed: ["校园生活", "青春成长", "学业爱情", "师生情"],
        forbidden: ["成人职场", "社会复杂"]
    },
    "女频-现实题材": {
        subgenres: [
            "职场奋斗", "都市生存", "婚姻生活", "婆媳关系", "育儿故事",
            "女性成长", "励志人生", "家庭伦理", "社会现实", "人间烟火",
            "北漂故事", "沪漂故事", "小镇姑娘", "大城小爱", "平凡人生"
        ],
        description: "贴近现实的女性成长与生活故事。",
        allowed: ["现实生活", "社会问题", "人性刻画", "情感真实"],
        forbidden: ["超自然元素", "过度幻想"]
    },
    "男频-二次元": {
        subgenres: [
            "轻小说", "动漫同人", "日式幻想", "萌系日常", "异世界转生",
            "校园恋爱", "魔法少女", "机甲少女", "宅系生活", "游戏穿越"
        ],
        description: "二次元风格的小说创作。",
        allowed: ["二次元文化", "ACG元素", "日式幻想", "萌系"],
        forbidden: ["纯传统网文套路"]
    },
    "男频-体育竞技": {
        subgenres: [
            "足球", "篮球", "电竞", "赛车", "拳击格斗",
            "游泳", "网球", "田径", "综合体育", "极限运动"
        ],
        description: "以体育竞技为核心的热血故事。",
        allowed: ["体育比赛", "竞技精神", "训练成长", "团队配合"],
        forbidden: ["纯奇幻战斗", "脱离体育规则"]
    }
};

const DEFAULT_API_CONFIG = {
    provider: "doubao",
    apiKey: "",
    apiBase: "https://ark.cn-beijing.volces.com/api/v3",
    rankApiUrl: "https://fanqie-rank-worker.zhanludream-del.workers.dev/api/fanqie/trends",
    rankApiTimeoutMs: 90000,
    rankApiRetryCount: 2,
    model: "doubao-pro-32k-241215",
    temperature: 0.7,
    maxTokens: 4000,
    timeoutMs: 600000,
    retryCount: 3
};

const DEFAULT_NOVEL_DATA = {
    genre: "",
    subgenre: "",
    genre_extensions: {},
    idea_lab: {
        keyword: "",
        extra_note: "",
        version_count: 4,
        use_market_trends: false,
        market_summary: "",
        market_items: [],
        market_diagnostics: {},
        market_selected_categories: [],
        market_source_breakdown: {},
        market_status: "",
        market_error: "",
        selected_id: "",
        results: []
    },
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
    world_state_manager: {
        meta: {
            schema_version: "1.0.0",
            genre_profile: "",
            genre_modules: [],
            last_synced_at: "",
            last_synced_chapter: 0,
            last_synced_volume: 0
        },
        auto_state: {
            overview: {
                current_time: "",
                current_location: "",
                latest_chapter: 0,
                latest_volume: 0,
                pending_plots: [],
                active_plot_unit: "",
                unresolved_foreshadows: [],
                recent_world_events: []
            },
            characters: {},
            relationships: {},
            factions: {},
            locations: {},
            items: {},
            abilities: {},
            rewards: [],
            system_panel: {
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
            },
            plot_threads: {
                active: [],
                temporary: [],
                unresolved_foreshadows: []
            },
            continuity_risks: []
        },
        manual_state: {
            overview_notes: [],
            characters: {},
            relationships: {},
            factions: {},
            locations: {},
            items: {},
            abilities: {},
            rewards: [],
            system_panel: {
                system_name: "",
                owner: "",
                messages: [],
                rewards: [],
                benefits: [],
                rules: [],
                functions: [],
                statuses: [],
                pending_unlocks: []
            },
            hard_rules: [],
            continuity_risks: [],
            custom_modules: {}
        }
    },
    genre_progress_tracker: {
        current_genre: "",
        current_subgenre: "",
        pregnancy_progress: {},
        rank_progress: {},
        status_progress: {},
        progress_events: []
    },
    outline_plot_unit_manager: {
        plot_units: {},
        next_id: 1,
        unit_history: []
    },
    foreshadows: [],
    chapter_rhythms: {},
    chapter_emotions: {},
    chapter_analysis_reports: {},
    chapter_qc_reports: {},
    supporting_characters: {},
    prompt_state: {
        current_prompt: "",
        saved_prompts: {},
        selected_prompt: "",
        chapter_frequency: "male",
        ai_filter_enabled: true,
        ai_filter_whitelist: [],
        ai_filter_blacklist: []
    },
    generated_context: {
        worldbuilding: "",
        volume_synopsis: "",
        chapter_synopsis: ""
    },
    extra_character_records: {},
    used_extras_characters: [],
    used_temp_subplots: [],
    chapters: {},
    generatedChapterTexts: {},
    meta: {
        createdAt: "",
        updatedAt: ""
    }
};
