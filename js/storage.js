class StorageManager {
    constructor(storageKey) {
        this.storageKey = storageKey;
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                return this.getDefaultData();
            }

            return this.normalize(JSON.parse(raw));
        } catch (error) {
            console.error("加载小说数据失败：", error);
            return this.getDefaultData();
        }
    }

    save(data) {
        try {
            const normalized = this.normalize(data);
            normalized.meta.updatedAt = new Date().toISOString();

            if (!normalized.meta.createdAt) {
                normalized.meta.createdAt = normalized.meta.updatedAt;
            }

            localStorage.setItem(this.storageKey, JSON.stringify(normalized, null, 2));
            return true;
        } catch (error) {
            console.error("保存小说数据失败：", error);
            return false;
        }
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }

    export(filename, data) {
        Utils.downloadJSON(data || this.load(), filename);
    }

    getDefaultData() {
        const data = JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA));
        const now = new Date().toISOString();
        data.meta.createdAt = now;
        data.meta.updatedAt = now;
        return data;
    }

    normalize(data) {
        const merged = this.deepMerge(this.getDefaultData(), data || {});
        merged.outline.volumes = (merged.outline.volumes || []).map((volume, index) =>
            this.normalizeVolume(volume, index)
        );
        merged.outline.characters = (merged.outline.characters || []).map((character) =>
            this.normalizeCharacter(character)
        );
        merged.genre = merged.genre || merged.outline.genre || "";
        merged.subgenre = merged.subgenre || merged.outline.subgenre || "";
        merged.idea_lab = merged.idea_lab && typeof merged.idea_lab === "object"
            ? {
                keyword: merged.idea_lab.keyword || "",
                extra_note: merged.idea_lab.extra_note || "",
                version_count: Math.min(5, Math.max(3, Number(merged.idea_lab.version_count || 4) || 4)),
                use_market_trends: merged.idea_lab.use_market_trends === true,
                market_summary: merged.idea_lab.market_summary || "",
                market_items: Array.isArray(merged.idea_lab.market_items) ? merged.idea_lab.market_items : [],
                market_diagnostics: merged.idea_lab.market_diagnostics && typeof merged.idea_lab.market_diagnostics === "object"
                    ? merged.idea_lab.market_diagnostics
                    : {},
                market_selected_categories: Array.isArray(merged.idea_lab.market_selected_categories)
                    ? merged.idea_lab.market_selected_categories
                    : [],
                market_source_breakdown: merged.idea_lab.market_source_breakdown && typeof merged.idea_lab.market_source_breakdown === "object"
                    ? merged.idea_lab.market_source_breakdown
                    : {},
                market_status: merged.idea_lab.market_status || "",
                market_error: merged.idea_lab.market_error || "",
                selected_id: merged.idea_lab.selected_id || "",
                results: Array.isArray(merged.idea_lab.results) ? merged.idea_lab.results : []
            }
            : {
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
            };
        merged.genre_extensions = merged.genre_extensions && typeof merged.genre_extensions === "object"
            ? merged.genre_extensions
            : {};
        merged.outline.genre = merged.outline.genre || merged.genre || "";
        merged.outline.subgenre = merged.outline.subgenre || merged.subgenre || "";
        merged.synopsisData = this.normalizeSynopsisData(merged.synopsisData || merged.synopsis_data || {});
        merged.synopsis_data = JSON.parse(JSON.stringify(merged.synopsisData));
        merged.outline.storyConcept = merged.outline.storyConcept || merged.synopsisData.story_concept || "";
        merged.outline.worldbuilding = merged.outline.worldbuilding || merged.synopsisData.worldbuilding || "";
        merged.outline.total_chapters = merged.outline.total_chapters || (
            Number(merged.synopsisData.volumeCount || 0) * Number(merged.synopsisData.chaptersPerVolume || 0)
        );
        merged.chapters = merged.chapters || {};
        merged.generatedChapterTexts = merged.generatedChapterTexts || {};
        merged.extra_character_records = merged.extra_character_records && typeof merged.extra_character_records === "object"
            ? merged.extra_character_records
            : {};
        merged.used_extras_characters = Array.isArray(merged.used_extras_characters) ? merged.used_extras_characters : [];
        merged.used_temp_subplots = Array.isArray(merged.used_temp_subplots) ? merged.used_temp_subplots : [];
        merged.foreshadows = Array.isArray(merged.foreshadows) ? merged.foreshadows : [];
        merged.chapter_rhythms = merged.chapter_rhythms && typeof merged.chapter_rhythms === "object"
            ? merged.chapter_rhythms
            : {};
        merged.chapter_emotions = merged.chapter_emotions && typeof merged.chapter_emotions === "object"
            ? merged.chapter_emotions
            : {};
        merged.chapter_analysis_reports = merged.chapter_analysis_reports && typeof merged.chapter_analysis_reports === "object"
            ? merged.chapter_analysis_reports
            : {};
        merged.chapter_qc_reports = merged.chapter_qc_reports && typeof merged.chapter_qc_reports === "object"
            ? merged.chapter_qc_reports
            : {};
        merged.supporting_characters = merged.supporting_characters && typeof merged.supporting_characters === "object"
            ? merged.supporting_characters
            : {};
        merged.world_state_manager = merged.world_state_manager && typeof merged.world_state_manager === "object"
            ? merged.world_state_manager
            : JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.world_state_manager));
        merged.world_state_manager.meta = merged.world_state_manager.meta && typeof merged.world_state_manager.meta === "object"
            ? {
                schema_version: merged.world_state_manager.meta.schema_version || DEFAULT_NOVEL_DATA.world_state_manager.meta.schema_version,
                genre_profile: merged.world_state_manager.meta.genre_profile || "",
                genre_modules: Array.isArray(merged.world_state_manager.meta.genre_modules)
                    ? merged.world_state_manager.meta.genre_modules
                    : [],
                last_synced_at: merged.world_state_manager.meta.last_synced_at || "",
                last_synced_chapter: Number(merged.world_state_manager.meta.last_synced_chapter || 0),
                last_synced_volume: Number(merged.world_state_manager.meta.last_synced_volume || 0)
            }
            : JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.world_state_manager.meta));
        merged.world_state_manager.auto_state = merged.world_state_manager.auto_state && typeof merged.world_state_manager.auto_state === "object"
            ? merged.world_state_manager.auto_state
            : JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.world_state_manager.auto_state));
        merged.world_state_manager.auto_state.system_panel = merged.world_state_manager.auto_state.system_panel
            && typeof merged.world_state_manager.auto_state.system_panel === "object"
            ? merged.world_state_manager.auto_state.system_panel
            : JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.world_state_manager.auto_state.system_panel));
        merged.world_state_manager.manual_state = merged.world_state_manager.manual_state && typeof merged.world_state_manager.manual_state === "object"
            ? merged.world_state_manager.manual_state
            : JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.world_state_manager.manual_state));
        merged.world_state_manager.manual_state.system_panel = merged.world_state_manager.manual_state.system_panel
            && typeof merged.world_state_manager.manual_state.system_panel === "object"
            ? merged.world_state_manager.manual_state.system_panel
            : JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.world_state_manager.manual_state.system_panel));
        merged.genre_progress_tracker = merged.genre_progress_tracker && typeof merged.genre_progress_tracker === "object"
            ? {
                current_genre: merged.genre_progress_tracker.current_genre || "",
                current_subgenre: merged.genre_progress_tracker.current_subgenre || "",
                pregnancy_progress: merged.genre_progress_tracker.pregnancy_progress && typeof merged.genre_progress_tracker.pregnancy_progress === "object"
                    ? merged.genre_progress_tracker.pregnancy_progress
                    : {},
                rank_progress: merged.genre_progress_tracker.rank_progress && typeof merged.genre_progress_tracker.rank_progress === "object"
                    ? merged.genre_progress_tracker.rank_progress
                    : {},
                status_progress: merged.genre_progress_tracker.status_progress && typeof merged.genre_progress_tracker.status_progress === "object"
                    ? merged.genre_progress_tracker.status_progress
                    : {},
                progress_events: Array.isArray(merged.genre_progress_tracker.progress_events)
                    ? merged.genre_progress_tracker.progress_events
                    : []
            }
            : {
                current_genre: "",
                current_subgenre: "",
                pregnancy_progress: {},
                rank_progress: {},
                status_progress: {},
                progress_events: []
            };
        merged.outline_plot_unit_manager = merged.outline_plot_unit_manager && typeof merged.outline_plot_unit_manager === "object"
            ? {
                plot_units: merged.outline_plot_unit_manager.plot_units && typeof merged.outline_plot_unit_manager.plot_units === "object"
                    ? merged.outline_plot_unit_manager.plot_units
                    : {},
                next_id: Number(merged.outline_plot_unit_manager.next_id || 1),
                unit_history: Array.isArray(merged.outline_plot_unit_manager.unit_history)
                    ? merged.outline_plot_unit_manager.unit_history
                    : []
            }
            : { plot_units: {}, next_id: 1, unit_history: [] };
        this.syncTopLevelChapterContent(merged);
        return merged;
    }

    normalizeVolume(volume, index) {
        const volumeId = volume.id || volume.uuid || Utils.uid("volume");
        const normalized = {
            ...volume,
            id: volumeId,
            uuid: volume.uuid || volumeId,
            title: volume.title || `第${index + 1}卷`,
            summary: volume.summary || "",
            cliffhanger: volume.cliffhanger || "",
            chapterSynopsis: volume.chapterSynopsis || volume.chapter_synopsis || "",
            chapter_synopsis: volume.chapterSynopsis || volume.chapter_synopsis || "",
            chapters: Array.isArray(volume.chapters)
                ? volume.chapters.map((chapter) => this.normalizeChapter(chapter))
                : []
        };

        normalized.chapters.sort((left, right) => left.number - right.number);
        return normalized;
    }

    normalizeChapter(chapter) {
        const chapterId = chapter.id || chapter.uuid || Utils.uid("chapter");
        return {
            ...chapter,
            id: chapterId,
            uuid: chapter.uuid || chapterId,
            number: Number(chapter.number || chapter.chapter_number || 0) || 0,
            title: chapter.title || "",
            summary: chapter.summary || chapter.synopsis || "",
            content: chapter.content || "",
            chapter_setting_note: chapter.chapter_setting_note || "",
            keyEvent: chapter.keyEvent || chapter.key_event || "",
            emotionCurve: chapter.emotionCurve || chapter.emotion_curve || "",
            characters: Array.isArray(chapter.characters)
                ? chapter.characters
                : Utils.ensureArrayFromText(chapter.characters),
            foreshadows: Array.isArray(chapter.foreshadows)
                ? chapter.foreshadows
                : Utils.ensureArrayFromText(chapter.foreshadows),
            plot_unit: chapter.plot_unit || {},
            next_chapter_setup: chapter.next_chapter_setup || {},
            chapter_number: Number(chapter.number || chapter.chapter_number || 0) || 0,
            key_event: chapter.keyEvent || chapter.key_event || "",
            emotion_curve: chapter.emotionCurve || chapter.emotion_curve || "",
            updatedAt: chapter.updatedAt || chapter.updated_at || ""
        };
    }

    normalizeCharacter(character) {
        const characterId = character.id || character.uuid || Utils.uid("character");
        return {
            ...character,
            id: characterId,
            uuid: character.uuid || characterId,
            name: character.name || "",
            identity: character.identity || character["身份"] || "",
            age: character.age || "",
            gender: character.gender || "",
            personality: character.personality || character["性格特点"] || "",
            background: character.background || character["背景故事"] || "",
            appearance: character.appearance || character["外貌描述"] || "",
            abilities: character.abilities || character["能力特长"] || "",
            goals: character.goals || character["目标动机"] || "",
            relationships: character.relationships || character["人物关系"] || "",
            性格特点: character.personality || character["性格特点"] || "",
            背景故事: character.background || character["背景故事"] || "",
            外貌描述: character.appearance || character["外貌描述"] || "",
            能力特长: character.abilities || character["能力特长"] || "",
            目标动机: character.goals || character["目标动机"] || ""
        };
    }

    normalizeSynopsisData(data) {
        const normalized = {
            ...JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.synopsisData)),
            ...(data || {})
        };

        normalized.story_concept = normalized.story_concept || normalized.storyConcept || "";
        normalized.storyConcept = normalized.storyConcept || normalized.story_concept || "";
        normalized.volume_synopsis = normalized.volume_synopsis || normalized.volumeSynopsis || "";
        normalized.volumeSynopsis = normalized.volumeSynopsis || normalized.volume_synopsis || "";
        normalized.synopsis_output = normalized.synopsis_output || normalized.synopsisOutput || "";
        normalized.synopsisOutput = normalized.synopsisOutput || normalized.synopsis_output || "";
        normalized.ai_filter_enabled = normalized.ai_filter_enabled !== false;
        normalized.ai_filter_whitelist = Array.isArray(normalized.ai_filter_whitelist)
            ? normalized.ai_filter_whitelist
            : [];
        normalized.ai_filter_blacklist = Array.isArray(normalized.ai_filter_blacklist)
            ? normalized.ai_filter_blacklist
            : [];
        normalized.worldbuilding = normalized.worldbuilding || "";
        normalized.vol_count = String(normalized.vol_count || normalized.volumeCount || 5);
        normalized.chap_count = String(normalized.chap_count || normalized.chaptersPerVolume || 20);
        normalized.volumeCount = Number(normalized.volumeCount || normalized.vol_count || 5);
        normalized.chaptersPerVolume = Number(normalized.chaptersPerVolume || normalized.chap_count || 20);
        return normalized;
    }

    syncTopLevelChapterContent(data) {
        const topLevelChapters = data.chapters || {};
        (data.outline.volumes || []).forEach((volume) => {
            (volume.chapters || []).forEach((chapter) => {
                if (!chapter.content && chapter.uuid && topLevelChapters[chapter.uuid]) {
                    chapter.content = topLevelChapters[chapter.uuid];
                }
                if (chapter.content && chapter.uuid) {
                    topLevelChapters[chapter.uuid] = chapter.content;
                }
            });
        });
        data.chapters = topLevelChapters;
    }

    deepMerge(target, source) {
        if (Array.isArray(source)) {
            return source.slice();
        }

        const result = { ...target };
        Object.keys(source || {}).forEach((key) => {
            const sourceValue = source[key];
            if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue)) {
                result[key] = this.deepMerge(target[key] || {}, sourceValue);
            } else {
                result[key] = sourceValue;
            }
        });
        return result;
    }
}

class SettingsStorage {
    constructor(storageKey) {
        this.storageKey = storageKey;
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                return { ...DEFAULT_API_CONFIG };
            }

            return { ...DEFAULT_API_CONFIG, ...JSON.parse(raw) };
        } catch (error) {
            console.error("加载 API 设置失败：", error);
            return { ...DEFAULT_API_CONFIG };
        }
    }

    save(settings) {
        try {
            const merged = { ...DEFAULT_API_CONFIG, ...(settings || {}) };
            localStorage.setItem(this.storageKey, JSON.stringify(merged, null, 2));
            return true;
        } catch (error) {
            console.error("保存 API 设置失败：", error);
            return false;
        }
    }
}

const storage = new StorageManager(APP_CONFIG.storageKey);
const settingsStorage = new SettingsStorage(APP_CONFIG.settingsKey);
