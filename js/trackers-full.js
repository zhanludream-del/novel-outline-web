// ============================================
// 完整追踪系统 - 从Python源代码完整迁移
// ============================================

// 1. PostQCAnalyzer - 章节质检分析器
class PostQCAnalyzer {
    constructor() {
        this.qcPromptTemplate = `你是专业的小说逻辑质检编辑。请分析以下章节内容，检测是否存在逻辑问题。

【章节内容】
{chapter_content}

【前文状态】
{prev_state}

【质检清单】
请从以下维度进行检查：

1. **时间逻辑** 
   - 时间是否连续？本章开头与上章结尾时间是否衔接？
   - 时间跨度是否合理？
   - 季节/天气是否一致？

2. **空间逻辑**
   - 场景转换是否合理？（不能瞬移）
   - 人物位置是否正确？

3. **人物逻辑**
   - 人物行为是否符合性格？
   - 人物状态是否连续？（受伤/怀孕等状态要延续）
   - 人物对话是否符合身份？

4. **情节逻辑**
   - 事件因果是否合理？
   - 是否有逻辑漏洞？
   - 是否与前文设定矛盾？

5. **伏笔逻辑**
   - 新埋伏笔是否记录？
   - 该揭开的伏笔是否揭开？

6. **秘密逻辑**
   - 秘密知情者是否正确？
   - 是否有人不该知道却知道了？

7. **内容重复检测**
   - 是否有重复的描写？
   - 是否有重复的对话？
   - 是否有重复的情节？

【输出格式】
请以JSON格式输出：
\`\`\`json
{
    "passed": true/false,
    "issues": [
        {
            "type": "时间/空间/人物/情节/伏笔/秘密/重复",
            "severity": "严重/中等/轻微",
            "description": "具体问题描述",
            "location": "问题所在段落或句子",
            "suggestion": "修改建议"
        }
    ],
    "new_foreshadows": ["新埋设的伏笔列表"],
    "resolved_foreshadows": ["本章揭开的伏笔列表"],
    "secret_changes": ["秘密知情状态的变化"],
    "character_state_changes": {"角色名": "状态变化描述"},
    "summary": "总体评价"
}
\`\`\``;
    }

    buildQCPrompt(chapterContent, prevState) {
        return this.qcPromptTemplate
            .replace('{chapter_content}', chapterContent)
            .replace('{prev_state}', prevState || '无');
    }

    parseQCResult(resultText) {
        try {
            // 提取JSON
            const jsonMatch = resultText.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : resultText;
            return JSON.parse(jsonStr);
        } catch (e) {
            return {
                passed: true,
                issues: [],
                error: `解析质检结果失败: ${e.message}`
            };
        }
    }

    analyzeChapter(chapterContent, chapterNum, prevState = null) {
        const issues = [];

        // 1. 检查内容重复
        const lines = chapterContent.split('\n');
        const seenLines = {};
        lines.forEach((line, i) => {
            const lineStripped = line.trim();
            if (lineStripped.length > 20) {
                if (seenLines[lineStripped] !== undefined) {
                    issues.push({
                        type: "重复",
                        severity: "中等",
                        description: `第${i+1}行与第${seenLines[lineStripped]+1}行重复`,
                        location: lineStripped.substring(0, 50),
                        suggestion: "删除或修改重复内容"
                    });
                } else {
                    seenLines[lineStripped] = i;
                }
            }
        });

        // 2. 检查AI味词汇
        const aiFlavorWords = ["总之", "综上所述", "让我们", "不得不说", "值得一提的是", 
                              "可见", "总的来说", "综上", "毋庸置疑"];
        aiFlavorWords.forEach(word => {
            if (chapterContent.includes(word)) {
                issues.push({
                    type: "AI味",
                    severity: "轻微",
                    description: `检测到AI味词汇：${word}`,
                    suggestion: "使用更自然的表达方式"
                });
            }
        });

        // 3. 检查字数
        const wordCount = chapterContent.length;
        if (wordCount < 2000) {
            issues.push({
                type: "字数",
                severity: "严重",
                description: `字数不足：${wordCount}字（建议3000-5000字）`,
                suggestion: "扩展情节细节"
            });
        }

        return {
            passed: !issues.some(i => i.severity === "严重" || i.severity === "中等"),
            issues: issues,
            wordCount: wordCount
        };
    }
}

// 2. ForeshadowManager - 伏笔生命周期管理器
class ForeshadowManager {
    constructor() {
        this.foreshadows = [];
    }

    addForeshadow(foreshadowId, content, buriedChapter, expectedReveal = null, 
                  foreshadowType = "剧情伏笔", importance = "一般") {
        this.foreshadows.push({
            id: foreshadowId,
            content: content,
            type: foreshadowType,
            buriedChapter: buriedChapter,
            expectedRevealChapter: expectedReveal,
            revealedChapter: null,
            status: "planted",
            importance: importance,
            relatedCharacters: [],
            notes: ""
        });
    }

    plantForeshadow(description, chapter, importance = 'medium', foreshadowType = '剧情伏笔') {
        const foreshadowId = `f_${chapter}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.addForeshadow(
            foreshadowId,
            description,
            chapter,
            null,
            foreshadowType,
            importance
        );
        return foreshadowId;
    }

    revealForeshadow(foreshadowId, revealedChapter, howRevealed = "") {
        const f = this.foreshadows.find(item => item.id === foreshadowId);
        if (f) {
            f.status = "revealed";
            f.revealedChapter = revealedChapter;
            f.howRevealed = howRevealed;
        }
    }

    getUnrevealed() {
        return this.foreshadows.filter(f => 
            f.status === "planted" || f.status === "partially_revealed"
        );
    }

    getShouldRevealInChapter(chapterNum) {
        return this.foreshadows.filter(f => 
            f.expectedRevealChapter && 
            (f.status === "planted" || f.status === "partially_revealed") &&
            chapterNum >= f.expectedRevealChapter
        );
    }

    getContextForGeneration(currentChapter) {
        const unrevealed = this.getUnrevealed();
        if (unrevealed.length === 0) return "";

        const contextLines = ["【未回收伏笔提醒】以下伏笔尚未揭开，请在合适时机回收："];
        unrevealed.slice(0, 10).forEach(f => {
            contextLines.push(`  [${f.type}] ${f.content.substring(0, 50)}... (埋设于第${f.buriedChapter}章)`);
        });
        return contextLines.join("\n");
    }
}

// 3. SecretMatrix - 秘密知情者管理矩阵
class SecretMatrix {
    constructor() {
        this.secrets = {};
        this.matrix = {};
    }

    addSecret(secretId, content, initialKnower = null) {
        this.secrets[secretId] = {
            content: content,
            knownBy: initialKnower ? [initialKnower] : [],
            revealedChapter: null,
            revealHistory: []
        };
        this.matrix[secretId] = this.secrets[secretId];
    }

    revealSecret(secretId, knownBy, chapter, description = "") {
        if (!this.secrets[secretId]) {
            this.addSecret(secretId, description || secretId);
        }

        if (Array.isArray(knownBy)) {
            knownBy.forEach(charName => {
                this.characterLearnsSecret(secretId, charName, chapter);
            });
        } else {
            this.characterLearnsSecret(secretId, knownBy, chapter);
        }

        if (!this.secrets[secretId].revealedChapter) {
            this.secrets[secretId].revealedChapter = chapter;
        }
    }

    characterKnows(secretId, characterName) {
        if (this.secrets[secretId]) {
            if (!this.secrets[secretId].knownBy.includes(characterName)) {
                this.secrets[secretId].knownBy.push(characterName);
            }
        }
    }

    characterLearnsSecret(secretId, characterName, chapter, how = "") {
        if (this.secrets[secretId]) {
            if (!this.secrets[secretId].knownBy.includes(characterName)) {
                this.secrets[secretId].knownBy.push(characterName);
                this.secrets[secretId].revealHistory.push({
                    chapter: chapter,
                    character: characterName,
                    how: how
                });
            }
        }
    }

    doesCharacterKnow(secretId, characterName) {
        return this.secrets[secretId]?.knownBy.includes(characterName) || false;
    }

    getSecretsUnknownTo(characterName) {
        const result = {};
        for (const [sid, sdata] of Object.entries(this.secrets)) {
            if (!sdata.knownBy.includes(characterName)) {
                result[sid] = sdata;
            }
        }
        return result;
    }

    getMatrixReport() {
        if (Object.keys(this.secrets).length === 0) {
            return "  （暂无秘密设定）";
        }

        const reportLines = [];
        for (const [secretId, sdata] of Object.entries(this.secrets)) {
            const status = sdata.revealedChapter ? "已揭露" : "未揭露";
            const knownBy = sdata.knownBy.length > 0 ? sdata.knownBy.join(", ") : "无人知晓";
            const content = (sdata.content || secretId).substring(0, 50);
            reportLines.push(`  - ${content}... [${status}] 知情者：${knownBy}`);
        }
        return reportLines.join("\n");
    }

    getContextForGeneration(appearingCharacters) {
        if (!appearingCharacters || appearingCharacters.length === 0) return "";

        const contextLines = ["【秘密知情状态】请严格遵守以下秘密知情关系："];
        appearingCharacters.forEach(charName => {
            const knownSecrets = [];
            const unknownSecrets = [];
            
            for (const [sid, sdata] of Object.entries(this.secrets)) {
                if (sdata.knownBy.includes(charName)) {
                    knownSecrets.push(sdata.content.substring(0, 30));
                } else {
                    unknownSecrets.push(sdata.content.substring(0, 30));
                }
            }

            if (knownSecrets.length > 0 || unknownSecrets.length > 0) {
                contextLines.push(`\n角色【${charName}】：`);
                if (knownSecrets.length > 0) {
                    contextLines.push(`  ✓ 已知秘密: ${knownSecrets.slice(0, 3).join(', ')}`);
                }
                if (unknownSecrets.length > 0) {
                    contextLines.push(`  ✗ 未知秘密: ${unknownSecrets.slice(0, 3).join(', ')} (严禁让此角色知晓！)`);
                }
            }
        });

        return contextLines.join("\n");
    }
}

// 4. NameLocker - 名称锁定器
class NameLocker {
    constructor() {
        this.lockedNames = {
            characters: {},  // {原名: 锁定名}
            locations: {},
            organizations: {}
        };
    }

    lockName(nameType, originalName, lockedName, reason = "") {
        if (!this.lockedNames[nameType]) {
            this.lockedNames[nameType] = {};
        }
        this.lockedNames[nameType][originalName] = {
            lockedName: lockedName,
            reason: reason,
            lockedAt: new Date().toISOString()
        };
    }

    getLockedName(nameType, originalName) {
        return this.lockedNames[nameType]?.[originalName]?.lockedName || originalName;
    }

    getAllLockedNames(nameType) {
        return this.lockedNames[nameType] || {};
    }

    checkNameConsistency(nameType, text) {
        const issues = [];
        const locked = this.lockedNames[nameType] || {};
        
        for (const [original, data] of Object.entries(locked)) {
            if (text.includes(original) && original !== data.lockedName) {
                issues.push({
                    type: "名称不一致",
                    original: original,
                    shouldUse: data.lockedName,
                    reason: data.reason
                });
            }
        }
        
        return issues;
    }

    exportToDict() {
        return JSON.parse(JSON.stringify(this.lockedNames));
    }

    importFromDict(data) {
        this.lockedNames = data || {
            characters: {},
            locations: {},
            organizations: {}
        };
    }
}

// 5. TimelineTracker - 时间线追踪器
class TimelineTracker {
    constructor() {
        this.timeline = [];  // [{chapter, time_point, events, location}]
    }

    recordTimePoint(chapter, timePoint, events, location) {
        this.timeline.push({
            chapter: chapter,
            timePoint: timePoint,
            events: events,
            location: location,
            recordedAt: new Date().toISOString()
        });
    }

    validateTimeLogic(chapter, timePoint) {
        const issues = [];
        const prevEntry = this.timeline.filter(t => t.chapter < chapter).pop();

        if (prevEntry) {
            // 检查时间是否连续
            if (timePoint < prevEntry.timePoint) {
                issues.push({
                    type: "时间倒流",
                    severity: "严重",
                    description: `第${chapter}章时间早于第${prevEntry.chapter}章`,
                    suggestion: "检查时间设定是否合理"
                });
            }
        }

        return issues;
    }

    getTimelineReport() {
        if (this.timeline.length === 0) {
            return "（暂无时间线记录）";
        }

        const lines = ["【时间线记录】"];
        this.timeline.forEach(entry => {
            lines.push(`第${entry.chapter}章: ${entry.timePoint} @ ${entry.location}`);
            if (entry.events && entry.events.length > 0) {
                entry.events.forEach(e => lines.push(`  - ${e}`));
            }
        });

        return lines.join("\n");
    }

    getRecentTimePoint(chapters = 3) {
        return this.timeline.slice(-chapters);
    }

    exportToDict() {
        return this.timeline.slice();
    }

    importFromDict(data) {
        this.timeline = data || [];
    }
}

// 导出所有追踪器类
window.PostQCAnalyzer = PostQCAnalyzer;
window.ForeshadowManager = ForeshadowManager;
window.SecretMatrix = SecretMatrix;
window.NameLocker = NameLocker;
window.TimelineTracker = TimelineTracker;
