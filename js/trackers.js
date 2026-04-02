// 伏笔追踪系统
class ForeshadowTracker {
    constructor() {
        this.foreshadows = {};
        this.nextId = 1;
    }

    // 添加伏笔
    addForeshadow(chapter, content, ftype = "支线伏笔", method = "对话", plannedResolve = null, importance = "普通") {
        const fid = `f_${this.nextId}`;
        this.nextId++;

        this.foreshadows[fid] = {
            id: fid,
            埋设章节: chapter,
            伏笔内容: content,
            伏笔类型: ftype,
            埋设方式: method,
            计划回收: plannedResolve,
            重要程度: importance,
            状态: "未回收",
            回收章节: null,
            创建时间: new Date().toLocaleString('zh-CN')
        };

        return fid;
    }

    // 标记伏笔已回收
    resolveForeshadow(fid, chapter) {
        if (this.foreshadows[fid]) {
            this.foreshadows[fid].状态 = "已回收";
            this.foreshadows[fid].回收章节 = chapter;
            return true;
        }
        return false;
    }

    // 获取未回收的伏笔
    getUnresolvedForeshadows(currentChapter = null, limit = 10) {
        const unresolved = [];

        for (const fid in this.foreshadows) {
            const data = this.foreshadows[fid];
            if (data.状态 === "未回收") {
                let priority = 0;

                // 核心伏笔优先
                if (data.重要程度 === "核心") priority += 100;
                else if (data.重要程度 === "重要") priority += 50;

                // 接近计划回收章节的优先
                if (currentChapter && data.计划回收) {
                    const planned = data.计划回收;
                    if (planned.includes("第") && planned.includes("章")) {
                        const match = planned.match(/\d+/);
                        if (match) {
                            const plannedCh = parseInt(match[0]);
                            const distance = Math.abs(currentChapter - plannedCh);
                            if (distance <= 3) {
                                priority += 100 - distance * 20;
                            }
                        }
                    } else if (planned.includes("卷末") || planned.includes("本卷末")) {
                        priority += 30;
                    }
                }

                unresolved.push({ priority, data });
            }
        }

        // 按优先级排序
        unresolved.sort((a, b) => b.priority - a.priority);

        return unresolved.slice(0, limit).map(item => item.data);
    }

    // 导出为对象
    exportToDict() {
        return {
            foreshadows: this.foreshadows,
            nextId: this.nextId
        };
    }

    // 从对象导入
    importFromDict(data) {
        if (data.foreshadows) {
            this.foreshadows = data.foreshadows;
        }
        if (data.nextId) {
            this.nextId = data.nextId;
        }
    }
}

// 人物出场追踪器
class CharacterAppearanceTracker {
    constructor() {
        this.appearances = {}; // {角色名: {"首次出场": 章节, "出场章节": [...], "身份": str}}
        this.relationships = {}; // {"角色A|角色B": {"首次见面": 章节, "关系": str, "互动章节": [...]}}
    }

    // 生成关系key
    makeKey(charA, charB) {
        return [charA, charB].sort().join("|");
    }

    // 记录人物出场
    recordAppearance(characterName, chapter, identity = "") {
        if (!this.appearances[characterName]) {
            this.appearances[characterName] = {
                首次出场: chapter,
                出场章节: [],
                身份: identity
            };
        }

        if (!this.appearances[characterName].出场章节.includes(chapter)) {
            this.appearances[characterName].出场章节.push(chapter);
        }

        if (identity && !this.appearances[characterName].身份) {
            this.appearances[characterName].身份 = identity;
        }
    }

    // 记录两人互动
    recordInteraction(charA, charB, chapter, relationshipType = "") {
        const key = this.makeKey(charA, charB);

        if (!this.relationships[key]) {
            this.relationships[key] = {
                首次见面: chapter,
                关系: relationshipType,
                互动章节: []
            };
        }

        if (!this.relationships[key].互动章节.includes(chapter)) {
            this.relationships[key].互动章节.push(chapter);
        }

        if (relationshipType && !this.relationships[key].关系) {
            this.relationships[key].关系 = relationshipType;
        }
    }

    // 检查两人是否见过面
    haveMet(charA, charB) {
        const key = this.makeKey(charA, charB);
        return key in this.relationships;
    }

    // 获取首次见面章节
    getFirstMeeting(charA, charB) {
        const key = this.makeKey(charA, charB);
        return this.relationships[key]?.首次见面 || null;
    }

    // 导出为对象
    exportToDict() {
        return {
            appearances: this.appearances,
            relationships: this.relationships
        };
    }

    // 从对象导入
    importFromDict(data) {
        if (data.appearances) {
            this.appearances = data.appearances;
        }
        if (data.relationships) {
            this.relationships = data.relationships;
        }
    }
}

// 剧情单元管理器
class OutlinePlotUnitManager {
    constructor() {
        this.plotUnits = {};
        this.nextId = 1;
        this.unitHistory = [];
    }

    // 剧情单元阶段定义
    static UNIT_PHASES = {
        "开端": {
            章节范围: "第1-2章",
            核心任务: ["引入新冲突/目标/角色", "铺垫氛围，设置悬念", "承接上一单元的伏笔"],
            引导: "建立读者期待，让读者想知道接下来会发生什么"
        },
        "发展": {
            章节范围: "第3-5章",
            核心任务: ["冲突升级，困难重重", "角色成长，关系变化", "埋下新的伏笔"],
            引导: "推进剧情，让读者投入情感，关心角色命运"
        },
        "高潮": {
            章节范围: "第6-7章",
            核心任务: ["矛盾激化到顶点", "关键转折，真相揭露", "情绪最强烈的时刻"],
            引导: "让读者心跳加速，情绪被剧情牵动"
        },
        "结尾": {
            章节范围: "第8章",
            核心任务: ["解决当前冲突（或部分解决）", "揭示部分真相", "为下一单元铺垫悬念钩子"],
            引导: "给读者满足感，同时让他们迫切想知道下一单元会发生什么"
        }
    };

    // 创建剧情单元
    createPlotUnit(unitNumber, volumeNumber, startChapter, endChapter, coreConflict = "", relatedChars = null) {
        const uid = `pu_${this.nextId}`;
        this.nextId++;

        const chapters = [];
        for (let i = startChapter; i <= endChapter; i++) {
            chapters.push(i);
        }

        this.plotUnits[uid] = {
            id: uid,
            unitNumber: unitNumber,
            volume: volumeNumber,
            startChapter: startChapter,
            endChapter: endChapter,
            chapters: chapters,
            coreConflict: coreConflict,
            relatedChars: relatedChars || [],
            currentPhase: "开端",
            phaseProgress: {
                "开端": { status: "进行中", chapters: [], keyEvents: [] },
                "发展": { status: "未开始", chapters: [], keyEvents: [] },
                "高潮": { status: "未开始", chapters: [], keyEvents: [] },
                "结尾": { status: "未开始", chapters: [], keyEvents: [] }
            },
            connectionToPrevious: null,
            connectionToNext: null,
            suspenseHook: "",
            completed: false,
            keyEvents: []
        };

        return uid;
    }

    // 获取章节所属的剧情单元
    getUnitForChapter(chapterNum) {
        for (const uid in this.plotUnits) {
            const unit = this.plotUnits[uid];
            if (unit.startChapter <= chapterNum && chapterNum <= unit.endChapter) {
                return { uid, unit };
            }
        }
        return { uid: null, unit: null };
    }

    // 获取章节在单元中的阶段
    getPhaseForChapter(chapterNum) {
        const position = ((chapterNum - 1) % 8) + 1;

        if (position <= 2) return { phase: "开端", position };
        else if (position <= 5) return { phase: "发展", position };
        else if (position <= 7) return { phase: "高潮", position };
        else return { phase: "结尾", position };
    }

    // 获取阶段建议
    getUnitSuggestions(chapterNum) {
        const { phase, position } = this.getPhaseForChapter(chapterNum);
        const phaseInfo = OutlinePlotUnitManager.UNIT_PHASES[phase];

        return {
            phase: phase,
            position: position,
            核心任务: phaseInfo.核心任务,
            引导: phaseInfo.引导
        };
    }

    // 导出为对象
    exportToDict() {
        return {
            plotUnits: this.plotUnits,
            nextId: this.nextId,
            unitHistory: this.unitHistory
        };
    }

    // 从对象导入
    importFromDict(data) {
        if (data.plotUnits) {
            this.plotUnits = data.plotUnits;
        }
        if (data.nextId) {
            this.nextId = data.nextId;
        }
        if (data.unitHistory) {
            this.unitHistory = data.unitHistory;
        }
    }
}

// 全局实例
const foreshadowTracker = new ForeshadowTracker();
const characterAppearanceTracker = new CharacterAppearanceTracker();
const outlinePlotUnitManager = new OutlinePlotUnitManager();
