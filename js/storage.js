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
