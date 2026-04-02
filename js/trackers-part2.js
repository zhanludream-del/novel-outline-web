// ============================================
// 追踪系统第二部分 - 完整迁移
// ============================================

// 6. ChapterAnalyzer - 章节分析报告生成器
class ChapterAnalyzer {
    constructor() {
        this.reportTemplate = `请为以下章节生成分析报告：

【章节标题】{chapter_title}
【章节内容】
{chapter_content}

【分析维度】
1. 情节推进分析
2. 人物表现分析
3. 情绪曲线分析
4. 伏笔处理分析
5. 节奏控制分析
6. 写作技巧分析

【输出格式】
请以JSON格式输出：
\`\`\`json
{
    "plot_progression": "情节推进评估",
    "character_performance": "人物表现评估",
    "emotion_curve": "情绪曲线分析",
    "foreshadow_handling": "伏笔处理评估",
    "pacing": "节奏控制评估",
    "writing_techniques": "写作技巧评估",
    "overall_score": 85,
    "strengths": ["优点1", "优点2"],
    "weaknesses": ["不足1", "不足2"],
    "suggestions": ["改进建议1", "改进建议2"]
}
\`\`\``;
    }

    generateReportPrompt(chapterTitle, chapterContent) {
        return this.reportTemplate
            .replace('{chapter_title}', chapterTitle)
            .replace('{chapter_content}', chapterContent);
    }

    parseReportResult(resultText) {
        try {
            const jsonMatch = resultText.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : resultText;
            return JSON.parse(jsonStr);
        } catch (e) {
            return {
                error: `解析报告失败: ${e.message}`,
                raw: resultText
            };
        }
    }
}

// 7. CharacterPersonalityEnforcer - 人物性格一致性系统
class CharacterPersonalityEnforcer {
    constructor() {
        this.characterPersonalities = {};  // {charName: {traits, keywords, constraints}}
    }

    setCharacterPersonality(charName, traits, keywords) {
        this.characterPersonalities[charName] = {
            traits: traits,  // ["勇敢", "冲动", "正义感强"]
            keywords: keywords,  // ["毫不犹豫", "拍案而起", "怒目而视"]
            constraints: [],
            createdAt: new Date().toISOString()
        };
    }

    analyzePersonalityKeywords(charName, text) {
        const personality = this.characterPersonalities[charName];
        if (!personality) return null;

        const foundKeywords = [];
        const missingKeywords = [];

        personality.keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                foundKeywords.push(keyword);
            } else {
                missingKeywords.push(keyword);
            }
        });

        return {
            found: foundKeywords,
            missing: missingKeywords,
            consistency: foundKeywords.length / personality.keywords.length
        };
    }

    generatePersonalityConstraint(charName) {
        const personality = this.characterPersonalities[charName];
        if (!personality) return "";

        const constraints = [];
        constraints.push(`角色【${charName}】性格特点：${personality.traits.join('、')}`);
        constraints.push(`常用表达方式：${personality.keywords.slice(0, 5).join('、')}`);
        constraints.push(`请确保角色的言行举止符合以上性格设定。`);

        return constraints.join("\n");
    }

    generateAllPersonalityConstraints() {
        const lines = ["【人物性格约束】"];
        
        for (const [charName, data] of Object.entries(this.characterPersonalities)) {
            lines.push(this.generatePersonalityConstraint(charName));
        }

        return lines.join("\n\n");
    }

    exportToDict() {
        return JSON.parse(JSON.stringify(this.characterPersonalities));
    }

    importFromDict(data) {
        this.characterPersonalities = data || {};
    }
}

// 8. SubplotManager - 支线管理系统
class SubplotManager {
    constructor() {
        this.subplots = {};
        this.nextId = 1;

        // 支线类型定义
        this.SUBPLOT_TYPES = {
            "感情线": {
                phases: ["相遇", "相识", "情感升温", "阻碍出现", "转折", "结局"],
                elements: ["一见钟情", "日久生情", "欢喜冤家", "禁忌之恋", "三角关系"]
            },
            "势力线": {
                phases: ["势力建立", "发展壮大", "遭遇危机", "内部矛盾", "转折", "最终格局"],
                elements: ["宗门争霸", "帝国崛起", "商战博弈", "帮派争斗", "政治斗争"]
            },
            "悬疑线": {
                phases: ["悬念设置", "线索出现", "误导", "真相浮现", "反转", "真相揭露"],
                elements: ["密室谜案", "身份之谜", "阴谋揭露", "连环计", "幕后黑手"]
            },
            "成长线": {
                phases: ["起点", "遭遇困境", "获得机缘", "瓶颈期", "突破", "蜕变"],
                elements: ["修炼升级", "技能掌握", "心境提升", "实力飞跃", "境界突破"]
            },
            "复仇线": {
                phases: ["仇恨起源", "潜伏准备", "初战告捷", "遭遇挫折", "最终对决", "结局"],
                elements: ["血海深仇", "忍辱负重", "步步为营", "绝地反击", "报仇雪恨"]
            },
            "商战线": {
                phases: ["商业起步", "市场竞争", "资源争夺", "危机爆发", "战略转折", "最终胜利"],
                elements: ["创业奋斗", "商业谋略", "资本博弈", "市场扩张", "垄断竞争"]
            },
            "传承线": {
                phases: ["机缘巧合", "拜师学艺", "刻苦修炼", "遭遇瓶颈", "领悟真谛", "传承成功"],
                elements: ["师徒情深", "技艺传承", "衣钵相传", "青出于蓝", "开宗立派"]
            }
        };
    }

    createSubplot(subplotType, name, startChapter, relatedChars = []) {
        const sid = `sp_${this.nextId}`;
        this.nextId++;

        const typeConfig = this.SUBPLOT_TYPES[subplotType] || {
            phases: ["起始", "发展", "高潮", "结局"],
            elements: []
        };

        this.subplots[sid] = {
            id: sid,
            type: subplotType,
            name: name,
            startChapter: startChapter,
            currentPhase: typeConfig.phases[0],
            phases: typeConfig.phases,
            elements: typeConfig.elements,
            relatedChars: relatedChars,
            events: [],
            status: "active",
            completed: false,
            createdAt: new Date().toISOString()
        };

        return sid;
    }

    updateStatus(sid, newPhase, chapter, eventDescription = "") {
        if (!this.subplots[sid]) return false;

        const subplot = this.subplots[sid];
        subplot.currentPhase = newPhase;
        
        if (eventDescription) {
            subplot.events.push({
                chapter: chapter,
                phase: newPhase,
                description: eventDescription
            });
        }

        // 检查是否完成
        if (newPhase === subplot.phases[subplot.phases.length - 1]) {
            subplot.completed = true;
            subplot.status = "completed";
        }

        return true;
    }

    recordSubplotEvent(sid, chapter, eventDescription) {
        if (!this.subplots[sid]) return false;

        this.subplots[sid].events.push({
            chapter: chapter,
            description: eventDescription,
            recordedAt: new Date().toISOString()
        });

        return true;
    }

    getActiveSubplots() {
        return Object.values(this.subplots).filter(sp => sp.status === "active");
    }

    getSubplotsByChapter(chapter) {
        return Object.values(this.subplots).filter(sp => 
            sp.startChapter <= chapter && !sp.completed
        );
    }

    getSubplotReport(chapter) {
        const activeSubplots = this.getSubplotsByChapter(chapter);
        if (activeSubplots.length === 0) return "";

        const lines = ["【支线剧情追踪】"];
        activeSubplots.forEach(sp => {
            lines.push(`\n【${sp.name}】(${sp.type})`);
            lines.push(`  当前阶段: ${sp.currentPhase}`);
            lines.push(`  相关角色: ${sp.relatedChars.join(', ')}`);
            if (sp.events.length > 0) {
                const recentEvent = sp.events[sp.events.length - 1];
                lines.push(`  最近事件: 第${recentEvent.chapter}章 - ${recentEvent.description}`);
            }
        });

        return lines.join("\n");
    }

    exportToDict() {
        return {
            subplots: this.subplots,
            nextId: this.nextId
        };
    }

    importFromDict(data) {
        if (data.subplots) this.subplots = data.subplots;
        if (data.nextId) this.nextId = data.nextId;
    }
}

// 9. ChapterSnapshot - 章末快照管理器
class ChapterSnapshot {
    constructor() {
        this.snapshots = {};  // {chapter: snapshot_data}
    }

    recordSnapshot(chapter, snapshotData) {
        this.snapshots[chapter] = {
            chapter: chapter,
            time: snapshotData.time || "",
            location: snapshotData.location || "",
            mainCharacters: snapshotData.mainCharacters || [],
            characterStates: snapshotData.characterStates || {},
            keyInformation: snapshotData.keyInformation || [],
            nextChapterExpectations: snapshotData.nextChapterExpectations || "",
            createdAt: new Date().toISOString()
        };
    }

    getSnapshot(chapter) {
        return this.snapshots[chapter] || null;
    }

    getPrevSnapshot(currentChapter) {
        const chapters = Object.keys(this.snapshots).map(Number).sort((a, b) => a - b);
        const prevChapters = chapters.filter(ch => ch < currentChapter);
        
        if (prevChapters.length === 0) return null;
        
        const prevChapter = prevChapters[prevChapters.length - 1];
        return this.snapshots[prevChapter];
    }

    getSnapshotReport(chapter) {
        const snapshot = this.getSnapshot(chapter);
        if (!snapshot) return "";

        const lines = [`【第${chapter}章末快照】`];
        if (snapshot.time) lines.push(`时间: ${snapshot.time}`);
        if (snapshot.location) lines.push(`地点: ${snapshot.location}`);
        if (snapshot.mainCharacters.length > 0) {
            lines.push(`主要人物: ${snapshot.mainCharacters.join(', ')}`);
        }
        if (snapshot.keyInformation.length > 0) {
            lines.push(`关键信息: ${snapshot.keyInformation.join('; ')}`);
        }
        if (snapshot.nextChapterExpectations) {
            lines.push(`下章预期: ${snapshot.nextChapterExpectations}`);
        }

        return lines.join("\n");
    }

    autoGenerateSnapshotFromContent(chapter, content) {
        // 简化的自动提取逻辑
        const snapshot = {
            time: "",
            location: "",
            mainCharacters: [],
            characterStates: {},
            keyInformation: [],
            nextChapterExpectations: ""
        };

        // 提取时间信息
        const timeMatch = content.match(/时间[：:]\s*([^\n]+)/);
        if (timeMatch) snapshot.time = timeMatch[1].trim();

        // 提取地点信息
        const locationMatch = content.match(/地点[：:]\s*([^\n]+)/);
        if (locationMatch) snapshot.location = locationMatch[1].trim();

        // 提取出场人物
        const charMatch = content.match(/【出场人物】\s*([\s\S]*?)(?=【|$)/);
        if (charMatch) {
            const charText = charMatch[1].trim();
            snapshot.mainCharacters = charText.split(/[、,\n]/)
                .map(c => c.replace(/[（\(][^）\)]*[）\)]/g, '').trim())
                .filter(c => c.length > 0);
        }

        this.recordSnapshot(chapter, snapshot);
        return snapshot;
    }

    generateTransitionGuide(currentChapter) {
        const prevSnapshot = this.getPrevSnapshot(currentChapter);
        if (!prevSnapshot) return "";

        const lines = ["【前章衔接信息】"];
        lines.push(`上章结束于: ${prevSnapshot.location}`);
        lines.push(`时间: ${prevSnapshot.time}`);
        if (prevSnapshot.mainCharacters.length > 0) {
            lines.push(`在场人物: ${prevSnapshot.mainCharacters.join(', ')}`);
        }
        if (prevSnapshot.nextChapterExpectations) {
            lines.push(`上章铺垫: ${prevSnapshot.nextChapterExpectations}`);
        }

        return lines.join("\n");
    }

    exportToDict() {
        return JSON.parse(JSON.stringify(this.snapshots));
    }

    importFromDict(data) {
        this.snapshots = data || {};
    }
}

// 10. CharacterConsistencyChecker - 人物一致性检查器
class CharacterConsistencyChecker {
    constructor() {
        this.characterStates = {};  // {charName: {position, cultivation, emotion, identity, items, specialStates}}
    }

    recordCharacterState(charName, chapter, stateData) {
        if (!this.characterStates[charName]) {
            this.characterStates[charName] = {
                history: [],
                currentState: {}
            };
        }

        const state = {
            chapter: chapter,
            position: stateData.position || "",
            cultivation: stateData.cultivation || "",
            emotion: stateData.emotion || "",
            identity: stateData.identity || "",
            items: stateData.items || [],
            specialStates: stateData.specialStates || [],
            updatedAt: new Date().toISOString()
        };

        this.characterStates[charName].history.push(state);
        this.characterStates[charName].currentState = state;
    }

    checkConsistency(charName, newState, chapter) {
        const charData = this.characterStates[charName];
        if (!charData) return { issues: [] };

        const issues = [];
        const prevState = charData.currentState;

        // 检查修为是否倒退
        if (prevState.cultivation && newState.cultivation) {
            if (this.compareCultivation(newState.cultivation, prevState.cultivation) < 0) {
                issues.push({
                    type: "修为倒退",
                    severity: "严重",
                    description: `${charName}的修为从"${prevState.cultivation}"倒退到"${newState.cultivation}"`,
                    suggestion: "修为不能倒退，除非有合理理由（如受伤、封印等）"
                });
            }
        }

        // 检查位置是否合理
        if (prevState.position && newState.position) {
            // 简单检查，实际应该更复杂
            if (prevState.position !== newState.position && !newState.position.includes("移动")) {
                // 可以添加更复杂的逻辑检查瞬移
            }
        }

        return { issues };
    }

    compareCultivation(cult1, cult2) {
        // 简化的修为比较，实际应该根据具体的修仙体系
        // 返回正数表示cult1 > cult2
        const levels = ["炼气", "筑基", "金丹", "元婴", "化神", "合体", "渡劫", "大乘", "仙人"];
        const idx1 = levels.findIndex(l => cult1.includes(l));
        const idx2 = levels.findIndex(l => cult2.includes(l));
        
        if (idx1 === -1 || idx2 === -1) return 0;
        return idx1 - idx2;
    }

    getCharacterReport(charName) {
        const charData = this.characterStates[charName];
        if (!charData) return "";

        const lines = [`【${charName}状态追踪】`];
        const state = charData.currentState;
        
        if (state.position) lines.push(`位置: ${state.position}`);
        if (state.cultivation) lines.push(`修为: ${state.cultivation}`);
        if (state.emotion) lines.push(`情绪: ${state.emotion}`);
        if (state.identity) lines.push(`身份: ${state.identity}`);
        if (state.items.length > 0) lines.push(`持有物品: ${state.items.join(', ')}`);
        if (state.specialStates.length > 0) lines.push(`特殊状态: ${state.specialStates.join(', ')}`);

        return lines.join("\n");
    }

    exportToDict() {
        return JSON.parse(JSON.stringify(this.characterStates));
    }

    importFromDict(data) {
        this.characterStates = data || {};
    }
}

// 导出追踪器类
window.ChapterAnalyzer = ChapterAnalyzer;
window.CharacterPersonalityEnforcer = CharacterPersonalityEnforcer;
window.SubplotManager = SubplotManager;
window.ChapterSnapshot = ChapterSnapshot;
window.CharacterConsistencyChecker = CharacterConsistencyChecker;
