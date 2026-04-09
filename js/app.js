class NovelOutlineWebApp {
    constructor() {
        this.storage = storage;
        this.novelData = this.storage.load();
        this.api = new AIAPIClient();
        this.generator = new NovelGenerator(this.api);
        this.state = {
            activeTab: "dashboard",
            activeChapterSubview: window.localStorage.getItem("novel_outline_chapter_subview") || "batch",
            selectedChapterId: null,
            editingCharacterId: null,
            selectedCharacterIds: new Set(),
            chapterListCollapsedMobile: window.localStorage.getItem("novel_outline_mobile_chapter_list") !== "open",
            logVisible: window.localStorage.getItem("novel_outline_log_visible") === "1",
            logCollapsed: window.localStorage.getItem("novel_outline_log_collapsed") !== "0"
        };

        this.autoSave = Utils.debounce(() => {
            this.persist(true);
        }, 450);

        this.cacheElements();
        this.init();
    }

    cacheElements() {
        this.elements = {
            appVersionChip: document.getElementById("appVersionChip"),
            menuToggle: document.getElementById("menuToggle"),
            sidebar: document.getElementById("sidebar"),
            sidebarBackdrop: document.getElementById("sidebarBackdrop"),
            navItems: Array.from(document.querySelectorAll(".nav-item")),
            jumpButtons: Array.from(document.querySelectorAll("[data-jump-tab]")),
            tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
            chapterSubviewButtons: Array.from(document.querySelectorAll("[data-chapter-subview]")),
            chapterSubviewPanels: Array.from(document.querySelectorAll("[data-chapter-subview-panel]")),
            importFileInput: document.getElementById("importFileInput"),

            statTitle: document.getElementById("statTitle"),
            statVolumes: document.getElementById("statVolumes"),
            statChapters: document.getElementById("statChapters"),
            statCharacters: document.getElementById("statCharacters"),
            summaryGenre: document.getElementById("summaryGenre"),
            summaryTheme: document.getElementById("summaryTheme"),
            summaryConcept: document.getElementById("summaryConcept"),
            dashboardMilestones: document.getElementById("dashboardMilestones"),

            projectTitle: document.getElementById("projectTitle"),
            projectTheme: document.getElementById("projectTheme"),
            projectGenre: document.getElementById("projectGenre"),
            projectSubgenre: document.getElementById("projectSubgenre"),
            btnAutoDetectGenre: document.getElementById("btnAutoDetectGenre"),
            genreGuideTitle: document.getElementById("genreGuideTitle"),
            genreGuideSubgenres: document.getElementById("genreGuideSubgenres"),
            genreGuideDescription: document.getElementById("genreGuideDescription"),
            genreGuideAllowed: document.getElementById("genreGuideAllowed"),
            genreGuideForbidden: document.getElementById("genreGuideForbidden"),
            projectVolumeCount: document.getElementById("projectVolumeCount"),
            projectChaptersPerVolume: document.getElementById("projectChaptersPerVolume"),
            projectConcept: document.getElementById("projectConcept"),
            ideaKeywordInput: document.getElementById("ideaKeywordInput"),
            ideaVersionCount: document.getElementById("ideaVersionCount"),
            ideaUseMarketTrends: document.getElementById("ideaUseMarketTrends"),
            ideaExtraNoteInput: document.getElementById("ideaExtraNoteInput"),
            ideaMarketSummary: document.getElementById("ideaMarketSummary"),
            ideaResults: document.getElementById("ideaResults"),
            worldbuildingText: document.getElementById("worldbuildingText"),
            volumeSynopsisText: document.getElementById("volumeSynopsisText"),
            synopsisCurrentVolume: document.getElementById("synopsisCurrentVolume"),
            synopsisOutput: document.getElementById("synopsisOutput"),
            outlineVolumeList: document.getElementById("outlineVolumeList"),

            chapterVolumeSelect: document.getElementById("chapterVolumeSelect"),
            chapterEditorVolumeSelect: document.getElementById("chapterEditorVolumeSelect"),
            chapterQuickSelect: document.getElementById("chapterQuickSelect"),
            chapterStart: document.getElementById("chapterStart"),
            chapterEnd: document.getElementById("chapterEnd"),
            chapterBatchPreview: document.getElementById("chapterBatchPreview"),
            chapterBatchList: document.getElementById("chapterBatchList"),
            chapterList: document.getElementById("chapterList"),
            chapterListDrawer: document.getElementById("chapterListDrawer"),
            chapterEditorHeading: document.getElementById("chapterEditorHeading"),
            chapterNumberInput: document.getElementById("chapterNumberInput"),
            chapterTitleInput: document.getElementById("chapterTitleInput"),
            chapterSummaryInput: document.getElementById("chapterSummaryInput"),
            chapterSettingNoteInput: document.getElementById("chapterSettingNoteInput"),
            chapterContentInput: document.getElementById("chapterContentInput"),
            chapterNextSetupPreview: document.getElementById("chapterNextSetupPreview"),
            chapterSnapshotPreview: document.getElementById("chapterSnapshotPreview"),
            chapterAnalysisPreview: document.getElementById("chapterAnalysisPreview"),
            chapterAnalysisReportPreview: document.getElementById("chapterAnalysisReportPreview"),
            chapterQcPreview: document.getElementById("chapterQcPreview"),
            chapterAiFilterEnabled: document.getElementById("chapterAiFilterEnabled"),

            characterName: document.getElementById("characterName"),
            characterIdentity: document.getElementById("characterIdentity"),
            characterAge: document.getElementById("characterAge"),
            characterGender: document.getElementById("characterGender"),
            characterAbilities: document.getElementById("characterAbilities"),
            characterGoals: document.getElementById("characterGoals"),
            characterPersonality: document.getElementById("characterPersonality"),
            characterBackground: document.getElementById("characterBackground"),
            characterAppearance: document.getElementById("characterAppearance"),
            characterRelationships: document.getElementById("characterRelationships"),
            characterList: document.getElementById("characterList"),
            characterSelectionCount: document.getElementById("characterSelectionCount"),
            btnSelectAllCharacters: document.getElementById("btnSelectAllCharacters"),
            btnClearCharacterSelection: document.getElementById("btnClearCharacterSelection"),
            btnDeleteSelectedCharacters: document.getElementById("btnDeleteSelectedCharacters"),

            detailedOutlineInput: document.getElementById("detailedOutlineInput"),
            globalSettingNoteInput: document.getElementById("globalSettingNoteInput"),
            currentPromptTemplateInput: document.getElementById("currentPromptTemplateInput"),
            aiFilterWhitelistInput: document.getElementById("aiFilterWhitelistInput"),
            aiFilterBlacklistInput: document.getElementById("aiFilterBlacklistInput"),
            promptFrequencySelect: document.getElementById("promptFrequencySelect"),
            savedPromptSelect: document.getElementById("savedPromptSelect"),
            promptNameInput: document.getElementById("promptNameInput"),

            settingsModal: document.getElementById("settingsModal"),
            settingProvider: document.getElementById("settingProvider"),
            settingModel: document.getElementById("settingModel"),
            settingApiBase: document.getElementById("settingApiBase"),
            settingRankApiUrl: document.getElementById("settingRankApiUrl"),
            settingRankTimeoutSeconds: document.getElementById("settingRankTimeoutSeconds"),
            settingRankRetryCount: document.getElementById("settingRankRetryCount"),
            settingApiKey: document.getElementById("settingApiKey"),
            settingTemperature: document.getElementById("settingTemperature"),
            settingMaxTokens: document.getElementById("settingMaxTokens"),
            settingTimeoutSeconds: document.getElementById("settingTimeoutSeconds"),
            settingRetryCount: document.getElementById("settingRetryCount"),

            trackerSummaryCards: document.getElementById("trackerSummaryCards"),
            trackerSnapshotList: document.getElementById("trackerSnapshotList"),
            trackerForeshadowList: document.getElementById("trackerForeshadowList"),
            trackerConsistencyList: document.getElementById("trackerConsistencyList"),
            trackerWorldEventList: document.getElementById("trackerWorldEventList"),
            worldStateSummaryCards: document.getElementById("worldStateSummaryCards"),
            worldStateCharacterList: document.getElementById("worldStateCharacterList"),
            worldStateFactionList: document.getElementById("worldStateFactionList"),
            worldStateSystemList: document.getElementById("worldStateSystemList"),
            worldStateAssetList: document.getElementById("worldStateAssetList"),
            worldStateRiskList: document.getElementById("worldStateRiskList"),

            btnShowLog: document.getElementById("btnShowLog"),
            btnOpenSettings: document.getElementById("btnOpenSettings"),
            btnCloseSettings: document.getElementById("btnCloseSettings"),
            btnCancelSettings: document.getElementById("btnCancelSettings"),
            btnSaveSettings: document.getElementById("btnSaveSettings"),
            btnSaveData: document.getElementById("btnSaveData"),
            btnExportTxt: document.getElementById("btnExportTxt"),
            btnExportData: document.getElementById("btnExportData"),
            btnImportData: document.getElementById("btnImportData"),
            btnClearProject: document.getElementById("btnClearProject"),
            btnGenerateWorldbuilding: document.getElementById("btnGenerateWorldbuilding"),
            btnGenerateIdeaLab: document.getElementById("btnGenerateIdeaLab"),
            btnClearIdeaLab: document.getElementById("btnClearIdeaLab"),
            btnCopySelectedIdea: document.getElementById("btnCopySelectedIdea"),
            btnApplySelectedIdea: document.getElementById("btnApplySelectedIdea"),
            btnClearWorldbuilding: document.getElementById("btnClearWorldbuilding"),
            btnGenerateVolumes: document.getElementById("btnGenerateVolumes"),
            btnClearVolumeSynopsis: document.getElementById("btnClearVolumeSynopsis"),
            btnGenerateChapterSynopsis: document.getElementById("btnGenerateChapterSynopsis"),
            btnGenerateAllSynopsis: document.getElementById("btnGenerateAllSynopsis"),
            btnClearCurrentSynopsis: document.getElementById("btnClearCurrentSynopsis"),
            btnImportSynopsisToOutline: document.getElementById("btnImportSynopsisToOutline"),
            btnCopySynopsis: document.getElementById("btnCopySynopsis"),
            btnAddVolume: document.getElementById("btnAddVolume"),
            btnClearVolumes: document.getElementById("btnClearVolumes"),
            btnGenerateChapters: document.getElementById("btnGenerateChapters"),
            btnRegenerateChapters: document.getElementById("btnRegenerateChapters"),
            btnDeleteOutlineRange: document.getElementById("btnDeleteOutlineRange"),
            btnContinueChapters: document.getElementById("btnContinueChapters"),
            btnDetectGaps: document.getElementById("btnDetectGaps"),
            btnExpandChapterContent: document.getElementById("btnExpandChapterContent"),
            btnExpandChapterContentInline: document.getElementById("btnExpandChapterContentInline"),
            btnCopyChapterSummary: document.getElementById("btnCopyChapterSummary"),
            btnExportCurrentChapter: document.getElementById("btnExportCurrentChapter"),
            btnExportCurrentChapterInline: document.getElementById("btnExportCurrentChapterInline"),
            btnManualAiFilter: document.getElementById("btnManualAiFilter"),
            btnAnalyzeChapter: document.getElementById("btnAnalyzeChapter"),
            btnRunChapterQc: document.getElementById("btnRunChapterQc"),
            btnRefreshChapterList: document.getElementById("btnRefreshChapterList"),
            btnToggleChapterList: document.getElementById("btnToggleChapterList"),
            btnPrevChapter: document.getElementById("btnPrevChapter"),
            btnNextChapter: document.getElementById("btnNextChapter"),
            btnBatchDeleteChapters: document.getElementById("btnBatchDeleteChapters"),
            btnCopyChapter: document.getElementById("btnCopyChapter"),
            btnClearChapterContent: document.getElementById("btnClearChapterContent"),
            btnSaveChapter: document.getElementById("btnSaveChapter"),
            btnSaveChapterInline: document.getElementById("btnSaveChapterInline"),
            btnDeleteChapter: document.getElementById("btnDeleteChapter"),
            btnGenerateCharacters: document.getElementById("btnGenerateCharacters"),
            btnSaveCharacter: document.getElementById("btnSaveCharacter"),
            btnResetCharacterForm: document.getElementById("btnResetCharacterForm"),
            btnLoadDefaultPrompt: document.getElementById("btnLoadDefaultPrompt"),
            btnCopyPrompt: document.getElementById("btnCopyPrompt"),
            btnSavePromptTemplate: document.getElementById("btnSavePromptTemplate"),
            btnApplyPromptTemplate: document.getElementById("btnApplyPromptTemplate"),
            btnDeletePromptTemplate: document.getElementById("btnDeletePromptTemplate"),
            btnRefreshSystemEditors: document.getElementById("btnRefreshSystemEditors"),
            btnRebuildHistoricalState: document.getElementById("btnRebuildHistoricalState"),
            btnSaveSystemEditors: document.getElementById("btnSaveSystemEditors"),
            btnToggleLog: document.getElementById("btnToggleLog"),
            btnHideLog: document.getElementById("btnHideLog"),
            logDrawer: document.getElementById("logDrawer")
        };

        this.systemEditors = {
            outlineStoryState: document.getElementById("editorOutlineStoryState"),
            storyState: document.getElementById("editorStoryState"),
            nameLocker: document.getElementById("editorNameLocker"),
            foreshadowManager: document.getElementById("editorForeshadowManager"),
            secretMatrix: document.getElementById("editorSecretMatrix"),
            dynamicTracker: document.getElementById("editorDynamicTracker"),
            timelineTracker: document.getElementById("editorTimelineTracker"),
            chapterSnapshot: document.getElementById("editorChapterSnapshot"),
            foreshadowTracker: document.getElementById("editorForeshadowTracker"),
            personalityEnforcer: document.getElementById("editorPersonalityEnforcer"),
            characterChecker: document.getElementById("editorCharacterChecker"),
            appearanceTracker: document.getElementById("editorAppearanceTracker"),
            dialogueTracker: document.getElementById("editorDialogueTracker"),
            worldTracker: document.getElementById("editorWorldTracker"),
            worldStateManager: document.getElementById("editorWorldStateManager"),
            supportingCharacters: document.getElementById("editorSupportingCharacters"),
            legacyForeshadows: document.getElementById("editorLegacyForeshadows"),
            chapterRhythms: document.getElementById("editorChapterRhythms"),
            chapterEmotions: document.getElementById("editorChapterEmotions"),
            stateSnapshots: document.getElementById("editorStateSnapshots"),
            synopsisData: document.getElementById("editorSynopsisData")
        };
    }

    init() {
        this.ensureBaseData();
        this.rehydrateDerivedChapterArtifacts();
        const startupCleanup = this.cleanupOrphanedCharacterArtifacts({ reason: "startup" });
        if (startupCleanup.changed) {
            this.persist(true);
            Utils.log(
                `已按剩余章节清理历史残留角色 ${startupCleanup.removedCount} 个${startupCleanup.removedNames.length ? `：${startupCleanup.removedNames.slice(0, 8).join("、")}` : ""}。`,
                "info"
            );
        }
        this.renderAppVersion();
        this.applyStoredGenreExtensions();
        this.populateGenreOptions();
        this.loadSettingsToForm();
        this.ensurePromptAiFilterInputs();
        this.ensureChapterClearButton();
        this.syncFormFromData();
        this.bindEvents();
        this.renderAll();
        this.applyLogDrawerState();
        this.registerServiceWorker();
        this.loadBundledPrompts();
        Utils.log("Web 版已完成初始化。", "success");
    }

    renderAppVersion() {
        if (!this.elements.appVersionChip) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const urlVersion = params.get("v");
        const buildVersion = "2026.04.06-e";
        const label = urlVersion ? `版本 ${urlVersion}` : `版本 ${buildVersion}`;

        this.elements.appVersionChip.textContent = label;
        this.elements.appVersionChip.title = urlVersion
            ? `当前打开的是带版本参数的页面：${urlVersion}`
            : `当前内置版本：${buildVersion}`;
    }

    ensurePromptAiFilterInputs() {
        if (this.elements.aiFilterWhitelistInput && this.elements.aiFilterBlacklistInput) {
            return;
        }
        if (!this.elements.currentPromptTemplateInput) {
            return;
        }

        const promptField = this.elements.currentPromptTemplateInput.closest(".field");
        if (!promptField) {
            return;
        }

        promptField.insertAdjacentHTML("afterend", `
            <div class="form-grid two-column">
                <label class="field">
                    <span>AI去味白名单</span>
                    <textarea class="input textarea" id="aiFilterWhitelistInput" rows="5" placeholder="每行一个。命中这些短语时，去味器尽量不改。"></textarea>
                </label>
                <label class="field">
                    <span>AI去味黑名单</span>
                    <textarea class="input textarea" id="aiFilterBlacklistInput" rows="5" placeholder="每行一个。命中这些短语时，去味器优先重写。"></textarea>
                </label>
            </div>
        `);

        this.elements.aiFilterWhitelistInput = document.getElementById("aiFilterWhitelistInput");
        this.elements.aiFilterBlacklistInput = document.getElementById("aiFilterBlacklistInput");
    }

    ensureChapterClearButton() {
        if (this.elements.btnClearChapterContent) {
            return;
        }
        if (!this.elements.btnDeleteChapter) {
            return;
        }

        this.elements.btnDeleteChapter.insertAdjacentHTML(
            "beforebegin",
            '<button class="btn btn-ghost" id="btnClearChapterContent" type="button">清空正文</button>'
        );
        this.elements.btnClearChapterContent = document.getElementById("btnClearChapterContent");
    }

    ensureBaseData() {
        if (!Array.isArray(this.novelData.outline.volumes)) {
            this.novelData.outline.volumes = [];
        }
        if (!Array.isArray(this.novelData.outline.characters)) {
            this.novelData.outline.characters = [];
        }
        if (!this.novelData.idea_lab || typeof this.novelData.idea_lab !== "object") {
            this.novelData.idea_lab = JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.idea_lab));
        }
        this.novelData.idea_lab.keyword = this.novelData.idea_lab.keyword || "";
        this.novelData.idea_lab.extra_note = this.novelData.idea_lab.extra_note || "";
        this.novelData.idea_lab.version_count = Math.min(5, Math.max(3, Number(this.novelData.idea_lab.version_count || 4) || 4));
        this.novelData.idea_lab.use_market_trends = this.novelData.idea_lab.use_market_trends === true;
        this.novelData.idea_lab.market_summary = this.novelData.idea_lab.market_summary || "";
        this.novelData.idea_lab.market_items = Array.isArray(this.novelData.idea_lab.market_items) ? this.novelData.idea_lab.market_items : [];
        this.novelData.idea_lab.market_diagnostics = this.novelData.idea_lab.market_diagnostics && typeof this.novelData.idea_lab.market_diagnostics === "object"
            ? this.novelData.idea_lab.market_diagnostics
            : {};
        this.novelData.idea_lab.market_selected_categories = Array.isArray(this.novelData.idea_lab.market_selected_categories)
            ? this.novelData.idea_lab.market_selected_categories
            : [];
        this.novelData.idea_lab.market_source_breakdown = this.novelData.idea_lab.market_source_breakdown && typeof this.novelData.idea_lab.market_source_breakdown === "object"
            ? this.novelData.idea_lab.market_source_breakdown
            : {};
        this.novelData.idea_lab.market_status = this.novelData.idea_lab.market_status || "";
        this.novelData.idea_lab.market_error = this.novelData.idea_lab.market_error || "";
        this.novelData.idea_lab.selected_id = this.novelData.idea_lab.selected_id || "";
        this.novelData.idea_lab.results = Array.isArray(this.novelData.idea_lab.results) ? this.novelData.idea_lab.results : [];
        if (!this.novelData.prompt_state) {
            this.novelData.prompt_state = JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.prompt_state));
        }
        this.novelData.prompt_state.ai_filter_enabled = this.novelData.prompt_state.ai_filter_enabled !== false;
        this.novelData.prompt_state.ai_filter_whitelist = Array.isArray(this.novelData.prompt_state.ai_filter_whitelist)
            ? this.novelData.prompt_state.ai_filter_whitelist
            : [];
        this.novelData.prompt_state.ai_filter_blacklist = Array.isArray(this.novelData.prompt_state.ai_filter_blacklist)
            ? this.novelData.prompt_state.ai_filter_blacklist
            : [];
        if (!this.novelData.genre_extensions || typeof this.novelData.genre_extensions !== "object") {
            this.novelData.genre_extensions = {};
        }
        if (!Array.isArray(this.novelData.foreshadows)) {
            this.novelData.foreshadows = [];
        }
        if (!this.novelData.chapter_rhythms || typeof this.novelData.chapter_rhythms !== "object") {
            this.novelData.chapter_rhythms = {};
        }
        if (!this.novelData.chapter_emotions || typeof this.novelData.chapter_emotions !== "object") {
            this.novelData.chapter_emotions = {};
        }
        if (!this.novelData.chapter_analysis_reports || typeof this.novelData.chapter_analysis_reports !== "object") {
            this.novelData.chapter_analysis_reports = {};
        }
        if (!this.novelData.chapter_qc_reports || typeof this.novelData.chapter_qc_reports !== "object") {
            this.novelData.chapter_qc_reports = {};
        }
        if (!this.novelData.supporting_characters || typeof this.novelData.supporting_characters !== "object") {
            this.novelData.supporting_characters = {};
        }
        if (!this.novelData.extra_character_records || typeof this.novelData.extra_character_records !== "object") {
            this.novelData.extra_character_records = {};
        }
        if (!Array.isArray(this.novelData.used_extras_characters)) {
            this.novelData.used_extras_characters = [];
        }
        if (!Object.keys(this.novelData.extra_character_records).length) {
            this.novelData.used_extras_characters = [];
        } else {
            this.novelData.extra_character_records = this.sanitizeHistoricalExtraCharacterRecords(
                this.novelData.extra_character_records
            );
            this.rebuildUsedExtraCharacters();
        }
        this.ensureWorldStateManager();
        if (!this.novelData.genre_progress_tracker || typeof this.novelData.genre_progress_tracker !== "object") {
            this.novelData.genre_progress_tracker = {
                current_genre: "",
                current_subgenre: "",
                pregnancy_progress: {},
                rank_progress: {},
                status_progress: {},
                progress_events: []
            };
        }
        this.novelData.genre_progress_tracker.pregnancy_progress = this.novelData.genre_progress_tracker.pregnancy_progress && typeof this.novelData.genre_progress_tracker.pregnancy_progress === "object"
            ? this.novelData.genre_progress_tracker.pregnancy_progress
            : {};
        this.novelData.genre_progress_tracker.rank_progress = this.novelData.genre_progress_tracker.rank_progress && typeof this.novelData.genre_progress_tracker.rank_progress === "object"
            ? this.novelData.genre_progress_tracker.rank_progress
            : {};
        this.novelData.genre_progress_tracker.status_progress = this.novelData.genre_progress_tracker.status_progress && typeof this.novelData.genre_progress_tracker.status_progress === "object"
            ? this.novelData.genre_progress_tracker.status_progress
            : {};
        this.novelData.genre_progress_tracker.progress_events = Array.isArray(this.novelData.genre_progress_tracker.progress_events)
            ? this.novelData.genre_progress_tracker.progress_events
            : [];
        if (!this.novelData.outline_plot_unit_manager || typeof this.novelData.outline_plot_unit_manager !== "object") {
            this.novelData.outline_plot_unit_manager = { plot_units: {}, next_id: 1, unit_history: [] };
        }
        this.novelData.outline_plot_unit_manager.plot_units = this.novelData.outline_plot_unit_manager.plot_units && typeof this.novelData.outline_plot_unit_manager.plot_units === "object"
            ? this.novelData.outline_plot_unit_manager.plot_units
            : {};
        this.novelData.outline_plot_unit_manager.unit_history = Array.isArray(this.novelData.outline_plot_unit_manager.unit_history)
            ? this.novelData.outline_plot_unit_manager.unit_history
            : [];
        this.novelData.outline_plot_unit_manager.next_id = Number(this.novelData.outline_plot_unit_manager.next_id || 1);
        this.ensureVolumeCount(Number(this.novelData.synopsisData.volumeCount || 5), false);
        this.rebuildPlotUnitManager(false);
        this.syncWorldStateManager();
    }

    bindEvents() {
        this.elements.menuToggle.addEventListener("click", () => this.toggleSidebar(true));
        this.elements.sidebarBackdrop.addEventListener("click", () => this.toggleSidebar(false));

        this.elements.navItems.forEach((item) => {
            item.addEventListener("click", () => this.switchTab(item.dataset.tab));
        });

        this.elements.jumpButtons.forEach((button) => {
            button.addEventListener("click", () => this.switchTab(button.dataset.jumpTab));
        });

        this.elements.chapterSubviewButtons.forEach((button) => {
            button.addEventListener("click", () => this.switchChapterSubview(button.dataset.chapterSubview));
        });

        this.bindProjectField("projectTitle", ["outline", "title"]);
        this.bindProjectField("projectTheme", ["outline", "theme"]);
        this.bindProjectField("projectConcept", ["outline", "storyConcept"]);
        this.bindProjectField("ideaKeywordInput", ["idea_lab", "keyword"]);
        this.bindProjectField("ideaExtraNoteInput", ["idea_lab", "extra_note"]);
        this.bindProjectField("worldbuildingText", ["outline", "worldbuilding"]);
        this.bindProjectField("volumeSynopsisText", ["synopsisData", "volumeSynopsis"]);
        this.bindProjectField("synopsisOutput", ["synopsisData", "synopsisOutput"]);
        this.bindProjectField("detailedOutlineInput", ["outline", "detailed_outline"]);
        this.bindProjectField("globalSettingNoteInput", ["global_setting_note"]);
        this.bindProjectField("currentPromptTemplateInput", ["prompt_state", "current_prompt"]);

        this.elements.projectGenre.addEventListener("change", () => {
            this.novelData.outline.genre = this.elements.projectGenre.value;
            this.populateSubgenreOptions(this.elements.projectGenre.value);
            this.novelData.outline.subgenre = this.elements.projectSubgenre.value;
            this.renderGenreGuide();
            this.persist(true);
            this.renderDashboard();
        });

        this.elements.projectSubgenre.addEventListener("change", () => {
            this.novelData.outline.subgenre = this.elements.projectSubgenre.value;
            this.renderGenreGuide();
            this.persist(true);
            this.renderDashboard();
        });
        if (this.elements.ideaVersionCount) {
            this.elements.ideaVersionCount.addEventListener("change", () => {
                this.novelData.idea_lab.version_count = Math.min(5, Math.max(3, Number(this.elements.ideaVersionCount.value || 4) || 4));
                this.persist(true);
            });
        }
        if (this.elements.ideaUseMarketTrends) {
            this.elements.ideaUseMarketTrends.addEventListener("change", () => {
                this.novelData.idea_lab.use_market_trends = this.elements.ideaUseMarketTrends.checked;
                this.persist(true);
                this.renderIdeaLabResults();
            });
        }
        this.elements.btnAutoDetectGenre.addEventListener("click", () => this.safeAsync(() => this.autoDetectGenre()));

        this.elements.projectVolumeCount.addEventListener("change", () => {
            const count = Number(this.elements.projectVolumeCount.value || 1);
            const currentCount = this.novelData.outline.volumes.length;
            if (count < currentCount) {
                const ok = window.confirm(`卷数将从 ${currentCount} 缩减到 ${count}，后面的卷和章节会被删除，确定继续吗？`);
                if (!ok) {
                    this.elements.projectVolumeCount.value = String(currentCount);
                    return;
                }
                this.novelData.outline.volumes = this.novelData.outline.volumes.slice(0, Math.max(1, count));
                this.state.selectedChapterId = null;
                this.clearChapterEditor();
            }
            this.novelData.synopsisData.volumeCount = Math.max(1, count);
            this.ensureVolumeCount(count, true);
            this.renderAll();
            this.persist(true);
        });

        this.elements.projectChaptersPerVolume.addEventListener("change", () => {
            this.novelData.synopsisData.chaptersPerVolume = Number(this.elements.projectChaptersPerVolume.value || 20);
            this.persist(true);
        });

        this.elements.synopsisCurrentVolume.addEventListener("change", () => {
            this.novelData.synopsisData.currentVolume = Number(this.elements.synopsisCurrentVolume.value || 1);
            this.persist(true);
        });

        if (this.elements.chapterVolumeSelect) {
            this.elements.chapterVolumeSelect.addEventListener("change", () => {
                if (this.elements.chapterEditorVolumeSelect) {
                    this.elements.chapterEditorVolumeSelect.value = this.elements.chapterVolumeSelect.value;
                }
                this.state.selectedChapterId = null;
                this.renderChapterList();
                this.clearChapterEditor();
            });
        }
        if (this.elements.chapterEditorVolumeSelect) {
            this.elements.chapterEditorVolumeSelect.addEventListener("change", () => {
                if (this.elements.chapterVolumeSelect) {
                    this.elements.chapterVolumeSelect.value = this.elements.chapterEditorVolumeSelect.value;
                }
                this.state.selectedChapterId = null;
                this.renderChapterList();
                this.clearChapterEditor();
            });
        }
        if (this.elements.chapterQuickSelect) {
            this.elements.chapterQuickSelect.addEventListener("change", () => {
                const chapterId = String(this.elements.chapterQuickSelect.value || "").trim();
                if (chapterId) {
                    this.selectChapter(chapterId);
                }
            });
        }

        if (this.elements.chapterStart) {
            this.elements.chapterStart.addEventListener("input", () => this.renderChapterBatchPreview());
        }
        if (this.elements.chapterEnd) {
            this.elements.chapterEnd.addEventListener("input", () => this.renderChapterBatchPreview());
        }

        this.elements.promptFrequencySelect.addEventListener("change", () => {
            this.novelData.prompt_state.chapter_frequency = this.elements.promptFrequencySelect.value;
            this.persist(true);
        });
        if (this.elements.chapterAiFilterEnabled) {
            this.elements.chapterAiFilterEnabled.addEventListener("change", () => {
                this.novelData.prompt_state.ai_filter_enabled = this.elements.chapterAiFilterEnabled.checked;
                this.persist(true);
                Utils.showMessage(this.elements.chapterAiFilterEnabled.checked ? "已开启 AI 去味。" : "已关闭 AI 去味。", "success");
            });
        }

        if (this.elements.aiFilterWhitelistInput) {
            this.elements.aiFilterWhitelistInput.addEventListener("change", () => {
                this.novelData.prompt_state.ai_filter_whitelist = this.parseAiFilterLines(this.elements.aiFilterWhitelistInput.value);
                this.persist(true);
            });
        }
        if (this.elements.aiFilterBlacklistInput) {
            this.elements.aiFilterBlacklistInput.addEventListener("change", () => {
                this.novelData.prompt_state.ai_filter_blacklist = this.parseAiFilterLines(this.elements.aiFilterBlacklistInput.value);
                this.persist(true);
            });
        }

        this.elements.outlineVolumeList.addEventListener("input", (event) => this.handleVolumeInput(event));
        this.elements.outlineVolumeList.addEventListener("click", (event) => this.handleVolumeActions(event));
        if (this.elements.chapterBatchList) {
            this.elements.chapterBatchList.addEventListener("click", (event) => this.handleChapterBatchListClick(event));
        }
        if (this.elements.chapterList) {
            this.elements.chapterList.addEventListener("click", (event) => this.handleChapterListClick(event));
        }
        this.elements.characterList.addEventListener("click", (event) => this.handleCharacterListClick(event));
        this.elements.characterList.addEventListener("change", (event) => this.handleCharacterListChange(event));
        if (this.elements.btnSelectAllCharacters) {
            this.elements.btnSelectAllCharacters.addEventListener("click", () => this.selectAllCharacters());
        }
        if (this.elements.btnClearCharacterSelection) {
            this.elements.btnClearCharacterSelection.addEventListener("click", () => this.clearCharacterSelection());
        }
        if (this.elements.btnDeleteSelectedCharacters) {
            this.elements.btnDeleteSelectedCharacters.addEventListener("click", () => this.deleteSelectedCharacters());
        }

        this.elements.btnOpenSettings.addEventListener("click", () => this.openSettingsModal());
        this.elements.btnCloseSettings.addEventListener("click", () => this.closeSettingsModal());
        this.elements.btnCancelSettings.addEventListener("click", () => this.closeSettingsModal());
        this.elements.settingsModal.addEventListener("click", (event) => {
            if (event.target === this.elements.settingsModal) {
                this.closeSettingsModal();
            }
        });

        this.elements.btnSaveSettings.addEventListener("click", () => this.saveSettings());
        this.elements.btnSaveData.addEventListener("click", () => this.persist(false));
        this.elements.btnExportTxt.addEventListener("click", () => this.exportChaptersTxt());
        this.elements.btnExportData.addEventListener("click", () => this.exportData());
        this.elements.btnImportData.addEventListener("click", () => this.elements.importFileInput.click());
        if (this.elements.btnClearProject) {
            this.elements.btnClearProject.addEventListener("click", () => this.clearCurrentProject());
        }
        this.elements.importFileInput.addEventListener("change", (event) => this.importData(event));

        if (this.elements.btnGenerateIdeaLab) {
            this.elements.btnGenerateIdeaLab.addEventListener("click", () => this.safeAsync(() => this.generateIdeaLab()));
        }
        if (this.elements.btnClearIdeaLab) {
            this.elements.btnClearIdeaLab.addEventListener("click", () => this.clearIdeaLab());
        }
        if (this.elements.btnApplySelectedIdea) {
            this.elements.btnApplySelectedIdea.addEventListener("click", () => this.applySelectedIdeaToConcept());
        }
        if (this.elements.btnCopySelectedIdea) {
            this.elements.btnCopySelectedIdea.addEventListener("click", () => this.copySelectedIdeaSummary());
        }
        if (this.elements.ideaResults) {
            this.elements.ideaResults.addEventListener("click", (event) => this.handleIdeaResultClick(event));
        }

        this.elements.btnGenerateWorldbuilding.addEventListener("click", () => this.safeAsync(() => this.generateWorldbuilding()));
        if (this.elements.btnClearWorldbuilding) {
            this.elements.btnClearWorldbuilding.addEventListener("click", () => this.clearWorldbuilding());
        }
        this.elements.btnGenerateVolumes.addEventListener("click", () => this.safeAsync(() => this.generateVolumeSynopsis()));
        if (this.elements.btnClearVolumeSynopsis) {
            this.elements.btnClearVolumeSynopsis.addEventListener("click", () => this.clearVolumeSynopsis());
        }
        this.elements.btnGenerateChapterSynopsis.addEventListener("click", () => this.safeAsync(() => this.generateCurrentVolumeSynopsis()));
        this.elements.btnGenerateAllSynopsis.addEventListener("click", () => this.safeAsync(() => this.generateAllVolumeSynopsis()));
        if (this.elements.btnClearCurrentSynopsis) {
            this.elements.btnClearCurrentSynopsis.addEventListener("click", () => this.clearCurrentVolumeSynopsis());
        }
        this.elements.btnImportSynopsisToOutline.addEventListener("click", () => this.importSynopsisToOutline());
        this.elements.btnCopySynopsis.addEventListener("click", () => Utils.copyText(this.elements.synopsisOutput.value));
        this.elements.btnAddVolume.addEventListener("click", () => this.addVolume());
        this.elements.btnClearVolumes.addEventListener("click", () => this.clearVolumes());

        this.elements.btnGenerateChapters.addEventListener("click", () => this.safeAsync(() => this.generateChapters()));
        if (this.elements.btnRegenerateChapters) {
            this.elements.btnRegenerateChapters.addEventListener("click", () => this.safeAsync(() => this.regenerateChapters()));
        }
        if (this.elements.btnDeleteOutlineRange) {
            this.elements.btnDeleteOutlineRange.addEventListener("click", () => this.deleteOutlineRange());
        }
        this.elements.btnContinueChapters.addEventListener("click", () => this.safeAsync(() => this.continueChapters()));
        this.elements.btnDetectGaps.addEventListener("click", () => this.detectGaps());
        this.elements.btnExpandChapterContent.addEventListener("click", () => this.safeAsync(() => this.expandCurrentChapter()));
        if (this.elements.btnExpandChapterContentInline) {
            this.elements.btnExpandChapterContentInline.addEventListener("click", () => this.safeAsync(() => this.expandCurrentChapter()));
        }
        this.elements.btnCopyChapterSummary.addEventListener("click", () => this.copyCurrentChapterSummary());
        this.elements.btnExportCurrentChapter.addEventListener("click", () => this.exportCurrentChapterTxt());
        if (this.elements.btnExportCurrentChapterInline) {
            this.elements.btnExportCurrentChapterInline.addEventListener("click", () => this.exportCurrentChapterTxt());
        }
        this.elements.btnManualAiFilter.addEventListener("click", () => this.safeAsync(() => this.manualFilterCurrentChapter()));
        this.elements.btnAnalyzeChapter.addEventListener("click", () => this.analyzeCurrentChapter());
        this.elements.btnRunChapterQc.addEventListener("click", () => this.runCurrentChapterQc());
        this.elements.btnRefreshChapterList.addEventListener("click", () => this.refreshChapterWorkspace());
        if (this.elements.btnToggleChapterList) {
            this.elements.btnToggleChapterList.addEventListener("click", () => this.toggleMobileChapterList());
        }
        if (this.elements.btnPrevChapter) {
            this.elements.btnPrevChapter.addEventListener("click", () => this.selectAdjacentChapter(-1));
        }
        if (this.elements.btnNextChapter) {
            this.elements.btnNextChapter.addEventListener("click", () => this.selectAdjacentChapter(1));
        }
        this.elements.btnBatchDeleteChapters.addEventListener("click", () => this.batchDeleteChapterRange());
        this.elements.btnCopyChapter.addEventListener("click", () => Utils.copyText(this.elements.chapterContentInput.value));
        if (this.elements.btnClearChapterContent) {
            this.elements.btnClearChapterContent.addEventListener("click", () => this.clearCurrentChapterContent());
        }
        this.elements.btnSaveChapter.addEventListener("click", () => this.saveChapterEditor());
        if (this.elements.btnSaveChapterInline) {
            this.elements.btnSaveChapterInline.addEventListener("click", () => this.saveChapterEditor());
        }
        this.elements.btnDeleteChapter.addEventListener("click", () => this.deleteCurrentChapter());

        this.elements.btnGenerateCharacters.addEventListener("click", () => this.safeAsync(() => this.generateCharactersFromOutlines()));
        this.elements.btnSaveCharacter.addEventListener("click", () => this.saveCharacter());
        this.elements.btnResetCharacterForm.addEventListener("click", () => this.resetCharacterForm());
        this.elements.btnLoadDefaultPrompt.addEventListener("click", () => this.loadDefaultPromptTemplate());
        this.elements.btnCopyPrompt.addEventListener("click", () => Utils.copyText(this.elements.currentPromptTemplateInput.value));
        this.elements.btnSavePromptTemplate.addEventListener("click", () => this.savePromptTemplate());
        this.elements.btnApplyPromptTemplate.addEventListener("click", () => this.applySelectedPromptTemplate());
        this.elements.btnDeletePromptTemplate.addEventListener("click", () => this.deletePromptTemplate());
        this.elements.btnRefreshSystemEditors.addEventListener("click", () => this.renderSystemEditors());
        if (this.elements.btnRebuildHistoricalState) {
            this.elements.btnRebuildHistoricalState.addEventListener("click", () => this.safeAsync(() => this.rebuildHistoricalStateFromChapters()));
        }
        this.elements.btnSaveSystemEditors.addEventListener("click", () => this.saveSystemEditors());

        this.elements.btnShowLog.addEventListener("click", () => this.toggleLogDrawerVisibility());
        this.elements.btnHideLog.addEventListener("click", () => this.setLogDrawerVisible(false));
        this.elements.btnToggleLog.addEventListener("click", () => this.toggleLogDrawerCollapsed());
    }

    safeAsync(task) {
        Promise.resolve()
            .then(() => task())
            .catch((error) => {
                if (error?.__handled) {
                    return;
                }
                const message = error?.message || "处理失败";
                Utils.showMessage(message, "error");
                Utils.log(message, "error");
            });
    }

    applyLogDrawerState() {
        this.setLogDrawerVisible(this.state.logVisible);
        this.elements.logDrawer.classList.toggle("collapsed", this.state.logCollapsed);
        this.elements.btnToggleLog.textContent = this.state.logCollapsed ? "展开" : "收起";
    }

    setLogDrawerVisible(visible) {
        this.state.logVisible = Boolean(visible);
        this.elements.logDrawer.classList.toggle("hidden", !this.state.logVisible);
        this.elements.btnShowLog.textContent = this.state.logVisible ? "隐藏日志" : "查看日志";
        window.localStorage.setItem("novel_outline_log_visible", this.state.logVisible ? "1" : "0");
    }

    toggleLogDrawerVisibility() {
        this.setLogDrawerVisible(!this.state.logVisible);
    }

    toggleLogDrawerCollapsed() {
        this.state.logCollapsed = !this.state.logCollapsed;
        this.elements.logDrawer.classList.toggle("collapsed", this.state.logCollapsed);
        this.elements.btnToggleLog.textContent = this.state.logCollapsed ? "展开" : "收起";
        window.localStorage.setItem("novel_outline_log_collapsed", this.state.logCollapsed ? "1" : "0");
    }

    bindProjectField(elementKey, path, afterUpdate) {
        const element = this.elements[elementKey];
        if (!element) {
            return;
        }

        element.addEventListener("input", () => {
            this.setByPath(this.novelData, path, element.value);
            if (afterUpdate) {
                afterUpdate(element.value);
            }
            this.autoSave();
            this.renderDashboard();
        });
    }

    populateGenreOptions() {
        const genreSelect = this.elements.projectGenre;
        genreSelect.innerHTML = '<option value="">请选择主类目</option>';
        Object.keys(NOVEL_GENRES).forEach((genre) => {
            const option = document.createElement("option");
            option.value = genre;
            option.textContent = genre;
            genreSelect.appendChild(option);
        });

        genreSelect.value = this.novelData.outline.genre || "";
        this.populateSubgenreOptions(this.novelData.outline.genre);
        this.renderGenreGuide();
    }

    populateSubgenreOptions(genre) {
        const subgenreSelect = this.elements.projectSubgenre;
        const options = NOVEL_GENRES[genre]?.subgenres || [];
        subgenreSelect.innerHTML = '<option value="">请选择子题材</option>';
        options.forEach((subgenre) => {
            const option = document.createElement("option");
            option.value = subgenre;
            option.textContent = subgenre;
            subgenreSelect.appendChild(option);
        });

        if (options.includes(this.novelData.outline.subgenre)) {
            subgenreSelect.value = this.novelData.outline.subgenre;
        } else {
            subgenreSelect.value = "";
        }
        this.renderGenreGuide();
    }

    renderGenreGuide() {
        const genre = this.elements.projectGenre.value || this.novelData.outline.genre || "";
        const subgenre = this.elements.projectSubgenre.value || this.novelData.outline.subgenre || "";
        const info = NOVEL_GENRES[genre];

        if (!info) {
            this.elements.genreGuideTitle.textContent = "题材约束说明";
            this.elements.genreGuideSubgenres.textContent = "请选择主类目";
            this.elements.genreGuideDescription.textContent = "这里会显示当前题材的题材说明、允许元素和禁止元素。该分类系统只参与世界观、卷纲、细纲生成，不参与后续大纲与正文生成。";
            this.elements.genreGuideAllowed.innerHTML = '<span class="tag muted">等待选择题材</span>';
            this.elements.genreGuideForbidden.innerHTML = '<span class="tag muted">等待选择题材</span>';
            return;
        }

        const subgenreCount = Array.isArray(info.subgenres) ? info.subgenres.length : 0;
        this.elements.genreGuideTitle.textContent = subgenre ? `${genre} / ${subgenre}` : genre;
        this.elements.genreGuideSubgenres.textContent = `子题材 ${subgenreCount} 个`;
        this.elements.genreGuideDescription.textContent = info.description || "当前题材未提供额外说明。";
        this.elements.genreGuideAllowed.innerHTML = (info.allowed || [])
            .map((item) => `<span class="tag">${Utils.escapeHTML(item)}</span>`)
            .join("") || '<span class="tag muted">未设置</span>';
        this.elements.genreGuideForbidden.innerHTML = (info.forbidden || [])
            .map((item) => `<span class="tag danger">${Utils.escapeHTML(item)}</span>`)
            .join("") || '<span class="tag muted">未设置</span>';
    }

    applyStoredGenreExtensions() {
        Object.entries(this.novelData.genre_extensions || {}).forEach(([genreName, extension]) => {
            this.applyGenreExtension(genreName, extension);
        });
    }

    applyGenreExtension(genreName, extension) {
        if (!genreName || !extension || typeof extension !== "object") {
            return;
        }

        const existing = NOVEL_GENRES[genreName] || {
            subgenres: [],
            description: "",
            allowed: [],
            forbidden: []
        };

        NOVEL_GENRES[genreName] = {
            subgenres: Array.from(new Set([...(existing.subgenres || []), ...(extension.subgenres || [])])),
            description: extension.description || existing.description || "",
            allowed: Array.from(new Set([...(existing.allowed || []), ...(extension.allowed || [])])),
            forbidden: Array.from(new Set([...(existing.forbidden || []), ...(extension.forbidden || [])]))
        };
    }

    storeGenreExtension(genreName, extension) {
        if (!genreName || !extension || typeof extension !== "object") {
            return;
        }

        const current = this.novelData.genre_extensions[genreName] || {
            subgenres: [],
            description: "",
            allowed: [],
            forbidden: []
        };

        this.novelData.genre_extensions[genreName] = {
            subgenres: Array.from(new Set([...(current.subgenres || []), ...(extension.subgenres || [])])),
            description: extension.description || current.description || "",
            allowed: Array.from(new Set([...(current.allowed || []), ...(extension.allowed || [])])),
            forbidden: Array.from(new Set([...(current.forbidden || []), ...(extension.forbidden || [])]))
        };
    }

    buildGenreCatalogSummary(limitSubgenres = 5) {
        return Object.entries(NOVEL_GENRES).map(([genreName, info]) => {
            const sample = (info.subgenres || []).slice(0, limitSubgenres).join("、");
            return `- ${genreName}: ${info.description || "暂无说明"}（子类示例：${sample || "无"}）`;
        }).join("\n");
    }

    async autoDetectGenre() {
        const title = this.elements.projectTitle.value.trim();
        const theme = this.elements.projectTheme.value.trim();
        const concept = this.elements.projectConcept.value.trim();
        const detailedOutline = this.elements.detailedOutlineInput?.value?.trim() || "";

        if (!title && !theme && !concept && !detailedOutline) {
            throw new Error("请至少填写标题、主题、故事概念或详细细纲，再进行题材识别。");
        }

        await this.runWithLoading("正在智能识别题材...", async () => {
            const systemPrompt = `你是一位资深网络小说编辑，精通小说题材分类。

【现有分类体系】
${this.buildGenreCatalogSummary()}

【任务要求】
1. 根据书名、主题、故事概念和细纲，判断最匹配的主要题材与子题材。
2. 优先匹配现有分类体系，不要随意发明新题材。
3. 只有当现有体系明显无法覆盖时，才允许新增主要题材。
4. 如果只是现有题材下的细分方向，请保留原主要题材，只新增子题材即可。
5. 输出必须是 JSON，不要输出 Markdown。

【输出格式】
{
  "primary_genre": "题材名称",
  "subgenre": "子题材名称",
  "is_new_genre": false,
  "confidence": 0.9,
  "reasoning": "分析理由",
  "new_genre_definition": {
    "description": "新题材描述",
    "subgenres": ["建议子题材1"],
    "allowed": ["允许元素1"],
    "forbidden": ["禁止元素1"]
  }
}`;

            const userPrompt = `请分析以下小说信息的题材分类：
书名：${title || "未填写"}
核心主题：${theme || "未填写"}
故事概念：${concept || "未填写"}
详细细纲摘录：
${(detailedOutline || concept || "未填写").slice(0, 2200)}`;

            const configuredMaxTokens = Number(this.api.getConfig?.().maxTokens ?? DEFAULT_API_CONFIG.maxTokens);

            const raw = await this.api.callLLM(userPrompt, systemPrompt, {
                temperature: 0.35,
                maxTokens: Math.min(
                    Number.isFinite(configuredMaxTokens) && configuredMaxTokens > 0 ? configuredMaxTokens : DEFAULT_API_CONFIG.maxTokens,
                    4000
                )
            });

            const result = Utils.parseJsonResponse(raw);
            if (!result || typeof result !== "object" || Array.isArray(result)) {
                throw new Error("AI 返回的题材识别结果无法解析。");
            }

            const primary = String(result.primary_genre || "").trim();
            const sub = String(result.subgenre || "").trim();
            const reasoning = String(result.reasoning || "").trim();
            const isNew = Boolean(result.is_new_genre);
            const newDef = result.new_genre_definition && typeof result.new_genre_definition === "object"
                ? result.new_genre_definition
                : {};

            if (!primary) {
                throw new Error("AI 没有返回有效的主要题材。");
            }

            if (isNew && !NOVEL_GENRES[primary]) {
                const extension = {
                    subgenres: newDef.subgenres || (sub ? [sub] : []),
                    description: newDef.description || "AI识别的新题材",
                    allowed: newDef.allowed || [],
                    forbidden: newDef.forbidden || []
                };
                this.applyGenreExtension(primary, extension);
                this.storeGenreExtension(primary, extension);
                Utils.log(`已根据 AI 建议扩展分类系统：新增题材【${primary}】`, "success");
            } else if (sub) {
                const existingInfo = NOVEL_GENRES[primary] || {
                    subgenres: [],
                    description: "",
                    allowed: [],
                    forbidden: []
                };
                if (!existingInfo.subgenres.includes(sub)) {
                    const extension = {
                        subgenres: [sub],
                        description: existingInfo.description || "",
                        allowed: [],
                        forbidden: []
                    };
                    this.applyGenreExtension(primary, extension);
                    this.storeGenreExtension(primary, extension);
                    Utils.log(`已根据 AI 建议扩展分类系统：在【${primary}】下新增子题材【${sub}】`, "success");
                }
            }

            if (!NOVEL_GENRES[primary]) {
                throw new Error(`AI 返回了未知题材“${primary}”，但没有附带完整定义。`);
            }

            this.novelData.outline.genre = primary;
            this.novelData.genre = primary;
            this.populateGenreOptions();
            this.elements.projectGenre.value = primary;
            this.populateSubgenreOptions(primary);

            const availableSubgenres = NOVEL_GENRES[primary]?.subgenres || [];
            const finalSubgenre = sub && availableSubgenres.includes(sub)
                ? sub
                : (availableSubgenres[0] || "");

            this.elements.projectSubgenre.value = finalSubgenre;
            this.novelData.outline.subgenre = finalSubgenre;
            this.novelData.subgenre = finalSubgenre;
            this.renderGenreGuide();
            this.persist(true);
            this.renderDashboard();

            Utils.showMessage(`题材识别完成：${primary}${finalSubgenre ? ` / ${finalSubgenre}` : ""}`, "success");
            Utils.log(`智能识别完成：${primary}${finalSubgenre ? ` / ${finalSubgenre}` : ""}${reasoning ? `；${reasoning}` : ""}`, "success");
        });
    }

    parseAiFilterLines(text) {
        return String(text || "")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }

    syncFormFromData() {
        const outline = this.novelData.outline;
        const synopsis = this.novelData.synopsisData || this.novelData.synopsis_data || {};
        const outlineVolumeCount = Array.isArray(outline.volumes) ? outline.volumes.length : 0;
        const preferredVolumeCount = outlineVolumeCount > 0
            ? outlineVolumeCount
            : Math.max(1, Number(synopsis.volumeCount || synopsis.vol_count || 5) || 5);

        this.elements.projectTitle.value = outline.title || "";
        this.elements.projectTheme.value = outline.theme || "";
        this.elements.projectGenre.value = outline.genre || this.novelData.genre || "";
        this.populateSubgenreOptions(outline.genre || this.novelData.genre || "");
        this.elements.projectSubgenre.value = outline.subgenre || this.novelData.subgenre || "";
        this.renderGenreGuide();
        this.elements.projectVolumeCount.value = String(preferredVolumeCount);
        this.elements.projectChaptersPerVolume.value = synopsis.chaptersPerVolume || synopsis.chap_count || 20;
        this.elements.projectConcept.value = outline.storyConcept || synopsis.story_concept || "";
        if (this.elements.ideaKeywordInput) {
            this.elements.ideaKeywordInput.value = this.novelData.idea_lab?.keyword || "";
        }
        if (this.elements.ideaVersionCount) {
            this.elements.ideaVersionCount.value = String(this.novelData.idea_lab?.version_count || 4);
        }
        if (this.elements.ideaUseMarketTrends) {
            this.elements.ideaUseMarketTrends.checked = this.novelData.idea_lab?.use_market_trends === true;
        }
        if (this.elements.ideaExtraNoteInput) {
            this.elements.ideaExtraNoteInput.value = this.novelData.idea_lab?.extra_note || "";
        }
        this.elements.worldbuildingText.value = outline.worldbuilding || synopsis.worldbuilding || "";
        this.elements.volumeSynopsisText.value = synopsis.volumeSynopsis || synopsis.volume_synopsis || "";
        this.elements.synopsisOutput.value = synopsis.synopsisOutput || synopsis.synopsis_output || "";
        this.elements.detailedOutlineInput.value = outline.detailed_outline || "";
        this.elements.globalSettingNoteInput.value = this.novelData.global_setting_note || "";
        if (!this.novelData.prompt_state.current_prompt) {
            this.novelData.prompt_state.current_prompt = this.getDesktopAlignedPromptTemplate();
        }
        this.elements.currentPromptTemplateInput.value = this.novelData.prompt_state.current_prompt || "";
        this.elements.promptFrequencySelect.value = this.novelData.prompt_state.chapter_frequency || "male";
        if (this.elements.chapterAiFilterEnabled) {
            this.elements.chapterAiFilterEnabled.checked = this.novelData.prompt_state.ai_filter_enabled !== false;
        }
        if (this.elements.aiFilterWhitelistInput) {
            this.elements.aiFilterWhitelistInput.value = (this.novelData.prompt_state.ai_filter_whitelist || []).join("\n");
        }
        if (this.elements.aiFilterBlacklistInput) {
            this.elements.aiFilterBlacklistInput.value = (this.novelData.prompt_state.ai_filter_blacklist || []).join("\n");
        }
        this.renderPromptLibrary();
        this.renderIdeaLabResults();
    }

    loadSettingsToForm() {
        const settings = this.api.getConfig();
        this.elements.settingProvider.value = settings.provider || DEFAULT_API_CONFIG.provider;
        this.elements.settingModel.value = settings.model || DEFAULT_API_CONFIG.model;
        this.elements.settingApiBase.value = settings.apiBase || DEFAULT_API_CONFIG.apiBase;
        if (this.elements.settingRankApiUrl) {
            this.elements.settingRankApiUrl.value = settings.rankApiUrl || DEFAULT_API_CONFIG.rankApiUrl;
        }
        if (this.elements.settingRankTimeoutSeconds) {
            this.elements.settingRankTimeoutSeconds.value = Math.max(
                15,
                Math.round(Number(settings.rankApiTimeoutMs ?? DEFAULT_API_CONFIG.rankApiTimeoutMs) / 1000)
            );
        }
        if (this.elements.settingRankRetryCount) {
            this.elements.settingRankRetryCount.value = settings.rankApiRetryCount ?? DEFAULT_API_CONFIG.rankApiRetryCount;
        }
        this.elements.settingApiKey.value = settings.apiKey || "";
        this.elements.settingTemperature.value = settings.temperature ?? DEFAULT_API_CONFIG.temperature;
        this.elements.settingMaxTokens.value = settings.maxTokens ?? DEFAULT_API_CONFIG.maxTokens;
        this.elements.settingTimeoutSeconds.value = Math.max(
            30,
            Math.round(Number(settings.timeoutMs ?? DEFAULT_API_CONFIG.timeoutMs) / 1000)
        );
        this.elements.settingRetryCount.value = settings.retryCount ?? DEFAULT_API_CONFIG.retryCount;
    }

    renderAll() {
        this.renderDashboard();
        this.renderWorkflowHealthDashboard();
        this.renderIdeaLabResults();
        this.renderVolumeSelectors();
        this.renderVolumeCards();
        this.renderChapterList();
        this.renderChapterBatchPreview();
        this.switchChapterSubview(this.state.activeChapterSubview, true);
        this.renderCharacterList();
        this.renderAdvancedState();
    }

    renderWorkflowHealthDashboard() {
        const diagnostics = this.buildWorkflowDiagnostics();
        const volumes = diagnostics.volumes;
        const chapters = diagnostics.chapters;

        if (this.elements.statTitle) {
            this.elements.statTitle.textContent = this.novelData.outline.title || "未命名";
        }
        if (this.elements.statVolumes) {
            this.elements.statVolumes.textContent = String(volumes.length);
        }
        if (this.elements.statChapters) {
            this.elements.statChapters.textContent = String(chapters.length);
        }
        if (this.elements.statCharacters) {
            this.elements.statCharacters.textContent = String(this.novelData.outline.characters.length);
        }
        if (this.elements.summaryGenre) {
            this.elements.summaryGenre.textContent = this.novelData.outline.subgenre || this.novelData.outline.genre || "未设置";
        }
        if (this.elements.summaryTheme) {
            this.elements.summaryTheme.textContent = this.novelData.outline.theme || "未设置";
        }
        if (this.elements.summaryConcept) {
            this.elements.summaryConcept.textContent = this.novelData.outline.storyConcept || "还没有填写故事概念。";
        }
        if (!this.elements.dashboardMilestones) {
            return;
        }

        const milestones = [
            {
                title: `${diagnostics.checks.base ? "已完成" : "待完善"} 基础设定`,
                text: diagnostics.checks.base
                    ? "标题、题材和故事概念都已经就位，可以继续推进世界观和卷纲。"
                    : "先补齐标题、题材和故事概念，后面的生成会稳很多。"
            },
            {
                title: `${diagnostics.checks.worldbuilding ? "已完成" : "待完成"} 世界观`,
                text: diagnostics.checks.worldbuilding
                    ? "世界观文本已经存在，后面的卷纲、细纲和正文都会引用这层约束。"
                    : "建议先生成或填写世界观，再继续往下推。"
            },
            {
                title: `${diagnostics.volumeSummaryCount}/${Math.max(1, volumes.length)} 卷纲`,
                text: diagnostics.volumeSummaryCount
                    ? `当前已有 ${diagnostics.volumeSummaryCount} 卷带摘要，卷级骨架已经开始成形。`
                    : "还没有卷纲摘要，可以先生成卷纲。"
            },
            {
                title: `${diagnostics.chapterSynopsisCount}/${Math.max(1, volumes.length)} 细纲`,
                text: diagnostics.chapterSynopsisCount
                    ? `当前已有 ${diagnostics.chapterSynopsisCount} 卷细纲，后续章纲会自动吃进这些前情。`
                    : "细纲区域还是空的，建议先把每卷细纲逐卷补齐。"
            },
            {
                title: `${diagnostics.chapterOutlineCount} 章纲 / ${diagnostics.chapterContentCount} 正文`,
                text: diagnostics.chapterOutlineCount
                    ? `目前已有 ${diagnostics.chapterOutlineCount} 章章纲，其中 ${diagnostics.chapterContentCount} 章已经扩写成正文。`
                    : "还没有章纲，可以进入大纲生成页开始批量生成。"
            },
            {
                title: `${diagnostics.characterCount} 张人物卡`,
                text: diagnostics.characterCount
                    ? "人物卡已参与后续章纲和正文的一致性约束。"
                    : "人物卡还是空的，建议在章纲生成后继续补齐。"
            },
            {
                title: `流程体检 ${diagnostics.completedCount}/${diagnostics.totalCount}`,
                text: diagnostics.nextAction
            }
        ];

        this.elements.dashboardMilestones.innerHTML = milestones.map((item) => `
            <article class="milestone-item">
                <strong>${Utils.escapeHTML(item.title)}</strong>
                <p>${Utils.escapeHTML(item.text)}</p>
            </article>
        `).join("");
    }

    renderDashboard() {
        const volumes = this.novelData.outline.volumes || [];
        const chapters = volumes.flatMap((volume) => volume.chapters || []);
        const title = this.novelData.outline.title || "未命名";
        const genre = this.novelData.outline.subgenre || this.novelData.outline.genre || "未设置";
        const concept = this.novelData.outline.storyConcept || "还没有填写故事概念。";
        const milestones = [
            {
                title: "基础设定",
                text: this.novelData.outline.storyConcept
                    ? "故事概念已经写入，可以继续生成世界观和卷纲。"
                    : "先在细纲生成页写下标题、题材和故事概念。"
            },
            {
                title: "卷纲进度",
                text: volumes.some((volume) => volume.summary)
                    ? `当前已有 ${volumes.filter((volume) => volume.summary).length} 卷带摘要。`
                    : "还没有卷纲摘要，可以先点“生成卷纲”。"
            },
            {
                title: "章节进度",
                text: chapters.length > 0
                    ? `当前累计 ${chapters.length} 章，适合继续扩写或补空缺。`
                    : "章节区还是空的，可以先批量生成章纲。"
            }
        ];

        this.elements.statTitle.textContent = title;
        this.elements.statVolumes.textContent = String(volumes.length);
        this.elements.statChapters.textContent = String(chapters.length);
        this.elements.statCharacters.textContent = String(this.novelData.outline.characters.length);
        this.elements.summaryGenre.textContent = genre;
        this.elements.summaryTheme.textContent = this.novelData.outline.theme || "未设置";
        this.elements.summaryConcept.textContent = concept;

        this.elements.dashboardMilestones.innerHTML = milestones.map((item) => `
            <article class="milestone-item">
                <strong>${Utils.escapeHTML(item.title)}</strong>
                <p>${Utils.escapeHTML(item.text)}</p>
            </article>
        `).join("");
    }

    renderVolumeSelectors() {
        const volumes = this.novelData.outline.volumes || [];
        const currentSynopsisValue = String(this.novelData.synopsisData.currentVolume || 1);
        const currentChapterValue = String(this.elements.chapterVolumeSelect.value || 1);
        const currentEditorChapterValue = String(this.elements.chapterEditorVolumeSelect?.value || currentChapterValue);

        const optionsHTML = volumes.map((volume, index) => `
            <option value="${index + 1}">第${index + 1}卷${volume.title ? ` · ${Utils.escapeHTML(volume.title)}` : ""}</option>
        `).join("");

        this.elements.synopsisCurrentVolume.innerHTML = optionsHTML;
        this.elements.chapterVolumeSelect.innerHTML = optionsHTML;
        if (this.elements.chapterEditorVolumeSelect) {
            this.elements.chapterEditorVolumeSelect.innerHTML = optionsHTML;
        }

        this.elements.synopsisCurrentVolume.value = volumes[currentSynopsisValue - 1] ? currentSynopsisValue : "1";
        this.elements.chapterVolumeSelect.value = volumes[currentChapterValue - 1] ? currentChapterValue : "1";
        if (this.elements.chapterEditorVolumeSelect) {
            this.elements.chapterEditorVolumeSelect.value = volumes[currentEditorChapterValue - 1]
                ? currentEditorChapterValue
                : this.elements.chapterVolumeSelect.value;
        }
        this.renderChapterBatchPreview();
    }

    renderVolumeCards() {
        const volumes = this.novelData.outline.volumes || [];
        if (volumes.length === 0) {
            this.elements.outlineVolumeList.innerHTML = '<div class="empty-state">还没有卷结构，先在“细纲生成”里生成卷纲，或者手动新增一卷。</div>';
            return;
        }

        this.elements.outlineVolumeList.innerHTML = volumes.map((volume, index) => `
            <article class="volume-card" data-volume-index="${index}">
                <div class="volume-card-head">
                    <div>
                        <h4>第${index + 1}卷</h4>
                        <p class="volume-card-meta">已保存章节：${volume.chapters.length} 章</p>
                    </div>
                    <div class="volume-card-actions">
                        <button class="btn btn-ghost btn-small" data-volume-action="clear-synopsis">清空细纲</button>
                        <button class="btn btn-ghost btn-small" data-volume-action="focus">去看章节</button>
                        <button class="btn btn-danger btn-small" data-volume-action="remove">删除此卷</button>
                    </div>
                </div>
                <div class="form-grid">
                    <label class="field">
                        <span>卷名</span>
                        <input class="input" data-volume-field="title" type="text" value="${Utils.escapeHTML(volume.title)}">
                    </label>
                    <label class="field">
                        <span>卷尾钩子</span>
                        <input class="input" data-volume-field="cliffhanger" type="text" value="${Utils.escapeHTML(volume.cliffhanger || "")}">
                    </label>
                    <label class="field field-full">
                        <span>卷摘要</span>
                        <textarea class="input textarea" data-volume-field="summary" rows="6">${Utils.escapeHTML(volume.summary || "")}</textarea>
                    </label>
                    <label class="field field-full">
                        <span>章节细纲</span>
                        <textarea class="input textarea" data-volume-field="chapterSynopsis" rows="8">${Utils.escapeHTML(volume.chapterSynopsis || "")}</textarea>
                    </label>
                </div>
            </article>
        `).join("");
    }

    renderChapterList() {
        const volume = this.getCurrentChapterVolume();
        if (!this.elements.chapterBatchList && !this.elements.chapterList) {
            return;
        }
        const orderedChapters = [...(volume?.chapters || [])].sort(Utils.chapterSort);
        this.renderChapterQuickSelect(orderedChapters);
        if (!volume || volume.chapters.length === 0) {
            const emptyHTML = '<div class="empty-state">当前卷还没有章节。可以先在“批量章纲”里生成章纲，再切到“单章正文”逐章扩写。</div>';
            if (this.elements.chapterBatchList) {
                this.elements.chapterBatchList.innerHTML = emptyHTML;
            }
            if (this.elements.chapterList) {
                this.elements.chapterList.innerHTML = emptyHTML;
            }
            return;
        }
        const cardsHTML = orderedChapters.map((chapter) => `
            <article class="chapter-card ${chapter.id === this.state.selectedChapterId ? "active" : ""}" data-chapter-id="${chapter.id}">
                <div class="chapter-card-head">
                    <div class="chapter-meta">
                        <span class="chapter-card-number">第${chapter.number}章</span>
                        <div>
                            <h4>${Utils.escapeHTML(chapter.title || `第${chapter.number}章`)}</h4>
                            <p class="chapter-card-summary">${Utils.escapeHTML(Utils.summarizeText(chapter.summary, 88))}</p>
                            <div class="chapter-badge-row">${this.buildChapterBadgeHTML(chapter)}</div>
                        </div>
                    </div>
                </div>
            </article>
        `).join("");

        if (this.elements.chapterBatchList) {
            this.elements.chapterBatchList.innerHTML = cardsHTML;
        }
        if (this.elements.chapterList) {
            this.elements.chapterList.innerHTML = cardsHTML;
        }
        this.applyMobileChapterListState();
    }

    renderChapterQuickSelect(chapters = []) {
        if (!this.elements.chapterQuickSelect) {
            return;
        }

        if (!chapters.length) {
            this.elements.chapterQuickSelect.innerHTML = '<option value="">请选择章节</option>';
            this.elements.chapterQuickSelect.value = "";
            return;
        }

        this.elements.chapterQuickSelect.innerHTML = [
            '<option value="">请选择章节</option>',
            ...chapters.map((chapter) => `<option value="${chapter.id}">第${chapter.number}章 · ${Utils.escapeHTML(chapter.title || `第${chapter.number}章`)}</option>`)
        ].join("");
        this.elements.chapterQuickSelect.value = this.state.selectedChapterId || "";
    }

    buildChapterBadgeHTML(chapter) {
        const badges = [];
        const chapterKey = `chapter_${Number(chapter.number || 0)}`;
        const snapshot = this.getChapterSnapshotRecord(Number(chapter.number || 0));
        const foreshadowCount = this.countForeshadowsForChapter(Number(chapter.number || 0));

        if ((chapter.content || "").trim()) {
            badges.push('<span class="tracker-pill success">正文</span>');
        }
        if (this.hasMeaningfulChapterSnapshot(snapshot)) {
            badges.push('<span class="tracker-pill">快照</span>');
        }
        if (this.hasContentfulNextChapterSetup(chapter.next_chapter_setup)) {
            badges.push('<span class="tracker-pill">下章铺垫</span>');
        }
        if (this.hasContentfulPlotUnit(chapter.plot_unit)) {
            badges.push('<span class="tracker-pill">剧情单元</span>');
        }
        if (foreshadowCount > 0) {
            badges.push(`<span class="tracker-pill warn">伏笔 ${foreshadowCount}</span>`);
        }

        return badges.join("") || '<span class="tracker-pill muted">待生成</span>';
    }

    hasContentfulNextChapterSetup(nextChapterSetup) {
        if (!nextChapterSetup) {
            return false;
        }
        if (typeof nextChapterSetup === "string") {
            return nextChapterSetup.trim().length > 0;
        }
        if (typeof nextChapterSetup === "object") {
            return Object.values(nextChapterSetup).some((value) => String(value || "").trim().length > 0);
        }
        return false;
    }

    hasContentfulPlotUnit(plotUnit) {
        if (!plotUnit) {
            return false;
        }
        if (typeof plotUnit === "string") {
            return plotUnit.trim().length > 0;
        }
        if (typeof plotUnit === "object") {
            return Object.values(plotUnit).some((value) => String(value || "").trim().length > 0);
        }
        return false;
    }

    renderCharacterList() {
        const characters = this.novelData.outline.characters || [];
        const validIds = new Set(characters.map((character) => character.id));
        this.state.selectedCharacterIds = new Set(
            Array.from(this.state.selectedCharacterIds || []).filter((id) => validIds.has(id))
        );
        if (characters.length === 0) {
            this.elements.characterList.innerHTML = '<div class="empty-state">人物库还是空的。可以手动新增，也可以后面根据章节再补充。</div>';
            this.updateCharacterSelectionToolbar();
            return;
        }

        this.elements.characterList.innerHTML = characters.map((character) => `
            <article class="character-card" data-character-id="${character.id}">
                <div class="character-card-head">
                    <div>
                        <label class="character-select">
                            <input type="checkbox" class="character-select-input" data-character-select="${character.id}" ${this.state.selectedCharacterIds.has(character.id) ? "checked" : ""}>
                            <span>选择</span>
                        </label>
                        <h4>${Utils.escapeHTML(character.name || "未命名人物")}</h4>
                        <div class="character-meta">
                            ${character.identity ? `<span class="tag">${Utils.escapeHTML(character.identity)}</span>` : ""}
                            ${character.gender ? `<span class="tag">${Utils.escapeHTML(character.gender)}</span>` : ""}
                            ${character.age ? `<span class="tag">${Utils.escapeHTML(character.age)}</span>` : ""}
                        </div>
                    </div>
                    <div class="character-card-actions">
                        <button class="btn btn-ghost btn-small" data-character-action="edit">编辑</button>
                        <button class="btn btn-danger btn-small" data-character-action="delete">删除</button>
                    </div>
                </div>
                <p><strong>性格：</strong>${Utils.escapeHTML(Utils.summarizeText(character.personality, 90))}</p>
                <p><strong>背景：</strong>${Utils.escapeHTML(Utils.summarizeText(character.background, 110))}</p>
                <p><strong>关系：</strong>${Utils.escapeHTML(Utils.summarizeText(character.relationships, 90))}</p>
            </article>
        `).join("");
        this.updateCharacterSelectionToolbar();
    }

    renderAdvancedState() {
        this.syncWorldStateManager();
        this.renderPromptLibrary();
        this.renderTrackerInsights();
        this.renderWorldStateManagerInsights();
        this.renderSystemEditors();
    }

    renderPromptLibrary() {
        const promptState = this.novelData.prompt_state || {};
        const savedPrompts = promptState.saved_prompts || {};
        const names = Object.keys(savedPrompts);
        this.elements.savedPromptSelect.innerHTML = [
            '<option value="">请选择已保存模板</option>',
            ...names.map((name) => `<option value="${Utils.escapeHTML(name)}">${Utils.escapeHTML(name)}</option>`)
        ].join("");
        this.elements.savedPromptSelect.value = promptState.selected_prompt || "";
        this.elements.promptFrequencySelect.value = promptState.chapter_frequency || "male";
        this.elements.currentPromptTemplateInput.value = promptState.current_prompt || this.getDesktopAlignedPromptTemplate();
    }

    renderTrackerInsights() {
        const snapshotEntries = Object.entries(this.novelData.chapter_snapshot?.snapshots || {})
            .map(([key, snapshot]) => [key, this.normalizeChapterSnapshotRecord(snapshot)])
            .filter(([, snapshot]) => this.hasMeaningfulChapterSnapshot(snapshot))
            .sort((left, right) => this.extractChapterNumber(right[0]) - this.extractChapterNumber(left[0]))
            .slice(0, 5);
        const foreshadows = this.flattenForeshadows();
        const unresolvedForeshadows = foreshadows
            .filter((item) => !String(item["状态"] || item.status || "").includes("回收"))
            .sort((left, right) => Number(right.chapter || 0) - Number(left.chapter || 0))
            .slice(0, 6);
        const personalityChanges = this.collectRecentPersonalityChanges().slice(0, 6);
        const worldEvents = (this.novelData.world_tracker?.world_events || []).slice(-6).reverse();
        const extras = (this.novelData.used_extras_characters || []).slice(-4).reverse();
        const plotUnits = Object.values(this.novelData.outline_plot_unit_manager?.plot_units || {})
            .sort((left, right) => {
                if (Number(left.volume || 0) !== Number(right.volume || 0)) {
                    return Number(right.volume || 0) - Number(left.volume || 0);
                }
                return Number(right.unit_number || 0) - Number(left.unit_number || 0);
            });
        const activePlotUnits = plotUnits.slice(0, 4);

        const cards = [
            { label: "章末快照", value: snapshotEntries.length, note: "正文回写后自动更新" },
            { label: "未回收伏笔", value: unresolvedForeshadows.length, note: "细纲/正文会继续受约束" },
            { label: "人物状态", value: Object.keys(this.novelData.dynamic_tracker?.character_states || {}).length, note: "动态状态追踪" },
            { label: "世界事件", value: (this.novelData.world_tracker?.world_events || []).length, note: "世界观变化记录" },
            { label: "龙套去重", value: (this.novelData.used_extras_characters || []).length, note: "避免重复造人" },
            { label: "临时支线", value: (this.novelData.used_temp_subplots || []).length, note: "防止支线失控" }
        ];

        cards.splice(3, 0, { label: "剧情单元", value: plotUnits.length, note: "8章一单元持续联动" });

        this.elements.trackerSummaryCards.innerHTML = cards.map((item) => `
            <article class="insight-stat-card">
                <span>${Utils.escapeHTML(item.label)}</span>
                <strong>${Utils.escapeHTML(String(item.value))}</strong>
                <p>${Utils.escapeHTML(item.note)}</p>
            </article>
        `).join("");

        this.elements.trackerSnapshotList.innerHTML = snapshotEntries.length
            ? snapshotEntries.map(([key, snapshot]) => `
                <article class="insight-item">
                    <strong>第 ${this.extractChapterNumber(key)} 章</strong>
                    <p>${Utils.escapeHTML(Utils.summarizeText(snapshot.pending_plots || snapshot["关键信息"] || snapshot["位置"] || "暂无摘要", 72))}</p>
                </article>
            `).join("")
            : '<div class="empty-state compact">还没有章末快照。</div>';

        this.elements.trackerForeshadowList.innerHTML = unresolvedForeshadows.length
            ? unresolvedForeshadows.map((item) => `
                <article class="insight-item">
                    <strong>第 ${item.chapter || "?"} 章 · ${Utils.escapeHTML(item.type || "伏笔")}</strong>
                    <p>${Utils.escapeHTML(Utils.summarizeText(item.content || item["内容"] || "暂无内容", 72))}</p>
                </article>
            `).join("")
            : '<div class="empty-state compact">当前没有待回收伏笔。</div>';

        this.elements.trackerConsistencyList.innerHTML = personalityChanges.length
            ? personalityChanges.map((item) => `
                <article class="insight-item">
                    <strong>${Utils.escapeHTML(item.name)} · 第 ${item.chapter} 章</strong>
                    <p>${Utils.escapeHTML(Utils.summarizeText(`${item.event} / ${item.reason}`, 72))}</p>
                </article>
            `).join("")
            : '<div class="empty-state compact">还没有记录到明显的人物演变。</div>';

        const plotUnitItems = activePlotUnits.map((unit) => `
                <article class="insight-item">
                    <strong>剧情单元 · 第${unit.volume || "?"}卷 第${unit.unit_number || "?"}单元</strong>
                    <p>${Utils.escapeHTML(Utils.summarizeText(
                        `${unit.current_phase || "未知阶段"} / ${unit.core_conflict || "待补核心冲突"} / ${unit.suspense_hook || unit.connection_to_next || "暂无钩子"}`,
                        84
                    ))}</p>
                </article>
            `);

        this.elements.trackerWorldEventList.innerHTML = [
            ...plotUnitItems,
            ...worldEvents.map((item) => `
                <article class="insight-item">
                    <strong>世界事件 · 第 ${item.chapter || "?"} 章</strong>
                    <p>${Utils.escapeHTML(Utils.summarizeText(item.event || "暂无内容", 72))}</p>
                </article>
            `),
            ...extras.map((item) => `
                <article class="insight-item">
                    <strong>龙套记录</strong>
                    <p>${Utils.escapeHTML(Utils.summarizeText(item.name || item["角色名"] || JSON.stringify(item), 72))}</p>
                </article>
            `)
        ].join("") || '<div class="empty-state compact">世界状态和龙套记录还没有回写内容。</div>';
    }

    renderWorldStateManagerInsights() {
        const manager = this.ensureWorldStateManager();
        const autoState = manager.auto_state || {};
        const manualState = manager.manual_state || {};
        const overview = autoState.overview || {};
        const characters = autoState.characters || {};
        const factions = autoState.factions || {};
        const locations = autoState.locations || {};
        const items = autoState.items || {};
        const abilities = autoState.abilities || {};
        const rewards = Array.isArray(autoState.rewards) ? autoState.rewards : [];
        const systemPanel = this.mergeWorldStateSystemPanels(autoState.system_panel, manualState.system_panel);
        const hardRules = this.normalizeWorldStateTextList(manualState.hard_rules);
        const riskList = [
            ...(Array.isArray(autoState.continuity_risks) ? autoState.continuity_risks : []),
            ...this.normalizeWorldStateTextList(manualState.continuity_risks)
        ].slice(0, 8);
        const systemEntryCount = systemPanel.messages.length
            + systemPanel.rewards.length
            + systemPanel.benefits.length
            + systemPanel.pending_unlocks.length;

        const cards = [
            { label: "人物档案", value: Object.keys(characters).length, note: "状态 / 位置 / 身份 / 位阶" },
            { label: "势力部门", value: Object.keys(factions).length, note: "宗门 / 公司 / 班级 / 组织" },
            { label: "地点记录", value: Object.keys(locations).length, note: "占位 / 控制 / 近期事件" },
            { label: "关键物品", value: Object.keys(items).length, note: "持有者 / 状态 / 来源" },
            { label: "能力位阶", value: Object.keys(abilities).length, note: "功法 / 技能 / 修为 / 身份权限" },
            { label: "系统面板", value: systemEntryCount, note: "播报 / 特权 / 奖励 / 待解锁" },
            { label: "奖励记录", value: rewards.length + this.normalizeWorldStateTextList(manualState.rewards).length, note: "系统 / 任务 / 资源回报" },
            { label: "风险提醒", value: riskList.length, note: "最容易吃书的地方" },
            { label: "手动规则", value: hardRules.length, note: "你额外锁死的红线" }
        ];

        if (this.elements.worldStateSummaryCards) {
            this.elements.worldStateSummaryCards.innerHTML = cards.map((item) => `
                <article class="insight-stat-card">
                    <span>${Utils.escapeHTML(item.label)}</span>
                    <strong>${Utils.escapeHTML(String(item.value))}</strong>
                    <p>${Utils.escapeHTML(item.note)}</p>
                </article>
            `).join("");
        }

        const characterEntries = Object.entries(characters)
            .sort((left, right) => Number(right[1]?.last_seen_chapter || 0) - Number(left[1]?.last_seen_chapter || 0))
            .slice(0, 8);
        if (this.elements.worldStateCharacterList) {
            this.elements.worldStateCharacterList.innerHTML = characterEntries.length
                ? characterEntries.map(([name, data]) => {
                    const parts = [
                        data.identity ? `身份=${data.identity}` : "",
                        data.location ? `位置=${data.location}` : "",
                        data.status ? `状态=${data.status}` : "",
                        data.cultivation ? `位阶=${data.cultivation}` : "",
                        data.organization ? `归属=${data.organization}` : ""
                    ].filter(Boolean);
                    return `
                        <article class="insight-item">
                            <strong>${Utils.escapeHTML(name)}</strong>
                            <p>${Utils.escapeHTML(Utils.summarizeText(parts.join("；") || "待补人物状态", 88))}</p>
                        </article>
                    `;
                }).join("")
                : '<div class="empty-state compact">还没有可用的人物总控状态。</div>';
        }

        const factionEntries = Object.entries(factions)
            .sort((left, right) => (right[1]?.members || []).length - (left[1]?.members || []).length)
            .slice(0, 8);
        if (this.elements.worldStateFactionList) {
            this.elements.worldStateFactionList.innerHTML = factionEntries.length
                ? factionEntries.map(([name, data]) => `
                    <article class="insight-item">
                        <strong>${Utils.escapeHTML(name)}</strong>
                        <p>${Utils.escapeHTML(Utils.summarizeText(
                            [
                                data.type ? `类型=${data.type}` : "",
                                data.leader ? `核心=${data.leader}` : "",
                                Array.isArray(data.members) && data.members.length ? `成员=${data.members.slice(0, 6).join("、")}` : "",
                                data.latest_change ? `最近变化=${data.latest_change}` : ""
                            ].filter(Boolean).join("；") || "待补势力/部门状态",
                            92
                        ))}</p>
                    </article>
                `).join("")
                : '<div class="empty-state compact">还没有势力、部门或宗门总表。</div>';
        }

        const assetItems = [
            ...Object.entries(items).slice(0, 5).map(([name, data]) => ({
                title: name,
                detail: [data.持有者 ? `持有者=${data.持有者}` : "", data.当前状态 ? `状态=${data.当前状态}` : "", data.类型 ? `类型=${data.类型}` : ""]
                    .filter(Boolean)
                    .join("；")
            })),
            ...Object.entries(abilities).slice(0, 2).map(([name, data]) => ({
                title: name,
                detail: [data.owner ? `归属=${data.owner}` : "", data.level ? `位阶=${data.level}` : "", data.type ? `类型=${data.type}` : ""]
                    .filter(Boolean)
                    .join("；")
            })),
            ...rewards.slice(0, 3).map((item) => ({
                title: item.reward || item.name || "奖励记录",
                detail: [item.owner ? `归属=${item.owner}` : "", item.status ? `状态=${item.status}` : "", item.source ? `来源=${item.source}` : ""]
                    .filter(Boolean)
                    .join("；")
            }))
        ].slice(0, 8);
        const systemMessages = systemPanel.messages.slice(-3).reverse();
        const systemStatuses = systemPanel.statuses.slice(-2).reverse();
        const systemBenefits = systemPanel.benefits.slice(0, 4);
        const systemRewards = systemPanel.rewards
            .slice()
            .sort((left, right) => Number(right.chapter || 0) - Number(left.chapter || 0))
            .slice(0, 4);
        const detailedSystemEntries = [
            (systemPanel.system_name || systemPanel.owner) ? {
                title: systemPanel.system_name ? `系统名称｜${systemPanel.system_name}` : "系统面板",
                detail: systemPanel.owner ? `宿主=${systemPanel.owner}` : "已识别到系统正文播报"
            } : null,
            ...systemMessages.map((message, index) => ({
                title: `系统播报 ${index + 1}`,
                detail: message
            })),
            ...systemStatuses.map((status, index) => ({
                title: `系统状态 ${index + 1}`,
                detail: status
            })),
            systemBenefits.length ? {
                title: "系统特权",
                detail: systemBenefits.join("；")
            } : null,
            ...systemRewards.map((item, index) => ({
                title: `系统奖励 ${index + 1}`,
                detail: [
                    item.reward || item.name || "",
                    item.status ? `状态=${item.status}` : "",
                    item.source ? `来源=${item.source}` : ""
                ].filter(Boolean).join("；")
            })),
            systemPanel.rules.length ? {
                title: "核心规则",
                detail: systemPanel.rules.slice(0, 2).join("；")
            } : null,
            systemPanel.functions.length ? {
                title: "系统功能",
                detail: systemPanel.functions.slice(0, 3).join("；")
            } : null,
            systemPanel.pending_unlocks.length ? {
                title: "待解锁",
                detail: systemPanel.pending_unlocks.slice(0, 3).join("；")
            } : null
        ]
            .filter(Boolean)
            .slice(0, 8);
        if (this.elements.worldStateSystemList) {
            this.elements.worldStateSystemList.innerHTML = detailedSystemEntries.length
                ? detailedSystemEntries.map((item) => `
                    <article class="insight-item">
                        <strong>${Utils.escapeHTML(item.title)}</strong>
                        <p>${Utils.escapeHTML(Utils.summarizeText(item.detail || "待补系统状态", 96))}</p>
                    </article>
                `).join("")
                : '<div class="empty-state compact">还没有识别到系统播报、系统奖励或持续特权。</div>';
        }
        const prioritizedAssetItems = [
            ...rewards.slice(0, 3).map((item) => ({
                title: item.reward || item.name || "奖励记录",
                detail: [item.owner ? `归属=${item.owner}` : "", item.status ? `状态=${item.status}` : "", item.source ? `来源=${item.source}` : ""]
                    .filter(Boolean)
                    .join("；")
            })),
            ...assetItems
        ]
            .filter((item, index, list) =>
                list.findIndex((entry) => entry.title === item.title && entry.detail === item.detail) === index
            )
            .slice(0, 8);
        if (this.elements.worldStateAssetList) {
            this.elements.worldStateAssetList.innerHTML = prioritizedAssetItems.length
                ? prioritizedAssetItems.map((item) => `
                    <article class="insight-item">
                        <strong>${Utils.escapeHTML(item.title)}</strong>
                        <p>${Utils.escapeHTML(Utils.summarizeText(item.detail || "待补资产/奖励状态", 88))}</p>
                    </article>
                `).join("")
                : '<div class="empty-state compact">还没有关键物品、奖励或能力记录。</div>';
        }

        const riskEntries = [
            ...riskList.map((text) => ({ title: "自动风险", detail: text })),
            ...hardRules.slice(0, 4).map((text) => ({ title: "手动红线", detail: text })),
            ...(manager.meta?.genre_modules || []).slice(0, 3).map((text) => ({ title: "题材重点", detail: text }))
        ].slice(0, 10);
        if (this.elements.worldStateRiskList) {
            this.elements.worldStateRiskList.innerHTML = riskEntries.length
                ? riskEntries.map((item) => `
                    <article class="insight-item">
                        <strong>${Utils.escapeHTML(item.title)}</strong>
                        <p>${Utils.escapeHTML(Utils.summarizeText(item.detail || "待补规则", 88))}</p>
                    </article>
                `).join("")
                : '<div class="empty-state compact">目前没有风险提醒，可在手动规则里继续加红线。</div>';
        }
    }

    ensureWorldStateManager() {
        const fallback = JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.world_state_manager));
        const manager = this.novelData.world_state_manager && typeof this.novelData.world_state_manager === "object"
            ? this.novelData.world_state_manager
            : fallback;

        manager.meta = manager.meta && typeof manager.meta === "object" ? manager.meta : fallback.meta;
        manager.auto_state = manager.auto_state && typeof manager.auto_state === "object" ? manager.auto_state : fallback.auto_state;
        manager.manual_state = manager.manual_state && typeof manager.manual_state === "object" ? manager.manual_state : fallback.manual_state;

        manager.meta.genre_modules = Array.isArray(manager.meta.genre_modules) ? manager.meta.genre_modules : [];
        manager.auto_state.overview = manager.auto_state.overview && typeof manager.auto_state.overview === "object"
            ? manager.auto_state.overview
            : fallback.auto_state.overview;
        manager.auto_state.characters = manager.auto_state.characters && typeof manager.auto_state.characters === "object" ? manager.auto_state.characters : {};
        manager.auto_state.relationships = manager.auto_state.relationships && typeof manager.auto_state.relationships === "object" ? manager.auto_state.relationships : {};
        manager.auto_state.factions = manager.auto_state.factions && typeof manager.auto_state.factions === "object" ? manager.auto_state.factions : {};
        manager.auto_state.locations = manager.auto_state.locations && typeof manager.auto_state.locations === "object" ? manager.auto_state.locations : {};
        manager.auto_state.items = manager.auto_state.items && typeof manager.auto_state.items === "object" ? manager.auto_state.items : {};
        manager.auto_state.abilities = manager.auto_state.abilities && typeof manager.auto_state.abilities === "object" ? manager.auto_state.abilities : {};
        manager.auto_state.rewards = Array.isArray(manager.auto_state.rewards) ? manager.auto_state.rewards : [];
        manager.auto_state.system_panel = this.normalizeWorldStateSystemPanel(manager.auto_state.system_panel);
        manager.auto_state.plot_threads = manager.auto_state.plot_threads && typeof manager.auto_state.plot_threads === "object"
            ? manager.auto_state.plot_threads
            : fallback.auto_state.plot_threads;
        manager.auto_state.continuity_risks = Array.isArray(manager.auto_state.continuity_risks) ? manager.auto_state.continuity_risks : [];

        manager.manual_state.overview_notes = this.normalizeWorldStateTextList(manager.manual_state.overview_notes);
        manager.manual_state.characters = manager.manual_state.characters && typeof manager.manual_state.characters === "object" ? manager.manual_state.characters : {};
        manager.manual_state.relationships = manager.manual_state.relationships && typeof manager.manual_state.relationships === "object" ? manager.manual_state.relationships : {};
        manager.manual_state.factions = manager.manual_state.factions && typeof manager.manual_state.factions === "object" ? manager.manual_state.factions : {};
        manager.manual_state.locations = manager.manual_state.locations && typeof manager.manual_state.locations === "object" ? manager.manual_state.locations : {};
        manager.manual_state.items = manager.manual_state.items && typeof manager.manual_state.items === "object" ? manager.manual_state.items : {};
        manager.manual_state.abilities = manager.manual_state.abilities && typeof manager.manual_state.abilities === "object" ? manager.manual_state.abilities : {};
        manager.manual_state.rewards = Array.isArray(manager.manual_state.rewards) ? manager.manual_state.rewards : [];
        manager.manual_state.system_panel = this.normalizeWorldStateSystemPanel(manager.manual_state.system_panel);
        manager.manual_state.hard_rules = this.normalizeWorldStateTextList(manager.manual_state.hard_rules);
        manager.manual_state.continuity_risks = this.normalizeWorldStateTextList(manager.manual_state.continuity_risks);
        manager.manual_state.custom_modules = manager.manual_state.custom_modules && typeof manager.manual_state.custom_modules === "object"
            ? manager.manual_state.custom_modules
            : {};

        this.novelData.world_state_manager = manager;
        return manager;
    }

    normalizeWorldStateTextList(value) {
        return Utils.ensureArrayFromText(value)
            .map((item) => String(item || "").trim())
            .filter(Boolean);
    }

    pickWorldStateText(...values) {
        for (const value of values) {
            const text = String(value || "").trim();
            if (text) {
                return text;
            }
        }
        return "";
    }

    splitWorldStateLabels(value) {
        return String(value || "")
            .split(/[\n,，、；;\/]/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    normalizeWorldStateRewardEntries(value) {
        const list = Array.isArray(value) ? value : this.normalizeWorldStateTextList(value);
        return list
            .map((item) => {
                if (!item) {
                    return null;
                }
                if (typeof item === "object") {
                    const name = this.pickWorldStateText(item.reward, item.name, item.item, item.title, item["名称"]);
                    if (!name) {
                        return null;
                    }
                    return {
                        reward: name,
                        name,
                        owner: this.pickWorldStateText(item.owner, item.holder, item["持有者"], item["归属"]),
                        status: this.pickWorldStateText(item.status, item["当前状态"], item["状态"]),
                        source: this.pickWorldStateText(item.source, item["来源"]),
                        detail: this.pickWorldStateText(item.detail, item.description, item["描述"]) || name,
                        chapter: Number(item.chapter || item.last_updated_chapter || 0)
                    };
                }
                const name = String(item || "").trim();
                return name
                    ? {
                        reward: name,
                        name,
                        owner: "",
                        status: "",
                        source: "",
                        detail: name,
                        chapter: 0
                    }
                    : null;
            })
            .filter(Boolean);
    }

    mergeWorldStateRewardEntries(...values) {
        const rewards = [];
        const seen = new Set();
        values.forEach((value) => {
            this.normalizeWorldStateRewardEntries(value).forEach((item) => {
                const key = [
                    item.reward || item.name || "",
                    item.owner || "",
                    item.status || "",
                    item.source || ""
                ].join("|");
                if (seen.has(key)) {
                    return;
                }
                seen.add(key);
                rewards.push(item);
            });
        });
        return rewards;
    }

    normalizeWorldStateSystemPanel(value = {}) {
        const panel = value && typeof value === "object" ? value : {};
        return {
            system_name: this.pickWorldStateText(panel.system_name, panel.name, panel["系统名"]),
            owner: this.pickWorldStateText(panel.owner, panel.host, panel.user, panel["宿主"]),
            messages: this.normalizeWorldStateTextList(panel.messages || panel.logs || panel.broadcasts || panel["系统播报"]),
            rewards: this.normalizeWorldStateRewardEntries(panel.rewards),
            benefits: this.normalizeWorldStateTextList(panel.benefits || panel.privileges || panel.perks || panel["特权"]),
            rules: this.normalizeWorldStateTextList(panel.rules || panel["规则"] || panel["核心规则"]),
            functions: this.normalizeWorldStateTextList(panel.functions || panel.features || panel["功能"]),
            statuses: this.normalizeWorldStateTextList(panel.statuses || panel["状态"] || panel["系统状态"]),
            pending_unlocks: this.normalizeWorldStateTextList(panel.pending_unlocks || panel.pending || panel["待解锁"] || panel["未解锁"]),
            last_seen_chapter: Number(panel.last_seen_chapter || panel.chapter || 0)
        };
    }

    mergeWorldStateSystemPanels(...values) {
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
            const panel = this.normalizeWorldStateSystemPanel(value);
            if (panel.system_name) {
                merged.system_name = panel.system_name;
            }
            if (panel.owner) {
                merged.owner = panel.owner;
            }
            merged.last_seen_chapter = Math.max(merged.last_seen_chapter, Number(panel.last_seen_chapter || 0));
            panel.messages.forEach((item) => pushText("messages", item));
            panel.benefits.forEach((item) => pushText("benefits", item));
            panel.rules.forEach((item) => pushText("rules", item));
            panel.functions.forEach((item) => pushText("functions", item));
            panel.statuses.forEach((item) => pushText("statuses", item));
            panel.pending_unlocks.forEach((item) => pushText("pending_unlocks", item));
            merged.rewards = this.mergeWorldStateRewardEntries(merged.rewards, panel.rewards);
        });

        return merged;
    }

    getWorldStatePrimaryRewardOwner() {
        const synopsisData = this.novelData.synopsisData || this.novelData.synopsis_data || {};
        const candidates = [
            synopsisData.main_characters?.女主,
            synopsisData.main_characters?.主角,
            synopsisData.main_characters?.男主,
            ...(this.novelData.outline?.characters || [])
                .filter((character) => character?.is_protagonist || character?.is_main)
                .map((character) => character?.name || ""),
            (this.novelData.outline?.characters || [])[0]?.name || ""
        ];
        return candidates
            .map((name) => this.resolveKnownCharacterName(name))
            .find(Boolean) || "";
    }

    normalizeWorldStateRewardName(value) {
        return String(value || "")
            .replace(/^获得(?:物品|奖励|道具|礼包|权限|资格|名额)?[：:]\s*/u, "")
            .replace(/^(?:宿主将获得|将获得|获得)/u, "")
            .replace(/[“”"'‘’【】\[\]]/g, "")
            .replace(/(?:一份|一瓶|一项|一个|一张|一枚|一套|一本|一把)$/u, "")
            .replace(/[。！？!?]+$/u, "")
            .trim();
    }

    extractWorldStateRewardsFromContent(content = "", chapterNumber = 0) {
        const text = String(content || "");
        if (!text.trim()) {
            return [];
        }

        const owner = this.getWorldStatePrimaryRewardOwner();
        const rewards = [];
        const seen = new Set();
        const pushReward = (name, detail = "", status = "", source = "正文系统提示") => {
            const rewardName = this.normalizeWorldStateRewardName(name);
            if (!rewardName) {
                return;
            }
            const key = `${rewardName}|${owner}|${status}|${source}`;
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            rewards.push({
                reward: rewardName,
                name: rewardName,
                owner,
                status: status || "已获得",
                source,
                detail: String(detail || "").trim() || rewardName,
                chapter: Number(chapterNumber || 0)
            });
        };

        const lines = text.split(/\r?\n/).map((line) => String(line || "").trim()).filter(Boolean);
        lines.forEach((line) => {
            const giftMatch = line.match(/(?:特发放|发放)([^。！？\]】\n]*?(?:礼包|奖励|资格|权限|名额))/u);
            if (giftMatch?.[1]) {
                pushReward(giftMatch[1], line, /是否开启|待开启/u.test(line) ? "待开启" : "已发放");
            }

            const itemMatch = line.match(/获得(?:物品|奖励|道具|礼包|权限|资格|名额)?[：:]\s*([^\]】。！？\n]+)/u);
            if (itemMatch?.[1]) {
                pushReward(itemMatch[1], line, "已获得");
            }

            if (/附加奖励/u.test(line) || /将获得/u.test(line) || /系统商城/u.test(line)) {
                if (/寿命延长/u.test(line)) {
                    pushReward("寿命延长", line, "待结算");
                }
                if (/气运加成/u.test(line)) {
                    pushReward("气运加成", line, "待结算");
                }
                if (/系统商城/u.test(line)) {
                    pushReward("系统商城高级物品解锁", line, /解锁/u.test(line) ? "待解锁" : "待开启");
                }
            }
        });

        return rewards;
    }

    extractWorldStateSystemPanelFromContent(content = "", chapterNumber = 0) {
        const text = String(content || "");
        const panel = {
            system_name: "",
            owner: this.getWorldStatePrimaryRewardOwner(),
            messages: [],
            rewards: [],
            benefits: [],
            rules: [],
            functions: [],
            statuses: [],
            pending_unlocks: [],
            last_seen_chapter: Number(chapterNumber || 0)
        };
        if (!text.trim()) {
            return panel;
        }

        const pushText = (key, value) => {
            const clean = String(value || "")
                .replace(/^[【[]\s*/u, "")
                .replace(/[】\]]$/u, "")
                .replace(/\s+/g, " ")
                .trim();
            if (!clean || panel[key].includes(clean)) {
                return;
            }
            panel[key].push(clean);
        };
        const pushLabels = (key, value) => {
            const cleanValue = String(value || "").replace(/[。！？]+$/u, "");
            this.splitWorldStateLabels(cleanValue).forEach((item) => {
                const clean = String(item || "")
                    .replace(/^[“"'‘’「『]+/u, "")
                    .replace(/[”"'‘’」』]+$/u, "")
                    .trim();
                if (clean) {
                    pushText(key, clean);
                }
            });
        };

        text.split(/\r?\n/)
            .map((line) => String(line || "").trim())
            .filter(Boolean)
            .forEach((line) => {
                const cleanLine = line
                    .replace(/^[【[]\s*/u, "")
                    .replace(/[】\]]$/u, "")
                    .replace(/\s+/g, " ")
                    .trim();
                if (!cleanLine) {
                    return;
                }

                const isBracketLine = /^[【[]/.test(line) && /[】\]]$/.test(line);
                const isStructuredSystemLine = /系统|获得物品|附加奖励|核心规则|规则提示|规则说明|永久特权|基础特权已激活|特权已激活|安全保障已开启/u.test(cleanLine);
                const isSystemLine = isBracketLine || isStructuredSystemLine;
                if (!isSystemLine) {
                    return;
                }

                const systemNameMatch = cleanLine.match(/([A-Za-z0-9\u4e00-\u9fa5·《》“”"'_-]{2,30}系统)/u);
                if (systemNameMatch?.[1]) {
                    panel.system_name = systemNameMatch[1];
                }

                pushText("messages", cleanLine);

                if (/(绑定|激活|开启|修复|净化|恢复|检测)/u.test(cleanLine)) {
                    pushText("statuses", cleanLine);
                }

                if (/(永久特权|基础特权已激活|特权已激活|安全保障已开启|特权)/u.test(cleanLine)) {
                    const benefitText = cleanLine.split(/[：:]/u).slice(1).join("：") || cleanLine;
                    pushLabels("benefits", benefitText.replace(/^(永久特权|基础特权已激活|特权已激活|安全保障已开启|特权)\s*/u, ""));
                }

                if (/核心规则|规则提示|规则说明/u.test(cleanLine)) {
                    pushText("rules", cleanLine.split(/[：:]/u).slice(1).join("：") || cleanLine);
                }

                if (/系统商城|商城/u.test(cleanLine)) {
                    pushText("functions", "系统商城");
                }

                if ((/待解锁|逐步解锁|解锁/u.test(cleanLine)) && (/系统商城|商城/u.test(cleanLine))) {
                    pushText("pending_unlocks", "系统商城高级物品解锁");
                }

                if (/无痛生子/u.test(cleanLine)) {
                    pushText("benefits", "无痛生子");
                }
                if (/百病不侵/u.test(cleanLine)) {
                    pushText("benefits", "孕期百病不侵");
                }
                if (/绝对防御/u.test(cleanLine)) {
                    pushText("benefits", "绝对防御");
                }
                if (/生育机能已恢复/u.test(cleanLine)) {
                    pushText("benefits", "生育机能恢复");
                }
                if (/附加奖励/u.test(cleanLine)) {
                    if (/寿命延长/u.test(cleanLine)) {
                        pushText("benefits", "寿命延长");
                    }
                    if (/气运加成/u.test(cleanLine)) {
                        pushText("benefits", "气运加成");
                    }
                }
            });

        panel.rewards = this.mergeWorldStateRewardEntries(
            panel.rewards,
            this.extractWorldStateRewardsFromContent(text, chapterNumber)
        );

        return panel;
    }

    mergeWorldStateText(...values) {
        const merged = [];
        const seen = new Set();
        values.forEach((value) => {
            this.normalizeWorldStateTextList(value).forEach((item) => {
                const text = String(item || "").trim();
                if (!text || seen.has(text)) {
                    return;
                }
                seen.add(text);
                merged.push(text);
            });
        });
        return merged.join("；");
    }

    getLatestWorldStateChapterMeta() {
        let latest = { chapterNumber: 0, volumeNumber: 0, chapter: null };
        (this.novelData.outline?.volumes || []).forEach((volume, volumeIndex) => {
            const volumeNumber = Number(volume.volume_number || volumeIndex + 1);
            (volume.chapters || []).forEach((chapter) => {
                const chapterNumber = Number(chapter.number || 0);
                const hasUsefulContent = Boolean(
                    String(chapter.content || "").trim()
                    || String(chapter.summary || "").trim()
                    || this.novelData.chapter_snapshot?.snapshots?.[`chapter_${chapterNumber}`]
                );
                if (!hasUsefulContent) {
                    return;
                }
                if (volumeNumber > latest.volumeNumber || (volumeNumber === latest.volumeNumber && chapterNumber >= latest.chapterNumber)) {
                    latest = { chapterNumber, volumeNumber, chapter };
                }
            });
        });
        return latest;
    }

    describeWorldStateGenreProfile() {
        const genre = this.novelData.outline?.genre || this.novelData.genre || "";
        const subgenre = this.novelData.outline?.subgenre || this.novelData.subgenre || "";
        return [genre, subgenre].filter(Boolean).join(" / ") || "通用长篇连载";
    }

    detectWorldStateGenreModules() {
        const genreText = `${this.novelData.outline?.genre || ""} ${this.novelData.outline?.subgenre || ""}`.trim();
        const modules = [
            "人物状态与知情范围",
            "地点、时间与场上占位",
            "关键物品与资源去向",
            "势力/部门/家庭/组织名单",
            "主线、支线与伏笔压力",
            "连续性红线与不可吃书项"
        ];

        if (/(玄幻|仙侠|高武|修真|修仙|洪荒)/.test(genreText)) {
            modules.push("修为/境界/功法/法宝", "宗门/门派/师承关系", "系统奖励/机缘归属");
        }
        if (/(都市|现实|职场|商战|年代)/.test(genreText)) {
            modules.push("单位/公司/部门岗位", "家庭关系与社会身份", "资金/票据/资源流向");
        }
        if (/(校园|青春)/.test(genreText)) {
            modules.push("班级/宿舍/社团名单", "课程/考试/比赛时间点");
        }
        if (/(悬疑|刑侦|探案|推理)/.test(genreText)) {
            modules.push("线索链与证据状态", "嫌疑人/受害者/警方知情范围");
        }
        if (/(言情|婚恋|甜宠|虐恋)/.test(genreText)) {
            modules.push("关系阶段与公开/隐瞒状态", "婚约/孩子/家庭压力");
        }
        if (/(科幻|星际|末世)/.test(genreText)) {
            modules.push("科技等级与权限", "基地/舰队/能源/库存");
        }
        if (/(宫斗|宅斗|权谋|历史|古代)/.test(genreText)) {
            modules.push("官职/爵位/府邸结构", "侍从/亲信/阵营站位");
        }

        return Array.from(new Set(modules));
    }

    syncWorldStateManager() {
        const manager = this.ensureWorldStateManager();
        const chapterMeta = this.getLatestWorldStateChapterMeta();
        const nextGenreProfile = this.describeWorldStateGenreProfile();
        const nextGenreModules = this.detectWorldStateGenreModules();
        const nextAutoState = this.buildAutoWorldStateManager(chapterMeta);
        const autoChanged = JSON.stringify(manager.auto_state || {}) !== JSON.stringify(nextAutoState);
        const modulesChanged = JSON.stringify(manager.meta.genre_modules || []) !== JSON.stringify(nextGenreModules);
        const metaChanged = manager.meta.genre_profile !== nextGenreProfile
            || Number(manager.meta.last_synced_chapter || 0) !== Number(chapterMeta.chapterNumber || 0)
            || Number(manager.meta.last_synced_volume || 0) !== Number(chapterMeta.volumeNumber || 0)
            || modulesChanged;

        manager.meta.schema_version = DEFAULT_NOVEL_DATA.world_state_manager?.meta?.schema_version || "1.0.0";
        manager.meta.genre_profile = nextGenreProfile;
        manager.meta.genre_modules = nextGenreModules;
        manager.meta.last_synced_chapter = Number(chapterMeta.chapterNumber || 0);
        manager.meta.last_synced_volume = Number(chapterMeta.volumeNumber || 0);
        if (autoChanged) {
            manager.auto_state = nextAutoState;
        }
        if (autoChanged || metaChanged || !manager.meta.last_synced_at) {
            manager.meta.last_synced_at = new Date().toISOString();
        }
        return manager;
    }

    buildAutoWorldStateManager(chapterMeta = this.getLatestWorldStateChapterMeta()) {
        const latestChapter = Number(chapterMeta?.chapterNumber || 0);
        const latestVolume = Number(chapterMeta?.volumeNumber || 0);
        const latestSnapshot = this.novelData.chapter_snapshot?.snapshots?.[`chapter_${latestChapter}`] || {};
        const characters = this.buildWorldStateCharacterRoster(chapterMeta);
        const relationships = this.buildWorldStateRelationshipRegistry();
        const factions = this.buildWorldStateFactionRegistry(characters);
        const locations = this.buildWorldStateLocationRegistry(characters, chapterMeta);
        const items = this.buildWorldStateItemRegistry(chapterMeta, characters);
        const abilities = this.buildWorldStateAbilityRegistry(characters);
        const rewards = this.buildWorldStateRewardRegistry(items, chapterMeta);
        const systemPanel = this.buildWorldStateSystemPanel(chapterMeta, characters, rewards);
        const plotThreads = this.buildWorldStatePlotThreadRegistry(chapterMeta);

        let activePlotUnit = "";
        if (latestChapter && latestVolume && this.generator?.getPlotUnitForChapter) {
            const plotUnitInfo = this.generator.getPlotUnitForChapter(this.novelData, latestVolume, latestChapter);
            if (plotUnitInfo?.unit) {
                activePlotUnit = [
                    `第${plotUnitInfo.unitNumber || "?"}剧情单元`,
                    plotUnitInfo.unit.current_phase || "",
                    plotUnitInfo.unit.core_conflict || plotUnitInfo.unit.suspense_hook || ""
                ].filter(Boolean).join("｜");
            }
        }

        const overview = {
            current_time: this.pickWorldStateText(
                latestSnapshot.timeline,
                latestSnapshot["时间"],
                this.novelData.story_state?.current_time,
                this.novelData.outline?.story_state?.timeline,
                this.novelData.timeline_tracker?.current_time
            ),
            current_location: this.pickWorldStateText(
                latestSnapshot.current_location,
                latestSnapshot["位置"],
                this.novelData.story_state?.current_location,
                this.novelData.outline?.story_state?.current_location
            ),
            latest_chapter: latestChapter,
            latest_volume: latestVolume,
            pending_plots: plotThreads.active.slice(0, 10),
            active_plot_unit: activePlotUnit,
            unresolved_foreshadows: plotThreads.unresolved_foreshadows.slice(0, 8),
            recent_world_events: (this.novelData.world_tracker?.world_events || [])
                .slice(-6)
                .map((item) => this.pickWorldStateText(item.event, item.detail, item.content, item["内容"]))
                .filter(Boolean)
        };

        const continuityRisks = this.buildWorldStateContinuityRiskList({
            chapterMeta,
            overview,
            characters,
            factions,
            locations,
            items,
            rewards,
            plotThreads
        });

        return {
            overview,
            characters,
            relationships,
            factions,
            locations,
            items,
            abilities,
            rewards,
            system_panel: systemPanel,
            plot_threads: plotThreads,
            continuity_risks: continuityRisks
        };
    }

    buildWorldStateCharacterRoster(chapterMeta = {}) {
        const rosterEvidence = this.buildWorldStateCharacterEvidence(
            Number(chapterMeta?.chapterNumber || 0),
            chapterMeta?.chapter || null
        );
        const roster = {};
        const upsertCharacter = (rawName, source = {}, sourceLabel = "") => {
            const fallbackName = source.name || source.character || source.character_name || source["角色名"] || source["角色"] || source["姓名"] || source["名字"] || source["人物"] || "";
            const name = this.resolveWorldStateCharacterByEvidence(rawName || fallbackName, rosterEvidence, "roster");
            if (!name) {
                return;
            }

            const existing = roster[name] || {
                name,
                aliases: [],
                identity: "",
                status: "",
                location: "",
                cultivation: "",
                organization: "",
                abilities: "",
                goals: "",
                appearance: "",
                real_appearance: "",
                relationships: "",
                background: "",
                personality: "",
                knowledge_scope: "",
                possessions: [],
                last_seen_chapter: 0,
                last_seen_volume: 0,
                sources: []
            };

            const aliases = Utils.ensureArrayFromText(source.aliases || source["别名"] || [])
                .map((item) => this.normalizeCharacterReferenceLabel(item))
                .filter((item) => item && item !== name);
            existing.aliases = Array.from(new Set([...(existing.aliases || []), ...aliases]));

            const identity = this.pickWorldStateText(source.identity, source.role, source["身份"], source["角色身份"]);
            const status = this.pickWorldStateText(source.status, source.current_status, source.currentStatus, source["状态"], source["当前状态"], source.offscreen_status);
            const location = this.pickWorldStateText(
                source.location,
                source.current_location,
                source.currentLocation,
                source.position,
                source["位置"],
                source["当前位置"],
                source["当前地点"],
                source["所在位置"]
            );
            const cultivation = this.pickWorldStateText(source.cultivation, source.rank, source.realm, source.level, source.power, source["修为"], source["境界"], source["实力"]);
            const organization = this.pickWorldStateText(
                source.organization,
                source.org,
                source.department,
                source.faction,
                source["组织"],
                source["所属组织"],
                source["阵营"],
                source["归属"],
                source["部门"],
                source["单位"]
            );
            const abilities = this.pickWorldStateText(source.abilities, source.skill, source.skills, source["能力"], source["技能"], source["功法"], source["术法"], source["权限"]);
            const goals = this.pickWorldStateText(source.goals, source.goal, source["目标"], source["当前目标"], source["当前诉求"]);
            const appearance = this.pickWorldStateText(source.appearance, source.current_appearance, source.currentAppearance, source["当前形象"], source["当前外貌"], source["外貌"]);
            const realAppearance = this.pickWorldStateText(source.real_appearance, source.realAppearance, source["真实外貌"], source["本貌"], source["原貌"]);
            const relationships = this.pickWorldStateText(source.relationships, source.relationship, source["关系"], source["关系变化"], source["人物关系"]);
            const knowledgeScope = this.pickWorldStateText(source.secrets, source.secret, source["秘密"], source["知晓秘密"], source["知情范围"]);
            const background = this.pickWorldStateText(source.background, source["背景"], source["背景故事"]);
            const personality = this.pickWorldStateText(source.personality, source["性格"], source["性格特点"]);
            const possessions = this.normalizeWorldStateTextList(source.possessions || source.items || source["持有物品"] || []);
            const lastSeenChapter = Math.max(
                Number(existing.last_seen_chapter || 0),
                Number(source.last_seen_chapter || 0),
                Number(source.last_chapter || 0),
                Number(source.chapter || 0),
                Number(source["章节"] || 0)
            );
            const lastSeenVolume = Math.max(
                Number(existing.last_seen_volume || 0),
                Number(source.last_seen_volume || 0),
                Number(source.volume || 0),
                Number(source["卷号"] || 0)
            );

            if (identity) existing.identity = identity;
            if (location) existing.location = location;
            if (organization) existing.organization = organization;
            if (cultivation) existing.cultivation = cultivation;
            if (status) existing.status = this.mergeWorldStateText(existing.status, status);
            if (abilities) existing.abilities = this.mergeWorldStateText(existing.abilities, abilities);
            if (goals) existing.goals = this.mergeWorldStateText(existing.goals, goals);
            if (appearance) existing.appearance = appearance;
            if (realAppearance) existing.real_appearance = realAppearance;
            if (relationships) existing.relationships = this.mergeWorldStateText(existing.relationships, relationships);
            if (knowledgeScope) existing.knowledge_scope = this.mergeWorldStateText(existing.knowledge_scope, knowledgeScope);
            if (background && !existing.background) existing.background = background;
            if (personality && !existing.personality) existing.personality = personality;
            existing.possessions = Array.from(new Set([...(existing.possessions || []), ...possessions]));
            existing.last_seen_chapter = lastSeenChapter;
            existing.last_seen_volume = lastSeenVolume;
            existing.sources = Array.from(new Set([...(existing.sources || []), sourceLabel].filter(Boolean)));
            roster[name] = existing;
        };

        const outlineCharacters = Array.isArray(this.novelData.outline?.characters) ? this.novelData.outline.characters : [];
        outlineCharacters.forEach((character) => upsertCharacter(character?.name || character?.["角色名"], character, "outline"));

        Object.entries(this.novelData.supporting_characters || {}).forEach(([name, value]) => {
            const source = value && typeof value === "object" ? value : { identity: String(value || "") };
            upsertCharacter(name, source, "supporting");
        });

        Object.values((this.novelData.synopsisData || this.novelData.synopsis_data || {}).main_characters || {}).forEach((name) => {
            upsertCharacter(name, {}, "synopsis_main");
        });
        Object.entries(this.novelData.extra_character_records || {}).forEach(([key, value]) => {
            const recordChapter = this.extractSnapshotChapterNumber(key);
            if (Number(chapterMeta?.chapterNumber || 0) && recordChapter > Number(chapterMeta.chapterNumber || 0)) {
                return;
            }
            (Array.isArray(value?.characters) ? value.characters : []).forEach((name) => {
                upsertCharacter(name, {
                    chapter: recordChapter || 0
                }, "extra_record");
            });
        });

        Object.entries(this.novelData.dynamic_tracker?.character_states || {}).forEach(([name, value]) => {
            upsertCharacter(name, value, "dynamic_state");
        });
        Object.entries(this.novelData.character_checker?.character_states || {}).forEach(([name, value]) => {
            upsertCharacter(name, value, "character_checker");
        });
        Object.entries(this.novelData.character_appearance_tracker?.appearances || {}).forEach(([name, value]) => {
            const chapters = Array.isArray(value?.["出场章节"]) ? value["出场章节"] : [];
            const volumes = Array.isArray(value?.["出场卷号"]) ? value["出场卷号"] : [];
            upsertCharacter(name, {
                identity: value?.["身份"] || value?.identity || "",
                appearance: value?.["当前形象"] || value?.current_appearance || "",
                real_appearance: value?.["真实形象"] || value?.real_appearance || "",
                chapter: chapters.length ? Math.max(...chapters.map((item) => Number(item || 0))) : value?.chapter || 0,
                volume: volumes.length ? Math.max(...volumes.map((item) => Number(item || 0))) : 0
            }, "appearance_tracker");
        });
        Object.entries(this.novelData.world_tracker?.character_positions || {}).forEach(([name, value]) => {
            upsertCharacter(name, {
                location: value,
                chapter: Number(chapterMeta.chapterNumber || 0),
                volume: Number(chapterMeta.volumeNumber || 0)
            }, "world_position");
        });
        Object.entries(this.novelData.world_tracker?.offscreen_status || {}).forEach(([name, value]) => {
            upsertCharacter(name, {
                status: `场外：${String(value || "").trim()}`,
                chapter: Number(chapterMeta.chapterNumber || 0),
                volume: Number(chapterMeta.volumeNumber || 0)
            }, "offscreen");
        });
        Object.entries(this.novelData.genre_progress_tracker?.rank_progress || {}).forEach(([name, value]) => {
            upsertCharacter(name, {
                cultivation: value?.rank || value?.detail || "",
                chapter: value?.chapter || 0
            }, "genre_rank");
        });
        Object.entries(this.novelData.genre_progress_tracker?.status_progress || {}).forEach(([name, value]) => {
            upsertCharacter(name, {
                status: value?.detail || "",
                chapter: value?.chapter || 0
            }, "genre_status");
        });
        Object.entries(this.novelData.genre_progress_tracker?.pregnancy_progress || {}).forEach(([name, value]) => {
            upsertCharacter(name, {
                status: `${value?.months ? `${value.months}个月` : ""}${value?.status ? ` ${value.status}` : ""}${value?.detail ? ` ${value.detail}` : ""}`.trim(),
                chapter: value?.chapter || 0
            }, "genre_progress");
        });
        Utils.ensureArrayFromText(chapterMeta?.chapter?.characters || []).forEach((name) => {
            upsertCharacter(name, {
                chapter: Number(chapterMeta.chapterNumber || 0),
                volume: Number(chapterMeta.volumeNumber || 0)
            }, "latest_chapter");
        });

        return Object.fromEntries(
            Object.entries(roster)
                .sort((left, right) => Number(right[1]?.last_seen_chapter || 0) - Number(left[1]?.last_seen_chapter || 0))
        );
    }

    buildWorldStateRelationshipRegistry() {
        const registry = {};
        const upsertRelationship = (leftName, rightName, source = {}, sourceLabel = "") => {
            const left = this.resolveKnownCharacterName(leftName);
            const right = this.resolveKnownCharacterName(rightName);
            if (!left || !right || left === right) {
                return;
            }
            const key = [left, right].sort().join("|");
            const existing = registry[key] || {
                characters: [left, right],
                relation: "",
                detail: "",
                first_met_chapter: 0,
                interaction_chapters: [],
                last_interaction_chapter: 0,
                sources: []
            };
            const relation = this.pickWorldStateText(source.relation, source.relationship, source["关系"]);
            const detail = this.pickWorldStateText(source.detail, source.summary, source["描述"], source["内容"]);
            const firstChapter = Number(source.first_met_chapter || source.first_meeting || source["首次见面"] || source.chapter || source["章节"] || 0);
            const interactionChapters = Array.isArray(source.interaction_chapters || source["互动章节"])
                ? (source.interaction_chapters || source["互动章节"]).map((item) => Number(item || 0)).filter(Boolean)
                : [];

            if (relation) existing.relation = relation;
            if (detail) existing.detail = this.mergeWorldStateText(existing.detail, detail);
            if (!existing.first_met_chapter || (firstChapter && firstChapter < existing.first_met_chapter)) {
                existing.first_met_chapter = firstChapter;
            }
            existing.interaction_chapters = Array.from(new Set([
                ...(existing.interaction_chapters || []),
                ...interactionChapters,
                firstChapter || 0
            ].filter(Boolean))).sort((a, b) => a - b);
            existing.last_interaction_chapter = Math.max(
                Number(existing.last_interaction_chapter || 0),
                ...existing.interaction_chapters
            );
            existing.sources = Array.from(new Set([...(existing.sources || []), sourceLabel].filter(Boolean)));
            registry[key] = existing;
        };

        Object.entries(this.novelData.character_appearance_tracker?.relationships || {}).forEach(([key, value]) => {
            const [left, right] = String(key || "").split("|");
            upsertRelationship(left, right, value, "appearance_tracker");
        });

        const knownNames = (this.novelData.outline?.characters || [])
            .map((item) => this.resolveKnownCharacterName(item?.name || item?.["角色名"]))
            .filter(Boolean);
        (this.novelData.outline?.characters || []).forEach((character) => {
            const name = this.resolveKnownCharacterName(character?.name || character?.["角色名"]);
            const relationships = this.pickWorldStateText(character?.relationships, character?.["人物关系"]);
            if (!name || !relationships) {
                return;
            }
            const relationInfo = this.extractRelationshipInfoForSeed(name, relationships, knownNames);
            (relationInfo.relationPairs || []).forEach((pair) => {
                upsertRelationship(pair.left, pair.right, {
                    relation: pair.relation,
                    detail: relationships
                }, "outline_character");
            });
        });

        Object.entries(this.novelData.dynamic_tracker?.relationships || {}).forEach(([key, value]) => {
            if (key.includes("|")) {
                const [left, right] = key.split("|");
                upsertRelationship(left, right, value, "dynamic_relationship");
                return;
            }
            const left = value?.left || value?.source || value?.["左侧"];
            const right = value?.right || value?.target || value?.["右侧"];
            upsertRelationship(left, right, value, "dynamic_relationship");
        });

        return registry;
    }

    guessWorldStateFactionType(name, detail = "") {
        const text = `${name || ""} ${detail || ""}`;
        if (/(宗|门|派|峰|殿|阁|宫|教|谷|圣地|仙府|山庄)/.test(text)) return "宗门";
        if (/(公司|集团|企业|工作室|品牌|工厂|店|商会)/.test(text)) return "公司";
        if (/(大学|学院|中学|高中|初中|小学|班|宿舍|社团|学生会|战队)/.test(text)) return "校园";
        if (/(局|处|厅|署|部|科|队|所|院|站|政府|机关|警|检察|法院)/.test(text)) return "部门";
        if (/(朝|宫|府|王府|侯府|军|营|卫|司|族|家|会)/.test(text)) return "势力";
        return "组织";
    }

    buildWorldStateFactionRegistry(characters = {}) {
        const factions = {};
        const upsertFaction = (rawName, source = {}, sourceLabel = "") => {
            const name = String(rawName || source.name || source.organization || source.org || source["组织"] || source["名称"] || "").trim();
            if (!name) {
                return;
            }
            const existing = factions[name] || {
                type: "",
                leader: "",
                members: [],
                locations: [],
                latest_change: "",
                last_chapter: 0,
                sources: []
            };
            const detail = this.pickWorldStateText(source.latest_change, source.detail, source.summary, source["描述"], source["内容"]);
            const type = this.pickWorldStateText(source.type, source["类型"]) || this.guessWorldStateFactionType(name, detail);
            const leader = this.pickWorldStateText(source.leader, source.owner, source["首领"], source["负责人"]);
            const members = Utils.ensureArrayFromText(source.members || source["成员"] || [])
                .map((item) => String(item?.name || item || "").trim())
                .filter(Boolean);
            const locations = Utils.ensureArrayFromText(source.locations || source.location || source["地点"] || [])
                .map((item) => String(item?.name || item || "").trim())
                .filter(Boolean);
            const lastChapter = Math.max(
                Number(existing.last_chapter || 0),
                Number(source.last_chapter || 0),
                Number(source.chapter || 0),
                Number(source["章节"] || 0)
            );

            if (type) existing.type = type;
            if (leader) existing.leader = leader;
            existing.members = Array.from(new Set([...(existing.members || []), ...members].filter(Boolean)));
            existing.locations = Array.from(new Set([...(existing.locations || []), ...locations].filter(Boolean)));
            if (detail) existing.latest_change = this.mergeWorldStateText(existing.latest_change, detail);
            existing.last_chapter = lastChapter;
            existing.sources = Array.from(new Set([...(existing.sources || []), sourceLabel].filter(Boolean)));
            factions[name] = existing;
        };

        Object.entries(this.novelData.world_tracker?.organizations || {}).forEach(([name, value]) => {
            upsertFaction(name, value, "world_tracker");
        });

        Object.values(characters || {}).forEach((character) => {
            this.splitWorldStateLabels(character.organization || "").forEach((organization) => {
                const leaderHint = `${character.identity || ""} ${character.status || ""}`;
                upsertFaction(organization, {
                    members: [character.name],
                    leader: !/(宗主|掌门|门主|峰主|阁主|宫主|家主|族长|总裁|经理|部长|主任|院长|会长|社长|班长|队长|局长|校长|导师|老师|皇帝|陛下|王爷)/.test(leaderHint)
                        ? ""
                        : character.name,
                    detail: character.status ? `${character.name}：${character.status}` : "",
                    chapter: character.last_seen_chapter || 0
                }, "character_roster");
            });
        });

        return factions;
    }

    buildWorldStateLocationRegistry(characters = {}, chapterMeta = {}) {
        const locations = {};
        const upsertLocation = (rawName, source = {}, sourceLabel = "") => {
            const name = String(rawName || source.name || source.location || source["地点"] || source["位置"] || "").trim();
            if (!name) {
                return;
            }
            const existing = locations[name] || {
                occupants: [],
                controlled_by: "",
                latest_event: "",
                last_chapter: 0,
                sources: []
            };
            const occupants = Utils.ensureArrayFromText(source.occupants || source.members || source["在场人物"] || [])
                .map((item) => String(item?.name || item || "").trim())
                .filter(Boolean);
            const controlledBy = this.pickWorldStateText(source.controlled_by, source.controller, source.owner, source["控制者"], source["归属"]);
            const latestEvent = this.pickWorldStateText(source.latest_event, source.latest_change, source.detail, source.summary, source["内容"]);
            const lastChapter = Math.max(
                Number(existing.last_chapter || 0),
                Number(source.last_chapter || 0),
                Number(source.chapter || 0),
                Number(source["章节"] || 0)
            );

            existing.occupants = Array.from(new Set([...(existing.occupants || []), ...occupants].filter(Boolean)));
            if (controlledBy) existing.controlled_by = controlledBy;
            if (latestEvent) existing.latest_event = this.mergeWorldStateText(existing.latest_event, latestEvent);
            existing.last_chapter = lastChapter;
            existing.sources = Array.from(new Set([...(existing.sources || []), sourceLabel].filter(Boolean)));
            locations[name] = existing;
        };

        Object.entries(this.novelData.world_tracker?.locations || {}).forEach(([name, value]) => {
            upsertLocation(name, value, "world_tracker");
        });

        const currentLocation = this.pickWorldStateText(
            this.novelData.story_state?.current_location,
            this.novelData.outline?.story_state?.current_location
        );
        if (currentLocation) {
            upsertLocation(currentLocation, {
                latest_event: "当前叙事主场景",
                chapter: Number(chapterMeta.chapterNumber || 0)
            }, "story_state");
        }

        Object.values(characters || {}).forEach((character) => {
            this.splitWorldStateLabels(character.location || "").forEach((location) => {
                upsertLocation(location, {
                    occupants: [character.name],
                    chapter: Number(character.last_seen_chapter || 0)
                }, "character_roster");
            });
        });

        (this.novelData.world_tracker?.world_events || []).forEach((event) => {
            const locationName = this.pickWorldStateText(event.location, event.place, event["地点"]);
            if (!locationName) {
                return;
            }
            upsertLocation(locationName, {
                latest_event: this.pickWorldStateText(event.event, event.detail, event.content, event["内容"]),
                chapter: Number(event.chapter || 0)
            }, "world_event");
        });

        return locations;
    }

    buildWorldStateItemRegistry(chapterMeta = {}, characters = {}) {
        const items = {};
        const upsertItem = (rawName, source = {}, sourceLabel = "") => {
            const name = String(rawName || source.name || source.item || source["名称"] || source["物品"] || "").trim();
            if (!name) {
                return;
            }
            const existing = items[name] || {
                name,
                类型: "",
                type: "",
                持有者: "",
                holder: "",
                当前状态: "",
                status: "",
                来源: "",
                source: "",
                描述: "",
                description: "",
                获得章节: 0,
                last_updated_chapter: 0,
                sources: []
            };
            const type = this.pickWorldStateText(source.type, source["类型"]);
            const holder = this.pickWorldStateText(source.holder, source.owner, source["持有者"], source["归属"]);
            const status = this.pickWorldStateText(source.status, source["当前状态"], source["状态"]);
            const itemSource = this.pickWorldStateText(source.source, source["来源"], source["获得方式"]);
            const description = this.pickWorldStateText(source.description, source["描述"]);
            const acquireChapter = Number(source.acquire_chapter || source["获得章节"] || source.chapter || source["章节"] || 0);
            const lastUpdatedChapter = Math.max(
                Number(existing.last_updated_chapter || 0),
                Number(source.last_updated_chapter || 0),
                Number(source["最后更新章节"] || 0),
                acquireChapter
            );

            if (type) {
                existing.类型 = type;
                existing.type = type;
            }
            if (holder) {
                existing.持有者 = holder;
                existing.holder = holder;
            }
            if (status) {
                existing.当前状态 = status;
                existing.status = status;
            }
            if (itemSource) {
                existing.来源 = itemSource;
                existing.source = itemSource;
            }
            if (description) {
                existing.描述 = description;
                existing.description = description;
            }
            existing.获得章节 = existing.获得章节 || acquireChapter;
            existing.last_updated_chapter = lastUpdatedChapter;
            existing.sources = Array.from(new Set([...(existing.sources || []), sourceLabel].filter(Boolean)));
            items[name] = existing;
        };

        Object.entries(this.novelData.dynamic_tracker?.items || {}).forEach(([name, value]) => {
            upsertItem(value?.["名称"] || value?.name || name, {
                type: value?.["类型"] || value?.type,
                holder: value?.["持有者"] || value?.holder,
                status: value?.["当前状态"] || value?.status,
                source: value?.["获得方式"] || value?.source,
                description: value?.["描述"] || value?.description,
                acquire_chapter: value?.["获得章节"] || value?.chapter,
                last_updated_chapter: value?.["最后更新章节"] || value?.last_chapter
            }, "dynamic_tracker");
        });

        const importantItemSources = [
            this.novelData.outline?.story_state?.important_items,
            this.novelData.story_state?.tracked_items,
            this.novelData.chapter_snapshot?.snapshots?.[`chapter_${Number(chapterMeta.chapterNumber || 0)}`]?.important_items
        ];
        importantItemSources.forEach((source) => {
            this.extractStructuredPossessions(source, "").forEach((item) => {
                upsertItem(item.name, {
                    type: item.type,
                    holder: item.holder,
                    status: item.status,
                    source: item.source,
                    description: item.description,
                    acquire_chapter: Number(chapterMeta.chapterNumber || 0)
                }, "important_items");
            });
        });

        Object.values(characters || {}).forEach((character) => {
            this.extractStructuredPossessions(character?.possessions || [], character?.name || "").forEach((item) => {
                upsertItem(item.name, {
                    type: item.type || "物品",
                    holder: item.holder || character?.name || "",
                    status: item.status || "持有",
                    source: item.source || "character_possession",
                    description: item.description || item.name,
                    acquire_chapter: Number(character?.last_seen_chapter || 0),
                    last_updated_chapter: Number(character?.last_seen_chapter || 0)
                }, "character_possession");
            });
        });

        return items;
    }

    buildWorldStateAbilityRegistry(characters = {}) {
        const abilities = {};
        const upsertAbility = (rawName, source = {}, sourceLabel = "") => {
            const name = String(rawName || source.name || source.skill || source["名称"] || source["技能"] || "").trim();
            if (!name || name.length > 30) {
                return;
            }
            const existing = abilities[name] || {
                owner: "",
                type: "",
                level: "",
                detail: "",
                last_chapter: 0,
                sources: []
            };
            const owner = this.pickWorldStateText(source.owner, source.user, source["使用者"], source["归属"]);
            const type = this.pickWorldStateText(source.type, source["类型"]) || (/位阶|境界|修为/.test(name) ? "位阶" : "能力");
            const level = this.pickWorldStateText(source.level, source.rank, source.proficiency, source["等级"], source["熟练度"], source["位阶"]);
            const detail = this.pickWorldStateText(source.detail, source.description, source["描述"]);
            const lastChapter = Math.max(
                Number(existing.last_chapter || 0),
                Number(source.last_chapter || 0),
                Number(source.chapter || 0),
                Number(source["章节"] || 0)
            );

            if (owner) existing.owner = owner;
            if (type) existing.type = type;
            if (level) existing.level = level;
            if (detail) existing.detail = this.mergeWorldStateText(existing.detail, detail);
            existing.last_chapter = lastChapter;
            existing.sources = Array.from(new Set([...(existing.sources || []), sourceLabel].filter(Boolean)));
            abilities[name] = existing;
        };

        Object.entries(this.novelData.dynamic_tracker?.skills || {}).forEach(([name, value]) => {
            upsertAbility(value?.["名称"] || value?.name || name, {
                owner: value?.["使用者"] || value?.user,
                type: value?.["类型"] || value?.type,
                level: value?.["熟练度"] || value?.proficiency || value?.level,
                detail: value?.["描述"] || value?.description,
                chapter: value?.chapter || value?.["章节"] || 0
            }, "dynamic_skill");
        });

        Object.values(characters || {}).forEach((character) => {
            this.splitWorldStateLabels(character.abilities || "")
                .filter((item) => item.length >= 2 && item.length <= 24)
                .slice(0, 6)
                .forEach((abilityName) => {
                    upsertAbility(abilityName, {
                        owner: character.name,
                        type: "角色能力",
                        detail: character.cultivation ? `当前位阶=${character.cultivation}` : "",
                        chapter: Number(character.last_seen_chapter || 0)
                    }, "character_profile");
                });
            if (character.cultivation) {
                upsertAbility(`${character.name}当前位阶`, {
                    owner: character.name,
                    type: "位阶",
                    level: character.cultivation,
                    detail: character.cultivation,
                    chapter: Number(character.last_seen_chapter || 0)
                }, "character_rank");
            }
        });

        Object.entries(this.novelData.genre_progress_tracker?.rank_progress || {}).forEach(([name, value]) => {
            const resolvedName = this.resolveKnownCharacterName(name);
            upsertAbility(`${resolvedName}当前位阶`, {
                owner: resolvedName,
                type: "位阶",
                level: value?.rank || "",
                detail: value?.detail || value?.rank || "",
                chapter: Number(value?.chapter || 0)
            }, "genre_rank");
        });

        return abilities;
    }

    buildWorldStateRewardRegistry(items = {}, chapterMeta = {}) {
        const rewards = [];
        const seen = new Set();
        const rewardPattern = /(系统|任务|奖励|机缘|签到|礼包|抽奖|成就|掉落|赐|赏|奖金|奖学金|offer|录取|编制|资格|权限|名额)/;
        const pushReward = (source = {}, sourceLabel = "") => {
            const name = this.pickWorldStateText(source.reward, source.name, source.item, source["名称"]);
            const detail = this.pickWorldStateText(source.detail, source.description, source["描述"]);
            const owner = this.pickWorldStateText(source.owner, source.holder, source["持有者"], source["归属"]);
            const status = this.pickWorldStateText(source.status, source["当前状态"], source["状态"]);
            const rewardSource = this.pickWorldStateText(source.source, source["来源"]) || sourceLabel;
            const combinedText = `${name} ${detail} ${rewardSource}`;
            if (!combinedText.trim() || !rewardPattern.test(combinedText)) {
                return;
            }
            const key = `${name || detail}|${owner}|${rewardSource}`;
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            rewards.push({
                reward: name || detail || "奖励记录",
                name: name || detail || "奖励记录",
                owner,
                status: status || "待追踪",
                source: rewardSource,
                detail,
                chapter: Number(source.chapter || source.last_updated_chapter || 0)
            });
        };

        Object.values(items || {}).forEach((item) => pushReward(item, "item_registry"));
        (this.novelData.genre_progress_tracker?.progress_events || []).forEach((event) => {
            pushReward({
                name: event?.detail || "",
                owner: event?.role || "",
                source: "genre_progress",
                status: "事件推进",
                detail: event?.detail || "",
                chapter: Number(event?.chapter || 0)
            }, "genre_progress");
        });
        (this.novelData.outline?.volumes || []).forEach((volume) => {
            (volume?.chapters || []).forEach((chapter) => {
                const chapterNumber = Number(chapter?.number || 0);
                if (!String(chapter?.content || "").trim()) {
                    return;
                }
                this.extractWorldStateRewardsFromContent(chapter.content, chapterNumber).forEach((reward) => {
                    pushReward(reward, reward.source || "正文系统提示");
                });
            });
        });

    return rewards.sort((left, right) => Number(right.chapter || 0) - Number(left.chapter || 0)).slice(0, 20);
    }

    buildWorldStateSystemPanel(chapterMeta = {}, characters = {}, rewards = []) {
        const panel = this.mergeWorldStateSystemPanels({
            owner: this.getWorldStatePrimaryRewardOwner(),
            last_seen_chapter: Number(chapterMeta?.chapterNumber || 0)
        });
        const isSystemReward = (reward) => {
            const text = [
                reward?.reward || reward?.name || "",
                reward?.source || "",
                reward?.detail || ""
            ].join(" ");
            return /系统|特权|礼包|奖励|商城|正文系统提示|无痛生子|百病不侵|绝对防御|寿命延长|气运加成|春风化雨/u.test(text);
        };

        (this.novelData.outline?.volumes || []).forEach((volume) => {
            (volume?.chapters || []).forEach((chapter) => {
                const chapterNumber = Number(chapter?.number || 0);
                const content = String(chapter?.content || "").trim();
                if (!content) {
                    return;
                }
                Object.assign(panel, this.mergeWorldStateSystemPanels(
                    panel,
                    this.extractWorldStateSystemPanelFromContent(content, chapterNumber)
                ));
            });
        });

        panel.rewards = this.mergeWorldStateRewardEntries(
            panel.rewards,
            this.normalizeWorldStateRewardEntries(rewards).filter((reward) => isSystemReward(reward))
        ).sort((left, right) => Number(right.chapter || 0) - Number(left.chapter || 0)).slice(0, 12);

        if (!panel.owner) {
            panel.owner = this.getWorldStatePrimaryRewardOwner();
        }
        if (!panel.system_name && panel.messages.length) {
            const systemNameMatch = panel.messages.join(" ").match(/([A-Za-z0-9\u4e00-\u9fa5·《》“”"'_-]{2,30}系统)/u);
            if (systemNameMatch?.[1]) {
                panel.system_name = systemNameMatch[1];
            }
        }

        return this.normalizeWorldStateSystemPanel(panel);
    }

    buildWorldStatePlotThreadRegistry(chapterMeta = {}) {
        const latestSnapshot = this.novelData.chapter_snapshot?.snapshots?.[`chapter_${Number(chapterMeta.chapterNumber || 0)}`] || {};
        const pendingPlots = this.normalizeWorldStateTextList(
            this.pickWorldStateText(
                latestSnapshot.pending_plots,
                this.novelData.outline?.story_state?.pending_plots
            )
        );
        const plotUnitThreads = Object.values(this.novelData.outline_plot_unit_manager?.plot_units || {})
            .sort((left, right) => {
                if (Number(left.volume || 0) !== Number(right.volume || 0)) {
                    return Number(right.volume || 0) - Number(left.volume || 0);
                }
                return Number(right.unit_number || 0) - Number(left.unit_number || 0);
            })
            .slice(0, 4)
            .map((unit) => this.pickWorldStateText(unit.core_conflict, unit.connection_to_next, unit.suspense_hook))
            .filter(Boolean);
        const unresolvedForeshadows = this.flattenForeshadows()
            .filter((item) => !String(item.status || item["状态"] || "").includes("回收"))
            .sort((left, right) => Number(right.chapter || 0) - Number(left.chapter || 0))
            .map((item) => `第${item.chapter || "?"}章：${Utils.summarizeText(item.content || item["内容"] || "", 50)}`)
            .slice(0, 10);

        return {
            active: Array.from(new Set([...pendingPlots, ...plotUnitThreads])).slice(0, 12),
            temporary: Array.isArray(this.novelData.used_temp_subplots) ? this.novelData.used_temp_subplots.slice(-10) : [],
            unresolved_foreshadows: unresolvedForeshadows
        };
    }

    buildWorldStateContinuityRiskList({
        chapterMeta = {},
        overview = {},
        characters = {},
        factions = {},
        locations = {},
        items = {},
        rewards = [],
        plotThreads = {}
    } = {}) {
        const risks = [];
        const pushRisk = (text) => {
            const normalized = String(text || "").trim();
            if (!normalized || risks.includes(normalized)) {
                return;
            }
            risks.push(normalized);
        };

        if (Number(chapterMeta.chapterNumber || 0) > 0 && !overview.current_location) {
            pushRisk("最新章节还没锁定当前地点，续写时容易平地换景。");
        }
        if (Number(chapterMeta.chapterNumber || 0) > 0 && !overview.current_time) {
            pushRisk("最新章节还没锁定当前时间，续写时容易出现时间跳变。");
        }

        const focusNames = Object.values((this.novelData.synopsisData || this.novelData.synopsis_data || {}).main_characters || {})
            .map((name) => this.resolveKnownCharacterName(name))
            .filter(Boolean);
        const focusCharacters = (focusNames.length
            ? focusNames.map((name) => characters[name]).filter(Boolean)
            : Object.values(characters).sort((left, right) => Number(right.last_seen_chapter || 0) - Number(left.last_seen_chapter || 0)).slice(0, 4)
        ).slice(0, 4);
        focusCharacters.forEach((character) => {
            if (!character.location) {
                pushRisk(`${character.name} 还没锁定明确位置。`);
            }
            if (!character.status) {
                pushRisk(`${character.name} 还没锁定明确状态。`);
            }
        });

        Object.entries(items)
            .filter(([, value]) => !value?.持有者 || !value?.当前状态)
            .slice(0, 3)
            .forEach(([name, value]) => {
                if (!value?.持有者) {
                    pushRisk(`关键物品 ${name} 没有锁定持有者。`);
                }
                if (!value?.当前状态) {
                    pushRisk(`关键物品 ${name} 没有锁定当前状态。`);
                }
            });

        Object.entries(factions)
            .filter(([, value]) => !Array.isArray(value?.members) || !value.members.length)
            .slice(0, 2)
            .forEach(([name]) => {
                pushRisk(`${name} 已进入势力表，但成员名单还不明确。`);
            });

        if ((plotThreads.unresolved_foreshadows || []).length >= 6) {
            pushRisk("未回收伏笔偏多，续写时需要优先确认哪些要推进。");
        }
        if (!(plotThreads.active || []).length && (plotThreads.unresolved_foreshadows || []).length) {
            pushRisk("主线待推进项偏空，但还有未回收伏笔，容易让正文继续漂到支线上。");
        }
        if (Number(chapterMeta.chapterNumber || 0) > 0 && !Object.keys(locations).length) {
            pushRisk("目前没有可用地点总表，角色移动和场景切换容易错位。");
        }
        if ((rewards || []).some((item) => !item.owner)) {
            pushRisk("存在未锁定归属的奖励或资源，后文容易错配到别的角色。");
        }

        return risks.slice(0, 10);
    }

    flattenForeshadows() {
        const source = this.novelData.foreshadow_tracker?.foreshadows || {};
        return Object.entries(source).flatMap(([id, value]) => {
            if (Array.isArray(value)) {
                return value.map((item) => this.normalizeForeshadowItem(id, item));
            }
            return [this.normalizeForeshadowItem(id, value)];
        });
    }

    normalizeForeshadowItem(id, item) {
        const record = item && typeof item === "object" ? item : { content: String(item || "") };
        return {
            id,
            chapter: Number(record.chapter || record["埋设章节"] || record["章节"] || 0),
            content: record.content || record["内容"] || record["伏笔内容"] || "",
            status: record.status || record["状态"] || "",
            type: record.type || record["类型"] || ""
        };
    }

    collectRecentPersonalityChanges() {
        const source = this.novelData.personality_enforcer?.personality_changes || {};
        return Object.entries(source).flatMap(([name, changes]) =>
            (Array.isArray(changes) ? changes : []).map((item) => ({
                name,
                chapter: item["章节"] || item.chapter || 0,
                event: item["事件"] || item.event || "",
                reason: item["原因"] || item.reason || ""
            }))
        ).sort((left, right) => Number(right.chapter || 0) - Number(left.chapter || 0));
    }

    countForeshadowsForChapter(chapterNumber) {
        return this.flattenForeshadows().filter((item) => Number(item.chapter || 0) === Number(chapterNumber)).length;
    }

    extractChapterNumber(key) {
        const match = String(key || "").match(/(\d+)/);
        return match ? Number(match[1]) : 0;
    }

    async loadBundledPrompts() {
        try {
            const response = await fetch("prompts/prompt-manifest.json", { cache: "no-store" });
            if (!response.ok) {
                return;
            }

            const manifest = await response.json();
            const promptState = this.novelData.prompt_state;
            const definitions = manifest.prompts || [];

            for (const item of definitions) {
                if (!item?.file || promptState.saved_prompts[item.name]) {
                    continue;
                }
                try {
                    const promptResponse = await fetch(`prompts/${item.file}`, { cache: "no-store" });
                    if (!promptResponse.ok) {
                        continue;
                    }
                    const text = await promptResponse.text();
                    promptState.saved_prompts[item.name] = text;
                    if (!promptState.current_prompt && manifest.defaultPrompt === item.file) {
                        promptState.current_prompt = text;
                        promptState.selected_prompt = item.name;
                    }
                } catch (error) {
                    continue;
                }
            }

            if (!promptState.current_prompt) {
                promptState.current_prompt = this.getDesktopAlignedPromptTemplate();
            }

            this.persist(true);
            this.renderPromptLibrary();
        } catch (error) {
            Utils.log("未能加载内置提示词文件，继续使用当前模板。", "info");
        }
    }

    registerServiceWorker() {
        if (!("serviceWorker" in navigator) || !window.isSecureContext && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") {
            return;
        }
        navigator.serviceWorker.register("service-worker.js?v=20260406e").then((registration) => {
            registration.update().catch(() => {});
        }).catch(() => {});
    }

    renderSystemEditors() {
        const mappings = this.getSystemEditorMappings();
        Object.entries(mappings).forEach(([key, config]) => {
            const element = this.systemEditors[key];
            if (!element) {
                return;
            }
            const value = this.readDataByPath(config.path);
            element.value = JSON.stringify(value ?? config.fallback ?? {}, null, 2);
        });
    }

    handleVolumeInput(event) {
        const volumeCard = event.target.closest("[data-volume-index]");
        if (!volumeCard) {
            return;
        }

        const volumeIndex = Number(volumeCard.dataset.volumeIndex);
        const field = event.target.dataset.volumeField;
        if (!field) {
            return;
        }

        this.novelData.outline.volumes[volumeIndex][field] = event.target.value;
        if (field === "chapterSynopsis") {
            this.novelData.outline.volumes[volumeIndex].chapter_synopsis = event.target.value;
        }
        if (field === "title") {
            this.renderVolumeSelectors();
        }
        this.autoSave();
        this.renderDashboard();
    }

    handleVolumeActions(event) {
        const actionButton = event.target.closest("[data-volume-action]");
        if (!actionButton) {
            return;
        }

        const volumeCard = actionButton.closest("[data-volume-index]");
        const volumeIndex = Number(volumeCard.dataset.volumeIndex);
        const action = actionButton.dataset.volumeAction;

        if (action === "focus") {
            this.switchTab("outline");
            this.elements.chapterVolumeSelect.value = String(volumeIndex + 1);
            if (this.elements.chapterEditorVolumeSelect) {
                this.elements.chapterEditorVolumeSelect.value = String(volumeIndex + 1);
            }
            this.state.selectedChapterId = null;
            this.renderChapterList();
            this.clearChapterEditor();
            return;
        }

        if (action === "clear-synopsis") {
            const shouldClearSynopsis = window.confirm(`确定清空第${volumeIndex + 1}卷及后续卷的细纲吗？卷纲会保留。`);
            if (!shouldClearSynopsis) {
                return;
            }
            this.clearSynopsisFromVolume(volumeIndex + 1);
            this.persist(true);
            this.renderVolumeCards();
            this.renderDashboard();
            Utils.showMessage(`已清空第${volumeIndex + 1}卷及后续卷的细纲，卷纲已保留。`, "success");
            return;
        }

        if (action === "remove") {
            const ok = window.confirm("确定要删除这一卷吗？本卷下的章节也会一起删除。");
            if (!ok) {
                return;
            }
            this.novelData.outline.volumes.splice(volumeIndex, 1);
            this.novelData.synopsisData.volumeCount = this.novelData.outline.volumes.length || 1;
            this.elements.projectVolumeCount.value = this.novelData.synopsisData.volumeCount;
            this.state.selectedChapterId = null;
            this.clearChapterEditor();
            this.persist(true);
            this.renderAll();
        }
    }

    handleChapterListClick(event) {
        const card = event.target.closest("[data-chapter-id]");
        if (!card) {
            return;
        }
        this.selectChapter(card.dataset.chapterId);
    }

    handleChapterBatchListClick(event) {
        const card = event.target.closest("[data-chapter-id]");
        if (!card) {
            return;
        }
        this.switchTab("chapters");
        this.selectChapter(card.dataset.chapterId);
    }

    handleCharacterListClick(event) {
        const actionButton = event.target.closest("[data-character-action]");
        if (!actionButton) {
            return;
        }

        const card = actionButton.closest("[data-character-id]");
        const characterId = card.dataset.characterId;
        const action = actionButton.dataset.characterAction;

        if (action === "edit") {
            this.editCharacter(characterId);
        } else if (action === "delete") {
            this.deleteCharacter(characterId);
        }
    }

    handleCharacterListChange(event) {
        const checkbox = event.target.closest("[data-character-select]");
        if (!checkbox) {
            return;
        }
        const characterId = String(checkbox.dataset.characterSelect || "").trim();
        if (!characterId) {
            return;
        }
        if (checkbox.checked) {
            this.state.selectedCharacterIds.add(characterId);
        } else {
            this.state.selectedCharacterIds.delete(characterId);
        }
        this.updateCharacterSelectionToolbar();
    }

    updateCharacterSelectionToolbar() {
        const count = this.state.selectedCharacterIds?.size || 0;
        if (this.elements.characterSelectionCount) {
            this.elements.characterSelectionCount.textContent = `已选 ${count}`;
        }
        if (this.elements.btnClearCharacterSelection) {
            this.elements.btnClearCharacterSelection.disabled = count === 0;
        }
        if (this.elements.btnDeleteSelectedCharacters) {
            this.elements.btnDeleteSelectedCharacters.disabled = count === 0;
        }
    }

    selectAllCharacters() {
        const ids = (this.novelData.outline.characters || []).map((character) => character.id).filter(Boolean);
        this.state.selectedCharacterIds = new Set(ids);
        this.renderCharacterList();
    }

    clearCharacterSelection() {
        this.state.selectedCharacterIds = new Set();
        this.renderCharacterList();
    }

    deleteSelectedCharacters() {
        const selectedIds = Array.from(this.state.selectedCharacterIds || []);
        if (!selectedIds.length) {
            Utils.showMessage("请先勾选要删除的人物。", "info");
            return;
        }
        const ok = window.confirm(`确定要批量删除已选中的 ${selectedIds.length} 个人物吗？`);
        if (!ok) {
            return;
        }

        this.novelData.outline.characters = (this.novelData.outline.characters || []).filter(
            (item) => !this.state.selectedCharacterIds.has(item.id)
        );
        if (this.state.editingCharacterId && this.state.selectedCharacterIds.has(this.state.editingCharacterId)) {
            this.resetCharacterForm();
        }
        this.state.selectedCharacterIds = new Set();
        this.persist(true);
        this.renderCharacterList();
        this.renderDashboard();
        Utils.showMessage(`已删除 ${selectedIds.length} 个人物。`, "success");
    }

    switchTab(tabName) {
        this.state.activeTab = tabName;
        this.elements.navItems.forEach((item) => {
            item.classList.toggle("active", item.dataset.tab === tabName);
        });
        this.elements.tabPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.id === `tab-${tabName}`);
        });
        this.toggleSidebar(false);
        this.applyMobileChapterListState();
    }

    switchChapterSubview(viewName, silent = false) {
        const safeView = viewName === "draft" ? "draft" : "batch";
        this.state.activeChapterSubview = safeView;
        this.elements.chapterSubviewButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.chapterSubview === safeView);
        });
        this.elements.chapterSubviewPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.dataset.chapterSubviewPanel === safeView);
        });
        window.localStorage.setItem("novel_outline_chapter_subview", safeView);
        if (!silent && safeView === "draft" && this.state.selectedChapterId) {
            this.renderChapterList();
        }
    }

    toggleSidebar(show) {
        const active = typeof show === "boolean" ? show : !this.elements.sidebar.classList.contains("active");
        this.elements.sidebar.classList.toggle("active", active);
        this.elements.sidebarBackdrop.classList.toggle("active", active);
    }

    openSettingsModal() {
        this.loadSettingsToForm();
        this.elements.settingsModal.classList.add("active");
        this.elements.settingsModal.setAttribute("aria-hidden", "false");
    }

    closeSettingsModal() {
        this.elements.settingsModal.classList.remove("active");
        this.elements.settingsModal.setAttribute("aria-hidden", "true");
    }

    saveSettings() {
        const settings = {
            provider: this.elements.settingProvider.value,
            model: this.elements.settingModel.value.trim(),
            apiBase: this.elements.settingApiBase.value.trim(),
            rankApiUrl: this.elements.settingRankApiUrl?.value.trim() || DEFAULT_API_CONFIG.rankApiUrl,
            rankApiTimeoutMs: Math.max(
                15000,
                Number(this.elements.settingRankTimeoutSeconds?.value || (DEFAULT_API_CONFIG.rankApiTimeoutMs / 1000)) * 1000
            ),
            rankApiRetryCount: Math.max(
                1,
                Number(this.elements.settingRankRetryCount?.value || DEFAULT_API_CONFIG.rankApiRetryCount)
            ),
            apiKey: this.elements.settingApiKey.value.trim(),
            temperature: Number(this.elements.settingTemperature.value || DEFAULT_API_CONFIG.temperature),
            maxTokens: Number(this.elements.settingMaxTokens.value || DEFAULT_API_CONFIG.maxTokens),
            timeoutMs: Math.max(
                30000,
                Number(this.elements.settingTimeoutSeconds.value || (DEFAULT_API_CONFIG.timeoutMs / 1000)) * 1000
            ),
            retryCount: Math.max(1, Number(this.elements.settingRetryCount.value || DEFAULT_API_CONFIG.retryCount))
        };

        this.api.updateConfig(settings);
        Utils.showMessage("API 设置已保存。", "success");
        Utils.log("API 设置已更新。", "success");
        this.closeSettingsModal();
    }

    persist(silent = false) {
        this.syncCompatibilityFields();
        this.novelData.meta.updatedAt = new Date().toISOString();
        const ok = this.storage.save(this.novelData);
        if (!ok) {
            Utils.showMessage("保存失败，请检查浏览器存储权限。", "error");
            return false;
        }
        if (!silent) {
            Utils.showMessage("已保存到浏览器本地。", "success");
            Utils.log("数据已保存。", "success");
        }
        return true;
    }

    syncCompatibilityFields() {
        const outline = this.novelData.outline;
        const synopsis = this.novelData.synopsisData || {};
        outline.genre = outline.genre || this.novelData.genre || "";
        outline.subgenre = outline.subgenre || this.novelData.subgenre || "";
        this.novelData.genre = outline.genre || "";
        this.novelData.subgenre = outline.subgenre || "";
        synopsis.story_concept = synopsis.story_concept || outline.storyConcept || "";
        synopsis.volume_synopsis = synopsis.volume_synopsis || synopsis.volumeSynopsis || "";
        synopsis.synopsis_output = synopsis.synopsis_output || synopsis.synopsisOutput || "";
        synopsis.worldbuilding = synopsis.worldbuilding || outline.worldbuilding || "";
        const outlineVolumeCount = Array.isArray(outline.volumes) ? outline.volumes.length : 0;
        const preferredVolumeCount = outlineVolumeCount > 0
            ? outlineVolumeCount
            : Math.max(1, Number(synopsis.volumeCount || synopsis.vol_count || 5) || 5);
        synopsis.vol_count = String(preferredVolumeCount);
        synopsis.chap_count = String(synopsis.chaptersPerVolume || synopsis.chap_count || 20);
        synopsis.volumeCount = preferredVolumeCount;
        synopsis.chaptersPerVolume = Number(synopsis.chaptersPerVolume || synopsis.chap_count || 20);
        outline.total_chapters = Number(outline.total_chapters || (synopsis.volumeCount * synopsis.chaptersPerVolume) || 100);
        this.novelData.synopsisData = synopsis;
        this.novelData.synopsis_data = JSON.parse(JSON.stringify(synopsis));
        this.novelData.chapters = this.novelData.chapters || {};
        this.novelData.generatedChapterTexts = this.novelData.generatedChapterTexts && typeof this.novelData.generatedChapterTexts === "object"
            ? this.novelData.generatedChapterTexts
            : {};
        this.novelData.idea_lab = this.novelData.idea_lab && typeof this.novelData.idea_lab === "object"
            ? this.novelData.idea_lab
            : JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.idea_lab));
        this.novelData.idea_lab.keyword = this.novelData.idea_lab.keyword || "";
        this.novelData.idea_lab.extra_note = this.novelData.idea_lab.extra_note || "";
        this.novelData.idea_lab.version_count = Math.min(5, Math.max(3, Number(this.novelData.idea_lab.version_count || 4) || 4));
        this.novelData.idea_lab.use_market_trends = this.novelData.idea_lab.use_market_trends === true;
        this.novelData.idea_lab.market_summary = this.novelData.idea_lab.market_summary || "";
        this.novelData.idea_lab.market_items = Array.isArray(this.novelData.idea_lab.market_items) ? this.novelData.idea_lab.market_items : [];
        this.novelData.idea_lab.market_diagnostics = this.novelData.idea_lab.market_diagnostics && typeof this.novelData.idea_lab.market_diagnostics === "object"
            ? this.novelData.idea_lab.market_diagnostics
            : {};
        this.novelData.idea_lab.market_selected_categories = Array.isArray(this.novelData.idea_lab.market_selected_categories)
            ? this.novelData.idea_lab.market_selected_categories
            : [];
        this.novelData.idea_lab.market_source_breakdown = this.novelData.idea_lab.market_source_breakdown && typeof this.novelData.idea_lab.market_source_breakdown === "object"
            ? this.novelData.idea_lab.market_source_breakdown
            : {};
        this.novelData.idea_lab.market_status = this.novelData.idea_lab.market_status || "";
        this.novelData.idea_lab.market_error = this.novelData.idea_lab.market_error || "";
        this.novelData.idea_lab.selected_id = this.novelData.idea_lab.selected_id || "";
        this.novelData.idea_lab.results = Array.isArray(this.novelData.idea_lab.results) ? this.novelData.idea_lab.results : [];
        this.novelData.prompt_state = this.novelData.prompt_state || JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.prompt_state));
        this.novelData.prompt_state.current_prompt = this.novelData.prompt_state.current_prompt || this.getDesktopAlignedPromptTemplate();
        this.novelData.prompt_state.saved_prompts = this.novelData.prompt_state.saved_prompts || {};
        this.novelData.generated_context = this.novelData.generated_context || JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.generated_context));
        this.novelData.genre_extensions = this.novelData.genre_extensions && typeof this.novelData.genre_extensions === "object"
            ? this.novelData.genre_extensions
            : {};
        this.novelData.foreshadows = Array.isArray(this.novelData.foreshadows) ? this.novelData.foreshadows : [];
        this.novelData.chapter_rhythms = this.novelData.chapter_rhythms && typeof this.novelData.chapter_rhythms === "object"
            ? this.novelData.chapter_rhythms
            : {};
        this.novelData.chapter_emotions = this.novelData.chapter_emotions && typeof this.novelData.chapter_emotions === "object"
            ? this.novelData.chapter_emotions
            : {};
        this.novelData.chapter_analysis_reports = this.novelData.chapter_analysis_reports && typeof this.novelData.chapter_analysis_reports === "object"
            ? this.novelData.chapter_analysis_reports
            : {};
        this.novelData.chapter_qc_reports = this.novelData.chapter_qc_reports && typeof this.novelData.chapter_qc_reports === "object"
            ? this.novelData.chapter_qc_reports
            : {};
        this.novelData.supporting_characters = this.novelData.supporting_characters && typeof this.novelData.supporting_characters === "object"
            ? this.novelData.supporting_characters
            : {};
        this.novelData.extra_character_records = this.novelData.extra_character_records && typeof this.novelData.extra_character_records === "object"
            ? this.novelData.extra_character_records
            : {};
        this.novelData.used_extras_characters = Array.isArray(this.novelData.used_extras_characters)
            ? this.novelData.used_extras_characters
            : [];
        this.novelData.genre_progress_tracker = this.novelData.genre_progress_tracker && typeof this.novelData.genre_progress_tracker === "object"
            ? this.novelData.genre_progress_tracker
            : {
                current_genre: "",
                current_subgenre: "",
                pregnancy_progress: {},
                rank_progress: {},
                status_progress: {},
                progress_events: []
            };
        this.novelData.genre_progress_tracker.current_genre = this.novelData.genre || outline.genre || "";
        this.novelData.genre_progress_tracker.current_subgenre = this.novelData.subgenre || outline.subgenre || "";
        this.novelData.genre_progress_tracker.pregnancy_progress = this.novelData.genre_progress_tracker.pregnancy_progress && typeof this.novelData.genre_progress_tracker.pregnancy_progress === "object"
            ? this.novelData.genre_progress_tracker.pregnancy_progress
            : {};
        this.novelData.genre_progress_tracker.rank_progress = this.novelData.genre_progress_tracker.rank_progress && typeof this.novelData.genre_progress_tracker.rank_progress === "object"
            ? this.novelData.genre_progress_tracker.rank_progress
            : {};
        this.novelData.genre_progress_tracker.status_progress = this.novelData.genre_progress_tracker.status_progress && typeof this.novelData.genre_progress_tracker.status_progress === "object"
            ? this.novelData.genre_progress_tracker.status_progress
            : {};
        this.novelData.genre_progress_tracker.progress_events = Array.isArray(this.novelData.genre_progress_tracker.progress_events)
            ? this.novelData.genre_progress_tracker.progress_events
            : [];

        (outline.volumes || []).forEach((volume) => {
            volume.chapter_synopsis = volume.chapterSynopsis || volume.chapter_synopsis || "";
            volume.chapterSynopsis = volume.chapterSynopsis || volume.chapter_synopsis || "";
            (volume.chapters || []).forEach((chapter) => {
                const chapterContent = String(chapter.content || "").trim();
                const mirrorKeys = [chapter.uuid, chapter.id].filter(Boolean);
                if (chapterContent) {
                    mirrorKeys.forEach((key) => {
                        this.novelData.chapters[key] = chapterContent;
                        this.novelData.generatedChapterTexts[key] = chapterContent;
                    });
                    return;
                }
                mirrorKeys.forEach((key) => {
                    if (Object.prototype.hasOwnProperty.call(this.novelData.chapters, key)) {
                        delete this.novelData.chapters[key];
                    }
                    if (Object.prototype.hasOwnProperty.call(this.novelData.generatedChapterTexts, key)) {
                        delete this.novelData.generatedChapterTexts[key];
                    }
                });
            });
        });

        this.ensureWorldStateManager();
        this.rebuildUsedExtraCharacters();
        this.syncWorldStateManager();
        this.syncGeneratedContexts();
    }

    syncGeneratedContexts() {
        const volumeSynopsisText = this.buildCombinedVolumeSynopsisText();
        const chapterSynopsisText = this.buildCombinedChapterSynopsisText();
        const outline = this.novelData.outline;
        const synopsis = this.ensureSynopsisStores();

        this.novelData.generated_context.worldbuilding = outline.worldbuilding || "";

        synopsis.volumeSynopsis = volumeSynopsisText;
        synopsis.volume_synopsis = volumeSynopsisText;
        this.novelData.generated_context.volume_synopsis = volumeSynopsisText;

        outline.user_context = chapterSynopsisText;
        this.novelData.generated_context.chapter_synopsis = chapterSynopsisText;
    }

    ensureSynopsisStores() {
        this.novelData.synopsisData = this.novelData.synopsisData && typeof this.novelData.synopsisData === "object"
            ? this.novelData.synopsisData
            : {};
        this.novelData.generated_context = this.novelData.generated_context && typeof this.novelData.generated_context === "object"
            ? this.novelData.generated_context
            : {};

        const synopsis = this.novelData.synopsisData;
        synopsis.synopsis_volumes = synopsis.synopsis_volumes && typeof synopsis.synopsis_volumes === "object"
            ? synopsis.synopsis_volumes
            : {};
        synopsis.main_characters = synopsis.main_characters && typeof synopsis.main_characters === "object"
            ? synopsis.main_characters
            : {};
        synopsis.locked_character_names = synopsis.locked_character_names && typeof synopsis.locked_character_names === "object"
            ? synopsis.locked_character_names
            : {};
        synopsis.vague_to_name_mapping = synopsis.vague_to_name_mapping && typeof synopsis.vague_to_name_mapping === "object"
            ? synopsis.vague_to_name_mapping
            : {};
        synopsis.vague_supporting_roles = synopsis.vague_supporting_roles && typeof synopsis.vague_supporting_roles === "object"
            ? synopsis.vague_supporting_roles
            : {};
        return synopsis;
    }

    rebuildSynopsisVolumeStore() {
        const synopsis = this.ensureSynopsisStores();
        const nextSynopsisVolumes = {};

        (this.novelData.outline?.volumes || []).forEach((volume, index) => {
            const text = String(volume?.chapterSynopsis || volume?.chapter_synopsis || "").trim();
            if (text) {
                nextSynopsisVolumes[String(index + 1)] = text;
            }
        });

        synopsis.synopsis_volumes = nextSynopsisVolumes;
        return nextSynopsisVolumes;
    }

    pruneSynopsisCharacterCaches() {
        const synopsis = this.ensureSynopsisStores();
        synopsis.main_characters = {};
        synopsis.locked_character_names = {};
        synopsis.vague_to_name_mapping = {};
        synopsis.vague_supporting_roles = {};
    }

    clearSynopsisFromVolume(startVolumeNumber) {
        const synopsis = this.ensureSynopsisStores();
        const volumes = this.novelData.outline?.volumes || [];
        const maxVolumeNumber = Math.max(1, volumes.length);
        const volumeNumber = Math.min(
            Math.max(1, Number(startVolumeNumber) || 1),
            maxVolumeNumber
        );

        for (let index = volumeNumber - 1; index < volumes.length; index += 1) {
            const volume = volumes[index];
            if (!volume || typeof volume !== "object") {
                continue;
            }
            volume.chapterSynopsis = "";
            volume.chapter_synopsis = "";
        }

        this.rebuildSynopsisVolumeStore();
        this.syncGeneratedContexts();
        this.pruneSynopsisCharacterCaches();

        const currentVolumeNumber = Math.max(1, Number(synopsis.currentVolume || this.elements?.synopsisCurrentVolume?.value || 1) || 1);
        const currentVolume = volumes[currentVolumeNumber - 1];
        const currentSynopsisText = String(currentVolume?.chapterSynopsis || currentVolume?.chapter_synopsis || "").trim();

        synopsis.synopsisOutput = currentSynopsisText;
        synopsis.synopsis_output = currentSynopsisText;

        if (this.elements.volumeSynopsisText) {
            this.elements.volumeSynopsisText.value = synopsis.volumeSynopsis || synopsis.volume_synopsis || "";
        }
        if (this.elements.synopsisOutput) {
            this.elements.synopsisOutput.value = currentSynopsisText;
        }
    }

    buildCombinedVolumeSynopsisText() {
        return (this.novelData.outline.volumes || [])
            .map((volume, index) => {
                if (!volume.summary && !volume.cliffhanger) {
                    return "";
                }

                const lines = [
                    `【第${index + 1}卷 ${volume.title || `第${index + 1}卷`}】`,
                    volume.summary || ""
                ];

                if (volume.cliffhanger) {
                    lines.push(`卷尾钩子：${volume.cliffhanger}`);
                }

                return lines.filter(Boolean).join("\n");
            })
            .filter(Boolean)
            .join("\n\n");
    }

    buildCombinedChapterSynopsisText() {
        return (this.novelData.outline.volumes || [])
            .map((volume, index) => {
                const text = volume.chapterSynopsis || volume.chapter_synopsis || "";
                if (!text) {
                    return "";
                }

                return `【第${index + 1}卷 ${volume.title || `第${index + 1}卷`}细纲】\n${text}`;
            })
            .filter(Boolean)
            .join("\n\n");
    }

    exportData() {
        const fileName = `${this.novelData.outline.title || "novel-outline"}_${Date.now()}.json`;
        this.storage.export(fileName, this.novelData);
        Utils.showMessage("已导出 JSON 文件。", "success");
        Utils.log("已导出当前项目。", "success");
    }

    hasProjectDataToClear() {
        const outline = this.novelData.outline || {};
        const synopsis = this.novelData.synopsisData || this.novelData.synopsis_data || {};
        const volumes = Array.isArray(outline.volumes) ? outline.volumes : [];
        const characters = Array.isArray(outline.characters) ? outline.characters : [];
        const chapters = volumes.reduce((total, volume) => total + (volume.chapters || []).length, 0);

        const textFields = [
            outline.title,
            outline.theme,
            outline.storyConcept,
            outline.worldbuilding,
            outline.detailed_outline,
            this.novelData.global_setting_note,
            synopsis.volumeSynopsis,
            synopsis.volume_synopsis,
            synopsis.synopsisOutput,
            synopsis.synopsis_output
        ];

        if (textFields.some((value) => String(value || "").trim())) {
            return true;
        }

        if (chapters > 0 || characters.length > 0 || volumes.some((volume) => String(volume.summary || volume.title || "").trim())) {
            return true;
        }

        return false;
    }

    clearCurrentProject() {
        if (!this.hasProjectDataToClear()) {
            Utils.showMessage("当前项目已经是空的。", "info");
            return;
        }

        const shouldExport = window.confirm(
            "清空当前项目之前，必须先保存当前项目 JSON 备份。\n\n点击“确定”后，系统会先自动导出一份完整 JSON，然后再进入清空确认。"
        );
        if (!shouldExport) {
            return;
        }

        this.exportData();

        const confirmText = window.prompt(
            "JSON 备份已经开始导出。\n\n确认你已经保存好这份 JSON 后，请输入：已保存JSON"
        );
        if ((confirmText || "").trim() !== "已保存JSON") {
            Utils.showMessage("未完成 JSON 备份确认，已取消清空。", "info");
            Utils.log("清空当前项目已取消：未完成 JSON 备份确认。", "info");
            return;
        }

        const finalConfirm = window.confirm(
            "最后确认：这会清空当前项目中的设定、世界观、卷纲、细纲、章纲、人物和正文内容。\n\n已导出的 JSON 不会受影响。确定继续吗？"
        );
        if (!finalConfirm) {
            return;
        }

        this.novelData = this.storage.getDefaultData();
        this.api = new AIAPIClient();
        this.generator = new NovelGenerator(this.api);
        this.state.selectedChapterId = null;
        this.state.editingCharacterId = null;

        if (this.elements.importFileInput) {
            this.elements.importFileInput.value = "";
        }

        this.ensureBaseData();
        this.syncFormFromData();
        this.clearChapterEditor();
        this.resetCharacterForm();
        this.persist(true);
        this.renderAll();
        this.switchTab("dashboard");

        Utils.showMessage("当前项目已清空。建议后续通过 JSON 重新导入旧项目。", "success");
        Utils.log("已清空当前项目，JSON 备份请妥善保存。", "success");
    }

    buildChaptersTxtExport() {
        const title = this.novelData.outline.title || "未命名小说";
        const genre = this.novelData.outline.subgenre || this.novelData.outline.genre || this.novelData.subgenre || this.novelData.genre || "";
        const theme = this.novelData.outline.theme || "";
        const volumes = (this.novelData.outline.volumes || []).map((volume, index) => ({
            ...volume,
            volumeNumber: Number(volume.volume_number || index + 1),
            chapters: [...(volume.chapters || [])].sort(Utils.chapterSort)
        }));

        const chapterCount = volumes.reduce((total, volume) => total + volume.chapters.length, 0);
        if (!chapterCount) {
            throw new Error("当前还没有可导出的章节。");
        }

        const lines = [
            title,
            genre ? `题材：${genre}` : "",
            theme ? `主题：${theme}` : "",
            ""
        ].filter(Boolean);

        volumes.forEach((volume, volumeIndex) => {
            if (!volume.chapters.length) {
                return;
            }

            lines.push(`========== 第${volume.volumeNumber || volumeIndex + 1}卷 ${volume.title || `第${volume.volumeNumber || volumeIndex + 1}卷`} ==========`); 
            if (volume.summary) {
                lines.push(volume.summary);
                lines.push("");
            }

            volume.chapters.forEach((chapter) => {
                const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
                lines.push(`第${chapterNumber}章 ${chapter.title || "未命名章节"}`);
                lines.push("");

                const content = String(chapter.content || "").trim();
                if (content) {
                    lines.push(content);
                } else {
                    lines.push("【暂无正文】");
                    if (chapter.summary) {
                        lines.push("");
                        lines.push("【章节大纲】");
                        lines.push(String(chapter.summary).trim());
                    }
                }

                lines.push("");
                lines.push("");
            });
        });

        return lines.join("\n");
    }

    buildBodyOnlyChaptersTxtExport() {
        const volumes = (this.novelData.outline.volumes || []).map((volume, index) => ({
            ...volume,
            volumeNumber: Number(volume.volume_number || index + 1),
            chapters: [...(volume.chapters || [])].sort(Utils.chapterSort)
        }));

        const lines = [];
        let exportedChapterCount = 0;

        volumes.forEach((volume) => {
            volume.chapters.forEach((chapter) => {
                const content = String(chapter.content || "").trim();
                if (!content) {
                    return;
                }
                const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
                lines.push(`第${chapterNumber}章 ${chapter.title || "未命名章节"}`.trim());
                lines.push("");
                lines.push(content);
                lines.push("");
                lines.push("");
                exportedChapterCount += 1;
            });
        });

        if (!exportedChapterCount) {
            throw new Error("当前还没有可导出的正文内容。");
        }

        return lines.join("\n");
    }

    exportChaptersTxt() {
        const baseName = this.novelData.outline.title || "novel-outline";
        const text = this.buildBodyOnlyChaptersTxtExport();
        Utils.downloadText(text, `${baseName}_chapters_${Date.now()}.txt`);
        Utils.showMessage("已导出章节 TXT 文件。", "success");
        Utils.log("已导出章节 TXT。", "success");
    }

    copyCurrentChapterSummary() {
        const summary = this.elements.chapterSummaryInput.value.trim();
        if (!summary) {
            Utils.showMessage("当前章节还没有章纲。", "info");
            return;
        }
        Utils.copyText(summary);
        Utils.showMessage("当前章纲已复制。", "success");
    }

    exportCurrentChapterTxt() {
        const chapter = this.getChapterFromEditor();
        if (!chapter || !chapter.number) {
            Utils.showMessage("请先选择章节。", "info");
            return;
        }

        const volumeNumber = Number(this.elements.chapterEditorVolumeSelect?.value || this.elements.chapterVolumeSelect?.value || 1);
        const text = String(chapter.content || "").trim();
        if (!text) {
            Utils.showMessage("当前章节还没有正文，单章 TXT 只导出正文文本。", "info");
            return;
        }
        const baseName = this.novelData.outline.title || "novel-outline";
        const chapterLabel = `第${chapter.number}章_${chapter.title || `chapter_${chapter.number}`}`.replace(/[\\/:*?"<>|]/g, "_");
        Utils.downloadText(text, `${baseName}_${chapterLabel}.txt`);
        Utils.showMessage("本章 TXT 已导出。", "success");
    }

    buildSingleChapterTxtExport(chapter, volumeNumber) {
        const lines = [
            this.novelData.outline.title || "未命名小说",
            `第${Number(volumeNumber || 1)}卷`,
            `第${chapter.number}章 ${chapter.title || ""}`.trim(),
            ""
        ];

        if (chapter.summary) {
            lines.push("【章节大纲】");
            lines.push(chapter.summary);
            lines.push("");
        }

        if (chapter.chapter_setting_note) {
            lines.push("【章节设定提醒】");
            lines.push(chapter.chapter_setting_note);
            lines.push("");
        }

        lines.push("【章节正文】");
        lines.push((chapter.content || "").trim() || "暂无正文，当前导出的是章节大纲。");
        return lines.join("\n");
    }

    analyzeCurrentChapter() {
        const chapter = this.getChapterFromEditor();
        if (!chapter || !chapter.number) {
            Utils.showMessage("请先选择章节。", "info");
            return;
        }
        if (!(chapter.content || "").trim()) {
            Utils.showMessage("请先生成或填写正文后再分析。", "info");
            return;
        }

        if (!String(chapter.content || "").trim() && Number(chapter.number || 0) > 0) {
            delete this.novelData.extra_character_records?.[`chapter_${Number(chapter.number || 0)}`];
            this.rebuildUsedExtraCharacters();
        }
        this.refreshChapterReports(chapter);
        this.persist(true);
        this.renderChapterContextPreview(chapter);
        Utils.showMessage("章节分析报告已更新。", "success");
        Utils.log(`第 ${chapter.number} 章分析报告已更新。`, "success");
    }

    runCurrentChapterQc() {
        const chapter = this.getChapterFromEditor();
        if (!chapter || !chapter.number) {
            Utils.showMessage("请先选择章节。", "info");
            return;
        }
        if (!(chapter.content || "").trim()) {
            Utils.showMessage("请先生成或填写正文后再质检。", "info");
            return;
        }

        this.refreshChapterReports(chapter);
        this.persist(true);
        this.renderChapterContextPreview(chapter);
        Utils.showMessage("章节质检结果已更新。", "success");
        Utils.log(`第 ${chapter.number} 章质检完成。`, "success");
    }

    async manualFilterCurrentChapter() {
        const chapter = this.getChapterFromEditor();
        const content = String(chapter?.content || "").trim();
        if (!chapter || !chapter.number) {
            throw new Error("请先选择章节。");
        }
        if (!content) {
            throw new Error("当前章节还没有正文可供去味。");
        }

        await this.runWithLoading("正在进行 AI 去味...", async () => {
            const filtered = await this.generator.filterAiFlavorText(content, this.novelData);
            if (!filtered || filtered === content) {
                Utils.showMessage("当前正文未检测到明显 AI 味，已保持原文。", "info");
                return;
            }
            this.elements.chapterContentInput.value = filtered;
            this.saveChapterEditor();
            Utils.showMessage("当前章节已完成 AI 去味。", "success");
            Utils.log(`第 ${chapter.number} 章已执行手动去味。`, "success");
        });
    }

    refreshChapterWorkspace() {
        this.renderChapterList();
        const chapter = this.getChapterFromEditor();
        this.renderChapterContextPreview(chapter);
        Utils.showMessage("章节列表已刷新。", "success");
    }

    batchDeleteChapterRange() {
        const volume = this.getCurrentChapterVolume();
        if (!volume || !(volume.chapters || []).length) {
            Utils.showMessage("当前卷还没有章节。", "info");
            return;
        }

        const startInput = window.prompt("请输入要删除的起始章号：", "1");
        if (startInput === null) {
            return;
        }
        const endInput = window.prompt("请输入要删除的结束章号：", startInput);
        if (endInput === null) {
            return;
        }

        const start = Number(startInput);
        const end = Number(endInput);
        if (!start || !end || start > end) {
            Utils.showMessage("请输入有效的章节范围。", "error");
            return;
        }

        const deleteSet = new Set();
        const cleanupCandidates = new Set();
        volume.chapters.forEach((chapter) => {
            const number = Number(chapter.number || 0);
            if (number >= start && number <= end) {
                deleteSet.add(chapter.id);
                this.collectCharacterNamesFromChapterArtifacts(chapter, {
                    includeOutline: true,
                    includeContent: true,
                    includeStoredExtras: true
                }).forEach((name) => cleanupCandidates.add(name));
                this.clearStoredChapterMirrors(chapter);
                delete this.novelData.chapter_analysis_reports?.[`chapter_${number}`];
                delete this.novelData.chapter_qc_reports?.[`chapter_${number}`];
                delete this.novelData.chapter_rhythms?.[`第${number}章`];
                delete this.novelData.chapter_emotions?.[`第${number}章`];
                delete this.novelData.chapter_snapshot?.snapshots?.[`chapter_${number}`];
            }
        });

        if (!deleteSet.size) {
            Utils.showMessage("指定范围内没有可删除的章节。", "info");
            return;
        }

        const ok = window.confirm(`确定删除第 ${start}-${end} 章吗？本卷范围内匹配到的章节会一并删除。`);
        if (!ok) {
            return;
        }

        volume.chapters = volume.chapters.filter((chapter) => !deleteSet.has(chapter.id));
        this.rollbackStateSystemsToChapter(start - 1);
        const cleanupResult = this.cleanupOrphanedCharacterArtifacts({
            candidateNames: cleanupCandidates
        });
        if (this.state.selectedChapterId && deleteSet.has(this.state.selectedChapterId)) {
            this.state.selectedChapterId = null;
            this.clearChapterEditor();
        }

        this.persist(true);
        this.renderChapterList();
        this.renderDashboard();
        this.renderAdvancedState();
        if (cleanupResult.changed) {
            Utils.log(`已同步清理旧角色残留 ${cleanupResult.removedCount} 个。`, "info");
        }
        Utils.log(`状态系统已回滚到第 ${Math.max(0, start - 1)} 章结束时的状态。`, "info");
        Utils.showMessage(`已删除 ${deleteSet.size} 个章节。`, "success");
        Utils.log(`已批量删除第 ${start}-${end} 章范围内的 ${deleteSet.size} 个章节。`, "success");
    }

    refreshChapterReports(chapter) {
        if (!chapter || !chapter.number || !(chapter.content || "").trim()) {
            return;
        }
        this.novelData.chapter_analysis_reports[`chapter_${chapter.number}`] = this.buildChapterAnalysisReport(chapter);
        this.novelData.chapter_qc_reports[`chapter_${chapter.number}`] = this.buildChapterQcReport(chapter);
    }

    async importData(event) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const data = await Utils.readJSONFile(file);
            this.novelData = this.storage.normalize(data);
            this.api = new AIAPIClient();
            this.generator = new NovelGenerator(this.api);
            this.ensureBaseData();
            this.rehydrateDerivedChapterArtifacts();
            this.syncFormFromData();
            this.renderAll();
            this.clearChapterEditor();
            this.resetCharacterForm();
            this.persist(true);
            Utils.showMessage("项目已导入。", "success");
            Utils.log(`已导入文件：${file.name}`, "success");
        } catch (error) {
            Utils.showMessage(error.message, "error");
            Utils.log(error.message, "error");
        } finally {
            event.target.value = "";
        }
    }

    ensureVolumeCount(count, renderAfter = true) {
        const safeCount = Math.max(1, Number(count || 1));
        while (this.novelData.outline.volumes.length < safeCount) {
            const nextIndex = this.novelData.outline.volumes.length;
            this.novelData.outline.volumes.push(this.createEmptyVolume(nextIndex));
        }
        if (renderAfter) {
            this.renderAll();
        }
    }

    createEmptyVolume(index) {
        return {
            id: Utils.uid("volume"),
            title: `第${index + 1}卷`,
            summary: "",
            cliffhanger: "",
            chapterSynopsis: "",
            chapters: []
        };
    }

    addVolume() {
        this.novelData.outline.volumes.push(this.createEmptyVolume(this.novelData.outline.volumes.length));
        this.novelData.synopsisData.volumeCount = this.novelData.outline.volumes.length;
        this.elements.projectVolumeCount.value = this.novelData.synopsisData.volumeCount;
        this.persist(true);
        this.renderAll();
        Utils.showMessage("已新增一卷。", "success");
    }

    clearVolumes() {
        const ok = window.confirm("确定要清空所有卷和章节吗？这个操作不可恢复。");
        if (!ok) {
            return;
        }
        this.novelData.outline.volumes = [];
        this.novelData.outline.user_context = "";
        this.novelData.synopsisData.volumeCount = 1;
        this.novelData.synopsisData.volumeSynopsis = "";
        this.novelData.synopsisData.volume_synopsis = "";
        this.novelData.synopsisData.volume_plan = [];
        this.novelData.synopsisData.volumePlan = [];
        this.novelData.synopsisData.synopsisOutput = "";
        this.novelData.synopsisData.synopsis_output = "";
        this.novelData.synopsisData.synopsis_volumes = {};
        this.novelData.generated_context = this.novelData.generated_context && typeof this.novelData.generated_context === "object"
            ? this.novelData.generated_context
            : {};
        this.novelData.generated_context.volume_synopsis = "";
        this.novelData.generated_context.chapter_synopsis = "";
        this.elements.projectVolumeCount.value = 1;
        this.state.selectedChapterId = null;
        this.clearChapterEditor();
        this.ensureVolumeCount(1, false);
        this.syncGeneratedContexts();
        this.persist(true);
        this.renderAll();
        Utils.showMessage("卷结构已清空。", "success");
    }

    clearWorldbuilding() {
        const currentText = String(this.elements.worldbuildingText?.value || this.novelData.outline.worldbuilding || "").trim();
        if (!currentText) {
            Utils.showMessage("世界观本来就是空的。", "info");
            return;
        }

        const ok = window.confirm("确定清空当前世界观吗？");
        if (!ok) {
            return;
        }

        this.novelData.outline.worldbuilding = "";
        this.novelData.synopsisData.worldbuilding = "";
        if (this.elements.worldbuildingText) {
            this.elements.worldbuildingText.value = "";
        }
        this.persist(true);
        this.renderDashboard();
        Utils.showMessage("世界观已清空。", "success");
    }

    clearVolumeSynopsis() {
        const hasVolumeSummary = String(this.elements.volumeSynopsisText?.value || this.novelData.synopsisData.volumeSynopsis || "").trim();
        const volumeCount = (this.novelData.outline.volumes || []).length;
        if (!hasVolumeSummary && !volumeCount) {
            Utils.showMessage("卷纲本来就是空的。", "info");
            return;
        }

        const ok = window.confirm("确定清空卷纲吗？这会删除当前卷结构、卷摘要和卷内章纲。");
        if (!ok) {
            return;
        }

        const preservedVolumeCount = volumeCount > 0
            ? volumeCount
            : Math.max(
                1,
                Number(
                    this.novelData.synopsisData.volumeCount
                    || this.novelData.synopsisData.vol_count
                    || this.elements.projectVolumeCount?.value
                    || 5
                ) || 5
            );

        this.novelData.outline.volumes = [];
        this.novelData.outline.user_context = "";
        this.novelData.synopsisData.volumeSynopsis = "";
        this.novelData.synopsisData.volume_synopsis = "";
        this.novelData.synopsisData.volume_plan = [];
        this.novelData.synopsisData.volumePlan = [];
        this.novelData.synopsisData.synopsisOutput = "";
        this.novelData.synopsisData.synopsis_output = "";
        this.novelData.synopsisData.synopsis_volumes = {};
        this.novelData.synopsisData.volumeCount = preservedVolumeCount;
        this.novelData.synopsisData.vol_count = String(preservedVolumeCount);
        this.novelData.generated_context = this.novelData.generated_context && typeof this.novelData.generated_context === "object"
            ? this.novelData.generated_context
            : {};
        this.novelData.generated_context.volume_synopsis = "";
        this.novelData.generated_context.chapter_synopsis = "";
        if (this.elements.projectVolumeCount) {
            this.elements.projectVolumeCount.value = String(preservedVolumeCount);
        }
        if (this.elements.volumeSynopsisText) {
            this.elements.volumeSynopsisText.value = "";
        }
        this.state.selectedChapterId = null;
        this.clearChapterEditor();
        this.ensureVolumeCount(preservedVolumeCount, false);
        this.syncGeneratedContexts();
        this.novelData.synopsis_data = JSON.parse(JSON.stringify(this.novelData.synopsisData));
        this.persist(true);
        this.renderAll();
        Utils.showMessage("卷纲已清空。", "success");
    }

    async runWithLoading(message, task) {
        try {
            Utils.showLoading(message);
            return await task();
        } catch (error) {
            error.__handled = true;
            Utils.showMessage(error.message || "处理失败", "error");
            Utils.log(error.message || "处理失败", "error");
            throw error;
        } finally {
            Utils.hideLoading();
        }
    }

    getProjectPayload() {
        return {
            title: this.elements.projectTitle.value.trim(),
            concept: this.elements.projectConcept.value.trim(),
            genre: this.elements.projectGenre.value,
            subgenre: this.elements.projectSubgenre.value || this.elements.projectGenre.value,
            theme: this.elements.projectTheme.value.trim(),
            worldbuilding: this.elements.worldbuildingText.value.trim(),
            volumeCount: Number(this.elements.projectVolumeCount.value || 5),
            chaptersPerVolume: Number(this.elements.projectChaptersPerVolume.value || 20)
        };
    }

    validateProjectBase() {
        const payload = this.getProjectPayload();
        if (!payload.title || !payload.concept) {
            throw new Error("请先填写小说标题和故事概念。");
        }
        return payload;
    }

    buildWorkflowDiagnostics() {
        const outline = this.novelData.outline || {};
        const volumes = outline.volumes || [];
        const chapters = volumes.flatMap((volume) => volume.chapters || []);
        const volumeSummaryCount = volumes.filter((volume) => String(volume.summary || "").trim()).length;
        const chapterSynopsisCount = volumes.filter((volume) => String(volume.chapterSynopsis || volume.chapter_synopsis || "").trim()).length;
        const chapterOutlineCount = chapters.filter((chapter) => String(chapter.summary || "").trim()).length;
        const chapterContentCount = chapters.filter((chapter) => String(chapter.content || "").trim()).length;
        const characterCount = (outline.characters || []).length;
        const checks = {
            base: Boolean(String(outline.title || "").trim() && String(outline.storyConcept || "").trim() && String(outline.genre || outline.subgenre || "").trim()),
            worldbuilding: Boolean(String(outline.worldbuilding || "").trim()),
            volumeSynopsis: volumeSummaryCount > 0,
            chapterSynopsis: chapterSynopsisCount > 0,
            chapterOutline: chapterOutlineCount > 0,
            characterCards: characterCount > 0,
            chapterContent: chapterContentCount > 0
        };
        const completedCount = Object.values(checks).filter(Boolean).length;
        const totalCount = Object.keys(checks).length;

        let nextAction = "可以继续补章纲、人物卡或正文，整体流程已经接上了。";
        if (!checks.base) {
            nextAction = "先补齐标题、题材和故事概念，后面的世界观和卷纲才会稳。";
        } else if (!checks.worldbuilding) {
            nextAction = "建议先生成世界观，后面的卷纲、细纲和正文都会更稳。";
        } else if (!checks.volumeSynopsis) {
            nextAction = "下一步最合适的是先生成卷纲，先把每卷大方向定住。";
        } else if (chapterSynopsisCount < Math.max(1, volumes.length)) {
            nextAction = "把各卷细纲尽量补齐，后面的章纲和正文连续性会更好。";
        } else if (!checks.chapterOutline) {
            nextAction = "可以开始批量生成章纲了，建议按卷分段推进。";
        } else if (!checks.characterCards) {
            nextAction = "章纲已经有了，建议补人物卡，后面正文一致性会更稳。";
        } else if (!checks.chapterContent) {
            nextAction = "可以开始扩写正文，优先从当前卷的前几章试跑。";
        }

        return {
            checks,
            volumes,
            chapters,
            volumeSummaryCount,
            chapterSynopsisCount,
            chapterOutlineCount,
            chapterContentCount,
            characterCount,
            completedCount,
            totalCount,
            nextAction
        };
    }

    ensureWorkflowReady(step, context = {}) {
        const diagnostics = this.buildWorkflowDiagnostics();
        const volume = context.volume || this.getCurrentChapterVolume();
        const chapter = context.chapter || (typeof this.getChapterFromEditor === "function" ? this.getChapterFromEditor() : null);
        const errors = [];
        const warnings = [];

        if (step === "volumeSynopsis") {
            if (!diagnostics.checks.base) {
                errors.push("请先补齐标题、题材和故事概念，再生成卷纲。");
            }
            if (!diagnostics.checks.worldbuilding) {
                errors.push("请先生成或填写世界观，再生成卷纲。");
            }
        }

        if (step === "chapterSynopsis") {
            if (!diagnostics.checks.base) {
                errors.push("请先补齐基础设定。");
            }
            if (!diagnostics.checks.worldbuilding) {
                errors.push("请先生成或填写世界观，再生成细纲。");
            }
            if (!volume || !String(volume.summary || "").trim()) {
                errors.push("请先准备当前卷的卷纲摘要，再生成本卷细纲。");
            }
        }

        if (step === "chapterOutlineBatch") {
            if (!volume) {
                errors.push("请先选择一个卷。");
            }
            if (!diagnostics.checks.worldbuilding) {
                errors.push("请先生成或填写世界观，再生成章纲。");
            }
            if (!volume || !String(volume.chapterSynopsis || volume.chapter_synopsis || "").trim()) {
                errors.push("请先生成当前卷细纲，再批量生成章纲。");
            }
            if (!String(this.novelData.outline.detailed_outline || "").trim()) {
                warnings.push("当前还没有详细大纲，章纲会缺一层长期约束，建议后续补上。");
            }
        }

        if (step === "chapterContent") {
            if (!volume) {
                errors.push("请先选择一个卷。");
            }
            if (!chapter || !Number(chapter.number || 0) || !String(chapter.summary || "").trim()) {
                errors.push("请先选中章节，并确保章节号和章纲都已填写。");
            }
            if (!diagnostics.checks.worldbuilding) {
                warnings.push("当前没有世界观文本，正文约束会变弱。");
            }
            if (!diagnostics.checks.characterCards) {
                warnings.push("当前角色卡还是空的，正文一致性会更依赖章纲和追踪器。");
            }
        }

        warnings.forEach((message) => Utils.log(`流程提醒：${message}`, "info"));
        if (errors.length) {
            throw new Error(errors[0]);
        }
        return diagnostics;
    }

    async generateWorldbuilding() {
        const payload = this.validateProjectBase();
        await this.runWithLoading("正在生成世界观...", async () => {
            const result = await this.generator.generateWorldbuilding(payload);
            this.novelData.outline.title = payload.title;
            this.novelData.outline.theme = payload.theme;
            this.novelData.outline.genre = this.elements.projectGenre.value;
            this.novelData.outline.subgenre = this.elements.projectSubgenre.value;
            this.novelData.outline.storyConcept = payload.concept;
            this.novelData.outline.worldbuilding = result;
            this.elements.worldbuildingText.value = result;
            this.persist(true);
            this.renderDashboard();
            Utils.showMessage("世界观已生成。", "success");
            Utils.log("世界观生成完成。", "success");
        });
    }

    async generateVolumeSynopsis() {
        const payload = this.validateProjectBase();
        this.ensureWorkflowReady("volumeSynopsis");
        await this.runWithLoading("正在生成卷纲...", async () => {
            const result = await this.generator.generateVolumeSynopsis({
                project: this.novelData,
                ...payload
            });
            const volumes = Array.isArray(result)
                ? result
                : (Array.isArray(result?.volumes) ? result.volumes : []);
            const volumePlan = Array.isArray(result?.volumePlan) ? result.volumePlan : [];
            const oldVolumes = this.novelData.outline.volumes.slice();

            this.novelData.outline.volumes = volumes.map((item, index) => {
                const existing = oldVolumes[index] || this.createEmptyVolume(index);
                return {
                    ...existing,
                    title: item.title || existing.title,
                    summary: item.summary || "",
                    cliffhanger: item.cliffhanger || "",
                    chapterSynopsis: existing.chapterSynopsis || ""
                };
            });

            this.novelData.outline.title = payload.title;
            this.novelData.outline.theme = payload.theme;
            this.novelData.outline.genre = this.elements.projectGenre.value;
            this.novelData.outline.subgenre = this.elements.projectSubgenre.value;
            this.novelData.outline.storyConcept = payload.concept;
            this.novelData.outline.worldbuilding = this.elements.worldbuildingText.value.trim();
            this.novelData.synopsisData.volumeCount = this.novelData.outline.volumes.length;
            this.elements.projectVolumeCount.value = this.novelData.synopsisData.volumeCount;
            this.novelData.synopsisData.volume_plan = JSON.parse(JSON.stringify(volumePlan));
            this.novelData.synopsisData.volumePlan = JSON.parse(JSON.stringify(volumePlan));

            const formatted = this.novelData.outline.volumes.map((volume, index) =>
                `【第${index + 1}卷】${volume.title}\n${volume.summary}\n卷尾钩子：${volume.cliffhanger || "暂无"}`
            ).join("\n\n");

            this.novelData.synopsisData.volumeSynopsis = formatted;
            this.novelData.synopsisData.volume_synopsis = formatted;
            this.elements.volumeSynopsisText.value = formatted;
            this.novelData.synopsis_data = JSON.parse(JSON.stringify(this.novelData.synopsisData));
            this.persist(true);
            this.renderAll();
            Utils.showMessage("卷纲已生成。", "success");
            Utils.log(`已生成 ${this.novelData.outline.volumes.length} 卷卷纲。`, "success");
        });
    }

    async generateCurrentVolumeSynopsis() {
        const payload = this.validateProjectBase();
        const volumeNumber = Number(this.elements.synopsisCurrentVolume.value || 1);
        const volume = this.novelData.outline.volumes[volumeNumber - 1];
        this.ensureWorkflowReady("chapterSynopsis", { volume });

        if (!volume?.summary) {
            throw new Error("请先生成卷纲，或者先给当前卷填写摘要。");
        }

        await this.runWithLoading(`正在生成第 ${volumeNumber} 卷章节细纲...`, async () => {
            const preparedSynopsisInput = this.generator.prepareSynopsisGenerationInput(this.novelData, {
                concept: payload.concept,
                volumeSummary: volume.summary,
                existingSynopsis: volume.chapterSynopsis || "",
                volumeNumber
            });
            const chapters = await this.generator.generateChapterSynopsis({
                project: this.novelData,
                ...payload,
                concept: preparedSynopsisInput.processedConcept || payload.concept,
                volumeNumber,
                chapterCount: Number(this.elements.projectChaptersPerVolume.value || 20),
                volumeSummary: preparedSynopsisInput.processedVolumeSummary || volume.summary,
                existingSynopsis: preparedSynopsisInput.processedExistingSynopsis || volume.chapterSynopsis || ""
            });

            const formatted = chapters.map((chapter) =>
                chapter.line || `第${chapter.chapter_number}章：${chapter.title} - ${chapter.synopsis || chapter.key_event || ""}`
            ).join("\n");

            const synopsisSyncResult = await this.generator.syncSynopsisStateFromGeneratedChapters(
                this.novelData,
                chapters,
                volumeNumber,
                {
                    concept: preparedSynopsisInput.processedConcept || payload.concept,
                    volumeSummary: preparedSynopsisInput.processedVolumeSummary || volume.summary
                }
            );

            volume.chapterSynopsis = formatted;
            volume.chapter_synopsis = formatted;
            this.novelData.synopsisData.currentVolume = volumeNumber;
            this.novelData.synopsisData.synopsisOutput = formatted;
            this.novelData.synopsisData.synopsis_output = formatted;
            this.novelData.synopsisData.synopsis_volumes = this.novelData.synopsisData.synopsis_volumes || {};
            this.novelData.synopsisData.synopsis_volumes[String(volumeNumber)] = formatted;
            this.elements.synopsisOutput.value = formatted;
            this.persist(true);
            this.renderVolumeCards();
            this.renderAdvancedState();

            if (synopsisSyncResult.mainMappings.length) {
                Utils.log(`第 ${volumeNumber} 卷主角映射已更新：${synopsisSyncResult.mainMappings.join("，")}`, "success");
            }
            if (synopsisSyncResult.conservativeMainMappings?.length) {
                Utils.log(`第 ${volumeNumber} 卷保守识别补充了主角锁定：${synopsisSyncResult.conservativeMainMappings.join("，")}`, "success");
            }
            if (synopsisSyncResult.supportingMappings.length) {
                Utils.log(`第 ${volumeNumber} 卷配角映射已更新：${synopsisSyncResult.supportingMappings.join("，")}`, "success");
            }
            if (synopsisSyncResult.pendingTerms.length) {
                Utils.log(`第 ${volumeNumber} 卷仍有待确认的模糊称呼：${synopsisSyncResult.pendingTerms.join("、")}`, "info");
            }

            Utils.showMessage(`第 ${volumeNumber} 卷章节细纲已生成。`, "success");
            Utils.log(`第 ${volumeNumber} 卷细纲生成完成。`, "success");
        });
    }

    async generateAllVolumeSynopsis() {
        const total = this.novelData.outline.volumes.length;
        if (total === 0) {
            throw new Error("请先准备卷纲。");
        }

        for (let index = 1; index <= total; index += 1) {
            this.elements.synopsisCurrentVolume.value = String(index);
            this.novelData.synopsisData.currentVolume = index;
            await this.generateCurrentVolumeSynopsis();
        }
    }

    clearCurrentVolumeSynopsis() {
        const volumeNumber = Number(this.elements.synopsisCurrentVolume.value || 1);
        const volume = this.novelData.outline.volumes[volumeNumber - 1];
        if (!volume) {
            Utils.showMessage("当前卷不存在。", "error");
            return;
        }

        const hasText = String(volume.chapterSynopsis || volume.chapter_synopsis || this.elements.synopsisOutput.value || "").trim();
        if (!hasText) {
            this.elements.synopsisOutput.value = "";
            Utils.showMessage("当前卷细纲本来就是空的。", "info");
            return;
        }

        const shouldClearSynopsis = window.confirm(`确定清空第${volumeNumber}卷及后续卷的细纲吗？卷纲会保留。`);
        if (!shouldClearSynopsis) {
            return;
        }

        this.clearSynopsisFromVolume(volumeNumber);

        this.persist(true);
        this.renderVolumeCards();
        this.renderDashboard();
        Utils.showMessage(`已清空第${volumeNumber}卷及后续卷的细纲，卷纲已保留。`, "success");
        return;
    }

    importSynopsisToOutline() {
        const volumeNumber = Number(this.elements.synopsisCurrentVolume.value || 1);
        const volume = this.novelData.outline.volumes[volumeNumber - 1];
        const text = this.elements.synopsisOutput.value.trim();
        if (!text || !volume) {
            Utils.showMessage("当前没有可导入的章节细纲。", "error");
            return;
        }

        volume.chapterSynopsis = text;
        volume.chapter_synopsis = text;
        this.persist(true);
        this.renderVolumeCards();
        this.switchTab("outline");
        Utils.showMessage("已把章节细纲同步到卷纲管理。", "success");
    }

    renderIdeaLabResults() {
        if (!this.elements.ideaResults) {
            return;
        }

        const results = this.novelData.idea_lab?.results || [];
        const selectedId = this.novelData.idea_lab?.selected_id || "";
        this.renderIdeaMarketSummary();
        if (!results.length) {
            this.elements.ideaResults.innerHTML = '<div class="empty-state">这里会展示 3 到 5 个差异化脑洞版本。你选中一个后，再继续去做世界观、卷纲和细纲。</div>';
            return;
        }

        this.elements.ideaResults.innerHTML = results.map((item, index) => `
            <article class="idea-card${item.id === selectedId ? " selected" : ""}" data-idea-id="${Utils.escapeHTML(item.id)}">
                <div class="idea-card-head">
                    <div>
                        <p class="idea-card-index">方案 ${index + 1}</p>
                        <h3>${Utils.escapeHTML(item.title || `方案${index + 1}`)}</h3>
                    </div>
                    <div class="idea-card-actions">
                        <button class="btn btn-ghost btn-small" data-idea-action="copy-summary" type="button">复制完整方案</button>
                        <button class="btn btn-secondary btn-small" data-idea-action="apply" type="button">写入完整方案</button>
                    </div>
                </div>
                <div class="idea-card-grid">
                    ${this.renderIdeaSection("题材定位与读者方向", item.positioning)}
                    ${this.renderIdeaSection("一句话故事钩子", item.hook)}
                    ${this.renderIdeaSection("核心设定", item.core_setup)}
                    ${this.renderIdeaSection("核心冲突与剧情发动机", item.conflict_engine)}
                    ${this.renderIdeaSection("爽点/情绪点设计", item.selling_points)}
                    ${this.renderIdeaSection("适配世界观与前30章名场面", item.world_highlights)}
                    ${this.renderIdeaSection("长线展开与升级空间", item.longline)}
                    ${this.renderIdeaSection("人物关系与感情线建议", item.relationship_notes)}
                    ${this.renderIdeaSection("可直接用于后续细化的摘要", item.seed_summary, true)}
                </div>
            </article>
        `).join("");
    }

    renderIdeaSection(title, text, emphasize = false) {
        return `
            <section class="idea-section${emphasize ? " emphasize" : ""}">
                <h4>${Utils.escapeHTML(title)}</h4>
                <p>${Utils.escapeHTML(text || "暂无内容")}</p>
            </section>
        `;
    }

    buildIdeaMarketSummaryFallback(snapshot = {}, context = {}) {
        const items = Array.isArray(snapshot.items) ? snapshot.items : [];
        if (!items.length) {
            return "";
        }

        const diagnostics = snapshot.diagnostics && typeof snapshot.diagnostics === "object"
            ? snapshot.diagnostics
            : {};
        const categories = Array.isArray(snapshot.selectedCategories) ? snapshot.selectedCategories : [];
        const sourceBreakdown = snapshot.sourceBreakdown && typeof snapshot.sourceBreakdown === "object"
            ? snapshot.sourceBreakdown
            : {};
        const keyword = String(context.keyword || snapshot.keyword || this.novelData.idea_lab?.keyword || "").trim();
        const categoryText = categories
            .map((item) => String(item?.name || "").trim())
            .filter(Boolean)
            .slice(0, 3)
            .join("、");
        const sourceNotes = [];
        if (sourceBreakdown.rank?.used) {
            sourceNotes.push(`榜单 ${Number(sourceBreakdown.rank?.itemCount || 0) || items.length} 本`);
        }
        if (sourceBreakdown.search?.used) {
            sourceNotes.push(`搜索补充 ${Number(sourceBreakdown.search?.itemCount || 0) || 0} 本`);
        }

        const sampleTitles = items
            .map((item) => String(item?.title || "").trim())
            .filter(Boolean)
            .slice(0, 5);
        const introSamples = items
            .map((item) => Utils.summarizeText(item?.analysisIntro || item?.intro || "", 56))
            .filter(Boolean)
            .slice(0, 3);

        return [
            `本次对标关键词：${keyword || "未指定"}。`,
            categoryText ? `参考入口：${categoryText}。` : "",
            sourceNotes.length ? `样本来源：${sourceNotes.join("，")}。` : "",
            `本次共整理 ${Number(diagnostics.totalItems || 0) || items.length} 个样本，可直接用于分析的简介 ${Number(diagnostics.usableIntroCount || 0)} 个。`,
            sampleTitles.length ? `代表样本：${sampleTitles.join("、")}。` : "",
            introSamples.length ? `可用简介样本：${introSamples.join("；")}` : ""
        ].filter(Boolean).join("\n");
    }

    normalizeIdeaMarketSnapshot(snapshot, context = {}) {
        if (!snapshot || typeof snapshot !== "object") {
            return {
                summary: "",
                items: [],
                diagnostics: {},
                selectedCategories: [],
                sourceBreakdown: {},
                status: "",
                error: ""
            };
        }

        const normalized = {
            ...snapshot,
            items: Array.isArray(snapshot.items) ? snapshot.items : [],
            diagnostics: snapshot.diagnostics && typeof snapshot.diagnostics === "object"
                ? snapshot.diagnostics
                : {},
            selectedCategories: Array.isArray(snapshot.selectedCategories) ? snapshot.selectedCategories : [],
            sourceBreakdown: snapshot.sourceBreakdown && typeof snapshot.sourceBreakdown === "object"
                ? snapshot.sourceBreakdown
                : {},
            error: String(snapshot.error || "").trim()
        };

        normalized.summary = String(snapshot.summary || "").trim()
            || this.buildIdeaMarketSummaryFallback(normalized, context);
        normalized.status = String(snapshot.status || "").trim()
            || (normalized.summary
                ? "success"
                : (normalized.items.length ? "partial" : (normalized.error ? "error" : "empty")));
        return normalized;
    }

    renderIdeaMarketSummary() {
        if (!this.elements.ideaMarketSummary) {
            return;
        }

        const summary = String(this.novelData.idea_lab?.market_summary || "").trim();
        const useMarket = this.novelData.idea_lab?.use_market_trends === true;
        const diagnostics = this.novelData.idea_lab?.market_diagnostics || {};
        const items = Array.isArray(this.novelData.idea_lab?.market_items) ? this.novelData.idea_lab.market_items : [];
        const selectedCategories = Array.isArray(this.novelData.idea_lab?.market_selected_categories)
            ? this.novelData.idea_lab.market_selected_categories
            : [];
        const sourceBreakdown = this.novelData.idea_lab?.market_source_breakdown || {};
        const marketStatus = String(this.novelData.idea_lab?.market_status || "").trim();
        const marketError = String(this.novelData.idea_lab?.market_error || "").trim();
        if (!useMarket) {
            this.elements.ideaMarketSummary.className = "market-summary empty-state";
            this.elements.ideaMarketSummary.textContent = "如果开启榜单趋势，这里会显示本次抓到的番茄榜摘要。";
            return;
        }

        const displaySummary = summary || this.buildIdeaMarketSummaryFallback({
            items,
            diagnostics,
            selectedCategories,
            sourceBreakdown
        }, {
            keyword: this.novelData.idea_lab?.keyword || ""
        });

        if (!displaySummary) {
            this.elements.ideaMarketSummary.className = "market-summary empty-state";
            if (marketStatus === "config_missing") {
                this.elements.ideaMarketSummary.textContent = "已开启榜单趋势，但还没配置榜单接口 URL。";
            } else if (marketStatus === "error") {
                this.elements.ideaMarketSummary.textContent = `已开启榜单趋势，但本次抓取失败：${marketError || "榜单接口暂时不可用。"}`;
            } else {
                this.elements.ideaMarketSummary.textContent = "已开启榜单趋势。点击“生成脑洞”后会自动抓取番茄摘要。";
            }
            return;
        }

        this.elements.ideaMarketSummary.className = "market-summary";
        const prefix = diagnostics.totalItems
            ? `样本 ${diagnostics.totalItems} 本，可用简介 ${diagnostics.usableIntroCount || 0} 本，可抢救片段 ${diagnostics.salvagedIntroCount || 0} 本，混淆书名 ${diagnostics.obfuscatedTitleCount || 0} 本，混淆简介 ${diagnostics.obfuscatedIntroCount || 0} 本。\n\n`
            : "";
        this.elements.ideaMarketSummary.textContent = `${prefix}${displaySummary}`;
    }

    handleIdeaResultClick(event) {
        const card = event.target.closest("[data-idea-id]");
        if (!card) {
            return;
        }

        const ideaId = String(card.dataset.ideaId || "").trim();
        if (!ideaId) {
            return;
        }

        this.novelData.idea_lab.selected_id = ideaId;
        this.renderIdeaLabResults();
        this.persist(true);

        const actionButton = event.target.closest("[data-idea-action]");
        if (!actionButton) {
            return;
        }

        if (actionButton.dataset.ideaAction === "apply") {
            this.applySelectedIdeaToConcept();
        } else if (actionButton.dataset.ideaAction === "copy-summary") {
            this.copySelectedIdeaSummary();
        }
    }

    getSelectedIdeaResult() {
        const results = this.novelData.idea_lab?.results || [];
        const selectedId = this.novelData.idea_lab?.selected_id || "";
        return results.find((item) => item.id === selectedId) || null;
    }

    formatIdeaForConcept(idea) {
        if (!idea) {
            return "";
        }

        return [
            idea.title ? `【方案标题】\n${idea.title}` : "",
            idea.positioning ? `【题材定位与读者方向】\n${idea.positioning}` : "",
            idea.hook ? `【一句话故事钩子】\n${idea.hook}` : "",
            idea.core_setup ? `【核心设定】\n${idea.core_setup}` : "",
            idea.conflict_engine ? `【核心冲突与剧情发动机】\n${idea.conflict_engine}` : "",
            idea.selling_points ? `【爽点/情绪点设计】\n${idea.selling_points}` : "",
            idea.world_highlights ? `【适配世界观与前30章名场面】\n${idea.world_highlights}` : "",
            idea.longline ? `【长线展开与升级空间】\n${idea.longline}` : "",
            idea.relationship_notes ? `【人物关系与感情线建议】\n${idea.relationship_notes}` : "",
            idea.seed_summary ? `【浓缩版故事方案】\n${idea.seed_summary}` : ""
        ].filter(Boolean).join("\n\n");
    }

    async generateIdeaLab() {
        const keyword = String(this.elements.ideaKeywordInput?.value || "").trim();
        if (!keyword) {
            throw new Error("请先填写主题关键词。");
        }

        const versionCount = Math.min(5, Math.max(3, Number(this.elements.ideaVersionCount?.value || 4) || 4));
        await this.runWithLoading("正在生成脑洞方案...", async () => {
            let marketSnapshot = null;
            if (this.novelData.idea_lab.use_market_trends) {
                marketSnapshot = await this.fetchIdeaMarketSnapshot({
                    keyword
                });
            }

            const results = await this.generator.generateStoryIdeas({
                keyword,
                extraNote: String(this.elements.ideaExtraNoteInput?.value || "").trim(),
                marketTrendSummary: marketSnapshot?.summary || "",
                marketTrendItems: marketSnapshot?.items || [],
                versionCount
            });

            this.novelData.idea_lab.keyword = keyword;
            this.novelData.idea_lab.extra_note = String(this.elements.ideaExtraNoteInput?.value || "").trim();
            this.novelData.idea_lab.version_count = versionCount;
            this.novelData.idea_lab.use_market_trends = this.elements.ideaUseMarketTrends?.checked === true;
            this.novelData.idea_lab.market_summary = marketSnapshot?.summary || "";
            this.novelData.idea_lab.market_items = Array.isArray(marketSnapshot?.items) ? marketSnapshot.items : [];
            this.novelData.idea_lab.market_diagnostics = marketSnapshot?.diagnostics && typeof marketSnapshot.diagnostics === "object"
                ? marketSnapshot.diagnostics
                : {};
            this.novelData.idea_lab.market_selected_categories = Array.isArray(marketSnapshot?.selectedCategories)
                ? marketSnapshot.selectedCategories
                : [];
            this.novelData.idea_lab.market_source_breakdown = marketSnapshot?.sourceBreakdown && typeof marketSnapshot.sourceBreakdown === "object"
                ? marketSnapshot.sourceBreakdown
                : {};
            this.novelData.idea_lab.market_status = marketSnapshot?.status || (
                this.novelData.idea_lab.use_market_trends ? "empty" : ""
            );
            this.novelData.idea_lab.market_error = marketSnapshot?.error || "";
            this.novelData.idea_lab.results = results;
            this.novelData.idea_lab.selected_id = results[0]?.id || "";
            this.persist(true);
            this.renderIdeaLabResults();
            Utils.showMessage("脑洞方案已生成。", "success");
            Utils.log(`脑洞生成完成，共返回 ${results.length} 个版本。`, "success");
        });
    }

    async fetchIdeaMarketSnapshot({ keyword }) {
        const endpoint = String(this.api.getConfig().rankApiUrl || "").trim();
        if (!endpoint) {
            Utils.log("已开启榜单趋势，但还没配置榜单接口 URL，这次跳过榜单注入。", "info");
            return {
                summary: "",
                items: [],
                diagnostics: {},
                selectedCategories: [],
                sourceBreakdown: {},
                status: "config_missing",
                error: "榜单接口 URL 未配置"
            };
        }

        try {
            Utils.log("正在拉取番茄榜单摘要，用于脑洞对标。", "info");
            const snapshot = this.normalizeIdeaMarketSnapshot(await this.api.fetchFanqieTrendSnapshot({
                keyword,
                limit: 10
            }), {
                keyword
            });

            if (snapshot?.summary) {
                Utils.log(`已注入番茄榜摘要（${snapshot.items?.length || 0} 本样本）。`, "success");
            } else {
                Utils.log("榜单接口已返回，但没有拿到可用摘要。", "info");
            }
            return snapshot;
        } catch (error) {
            Utils.log(`番茄榜单接口调用失败，这次改为普通脑洞模式：${error?.message || error}`, "error");
            return {
                summary: "",
                items: [],
                diagnostics: {},
                selectedCategories: [],
                sourceBreakdown: {},
                status: "error",
                error: error?.message || String(error || "榜单接口调用失败")
            };
        }
    }

    clearIdeaLab() {
        const hasContent = String(this.novelData.idea_lab?.keyword || "").trim()
            || String(this.novelData.idea_lab?.extra_note || "").trim()
            || (this.novelData.idea_lab?.results || []).length;
        if (!hasContent) {
            Utils.showMessage("脑洞生成器本来就是空的。", "info");
            return;
        }

        const ok = window.confirm("确定清空脑洞生成器里的关键词、补充要求和结果吗？");
        if (!ok) {
            return;
        }

        this.novelData.idea_lab = JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.idea_lab));
        if (this.elements.ideaKeywordInput) {
            this.elements.ideaKeywordInput.value = "";
        }
        if (this.elements.ideaVersionCount) {
            this.elements.ideaVersionCount.value = "4";
        }
        if (this.elements.ideaUseMarketTrends) {
            this.elements.ideaUseMarketTrends.checked = false;
        }
        if (this.elements.ideaExtraNoteInput) {
            this.elements.ideaExtraNoteInput.value = "";
        }
        this.renderIdeaLabResults();
        this.persist(true);
        Utils.showMessage("脑洞生成器已清空。", "success");
    }

    applySelectedIdeaToConcept() {
        const selected = this.getSelectedIdeaResult();
        if (!selected) {
            Utils.showMessage("请先选中一个脑洞方案。", "error");
            return;
        }

        const summary = this.formatIdeaForConcept(selected).trim();
        if (!summary) {
            Utils.showMessage("当前方案还没有可写回的摘要。", "error");
            return;
        }

        this.novelData.outline.storyConcept = summary;
        this.novelData.synopsisData.story_concept = summary;
        this.novelData.synopsisData.storyConcept = summary;
        this.novelData.synopsisData.selected_story_idea = JSON.parse(JSON.stringify(selected));
        this.novelData.synopsisData.selectedStoryIdea = JSON.parse(JSON.stringify(selected));
        this.novelData.synopsis_data = JSON.parse(JSON.stringify(this.novelData.synopsisData));
        if (this.elements.projectConcept) {
            this.elements.projectConcept.value = summary;
        }
        this.persist(true);
        this.renderDashboard();
        this.renderWorkflowHealthDashboard();
        Utils.showMessage("已把所选脑洞写入故事概念。", "success");
    }

    copySelectedIdeaSummary() {
        const selected = this.getSelectedIdeaResult();
        if (!selected) {
            Utils.showMessage("请先选中一个脑洞方案。", "error");
            return;
        }
        Utils.copyText(this.formatIdeaForConcept(selected));
    }

    getCurrentChapterVolume() {
        const chapterVolumeNumber = Number(this.elements.chapterEditorVolumeSelect?.value || 0);
        const outlineVolumeNumber = Number(this.elements.chapterVolumeSelect?.value || 1);
        const volumeNumber = this.state.activeTab === "chapters" && chapterVolumeNumber
            ? chapterVolumeNumber
            : (outlineVolumeNumber || chapterVolumeNumber || 1);
        return this.novelData.outline.volumes[volumeNumber - 1];
    }

    splitRangeIntoBatches(startChapter, endChapter, maxBatchSize = 15) {
        const total = Math.max(0, endChapter - startChapter + 1);
        if (!total) {
            return [];
        }
        const segments = [];
        let cursor = startChapter;

        while (cursor <= endChapter) {
            const segmentStart = cursor;
            const segmentEnd = Math.min(endChapter, cursor + Math.max(1, maxBatchSize) - 1);
            segments.push({
                start: segmentStart,
                end: segmentEnd
            });
            cursor = segmentEnd + 1;
        }

        segments.forEach((segment, index) => {
            segment.batchIndex = index + 1;
            segment.totalBatches = segments.length;
        });

        return segments;
    }

    renderChapterBatchPreview() {
        if (!this.elements.chapterBatchPreview || !this.elements.chapterStart || !this.elements.chapterEnd) {
            return;
        }

        const startChapter = Number(this.elements.chapterStart.value || 0);
        const endChapter = Number(this.elements.chapterEnd.value || 0);
        if (!startChapter || !endChapter || startChapter > endChapter) {
            this.elements.chapterBatchPreview.innerHTML = '<div class="empty-state compact">设置起止章后，这里会显示章纲生成拆分。15 章以内单批生成，超过后自动分批，每批最多 15 章。</div>';
            return;
        }

        const segments = this.splitRangeIntoBatches(startChapter, endChapter, 15);
        this.elements.chapterBatchPreview.innerHTML = segments.map((segment) => `
            <article class="batch-preview-card">
                <span>${segment.totalBatches > 1 ? `第 ${segment.batchIndex}/${segment.totalBatches} 批` : "单批生成"}</span>
                <strong>第 ${segment.start}-${segment.end} 章</strong>
            </article>
        `).join("");
    }

    async generateChapters(forceOverwrite = false) {
        const volume = this.getCurrentChapterVolume();
        const volumeNumber = Number(this.elements.chapterVolumeSelect.value || 1);
        const startChapter = Number(this.elements.chapterStart.value || 1);
        const endChapter = Number(this.elements.chapterEnd.value || 1);
        this.ensureWorkflowReady("chapterOutlineBatch", { volume });

        if (!volume) {
            throw new Error("当前卷不存在。");
        }
        if (startChapter > endChapter) {
            throw new Error("起始章不能大于结束章。");
        }

        await this.runWithLoading(forceOverwrite ? "正在重生成章节大纲..." : "正在批量生成章节大纲...", async () => {
            const targetNumbers = [];
            for (let number = startChapter; number <= endChapter; number += 1) {
                targetNumbers.push(number);
            }

            if (forceOverwrite) {
                this.deleteOutlineRangeInternal({ volume, start: startChapter, end: endChapter, silent: true });
            }

            const existingNumbers = new Set(
                (volume.chapters || [])
                    .map((chapter) => Number(chapter.number || chapter.chapter_number || 0))
                    .filter((number) => number >= startChapter && number <= endChapter)
            );
            const missingNumbers = targetNumbers.filter((number) => !existingNumbers.has(number));
            if (!missingNumbers.length) {
                Utils.showMessage("所选范围内没有缺失章纲。", "info");
                Utils.log("智能检测：当前范围内的章纲已齐全。", "info");
                return;
            }

            const skipped = targetNumbers.length - missingNumbers.length;
            if (skipped > 0) {
                Utils.log(`智能检测：已有 ${skipped} 章存在，将只生成缺失的 ${missingNumbers.length} 章。`, "info");
            }

            const batchSegments = this.splitRangeIntoBatches(startChapter, endChapter, 15);
            const MAX_RETRIES_PER_BATCH = 3;
            const generatedAll = [];
            const totalGapSegments = Math.max(1, batchSegments.reduce((sum, batch) => {
                const batchMissing = [];
                for (let number = batch.start; number <= batch.end; number += 1) {
                    if (!existingNumbers.has(number)) {
                        batchMissing.push(number);
                    }
                }
                return sum + this.findGapSegments(batchMissing).length;
            }, 0));
            let completedGapSegments = 0;

            Utils.updateLoading("正在分析缺口范围...", {
                progress: 10,
                detail: `共需处理 ${totalGapSegments} 段缺口`
            });

            for (const batch of batchSegments) {
                const batchMissingNumbers = [];
                for (let number = batch.start; number <= batch.end; number += 1) {
                    if (!existingNumbers.has(number)) {
                        batchMissingNumbers.push(number);
                    }
                }

                const batchLabel = batch.totalBatches > 1
                    ? `第 ${batch.batchIndex}/${batch.totalBatches} 批`
                    : "当前批次";

                if (!batchMissingNumbers.length) {
                    Utils.updateLoading(`跳过第 ${batch.start}-${batch.end} 章`, {
                        progress: Math.round((completedGapSegments / totalGapSegments) * 88),
                        detail: `${batchLabel} 已齐全，无需重生`
                    });
                    Utils.log(`${batch.totalBatches > 1 ? `第 ${batch.batchIndex}/${batch.totalBatches} 批` : "当前批次"}（第 ${batch.start}-${batch.end} 章）已齐全，跳过。`, "info");
                    continue;
                }

                Utils.log(`${batch.totalBatches > 1 ? `第 ${batch.batchIndex}/${batch.totalBatches} 批` : "单批任务"}：准备生成第 ${batch.start}-${batch.end} 章。`, "info");

                Utils.updateLoading(`准备生成第 ${batch.start}-${batch.end} 章`, {
                    progress: Math.round((completedGapSegments / totalGapSegments) * 88),
                    detail: `${batchLabel} 即将开始`
                });
                const gapSegments = this.findGapSegments(batchMissingNumbers);
                gapSegments.forEach(([segStart, segEnd]) => {
                    Utils.log(`第 ${batch.batchIndex} 批缺口：第 ${segStart}-${segEnd} 章`, "info");
                });

                for (const [segmentStart, segmentEnd] of gapSegments) {
                    let attempt = 0;
                    let success = false;

                    while (!success && attempt < MAX_RETRIES_PER_BATCH) {
                        attempt += 1;
                        const baseProgress = Math.round((completedGapSegments / totalGapSegments) * 88);
                        const retryProgress = Math.min(92, baseProgress + Math.round((attempt / MAX_RETRIES_PER_BATCH) * 4));
                        Utils.updateLoading(`正在生成第 ${segmentStart}-${segmentEnd} 章`, {
                            progress: retryProgress,
                            detail: `${batchLabel} | 第 ${attempt}/${MAX_RETRIES_PER_BATCH} 次尝试`
                        });
                        Utils.log(`正在生成${batch.totalBatches > 1 ? `第 ${batch.batchIndex}/${batch.totalBatches} 批` : "当前批次"} · 第 ${segmentStart}-${segmentEnd} 章（尝试 ${attempt}/${MAX_RETRIES_PER_BATCH}）...`, "info");

                        try {
                            const generated = await this.generator.generateChapterOutlinesBatch({
                                project: this.novelData,
                                volume,
                                volumeNumber,
                                startChapter: segmentStart,
                                endChapter: segmentEnd,
                                existingChapters: volume.chapters.filter((chapter) => Number(chapter.number || 0) < segmentStart)
                            });

                            generated.forEach((chapter) => {
                                this.upsertChapter(volume, chapter);
                                generatedAll.push(chapter);
                            });
                            const outlineSyncResult = this.generator.mergeSynopsisStateFromGeneratedChapters(
                                this.novelData,
                                generated,
                                volumeNumber,
                                {
                                    concept: this.novelData.outline?.concept || "",
                                    volumeSummary: volume.summary || ""
                                }
                            );
                            this.applyOutlineMappingsToChapters(volume.chapters);
                            volume.chapters.sort(Utils.chapterSort);
                            this.persist(true);
                            this.renderChapterList();
                            if (outlineSyncResult.mainMappings?.length || outlineSyncResult.supportingMappings?.length) {
                                Utils.log(
                                    `第 ${segmentStart}-${segmentEnd} 章已同步角色映射：主角 ${outlineSyncResult.mainMappings.length} 条，配角 ${outlineSyncResult.supportingMappings.length} 条。`,
                                    "info"
                                );
                            }
                            completedGapSegments += 1;
                            Utils.updateLoading(`已完成第 ${segmentStart}-${segmentEnd} 章`, {
                                progress: Math.round((completedGapSegments / totalGapSegments) * 92),
                                detail: `当前已完成 ${completedGapSegments}/${totalGapSegments} 段`
                            });
                            success = true;
                        } catch (error) {
                            Utils.updateLoading(`第 ${segmentStart}-${segmentEnd} 章生成失败`, {
                                progress: Math.round((completedGapSegments / totalGapSegments) * 88),
                                detail: `第 ${attempt}/${MAX_RETRIES_PER_BATCH} 次尝试失败，准备重试`
                            });
                            Utils.log(`${batch.totalBatches > 1 ? `第 ${batch.batchIndex} 批` : "当前批次"} · 第 ${segmentStart}-${segmentEnd} 章生成失败：${error.message || error}`, "error");
                            if (attempt >= MAX_RETRIES_PER_BATCH) {
                                throw error;
                            }
                        }
                    }
                }
            }

            if (generatedAll.length) {
                Utils.updateLoading("章纲已生成，正在根据大纲补全人设...", {
                    progress: 96,
                    detail: `本次共完成 ${generatedAll.length} 章，正在补全人物设定`
                });
                await this.generateCharactersFromOutlines(volume.chapters || generatedAll, volumeNumber, false);
            }

            Utils.updateLoading("批量章纲生成完成", {
                progress: 100,
                detail: `本次共完成 ${generatedAll.length} 章`
            });
            this.persist(true);
            this.renderChapterList();
            Utils.showMessage(`已生成 ${generatedAll.length} 章章节大纲。`, "success");
            Utils.log(`第 ${volumeNumber} 卷新增 ${generatedAll.length} 章。`, "success");
        });
    }

    async regenerateChapters() {
        const startChapter = Number(this.elements.chapterStart.value || 1);
        const endChapter = Number(this.elements.chapterEnd.value || 1);
        if (!startChapter || !endChapter || startChapter > endChapter) {
            throw new Error("请输入有效的章纲范围。");
        }

        const ok = window.confirm(`确定删除并重生成第 ${startChapter}-${endChapter} 章的章纲吗？已有正文也会一起删除。`);
        if (!ok) {
            return;
        }

        await this.generateChapters(true);
    }

    async continueChapters() {
        const volume = this.getCurrentChapterVolume();
        if (!volume) {
            throw new Error("当前卷不存在。");
        }

        const currentMax = volume.chapters.reduce((max, chapter) => Math.max(max, Number(chapter.number || 0)), 0);
        const continueRangeSize = 15;
        const existingNumbers = volume.chapters
            .map((chapter) => Number(chapter.number || 0))
            .filter(Boolean)
            .sort((a, b) => a - b);

        if (existingNumbers.length > 1) {
            const gaps = [];
            for (let number = existingNumbers[0]; number <= existingNumbers[existingNumbers.length - 1]; number += 1) {
                if (!existingNumbers.includes(number)) {
                    gaps.push(number);
                }
            }

            if (gaps.length) {
                const [gapStart, gapEnd] = this.findGapSegments(gaps)[0];
                this.elements.chapterStart.value = String(gapStart);
                this.elements.chapterEnd.value = String(gapEnd);
                Utils.log(`检测到缺失章节，优先补全第 ${gapStart}-${gapEnd} 章。`, "info");
                await this.generateChapters();
                return;
            }
        }

        this.elements.chapterStart.value = String(currentMax + 1);
        this.elements.chapterEnd.value = String(currentMax + continueRangeSize);
        this.renderChapterBatchPreview();
        await this.generateChapters();
    }

    detectGaps() {
        const volume = this.getCurrentChapterVolume();
        if (!volume || volume.chapters.length === 0) {
            Utils.showMessage("当前卷还没有章节。", "info");
            return;
        }

        const numbers = volume.chapters.map((chapter) => Number(chapter.number || 0)).filter(Boolean).sort((a, b) => a - b);
        const gaps = [];
        for (let number = numbers[0]; number <= numbers[numbers.length - 1]; number += 1) {
            if (!numbers.includes(number)) {
                gaps.push(number);
            }
        }

        if (gaps.length === 0) {
            Utils.showMessage("没有检测到章节缺口。", "success");
            Utils.log("章节连续性检查通过。", "success");
        } else {
            Utils.showMessage(`检测到缺口：第 ${gaps.join("、")} 章`, "info");
            Utils.log(`章节缺口：${gaps.join(", ")}`, "info");
        }
    }

    deleteOutlineRangeInternal({ volume, start, end, silent = false }) {
        const deleteSet = new Set();
        const cleanupCandidates = new Set();
        let deletedCount = 0;

        volume.chapters.forEach((chapter) => {
            const number = Number(chapter.number || 0);
            if (number < start || number > end) {
                return;
            }
            deleteSet.add(chapter.id);
            this.collectCharacterNamesFromChapterArtifacts(chapter, {
                includeOutline: true,
                includeContent: true,
                includeStoredExtras: true
            }).forEach((name) => cleanupCandidates.add(name));
            deletedCount += 1;
            this.clearStoredChapterMirrors(chapter);
            delete this.novelData.chapter_analysis_reports?.[`chapter_${number}`];
            delete this.novelData.chapter_qc_reports?.[`chapter_${number}`];
            delete this.novelData.chapter_rhythms?.[`chapter_${number}`];
            delete this.novelData.chapter_rhythms?.[`第${number}章`];
            delete this.novelData.chapter_emotions?.[`chapter_${number}`];
            delete this.novelData.chapter_emotions?.[`第${number}章`];
            delete this.novelData.chapter_snapshot?.snapshots?.[`chapter_${number}`];
        });

        if (!deleteSet.size) {
            return 0;
        }

        volume.chapters = volume.chapters.filter((chapter) => !deleteSet.has(chapter.id));
        this.rollbackStateSystemsToChapter(start - 1);
        const cleanupResult = this.cleanupOrphanedCharacterArtifacts({
            candidateNames: cleanupCandidates
        });
        if (this.state.selectedChapterId && deleteSet.has(this.state.selectedChapterId)) {
            this.state.selectedChapterId = null;
            this.clearChapterEditor();
        }

        if (!silent) {
            this.persist(true);
            this.renderChapterList();
            this.renderDashboard();
            this.renderAdvancedState();
            if (cleanupResult.changed) {
                Utils.log(`已同步清理旧角色残留 ${cleanupResult.removedCount} 个。`, "info");
            }
            Utils.log(`状态系统已回滚到第 ${Math.max(0, start - 1)} 章结束时的状态。`, "info");
            Utils.showMessage(`已删除第 ${start}-${end} 章范围内的 ${deletedCount} 个章纲。`, "success");
        }

        return deletedCount;
    }

    deleteOutlineRange() {
        const volume = this.getCurrentChapterVolume();
        const start = Number(this.elements.chapterStart.value || 0);
        const end = Number(this.elements.chapterEnd.value || 0);

        if (!volume || !(volume.chapters || []).length) {
            Utils.showMessage("当前卷还没有章纲。", "info");
            return;
        }
        if (!start || !end || start > end) {
            Utils.showMessage("请输入有效的章纲范围。", "error");
            return;
        }

        const ok = window.confirm(`确定删除第 ${start}-${end} 章的章纲吗？如果这些章节已经有正文，也会一起删除。`);
        if (!ok) {
            return;
        }

        const deletedCount = this.deleteOutlineRangeInternal({ volume, start, end, silent: false });
        if (!deletedCount) {
            Utils.showMessage("指定范围内没有可删除的章纲。", "info");
            return;
        }

        Utils.log(`已删除第 ${start}-${end} 章的章纲，可直接重新生成。`, "success");
    }

    findGapSegments(numbers) {
        if (!numbers.length) {
            return [];
        }

        const sorted = [...numbers].sort((a, b) => a - b);
        const segments = [];
        let start = sorted[0];
        let previous = sorted[0];

        for (const number of sorted.slice(1)) {
            if (number !== previous + 1) {
                segments.push([start, previous]);
                start = number;
            }
            previous = number;
        }

        segments.push([start, previous]);
        return segments;
    }

    selectChapter(chapterId) {
        const volume = this.getCurrentChapterVolume();
        const chapter = volume?.chapters.find((item) => item.id === chapterId);
        if (!chapter) {
            return;
        }

        this.state.selectedChapterId = chapterId;
        this.elements.chapterEditorHeading.textContent = `第${chapter.number}章 · ${chapter.title || "未命名章节"}`;
        this.elements.chapterNumberInput.value = chapter.number || "";
        this.elements.chapterTitleInput.value = chapter.title || "";
        this.elements.chapterSummaryInput.value = chapter.summary || "";
        this.elements.chapterSettingNoteInput.value = chapter.chapter_setting_note || "";
        this.elements.chapterContentInput.value = chapter.content || "";
        this.renderChapterContextPreview(chapter);
        this.renderChapterList();
        if (this.elements.chapterQuickSelect) {
            this.elements.chapterQuickSelect.value = chapter.id;
        }
        this.applyMobileChapterListState();
        this.scrollChapterEditorIntoView();
    }

    clearChapterEditor() {
        this.elements.chapterEditorHeading.textContent = "未选择章节";
        this.elements.chapterNumberInput.value = "";
        this.elements.chapterTitleInput.value = "";
        this.elements.chapterSummaryInput.value = "";
        this.elements.chapterSettingNoteInput.value = "";
        this.elements.chapterContentInput.value = "";
        this.renderChapterContextPreview(null);
        if (this.elements.chapterQuickSelect) {
            this.elements.chapterQuickSelect.value = "";
        }
    }

    selectAdjacentChapter(offset) {
        const volume = this.getCurrentChapterVolume();
        const chapters = [...(volume?.chapters || [])].sort(Utils.chapterSort);
        if (!chapters.length) {
            Utils.showMessage("当前卷还没有章节。", "info");
            return;
        }

        const currentIndex = chapters.findIndex((chapter) => chapter.id === this.state.selectedChapterId);
        const safeIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextIndex = Math.max(0, Math.min(chapters.length - 1, safeIndex + Number(offset || 0)));
        this.selectChapter(chapters[nextIndex].id);
    }

    toggleMobileChapterList(forceOpen = null) {
        const collapsed = typeof forceOpen === "boolean"
            ? !forceOpen
            : !this.state.chapterListCollapsedMobile;
        this.state.chapterListCollapsedMobile = collapsed;
        window.localStorage.setItem("novel_outline_mobile_chapter_list", collapsed ? "collapsed" : "open");
        this.applyMobileChapterListState();
    }

    applyMobileChapterListState() {
        const drawer = this.elements.chapterListDrawer;
        const toggleButton = this.elements.btnToggleChapterList;
        if (!drawer || !toggleButton) {
            return;
        }

        const isMobile = window.matchMedia("(max-width: 960px)").matches;
        if (!isMobile) {
            drawer.classList.add("open");
            toggleButton.textContent = "展开章节列表";
            return;
        }

        const open = !this.state.chapterListCollapsedMobile;
        drawer.classList.toggle("open", open);
        toggleButton.textContent = open ? "收起章节列表" : "展开章节列表";
    }

    scrollChapterEditorIntoView() {
        if (!window.matchMedia("(max-width: 960px)").matches) {
            return;
        }

        const editorPanel = document.querySelector(".chapter-editor-panel");
        if (!editorPanel) {
            return;
        }

        window.requestAnimationFrame(() => {
            editorPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    renderChapterContextPreview(chapter) {
        if (!this.elements.chapterNextSetupPreview
            || !this.elements.chapterSnapshotPreview
            || !this.elements.chapterAnalysisPreview
            || !this.elements.chapterAnalysisReportPreview
            || !this.elements.chapterQcPreview) {
            return;
        }

        if (!chapter) {
            this.elements.chapterNextSetupPreview.textContent = "还没有下章铺垫。";
            this.elements.chapterSnapshotPreview.textContent = "还没有章末快照。";
            this.elements.chapterAnalysisPreview.textContent = "还没有分析标签。";
            this.elements.chapterAnalysisReportPreview.textContent = "还没有分析报告。";
            this.elements.chapterQcPreview.textContent = "还没有质检结果。";
            return;
        }

        this.elements.chapterNextSetupPreview.textContent = this.formatNextChapterSetupPreview(chapter.next_chapter_setup);

        const chapterNumber = Number(chapter.number || 0);
        const snapshot = this.getChapterSnapshotRecord(chapterNumber);
        this.elements.chapterSnapshotPreview.textContent = this.formatChapterSnapshotPreview(snapshot);
        this.elements.chapterAnalysisPreview.textContent = this.formatChapterAnalysisPreview(chapterNumber, chapter);
        this.elements.chapterAnalysisReportPreview.textContent = this.getStoredChapterAnalysisReport(chapterNumber);
        this.elements.chapterQcPreview.textContent = this.getStoredChapterQcReport(chapterNumber);
    }

    formatNextChapterSetupPreview(nextChapterSetup) {
        if (!nextChapterSetup || typeof nextChapterSetup !== "object") {
            return "还没有下章铺垫。";
        }

        const lines = [
            nextChapterSetup.state_setup ? `状态：${nextChapterSetup.state_setup}` : "",
            nextChapterSetup.atmosphere_setup ? `氛围：${nextChapterSetup.atmosphere_setup}` : "",
            nextChapterSetup.suspense_hook ? `悬念：${nextChapterSetup.suspense_hook}` : "",
            nextChapterSetup.clue_hint ? `线索：${nextChapterSetup.clue_hint}` : "",
            nextChapterSetup.countdown ? `倒计时：${nextChapterSetup.countdown}` : ""
        ].filter(Boolean);

        return lines.length ? lines.join("\n") : "还没有下章铺垫。";
    }

    formatChapterSnapshotPreview(snapshot) {
        const normalized = this.normalizeChapterSnapshotRecord(snapshot);
        if (!this.hasMeaningfulChapterSnapshot(normalized)) {
            return "还没有章末快照。";
        }

        const lines = [
            normalized["时间"] ? `时间：${normalized["时间"]}` : "",
            normalized["位置"] ? `位置：${normalized["位置"]}` : "",
            normalized.pending_plots ? `待推进：${normalized.pending_plots}` : "",
            normalized["下一章预期"] ? `预期：${normalized["下一章预期"]}` : ""
        ].filter(Boolean);

        return lines.length ? lines.join("\n") : "还没有章末快照。";
    }

    formatChapterAnalysisPreview(chapterNumber, chapter) {
        const chapterKey = `chapter_${chapterNumber}`;
        const rhythm = this.novelData.chapter_rhythms?.[chapterKey] || "";
        const emotion = this.novelData.chapter_emotions?.[chapterKey] || "";
        const plotUnit = chapter?.plot_unit || "";

        const lines = [
            plotUnit ? `剧情单元：${plotUnit}` : "",
            rhythm ? `节奏：${rhythm}` : "",
            emotion ? `情绪：${emotion}` : ""
        ].filter(Boolean);

        return lines.length ? lines.join("\n") : "还没有分析标签。";
    }

    getStoredChapterAnalysisReport(chapterNumber) {
        return this.novelData.chapter_analysis_reports?.[`chapter_${chapterNumber}`] || "还没有分析报告。";
    }

    getStoredChapterQcReport(chapterNumber) {
        return this.novelData.chapter_qc_reports?.[`chapter_${chapterNumber}`] || "还没有质检结果。";
    }

    saveChapterEditor() {
        const volume = this.getCurrentChapterVolume();
        if (!volume) {
            Utils.showMessage("请先选择一个卷。", "error");
            return;
        }

        const number = Number(this.elements.chapterNumberInput.value || 0);
        if (!number) {
            Utils.showMessage("请填写章节号。", "error");
            return;
        }

        const existing = volume.chapters.find((item) =>
            item.id === this.state.selectedChapterId || Number(item.number || 0) === number
        ) || {};
        const chapter = {
            ...existing,
            id: this.state.selectedChapterId || existing.id || Utils.uid("chapter"),
            number,
            title: this.elements.chapterTitleInput.value.trim() || `第${number}章`,
            summary: this.elements.chapterSummaryInput.value.trim(),
            chapter_setting_note: this.elements.chapterSettingNoteInput.value.trim(),
            content: this.elements.chapterContentInput.value.trim(),
            content_cleared: !this.elements.chapterContentInput.value.trim(),
            updatedAt: new Date().toISOString()
        };

        this.refreshChapterReports(chapter);
        this.upsertChapter(volume, chapter);
        if (!chapter.content) {
            this.clearStoredChapterMirrors(chapter);
        }
        this.state.selectedChapterId = chapter.id;
        this.persist(true);
        this.renderChapterList();
        this.renderDashboard();
        this.renderAdvancedState();
        this.selectChapter(chapter.id);
        Utils.showMessage("章节已保存。", "success");
    }

    deleteCurrentChapter() {
        const volume = this.getCurrentChapterVolume();
        if (!volume || !this.state.selectedChapterId) {
            Utils.showMessage("请先选择要删除的章节。", "info");
            return;
        }

        const ok = window.confirm("确定要删除当前章节吗？");
        if (!ok) {
            return;
        }

        const deletedChapter = volume.chapters.find((chapter) => chapter.id === this.state.selectedChapterId);
        const deletedChapterNumber = Number(deletedChapter?.number || 0);
        const cleanupCandidates = new Set(this.collectCharacterNamesFromChapterArtifacts(deletedChapter, {
            includeOutline: true,
            includeContent: true,
            includeStoredExtras: true
        }));
        volume.chapters = volume.chapters.filter((chapter) => chapter.id !== this.state.selectedChapterId);
        this.rollbackStateSystemsToChapter(deletedChapterNumber - 1);
        const cleanupResult = this.cleanupOrphanedCharacterArtifacts({
            candidateNames: cleanupCandidates
        });
        this.state.selectedChapterId = null;
        this.clearChapterEditor();
        this.persist(true);
        this.renderChapterList();
        this.renderDashboard();
        this.renderAdvancedState();
        if (cleanupResult.changed) {
            Utils.log(`已同步清理旧角色残留 ${cleanupResult.removedCount} 个。`, "info");
        }
        Utils.log(`状态系统已回滚到第 ${Math.max(0, deletedChapterNumber - 1)} 章结束时的状态。`, "info");
        Utils.showMessage("章节已删除。", "success");
    }

    clearCurrentChapterContent() {
        const volume = this.getCurrentChapterVolume();
        if (!volume || !this.state.selectedChapterId) {
            Utils.showMessage("请先选择要清空正文的章节。", "info");
            return;
        }

        const chapter = volume.chapters.find((item) => item.id === this.state.selectedChapterId);
        if (!chapter) {
            Utils.showMessage("当前章节不存在。", "error");
            return;
        }

        const ok = window.confirm("确定要清空当前章节正文吗？\n这会同时把状态系统回滚到上一章。");
        if (!ok) {
            return;
        }

        const chapterNumber = Number(chapter.number || 0);
        const cleanupCandidates = new Set(this.collectCharacterNamesFromChapterArtifacts(chapter, {
            includeOutline: false,
            includeContent: true,
            includeStoredExtras: true
        }));
        chapter.content = "";
        chapter.content_cleared = true;
        chapter.updatedAt = new Date().toISOString();
        this.clearStoredChapterMirrors(chapter);

        delete this.novelData.chapter_analysis_reports?.[`chapter_${chapterNumber}`];
        delete this.novelData.chapter_qc_reports?.[`chapter_${chapterNumber}`];
        delete this.novelData.chapter_rhythms?.[`chapter_${chapterNumber}`];
        delete this.novelData.chapter_emotions?.[`chapter_${chapterNumber}`];

        this.rollbackStateSystemsToChapter(chapterNumber - 1);
        const cleanupResult = this.cleanupOrphanedCharacterArtifacts({
            candidateNames: cleanupCandidates
        });
        this.elements.chapterContentInput.value = "";
        this.persist(true);
        this.renderChapterList();
        this.renderDashboard();
        this.renderAdvancedState();
        this.selectChapter(chapter.id);
        if (cleanupResult.changed) {
            Utils.log(`已同步清理旧角色残留 ${cleanupResult.removedCount} 个。`, "info");
        }
        Utils.log(`已清空第 ${chapterNumber} 章正文，状态系统已回滚到第 ${Math.max(0, chapterNumber - 1)} 章。`, "info");
        Utils.showMessage("当前章节正文已清空。", "success");
    }

    clearStoredChapterMirrors(chapter = {}) {
        this.novelData.chapters = this.novelData.chapters || {};
        [chapter.uuid, chapter.id].forEach((key) => {
            if (key && Object.prototype.hasOwnProperty.call(this.novelData.chapters, key)) {
                delete this.novelData.chapters[key];
            }
        });
        if (this.novelData.generatedChapterTexts && typeof this.novelData.generatedChapterTexts === "object") {
            [chapter.uuid, chapter.id].forEach((key) => {
                if (key && Object.prototype.hasOwnProperty.call(this.novelData.generatedChapterTexts, key)) {
                    delete this.novelData.generatedChapterTexts[key];
                }
            });
        }
    }

    async expandCurrentChapter() {
        const volume = this.getCurrentChapterVolume();
        if (!volume) {
            throw new Error("请先选择一个卷。");
        }

        const chapter = this.getChapterFromEditor() || volume.chapters.find((item) => item.id === this.state.selectedChapterId);
        this.ensureWorkflowReady("chapterContent", { volume, chapter });
        if (!chapter || !chapter.number || !chapter.summary) {
            throw new Error("请先选中章节，并确保章节号与章纲已填写。");
        }

        await this.runWithLoading("正在扩写当前章节...", async () => {
            const rawContent = await this.generator.expandChapterContent({
                project: this.novelData,
                volume,
                chapter,
                onDebugInfo: (debugInfo) => this.logChapterGenerationDebugInfo(debugInfo)
            });
            let processed;
            try {
                processed = await this.processGeneratedChapterResponse(rawContent, volume, chapter);
            } catch (error) {
                const fallbackContent = this.stripGeneratedMarkers(rawContent).trim();
                const errorMessage = error?.message || error;
                const shouldRetry = window.confirm(
                    `章节状态回写失败：${errorMessage}\n\n是否立即重试一次？`
                );
                if (shouldRetry) {
                    Utils.log("章节状态回写失败，用户已选择重试。", "info");
                    try {
                        processed = await this.processGeneratedChapterResponse(rawContent, volume, chapter, {
                            allowRetryPrompt: false
                        });
                    } catch (retryError) {
                        const message = `章节状态回写重试失败，已保留正文内容：${retryError?.message || retryError}`;
                        Utils.log(message, "error");
                        processed = {
                            cleanedContent: fallbackContent,
                            logs: ["状态回写重试失败，本次已跳过部分追踪更新，但正文内容已保留。"]
                        };
                    }
                } else {
                    const message = `章节状态回写失败，已保留正文内容：${errorMessage}`;
                    Utils.log(message, "error");
                    processed = {
                        cleanedContent: fallbackContent,
                        logs: ["状态回写失败，本次已跳过部分追踪更新，但正文内容已保留。"]
                    };
                }
            }
            let finalContent = processed.cleanedContent;
            if (this.novelData.prompt_state?.ai_filter_enabled !== false) {
                Utils.log("🔍 正在进行AI深度去味（LLM润色）...", "info");
                finalContent = await this.generator.filterAiFlavorText(finalContent, this.novelData);
            }
            const continuityWarning = this.detectOpeningRecapWarning(chapter, finalContent);
            if (continuityWarning) {
                Utils.log(continuityWarning, "info");
            }
            this.elements.chapterContentInput.value = finalContent;
            this.saveChapterEditor();
            Utils.showMessage("章节正文草稿已生成。", "success");
            if (processed.logs.length) {
                processed.logs.forEach((message) => Utils.log(message, "success"));
            }
            Utils.log(`第 ${chapter.number} 章正文扩写完成。`, "success");
        });
    }

    logChapterGenerationDebugInfo(debugInfo = {}) {
        const lines = [
            "【章节生成注入清单】",
            `标题: ${debugInfo.title || "空"}`,
            `主题: ${debugInfo.theme || "空"}`,
            `题材: ${debugInfo.genre || "空"}`,
            `当前卷: ${debugInfo.currentVolume || "空"}`,
            `当前章节: ${debugInfo.currentChapter || "空"}`,
            `本章大纲长度: ${Number(debugInfo.outlineLength || 0)}字`,
            `自定义提示词模板长度: ${Number(debugInfo.templateLength || 0)}字`,
            `最终用户提示词长度: ${Number(debugInfo.finalUserPromptLength || 0)}字`,
            `最终系统提示词长度: ${Number(debugInfo.finalSystemPromptLength || 0)}字`
        ];

        Utils.log(lines.join("\n"), "info");

        const blocks = Array.isArray(debugInfo.injectedBlocks) ? debugInfo.injectedBlocks : [];
        blocks.forEach((block) => {
            Utils.log(`  → ${block.label}（${Number(block.length || 0)}字）`, "info");
            if (block.preview) {
                Utils.log(`     预览：${block.preview}`, "info");
            }
        });
    }

    async processGeneratedChapterResponse(rawContent, volume, chapter, options = {}) {
        const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
        const { allowRetryPrompt = true } = options;
        const logs = [];
        const stateBlock = this.extractDelimitedBlock(rawContent, "<<<STATE_JSON>>>", [
            "<<<EXTRA_CHARACTERS>>>",
            "<<<FORESHADOWS>>>",
            "<<<PERSONALITY_CHANGE>>>",
            "<<<CHARACTER_APPEARANCE>>>",
            "<<<END_STATE>>>"
        ]);
        const extraCharactersBlock = this.extractDelimitedBlock(rawContent, "<<<EXTRA_CHARACTERS>>>", ["<<<END_EXTRA>>>"])
            || this.extractLooseExtraBlock(rawContent);
        const foreshadowsBlock = this.extractDelimitedBlock(rawContent, "<<<FORESHADOWS>>>", ["<<<END_FORESHADOWS>>>"]);
        const personalityChangeBlock = this.extractDelimitedBlock(rawContent, "<<<PERSONALITY_CHANGE>>>", ["<<<END_PERSONALITY_CHANGE>>>"]);
        const appearanceBlock = this.extractDelimitedBlock(rawContent, "<<<CHARACTER_APPEARANCE>>>", ["<<<END_APPEARANCE>>>"]);
        const cleanedContent = this.stripGeneratedMarkers(rawContent).trim();

        let stateData = this.parseStateJsonBlock(stateBlock);
        if (!stateData && cleanedContent) {
            Utils.log(`第 ${chapterNumber} 章 STATE_JSON 提取失败，正在分离补提取状态...`, "info");
            const recovered = await this.recoverMissingChapterStateData(volume, chapter, cleanedContent, stateBlock);
            stateData = recovered.stateData;
            if (stateData) {
                logs.push("原始 STATE_JSON 提取失败，已自动分离补提取并回写状态。");
            } else {
                logs.push("原始 STATE_JSON 提取失败，分离补提取也未成功。");
            }
        }
        const appearanceStats = this.extractCharacterAppearances(chapterNumber, appearanceBlock, cleanedContent);
        if (appearanceStats.appearances || appearanceStats.relationships) {
            logs.push(`已更新人物出场 ${appearanceStats.appearances} 条、关系 ${appearanceStats.relationships} 条。`);
        }

        const extrasCount = this.extractExtraCharacters(chapterNumber, extraCharactersBlock, cleanedContent, {
            appearanceBlock
        });
        if (extrasCount.characters || extrasCount.subplots) {
            logs.push(`已记录 ${extrasCount.characters} 个龙套角色、${extrasCount.subplots} 条临时支线。`);
        }

        if (stateData) {
            this.applyStateUpdate(chapterNumber, chapter.title || `第${chapterNumber}章`, stateData, chapter, {
                cleanedContent,
                extraCharactersBlock
            });
            logs.push("已回写状态 JSON 到故事状态/动态追踪/时间线/章末快照。");
        }

        const foreshadowStats = this.extractForeshadowsFromBlock(chapterNumber, foreshadowsBlock);
        if (foreshadowStats.newCount || foreshadowStats.resolveCount) {
            logs.push(`已更新伏笔追踪：新埋 ${foreshadowStats.newCount}，回收 ${foreshadowStats.resolveCount}。`);
        }

        const personalityChanges = this.extractPersonalityChanges(chapterNumber, personalityChangeBlock);
        if (personalityChanges > 0) {
            logs.push(`已记录 ${personalityChanges} 条人物性格演变。`);
        }

        const scanStats = this.scanChapterStateSignals(chapterNumber, chapter, cleanedContent, stateData || {});
        if (scanStats.appearances || scanStats.items) {
            logs.push(`已补扫正文信号：人物/形象 ${scanStats.appearances} 条、物品 ${scanStats.items} 条。`);
        }
        if (stateData || scanStats.appearances || scanStats.items) {
            this.recordFullStateSnapshot(chapterNumber, chapter.title || `第${chapterNumber}章`);
        }
        this.recordChapterAnalysisTags(chapterNumber, chapter, cleanedContent, stateData || {});

        return {
            cleanedContent,
            logs
        };
    }

    async recoverMissingChapterStateData(volume, chapter, cleanedContent, stateBlock = "") {
        const chapterNumber = Number(chapter?.number || chapter?.chapter_number || 0);
        if (!cleanedContent || !this.generator?.recoverChapterStateJson) {
            return { stateData: null, raw: "" };
        }

        try {
            const raw = await this.generator.recoverChapterStateJson({
                project: this.novelData,
                volume,
                chapter,
                content: cleanedContent,
                rawStateBlock: stateBlock
            });
            const stateData = this.parseStateJsonBlock(raw);
            if (stateData) {
                return { stateData, raw };
            }
            Utils.log(`第 ${chapterNumber} 章分离状态提取返回了内容，但仍未解析出有效 JSON。`, "error");
        } catch (error) {
            Utils.log(`第 ${chapterNumber} 章分离状态提取失败：${error.message}`, "error");
        }

        return { stateData: null, raw: "" };
    }

    extractDelimitedBlock(content, startMarker, endMarkers) {
        if (!content || !content.includes(startMarker)) {
            return "";
        }

        const startIndex = content.indexOf(startMarker) + startMarker.length;
        const remaining = content.slice(startIndex);
        let endIndex = remaining.length;

        endMarkers.forEach((marker) => {
            const index = remaining.indexOf(marker);
            if (index !== -1 && index < endIndex) {
                endIndex = index;
            }
        });

        return remaining.slice(0, endIndex).trim();
    }

    stripGeneratedMarkers(content) {
        let cleaned = String(content || "");
        [
            ["<<<STATE_JSON>>>", ["<<<EXTRA_CHARACTERS>>>", "<<<FORESHADOWS>>>", "<<<PERSONALITY_CHANGE>>>", "<<<CHARACTER_APPEARANCE>>>", "<<<END_STATE>>>"]],
            ["<<<EXTRA_CHARACTERS>>>", ["<<<END_EXTRA>>>"]],
            ["<<<FORESHADOWS>>>", ["<<<END_FORESHADOWS>>>"]],
            ["<<<PERSONALITY_CHANGE>>>", ["<<<END_PERSONALITY_CHANGE>>>"]],
            ["<<<CHARACTER_APPEARANCE>>>", ["<<<END_APPEARANCE>>>"]]
        ].forEach(([startMarker, endMarkers]) => {
            if (!cleaned.includes(startMarker)) {
                return;
            }
            const startIndex = cleaned.indexOf(startMarker);
            const blockContent = this.extractDelimitedBlock(cleaned, startMarker, endMarkers);
            const endMarker = endMarkers.find((marker) => cleaned.includes(marker)) || "";
            const removeEndIndex = endMarker
                ? cleaned.indexOf(endMarker, startIndex) + endMarker.length
                : startIndex + startMarker.length + blockContent.length;
            cleaned = `${cleaned.slice(0, startIndex)}\n${cleaned.slice(removeEndIndex)}`;
        });
        cleaned = cleaned.replace(/\n?(?:龙套角色[:：][\s\S]*?)(?:<<<END_EXTRA>>>|\s*$)/u, "\n");
        cleaned = cleaned.replace(/\n?(?:临时支线[:：][\s\S]*?)(?:<<<END_EXTRA>>>|\s*$)/u, "\n");
        return cleaned.replace(/\n{3,}/g, "\n\n");
    }

    extractLooseExtraBlock(content) {
        const text = String(content || "");
        if (!text) {
            return "";
        }

        const startCandidates = [
            text.lastIndexOf("龙套角色："),
            text.lastIndexOf("龙套角色:"),
            text.lastIndexOf("临时支线："),
            text.lastIndexOf("临时支线:")
        ].filter((index) => index >= 0);

        if (!startCandidates.length) {
            return "";
        }

        const startIndex = Math.min(...startCandidates);
        const after = text.slice(startIndex);
        const endMarkerIndex = after.indexOf("<<<END_EXTRA>>>");
        const block = endMarkerIndex >= 0 ? after.slice(0, endMarkerIndex) : after;
        const trimmed = block.trim();
        return /^(龙套角色|临时支线)[:：]/m.test(trimmed) ? trimmed : "";
    }

    parseStateJsonBlock(block) {
        const rawText = String(block || "").trim();
        if (!rawText) {
            return null;
        }

        const parsed = this.pickFirstNonEmptyValue(
            Utils.parseJsonResponse(rawText),
            Utils.parseJsonResponse(Utils.extractBalancedJson(rawText, "{", "}")),
            Utils.parseJsonResponse(Utils.extractBalancedJson(rawText, "[", "]"))
        );
        const normalized = this.normalizeStateData(parsed, rawText);
        return this.hasMeaningfulStateData(normalized) ? normalized : null;
    }

    pickFirstNonEmptyValue(...candidates) {
        for (const candidate of candidates) {
            if (candidate == null) {
                continue;
            }
            if (typeof candidate === "string" && !candidate.trim()) {
                continue;
            }
            if (Array.isArray(candidate) && !candidate.length) {
                continue;
            }
            if (candidate && typeof candidate === "object" && !Array.isArray(candidate) && !Object.keys(candidate).length) {
                continue;
            }
            return candidate;
        }
        return null;
    }

    escapeRegExp(value) {
        return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    normalizeStateScalar(value) {
        const text = String(value || "").replace(/\r\n?/g, "\n").trim();
        if (!text) {
            return "";
        }
        if (/^(?:\u65e0|\u65e0\u53d8\u5316|\u6682\u65e0|\u5f85\u5b9a|\u672a\u5b9a|\u672a\u77e5|\u672a\u8bb0\u5f55|null|none)$/iu.test(text)) {
            return "";
        }
        if (/^(?:\u5f53\u524d\u6545\u4e8b\u65f6\u95f4\u70b9|\u672c\u7ae0\u7ed3\u675f\u65f6\u4e3b\u89d2\u6240\u5728\u4f4d\u7f6e|\u672c\u7ae0\u7559\u4e0b\u7684\u5f85\u63a8\u8fdb\u4e8b\u9879|\u672c\u7ae0\u6700\u5173\u952e\u7684\u4e00\u4ef6\u4e8b|\u672c\u7ae0\u65b0\u589e\u6216\u53d8\u5316\u7684\u91cd\u8981\u7269\u54c1|\u8be5\u89d2\u8272\u5f53\u524d\u4f4d\u7f6e|\u5f53\u524d\u4f4d\u7f6e|\u89d2\u8272\u540d|\u5f53\u524d\u72b6\u6001|\u5f53\u524d\u5916\u8c8c)$/u.test(text)) {
            return "";
        }
        return text;
    }

    stringifyStateField(value) {
        if (value == null) {
            return "";
        }
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return this.normalizeStateScalar(value);
        }
        if (Array.isArray(value)) {
            return value
                .map((item) => this.stringifyStateField(item))
                .filter(Boolean)
                .join("\uff1b");
        }
        if (typeof value === "object") {
            return Object.entries(value)
                .map(([key, item]) => {
                    const text = this.stringifyStateField(item);
                    if (!text) {
                        return "";
                    }
                    return key ? `${key}\uff1a${text}` : text;
                })
                .filter(Boolean)
                .join("\uff1b");
        }
        return "";
    }

    readQuotedStateValue(source, startIndex, quoteChar = "\"") {
        const text = String(source || "");
        const parts = [];
        let escaped = false;

        for (let index = startIndex; index < text.length; index += 1) {
            const char = text[index];
            if (escaped) {
                parts.push(char);
                escaped = false;
                continue;
            }
            if (char === "\\") {
                escaped = true;
                continue;
            }
            if (char === quoteChar) {
                break;
            }
            parts.push(char);
        }

        return this.normalizeStateScalar(
            parts.join("")
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "")
                .replace(/\\t/g, "\t")
                .replace(/\\"/g, "\"")
                .replace(/\\'/g, "'")
                .replace(/\\\\/g, "\\")
        );
    }

    extractStateStringField(text, aliases = []) {
        const source = String(text || "");
        if (!source) {
            return "";
        }

        for (const alias of aliases) {
            const keyPattern = `(?:["']${this.escapeRegExp(alias)}["']|${this.escapeRegExp(alias)})\\s*[:\uff1a]\\s*`;
            const quotedPattern = new RegExp(`${keyPattern}(["'])`, "u");
            const quotedMatch = quotedPattern.exec(source);
            if (quotedMatch) {
                const value = this.readQuotedStateValue(source, quotedMatch.index + quotedMatch[0].length, quotedMatch[1]);
                if (value) {
                    return value;
                }
            }

            const rawPattern = new RegExp(`${keyPattern}([^,\uff0c\\n}]+)`, "u");
            const rawMatch = rawPattern.exec(source);
            if (rawMatch?.[1]) {
                const value = this.normalizeStateScalar(rawMatch[1].replace(/^['"]|['"]$/g, ""));
                if (value) {
                    return value;
                }
            }
        }

        return "";
    }

    extractStateJsonField(text, aliases = [], openChar = "{", closeChar = "}") {
        const source = String(text || "");
        if (!source) {
            return null;
        }

        const openPattern = openChar === "{" ? "\\{" : "\\[";
        for (const alias of aliases) {
            const keyPattern = `(?:["']${this.escapeRegExp(alias)}["']|${this.escapeRegExp(alias)})\\s*[:\uff1a]\\s*`;
            const pattern = new RegExp(`${keyPattern}${openPattern}`, "u");
            const match = pattern.exec(source);
            if (!match) {
                continue;
            }
            const startIndex = source.indexOf(openChar, match.index);
            if (startIndex < 0) {
                continue;
            }
            const chunk = Utils.extractBalancedJson(source.slice(startIndex), openChar, closeChar);
            if (!chunk) {
                continue;
            }
            const parsed = Utils.parseJsonResponse(chunk);
            if (parsed != null) {
                return parsed;
            }
        }

        return null;
    }

    extractStateStructuredField(text, aliases = []) {
        return this.pickFirstNonEmptyValue(
            this.extractStateJsonField(text, aliases, "{", "}"),
            this.extractStateJsonField(text, aliases, "[", "]")
        );
    }

    pickFirstStateString(candidates = [], rawText = "", aliases = []) {
        for (const candidate of candidates) {
            const text = this.stringifyStateField(candidate);
            if (text) {
                return text;
            }
        }
        return aliases.length ? this.extractStateStringField(rawText, aliases) : "";
    }

    normalizeStateCharacterEntry(value) {
        const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
        const appearanceSource = this.pickFirstNonEmptyValue(
            source.appearance,
            source.current_appearance,
            source.currentAppearance,
            source.appearance_profile,
            source["\u5916\u8c8c"],
            source["\u5f53\u524d\u5916\u8c8c"],
            source["\u5f53\u524d\u5f62\u8c61"],
            source["\u5916\u8c8c\u63cf\u8ff0"]
        );
        const appearanceObject = appearanceSource && typeof appearanceSource === "object" && !Array.isArray(appearanceSource)
            ? appearanceSource
            : {};

        const normalized = {
            ...source,
            cultivation: this.pickFirstStateString([
                source.cultivation,
                source.power,
                source.realm,
                source.level,
                source["\u4fee\u4e3a"],
                source["\u5883\u754c"],
                source["\u5b9e\u529b"]
            ]),
            location: this.pickFirstStateString([
                source.location,
                source.current_location,
                source.currentLocation,
                source["\u4f4d\u7f6e"],
                source["\u5f53\u524d\u4f4d\u7f6e"],
                source["\u5f53\u524d\u5730\u70b9"],
                source["\u6240\u5728\u4f4d\u7f6e"],
                source["\u5f53\u524d\u6240\u5728\u5730"]
            ]),
            identity: this.pickFirstStateString([
                source.identity,
                source.role,
                source["\u8eab\u4efd"],
                source["\u8eab\u4efd\u53d8\u5316"],
                source["\u89d2\u8272\u8eab\u4efd"]
            ]),
            status: this.pickFirstStateString([
                source.status,
                source.current_status,
                source.currentStatus,
                source["\u72b6\u6001"],
                source["\u5f53\u524d\u72b6\u6001"],
                source["\u73b0\u72b6"]
            ]),
            appearance: this.pickFirstStateString([
                appearanceObject.current,
                appearanceObject.current_appearance,
                appearanceObject["\u5f53\u524d"],
                appearanceObject["\u5f53\u524d\u5916\u8c8c"],
                appearanceObject["\u5f53\u524d\u5f62\u8c61"],
                appearanceObject.description,
                appearanceSource
            ]),
            real_appearance: this.pickFirstStateString([
                appearanceObject.original,
                appearanceObject.real,
                appearanceObject.real_appearance,
                appearanceObject["\u539f\u59cb"],
                appearanceObject["\u771f\u5b9e\u5916\u8c8c"],
                appearanceObject["\u539f\u8c8c"],
                appearanceObject["\u672c\u8c8c"],
                source.real_appearance,
                source.realAppearance,
                source["\u771f\u5b9e\u5916\u8c8c"]
            ]),
            appearance_change: this.pickFirstStateString([
                source.appearance_change,
                source.appearanceChange,
                appearanceObject.reason,
                appearanceObject.change_type,
                appearanceObject["\u53d8\u5316\u539f\u56e0"],
                appearanceObject["\u53d8\u5316\u7c7b\u578b"],
                source["\u5916\u8c8c\u53d8\u5316"],
                source["\u5f62\u8c61\u53d8\u5316"]
            ]),
            possessions: this.pickFirstStateString([
                source.possessions,
                source.items,
                source["\u6301\u6709\u7269\u54c1"],
                source["\u7269\u54c1"],
                source["\u643a\u5e26\u7269\u54c1"]
            ]),
            relationships: this.pickFirstStateString([
                source.relationships,
                source["\u5173\u7cfb\u53d8\u5316"],
                source["\u5173\u7cfb"],
                source["\u4eba\u9645\u5173\u7cfb"]
            ]),
            goals: this.pickFirstStateString([
                source.goals,
                source.goal,
                source["\u76ee\u6807"],
                source["\u5f53\u524d\u76ee\u6807"],
                source["\u5f53\u524d\u8bc9\u6c42"]
            ]),
            secrets: this.pickFirstStateString([
                source.secrets,
                source.secret,
                source["\u79d8\u5bc6"],
                source["\u77e5\u6653\u79d8\u5bc6"],
                source["\u9690\u85cf\u79d8\u5bc6"]
            ]),
            organization: this.pickFirstStateString([
                source.organization,
                source.org,
                source["\u7ec4\u7ec7"],
                source["\u6240\u5c5e\u7ec4\u7ec7"],
                source["\u9635\u8425"]
            ])
        };

        return normalized;
    }

    hasMeaningfulCharacterState(value) {
        if (!value || typeof value !== "object") {
            return false;
        }
        return [
            value.cultivation,
            value.location,
            value.identity,
            value.status,
            value.appearance,
            value.real_appearance,
            value.appearance_change,
            value.possessions,
            value.relationships,
            value.goals,
            value.secrets,
            value.organization
        ].some(Boolean);
    }

    normalizeStateCharacters(value) {
        const source = value && typeof value === "object" ? value : {};
        const entries = {};

        if (Array.isArray(source)) {
            source.forEach((item) => {
                const name = this.normalizeStateScalar(
                    item?.name
                    || item?.character
                    || item?.character_name
                    || item?.characterName
                    || item?.["\u89d2\u8272\u540d"]
                    || item?.["\u89d2\u8272"]
                    || item?.["\u59d3\u540d"]
                    || item?.["\u540d\u5b57"]
                    || item?.["\u4eba\u7269"]
                    || ""
                );
                if (!name) {
                    return;
                }
                const normalized = this.normalizeStateCharacterEntry(item);
                if (this.hasMeaningfulCharacterState(normalized)) {
                    entries[name] = normalized;
                }
            });
            return entries;
        }

        Object.entries(source).forEach(([rawName, state]) => {
            const fallbackName = state && typeof state === "object"
                ? state.name
                    || state.character
                    || state.character_name
                    || state.characterName
                    || state["\u89d2\u8272\u540d"]
                    || state["\u89d2\u8272"]
                    || state["\u59d3\u540d"]
                    || state["\u540d\u5b57"]
                    || state["\u4eba\u7269"]
                    || ""
                : "";
            const name = this.normalizeStateScalar(rawName) || this.normalizeStateScalar(fallbackName);
            if (!name) {
                return;
            }
            const normalized = this.normalizeStateCharacterEntry(state);
            if (this.hasMeaningfulCharacterState(normalized)) {
                entries[name] = normalized;
            }
        });

        return entries;
    }

    normalizeStateData(source, rawText = "") {
        const base = source && typeof source === "object" && !Array.isArray(source) ? source : {};
        const storyStateSource = this.pickFirstNonEmptyValue(
            base.story_state,
            base.storyState,
            base.state,
            base["\u6545\u4e8b\u72b6\u6001"],
            base["\u72b6\u6001"],
            this.extractStateJsonField(rawText, ["story_state", "storyState", "state", "\u6545\u4e8b\u72b6\u6001", "\u72b6\u6001"], "{", "}")
        );
        const storyState = storyStateSource && typeof storyStateSource === "object" && !Array.isArray(storyStateSource)
            ? storyStateSource
            : {};
        const rawCharacters = this.pickFirstNonEmptyValue(
            base.characters,
            base.character_states,
            base.characterStates,
            base["\u89d2\u8272\u72b6\u6001"],
            base["\u4eba\u7269\u72b6\u6001"],
            storyState.characters,
            storyState.character_states,
            storyState.characterStates,
            storyState["\u89d2\u8272\u72b6\u6001"],
            storyState["\u4eba\u7269\u72b6\u6001"],
            this.extractStateStructuredField(rawText, ["characters", "character_states", "characterStates", "\u89d2\u8272\u72b6\u6001", "\u4eba\u7269\u72b6\u6001"])
        );
        const rawTimeConstraints = this.pickFirstNonEmptyValue(
            base.time_constraints,
            base.timeConstraints,
            base["\u65f6\u95f4\u7ea6\u675f"],
            base["\u5012\u8ba1\u65f6"],
            storyState.time_constraints,
            storyState.timeConstraints,
            storyState["\u65f6\u95f4\u7ea6\u675f"],
            storyState["\u5012\u8ba1\u65f6"],
            this.extractStateStructuredField(rawText, ["time_constraints", "timeConstraints", "\u65f6\u95f4\u7ea6\u675f", "\u5012\u8ba1\u65f6"])
        );
        const rawWorldChanges = this.pickFirstNonEmptyValue(
            base.world_changes,
            base.worldChanges,
            base["\u4e16\u754c\u53d8\u5316"],
            base["\u4e16\u754c\u72b6\u6001"],
            storyState.world_changes,
            storyState.worldChanges,
            storyState["\u4e16\u754c\u53d8\u5316"],
            storyState["\u4e16\u754c\u72b6\u6001"],
            this.extractStateStructuredField(rawText, ["world_changes", "worldChanges", "\u4e16\u754c\u53d8\u5316", "\u4e16\u754c\u72b6\u6001"])
        );

        return {
            timeline: this.pickFirstStateString([
                base.timeline,
                base.current_time,
                base.currentTime,
                base.time,
                base["\u65f6\u95f4"],
                base["\u5f53\u524d\u65f6\u95f4"],
                base["\u5f53\u524d\u65f6\u95f4\u70b9"],
                base["\u65f6\u95f4\u70b9"],
                storyState.timeline,
                storyState.current_time,
                storyState.currentTime,
                storyState.time,
                storyState["\u65f6\u95f4"],
                storyState["\u5f53\u524d\u65f6\u95f4"],
                storyState["\u5f53\u524d\u65f6\u95f4\u70b9"],
                storyState["\u65f6\u95f4\u70b9"]
            ], rawText, ["timeline", "current_time", "currentTime", "time", "\u65f6\u95f4", "\u5f53\u524d\u65f6\u95f4", "\u5f53\u524d\u65f6\u95f4\u70b9", "\u65f6\u95f4\u70b9"]),
            current_location: this.pickFirstStateString([
                base.current_location,
                base.currentLocation,
                base.location,
                base.current_place,
                base["\u4f4d\u7f6e"],
                base["\u5f53\u524d\u4f4d\u7f6e"],
                base["\u5f53\u524d\u5730\u70b9"],
                base["\u5730\u70b9"],
                base["\u6240\u5728\u4f4d\u7f6e"],
                base["\u5f53\u524d\u6240\u5728\u5730"],
                storyState.current_location,
                storyState.currentLocation,
                storyState.location,
                storyState["\u4f4d\u7f6e"],
                storyState["\u5f53\u524d\u4f4d\u7f6e"],
                storyState["\u5f53\u524d\u5730\u70b9"],
                storyState["\u5730\u70b9"],
                storyState["\u6240\u5728\u4f4d\u7f6e"],
                storyState["\u5f53\u524d\u6240\u5728\u5730"]
            ], rawText, ["current_location", "currentLocation", "location", "current_place", "\u4f4d\u7f6e", "\u5f53\u524d\u4f4d\u7f6e", "\u5f53\u524d\u5730\u70b9", "\u5730\u70b9", "\u6240\u5728\u4f4d\u7f6e", "\u5f53\u524d\u6240\u5728\u5730"]),
            important_items: this.pickFirstStateString([
                base.important_items,
                base.importantItems,
                base.items,
                base["\u91cd\u8981\u7269\u54c1"],
                base["\u5173\u952e\u7269\u54c1"],
                base["\u7269\u54c1\u53d8\u5316"],
                storyState.important_items,
                storyState.importantItems,
                storyState.items,
                storyState["\u91cd\u8981\u7269\u54c1"],
                storyState["\u5173\u952e\u7269\u54c1"],
                storyState["\u7269\u54c1\u53d8\u5316"]
            ], rawText, ["important_items", "importantItems", "items", "\u91cd\u8981\u7269\u54c1", "\u5173\u952e\u7269\u54c1", "\u7269\u54c1\u53d8\u5316"]),
            pending_plots: this.pickFirstStateString([
                base.pending_plots,
                base.pendingPlot,
                base.pending_plot,
                base.next_tasks,
                base.todo,
                base["\u5f85\u63a8\u8fdb\u4e8b\u9879"],
                base["\u672a\u5b8c\u4e8b\u9879"],
                base["\u5f85\u5904\u7406\u4e8b\u9879"],
                base["\u540e\u7eed\u4efb\u52a1"],
                base["\u5f85\u529e"],
                base["\u540e\u7eed\u5b89\u6392"],
                storyState.pending_plots,
                storyState.pendingPlot,
                storyState.pending_plot,
                storyState.next_tasks,
                storyState.todo,
                storyState["\u5f85\u63a8\u8fdb\u4e8b\u9879"],
                storyState["\u672a\u5b8c\u4e8b\u9879"],
                storyState["\u5f85\u5904\u7406\u4e8b\u9879"],
                storyState["\u540e\u7eed\u4efb\u52a1"],
                storyState["\u5f85\u529e"],
                storyState["\u540e\u7eed\u5b89\u6392"]
            ], rawText, ["pending_plots", "pendingPlot", "pending_plot", "next_tasks", "todo", "\u5f85\u63a8\u8fdb\u4e8b\u9879", "\u672a\u5b8c\u4e8b\u9879", "\u5f85\u5904\u7406\u4e8b\u9879", "\u540e\u7eed\u4efb\u52a1", "\u5f85\u529e", "\u540e\u7eed\u5b89\u6392"]),
            key_event: this.pickFirstStateString([
                base.key_event,
                base.keyEvent,
                base.core_event,
                base.main_event,
                base["\u5173\u952e\u4e8b\u4ef6"],
                base["\u6838\u5fc3\u4e8b\u4ef6"],
                base["\u5173\u952e\u4fe1\u606f"],
                storyState.key_event,
                storyState.keyEvent,
                storyState.core_event,
                storyState.main_event,
                storyState["\u5173\u952e\u4e8b\u4ef6"],
                storyState["\u6838\u5fc3\u4e8b\u4ef6"],
                storyState["\u5173\u952e\u4fe1\u606f"],
                storyState["\u672c\u7ae0\u5173\u952e\u4e8b\u4ef6"]
            ], rawText, ["key_event", "keyEvent", "core_event", "main_event", "\u5173\u952e\u4e8b\u4ef6", "\u6838\u5fc3\u4e8b\u4ef6", "\u5173\u952e\u4fe1\u606f", "\u672c\u7ae0\u5173\u952e\u4e8b\u4ef6"]),
            genre_progress: this.coerceStateArray(
                this.pickFirstNonEmptyValue(
                    base.genre_progress,
                    base.genreProgress,
                    base["\u9898\u6750\u8fdb\u5ea6"],
                    base["\u8fdb\u5ea6\u53d8\u5316"],
                    storyState.genre_progress,
                    storyState.genreProgress,
                    storyState["\u9898\u6750\u8fdb\u5ea6"],
                    storyState["\u8fdb\u5ea6\u53d8\u5316"]
                )
            ),
            world_changes: rawWorldChanges && typeof rawWorldChanges === "object" && !Array.isArray(rawWorldChanges)
                ? rawWorldChanges
                : {},
            time_constraints: this.coerceStateArray(rawTimeConstraints),
            item_updates: this.coerceStateArray(
                this.pickFirstNonEmptyValue(
                    base.item_updates,
                    base.itemUpdates,
                    base["\u7269\u54c1\u66f4\u65b0"],
                    storyState.item_updates,
                    storyState.itemUpdates,
                    storyState["\u7269\u54c1\u66f4\u65b0"]
                )
            ),
            appearance_changes: this.coerceStateArray(
                this.pickFirstNonEmptyValue(
                    base.appearance_changes,
                    base.appearanceChanges,
                    base["\u5916\u8c8c\u53d8\u5316"],
                    storyState.appearance_changes,
                    storyState.appearanceChanges,
                    storyState["\u5916\u8c8c\u53d8\u5316"],
                    storyState["\u5f62\u8c61\u53d8\u5316"]
                )
            ),
            characters: this.normalizeStateCharacters(rawCharacters)
        };
    }

    hasMeaningfulStateData(stateData) {
        if (!stateData || typeof stateData !== "object") {
            return false;
        }
        return Boolean(
            stateData.timeline
            || stateData.current_location
            || stateData.important_items
            || stateData.pending_plots
            || stateData.key_event
            || (stateData.genre_progress || []).length
            || (stateData.time_constraints || []).length
            || (stateData.item_updates || []).length
            || (stateData.appearance_changes || []).length
            || Object.keys(stateData.characters || {}).length
            || Object.keys(stateData.world_changes || {}).length
        );
    }

    normalizeChapterSnapshotRecord(snapshot) {
        const source = snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot : {};
        const nextChapterSetup = this.pickFirstNonEmptyValue(
            source.next_chapter_setup,
            source.nextChapterSetup,
            source["\u4e0b\u7ae0\u94fa\u57ab"]
        ) || {};
        const snapshotState = this.normalizeStateData(
            this.pickFirstNonEmptyValue(
                source.story_state,
                source.storyState,
                source.state,
                source["\u6545\u4e8b\u72b6\u6001"],
                source["\u72b6\u6001"]
            ) || {},
            ""
        );
        const timeline = this.pickFirstStateString([
            source.timeline,
            source.time,
            source.current_time,
            source["\u65f6\u95f4"],
            source["\u5f53\u524d\u65f6\u95f4"],
            source["\u5f53\u524d\u65f6\u95f4\u70b9"],
            snapshotState.timeline
        ]);
        const currentLocation = this.pickFirstStateString([
            source.current_location,
            source.currentLocation,
            source.location,
            source["\u4f4d\u7f6e"],
            source["\u5f53\u524d\u4f4d\u7f6e"],
            source["\u5f53\u524d\u5730\u70b9"],
            snapshotState.current_location
        ]);
        const pendingPlots = this.pickFirstStateString([
            source.pending_plots,
            source.pendingPlot,
            source["\u5f85\u63a8\u8fdb\u4e8b\u9879"],
            source["\u672a\u5b8c\u4e8b\u9879"],
            snapshotState.pending_plots
        ]);
        const importantItems = this.pickFirstStateString([
            source.important_items,
            source.importantItems,
            source["\u91cd\u8981\u7269\u54c1"],
            source["\u5173\u952e\u7269\u54c1"],
            snapshotState.important_items
        ]);
        const keyEvent = this.pickFirstStateString([
            source.key_event,
            source.keyEvent,
            source.core_event,
            source.main_event,
            source["\u5173\u952e\u4e8b\u4ef6"],
            source["\u6838\u5fc3\u4e8b\u4ef6"],
            source["\u5173\u952e\u4fe1\u606f"],
            snapshotState.key_event
        ]);
        const nextExpectation = this.pickFirstStateString([
            source["\u4e0b\u4e00\u7ae0\u9884\u671f"],
            source.next_expectation,
            source.nextExpectation,
            source.transition_focus,
            source.transitionFocus
        ]) || (this.hasContentfulNextChapterSetup(nextChapterSetup)
            ? this.formatNextChapterSetupPreview(nextChapterSetup)
            : "");
        const keyInfoSource = this.pickFirstNonEmptyValue(
            source["\u5173\u952e\u4fe1\u606f"],
            source.key_info,
            source.keyInfo,
            snapshotState.key_event ? [snapshotState.key_event] : [],
            keyEvent ? [keyEvent] : []
        );
        const keyInfo = Array.isArray(keyInfoSource)
            ? keyInfoSource.map((item) => this.stringifyStateField(item)).filter(Boolean)
            : this.stringifyStateField(keyInfoSource)
                ? [this.stringifyStateField(keyInfoSource)]
                : [];

        return {
            ...source,
            title: source.title || source.chapter_title || source.chapterTitle || "",
            \u65f6\u95f4: timeline,
            \u4f4d\u7f6e: currentLocation,
            pending_plots: pendingPlots,
            important_items: importantItems,
            \u5173\u952e\u4fe1\u606f: keyInfo,
            current_location: currentLocation,
            timeline,
            \u4e0b\u4e00\u7ae0\u9884\u671f: nextExpectation || pendingPlots,
            next_chapter_setup: nextChapterSetup,
            transition_focus: this.pickFirstStateString([
                source.transition_focus,
                source.transitionFocus,
                nextChapterSetup.state_setup,
                nextChapterSetup.suspense_hook,
                pendingPlots
            ]),
            key_event: keyEvent
        };
    }

    hasMeaningfulChapterSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== "object") {
            return false;
        }
        return Boolean(
            snapshot.timeline
            || snapshot.current_location
            || snapshot.pending_plots
            || snapshot.important_items
            || snapshot.key_event
            || snapshot["\u4e0b\u4e00\u7ae0\u9884\u671f"]
            || (snapshot["\u5173\u952e\u4fe1\u606f"] || []).length
        );
    }

    getChapterSnapshotRecord(chapterNumber) {
        const direct = this.normalizeChapterSnapshotRecord(
            this.novelData.chapter_snapshot?.snapshots?.[`chapter_${chapterNumber}`]
        );
        if (this.hasMeaningfulChapterSnapshot(direct)) {
            return direct;
        }

        const stateSnapshot = this.novelData.outline?.state_snapshots?.[`chapter_${chapterNumber}`];
        const nested = this.normalizeChapterSnapshotRecord(
            stateSnapshot?.chapter_snapshot?.snapshots?.[`chapter_${chapterNumber}`]
        );
        if (this.hasMeaningfulChapterSnapshot(nested)) {
            return nested;
        }

        const storyState = this.normalizeStateData(
            this.pickFirstNonEmptyValue(
                stateSnapshot?.story_state,
                stateSnapshot?.storyState,
                stateSnapshot?.state,
                stateSnapshot?.["\u6545\u4e8b\u72b6\u6001"],
                stateSnapshot
            ) || {},
            ""
        );
        if (this.hasMeaningfulStateData(storyState)) {
            return this.normalizeChapterSnapshotRecord({
                title: stateSnapshot?.title || `\u7b2c${chapterNumber}\u7ae0`,
                timeline: storyState.timeline,
                current_location: storyState.current_location,
                important_items: storyState.important_items,
                pending_plots: storyState.pending_plots,
                key_event: storyState.key_event,
                next_chapter_setup: nested.next_chapter_setup || {}
            });
        }

        return direct;
    }

    iterateAllChapters(callback) {
        (this.novelData.outline?.volumes || []).forEach((volume, volumeIndex) => {
            (volume.chapters || []).forEach((chapter, chapterIndex) => {
                callback(chapter, volume, volumeIndex, chapterIndex);
            });
        });
    }

    rehydrateDerivedChapterArtifacts() {
        this.novelData.chapter_snapshot = this.novelData.chapter_snapshot && typeof this.novelData.chapter_snapshot === "object"
            ? this.novelData.chapter_snapshot
            : { snapshots: {} };
        this.novelData.chapter_snapshot.snapshots = this.novelData.chapter_snapshot.snapshots && typeof this.novelData.chapter_snapshot.snapshots === "object"
            ? this.novelData.chapter_snapshot.snapshots
            : {};

        this.iterateAllChapters((chapter) => {
            if (!(chapter?.content || "").trim()) {
                return;
            }

            const chapterNumber = Number(chapter.number || 0);
            if (!chapterNumber) {
                return;
            }

            const snapshot = this.getChapterSnapshotRecord(chapterNumber);
            if (this.hasMeaningfulChapterSnapshot(snapshot)) {
                this.novelData.chapter_snapshot.snapshots[`chapter_${chapterNumber}`] = snapshot;
            }

            this.recordChapterAnalysisTags(chapterNumber, chapter, chapter.content || "", {
                timeline: snapshot.timeline || "",
                current_location: snapshot.current_location || "",
                pending_plots: snapshot.pending_plots || "",
                key_event: snapshot.key_event || ""
            });
            this.refreshChapterReports(chapter);
        });

        this.rebuildUsedExtraCharacters();
    }

    getStoredChapterContent(chapter = {}) {
        return String(chapter.content || (chapter.uuid ? this.novelData.chapters?.[chapter.uuid] : "") || "").trim();
    }

    getOrderedChapterRecords(includeEmpty = false) {
        return (this.novelData.outline.volumes || [])
            .flatMap((volume, volumeIndex) => (volume.chapters || []).map((chapter) => {
                const volumeNumber = Number(volume.volume_number || volumeIndex + 1);
                const rawContent = this.getStoredChapterContent(chapter);
                const cleanedContent = this.stripGeneratedMarkers(rawContent).trim();
                return {
                    volume,
                    volumeNumber,
                    chapter,
                    rawContent,
                    cleanedContent
                };
            }))
            .filter((item) => includeEmpty || item.cleanedContent)
            .sort((left, right) => {
                if (left.volumeNumber !== right.volumeNumber) {
                    return left.volumeNumber - right.volumeNumber;
                }
                return Number(left.chapter?.number || 0) - Number(right.chapter?.number || 0);
            });
    }

    collectReferencedFormalCharacterNamesFromText(text = "", registry = this.getWorldStateFormalCharacterRegistry()) {
        const names = new Set();
        const source = String(text || "");
        if (!source.trim()) {
            return names;
        }

        registry.forEach((entry, name) => {
            const aliases = Array.from(entry?.aliases || [])
                .map((alias) => this.normalizeCharacterReferenceLabel(alias))
                .filter((alias) => alias && alias.length >= 2)
                .sort((left, right) => right.length - left.length);
            if (aliases.some((alias) => source.includes(alias))) {
                names.add(name);
            }
        });

        return names;
    }

    collectCharacterNamesFromChapterArtifacts(chapter = {}, options = {}) {
        const registry = options.registry || this.getWorldStateFormalCharacterRegistry();
        const includeOutline = options.includeOutline !== false;
        const includeContent = options.includeContent !== false;
        const includeStoredExtras = options.includeStoredExtras !== false;
        const rawContent = Object.prototype.hasOwnProperty.call(options, "rawContent")
            ? String(options.rawContent || "")
            : this.getStoredChapterContent(chapter);
        const cleanedContent = Object.prototype.hasOwnProperty.call(options, "cleanedContent")
            ? String(options.cleanedContent || "").trim()
            : this.stripGeneratedMarkers(rawContent).trim();
        const chapterNumber = Number(chapter?.number || chapter?.chapter_number || 0);
        const names = new Set();
        const addName = (value) => {
            const normalized = this.normalizeExtraCharacterNameCandidate(value)
                || this.normalizeCharacterReferenceLabel(value)
                || String(value || "").trim();
            const resolved = this.resolveKnownCharacterName(normalized || value);
            if (resolved) {
                names.add(resolved);
            }
        };

        if (includeOutline) {
            Utils.ensureArrayFromText(chapter?.characters || "").forEach(addName);
            this.extractCharacterSeedsFromSummary(chapter?.summary || "", chapterNumber).forEach((item) => addName(item.name));
            this.collectReferencedFormalCharacterNamesFromText(
                `${chapter?.title || ""}\n${chapter?.summary || ""}`,
                registry
            ).forEach(addName);
        }

        if (includeContent && cleanedContent) {
            this.collectReferencedFormalCharacterNamesFromText(cleanedContent, registry).forEach(addName);
        }

        if (includeStoredExtras) {
            const extraRecord = Object.prototype.hasOwnProperty.call(options, "extraRecord")
                ? options.extraRecord
                : this.novelData.extra_character_records?.[`chapter_${chapterNumber}`];
            (Array.isArray(extraRecord?.characters) ? extraRecord.characters : []).forEach((value) => {
                const normalized = this.normalizeExtraCharacterNameCandidate(value)
                    || this.normalizeCharacterReferenceLabel(value)
                    || String(value || "").trim();
                const resolved = this.resolveKnownCharacterName(normalized || value);
                if (!resolved) {
                    return;
                }
                if (includeContent && cleanedContent && !cleanedContent.includes(resolved)) {
                    return;
                }
                names.add(resolved);
            });
        }

        return Array.from(names);
    }

    buildCharacterCleanupReferenceSnapshot(options = {}) {
        const excludedChapterIds = options.excludedChapterIds instanceof Set
            ? options.excludedChapterIds
            : new Set(options.excludedChapterIds || []);
        const registry = options.registry || this.getWorldStateFormalCharacterRegistry();
        const chapterNames = new Set();
        const planNames = new Set();
        const chapterTexts = [];
        const planTexts = [];
        const addChapterName = (value) => {
            const resolved = this.resolveKnownCharacterName(this.normalizeCharacterReferenceLabel(value) || value);
            if (resolved) {
                chapterNames.add(resolved);
            }
        };
        const addPlanName = (value) => {
            const resolved = this.resolveKnownCharacterName(this.normalizeCharacterReferenceLabel(value) || value);
            if (resolved) {
                planNames.add(resolved);
            }
        };
        const pushText = (bucket, value) => {
            const text = String(value || "").trim();
            if (text) {
                bucket.push(text);
            }
        };

        this.iterateAllChapters((chapter) => {
            if (excludedChapterIds.has(chapter?.id)) {
                return;
            }

            const rawContent = this.getStoredChapterContent(chapter);
            const cleanedContent = this.stripGeneratedMarkers(rawContent).trim();
            this.collectCharacterNamesFromChapterArtifacts(chapter, {
                registry,
                rawContent,
                cleanedContent,
                includeOutline: true,
                includeContent: true,
                includeStoredExtras: true
            }).forEach(addChapterName);
            pushText(chapterTexts, chapter?.title);
            pushText(chapterTexts, chapter?.summary);
            pushText(chapterTexts, cleanedContent);
        });

        const synopsisData = this.novelData.synopsisData || this.novelData.synopsis_data || {};
        pushText(planTexts, this.novelData.outline?.detailed_outline);
        pushText(planTexts, this.novelData.outline?.worldbuilding);
        pushText(planTexts, this.novelData.outline?.user_context);
        pushText(planTexts, synopsisData.story_concept || synopsisData.storyConcept);
        pushText(planTexts, synopsisData.volume_synopsis || synopsisData.volumeSynopsis);
        pushText(planTexts, synopsisData.synopsis_output || synopsisData.synopsisOutput);
        (this.novelData.outline?.volumes || []).forEach((volume) => {
            pushText(planTexts, volume?.title);
            pushText(planTexts, volume?.summary);
            pushText(planTexts, volume?.chapterSynopsis || volume?.chapter_synopsis);
        });
        planTexts.forEach((text) => {
            this.collectReferencedFormalCharacterNamesFromText(text, registry).forEach(addPlanName);
        });

        return {
            registry,
            chapterNames,
            planNames,
            referencedNames: new Set([...chapterNames, ...planNames]),
            projectTexts: [...chapterTexts, ...planTexts]
        };
    }

    isCharacterSourceRich(source = {}) {
        if (!source || typeof source !== "object") {
            return String(source || "").trim().length >= 20;
        }

        const identity = String(source.identity || source.role || source["身份"] || source.type || "").trim();
        const background = String(source.background || source["背景故事"] || "").trim();
        let score = [
            identity,
            source.age,
            source.gender,
            source.personality,
            source["性格特点"],
            background,
            source.appearance,
            source["外貌描述"],
            source.abilities,
            source["能力特长"],
            source.goals,
            source["目标动机"],
            source.relationships,
            source["人物关系"]
        ].map((item) => String(item || "").trim()).filter(Boolean).length;

        if (identity && /^(章纲出场角色|待补人物状态)$/u.test(identity)) {
            score -= 1;
        }
        if (background && /(?:第\s*\d+\s*章|章节|章纲).*(?:提及角色|出场角色)|后续可补充背景/u.test(background)) {
            score -= 1;
        }

        return score >= 3;
    }

    buildProtectedCharacterNameSet() {
        const protectedNames = new Set();
        const addName = (value) => {
            const resolved = this.resolveKnownCharacterName(this.normalizeCharacterReferenceLabel(value) || value);
            if (resolved) {
                protectedNames.add(resolved);
            }
        };

        Object.values((this.novelData.synopsisData || this.novelData.synopsis_data || {}).main_characters || {})
            .forEach(addName);
        (this.novelData.outline?.characters || []).forEach((character) => {
            if (this.isCharacterSourceRich(character)) {
                addName(character?.name || character?.["角色名"] || "");
            }
        });
        Object.entries(this.novelData.supporting_characters || {}).forEach(([name, value]) => {
            const source = value && typeof value === "object" ? value : { identity: String(value || "") };
            if (this.isCharacterSourceRich(source)) {
                addName(source?.name || name);
            }
        });
        Object.entries((this.novelData.synopsisData || this.novelData.synopsis_data || {}).locked_character_names || {}).forEach(([name, value]) => {
            if (this.isCharacterSourceRich(value || {})) {
                addName(name);
            }
        });

        return protectedNames;
    }

    isCharacterNameReferencedInCleanupSnapshot(name, snapshot) {
        const cleanName = this.resolveKnownCharacterName(this.normalizeCharacterReferenceLabel(name) || name);
        if (!cleanName) {
            return false;
        }
        if (snapshot?.referencedNames?.has(cleanName)) {
            return true;
        }
        return (snapshot?.projectTexts || []).some((text) => String(text || "").includes(cleanName));
    }

    cleanupOrphanedCharacterArtifacts(options = {}) {
        const synopsisData = this.novelData.synopsisData || this.novelData.synopsis_data || {};
        const referenceSnapshot = options.referenceSnapshot || this.buildCharacterCleanupReferenceSnapshot({
            excludedChapterIds: options.excludedChapterIds
        });
        const protectedNames = options.protectedNames || this.buildProtectedCharacterNameSet();
        const candidateSet = new Set();
        const explicitCandidates = options.candidateNames instanceof Set
            ? Array.from(options.candidateNames)
            : Array.isArray(options.candidateNames)
                ? options.candidateNames
                : [];
        const aliasOwners = new Map();
        referenceSnapshot.registry?.forEach((entry, name) => {
            Array.from(entry?.aliases || []).forEach((alias) => {
                const normalizedAlias = this.normalizeCharacterReferenceLabel(alias);
                if (!normalizedAlias) {
                    return;
                }
                if (!aliasOwners.has(normalizedAlias)) {
                    aliasOwners.set(normalizedAlias, new Set());
                }
                aliasOwners.get(normalizedAlias).add(name);
            });
        });
        const uniqueAliasMap = new Map(
            Array.from(aliasOwners.entries())
                .filter(([, owners]) => owners.size === 1)
                .map(([alias, owners]) => [alias, Array.from(owners)[0]])
        );
        const canonicalizeName = (value) => {
            const normalized = this.normalizeExtraCharacterNameCandidate(value)
                || this.normalizeCharacterReferenceLabel(value)
                || String(value || "").trim();
            if (!normalized) {
                return "";
            }
            if (uniqueAliasMap.has(normalized)) {
                return uniqueAliasMap.get(normalized);
            }
            return String(this.resolveKnownCharacterName(normalized || value) || normalized).trim();
        };
        const addCandidate = (value) => {
            const canonical = canonicalizeName(value);
            if (canonical) {
                candidateSet.add(canonical);
            }
        };
        const filterCharacterMap = (value) => Object.fromEntries(
            Object.entries(value || {}).filter(([name]) => !removedNames.has(canonicalizeName(name)))
        );
        const filterRelationshipMap = (value) => Object.fromEntries(
            Object.entries(value || {}).filter(([key]) => {
                const parts = String(key || "").split("|").map((item) => canonicalizeName(item)).filter(Boolean);
                return !parts.some((name) => removedNames.has(name));
            })
        );

        if (explicitCandidates.length) {
            explicitCandidates.forEach(addCandidate);
        } else {
            (this.novelData.outline?.characters || []).forEach((character) => addCandidate(character?.name || character?.["角色名"] || ""));
            Object.entries(this.novelData.supporting_characters || {}).forEach(([name, value]) => {
                addCandidate(name);
                addCandidate(value?.name || value?.["角色名"] || "");
            });
            Object.keys(synopsisData.locked_character_names || {}).forEach(addCandidate);
            Object.values(synopsisData.vague_to_name_mapping || {}).forEach(addCandidate);
            Object.keys(this.novelData.outline?.story_state?.characters || {}).forEach(addCandidate);
            Object.keys(this.novelData.dynamic_tracker?.character_states || {}).forEach(addCandidate);
            Object.keys(this.novelData.dynamic_tracker?.appearances || {}).forEach(addCandidate);
            Object.keys(this.novelData.character_checker?.character_states || {}).forEach(addCandidate);
            Object.keys(this.novelData.character_appearance_tracker?.appearances || {}).forEach(addCandidate);
            Object.keys(this.novelData.world_tracker?.character_positions || {}).forEach(addCandidate);
            Object.keys(this.novelData.world_tracker?.offscreen_status || {}).forEach(addCandidate);
            Object.keys(this.novelData.genre_progress_tracker?.rank_progress || {}).forEach(addCandidate);
            Object.keys(this.novelData.genre_progress_tracker?.status_progress || {}).forEach(addCandidate);
            Object.keys(this.novelData.genre_progress_tracker?.pregnancy_progress || {}).forEach(addCandidate);
            Object.keys(this.novelData.character_appearance_tracker?.relationships || {}).forEach((key) => {
                String(key || "").split("|").forEach(addCandidate);
            });
            Object.entries(this.novelData.extra_character_records || {}).forEach(([, record]) => {
                (Array.isArray(record?.characters) ? record.characters : []).forEach(addCandidate);
            });
        }

        const removedNames = new Set();
        candidateSet.forEach((name) => {
            if (protectedNames.has(name)) {
                return;
            }
            if (this.isCharacterNameReferencedInCleanupSnapshot(name, referenceSnapshot)) {
                return;
            }
            removedNames.add(name);
        });

        if (!removedNames.size) {
            return {
                changed: false,
                removedCount: 0,
                removedNames: []
            };
        }

        const originalOutlineCount = (this.novelData.outline?.characters || []).length;
        this.novelData.outline.characters = (this.novelData.outline?.characters || []).filter((character) => {
            const name = canonicalizeName(character?.name || character?.["角色名"] || "");
            return !removedNames.has(name);
        });

        const nextSupportingCharacters = {};
        Object.entries(this.novelData.supporting_characters || {}).forEach(([name, value]) => {
            const canonical = canonicalizeName(value?.name || value?.["角色名"] || name);
            if (!removedNames.has(canonical)) {
                nextSupportingCharacters[name] = value;
            }
        });
        this.novelData.supporting_characters = nextSupportingCharacters;

        synopsisData.locked_character_names = Object.fromEntries(
            Object.entries(synopsisData.locked_character_names || {}).filter(([name]) => !removedNames.has(canonicalizeName(name)))
        );
        synopsisData.vague_to_name_mapping = Object.fromEntries(
            Object.entries(synopsisData.vague_to_name_mapping || {}).filter(([, realName]) => !removedNames.has(canonicalizeName(realName)))
        );

        this.novelData.outline.story_state = this.novelData.outline.story_state || {};
        this.novelData.outline.story_state.characters = filterCharacterMap(this.novelData.outline.story_state.characters || {});

        if (this.novelData.dynamic_tracker && typeof this.novelData.dynamic_tracker === "object") {
            this.novelData.dynamic_tracker.character_states = filterCharacterMap(this.novelData.dynamic_tracker.character_states || {});
            this.novelData.dynamic_tracker.appearances = filterCharacterMap(this.novelData.dynamic_tracker.appearances || {});
            this.novelData.dynamic_tracker.relationships = filterRelationshipMap(this.novelData.dynamic_tracker.relationships || {});
        }
        if (this.novelData.character_checker && typeof this.novelData.character_checker === "object") {
            this.novelData.character_checker.character_states = filterCharacterMap(this.novelData.character_checker.character_states || {});
        }
        if (this.novelData.character_appearance_tracker && typeof this.novelData.character_appearance_tracker === "object") {
            this.novelData.character_appearance_tracker.appearances = filterCharacterMap(this.novelData.character_appearance_tracker.appearances || {});
            this.novelData.character_appearance_tracker.relationships = filterRelationshipMap(this.novelData.character_appearance_tracker.relationships || {});
        }
        if (this.novelData.world_tracker && typeof this.novelData.world_tracker === "object") {
            this.novelData.world_tracker.character_positions = filterCharacterMap(this.novelData.world_tracker.character_positions || {});
            this.novelData.world_tracker.offscreen_status = filterCharacterMap(this.novelData.world_tracker.offscreen_status || {});
        }
        if (this.novelData.genre_progress_tracker && typeof this.novelData.genre_progress_tracker === "object") {
            this.novelData.genre_progress_tracker.rank_progress = filterCharacterMap(this.novelData.genre_progress_tracker.rank_progress || {});
            this.novelData.genre_progress_tracker.status_progress = filterCharacterMap(this.novelData.genre_progress_tracker.status_progress || {});
            this.novelData.genre_progress_tracker.pregnancy_progress = filterCharacterMap(this.novelData.genre_progress_tracker.pregnancy_progress || {});
        }

        Object.entries(this.novelData.extra_character_records || {}).forEach(([key, record]) => {
            const nextCharacters = (Array.isArray(record?.characters) ? record.characters : [])
                .filter((name) => !removedNames.has(canonicalizeName(name)));
            this.novelData.extra_character_records[key] = {
                ...(record && typeof record === "object" ? record : {}),
                characters: nextCharacters
            };
        });
        this.novelData.used_extras_characters = (this.novelData.used_extras_characters || [])
            .filter((name) => !removedNames.has(canonicalizeName(name)));

        this.novelData.synopsisData = synopsisData;
        this.novelData.synopsis_data = JSON.parse(JSON.stringify(synopsisData));
        this.rebuildUsedExtraCharacters();
        this.ensureWorldStateManager();
        this.syncWorldStateManager();

        return {
            changed: originalOutlineCount !== this.novelData.outline.characters.length
                || removedNames.size > 0,
            removedCount: removedNames.size,
            removedNames: Array.from(removedNames)
        };
    }

    sanitizeHistoricalExtraCharacterRecords(records = {}) {
        const chapterContentMap = new Map(
            this.getOrderedChapterRecords(true).map((item) => [
                Number(item.chapter?.number || 0),
                item.cleanedContent || ""
            ])
        );
        const sanitized = {};

        Object.entries(records || {}).forEach(([key, record]) => {
            const chapterNumber = this.extractSnapshotChapterNumber(key);
            const cleanedContent = String(chapterContentMap.get(chapterNumber) || "");
            const seen = new Set();
            const nextCharacters = (Array.isArray(record?.characters) ? record.characters : [])
                .map((name) => this.resolveExtraCharacterNameFromCandidate(name, cleanedContent))
                .filter((name) => {
                    if (!name || seen.has(name)) {
                        return false;
                    }
                    seen.add(name);
                    return true;
                });

            if (!nextCharacters.length) {
                return;
            }

            sanitized[key] = {
                ...(record && typeof record === "object" ? record : {}),
                chapter: chapterNumber || Number(record?.chapter || 0) || 0,
                characters: nextCharacters
            };
        });

        return sanitized;
    }

    buildHistoricalStateFallbackFromSnapshot(snapshot = {}) {
        const keyMemories = Array.isArray(snapshot?.["关键信息"]) ? snapshot["关键信息"] : [];
        return {
            timeline: this.pickWorldStateText(snapshot.timeline, snapshot["时间"]),
            current_location: this.pickWorldStateText(snapshot.current_location, snapshot["位置"]),
            important_items: this.pickWorldStateText(snapshot.important_items, snapshot["重要物品"]),
            pending_plots: this.pickWorldStateText(snapshot.pending_plots, snapshot["待推进事项"]),
            key_event: this.pickWorldStateText(snapshot.key_event, keyMemories[0]),
            characters: {}
        };
    }

    hasMeaningfulHistoricalStateFallback(stateData = {}) {
        return Boolean(
            stateData.timeline
            || stateData.current_location
            || stateData.important_items
            || stateData.pending_plots
            || stateData.key_event
        );
    }

    resetHistoricalStateRebuildTargets(extraCharacterRecords = {}, usedTempSubplots = [], manualWorldState = {}) {
        this.novelData.outline.story_state = this.deepClone(DEFAULT_NOVEL_DATA.outline.story_state);
        this.novelData.story_state = this.deepClone(DEFAULT_NOVEL_DATA.story_state);
        this.novelData.dynamic_tracker = this.deepClone(DEFAULT_NOVEL_DATA.dynamic_tracker);
        this.novelData.timeline_tracker = this.deepClone(DEFAULT_NOVEL_DATA.timeline_tracker);
        this.novelData.chapter_snapshot = this.deepClone(DEFAULT_NOVEL_DATA.chapter_snapshot);
        this.novelData.character_checker = this.deepClone(DEFAULT_NOVEL_DATA.character_checker);
        this.novelData.character_appearance_tracker = this.deepClone(DEFAULT_NOVEL_DATA.character_appearance_tracker);
        this.novelData.world_tracker = this.deepClone(DEFAULT_NOVEL_DATA.world_tracker);
        this.novelData.genre_progress_tracker = this.deepClone(DEFAULT_NOVEL_DATA.genre_progress_tracker);
        this.novelData.world_state_manager = this.deepClone(DEFAULT_NOVEL_DATA.world_state_manager);
        this.novelData.chapter_rhythms = {};
        this.novelData.chapter_emotions = {};
        this.novelData.outline.state_snapshots = {};
        this.novelData.extra_character_records = this.deepClone(extraCharacterRecords || {});
        this.novelData.used_temp_subplots = Array.isArray(usedTempSubplots) ? this.deepClone(usedTempSubplots) : [];
        this.novelData.used_extras_characters = [];
        this.rebuildUsedExtraCharacters();
        const manager = this.ensureWorldStateManager();
        manager.manual_state = this.deepClone(manualWorldState || DEFAULT_NOVEL_DATA.world_state_manager.manual_state || {});
        this.syncWorldStateManager();
    }

    async rebuildHistoricalStateFromChapters() {
        const chapterRecords = this.getOrderedChapterRecords(false);
        if (!chapterRecords.length) {
            Utils.showMessage("当前还没有可用于重建的章节正文。", "info");
            return;
        }

        const ok = window.confirm(
            `这会按现有正文逐章重提取状态，共 ${chapterRecords.length} 章。\n\n`
            + "会覆盖：故事状态、动态追踪、时间线、章末快照、人物状态/出场、世界状态总表、题材进度、状态快照。\n"
            + "不会改动：正文、大纲、人物设定、伏笔、秘密矩阵、手动世界状态。\n\n"
            + "过程中会调用 AI 补提取状态，可能耗时并消耗接口额度。确定继续吗？"
        );
        if (!ok) {
            return;
        }

        const manualWorldState = this.deepClone(this.ensureWorldStateManager().manual_state || DEFAULT_NOVEL_DATA.world_state_manager.manual_state);
        const extraRecordsBackup = this.deepClone(this.novelData.extra_character_records || {});
        const usedTempSubplotsBackup = this.deepClone(this.novelData.used_temp_subplots || []);
        const chapterSnapshotBackup = this.deepClone(this.novelData.chapter_snapshot?.snapshots || {});
        const analysisReportBackup = this.deepClone(this.novelData.chapter_analysis_reports || {});
        const qcReportBackup = this.deepClone(this.novelData.chapter_qc_reports || {});
        const nameLockerBackup = this.deepClone(this.novelData.name_locker || {});
        const foreshadowManagerBackup = this.deepClone(this.novelData.foreshadow_manager || {});
        const foreshadowTrackerBackup = this.deepClone(this.novelData.foreshadow_tracker || {});
        const secretMatrixBackup = this.deepClone(this.novelData.secret_matrix || {});
        const personalityEnforcerBackup = this.deepClone(this.novelData.personality_enforcer || {});
        const dialogueTrackerBackup = this.deepClone(this.novelData.dialogue_tracker || {});
        const sanitizedExtraRecords = this.sanitizeHistoricalExtraCharacterRecords(extraRecordsBackup);

        await this.runWithLoading("正在按正文重建历史状态...", async () => {
            Utils.updateLoading("正在清理旧状态并准备重建...", {
                progress: 10,
                detail: `共 ${chapterRecords.length} 章需要处理`,
                appendLog: true
            });

            this.resetHistoricalStateRebuildTargets(
                sanitizedExtraRecords,
                usedTempSubplotsBackup,
                manualWorldState
            );
            this.novelData.chapter_analysis_reports = analysisReportBackup;
            this.novelData.chapter_qc_reports = qcReportBackup;
            this.novelData.name_locker = nameLockerBackup;
            this.novelData.foreshadow_manager = foreshadowManagerBackup;
            this.novelData.foreshadow_tracker = foreshadowTrackerBackup;
            this.novelData.secret_matrix = secretMatrixBackup;
            this.novelData.personality_enforcer = personalityEnforcerBackup;
            this.novelData.dialogue_tracker = dialogueTrackerBackup;

            let rebuiltCount = 0;
            let fallbackCount = 0;
            let skippedCount = 0;
            const failedChapters = [];

            for (let index = 0; index < chapterRecords.length; index += 1) {
                const { volume, chapter, cleanedContent } = chapterRecords[index];
                const chapterNumber = Number(chapter?.number || 0);
                const progress = 12 + Math.round(((index + 1) / Math.max(1, chapterRecords.length)) * 82);
                const chapterLabel = `第${chapterNumber || "?"}章`;

                Utils.updateLoading(`正在重建 ${chapterLabel}`, {
                    progress,
                    detail: `第 ${index + 1}/${chapterRecords.length} 章`,
                    appendLog: true
                });

                if (!cleanedContent) {
                    skippedCount += 1;
                    Utils.log(`${chapterLabel} 没有正文，已跳过历史状态重建。`, "info");
                    continue;
                }

                let stateData = null;
                let effectiveStateData = {};
                try {
                    const recovered = await this.recoverMissingChapterStateData(volume, chapter, cleanedContent, "");
                    stateData = recovered.stateData;
                } catch (error) {
                    Utils.log(`${chapterLabel} 历史状态补提取失败：${error.message}`, "error");
                }

                if (stateData) {
                    this.applyStateUpdate(chapterNumber, chapter.title || `第${chapterNumber}章`, stateData, chapter, {
                        cleanedContent
                    });
                    effectiveStateData = stateData;
                    rebuiltCount += 1;
                } else {
                    const fallbackState = this.buildHistoricalStateFallbackFromSnapshot(chapterSnapshotBackup[`chapter_${chapterNumber}`] || {});
                    if (this.hasMeaningfulHistoricalStateFallback(fallbackState)) {
                        this.applyStateUpdate(chapterNumber, chapter.title || `第${chapterNumber}章`, fallbackState, chapter, {
                            cleanedContent
                        });
                        effectiveStateData = fallbackState;
                        fallbackCount += 1;
                        Utils.log(`${chapterLabel} 状态补提取失败，已回退为旧快照的基础字段。`, "warning");
                    } else {
                        failedChapters.push(chapterNumber);
                        Utils.log(`${chapterLabel} 没有可用的状态回退数据，本章只保留正文和现有龙套记录。`, "warning");
                    }
                }

                const scanStats = this.scanChapterStateSignals(chapterNumber, chapter, cleanedContent, effectiveStateData);
                if (scanStats.appearances || scanStats.items) {
                    Utils.log(`${chapterLabel} 正文补扫：人物/形象 ${scanStats.appearances} 条，物品 ${scanStats.items} 条。`, "info");
                }
                this.recordChapterAnalysisTags(chapterNumber, chapter, cleanedContent, effectiveStateData);

                if ((index + 1) % 5 === 0) {
                    this.persist(true);
                }
            }

            this.syncWorldStateManager();
            this.renderAll();
            this.persist(true);

            const summary = `历史状态重建完成：成功补提取 ${rebuiltCount} 章，快照回退 ${fallbackCount} 章，跳过 ${skippedCount} 章。`;
            Utils.updateLoading(summary, {
                progress: 100,
                detail: failedChapters.length
                    ? `仍有 ${failedChapters.length} 章未拿到状态数据：第 ${failedChapters.join("、")} 章`
                    : "所有可处理章节都已完成重建",
                appendLog: true
            });
            Utils.showMessage(summary, failedChapters.length ? "info" : "success");
            Utils.log(summary, failedChapters.length ? "warning" : "success");
            if (failedChapters.length) {
                Utils.log(`以下章节仍未拿到状态数据：第 ${failedChapters.join("、")} 章。`, "warning");
            }
        });
    }

    applyStateUpdate(chapterNumber, chapterTitle, stateData, chapter = null, options = {}) {
        const evidence = this.buildWorldStateCharacterEvidence(
            chapterNumber,
            chapter,
            options.cleanedContent || "",
            options.extraCharactersBlock || ""
        );
        const sanitizedStateData = this.sanitizeStateDataWithCharacterEvidence(stateData, evidence);
        const outlineState = this.novelData.outline.story_state || {};
        outlineState.timeline = sanitizedStateData.timeline || outlineState.timeline || "";
        outlineState.current_location = sanitizedStateData.current_location || outlineState.current_location || "";
        outlineState.important_items = sanitizedStateData.important_items || outlineState.important_items || "";
        outlineState.pending_plots = sanitizedStateData.pending_plots || outlineState.pending_plots || "";
        outlineState.characters = outlineState.characters || {};

        Object.entries(sanitizedStateData.characters || {}).forEach(([name, state]) => {
            outlineState.characters[name] = {
                ...(outlineState.characters[name] || {}),
                ...state
            };
        });

        if (sanitizedStateData.key_event) {
            outlineState.key_memories = Array.isArray(outlineState.key_memories) ? outlineState.key_memories : [];
            outlineState.key_memories.push({
                chapter: chapterNumber,
                event: sanitizedStateData.key_event
            });
            outlineState.key_memories = outlineState.key_memories.slice(-30);
        }

        this.novelData.outline.story_state = outlineState;
        this.novelData.story_state.current_location = outlineState.current_location || "";
        this.novelData.story_state.current_time = outlineState.timeline || "";

        this.recordChapterSnapshot(chapterNumber, chapterTitle, sanitizedStateData, chapter);
        this.recordTimelineUpdate(chapterNumber, sanitizedStateData);
        this.recordDynamicStateUpdateRich(chapterNumber, sanitizedStateData);
        this.recordWorldTrackerUpdate(chapterNumber, sanitizedStateData);
        this.recordCharacterCheckerState(chapterNumber, sanitizedStateData);
        this.recordAppearanceStateUpdate(chapterNumber, sanitizedStateData);
        this.recordGenreProgressUpdate(chapterNumber, sanitizedStateData);
        this.recordPendingSubplots(chapterNumber, sanitizedStateData);
        this.recordFullStateSnapshot(chapterNumber, chapterTitle);
    }

    getWorldStateFormalCharacterRegistry() {
        const registry = new Map();
        const upsert = (rawName, source = {}) => {
            const fallbackName = source?.name || source?.character || source?.character_name || source?.["角色名"] || source?.["角色"] || "";
            const name = this.resolveKnownCharacterName(rawName || fallbackName);
            if (!name) {
                return;
            }

            const existing = registry.get(name) || {
                name,
                aliases: new Set([name]),
                identityTokens: new Set()
            };

            Utils.ensureArrayFromText(source?.aliases || source?.["别名"] || "").forEach((alias) => {
                const normalizedAlias = this.normalizeCharacterReferenceLabel(alias);
                if (normalizedAlias) {
                    existing.aliases.add(normalizedAlias);
                }
            });

            this.extractWorldStateIdentityTokens(
                this.pickWorldStateText(
                    source?.identity,
                    source?.role,
                    source?.["身份"],
                    source?.["角色身份"],
                    source?.tags,
                    source?.["标签"]
                )
            ).forEach((token) => existing.identityTokens.add(token));

            registry.set(name, existing);
        };

        (this.novelData.outline?.characters || []).forEach((character) => {
            upsert(character?.name || character?.["角色名"] || "", character || {});
        });

        Object.entries(this.novelData.supporting_characters || {}).forEach(([name, value]) => {
            const source = value && typeof value === "object" ? value : { identity: String(value || "") };
            upsert(name, source);
        });

        Object.values((this.novelData.synopsisData || this.novelData.synopsis_data || {}).main_characters || {}).forEach((name) => {
            upsert(name, { name });
        });

        Object.entries((this.novelData.synopsisData || this.novelData.synopsis_data || {}).locked_character_names || {}).forEach(([name, value]) => {
            const source = value && typeof value === "object" ? value : {};
            upsert(name, {
                ...source,
                name,
                aliases: source?.aliases || []
            });
        });

        return registry;
    }

    extractWorldStateIdentityTokens(text) {
        const tokens = new Set();
        String(text || "")
            .split(/[\r\n,\uFF0C\u3001\/|\uFF1B;]+/)
            .map((item) => String(item || "").trim())
            .filter((item) => this.isUsableWorldStateIdentityToken(item))
            .forEach((item) => tokens.add(item));
        return Array.from(tokens);
    }

    isUsableWorldStateIdentityToken(token) {
        const text = String(token || "").trim();
        if (!text || text.length < 3 || text.length > 24) {
            return false;
        }
        if (!/[\u4e00-\u9fa5A-Za-z]/u.test(text)) {
            return false;
        }
        return !/^(主角|男主|女主|反派|路人|众人|学徒工|工人|学生|老师|主任|科长|干部|家庭妇女|待业青年|师兄|师姐|师弟|师妹|父亲|母亲|哥哥|姐姐|妹妹|弟弟|老板|上司|同事|邻居|室友)$/u.test(text);
    }

    collectWorldStateExtraCharacterNames(chapterNumber = 0, block = "", cleanedContent = "", includeStored = true) {
        const names = new Set();
        const targetChapter = Number(chapterNumber || 0);
        const maxChapter = targetChapter > 0 ? targetChapter : Infinity;

        if (includeStored) {
            Object.entries(this.novelData.extra_character_records || {})
                .filter(([key]) => this.extractSnapshotChapterNumber(key) <= maxChapter)
                .forEach(([, record]) => {
                    (Array.isArray(record?.characters) ? record.characters : []).forEach((name) => {
                        const text = this.resolveExtraCharacterNameFromCandidate(name);
                        if (text) {
                            names.add(text);
                        }
                    });
                });
        }

        const content = String(cleanedContent || "");
        if (!block) {
            return names;
        }

        block.split(/\r?\n/).forEach((line) => {
            const text = line.trim();
            if (!/^(?:\u9F99\u5957\u89D2\u8272|\u65B0\u589E\u9F99\u5957)[:\uFF1A]/u.test(text)) {
                return;
            }
            const payload = text.replace(/^(?:\u9F99\u5957\u89D2\u8272|\u65B0\u589E\u9F99\u5957)[:\uFF1A]\s*/u, "");
            this.splitExtraCharacterPayload(payload).forEach((item) => {
                const name = this.resolveExtraCharacterNameFromCandidate(item, content);
                if (!name) {
                    return;
                }
                names.add(name);
            });
        });

        return names;
    }

    buildWorldStateCharacterEvidence(chapterNumber = 0, chapter = null, cleanedContent = "", extraCharactersBlock = "") {
        const formalRegistry = this.getWorldStateFormalCharacterRegistry();
        const formalNames = new Set(formalRegistry.keys());
        const aliasOwners = new Map();
        const outlineNames = new Set([
            ...Utils.ensureArrayFromText(chapter?.characters || "")
                .map((name) => this.resolveKnownCharacterName(name))
                .filter((name) => formalNames.has(name)),
            ...this.extractCharacterSeedsFromSummary(chapter?.summary || "", Number(chapterNumber || 0))
                .map((item) => item.name)
                .filter((name) => formalNames.has(name))
        ]);
        const matchedFormalNames = new Set();
        const content = String(cleanedContent || "");

        formalRegistry.forEach((entry, name) => {
            Array.from(entry.aliases || []).forEach((alias) => {
                const normalizedAlias = this.normalizeCharacterReferenceLabel(alias);
                if (!normalizedAlias) {
                    return;
                }
                if (!aliasOwners.has(normalizedAlias)) {
                    aliasOwners.set(normalizedAlias, new Set());
                }
                aliasOwners.get(normalizedAlias).add(name);
            });
        });
        const formalAliasMap = new Map(
            Array.from(aliasOwners.entries())
                .filter(([, owners]) => owners.size === 1)
                .map(([alias, owners]) => [alias, Array.from(owners)[0]])
        );

        if (content) {
            formalRegistry.forEach((entry, name) => {
                const aliases = Array.from(entry.aliases || [])
                    .map((alias) => String(alias || "").trim())
                    .filter((alias) => alias.length >= 2)
                    .sort((left, right) => right.length - left.length);
                if (aliases.some((alias) => content.includes(alias))) {
                    matchedFormalNames.add(name);
                }
            });

            const identityOwnerMap = new Map();
            formalRegistry.forEach((entry, name) => {
                Array.from(entry.identityTokens || []).forEach((token) => {
                    if (!identityOwnerMap.has(token)) {
                        identityOwnerMap.set(token, new Set());
                    }
                    identityOwnerMap.get(token).add(name);
                });
            });

            identityOwnerMap.forEach((owners, token) => {
                if (owners.size === 1 && content.includes(token)) {
                    matchedFormalNames.add(Array.from(owners)[0]);
                }
            });
        }

        const extraNames = this.collectWorldStateExtraCharacterNames(
            chapterNumber,
            extraCharactersBlock,
            cleanedContent,
            true
        );

        return {
            formalNames,
            formalAliasMap,
            outlineNames,
            matchedFormalNames,
            extraNames,
            allowedStateNames: new Set([...outlineNames, ...matchedFormalNames, ...extraNames]),
            allowedRosterNames: new Set([...formalNames, ...extraNames])
        };
    }

    resolveWorldStateCharacterByEvidence(name, evidence = null, mode = "state") {
        const proof = evidence || this.buildWorldStateCharacterEvidence();
        const allowedNames = mode === "roster" ? proof.allowedRosterNames : proof.allowedStateNames;
        const cleanName = this.normalizeCharacterReferenceLabel(name);
        if (!cleanName) {
            return "";
        }

        const exactAliasMatch = proof.formalAliasMap?.get(cleanName) || "";
        if (exactAliasMatch && allowedNames.has(exactAliasMatch)) {
            return exactAliasMatch;
        }
        if (allowedNames.has(cleanName)) {
            return cleanName;
        }

        const resolvedName = this.resolveKnownCharacterName(cleanName);
        if (resolvedName && allowedNames.has(resolvedName)) {
            if (resolvedName === cleanName) {
                return resolvedName;
            }
            if (/^(主角|男主|女主|反派|男二|女二|师尊)$/u.test(cleanName)) {
                return resolvedName;
            }
        }

        const extraCandidate = this.normalizeExtraCharacterNameCandidate(name);
        if (extraCandidate && allowedNames.has(extraCandidate)) {
            return extraCandidate;
        }

        return "";
    }

    extractWorldStateProgressRoleName(entry) {
        if (typeof entry === "string") {
            const text = String(entry || "").trim();
            if (!text) {
                return "";
            }
            if (text.includes("\uFF08")) {
                return text.split("\uFF08", 2)[0].trim();
            }
            if (text.includes("(")) {
                return text.split("(", 2)[0].trim();
            }
            if (text.includes("\uFF1A")) {
                return text.split("\uFF1A", 2)[0].trim();
            }
            if (text.includes(":")) {
                return text.split(":", 2)[0].trim();
            }
            return text.split(/[\uFF0C,]/, 2)[0].trim();
        }

        if (!entry || typeof entry !== "object") {
            return "";
        }

        return String(
            entry.role
            || entry.name
            || entry.character
            || entry.character_name
            || entry["角色名"]
            || entry["角色"]
            || ""
        ).trim();
    }

    sanitizeStateDataWithCharacterEvidence(stateData, evidence) {
        const source = stateData && typeof stateData === "object" ? stateData : {};
        const sanitized = {
            ...source,
            characters: {}
        };

        Object.entries(source.characters || {}).forEach(([rawName, value]) => {
            const fallbackName = value && typeof value === "object"
                ? value.name || value.character || value.character_name || value["角色名"] || value["角色"] || ""
                : "";
            const name = this.resolveWorldStateCharacterByEvidence(rawName || fallbackName, evidence, "state");
            if (!name) {
                return;
            }
            sanitized.characters[name] = {
                ...(sanitized.characters[name] || {}),
                ...(value && typeof value === "object" ? value : {})
            };
        });

        const worldChangesSource = source.world_changes && typeof source.world_changes === "object" && !Array.isArray(source.world_changes)
            ? source.world_changes
            : {};
        const worldChanges = {
            ...worldChangesSource,
            character_movements: this.coerceStateArray(worldChangesSource.character_movements).flatMap((movement) => {
                const parsed = this.parseWorldTrackerMovementEntry(movement);
                const name = this.resolveWorldStateCharacterByEvidence(parsed.name, evidence, "roster");
                if (!name || !parsed.position) {
                    return [];
                }
                if (movement && typeof movement === "object") {
                    return [{
                        ...movement,
                        name
                    }];
                }
                return [`${name}->${parsed.position}`];
            }),
            offscreen_status: this.coerceStateArray(worldChangesSource.offscreen_status).flatMap((status) => {
                if (status && typeof status === "object") {
                    const rawName = status.name || status.character || status.role || status.person || status["角色"] || status["人物"] || "";
                    const name = this.resolveWorldStateCharacterByEvidence(rawName, evidence, "roster");
                    if (!name) {
                        return [];
                    }
                    return [{
                        ...status,
                        name
                    }];
                }

                const text = String(status || "").trim();
                if (!text.includes("\uFF1A") && !text.includes(":")) {
                    return [];
                }
                const [rawName, detail] = text.split(/[\uFF1A:]/, 2).map((part) => part.trim());
                const name = this.resolveWorldStateCharacterByEvidence(rawName, evidence, "roster");
                if (!name) {
                    return [];
                }
                return [`${name}\uFF1A${detail || ""}`.trim()];
            })
        };
        sanitized.world_changes = worldChanges;

        sanitized.appearance_changes = this.coerceStateArray(source.appearance_changes).flatMap((item) => {
            const rawName = typeof item === "string"
                ? this.extractWorldStateProgressRoleName(item)
                : item?.name || item?.character || item?.character_name || item?.["角色名"] || item?.["角色"] || "";
            const name = this.resolveWorldStateCharacterByEvidence(rawName, evidence, "roster");
            if (!name) {
                return [];
            }
            if (item && typeof item === "object") {
                return [{
                    ...item,
                    name
                }];
            }
            return [item];
        });

        sanitized.genre_progress = this.coerceStateArray(source.genre_progress).flatMap((item) => {
            const rawName = this.extractWorldStateProgressRoleName(item);
            const name = this.resolveWorldStateCharacterByEvidence(rawName, evidence, "roster");
            if (!name) {
                return [];
            }
            if (item && typeof item === "object") {
                const detail = this.pickWorldStateText(
                    item.detail,
                    item.description,
                    item.progress,
                    item.status,
                    item["描述"],
                    item["内容"]
                ) || JSON.stringify(item);
                return [`${name}：${detail}`];
            }
            return [item];
        });

        return sanitized;
    }

    recordChapterSnapshot(chapterNumber, chapterTitle, stateData, chapter = null) {
        const snapshots = this.novelData.chapter_snapshot.snapshots || {};
        const nextChapterSetup = chapter?.next_chapter_setup || {};
        const nextChapterExpectation = [
            nextChapterSetup.state_setup ? `状态铺垫：${nextChapterSetup.state_setup}` : "",
            nextChapterSetup.atmosphere_setup ? `氛围铺垫：${nextChapterSetup.atmosphere_setup}` : "",
            nextChapterSetup.suspense_hook ? `悬念钩子：${nextChapterSetup.suspense_hook}` : "",
            nextChapterSetup.clue_hint ? `线索暗示：${nextChapterSetup.clue_hint}` : "",
            nextChapterSetup.countdown ? `倒计时：${nextChapterSetup.countdown}` : ""
        ].filter(Boolean).join("；");
        snapshots[`chapter_${chapterNumber}`] = {
            title: chapterTitle,
            时间: stateData.timeline || "",
            位置: stateData.current_location || "",
            pending_plots: stateData.pending_plots || "",
            important_items: stateData.important_items || "",
            关键信息: stateData.key_event ? [stateData.key_event] : [],
            current_location: stateData.current_location || "",
            timeline: stateData.timeline || "",
            下一章预期: nextChapterExpectation || stateData.pending_plots || "",
            next_chapter_setup: nextChapterSetup,
            transition_focus: nextChapterSetup.state_setup || nextChapterSetup.suspense_hook || stateData.pending_plots || "",
            key_event: stateData.key_event || ""
        };
        this.novelData.chapter_snapshot.snapshots = snapshots;
    }

    deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    extractSnapshotChapterNumber(key) {
        const match = String(key || "").match(/chapter_(\d+)/i) || String(key || "").match(/(\d+)/);
        return match ? Number(match[1]) : 0;
    }

    recordFullStateSnapshot(chapterNumber, chapterTitle) {
        const snapshots = this.novelData.outline.state_snapshots || {};
        snapshots[`chapter_${chapterNumber}`] = {
            chapter: chapterNumber,
            title: chapterTitle,
            story_state: this.deepClone(this.novelData.outline.story_state || {}),
            compatibility_story_state: this.deepClone(this.novelData.story_state || {}),
            dynamic_tracker: this.deepClone(this.novelData.dynamic_tracker || {}),
            timeline_tracker: this.deepClone(this.novelData.timeline_tracker || {}),
            chapter_snapshot: this.deepClone(this.novelData.chapter_snapshot || {}),
            foreshadow_tracker: this.deepClone(this.novelData.foreshadow_tracker || {}),
            foreshadow_manager: this.deepClone(this.novelData.foreshadow_manager || {}),
            secret_matrix: this.deepClone(this.novelData.secret_matrix || {}),
            character_checker: this.deepClone(this.novelData.character_checker || {}),
            character_appearance_tracker: this.deepClone(this.novelData.character_appearance_tracker || {}),
            personality_enforcer: this.deepClone(this.novelData.personality_enforcer || {}),
            dialogue_tracker: this.deepClone(this.novelData.dialogue_tracker || {}),
            world_tracker: this.deepClone(this.novelData.world_tracker || {}),
            world_state_manager: this.deepClone(this.novelData.world_state_manager || {}),
            extra_character_records: this.deepClone(this.novelData.extra_character_records || {}),
            used_extras_characters: this.deepClone(this.novelData.used_extras_characters || []),
            genre_progress_tracker: this.deepClone(this.novelData.genre_progress_tracker || {}),
            name_locker: this.deepClone(this.novelData.name_locker || {}),
            used_temp_subplots: this.deepClone(this.novelData.used_temp_subplots || [])
        };
        this.novelData.outline.state_snapshots = snapshots;
    }

    trimStateSystemsAfterChapter(targetChapterNumber) {
        const target = Math.max(0, Number(targetChapterNumber || 0));
        const filterSnapshotObject = (source) => Object.fromEntries(
            Object.entries(source || {}).filter(([key]) => this.extractSnapshotChapterNumber(key) <= target)
        );

        this.novelData.chapter_snapshot.snapshots = filterSnapshotObject(this.novelData.chapter_snapshot?.snapshots);
        this.novelData.outline.state_snapshots = filterSnapshotObject(this.novelData.outline?.state_snapshots);
        this.novelData.extra_character_records = filterSnapshotObject(this.novelData.extra_character_records || {});
        this.rebuildUsedExtraCharacters(target);

        const timelineTracker = this.novelData.timeline_tracker || {};
        timelineTracker.timeline_events = (timelineTracker.timeline_events || []).filter((item) => Number(item.chapter || item["章节"] || 0) <= target);
        timelineTracker.time_constraints = (timelineTracker.time_constraints || []).filter((item) => Number(item.chapter || item["章节"] || 0) <= target);
        this.novelData.timeline_tracker = timelineTracker;

        const worldTracker = this.novelData.world_tracker || {};
        worldTracker.world_events = (worldTracker.world_events || []).filter((item) => Number(item.chapter || item["章节"] || 0) <= target);
        this.novelData.world_tracker = worldTracker;

        const genreTracker = this.novelData.genre_progress_tracker || {};
        genreTracker.progress_events = (genreTracker.progress_events || []).filter((item) => Number(item.chapter || item["章节"] || 0) <= target);
        ["pregnancy_progress", "rank_progress", "status_progress"].forEach((key) => {
            genreTracker[key] = Object.fromEntries(
                Object.entries(genreTracker[key] || {}).filter(([, item]) => Number(item?.chapter || item?.["章节"] || 0) <= target)
            );
        });
        this.novelData.genre_progress_tracker = genreTracker;

        ["chapter_analysis_reports", "chapter_qc_reports", "chapter_rhythms", "chapter_emotions"].forEach((key) => {
            this.novelData[key] = filterSnapshotObject(this.novelData[key] || {});
        });
    }

    rollbackStateSystemsToChapter(targetChapterNumber) {
        const target = Math.max(0, Number(targetChapterNumber || 0));
        this.trimStateSystemsAfterChapter(target);

        if (target <= 0) {
            const preservedManualState = this.deepClone(this.ensureWorldStateManager().manual_state || DEFAULT_NOVEL_DATA.world_state_manager.manual_state);
            this.novelData.outline.story_state = this.deepClone(DEFAULT_NOVEL_DATA.outline.story_state);
            this.novelData.story_state = this.deepClone(DEFAULT_NOVEL_DATA.story_state);
            this.novelData.dynamic_tracker = this.deepClone(DEFAULT_NOVEL_DATA.dynamic_tracker);
            this.novelData.timeline_tracker = this.deepClone(DEFAULT_NOVEL_DATA.timeline_tracker);
            this.novelData.chapter_snapshot = this.deepClone(DEFAULT_NOVEL_DATA.chapter_snapshot);
            this.novelData.foreshadow_tracker = this.deepClone(DEFAULT_NOVEL_DATA.foreshadow_tracker);
            this.novelData.foreshadow_manager = this.deepClone(DEFAULT_NOVEL_DATA.foreshadow_manager);
            this.novelData.secret_matrix = this.deepClone(DEFAULT_NOVEL_DATA.secret_matrix);
            this.novelData.character_checker = this.deepClone(DEFAULT_NOVEL_DATA.character_checker);
            this.novelData.character_appearance_tracker = this.deepClone(DEFAULT_NOVEL_DATA.character_appearance_tracker);
            this.novelData.personality_enforcer = this.deepClone(DEFAULT_NOVEL_DATA.personality_enforcer);
            this.novelData.dialogue_tracker = this.deepClone(DEFAULT_NOVEL_DATA.dialogue_tracker);
            this.novelData.name_locker = this.deepClone(DEFAULT_NOVEL_DATA.name_locker);
            this.novelData.world_tracker = this.deepClone(DEFAULT_NOVEL_DATA.world_tracker);
            this.novelData.world_state_manager = this.deepClone(DEFAULT_NOVEL_DATA.world_state_manager);
            this.novelData.extra_character_records = {};
            this.novelData.used_extras_characters = [];
            this.novelData.world_state_manager.manual_state = preservedManualState;
            this.novelData.genre_progress_tracker = this.deepClone(DEFAULT_NOVEL_DATA.genre_progress_tracker);
            this.novelData.used_temp_subplots = [];
            this.ensureWorldStateManager();
            this.syncWorldStateManager();
            return;
        }

        const snapshot = this.novelData.outline.state_snapshots?.[`chapter_${target}`];
        if (snapshot && snapshot.story_state) {
            this.novelData.outline.story_state = this.deepClone(snapshot.story_state);
            this.novelData.story_state = this.deepClone(snapshot.compatibility_story_state || this.novelData.story_state || {});
            this.novelData.dynamic_tracker = this.deepClone(snapshot.dynamic_tracker || this.novelData.dynamic_tracker || {});
            this.novelData.timeline_tracker = this.deepClone(snapshot.timeline_tracker || this.novelData.timeline_tracker || {});
            this.novelData.chapter_snapshot = this.deepClone(snapshot.chapter_snapshot || this.novelData.chapter_snapshot || {});
            this.novelData.foreshadow_tracker = this.deepClone(snapshot.foreshadow_tracker || this.novelData.foreshadow_tracker || {});
            this.novelData.foreshadow_manager = this.deepClone(snapshot.foreshadow_manager || this.novelData.foreshadow_manager || {});
            this.novelData.secret_matrix = this.deepClone(snapshot.secret_matrix || this.novelData.secret_matrix || {});
            this.novelData.character_checker = this.deepClone(snapshot.character_checker || this.novelData.character_checker || {});
            this.novelData.character_appearance_tracker = this.deepClone(snapshot.character_appearance_tracker || this.novelData.character_appearance_tracker || {});
            this.novelData.personality_enforcer = this.deepClone(snapshot.personality_enforcer || this.novelData.personality_enforcer || {});
            this.novelData.dialogue_tracker = this.deepClone(snapshot.dialogue_tracker || this.novelData.dialogue_tracker || {});
            this.novelData.world_tracker = this.deepClone(snapshot.world_tracker || this.novelData.world_tracker || {});
            this.novelData.world_state_manager = this.deepClone(snapshot.world_state_manager || this.novelData.world_state_manager || DEFAULT_NOVEL_DATA.world_state_manager);
            this.novelData.extra_character_records = this.deepClone(snapshot.extra_character_records || this.novelData.extra_character_records || {});
            this.novelData.used_extras_characters = this.deepClone(snapshot.used_extras_characters || this.novelData.used_extras_characters || []);
            this.novelData.genre_progress_tracker = this.deepClone(snapshot.genre_progress_tracker || this.novelData.genre_progress_tracker || {});
            this.novelData.name_locker = this.deepClone(snapshot.name_locker || this.novelData.name_locker || {});
            this.novelData.used_temp_subplots = this.deepClone(snapshot.used_temp_subplots || this.novelData.used_temp_subplots || []);
            this.rebuildUsedExtraCharacters(target);
            this.ensureWorldStateManager();
            this.syncWorldStateManager();
            return;
        }

        const chapterSnapshot = this.novelData.chapter_snapshot?.snapshots?.[`chapter_${target}`];
        if (chapterSnapshot) {
            const outlineState = this.novelData.outline.story_state || this.deepClone(DEFAULT_NOVEL_DATA.outline.story_state);
            outlineState.timeline = chapterSnapshot.timeline || chapterSnapshot["时间"] || outlineState.timeline || "";
            outlineState.current_location = chapterSnapshot.current_location || chapterSnapshot["位置"] || outlineState.current_location || "";
            outlineState.important_items = chapterSnapshot.important_items || outlineState.important_items || "";
            outlineState.pending_plots = chapterSnapshot.pending_plots || outlineState.pending_plots || "";
            this.novelData.outline.story_state = outlineState;
            this.novelData.story_state.current_location = outlineState.current_location || "";
            this.novelData.story_state.current_time = outlineState.timeline || "";
        }
        this.rebuildUsedExtraCharacters(target);
        this.ensureWorldStateManager();
        this.syncWorldStateManager();
    }

    recordTimelineUpdate(chapterNumber, stateData) {
        const tracker = this.novelData.timeline_tracker;
        tracker.current_time = stateData.timeline || tracker.current_time || "";
        tracker.timeline_events = Array.isArray(tracker.timeline_events) ? tracker.timeline_events : [];
        tracker.time_constraints = Array.isArray(tracker.time_constraints) ? tracker.time_constraints : [];
        if (stateData.key_event || stateData.timeline) {
            tracker.timeline_events.push({
                chapter: chapterNumber,
                章节: chapterNumber,
                time_point: stateData.timeline || "",
                时间点: stateData.timeline || "",
                event: stateData.key_event || stateData.pending_plots || "",
                事件: stateData.key_event || stateData.pending_plots || ""
            });
            tracker.timeline_events = tracker.timeline_events.slice(-50);
        }
        Utils.ensureArrayFromText(stateData.time_constraints).forEach((item) => {
            const text = typeof item === "object" && item
                ? `${item["设定"] || item.constraint_desc || ""}${item["持续"] || item.duration_desc ? `（持续：${item["持续"] || item.duration_desc}）` : ""}`.trim()
                : String(item || "").trim();
            if (!text) {
                return;
            }
            tracker.time_constraints.push({
                chapter: chapterNumber,
                constraint_desc: text,
                "设定": text
            });
        });
        tracker.time_constraints = tracker.time_constraints.slice(-60);
    }

    recordDynamicStateUpdate(stateData) {
        const tracker = this.novelData.dynamic_tracker;
        tracker.character_states = tracker.character_states || {};
        Object.entries(stateData.characters || {}).forEach(([name, state]) => {
            tracker.character_states[name] = {
                ...(tracker.character_states[name] || {}),
                ...state
            };
        });

        const importantItems = Utils.ensureArrayFromText(stateData.important_items);
        tracker.items = tracker.items || {};
        importantItems.forEach((itemText) => {
            const itemName = itemText.split(/[-：:]/)[0]?.trim();
            if (!itemName) {
                return;
            }
            tracker.items[itemName] = {
                ...(tracker.items[itemName] || {}),
                名称: itemName,
                当前状态: itemText
            };
        });
    }

    recordDynamicStateUpdateRich(chapterNumber, stateData) {
        const tracker = this.novelData.dynamic_tracker || (this.novelData.dynamic_tracker = {});
        tracker.items = tracker.items || {};
        tracker.appearances = tracker.appearances || {};
        tracker.character_states = tracker.character_states || {};

        Object.entries(stateData.characters || {}).forEach(([name, state]) => {
            const resolvedName = this.resolveKnownCharacterName(name);
            tracker.character_states[resolvedName] = {
                ...(tracker.character_states[resolvedName] || {}),
                ...state
            };

            this.extractStructuredPossessions(state?.possessions, resolvedName).forEach((item) => {
                this.upsertTrackedItem(chapterNumber, item.name, {
                    holder: item.holder || resolvedName,
                    status: item.status || "持有",
                    type: item.type || "物品",
                    description: item.description || item.raw || "",
                    source: item.source || "角色持有物",
                    temporary: item.temporary
                });
            });
        });

        this.extractStructuredItemUpdates(stateData).forEach((item) => {
            this.upsertTrackedItem(chapterNumber, item.name, item);
        });
    }

    getCharacterProfileForTracking(name) {
        const resolvedName = this.resolveKnownCharacterName(name);
        const index = this.findExistingCharacterIndexByAnyName(resolvedName);
        const character = index >= 0 ? this.novelData.outline.characters[index] : null;
        return {
            name: resolvedName,
            identity: String(character?.identity || character?.["身份"] || "").trim(),
            appearance: String(character?.appearance || character?.["外貌描述"] || character?.["外貌"] || "").trim(),
            aliases: character ? Array.from(this.getCharacterAliasSet(character)) : []
        };
    }

    getSelectedChapterVolumeNumber() {
        const selected = Number(this.elements.chapterEditorVolumeSelect?.value || this.elements.chapterVolumeSelect?.value || 0);
        return selected > 0 ? selected : 0;
    }

    ensureCharacterAppearanceEntry(name, chapterNumber = 0, identity = "", initialAppearance = "", volumeNumber = 0) {
        const resolvedName = this.resolveKnownCharacterName(name);
        if (!resolvedName) {
            return null;
        }

        const appearanceTracker = this.novelData.character_appearance_tracker || (this.novelData.character_appearance_tracker = {});
        appearanceTracker.appearances = appearanceTracker.appearances || {};
        const dynamicTracker = this.novelData.dynamic_tracker || (this.novelData.dynamic_tracker = {});
        dynamicTracker.appearances = dynamicTracker.appearances || {};
        const profile = this.getCharacterProfileForTracking(resolvedName);
        const baseIdentity = identity || profile.identity || "";
        const baseAppearance = initialAppearance || profile.appearance || "";
        const effectiveVolume = Number(volumeNumber || this.getSelectedChapterVolumeNumber() || 0);

        const appearanceEntry = appearanceTracker.appearances[resolvedName] || {
            首次出场: chapterNumber || 0,
            首次出场卷号: effectiveVolume || 0,
            出场章节: chapterNumber ? [chapterNumber] : [],
            出场卷号: effectiveVolume ? [effectiveVolume] : [],
            身份: baseIdentity,
            初始形象: baseAppearance,
            真实形象: baseAppearance,
            当前形象: baseAppearance,
            变化历史: []
        };
        appearanceEntry.出场章节 = Array.isArray(appearanceEntry.出场章节) ? appearanceEntry.出场章节 : [];
        if (chapterNumber && !appearanceEntry.出场章节.includes(chapterNumber)) {
            appearanceEntry.出场章节.push(chapterNumber);
        }
        if (!appearanceEntry.首次出场 && chapterNumber) {
            appearanceEntry.首次出场 = chapterNumber;
        }
        if (!appearanceEntry.首次出场卷号 && effectiveVolume) {
            appearanceEntry.首次出场卷号 = effectiveVolume;
        }
        appearanceEntry.出场卷号 = Array.isArray(appearanceEntry.出场卷号) ? appearanceEntry.出场卷号 : [];
        if (effectiveVolume && !appearanceEntry.出场卷号.includes(effectiveVolume)) {
            appearanceEntry.出场卷号.push(effectiveVolume);
        }
        if (baseIdentity && !appearanceEntry.身份) {
            appearanceEntry.身份 = baseIdentity;
        }
        if (baseAppearance && !appearanceEntry.初始形象) {
            appearanceEntry.初始形象 = baseAppearance;
        }
        if (baseAppearance && !appearanceEntry.真实形象) {
            appearanceEntry.真实形象 = baseAppearance;
        }
        if (baseAppearance && !appearanceEntry.当前形象) {
            appearanceEntry.当前形象 = baseAppearance;
        }
        appearanceTracker.appearances[resolvedName] = appearanceEntry;

        const dynamicEntry = dynamicTracker.appearances[resolvedName] || {
            初始形象: baseAppearance,
            真实形象: baseAppearance,
            当前形象: baseAppearance,
            变化历史: []
        };
        if (baseAppearance && !dynamicEntry.初始形象) {
            dynamicEntry.初始形象 = baseAppearance;
        }
        if (baseAppearance && !dynamicEntry.真实形象) {
            dynamicEntry.真实形象 = baseAppearance;
        }
        if (baseAppearance && !dynamicEntry.当前形象) {
            dynamicEntry.当前形象 = baseAppearance;
        }
        dynamicTracker.appearances[resolvedName] = dynamicEntry;

        return {
            name: resolvedName,
            appearanceEntry,
            dynamicEntry,
            profile
        };
    }

    coerceStateArray(value) {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value.filter(Boolean);
        }
        if (typeof value === "object") {
            return Object.values(value).filter(Boolean);
        }
        return Utils.ensureArrayFromText(value);
    }

    shouldSkipTrackedItem(itemName, itemType = "", description = "") {
        const name = String(itemName || "").trim();
        const type = String(itemType || "").trim();
        const text = `${name} ${type} ${description || ""}`;
        if (!name || name.length > 16) {
            return true;
        }
        const tempKeywords = ["发霉", "破旧", "烂", "脏", "旧", "临时", "普通", "一次性", "凡人", "借来"];
        const tempTypes = ["消耗品", "食物", "丹药", "普通物品", "日用品"];
        const genericNames = ["鲜血", "空气", "黑暗", "风声", "碎石", "长廊", "地面", "衣角", "衣摆", "石台"];
        if (genericNames.includes(name)) {
            return true;
        }
        if (tempTypes.includes(type) || tempKeywords.some((keyword) => text.includes(keyword))) {
            return true;
        }
        return !/^[\u4e00-\u9fa5A-Za-z0-9·]{2,16}$/.test(name);
    }

    parseItemTextEntry(rawItem, fallbackHolder = "") {
        const text = typeof rawItem === "string"
            ? rawItem.trim()
            : String(rawItem?.name || rawItem?.名称 || rawItem?.item || "").trim();
        if (!text) {
            return null;
        }

        let name = text.split(/[（(：:，,；;]/)[0]?.trim() || "";
        let holder = fallbackHolder;
        let status = "持有";
        let type = "";
        let description = text;
        let source = "";
        let temporary = false;

        if (typeof rawItem === "object" && rawItem) {
            name = String(rawItem.name || rawItem.名称 || rawItem.item || name).trim();
            holder = String(rawItem.holder || rawItem.持有者 || fallbackHolder || "").trim();
            status = String(rawItem.status || rawItem.当前状态 || status).trim();
            type = String(rawItem.type || rawItem.类型 || "").trim();
            description = String(rawItem.description || rawItem.描述 || text).trim();
            source = String(rawItem.source || rawItem.获得方式 || "").trim();
            temporary = Boolean(rawItem.temporary || rawItem.is_temp || rawItem.临时);
        } else {
            const holderMatch = text.match(/(?:持有者|持有|由|在)([^，,；;）)]+?)(?:持有|携带|保管|手里|手中|身上|腰间)?(?:[，,；;]|$)/);
            if (holderMatch?.[1]) {
                holder = holderMatch[1].trim();
            }
            const statusMatch = text.match(/(?:状态|现状)[：:]\s*([^，,；;）]+)/);
            if (statusMatch?.[1]) {
                status = statusMatch[1].trim();
            } else if (/丢失|遗失/.test(text)) {
                status = "丢失";
            } else if (/损坏|碎裂|破碎/.test(text)) {
                status = "损坏";
            } else if (/消耗|耗尽|用掉/.test(text)) {
                status = "消耗";
            } else if (/使用中|发动中/.test(text)) {
                status = "使用中";
            }
            const typeMatch = text.match(/(?:类型|类别)[：:]\s*([^，,；;）]+)/);
            if (typeMatch?.[1]) {
                type = typeMatch[1].trim();
            }
            temporary = /临时|一次性|普通物品|日用品|食物|丹药/.test(text);
        }

        if (this.shouldSkipTrackedItem(name, type, description)) {
            return null;
        }

        return {
            name,
            holder,
            status,
            type: type || "物品",
            description,
            source: source || "STATE_JSON",
            temporary
        };
    }

    extractStructuredPossessions(possessions, holder = "") {
        return this.coerceStateArray(possessions)
            .map((item) => this.parseItemTextEntry(item, holder))
            .filter(Boolean);
    }

    extractStructuredItemUpdates(stateData) {
        const entries = [];
        this.coerceStateArray(stateData.item_updates).forEach((item) => {
            const parsed = this.parseItemTextEntry(item, item?.holder || item?.持有者 || "");
            if (parsed) {
                entries.push(parsed);
            }
        });
        this.coerceStateArray(stateData.important_items).forEach((item) => {
            const parsed = this.parseItemTextEntry(item, "");
            if (parsed) {
                entries.push(parsed);
            }
        });
        return entries;
    }

    upsertTrackedItem(chapterNumber, itemName, options = {}) {
        const name = String(itemName || "").trim();
        if (!name || this.shouldSkipTrackedItem(name, options.type || "", options.description || "")) {
            return false;
        }

        const tracker = this.novelData.dynamic_tracker || (this.novelData.dynamic_tracker = {});
        tracker.items = tracker.items || {};
        const entry = tracker.items[name] || {
            名称: name,
            类型: options.type || "物品",
            描述: options.description || "",
            获得章节: chapterNumber || 0,
            获得方式: options.source || "记录",
            持有者: options.holder || "",
            当前状态: options.status || "持有",
            is_temp: Boolean(options.temporary),
            状态历史: []
        };

        const nextEntry = {
            ...entry,
            类型: options.type || entry.类型 || "物品",
            描述: options.description || entry.描述 || "",
            获得章节: entry.获得章节 || chapterNumber || 0,
            获得方式: options.source || entry.获得方式 || "记录",
            持有者: options.holder || entry.持有者 || "",
            当前状态: options.status || entry.当前状态 || "持有",
            最后更新章节: chapterNumber || entry.最后更新章节 || 0,
            is_temp: Boolean(options.temporary || entry.is_temp)
        };

        nextEntry.状态历史 = Array.isArray(entry.状态历史) ? entry.状态历史 : [];
        const lastHistory = nextEntry.状态历史[nextEntry.状态历史.length - 1];
        const historyRecord = {
            章节: chapterNumber || 0,
            动作: options.source || nextEntry.获得方式 || "记录",
            状态: nextEntry.当前状态,
            持有者: nextEntry.持有者
        };
        if (!lastHistory
            || Number(lastHistory.章节 || 0) !== Number(historyRecord.章节 || 0)
            || String(lastHistory.状态 || "") !== String(historyRecord.状态 || "")
            || String(lastHistory.持有者 || "") !== String(historyRecord.持有者 || "")) {
            nextEntry.状态历史.push(historyRecord);
        }

        tracker.items[name] = nextEntry;
        return true;
    }

    recordCharacterAppearanceState(chapterNumber, name, options = {}) {
        const appearanceText = String(options.currentAppearance || options.appearance || "").trim();
        const identity = String(options.identity || "").trim();
        const realAppearance = String(options.realAppearance || "").trim();
        const changeType = String(options.changeType || "").trim() || "正常";
        const reason = String(options.reason || "").trim();
        const duration = String(options.duration || "").trim();
        const seeded = this.ensureCharacterAppearanceEntry(
            name,
            chapterNumber,
            identity,
            realAppearance || appearanceText,
            options.volumeNumber || 0
        );
        if (!seeded) {
            return false;
        }

        const { appearanceEntry, dynamicEntry } = seeded;
        if (identity && !appearanceEntry.身份) {
            appearanceEntry.身份 = identity;
        }
        if (realAppearance && !appearanceEntry.真实形象) {
            appearanceEntry.真实形象 = realAppearance;
        }
        if (realAppearance && !dynamicEntry.真实形象) {
            dynamicEntry.真实形象 = realAppearance;
        }

        let nextAppearance = appearanceText || appearanceEntry.当前形象 || dynamicEntry.当前形象 || appearanceEntry.真实形象 || "";
        if (changeType === "恢复") {
            nextAppearance = appearanceEntry.真实形象 || appearanceEntry.初始形象 || nextAppearance;
        } else if (["受伤", "脏污", "疲惫"].includes(changeType) && appearanceText && appearanceEntry.当前形象 && !appearanceEntry.当前形象.includes(appearanceText)) {
            nextAppearance = `${appearanceEntry.当前形象}，${appearanceText}`;
        }

        if (!nextAppearance && !reason) {
            return false;
        }

        appearanceEntry.当前形象 = nextAppearance || appearanceEntry.当前形象 || "";
        dynamicEntry.当前形象 = appearanceEntry.当前形象;
        if (!appearanceEntry.初始形象 && (realAppearance || nextAppearance)) {
            appearanceEntry.初始形象 = realAppearance || nextAppearance;
        }
        if (!dynamicEntry.初始形象 && (realAppearance || nextAppearance)) {
            dynamicEntry.初始形象 = realAppearance || nextAppearance;
        }
        if (!appearanceEntry.真实形象 && (realAppearance || appearanceEntry.初始形象)) {
            appearanceEntry.真实形象 = realAppearance || appearanceEntry.初始形象;
        }
        if (!dynamicEntry.真实形象 && (realAppearance || dynamicEntry.初始形象)) {
            dynamicEntry.真实形象 = realAppearance || dynamicEntry.初始形象;
        }

        const historyRecord = {
            章节: chapterNumber || 0,
            卷号: Number(options.volumeNumber || this.getSelectedChapterVolumeNumber() || 0),
            形象: appearanceEntry.当前形象,
            类型: changeType,
            原因: reason,
            持续时间: duration || null
        };
        appearanceEntry.变化历史 = Array.isArray(appearanceEntry.变化历史) ? appearanceEntry.变化历史 : [];
        dynamicEntry.变化历史 = Array.isArray(dynamicEntry.变化历史) ? dynamicEntry.变化历史 : [];
        const lastAppearanceRecord = appearanceEntry.变化历史[appearanceEntry.变化历史.length - 1];
        if (!lastAppearanceRecord
            || Number(lastAppearanceRecord.章节 || 0) !== Number(historyRecord.章节 || 0)
            || String(lastAppearanceRecord.形象 || "") !== String(historyRecord.形象 || "")
            || String(lastAppearanceRecord.类型 || "") !== String(historyRecord.类型 || "")) {
            appearanceEntry.变化历史.push(historyRecord);
            dynamicEntry.变化历史.push(historyRecord);
        }

        return true;
    }

    recordAppearanceStateUpdate(chapterNumber, stateData) {
        Object.entries(stateData.characters || {}).forEach(([name, state]) => {
            this.recordCharacterAppearanceState(chapterNumber, name, {
                identity: state?.identity || "",
                appearance: state?.appearance || state?.current_appearance || "",
                realAppearance: state?.real_appearance || "",
                changeType: state?.appearance_change ? "正常" : "",
                reason: state?.appearance_change || ""
            });
        });

        this.coerceStateArray(stateData.appearance_changes).forEach((item) => {
            if (!item) {
                return;
            }
            if (typeof item === "string") {
                const text = item.trim();
                const name = text.split(/[（(：:]/)[0]?.trim();
                if (!name) {
                    return;
                }
                this.recordCharacterAppearanceState(chapterNumber, name, {
                    appearance: text,
                    changeType: /伪装|变身|恢复|受伤|脏污|疲惫/.exec(text)?.[0] || "正常",
                    reason: text
                });
                return;
            }
            this.recordCharacterAppearanceState(chapterNumber, item.name || item.角色名, {
                identity: item.identity || item.身份 || "",
                currentAppearance: item.current_appearance || item.currentAppearance || item.appearance || item.当前形象 || "",
                realAppearance: item.real_appearance || item.realAppearance || item.真实形象 || "",
                changeType: item.change_type || item.changeType || item.变化类型 || "正常",
                reason: item.reason || item.原因 || "",
                duration: item.duration || item.持续时间 || ""
            });
        });
    }

    scanChapterStateSignals(chapterNumber, chapter, cleanedContent, stateData = {}) {
        const stats = { appearances: 0, items: 0 };
        const content = String(cleanedContent || "");
        if (!content) {
            return stats;
        }

        const relevantNames = new Set([
            ...Object.keys(stateData.characters || {}).map((name) => this.resolveKnownCharacterName(name)),
            ...this.extractCharacterSeedsFromSummary(chapter?.summary || "", chapterNumber).map((item) => item.name),
            ...Utils.ensureArrayFromText(chapter?.characters || "").map((name) => this.resolveKnownCharacterName(name))
        ].filter(Boolean));

        relevantNames.forEach((name) => {
            if (!content.includes(name)) {
                return;
            }
            const seeded = this.ensureCharacterAppearanceEntry(
                name,
                chapterNumber,
                "",
                "",
                this.getSelectedChapterVolumeNumber()
            );
            if (seeded) {
                stats.appearances += 1;
            }
        });

        const trackedItems = Object.keys(this.novelData.dynamic_tracker?.items || {});
        trackedItems.forEach((itemName) => {
            if (!content.includes(itemName)) {
                return;
            }
            const updated = this.upsertTrackedItem(chapterNumber, itemName, {
                source: "正文扫描",
                description: this.novelData.dynamic_tracker.items[itemName]?.描述 || "",
                status: this.novelData.dynamic_tracker.items[itemName]?.当前状态 || "持有",
                holder: this.novelData.dynamic_tracker.items[itemName]?.持有者 || "",
                type: this.novelData.dynamic_tracker.items[itemName]?.类型 || "物品"
            });
            if (updated) {
                stats.items += 1;
            }
        });

        return stats;
    }

    normalizeWorldTrackerTextEntry(entry, keyCandidates = []) {
        if (typeof entry === "string") {
            return entry.trim();
        }
        if (!entry || typeof entry !== "object") {
            return String(entry || "").trim();
        }

        for (const key of keyCandidates) {
            const value = entry[key];
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }

        return JSON.stringify(entry);
    }

    parseWorldTrackerMovementEntry(entry) {
        if (typeof entry === "string") {
            const [name, position] = String(entry)
                .split(/->|→|：|:/)
                .map((part) => part.trim());
            return { name: name || "", position: position || "" };
        }
        if (!entry || typeof entry !== "object") {
            return { name: "", position: "" };
        }

        const name = [
            entry.name,
            entry.character,
            entry.role,
            entry.person,
            entry.actor,
            entry["角色"],
            entry["人物"],
            entry["姓名"],
            entry["名字"]
        ].find((value) => typeof value === "string" && value.trim());
        const position = [
            entry.position,
            entry.location,
            entry.to,
            entry.destination,
            entry.target_location,
            entry.current_location,
            entry["位置"],
            entry["地点"],
            entry["去向"],
            entry["目标地点"],
            entry["当前位置"]
        ].find((value) => typeof value === "string" && value.trim());

        return {
            name: String(name || "").trim(),
            position: String(position || "").trim()
        };
    }

    recordWorldTrackerUpdate(chapterNumber, stateData) {
        const tracker = this.novelData.world_tracker || {
            locations: {},
            organizations: {},
            character_positions: {},
            offscreen_status: {},
            world_events: []
        };
        const worldChanges = stateData.world_changes || {};

        Utils.ensureArrayFromText(worldChanges.new_locations).forEach((location) => {
            const locationName = this.normalizeWorldTrackerTextEntry(location, [
                "name", "location", "title", "label", "地点", "位置", "名称"
            ]);
            if (!locationName) {
                return;
            }
            tracker.locations[locationName] = {
                ...(tracker.locations[locationName] || {}),
                last_chapter: chapterNumber
            };
        });

        Utils.ensureArrayFromText(worldChanges.character_movements).forEach((movement) => {
            if (movement && typeof movement === "object") {
                const parsedMovement = this.parseWorldTrackerMovementEntry(movement);
                if (parsedMovement.name && parsedMovement.position) {
                    tracker.character_positions[parsedMovement.name] = parsedMovement.position;
                }
                return;
            }
            const [name, position] = movement.split(/->|→|：|:/).map((part) => part.trim());
            if (name && position) {
                tracker.character_positions[name] = position;
            }
        });

        Utils.ensureArrayFromText(worldChanges.offscreen_status).forEach((status) => {
            if (status && typeof status === "object") {
                const statusText = this.normalizeWorldTrackerTextEntry(status, [
                    "text", "summary", "detail", "status", "内容", "描述", "状态"
                ]);
                const [name, detail] = statusText.split(/：|:/).map((part) => part.trim());
                if (name) {
                    tracker.offscreen_status[name] = detail || statusText;
                }
                return;
            }
            const [name, detail] = status.split(/：|:/).map((part) => part.trim());
            if (name) {
                tracker.offscreen_status[name] = detail || status;
            }
        });

        Utils.ensureArrayFromText(worldChanges.org_changes).forEach((change) => {
            if (change && typeof change === "object") {
                const changeText = this.normalizeWorldTrackerTextEntry(change, [
                    "text", "summary", "detail", "name", "organization", "org", "内容", "描述", "势力", "组织", "名称"
                ]);
                const orgName = changeText.split(/：|:/)[0]?.trim();
                if (orgName) {
                    tracker.organizations[orgName] = {
                        ...(tracker.organizations[orgName] || {}),
                        latest_change: changeText,
                        last_chapter: chapterNumber
                    };
                }
                return;
            }
            const orgName = change.split(/：|:/)[0]?.trim();
            if (orgName) {
                tracker.organizations[orgName] = {
                    ...(tracker.organizations[orgName] || {}),
                    latest_change: change,
                    last_chapter: chapterNumber
                };
            }
        });

        if (stateData.key_event) {
            tracker.world_events = Array.isArray(tracker.world_events) ? tracker.world_events : [];
            tracker.world_events.push({
                chapter: chapterNumber,
                event: stateData.key_event
            });
            tracker.world_events = tracker.world_events.slice(-50);
        }

        this.novelData.world_tracker = tracker;
    }

    recordCharacterCheckerState(chapterNumber, stateData) {
        const checker = this.novelData.character_checker;
        checker.character_states = checker.character_states || {};
        Object.entries(stateData.characters || {}).forEach(([name, state]) => {
            checker.character_states[name] = {
                ...(checker.character_states[name] || {}),
                last_chapter: chapterNumber,
                ...state
            };
        });
    }

    recordGenreProgressUpdate(chapterNumber, stateData) {
        const evidence = this.buildWorldStateCharacterEvidence(chapterNumber);
        const tracker = this.novelData.genre_progress_tracker || (this.novelData.genre_progress_tracker = {
            current_genre: "",
            current_subgenre: "",
            pregnancy_progress: {},
            rank_progress: {},
            status_progress: {},
            progress_events: []
        });
        tracker.current_genre = this.novelData.genre || this.novelData.outline?.genre || tracker.current_genre || "";
        tracker.current_subgenre = this.novelData.subgenre || this.novelData.outline?.subgenre || tracker.current_subgenre || "";
        tracker.pregnancy_progress = tracker.pregnancy_progress || {};
        tracker.rank_progress = tracker.rank_progress || {};
        tracker.status_progress = tracker.status_progress || {};
        tracker.progress_events = Array.isArray(tracker.progress_events) ? tracker.progress_events : [];

        Utils.ensureArrayFromText(stateData.genre_progress).forEach((progress) => {
            const text = String(progress || "").trim();
            if (!text) {
                return;
            }

            let roleName = "未指明角色";
            let detail = text;
            if (text.includes("：")) {
                [roleName, detail] = text.split("：", 2).map((item) => item.trim());
            } else if (text.includes(":")) {
                [roleName, detail] = text.split(":", 2).map((item) => item.trim());
            }
            roleName = this.resolveWorldStateCharacterByEvidence(roleName, evidence, "roster");
            if (!roleName) {
                return;
            }

            if (/怀孕|孕|胎/.test(detail)) {
                const monthsMatch = detail.match(/(\d+)\s*个?月/);
                tracker.pregnancy_progress[roleName] = {
                    chapter: chapterNumber,
                    months: monthsMatch ? Number(monthsMatch[1]) : "",
                    status: /待产|临盆/.test(detail) ? "待产" : "进行中",
                    detail
                };
            } else if (/→|突破|晋升|境|阶|品/.test(detail)) {
                const rank = detail.includes("→")
                    ? detail.split("→").pop().trim()
                    : detail.replace(/突破|晋升/g, "").trim();
                tracker.rank_progress[roleName] = {
                    chapter: chapterNumber,
                    rank,
                    detail
                };
            } else {
                tracker.status_progress[roleName] = {
                    chapter: chapterNumber,
                    detail
                };
            }

            tracker.progress_events.push({
                chapter: chapterNumber,
                role: roleName,
                detail
            });
        });

        tracker.progress_events = tracker.progress_events.slice(-80);
    }

    recordPendingSubplots(chapterNumber, stateData) {
        const pendingList = Utils.ensureArrayFromText(stateData.pending_plots)
            .map((item) => String(item || "").trim())
            .filter(Boolean);
        if (!pendingList.length) {
            return;
        }

        const target = Array.isArray(this.novelData.used_temp_subplots) ? this.novelData.used_temp_subplots : [];
        pendingList.forEach((item) => {
            const normalized = `${item}`;
            if (!target.includes(normalized)) {
                target.push(normalized);
            }
        });
        this.novelData.used_temp_subplots = target.slice(-40);
    }

    recordChapterAnalysisTags(chapterNumber, chapter, content, stateData = {}) {
        if (!chapterNumber) {
            return;
        }

        const chapterKey = `第${chapterNumber}章`;
        const rhythm = this.detectChapterRhythm(chapter, content);
        const emotion = this.detectChapterEmotion(chapter, content, stateData);

        if (rhythm) {
            this.novelData.chapter_rhythms[chapterKey] = rhythm;
        }
        if (emotion) {
            this.novelData.chapter_emotions[chapterKey] = emotion;
        }
    }

    detectChapterRhythm(chapter, content) {
        const phase = String(chapter?.plot_unit?.unit_phase || "").trim();
        if (phase.includes("高潮")) {
            return "大高潮";
        }
        if (phase.includes("结尾")) {
            return "转折";
        }
        if (phase.includes("发展")) {
            return "推进";
        }
        if (phase.includes("开端")) {
            return "铺垫";
        }

        const text = `${chapter?.summary || ""}\n${content || ""}`;
        if (/大战|决战|爆发|生死|崩溃/.test(text)) {
            return "大高潮";
        }
        if (/反转|真相|揭开|暴露|转机/.test(text)) {
            return "转折";
        }
        if (/布局|调查|试探|潜伏|铺垫/.test(text)) {
            return "铺垫";
        }
        return "推进";
    }

    detectChapterEmotion(chapter, content, stateData = {}) {
        const curve = String(chapter?.emotionCurve || chapter?.emotion_curve || "").trim();
        if (curve) {
            return curve.split(/[、,，/]/)[0].trim();
        }

        const text = `${chapter?.summary || ""}\n${content || ""}\n${stateData?.key_event || ""}`;
        const emotionRules = [
            ["紧张", /危机|追杀|倒计时|失控|惊险|险些/],
            ["热血", /出手|反击|爆发|决战|拼命|迎战/],
            ["悲伤", /离开|死亡|失去|崩溃|诀别|痛哭/],
            ["温馨", /陪伴|拥抱|照顾|安稳|温暖|轻松/],
            ["浪漫", /心动|亲吻|暧昧|告白|脸红|牵手/],
            ["搞笑", /尴尬|失误|胡闹|吐槽|好笑|乌龙/]
        ];

        const matched = emotionRules.find(([, pattern]) => pattern.test(text));
        return matched ? matched[0] : "紧张";
    }

    buildChapterAnalysisReport(chapter) {
        const chapterNumber = Number(chapter.number || 0);
        const content = String(chapter.content || "").trim();
        const summary = String(chapter.summary || "").trim();
        const volumeNumber = this.getVolumeNumberForChapter(chapter);
        const outlineReference = this.buildChapterAnalysisReference(chapter);
        const outlineCoverage = this.estimateOutlineCoverage(outlineReference, content);
        const keywordSummary = this.extractNarrativeFocusKeywords(outlineReference, content, chapterNumber, 6);
        const characters = this.collectChapterCharacters(chapterNumber, content);
        const sceneCount = Math.max(1, content.split(/\n{2,}/).filter((block) => block.trim()).length);
        const rhythm = this.novelData.chapter_rhythms?.[`第${chapterNumber}章`] || this.novelData.chapter_rhythms?.[`chapter_${chapterNumber}`] || "待判断";
        const emotion = this.novelData.chapter_emotions?.[`第${chapterNumber}章`] || this.novelData.chapter_emotions?.[`chapter_${chapterNumber}`] || "待判断";
        const snapshot = this.getChapterSnapshotRecord(chapterNumber);
        const nextSetup = chapter.next_chapter_setup || {};
        const endingHook = nextSetup.suspense_hook || snapshot["下一章预期"] || "本章还没有明确钩子。";
        const plotExecution = outlineCoverage >= 0.68 ? "高" : outlineCoverage >= 0.38 ? "中" : "偏弱";

        const lines = [
            `【第${chapterNumber}章分析报告】`,
            "",
            `卷号：第${volumeNumber}卷`,
            `标题：${chapter.title || `第${chapterNumber}章`}`,
            `字数：${content.length}字`,
            `场景数：约 ${sceneCount} 段`,
            `出场人物：${characters.length ? characters.join("、") : "暂未识别"}`,
            "",
            "一、情节核对",
            `大纲执行度：${plotExecution}（覆盖率 ${(outlineCoverage * 100).toFixed(0)}%）`,
            `关键内容：${keywordSummary || "暂未提取到明显关键词"}`,
            `章末钩子：${endingHook}`,
            "",
            "二、节奏与情绪",
            `节奏判断：${rhythm}`,
            `主情绪：${emotion}`,
            `剧情单元：${chapter.plot_unit?.unit_phase || chapter.plot_unit?.plot_goal || "未标注"}`,
            "",
            "三、连续性观察",
            `当前位置：${snapshot["位置"] || snapshot.current_location || "未记录"}`,
            `当前时间：${snapshot["时间"] || snapshot.timeline || "未记录"}`,
            `待推进事项：${snapshot.pending_plots || "未记录"}`,
            "",
            "四、建议",
            this.buildChapterAdviceLine(chapter, content, outlineCoverage, characters)
        ];

        return lines.join("\n");
    }

    buildChapterQcReport(chapter) {
        const chapterNumber = Number(chapter.number || 0);
        const content = String(chapter.content || "").trim();
        const summary = String(chapter.summary || "").trim();
        const issues = [];
        const outlineReference = this.buildChapterAnalysisReference(chapter);
        const outlineCoverage = this.estimateOutlineCoverage(outlineReference, content);
        const duplicateLines = this.detectRepeatedLines(content);
        const previousChapter = this.getAdjacentChapter(chapter.number, -1, this.getVolumeNumberForChapter(chapter));
        const nextChapter = this.getAdjacentChapter(chapter.number, 1, this.getVolumeNumberForChapter(chapter));

        if (content.length < 2000) {
            issues.push("字数偏少：当前正文低于 2000 字，容易显得情节过薄。");
        }
        if (outlineCoverage < 0.3 && outlineReference) {
            issues.push("大纲执行偏弱：正文与章纲的重合度较低，建议检查是否跑偏。");
        }
        if (duplicateLines.length) {
            issues.push(`疑似重复表达：${duplicateLines.slice(0, 3).join("；")}`);
        }
        if (/(总之|综上|归根结底|这一切才刚刚开始|新的篇章即将展开)/.test(content)) {
            issues.push("结尾有总结腔：更像旁白总结，不像网文章节卡点。");
        }
        if (this.detectNextChapterLeakage(content, nextChapter)) {
            issues.push("疑似提前写到下一章内容：请检查结尾是否越过下章边界。");
        }
        if (previousChapter && previousChapter.next_chapter_setup?.suspense_hook) {
            const hookKeywords = this.extractContentKeywords(previousChapter.next_chapter_setup.suspense_hook, 3);
            if (hookKeywords && !hookKeywords.split("、").some((item) => content.includes(item))) {
                issues.push("承接感偏弱：上章留下的悬念在本章正文里体现得不明显。");
            }
        }
        const aiClicheHits = this.detectAiCliche(content);
        if (aiClicheHits.length >= 3) {
            issues.push(`AI味偏重：高频套话较多（${aiClicheHits.slice(0, 4).join("、")}）。`);
        }

        const lines = [
            `【第${chapterNumber}章质检结果】`,
            ""
        ];

        if (!issues.length) {
            lines.push("当前章节通过基础质检。");
            lines.push("未发现明显的字数、重复、越界或总结腔问题。");
        } else {
            lines.push(`共发现 ${issues.length} 项需要注意的问题：`);
            issues.forEach((issue, index) => {
                lines.push(`${index + 1}. ${issue}`);
            });
        }

        lines.push("");
        lines.push(`参考章纲：${summary ? Utils.summarizeText(summary, 90) : outlineReference ? Utils.summarizeText(outlineReference, 90) : "暂无章纲"}`);
        lines.push(`上一章：${previousChapter ? `${previousChapter.number} · ${previousChapter.title || `第${previousChapter.number}章`}` : "无"}`);
        lines.push(`下一章：${nextChapter ? `${nextChapter.number} · ${nextChapter.title || `第${nextChapter.number}章`}` : "无"}`);
        return lines.join("\n");
    }

    buildChapterAdviceLine(chapter, content, outlineCoverage, characters) {
        if (outlineCoverage < 0.3) {
            return "建议回看章纲，把本章必须发生的核心事件再补齐，避免正文自己跑到支线上。";
        }
        if (content.length < 2000) {
            return "建议补强场景细节、人物动作和情绪递进，让这一章更有血肉。";
        }
        if (characters.length <= 1) {
            return "建议补一点人物互动或外部阻力，让剧情推进不只是主角独白。";
        }
        return "本章结构已经基本完整，下一步可以重点优化结尾卡点和下章衔接。";
    }

    collectChapterCharacters(chapterNumber, content) {
        const appearanceEntries = Object.entries(this.novelData.character_appearance_tracker?.appearances || {});
        const fromTracker = appearanceEntries
            .filter(([, value]) => Number(value?.last_chapter || value?.chapter || 0) === Number(chapterNumber))
            .map(([name]) => name);
        const fromOutline = (this.novelData.outline.characters || [])
            .map((item) => item.name)
            .filter((name) => name && content.includes(name));
        return [...new Set([...fromTracker, ...fromOutline])].slice(0, 8);
    }

    buildChapterAnalysisReference(chapter) {
        const plotUnit = chapter?.plot_unit && typeof chapter.plot_unit === "object" ? chapter.plot_unit : {};
        const candidates = [
            chapter?.summary,
            chapter?.key_event,
            chapter?.keyEvent,
            plotUnit.plot_goal,
            plotUnit.core_conflict
        ];
        const lines = [];
        candidates.forEach((item) => {
            const text = String(item || "").trim();
            if (!text || lines.includes(text)) {
                return;
            }
            lines.push(text);
        });
        return lines.join("\n");
    }

    estimateOutlineCoverage(summary, content) {
        if (!summary || !content) {
            return 0;
        }
        const signals = this.extractOutlineExecutionSignals(summary);
        if (!signals.length) {
            return 0;
        }

        const totalWeight = signals.reduce((sum, item) => sum + item.weight, 0) || 1;
        const matchedWeight = signals.reduce((sum, item) => {
            const keywordHits = item.keywords.filter((keyword) => content.includes(keyword)).length;
            const phraseMatched = item.phrase && item.phrase.length >= 6 && content.includes(item.phrase);
            const matched = phraseMatched || keywordHits >= Math.min(2, item.keywords.length) || (item.keywords.length <= 2 && keywordHits >= 1);
            return sum + (matched ? item.weight : 0);
        }, 0);

        return Math.max(0, Math.min(1, matchedWeight / totalWeight));
    }

    extractContentKeywords(text, limit = 5) {
        const source = String(text || "").replace(/\r\n?/g, "\n");
        if (!source.trim()) {
            return "";
        }

        const stopwords = new Set([
            "当前", "这一章", "本章", "主角", "然后", "因为", "所以", "他们", "自己", "没有", "一个", "出来", "开始", "继续",
            "空气", "荒野", "风声", "狂风", "黑暗", "光线", "地面", "碎石", "声音", "气味", "场景", "氛围", "周围", "前方", "后方",
            "上一秒", "下一秒", "这一秒", "这一刻", "此时", "这时", "当下", "随后", "而后", "很快", "立刻", "马上", "刚刚"
        ]);

        const unique = [];
        const push = (rawValue) => {
            let value = String(rawValue || "")
                .trim()
                .replace(/^[“"'《【\[]+/u, "")
                .replace(/[”"'》】\]]+$/u, "")
                .replace(/^[•\-]\s*/u, "")
                .replace(/^(?:上一秒|下一秒|这一秒|这一刻|此时|这时|当下|随后|然后|而后|很快|立刻|马上|已经|正在|仍在|刚刚|忽然|她还在|他还在|她还|他还|她正|他正|她便|他便|她又|他又|她先|他先)/u, "")
                .replace(/^(?:她|他|它|他们|她们|众人|所有人|自己)/u, "")
                .replace(/(?:里面|之中|那里|这里|身上|手中|眼前|耳边|脚下|周围|出去|进来|过去|回来|一下|一声|一眼|而已|起来|下去)$/u, "")
                .trim();

            if (!value) {
                return;
            }

            if (value.length > 18) {
                const parts = value
                    .split(/(?:在|把|被|将|向|对|给|从|和|与|跟|并且|而且|于是)/u)
                    .map((item) => item.trim())
                    .filter((item) => item && item !== value);
                if (parts.length) {
                    parts.forEach(push);
                    return;
                }
            }

            if (
                value.length < 2
                || value.length > 18
                || stopwords.has(value)
                || unique.includes(value)
                || !/^[\u4e00-\u9fa5A-Za-z0-9]{2,18}$/u.test(value)
            ) {
                return;
            }

            unique.push(value);
        };

        (this.novelData.outline?.characters || [])
            .map((item) => item?.name)
            .filter((name) => name && source.includes(name))
            .forEach(push);

        source
            .split(/[\n\r\t，。！？；：、,.!?（）()【】《》“”"'‘’\[\]<>]+/u)
            .forEach(push);

        if (!unique.length) {
            (source.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,18}/gu) || []).forEach(push);
        }

        return unique.slice(0, limit).join("、");
    }

    extractNarrativeFocusKeywords(summary, content, chapterNumber, limit = 6) {
        const focus = [];
        const seen = new Set();
        const push = (value) => {
            const clean = String(value || "").trim();
            if (!clean || seen.has(clean)) {
                return;
            }
            seen.add(clean);
            focus.push(clean);
        };

        const outlineSignals = this.extractOutlineExecutionSignals(summary);
        outlineSignals.forEach((signal) => {
            signal.keywords.forEach((keyword) => {
                if (content.includes(keyword)) {
                    push(keyword);
                }
            });
        });

        this.collectChapterCharacters(chapterNumber, content).forEach(push);

        if (focus.length < limit) {
            const eventKeywords = this.extractEventKeywordsFromContent(content);
            eventKeywords.forEach(push);
        }

        return focus.slice(0, limit).join("、");
    }

    extractEventKeywordsFromContent(content) {
        const text = String(content || "");
        if (!text) {
            return [];
        }

        const sentences = text
            .split(/[。！？；\n]/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 6);

        const eventHints = [
            "推", "坠", "跌", "抓", "绑", "拖", "刺", "杀", "救", "逃", "追", "审", "判", "祭", "揭", "问", "答",
            "命令", "宣读", "祭品", "深渊", "悬崖", "血脉", "秘密", "身份", "罗盘", "圣殿", "裁判所", "骑士", "审判官"
        ];
        const environmentNoise = new Set([
            "空气", "荒野", "风声", "狂风", "黑暗", "光线", "地面", "碎石", "声音", "气味", "场景", "氛围",
            "周围", "前方", "后方", "衣领", "裙摆", "石头", "砂砾", "尘土", "呼啸", "寂静", "呼吸"
        ]);

        const hits = [];
        sentences.forEach((sentence) => {
            const matchedHints = eventHints.filter((hint) => sentence.includes(hint));
            if (!matchedHints.length) {
                return;
            }

            const keywords = this.extractContentKeywords(sentence, 4)
                .split("、")
                .filter(Boolean)
                .filter((item) => !environmentNoise.has(item));
            keywords.forEach((keyword) => {
                if (matchedHints.some((hint) => keyword.includes(hint) || sentence.includes(keyword))) {
                    hits.push(keyword);
                }
            });
        });

        return Array.from(new Set(hits));
    }

    extractOutlineExecutionSignals(summary) {
        const text = String(summary || "").trim();
        if (!text) {
            return [];
        }

        const sectionConfigs = [
            { label: "章节目标", weight: 3 },
            { label: "核心事件", weight: 3 },
            { label: "情节推进", weight: 2 },
            { label: "伏笔处理", weight: 1 }
        ];

        const signals = [];
        sectionConfigs.forEach(({ label, weight }) => {
            const match = text.match(new RegExp(`【${label}】\\s*([\\s\\S]*?)(?=\\n【|$)`));
            const body = String(match?.[1] || "").trim();
            if (!body) {
                return;
            }

            body.split(/\r?\n/).forEach((line) => {
                const cleaned = line.replace(/^[\d一二三四五六七八九十\-.、\s]+/, "").trim();
                if (cleaned.length < 4) {
                    return;
                }
                const keywords = this.extractContentKeywords(cleaned, label === "情节推进" ? 4 : 3)
                    .split("、")
                    .filter(Boolean);
                if (!keywords.length) {
                    return;
                }
                signals.push({
                    label,
                    phrase: cleaned.slice(0, 24),
                    keywords,
                    weight
                });
            });
        });

        if (signals.length) {
            return signals.slice(0, 10);
        }

        return this.extractLooseOutlineClauses(text)
            .slice(0, 10)
            .map((item) => ({
                label: "概括句",
                phrase: item.slice(0, 24),
                keywords: this.extractContentKeywords(item, item.length >= 18 ? 4 : 3).split("、").filter(Boolean),
                weight: item.length >= 18 ? 2 : 1
            }))
            .filter((item) => item.keywords.length);
    }

    extractLooseOutlineClauses(text) {
        const source = String(text || "").replace(/\r\n?/g, "\n").trim();
        if (!source) {
            return [];
        }

        const clauses = [];
        const seen = new Set();
        const push = (rawValue) => {
            const value = String(rawValue || "")
                .replace(/^第\s*[0-9一二三四五六七八九十百零]+\s*章\s*[：:]\s*/u, "")
                .replace(/^[•\-]\s*/u, "")
                .replace(/^[\d一二三四五六七八九十]+[.、)\s]+/u, "")
                .trim();
            if (!value || value.length < 4 || seen.has(value)) {
                return;
            }
            seen.add(value);
            clauses.push(value);
        };

        source.split(/\n+/).forEach((line) => {
            const cleanedLine = line.trim();
            if (!cleanedLine) {
                return;
            }

            push(cleanedLine);
            cleanedLine.split(/\s*[-—]+\s*/u).forEach(push);
            cleanedLine.split(/[。！？；]/u).forEach(push);
            if (cleanedLine.length > 24) {
                cleanedLine.split(/[，,、]/u).forEach(push);
            }
        });

        return clauses;
    }

    detectRepeatedLines(content) {
        const seen = new Map();
        const duplicates = [];
        String(content || "").split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.length < 12) {
                return;
            }
            const count = (seen.get(trimmed) || 0) + 1;
            seen.set(trimmed, count);
            if (count === 2) {
                duplicates.push(Utils.summarizeText(trimmed, 26));
            }
        });
        return duplicates;
    }

    detectAiCliche(content) {
        const text = String(content || "");
        const phrases = [
            "\u6469\u6332", "\u6b7b\u6b7b", "\u5f02\u53d8\u9641\u751f", "\u6cb9\u7136\u800c\u751f", "\u5982\u68a6\u521d\u9192", "\u76ee\u5149\u5982\u70ac", "\u5c45\u9ad8\u4e34\u4e0b",
            "\u5982\u9b3c\u9b45\u822c", "\u5982\u72fc\u4f3c\u864e", "\u6240\u6709\u4eba\u90fd\u77e5\u9053", "\u6ca1\u6709\u4efb\u4f55\u4eba\u6562", "\u8fd9\u54ea\u91cc\u662f\u4ec0\u4e48",
            "\u8fd9\u5206\u660e\u662f", "\u5929\uff0c\u53d8\u4e86", "\u638c\u63a7\u751f\u6740\u5927\u6743", "\u96f7\u9706\u624b\u6bb5", "\u5168\u573a\u5bc2\u9759", "\u4f17\u4eba\u9ed8\u4e0d\u4f5c\u58f0",
            "\u5c48\u8fb1\u611f\u5728\u80f8\u8154\u91cc", "\u5c48\u8fb1\u611f\u5543\u566c\u7740", "\u5c48\u8fb1\uff0c\u6124\u6012\uff0c\u6740\u610f", "\u8fd9\u4e9b\u60c5\u7eea\u5728\u4ed6\u5fc3\u5e95\u751f\u6839\u53d1\u82bd",
            "\u6ca1\u4eba\u6562\u51fa\u58f0", "\u6ca1\u4eba\u6562\u559d\u9a82", "\u6ca1\u4eba\u6562\u63a5\u8bdd", "\u6ca1\u6709\u4e00\u4e2a\u4eba\u6562\u4e0a\u524d",
            "\u6b7b\u4e00\u822c\u7684\u5bc2\u9759", "\u6b7b\u4e00\u822c\u7684\u6c89\u5bc2", "\u75af\u72c2\u7684\u3001\u75c5\u6001\u7684\u5ac9\u5992", "\u75c5\u6001\u7684\u5ac9\u5992",
            "\u75c5\u6001\u7684\u5360\u6709\u6b32", "\u6781\u5177\u538b\u8feb\u611f", "\u53cc\u76ee\u7309\u7ea2", "\u5e03\u6ee1\u8840\u4e1d", "\u6c14\u6c1b\u964d\u81f3\u51b0\u70b9",
            "\u5728\u6c89\u9ed8\u4e2d\u62c9\u5f00\u5e8f\u5e55", "\u6765\u8005\u4e0d\u5584", "\u95fb\u7740\u8840\u8165\u5473\u8d76\u56de\u6765\u7684\u6076\u72fc",
            "\u72c2\u98ce\u9aa4\u96e8\u822c", "\u552f\u552f\u8bfa\u8bfa", "\u9ed1\u8272\u95ea\u7535\u822c", "\u53cd\u53cd\u590d\u590d\u56de\u8361",
            "\u5b57\u5b57\u53e5\u53e5\u90fd\u5728\u5f80", "\u80ba\u7ba1\u5b50\u4e0a\u6233",
            "\u77b3\u5b54\u5fae\u7f29", "\u77b3\u5b54\u9aa4\u7f29", "\u77b3\u5b54\u5fae\u5fae\u4e00\u7f29",
            "\u58f0\u97f3\u6c99\u54d1", "\u55d3\u97f3\u6c99\u54d1", "\u58f0\u97f3\u5606\u54d1", "\u55d3\u97f3\u5606\u54d1", "\u58f0\u7ebf\u4f4e\u54d1",
            "\u80f8\u819b\u5267\u70c8\u8d77\u4f0f", "\u80f8\u53e3\u5267\u70c8\u8d77\u4f0f", "\u547c\u5438\u4e00\u6ede",
            "\u6307\u7532\u6df1\u9677\u8089\u91cc", "\u6307\u7532\u6380\u8fdb\u638c\u5fc3", "\u6307\u7532\u51e0\u4e4e\u6380\u8fdb\u8089\u91cc"
        ];
        const regexRules = [
            { label: "\u7a7a\u6cdb\u6c1b\u56f4\u53e5", pattern: new RegExp("(?:\\u7a7a\\u6c14|\\u6c14\\u6c1b|\\u56db\\u5468|\\u5468\\u56f4|\\u7a7a\\u95f4|\\u5bdd\\u5bab\\u5185|\\u6bbf\\u5185|\\u6bbf\\u5916|\\u5fa1\\u4e66\\u623f\\u5185)[^\\u3002\\uff01\\uff1f\\n]{0,18}?(?:\\u7d27\\u7ef7|\\u51dd\\u6ede|\\u538b\\u6291|\\u6b7b\\u5bc2|\\u5bc2\\u9759|\\u51b7\\u5f97|\\u5347\\u9ad8|\\u4ee4\\u4eba\\u7a92\\u606f|\\u80cc\\u5fb7\\u611f|\\u964d\\u81f3\\u51b0\\u70b9)", "u") },
            { label: "\u7fa4\u50cf\u6c1b\u56f4\u53e5", pattern: new RegExp("(?:\\u6240\\u6709\\u4eba|\\u4f17\\u4eba|\\u6ee1\\u671d\\u6587\\u6b66|\\u7fa4\\u81e3)[^\\u3002\\uff01\\uff1f\\n]{0,18}?(?:\\u610f\\u4f4f\\u4e86|\\u5413\\u5230\\u4e86|\\u9ed8\\u4e0d\\u4f5c\\u58f0|\\u5c4f\\u4f4f\\u4e86\\u547c\\u5438|\\u4e0d\\u6562\\u51fa\\u58f0|\\u4e0d\\u6562\\u52a8)", "u") },
            { label: "\u7fa4\u50cf\u6050\u60e7\u53e5", pattern: new RegExp("(?:\\u6ca1\\u4eba|\\u65e0\\u4eba|\\u6ca1\\u6709\\u4eba|\\u6ca1\\u6709\\u4e00\\u4e2a\\u4eba)[^\\u3002\\uff01\\uff1f\\n]{0,10}?\\u6562(?:\\u51fa\\u58f0|\\u559d\\u9a82|\\u63a5\\u8bdd|\\u4e0a\\u524d|\\u52a8|\\u963b\\u62e6)", "u") },
            { label: "\u6b7b\u5bc2\u6a21\u677f\u53e5", pattern: new RegExp("(?:\\u6b7b\\u4e00\\u822c\\u7684\\u5bc2\\u9759|\\u6b7b\\u4e00\\u822c\\u7684\\u6c89\\u5bc2|\\u6b7b\\u5bc2|\\u9e26\\u96c0\\u65e0\\u58f0|\\u843d\\u9488\\u53ef\\u95fb)", "u") },
            { label: "\u5e8f\u5e55\u6a21\u677f\u53e5", pattern: new RegExp("\\u5728\\u6c89\\u9ed8\\u4e2d\\u62c9\\u5f00\\u5e8f\\u5e55", "u") },
            { label: "\u6982\u5ff5\u60c5\u7eea\u53e5", pattern: new RegExp("(?:\\u5c48\\u8fb1\\u611f|\\u6124\\u6012|\\u6740\\u610f|\\u6068\\u610f|\\u6012\\u706b|\\u6050\\u60e7|\\u7f9e\\u803b\\u611f|\\u7edd\\u671b)[^\\u3002\\uff01\\uff1f\\n]{0,20}?(?:\\u7ffb\\u6d8c|\\u5543\\u566c|\\u8513\\u5ef6|\\u5e2d\\u5377|\\u541e\\u6ca1|\\u70b8\\u5f00|\\u75af\\u957f)", "u") },
            { label: "\u60c5\u7eea\u5e76\u5217\u53e5", pattern: new RegExp("(?:\\u5c48\\u8fb1|\\u6124\\u6012|\\u6740\\u610f|\\u6068\\u610f|\\u6012\\u706b|\\u6050\\u60e7|\\u7f9e\\u803b)(?:\\u3001|\\uff0c)(?:\\u5c48\\u8fb1|\\u6124\\u6012|\\u6740\\u610f|\\u6068\\u610f|\\u6012\\u706b|\\u6050\\u60e7|\\u7f9e\\u803b)", "u") },
            { label: "\u60c5\u7eea\u751f\u6839\u53e5", pattern: new RegExp("\\u8fd9\\u4e9b\\u60c5\\u7eea[^\\u3002\\uff01\\uff1f\\n]{0,20}?(?:\\u751f\\u6839\\u53d1\\u82bd|\\u75af\\u957f|\\u7ffb\\u6d8c|\\u76d8\\u8e1e)", "u") },
            { label: "\u60c5\u7eea\u91cd\u590d\u53e5", pattern: new RegExp("((?:\\u5ac9\\u5992|\\u6068\\u610f|\\u6012\\u706b|\\u6740\\u610f|\\u6050\\u60e7|\\u5c48\\u8fb1|\\u5360\\u6709\\u6b32))(?:[\\uff0c\\u3001\\u3002\\uff01\\uff1f]\\s*|\\s+)(?:\\u75af\\u72c2\\u7684\\u3001\\u75c5\\u6001\\u7684|\\u75af\\u72c2\\u7684|\\u75c5\\u6001\\u7684)?\\s*\\1", "u") },
            { label: "\u538b\u8feb\u611f\u6a21\u677f\u53e5", pattern: new RegExp("(?:\\u6781\\u5177\\u538b\\u8feb\\u611f|\\u538b\\u8feb\\u611f[^\\u3002\\uff01\\uff1f\\n]{0,18}?(?:\\u704c\\u6ee1|\\u5e2d\\u5377|\\u538b\\u5728|\\u7b3c\\u7f69|\\u6251\\u9762\\u800c\\u6765|\\u903c\\u5f97)|\\u8083\\u6740\\u800c\\u72c2\\u66b4\\u7684\\u538b\\u8feb\\u611f|\\u6050\\u6016\\u6740\\u6c14)", "u") },
            { label: "\u8840\u4e1d\u6a21\u677f\u53e5", pattern: new RegExp("(?:\\u53cc\\u76ee\\u7309\\u7ea2|\\u773c\\u5e95[^\\u3002\\uff01\\uff1f\\n]{0,10}?\\u5e03\\u6ee1\\u8840\\u4e1d|\\u8840\\u4e1d[^\\u3002\\uff01\\uff1f\\n]{0,10}?\\u50cf[^\\u3002\\uff01\\uff1f\\n]{0,10}\\u7f51|\\u773c\\u767d[^\\u3002\\uff01\\uff1f\\n]{0,8}?\\u53d1\\u7ea2)", "u") },
            { label: "\u5957\u8def\u5371\u673a\u53e5", pattern: new RegExp("(?:\\u6765\\u8005\\u4e0d\\u5584|\\u95fb\\u7740[^\\u3002\\uff01\\uff1f\\n]{0,8}?\\u8840\\u8165\\u5473\\u8d76\\u56de\\u6765\\u7684\\u6076\\u72fc|\\u72c2\\u98ce\\u9aa4\\u96e8\\u822c|\\u9ed1\\u8272\\u95ea\\u7535\\u822c|\\u552f\\u552f\\u8bfa\\u8bfa)", "u") },
            { label: "\u5f3a\u8c03\u91cd\u590d\u53e5", pattern: new RegExp("(?:\\u53cd\\u53cd\\u590d\\u590d\\u56de\\u8361|\\u5b57\\u5b57\\u53e5\\u53e5[^\\u3002\\uff01\\uff1f\\n]{0,12}?\\u5f80[^\\u3002\\uff01\\uff1f\\n]{0,12}?\\u80ba\\u7ba1\\u5b50\\u4e0a\\u6233)", "u") },
            { label: "\u6a21\u677f\u63a8\u8fdb\u53e5", pattern: new RegExp("(?:\\u592a\\u5feb\\u4e86|\\u5c31\\u662f\\u73b0\\u5728|\\u5c31\\u5728\\u8fd9\\u65f6|\\u4e0b\\u4e00\\u523b|\\u7d27\\u63a5\\u7740|\\u7136\\u800c|\\u987a\\u52bf|\\u731b\\u5730|\\u6beb\\u4e0d\\u72b9\\u8c6b|\\u77ac\\u95f4|\\u5f7b\\u5e95|\\u5267\\u70c8|\\u6ca1\\u6709\\u518d\\u7ed9[^\\u3002\\uff01\\uff1f\\n]{0,8}\\u673a\\u4f1a)", "u") },
            { label: "\u77b3\u5b54\u6a21\u677f\u53e5", pattern: new RegExp("\\u77b3\\u5b54[^\\u3002\\uff01\\uff1f\\n]{0,8}?(?:\\u5fae\\u7f29|\\u9aa4\\u7f29|\\u6536\\u7f29|\\u731b\\u5730\\u4e00\\u7f29|\\u5fae\\u5fae\\u4e00\\u7f29)", "u") },
            { label: "\u58f0\u7ebf\u6a21\u677f\u53e5", pattern: new RegExp("(?:\\u58f0\\u97f3|\\u55d3\\u97f3|\\u55d3\\u5b50|\\u58f0\\u7ebf)[^\\u3002\\uff01\\uff1f\\n]{0,8}?(?:\\u6c99\\u54d1|\\u5606\\u54d1|\\u4f4e\\u54d1)", "u") },
            { label: "\u8eab\u4f53\u53cd\u5e94\u6a21\u677f\u53e5", pattern: new RegExp("(?:\\u80f8\\u819b[^\\u3002\\uff01\\uff1f\\n]{0,8}?(?:\\u5267\\u70c8\\u8d77\\u4f0f|\\u8d77\\u4f0f\\u4e0d\\u5b9a)|\\u80f8\\u53e3[^\\u3002\\uff01\\uff1f\\n]{0,8}?(?:\\u5267\\u70c8\\u8d77\\u4f0f|\\u8d77\\u4f0f\\u4e0d\\u5b9a)|\\u547c\\u5438[^\\u3002\\uff01\\uff1f\\n]{0,6}?(?:\\u4e00\\u6ede|\\u5fae\\u7a92)|\\u6307\\u7532[^\\u3002\\uff01\\uff1f\\n]{0,8}?(?:\\u6df1\\u9677\\u8089\\u91cc|\\u6380\\u8fdb\\u638c\\u5fc3|\\u51e0\\u4e4e\\u6380\\u8fdb\\u8089\\u91cc))", "u") }
        ];
        const hits = phrases.filter((phrase) => text.includes(phrase));
        regexRules.forEach((rule) => {
            if (rule.pattern.test(text) && !hits.includes(rule.label)) {
                hits.push(rule.label);
            }
        });
        return hits;
    }

    detectNextChapterLeakage(content, nextChapter) {
        if (!nextChapter || !nextChapter.summary) {
            return false;
        }
        const keywords = this.extractContentKeywords(`${nextChapter.title || ""}\n${nextChapter.summary}`, 5)
            .split("、")
            .filter(Boolean);
        const hitCount = keywords.filter((item) => String(content || "").includes(item)).length;
        return hitCount >= 3;
    }

    extractParagraphs(text, limit = 3, fromEnd = false) {
        const paragraphs = String(text || "")
            .split(/\n{2,}/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 20);
        if (!paragraphs.length) {
            return [];
        }
        return fromEnd ? paragraphs.slice(-limit) : paragraphs.slice(0, limit);
    }

    countSharedKeywords(leftText, rightText, limit = 8) {
        const left = new Set(this.extractContentKeywords(leftText, limit).split("、").filter(Boolean));
        const right = new Set(this.extractContentKeywords(rightText, limit).split("、").filter(Boolean));
        let hits = 0;
        left.forEach((item) => {
            if (right.has(item)) {
                hits += 1;
            }
        });
        return hits;
    }

    detectOpeningRecapWarning(chapter, content) {
        const chapterNumber = Number(chapter?.number || 0);
        if (!chapterNumber || !content) {
            return "";
        }
        const volumeNumber = this.getVolumeNumberForChapter(chapter);
        const previousChapter = this.getAdjacentChapter(chapterNumber, -1, volumeNumber);
        if (!previousChapter || !previousChapter.content) {
            return "";
        }

        const openingParagraphs = this.extractParagraphs(content, 3, false);
        const endingParagraphs = this.extractParagraphs(previousChapter.content, 2, true);
        if (!openingParagraphs.length || !endingParagraphs.length) {
            return "";
        }

        const openingText = openingParagraphs.join("\n\n");
        const previousTailText = endingParagraphs.join("\n\n");
        const previousEventText = [
            previousChapter.key_event || previousChapter.keyEvent || "",
            previousChapter.summary || "",
            previousChapter.next_chapter_setup?.suspense_hook || previousChapter.nextChapterSetup?.suspense_hook || ""
        ].filter(Boolean).join("\n");

        const tailOverlap = this.countSharedKeywords(openingText, previousTailText, 10);
        const summaryOverlap = this.countSharedKeywords(openingText, previousEventText, 10);
        const repeatedLineHits = endingParagraphs.filter((paragraph) =>
            openingParagraphs.some((opening) => this.countSharedKeywords(paragraph, opening, 8) >= 4)
        ).length;

        if (repeatedLineHits >= 1 || tailOverlap >= 5 || summaryOverlap >= 6) {
            return `连续性提醒：第${chapterNumber}章开头疑似大段复述上一章已完成内容，建议重看上一章结尾与本章开头的承接。`;
        }
        return "";
    }

    getAdjacentChapter(chapterNumber, offset, volumeNumber = 1) {
        const allChapters = (this.novelData.outline.volumes || []).flatMap((volume, volumeIndex) =>
            (volume.chapters || []).map((chapter) => ({
                ...chapter,
                _volumeNumber: Number(volume.volume_number || volumeIndex + 1)
            }))
        ).sort((left, right) => {
            if (left._volumeNumber !== right._volumeNumber) {
                return left._volumeNumber - right._volumeNumber;
            }
            return Number(left.number || 0) - Number(right.number || 0);
        });

        const currentIndex = allChapters.findIndex((item) =>
            Number(item._volumeNumber) === Number(volumeNumber) && Number(item.number || 0) === Number(chapterNumber || 0)
        );
        if (currentIndex === -1) {
            return null;
        }
        return allChapters[currentIndex + offset] || null;
    }

    getVolumeNumberForChapter(chapter) {
        const found = (this.novelData.outline.volumes || []).findIndex((volume) =>
            (volume.chapters || []).some((item) => item.id === chapter.id || Number(item.number || 0) === Number(chapter.number || 0))
        );
        return found >= 0 ? found + 1 : Number(this.elements.chapterEditorVolumeSelect?.value || this.elements.chapterVolumeSelect?.value || 1);
    }

    extractExtraCharacters(block) {
        let characters = 0;
        let subplots = 0;
        if (!block) {
            return { characters, subplots };
        }

        const extras = this.novelData.used_extras_characters;
        const tempSubplots = this.novelData.used_temp_subplots;

        block.split(/\r?\n/).forEach((line) => {
            const text = line.trim();
            if (!text) {
                return;
            }

            if (text.startsWith("龙套角色")) {
                const payload = text.split(/：|:/).slice(1).join(":");
                payload.split(/[，,]/).forEach((item) => {
                    const name = item.split(/[（(]/)[0].trim();
                    if (name && !extras.includes(name)) {
                        extras.push(name);
                        characters += 1;
                    }
                });
            }

            if (text.startsWith("临时支线")) {
                const subplot = text.split(/：|:/).slice(1).join(":").trim();
                if (subplot && !tempSubplots.includes(subplot)) {
                    tempSubplots.push(subplot);
                    subplots += 1;
                }
            }
        });

        return { characters, subplots };
    }

    getKnownCharacterNamesForExtras() {
        const names = new Set();
        const addName = (value) => {
            const normalized = this.resolveKnownCharacterName(this.normalizeCharacterReferenceLabel(value));
            if (normalized) {
                names.add(normalized);
            }
        };

        (this.novelData.outline?.characters || []).forEach((character) => {
            addName(character?.name || "");
            Utils.ensureArrayFromText(character?.aliases || character?.["别名"] || "").forEach((alias) => addName(alias));
        });
        Object.values(this.novelData.supporting_characters || {}).forEach((value) => {
            addName(value?.name || value?.["角色名"] || "");
        });
        Object.values(this.novelData.synopsisData?.main_characters || this.novelData.synopsis_data?.main_characters || {})
            .forEach((name) => addName(name));
        Object.keys(this.novelData.synopsisData?.locked_character_names || this.novelData.synopsis_data?.locked_character_names || {})
            .forEach((name) => addName(name));
        return names;
    }

    getKnownCharacterSurnamesForExtras() {
        const surnames = new Set();
        this.getKnownCharacterNamesForExtras().forEach((name) => {
            if (name) {
                surnames.add(name[0]);
            }
        });
        return surnames;
    }

    resolveExactKnownCharacterName(name) {
        const cleanName = this.normalizeCharacterReferenceLabel(name);
        if (!cleanName) {
            return "";
        }

        const synopsisData = this.novelData.synopsisData || this.novelData.synopsis_data || {};
        const mapping = synopsisData.vague_to_name_mapping || {};
        if (mapping[cleanName]) {
            return String(mapping[cleanName] || "").trim();
        }

        const roleAliases = {
            男主: ["男主", "男主角", "男主人公", "男一", "男一号", "男角"],
            女主: ["女主", "女主角", "女主人公", "女一", "女一号", "女角"],
            主角: ["主角", "主人公"],
            师尊: ["师尊"],
            反派: ["反派", "大反派", "反派boss"],
            男二: ["男二", "男二号"],
            女二: ["女二", "女二号"]
        };
        const matchedRole = Object.entries(roleAliases).find(([, aliases]) => aliases.includes(cleanName))?.[0];
        if (matchedRole && synopsisData.main_characters?.[matchedRole]) {
            return String(synopsisData.main_characters[matchedRole] || "").trim();
        }

        for (const [realName, info] of Object.entries(synopsisData.locked_character_names || {})) {
            const aliases = Utils.ensureArrayFromText(info?.aliases || [])
                .map((alias) => this.normalizeCharacterReferenceLabel(alias))
                .filter(Boolean);
            if (realName === cleanName || aliases.includes(cleanName)) {
                return String(realName || "").trim();
            }
        }

        const exactOutlineCharacter = (this.novelData.outline?.characters || []).find((item) =>
            Array.from(this.getCharacterAliasSet(item))
                .map((alias) => this.normalizeCharacterReferenceLabel(alias))
                .filter(Boolean)
                .includes(cleanName)
        );
        if (exactOutlineCharacter?.name) {
            return String(exactOutlineCharacter.name || "").trim();
        }

        if (this.getKnownCharacterNamesForExtras().has(cleanName)) {
            return cleanName;
        }

        return "";
    }

    getExtraCharacterSurnamePatternSource() {
        return "(?:欧阳|司马|上官|诸葛|司徒|夏侯|东方|独孤|慕容|令狐|公孙|闻人|尉迟|长孙|宇文|轩辕|南宫|赵|钱|孙|李|周|吴|郑|王|冯|陈|褚|卫|蒋|沈|韩|杨|朱|秦|尤|许|何|吕|施|张|孔|曹|严|华|金|魏|陶|姜|戚|谢|邹|喻|柏|水|窦|章|云|苏|潘|葛|奚|范|彭|郎|鲁|韦|昌|马|苗|凤|花|方|俞|任|袁|柳|酆|鲍|史|唐|费|廉|岑|薛|雷|贺|倪|汤|滕|殷|罗|毕|郝|邬|安|常|乐|于|时|傅|皮|卞|齐|康|伍|余|元|顾|孟|平|黄|和|穆|萧|尹|姚|邵|湛|汪|祁|毛|禹|狄|米|贝|明|臧|计|伏|成|戴|谈|宋|茅|庞|熊|纪|舒|屈|项|祝|董|梁|杜|阮|蓝|闵|席|季|麻|强|贾|路|娄|危|江|童|颜|郭|梅|盛|林|刁|钟|徐|邱|骆|高|夏|蔡|田|樊|胡|凌|霍|虞|万|支|柯|昝|管|卢|莫|经|房|裘|缪|干|解|应|宗|丁|宣|贲|邓|郁|单|杭|洪|包|左|石|崔|吉|龚|程|嵇|邢|滑|裴|陆|荣|翁|荀|羊|於|惠|甄|曲|家|封|芮|羿|储|靳|汲|邴|糜|松|井|段|富|巫|乌|焦|巴|弓|牧|隗|山|谷|车|侯|宓|蓬|全|郗|班|仰|秋|仲|伊|宫|宁|仇|栾|暴|甘|钭|厉|戎|祖|武|符|刘|景|詹|束|龙|叶|幸|司|韶|郜|黎|蓟|薄|印|宿|白|怀|蒲|邰|从|鄂|索|咸|籍|赖|卓|蔺|屠|蒙|池|乔|阴|郁|胥|能|苍|双|闻|莘|党|翟|谭|贡|劳|逄|姬|申|扶|堵|冉|宰|郦|雍|郤|璩|桑|桂|濮|牛|寿|通|边|扈|燕|冀|郏|浦|尚|农|温|别|庄|晏|柴|瞿|阎|充|慕|连|茹|习|宦|艾|鱼|容|向|古|易|慎|戈|廖|庾|终|暨|居|衡|步|都|耿|满|弘|匡|国|文|寇|广|禄|阙|东|殳|沃|利|蔚|越|夔|隆|师|巩|厍|聂|晁|勾|敖|融|冷|訾|辛|阚|那|简|饶|空|曾|毋|沙|乜|养|鞠|须|丰|巢|关|蒯|相|查|后|荆|红|游|竺|权|逯|盖|益|桓|公)";
    }

    getExtraCharacterRoleSuffixPatternSource() {
        return "(?:医生|护士|老师|同学|学长|学姐|师兄|师姐|师弟|师妹|师父|师娘|师傅|秘书|助理|前台|店员|经理|总监|院长|教授|导师|研究员|顾问|工程师|技工|组长|厂长|副厂长|技术员|组员|科员|科长|主任|部长|老板|警官|队长|代表|干事|班长|连长|营长|排长|大爷|大娘|婶子|嫂子|大嫂|伯伯|叔叔|阿姨)";
    }

    isPlausibleExtraCharacterName(name) {
        const normalized = this.normalizeCharacterReferenceLabel(name);
        if (!normalized) {
            return false;
        }

        if (!/^[\u4e00-\u9fa5]{2,6}$/u.test(normalized)) {
            return false;
        }

        const genericRolePattern = /^(主角|男主|女主|反派|路人|众人|少年|少女|男人|女人|师尊|掌门|长老|弟子|同门|敌人|对手|医生|护士|老师|学生|同学|学长|学姐|秘书|助理|前台|店员|经理|总监|院长|教授|导师|研究员|顾问|工程师|技工|组长|厂长|副厂长|技术员|组员|科员|科长|主任|部长|老板|上司|同事|室友|邻居|保镖|司机|管家|校医|警官|某人|某助理|某同事|某老师|某医生|某护士|某警官|某秘书)$/u;
        const traitPattern = /(不苟言笑|势利眼|热心肠|傲慢|阴险|八卦|冷淡|严肃|冷漠|注重|纪律|厂区|说话|目光|表情|声音|语气)$/u;
        if (genericRolePattern.test(normalized) || traitPattern.test(normalized)) {
            return false;
        }

        const surnameSource = this.getExtraCharacterSurnamePatternSource();
        const roleSuffixSource = this.getExtraCharacterRoleSuffixPatternSource();
        const plainNamePattern = new RegExp(`^${surnameSource}[\\u4e00-\\u9fa5]{1,2}$`, "u");
        const namedRolePattern = new RegExp(`^${surnameSource}(?:[\\u4e00-\\u9fa5]{0,2})${roleSuffixSource}$`, "u");
        return namedRolePattern.test(normalized)
            || (plainNamePattern.test(normalized) && normalized.length >= 3);
    }

    hasExtraCharacterEvidenceInContent(name, cleanedContent = "") {
        const candidate = this.normalizeExtraCharacterNameCandidate(name);
        const content = String(cleanedContent || "");
        if (!candidate) {
            return false;
        }
        if (!content.trim()) {
            return true;
        }
        return content.includes(candidate);
    }

    resolveExtraCharacterNameFromCandidate(value, cleanedContent = "") {
        const normalized = this.normalizeExtraCharacterNameCandidate(value);
        if (!normalized || !this.isPlausibleExtraCharacterName(normalized)) {
            return "";
        }

        if (this.isExtraCharacterNameConflict(normalized)) {
            return "";
        }

        const content = String(cleanedContent || "");
        if (!content.trim()) {
            return normalized;
        }

        return this.hasExtraCharacterEvidenceInContent(normalized, content) ? normalized : "";
    }

    resolveAppearanceCharacterNameCandidate(value, cleanedContent = "") {
        const exactKnown = this.resolveExactKnownCharacterName(value);
        if (exactKnown) {
            return exactKnown;
        }
        return this.resolveExtraCharacterNameFromCandidate(value, cleanedContent);
    }

    collectAppearanceExtraCharacterCandidates(block = "", cleanedContent = "") {
        const names = [];
        const seen = new Set();
        block.split(/\r?\n/).forEach((line) => {
            const text = line.trim();
            if (!text || !text.includes("|")) {
                return;
            }
            const parts = text.split("|").map((item) => item.trim()).filter(Boolean);
            if (parts.length !== 3) {
                return;
            }
            const name = this.resolveAppearanceCharacterNameCandidate(parts[0], cleanedContent);
            if (!name || seen.has(name) || this.isExtraCharacterNameConflict(name)) {
                return;
            }
            seen.add(name);
            names.push(name);
        });
        return names;
    }

    splitExtraCharacterPayload(payload) {
        const source = String(payload || "").trim();
        if (!source) {
            return [];
        }

        const parts = [];
        let buffer = "";
        let depth = 0;
        for (const char of source) {
            if (char === "（" || char === "(" || char === "[" || char === "【") {
                depth += 1;
                buffer += char;
                continue;
            }
            if (char === "）" || char === ")" || char === "]" || char === "】") {
                depth = Math.max(0, depth - 1);
                buffer += char;
                continue;
            }
            if (depth === 0 && /[，,、；;]/.test(char)) {
                if (buffer.trim()) {
                    parts.push(buffer.trim());
                }
                buffer = "";
                continue;
            }
            buffer += char;
        }
        if (buffer.trim()) {
            parts.push(buffer.trim());
        }
        return parts;
    }

    normalizeExtraCharacterNameCandidate(value) {
        const rawText = String(value || "")
            .trim()
            .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
            .replace(/^[\-•·●]\s*/, "")
            .trim();
        if (!rawText) {
            return "";
        }

        if (/^(?:她的|他的|我的|你的|这个|那个|这位|那位)/u.test(rawText)) {
            return "";
        }

        return this.normalizeCharacterReferenceLabel(
            rawText
                .split(/[（(]/)[0]
                .split(/[：:]/)[0]
                .split(/[|｜]/)[0]
                .trim()
        );
    }

    isExtraCharacterNameConflict(name) {
        const normalized = this.normalizeExtraCharacterNameCandidate(name);
        if (!normalized) {
            return true;
        }

        if (!this.isPlausibleExtraCharacterName(normalized)) {
            return true;
        }

        if (this.getKnownCharacterNamesForExtras().has(normalized)) {
            return true;
        }

        const resolved = this.resolveKnownCharacterName(normalized);
        if (resolved && resolved !== normalized) {
            return true;
        }
        if (resolved && this.getKnownCharacterNamesForExtras().has(resolved)) {
            return true;
        }

        return false;
    }

    rebuildUsedExtraCharacters(targetChapterNumber = Infinity) {
        const target = Number.isFinite(Number(targetChapterNumber)) ? Number(targetChapterNumber) : Infinity;
        const records = this.novelData.extra_character_records && typeof this.novelData.extra_character_records === "object"
            ? this.novelData.extra_character_records
            : {};
        const extras = [];
        const seen = new Set();

        Object.entries(records)
            .filter(([key]) => this.extractSnapshotChapterNumber(key) <= target)
            .sort((left, right) => this.extractSnapshotChapterNumber(left[0]) - this.extractSnapshotChapterNumber(right[0]))
            .forEach(([, record]) => {
                (Array.isArray(record?.characters) ? record.characters : []).forEach((name) => {
                    const text = this.resolveExtraCharacterNameFromCandidate(name);
                    if (!text || seen.has(text)) {
                        return;
                    }
                    seen.add(text);
                    extras.push(text);
                });
            });

        this.novelData.used_extras_characters = extras;
        return extras;
    }

    extractExtraCharacters(chapterNumber, block, cleanedContent = "", options = {}) {
        let characters = 0;
        let subplots = 0;
        const chapterKey = `chapter_${Number(chapterNumber || 0)}`;
        const appearanceBlock = String(options.appearanceBlock || "");
        this.novelData.extra_character_records = this.novelData.extra_character_records && typeof this.novelData.extra_character_records === "object"
            ? this.novelData.extra_character_records
            : {};
        const previousRecord = this.novelData.extra_character_records[chapterKey];
        const previousCharacters = Array.isArray(previousRecord?.characters) ? previousRecord.characters : [];

        if (!block && !appearanceBlock.trim()) {
            delete this.novelData.extra_character_records[chapterKey];
            this.rebuildUsedExtraCharacters();
            return { characters, subplots };
        }

        const tempSubplots = this.novelData.used_temp_subplots;
        const record = {
            chapter: Number(chapterNumber || 0),
            characters: [],
            raw: block || appearanceBlock
        };
        const seenCharacters = new Set();

        this.collectAppearanceExtraCharacterCandidates(appearanceBlock, cleanedContent).forEach((name) => {
            if (!name || seenCharacters.has(name)) {
                return;
            }
            seenCharacters.add(name);
            record.characters.push(name);
        });

        String(block || "").split(/\r?\n/).forEach((line) => {
            const text = line.trim();
            if (!text) {
                return;
            }

            if (/^(龙套角色|榫欏瑙掕壊)[:：]/.test(text)) {
                const payload = text.replace(/^(龙套角色|榫欏瑙掕壊)[:：]\s*/, "");
                this.splitExtraCharacterPayload(payload).forEach((item) => {
                    const name = this.resolveExtraCharacterNameFromCandidate(item, cleanedContent);
                    if (!name || seenCharacters.has(name)) {
                        return;
                    }
                    seenCharacters.add(name);
                    record.characters.push(name);
                });
            }

            if (/^(临时支线|涓存椂鏀嚎)[:：]/.test(text)) {
                const subplot = text.replace(/^(临时支线|涓存椂鏀嚎)[:：]\s*/, "").trim();
                if (subplot && !tempSubplots.includes(subplot)) {
                    tempSubplots.push(subplot);
                    subplots += 1;
                }
            }
        });

        if (record.characters.length) {
            this.novelData.extra_character_records[chapterKey] = record;
        } else {
            delete this.novelData.extra_character_records[chapterKey];
        }

        this.rebuildUsedExtraCharacters();
        characters = record.characters.filter((name) => !previousCharacters.includes(name)).length;
        return { characters, subplots };
    }

    extractForeshadowsFromBlock(chapterNumber, block) {
        const stats = { newCount: 0, resolveCount: 0 };
        if (!block) {
            return stats;
        }

        const tracker = this.novelData.foreshadow_tracker;
        tracker.foreshadows = tracker.foreshadows || {};
        let section = "";

        block.split(/\r?\n/).forEach((line) => {
            const text = line.trim();
            if (!text) {
                return;
            }

            if (text.startsWith("新埋")) {
                section = "new";
                return;
            }
            if (text.startsWith("回收")) {
                section = "resolved";
                return;
            }

            if (section === "new") {
                const content = text.replace(/^\d+[.、]?\s*/, "").trim();
                if (!content) {
                    return;
                }
                const id = `f_${tracker.next_id || 1}`;
                tracker.foreshadows[id] = {
                    id,
                    埋设章节: chapterNumber,
                    伏笔内容: content,
                    伏笔类型: this.detectForeshadowType(content),
                    计划回收: this.detectPlannedReveal(content),
                    状态: "未回收"
                };
                tracker.next_id = Number(tracker.next_id || 1) + 1;
                stats.newCount += 1;
            }

            if (section === "resolved") {
                const resolvedText = text.replace(/^\d+[.、]?\s*/, "").trim();
                const unresolved = Object.values(tracker.foreshadows || {}).find((item) =>
                    item["状态"] !== "已回收" &&
                    (resolvedText.includes(item["伏笔内容"]) || item["伏笔内容"].includes(resolvedText))
                );
                if (unresolved) {
                    unresolved["状态"] = "已回收";
                    unresolved["回收章节"] = chapterNumber;
                    stats.resolveCount += 1;
                }
            }
        });

        return stats;
    }

    detectForeshadowType(text) {
        if (text.includes("秘密") || text.includes("身份")) return "秘密伏笔";
        if (text.includes("物") || text.includes("宝")) return "物品伏笔";
        if (text.includes("人物") || text.includes("关系")) return "人物伏笔";
        return "剧情伏笔";
    }

    detectPlannedReveal(text) {
        const match = text.match(/第\s*(\d+)\s*章|本卷末|卷末/);
        return match ? match[0] : "";
    }

    extractPersonalityChanges(chapterNumber, block) {
        if (!block) {
            return 0;
        }

        const tracker = this.novelData.personality_enforcer;
        tracker.personality_changes = tracker.personality_changes || {};
        let count = 0;

        block.split(/\r?\n/).forEach((line) => {
            const text = line.trim();
            if (!text || !text.includes("|")) {
                return;
            }
            const parts = text.split("|").map((item) => item.trim());
            if (parts.length < 5) {
                return;
            }

            const [name, event, oldPersonality, newPersonality, reason] = parts;
            tracker.personality_changes[name] = tracker.personality_changes[name] || [];
            tracker.personality_changes[name].push({
                章节: chapterNumber,
                事件: event,
                旧性格: oldPersonality,
                新性格: newPersonality,
                原因: reason
            });
            count += 1;
        });

        return count;
    }

    extractCharacterAppearances(chapterNumber, block, cleanedContent = "") {
        const stats = { appearances: 0, relationships: 0 };
        if (!block) {
            return stats;
        }

        const tracker = this.novelData.character_appearance_tracker;
        tracker.appearances = tracker.appearances || {};
        tracker.relationships = tracker.relationships || {};

        block.split(/\r?\n/).forEach((line) => {
            const text = line.trim();
            if (!text || !text.includes("|")) {
                return;
            }

            const parts = text.split("|").map((item) => item.trim()).filter(Boolean);
            if (parts.length === 3) {
                const [rawName, identity] = parts;
                const name = this.resolveAppearanceCharacterNameCandidate(rawName, cleanedContent);
                if (!name) {
                    return;
                }
                if (!tracker.appearances[name]) {
                    tracker.appearances[name] = {
                        首次出场: chapterNumber,
                        出场章节: [chapterNumber],
                        身份: identity || ""
                    };
                    stats.appearances += 1;
                } else if (!tracker.appearances[name].出场章节.includes(chapterNumber)) {
                    tracker.appearances[name].出场章节.push(chapterNumber);
                }
            }

            if (parts.length >= 4) {
                const [rawLeft, rawRight, relation] = parts;
                const left = this.resolveAppearanceCharacterNameCandidate(rawLeft, cleanedContent);
                const right = this.resolveAppearanceCharacterNameCandidate(rawRight, cleanedContent);
                if (!left || !right || left === right) {
                    return;
                }
                const key = [left, right].sort().join("|");
                if (!tracker.relationships[key]) {
                    tracker.relationships[key] = {
                        首次见面: chapterNumber,
                        关系: relation || "",
                        互动章节: [chapterNumber]
                    };
                    stats.relationships += 1;
                } else if (!tracker.relationships[key].互动章节.includes(chapterNumber)) {
                    tracker.relationships[key].互动章节.push(chapterNumber);
                }
            }
        });

        return stats;
    }

    getChapterFromEditor() {
        const number = Number(this.elements.chapterNumberInput.value || 0);
        if (!number) {
            return null;
        }

        const volume = this.getCurrentChapterVolume();
        const existing = volume?.chapters.find((item) =>
            item.id === this.state.selectedChapterId || Number(item.number || 0) === number
        ) || {};
        return {
            ...existing,
            id: this.state.selectedChapterId || existing.id || Utils.uid("chapter"),
            number,
            title: this.elements.chapterTitleInput.value.trim() || `第${number}章`,
            summary: this.elements.chapterSummaryInput.value.trim(),
            chapter_setting_note: this.elements.chapterSettingNoteInput.value.trim(),
            content: this.elements.chapterContentInput.value.trim()
        };
    }

    upsertChapter(volume, incomingChapter) {
        const existingIndex = volume.chapters.findIndex((chapter) =>
            chapter.id === incomingChapter.id || chapter.number === incomingChapter.number
        );

        const normalized = storage.normalizeChapter({
            ...incomingChapter,
            updatedAt: incomingChapter.updatedAt || new Date().toISOString()
        });

        if (existingIndex >= 0) {
            volume.chapters[existingIndex] = {
                ...volume.chapters[existingIndex],
                ...normalized
            };
        } else {
            volume.chapters.push(normalized);
        }
        volume.chapters.sort(Utils.chapterSort);
        const volumeNumber = this.novelData.outline.volumes.findIndex((item) => item === volume) + 1;
        if (volumeNumber > 0) {
            this.syncPlotUnitForChapter(volumeNumber, normalized);
        }
    }

    createEmptyPlotUnitProgress() {
        return {
            开端: { status: "待开始", chapters: [] },
            发展: { status: "待开始", chapters: [] },
            高潮: { status: "待开始", chapters: [] },
            结尾: { status: "待开始", chapters: [] }
        };
    }

    getPlotUnitPhaseForChapter(chapterNumber) {
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

    getPlotUnitId(volumeNumber, unitNumber) {
        return `pu_v${volumeNumber}_u${unitNumber}`;
    }

    syncPlotUnitForChapter(volumeNumber, chapter) {
        const manager = this.novelData.outline_plot_unit_manager || (this.novelData.outline_plot_unit_manager = {
            plot_units: {},
            next_id: 1,
            unit_history: []
        });
        manager.plot_units = manager.plot_units || {};
        manager.unit_history = Array.isArray(manager.unit_history) ? manager.unit_history : [];
        manager.next_id = Number(manager.next_id || 1);

        const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
        if (!chapterNumber) {
            return;
        }

        const unitNumber = Math.floor((chapterNumber - 1) / 8) + 1;
        const startChapter = (unitNumber - 1) * 8 + 1;
        const endChapter = unitNumber * 8;
        const { phase, position } = this.getPlotUnitPhaseForChapter(chapterNumber);
        const unitId = this.getPlotUnitId(volumeNumber, unitNumber);
        const existing = manager.plot_units[unitId];

        const unit = existing || {
            id: unitId,
            uid: unitId,
            unit_number: unitNumber,
            volume: volumeNumber,
            start_chapter: startChapter,
            end_chapter: endChapter,
            chapters: [],
            current_phase: phase,
            completed: false,
            core_conflict: chapter.key_event || chapter.keyEvent || "",
            related_chars: Utils.ensureArrayFromText(chapter.characters),
            suspense_hook: "",
            connection_to_previous: "",
            connection_to_next: "",
            phase_progress: this.createEmptyPlotUnitProgress(),
            created_at: new Date().toISOString()
        };

        unit.volume = volumeNumber;
        unit.start_chapter = startChapter;
        unit.end_chapter = endChapter;
        unit.current_phase = phase;
        unit.current_position = position;
        unit.chapters = Array.from(new Set([...(unit.chapters || []), chapterNumber])).sort((left, right) => left - right);
        unit.related_chars = Array.from(new Set([
            ...(unit.related_chars || []),
            ...Utils.ensureArrayFromText(chapter.characters)
        ])).slice(0, 12);
        unit.core_conflict = unit.core_conflict || chapter.key_event || chapter.keyEvent || "";

        unit.phase_progress = unit.phase_progress || this.createEmptyPlotUnitProgress();
        Object.keys(this.createEmptyPlotUnitProgress()).forEach((phaseName) => {
            unit.phase_progress[phaseName] = unit.phase_progress[phaseName] || { status: "待开始", chapters: [] };
        });
        unit.phase_progress[phase].chapters = Array.from(new Set([
            ...(unit.phase_progress[phase].chapters || []),
            chapterNumber
        ])).sort((left, right) => left - right);

        const phaseOrder = ["开端", "发展", "高潮", "结尾"];
        const currentPhaseIndex = phaseOrder.indexOf(phase);
        phaseOrder.forEach((phaseName, index) => {
            if (index < currentPhaseIndex) {
                unit.phase_progress[phaseName].status = "已完成";
            } else if (index === currentPhaseIndex) {
                unit.phase_progress[phaseName].status = "进行中";
            } else if (!unit.phase_progress[phaseName].status || unit.phase_progress[phaseName].status === "进行中") {
                unit.phase_progress[phaseName].status = "待开始";
            }
        });

        if (chapter.plot_unit?.connects_to_previous) {
            unit.connection_to_previous = chapter.plot_unit.connects_to_previous;
        }
        if (chapter.plot_unit?.sets_up_next) {
            unit.connection_to_next = chapter.plot_unit.sets_up_next;
        }
        if (chapter.next_chapter_setup?.suspense_hook) {
            unit.suspense_hook = chapter.next_chapter_setup.suspense_hook;
        }
        if (position === 8) {
            unit.completed = true;
            unit.phase_progress.结尾.status = "已完成";
            unit.completed_at = new Date().toISOString();
            const historyKey = `v${volumeNumber}-u${unitNumber}`;
            if (!manager.unit_history.some((item) => item.key === historyKey)) {
                manager.unit_history.push({
                    key: historyKey,
                    unit_number: unitNumber,
                    volume: volumeNumber,
                    completed_chapter: chapterNumber,
                    suspense_hook: unit.suspense_hook || "",
                    completed_at: unit.completed_at
                });
                manager.unit_history = manager.unit_history.slice(-40);
            }
        }

        manager.plot_units[unitId] = unit;
        if (!existing) {
            manager.next_id += 1;
        }
    }

    rebuildPlotUnitManager(persistAfter = false) {
        const manager = {
            plot_units: {},
            next_id: 1,
            unit_history: []
        };
        this.novelData.outline_plot_unit_manager = manager;

        (this.novelData.outline.volumes || []).forEach((volume, index) => {
            (volume.chapters || [])
                .slice()
                .sort(Utils.chapterSort)
                .forEach((chapter) => this.syncPlotUnitForChapter(index + 1, chapter));
        });

        if (persistAfter) {
            this.persist(true);
        }
    }

    async generateCharactersFromOutlines(
        chapters = null,
        volumeNumber = Number(this.elements.chapterVolumeSelect.value || 1),
        useLoading = true
    ) {
        const currentVolume = this.novelData.outline.volumes[volumeNumber - 1];
        const outlineChapters = chapters || (currentVolume?.chapters || []);
        if (!outlineChapters.length) {
            throw new Error("请先生成大纲，再根据大纲内容补全人物设定。");
        }

        const task = async () => {
            const outlineSyncResult = this.generator.mergeSynopsisStateFromGeneratedChapters(
                this.novelData,
                outlineChapters,
                volumeNumber,
                {
                    concept: this.novelData.outline?.concept || "",
                    volumeSummary: currentVolume?.summary || ""
                }
            );
            this.applyOutlineMappingsToChapters(outlineChapters);
            if (outlineSyncResult.mainMappings?.length || outlineSyncResult.supportingMappings?.length) {
                Utils.log(
                    `已从当前大纲同步角色映射：主角 ${outlineSyncResult.mainMappings.length} 条，配角 ${outlineSyncResult.supportingMappings.length} 条。`,
                    "info"
                );
            }

            Utils.updateLoading("正在从大纲里提取角色线索...", {
                progress: 10,
                detail: "按章纲【出场人物】收集原始角色描述"
            });
            const roleCandidates = Object.entries(
                this.generator.extractRoleCandidatesFromChapters(this.novelData, outlineChapters, volumeNumber) || {}
            );
            const estimatedBatches = Math.max(1, Math.ceil(roleCandidates.length / 8));

            Utils.updateLoading("角色线索提取完成，开始分批生成人设...", {
                progress: 18,
                detail: `识别到 ${roleCandidates.length} 名候选角色，共 ${estimatedBatches} 批`
            });
            Utils.log(`人物补全任务已开始：识别到 ${roleCandidates.length} 名候选角色，共 ${estimatedBatches} 批。`, "info");

            const generatedCharacters = await this.generator.generateCharactersFromOutlines({
                project: this.novelData,
                chapters: outlineChapters,
                volumeNumber,
                onProgress: ({ type, batchIndex, totalBatches, batchSize, generatedCount, names = [] }) => {
                    const safeTotal = Math.max(1, Number(totalBatches || 1));
                    const safeIndex = Math.max(1, Number(batchIndex || 1));
                    const namePreview = names.slice(0, 3).join("、");

                    if (type === "batch_start") {
                        const progress = Math.min(88, 18 + Math.round(((safeIndex - 1) / safeTotal) * 60));
                        Utils.updateLoading(`正在补全第 ${safeIndex}/${safeTotal} 批角色`, {
                            progress,
                            detail: `本批 ${batchSize || 0} 人${namePreview ? `：${namePreview}` : ""}`
                        });
                        Utils.log(`正在补全第 ${safeIndex}/${safeTotal} 批角色：${batchSize || 0} 人${namePreview ? `（${namePreview}）` : ""}`, "info");
                    }

                    if (type === "batch_success") {
                        const progress = Math.min(94, 18 + Math.round((safeIndex / safeTotal) * 70));
                        Utils.updateLoading(`第 ${safeIndex}/${safeTotal} 批角色已完成`, {
                            progress,
                            detail: `本批返回 ${generatedCount || 0} 条人设`
                        });
                        Utils.log(`第 ${safeIndex}/${safeTotal} 批角色补全完成，返回 ${generatedCount || 0} 条人设。`, "success");
                    }
                }
            });

            if (!generatedCharacters.length) {
                Utils.showMessage("没有识别到需要生成人设的新角色。", "info");
                Utils.log("章纲中未提取到可生成人设的角色。", "info");
                return;
            }

            Utils.updateLoading("人物设定已生成，正在写入人物库...", {
                progress: 96,
                detail: `本次共生成 ${generatedCharacters.length} 条人设`
            });
            const added = this.mergeGeneratedCharacters(generatedCharacters);
            this.generator.syncGeneratedCharacterMappings(this.novelData, generatedCharacters, volumeNumber);
            this.persist(true);
            this.renderCharacterList();
            this.renderDashboard();
            Utils.updateLoading("人物补全完成", {
                progress: 100,
                detail: `新增或更新 ${added} 个角色`
            });
            Utils.showMessage(`已根据大纲补充 ${added} 个角色设定。`, "success");
            Utils.log(`已根据大纲分批补全人设，新增/更新 ${added} 个角色。`, "success");
        };

        if (useLoading) {
            await this.runWithLoading("正在根据大纲分批补全人设...", task);
        } else {
            await task();
        }
    }

    getOutlineCharacterExcludedNames() {
        return new Set([
            "主角", "男主", "女主", "反派", "路人", "众人", "少年", "少女", "男人", "女人",
            "师尊", "掌门", "长老", "弟子", "同门", "敌人", "对手", "黑影", "来人", "医者"
        ]);
    }

    getCharacterAliasSet(character = {}) {
        const names = new Set();
        const primaryName = String(character.name || "").trim();
        if (primaryName) {
            names.add(primaryName);
        }
        Utils.ensureArrayFromText(character.aliases || character["别名"] || "")
            .map((alias) => String(alias || "").trim())
            .filter(Boolean)
            .forEach((alias) => names.add(alias));
        return names;
    }

    findExistingCharacterIndexByAnyName(name) {
        const target = String(name || "").trim();
        if (!target) {
            return -1;
        }
        return this.novelData.outline.characters.findIndex((item) => this.getCharacterAliasSet(item).has(target));
    }

    resolveKnownCharacterName(name) {
        const cleanName = String(name || "").trim();
        const mapping = this.novelData.synopsisData?.vague_to_name_mapping || this.novelData.synopsis_data?.vague_to_name_mapping || {};
        return String(mapping[cleanName] || cleanName).trim();
    }

    isValidOutlineCharacterName(name) {
        const resolved = this.resolveKnownCharacterName(name);
        if (!/^[\u4e00-\u9fa5]{2,4}$/.test(resolved)) {
            return false;
        }
        return !this.getOutlineCharacterExcludedNames().has(resolved);
    }

    extractCharacterSeedsFromSummary(summary, chapterNumber = 0) {
        const text = String(summary || "");
        if (!text.trim()) {
            return [];
        }

        const sectionMatch = text.match(/【出场人物】([\s\S]*?)(?=\n【|$)/);
        const section = sectionMatch?.[1] ? String(sectionMatch[1]).trim() : "";
        const seeds = [];

        if (section) {
            section.split(/\r?\n/).forEach((line) => {
                const rawLine = line.trim();
                if (!rawLine || (!rawLine.startsWith("-") && !rawLine.startsWith("•"))) {
                    return;
                }
                const cleaned = rawLine.replace(/^[•\-]\s*/, "");
                if (!cleaned) {
                    return;
                }
                const match = cleaned.match(/^([\u4e00-\u9fa5]{2,4})(?:（([^）]{1,40})）|\(([^)]{1,40})\))?/);
                const rawName = match?.[1] || cleaned.split(/[（(]/)[0]?.trim() || "";
                const name = this.resolveKnownCharacterName(rawName);
                if (!this.isValidOutlineCharacterName(name)) {
                    return;
                }
                const desc = String(match?.[2] || match?.[3] || "").trim();
                seeds.push({
                    name,
                    identity: desc,
                    source: chapterNumber ? `第${chapterNumber}章出场人物` : "章纲出场人物"
                });
            });
        }

        return seeds;
    }

    syncCharactersFromOutlineSections(chapters = [], volumeNumber = 0) {
        let added = 0;
        let updated = 0;
        const appearanceTracker = this.novelData.character_appearance_tracker || {};
        this.novelData.character_appearance_tracker = appearanceTracker;

        (chapters || []).forEach((chapter) => {
            const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
            const directNames = Utils.ensureArrayFromText(chapter.characters)
                .map((name) => this.resolveKnownCharacterName(name))
                .filter((name) => this.isValidOutlineCharacterName(name))
                .map((name) => ({ name, identity: "", source: chapterNumber ? `第${chapterNumber}章角色数组` : "章纲角色数组" }));
            const sectionSeeds = this.extractCharacterSeedsFromSummary(chapter.summary || "", chapterNumber);
            const seeds = [...directNames, ...sectionSeeds];

            seeds.forEach((seed) => {
                const existingIndex = this.findExistingCharacterIndexByAnyName(seed);
                if (existingIndex >= 0) {
                    const existing = this.novelData.outline.characters[existingIndex];
                    const nextCharacter = {
                        ...existing,
                        identity: existing.identity || seed.identity || "",
                        background: existing.background || `${seed.source}提及角色，后续可补充背景。`,
                        relationships: existing.relationships || "",
                        appearance: existing.appearance || ""
                    };
                    if (JSON.stringify(nextCharacter) !== JSON.stringify(existing)) {
                        this.novelData.outline.characters[existingIndex] = storage.normalizeCharacter(nextCharacter);
                        updated += 1;
                    }
                } else {
                    this.novelData.outline.characters.push(storage.normalizeCharacter({
                        id: Utils.uid("character"),
                        name: seed.name,
                        identity: seed.identity || "章纲出场角色",
                        background: `${seed.source}提及角色，后续可补充背景。`,
                        personality: "",
                        appearance: "",
                        abilities: "",
                        goals: "",
                        relationships: ""
                    }));
                    added += 1;
                }

            });
        });

        return { added, updated };
    }

    mergeGeneratedCharacters(characters) {
        let changed = 0;

        characters.forEach((character) => {
            const normalized = storage.normalizeCharacter({
                ...character,
                id: character.id || Utils.uid("character")
            });
            const existingIndex = this.findExistingCharacterIndexByAnyName(normalized);

            if (existingIndex >= 0) {
                const existing = this.novelData.outline.characters[existingIndex];
                const mergedAliases = Array.from(new Set([
                    ...Utils.ensureArrayFromText(existing.aliases || existing["别名"] || ""),
                    ...Utils.ensureArrayFromText(normalized.aliases || normalized["别名"] || "")
                ])).filter(Boolean);
                this.novelData.outline.characters[existingIndex] = storage.normalizeCharacter({
                    ...existing,
                    ...normalized,
                    aliases: mergedAliases,
                    别名: mergedAliases.join("、")
                });
            } else {
                this.novelData.outline.characters.push(normalized);
            }
            changed += 1;
        });

        return changed;
    }

    mergeRelationshipText(...texts) {
        const parts = [];
        const seen = new Set();
        texts
            .flatMap((text) => String(text || "").split(/[\r\n]+|[；;]+/))
            .map((item) => item.trim())
            .filter(Boolean)
            .forEach((item) => {
                if (!seen.has(item)) {
                    seen.add(item);
                    parts.push(item);
                }
            });
        return parts.join("\n");
    }

    inferRelationshipLabel(description) {
        const text = String(description || "");
        if (!text.trim()) {
            return "";
        }

        const rules = [
            { label: "师徒", patterns: [/师父|师尊|徒弟|弟子|门下/] },
            { label: "夫妻", patterns: [/夫妻|妻子|丈夫|夫君|娘子/] },
            { label: "恋人", patterns: [/恋人|爱人|心上人|未婚妻|未婚夫|道侣/] },
            { label: "父子", patterns: [/父子/] },
            { label: "母子", patterns: [/母子/] },
            { label: "父女", patterns: [/父女/] },
            { label: "母女", patterns: [/母女/] },
            { label: "兄妹", patterns: [/兄妹/] },
            { label: "姐弟", patterns: [/姐弟/] },
            { label: "姐妹", patterns: [/姐妹/] },
            { label: "兄弟", patterns: [/兄弟/] },
            { label: "朋友", patterns: [/朋友|挚友/] },
            { label: "同门", patterns: [/同门|师兄|师姐|师弟|师妹/] },
            { label: "盟友", patterns: [/盟友|同盟|合作/] },
            { label: "主仆", patterns: [/侍女|仆从|家臣|护卫/] },
            { label: "上下级", patterns: [/上司|下属|部下|统领|掌柜|老板/] },
            { label: "敌对", patterns: [/敌人|死敌|仇人|仇敌|敌对|对手/] },
            { label: "旧识", patterns: [/旧识|旧友|青梅竹马|发小/] }
        ];

        const matched = rules.find((rule) => rule.patterns.some((pattern) => pattern.test(text)));
        if (matched) {
            return matched.label;
        }
        if (/父亲|母亲|哥哥|姐姐|妹妹|弟弟/.test(text)) {
            return "亲属";
        }
        if (/关系|牵扯|相关/.test(text)) {
            return Utils.summarizeText(text, 24);
        }
        return "";
    }

    extractRelationshipInfoForSeed(name, description, knownNames = []) {
        const cleanName = this.resolveKnownCharacterName(name);
        const cleanDescription = String(description || "").trim();
        if (!cleanDescription) {
            return { relationships: "", relationPairs: [] };
        }

        const resolvedKnownNames = Array.from(new Set((knownNames || [])
            .map((item) => this.resolveKnownCharacterName(item))
            .filter((item) => item && item !== cleanName && this.isValidOutlineCharacterName(item))));

        const relation = this.inferRelationshipLabel(cleanDescription);
        const relationPairs = [];
        const snippets = [];

        resolvedKnownNames.forEach((otherName) => {
            if (!cleanDescription.includes(otherName) || !relation) {
                return;
            }
            relationPairs.push({
                left: cleanName,
                right: otherName,
                relation
            });
            snippets.push(`${otherName}：${relation}`);
        });

        if (!snippets.length && /父亲|母亲|哥哥|姐姐|妹妹|弟弟|师父|徒弟|恋人|朋友|敌人|对手|同门|上司|下属|属下|盟友/.test(cleanDescription)) {
            snippets.push(Utils.summarizeText(cleanDescription, 36));
        }

        return {
            relationships: this.mergeRelationshipText(...snippets),
            relationPairs
        };
    }

    recordOutlineRelationshipPairs(relationPairs = [], chapterNumber = 0) {
        if (!relationPairs.length) {
            return 0;
        }

        const tracker = this.novelData.character_appearance_tracker || {};
        tracker.relationships = tracker.relationships || {};
        this.novelData.character_appearance_tracker = tracker;

        let changed = 0;
        relationPairs.forEach(({ left, right, relation }) => {
            if (!left || !right || left === right) {
                return;
            }
            const key = [left, right].sort().join("|");
            if (!tracker.relationships[key]) {
                tracker.relationships[key] = {
                    首次见面: chapterNumber || 0,
                    关系: relation || "",
                    互动章节: chapterNumber ? [chapterNumber] : []
                };
                changed += 1;
                return;
            }
            if (relation && !tracker.relationships[key].关系) {
                tracker.relationships[key].关系 = relation;
                changed += 1;
            }
            if (chapterNumber && !tracker.relationships[key].互动章节.includes(chapterNumber)) {
                tracker.relationships[key].互动章节.push(chapterNumber);
                changed += 1;
            }
        });

        return changed;
    }

    extractCharacterSeedsFromSummary(summary, chapterNumber = 0, knownNames = []) {
        const text = String(summary || "");
        if (!text.trim()) {
            return [];
        }

        const sectionMatch = text.match(/【出场人物】\s*([\s\S]*?)(?=\n【|$)/);
        const section = sectionMatch?.[1] ? String(sectionMatch[1]).trim() : "";
        const seeds = [];
        const sectionKnownNames = [];

        if (section) {
            section.split(/\r?\n/).forEach((line) => {
                const rawLine = line.trim();
                if (!rawLine || (!rawLine.startsWith("-") && !rawLine.startsWith("•"))) {
                    return;
                }
                const cleaned = rawLine.replace(/^[•-]\s*/, "");
                const primaryMatch = cleaned.match(/^([\u4e00-\u9fa5]{2,4})/);
                const rawName = primaryMatch?.[1] || "";
                const name = this.resolveKnownCharacterName(rawName);
                if (this.isValidOutlineCharacterName(name)) {
                    sectionKnownNames.push(name);
                }
            });

            const mergedKnownNames = [...knownNames, ...sectionKnownNames];
            section.split(/\r?\n/).forEach((line) => {
                const rawLine = line.trim();
                if (!rawLine || (!rawLine.startsWith("-") && !rawLine.startsWith("•"))) {
                    return;
                }
                const cleaned = rawLine.replace(/^[•-]\s*/, "");
                if (!cleaned) {
                    return;
                }

                const primaryMatch = cleaned.match(/^([\u4e00-\u9fa5]{2,4})(?:[（(]([^）)]+)[）)])?/);
                const rawName = primaryMatch?.[1] || cleaned.split(/[（(：:]/)[0]?.trim() || "";
                const name = this.resolveKnownCharacterName(rawName);
                if (!this.isValidOutlineCharacterName(name)) {
                    return;
                }

                const desc = String(primaryMatch?.[2] || cleaned.replace(rawName, "").replace(/^[：:\s-]+/, "")).trim();
                const relationInfo = this.extractRelationshipInfoForSeed(name, desc, mergedKnownNames);
                seeds.push({
                    name,
                    identity: desc,
                    relationships: relationInfo.relationships,
                    relationPairs: relationInfo.relationPairs,
                    source: chapterNumber ? `第${chapterNumber}章出场人物` : "章纲出场人物"
                });
            });
        }

        return seeds;
    }

    syncCharactersFromOutlineSections(chapters = [], volumeNumber = 0) {
        let added = 0;
        let updated = 0;
        const appearanceTracker = this.novelData.character_appearance_tracker || {};
        appearanceTracker.relationships = appearanceTracker.relationships || {};
        this.novelData.character_appearance_tracker = appearanceTracker;

        (chapters || []).forEach((chapter) => {
            const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
            const directNames = Utils.ensureArrayFromText(chapter.characters)
                .map((name) => this.resolveKnownCharacterName(name))
                .filter((name) => this.isValidOutlineCharacterName(name))
                .map((name) => ({
                    name,
                    identity: "",
                    relationships: "",
                    relationPairs: [],
                    source: chapterNumber ? `第${chapterNumber}章章纲角色数组` : "章纲角色数组"
                }));
            const knownNames = [
                ...this.novelData.outline.characters.flatMap((item) => Array.from(this.getCharacterAliasSet(item))),
                ...directNames.map((item) => item.name)
            ];
            const sectionSeeds = this.extractCharacterSeedsFromSummary(chapter.summary || "", chapterNumber, knownNames);
            const seeds = [...directNames, ...sectionSeeds];

            seeds.forEach((seed) => {
                const existingIndex = this.findExistingCharacterIndexByAnyName(seed.name);
                if (existingIndex >= 0) {
                    const existing = this.novelData.outline.characters[existingIndex];
                    const nextCharacter = {
                        ...existing,
                        identity: existing.identity || seed.identity || "",
                        background: existing.background || `${seed.source}提及角色，后续可补充背景。`,
                        relationships: this.mergeRelationshipText(existing.relationships || "", seed.relationships || ""),
                        appearance: existing.appearance || ""
                    };
                    if (JSON.stringify(nextCharacter) !== JSON.stringify(existing)) {
                        this.novelData.outline.characters[existingIndex] = storage.normalizeCharacter(nextCharacter);
                        updated += 1;
                    }
                } else {
                    this.novelData.outline.characters.push(storage.normalizeCharacter({
                        id: Utils.uid("character"),
                        name: seed.name,
                        identity: seed.identity || "章纲出场角色",
                        background: `${seed.source}提及角色，后续可补充背景。`,
                        personality: "",
                        appearance: "",
                        abilities: "",
                        goals: "",
                        relationships: seed.relationships || ""
                    }));
                    added += 1;
                }

                this.recordOutlineRelationshipPairs(seed.relationPairs || [], chapterNumber);
            });
        });

        return { added, updated };
    }

    mergeGeneratedCharacters(characters) {
        let changed = 0;

        characters.forEach((character) => {
            const normalized = storage.normalizeCharacter({
                ...character,
                id: character.id || Utils.uid("character")
            });
            const existingIndex = this.findExistingCharacterIndexByAnyName(normalized);

            if (existingIndex >= 0) {
                const existing = this.novelData.outline.characters[existingIndex];
                const mergedAliases = Array.from(new Set([
                    ...Utils.ensureArrayFromText(existing.aliases || existing["别名"] || ""),
                    ...Utils.ensureArrayFromText(normalized.aliases || normalized["别名"] || "")
                ])).filter(Boolean);
                const mergedRelationships = this.mergeRelationshipText(
                    existing.relationships || existing["人物关系"] || "",
                    normalized.relationships || normalized["人物关系"] || ""
                );
                this.novelData.outline.characters[existingIndex] = storage.normalizeCharacter({
                    ...existing,
                    ...normalized,
                    relationships: mergedRelationships,
                    人物关系: mergedRelationships,
                    aliases: mergedAliases,
                    别名: mergedAliases.join("、")
                });
            } else {
                this.novelData.outline.characters.push(normalized);
            }
            changed += 1;
        });

        return changed;
    }

    saveCharacter() {
        const existingIndex = this.novelData.outline.characters.findIndex((item) => item.id === this.state.editingCharacterId);
        const existing = existingIndex >= 0 ? this.novelData.outline.characters[existingIndex] : {};
        const character = {
            ...existing,
            id: this.state.editingCharacterId || Utils.uid("character"),
            name: this.elements.characterName.value.trim(),
            identity: this.elements.characterIdentity.value.trim(),
            age: this.elements.characterAge.value.trim(),
            gender: this.elements.characterGender.value.trim(),
            abilities: this.elements.characterAbilities.value.trim(),
            goals: this.elements.characterGoals.value.trim(),
            personality: this.elements.characterPersonality.value.trim(),
            background: this.elements.characterBackground.value.trim(),
            appearance: this.elements.characterAppearance.value.trim(),
            relationships: this.elements.characterRelationships.value.trim(),
            性格特点: this.elements.characterPersonality.value.trim(),
            背景故事: this.elements.characterBackground.value.trim(),
            外貌描述: this.elements.characterAppearance.value.trim(),
            能力特长: this.elements.characterAbilities.value.trim(),
            目标动机: this.elements.characterGoals.value.trim(),
            人物关系: this.elements.characterRelationships.value.trim()
        };

        if (!character.name) {
            Utils.showMessage("人物姓名不能为空。", "error");
            return;
        }

        if (existingIndex >= 0) {
            this.novelData.outline.characters[existingIndex] = character;
        } else {
            this.novelData.outline.characters.push(character);
        }

        this.persist(true);
        this.renderCharacterList();
        this.renderDashboard();
        this.resetCharacterForm();
        Utils.showMessage("人物已保存。", "success");
    }

    editCharacter(characterId) {
        const character = this.novelData.outline.characters.find((item) => item.id === characterId);
        if (!character) {
            return;
        }

        this.state.editingCharacterId = character.id;
        this.elements.characterName.value = character.name || "";
        this.elements.characterIdentity.value = character.identity || "";
        this.elements.characterAge.value = character.age || "";
        this.elements.characterGender.value = character.gender || "";
        this.elements.characterAbilities.value = character.abilities || "";
        this.elements.characterGoals.value = character.goals || "";
        this.elements.characterPersonality.value = character.personality || "";
        this.elements.characterBackground.value = character.background || "";
        this.elements.characterAppearance.value = character.appearance || "";
        this.elements.characterRelationships.value = character.relationships || "";
        this.switchTab("characters");
    }

    deleteCharacter(characterId) {
        const character = this.novelData.outline.characters.find((item) => item.id === characterId);
        if (!character) {
            return;
        }

        const ok = window.confirm(`确定要删除人物「${character.name || "未命名"}」吗？`);
        if (!ok) {
            return;
        }

        this.novelData.outline.characters = this.novelData.outline.characters.filter((item) => item.id !== characterId);
        if (this.state.editingCharacterId === characterId) {
            this.resetCharacterForm();
        }
        this.persist(true);
        this.renderCharacterList();
        this.renderDashboard();
        Utils.showMessage("人物已删除。", "success");
    }

    resetCharacterForm() {
        this.state.editingCharacterId = null;
        this.elements.characterName.value = "";
        this.elements.characterIdentity.value = "";
        this.elements.characterAge.value = "";
        this.elements.characterGender.value = "";
        this.elements.characterAbilities.value = "";
        this.elements.characterGoals.value = "";
        this.elements.characterPersonality.value = "";
        this.elements.characterBackground.value = "";
        this.elements.characterAppearance.value = "";
        this.elements.characterRelationships.value = "";
    }

    getOutlineCharacterExcludedNames() {
        return new Set([
            "主角", "男主", "女主", "反派", "路人", "众人", "少年", "少女", "男人", "女人",
            "师尊", "掌门", "长老", "弟子", "同门", "敌人", "对手", "黑影", "来人", "医者",
            "龙神", "神胎", "审判官", "骑士", "圣骑士", "主教", "祭司", "侍女", "丫鬟", "婢女",
            "护卫", "下属", "手下", "师兄", "师姐", "师弟", "师妹", "师父", "师母", "父亲", "母亲",
            "哥哥", "姐姐", "妹妹", "弟弟", "同伴", "邻居", "室友", "同事", "上司", "老板", "老师", "学生"
        ]);
    }

    findExistingCharacterIndexByAnyName(candidate) {
        const targets = new Set();
        const addTarget = (value) => {
            const cleanValue = String(value || "").trim();
            if (!cleanValue) {
                return;
            }
            targets.add(cleanValue);
            const resolved = this.resolveKnownCharacterName(cleanValue);
            if (resolved) {
                targets.add(resolved);
            }
        };

        if (candidate && typeof candidate === "object") {
            addTarget(candidate.name);
            Utils.ensureArrayFromText(candidate.aliases || candidate["别名"] || "")
                .forEach((alias) => addTarget(alias));
        } else {
            addTarget(candidate);
        }

        if (!targets.size) {
            return -1;
        }

        return this.novelData.outline.characters.findIndex((item) => {
            const aliasSet = this.getCharacterAliasSet(item);
            return Array.from(targets).some((target) => aliasSet.has(target));
        });
    }

    normalizeCharacterReferenceLabel(name) {
        let normalized = String(name || "")
            .trim()
            .replace(/^[•\-]\s*/, "")
            .replace(/\s+/g, " ")
            .replace(/^(她的|他的|我的|你的|其|这个|那个|这位|那位)/, "")
            .replace(/[（(][^）)]*[）)]$/u, "")
            .trim();

        normalized = normalized.replace(/^(给|对|向|跟|和|把|被)(?=[\u4e00-\u9fa5]{2,8}$)/u, "");
        return normalized.trim();
    }

    applyOutlineMappingsToChapters(chapters = []) {
        (chapters || []).forEach((chapter) => {
            if (!chapter || typeof chapter !== "object") {
                return;
            }

            if (chapter.summary) {
                chapter.summary = this.generator.normalizeSynopsisReferenceText(this.novelData, chapter.summary);
            }

            if (chapter.characters) {
                const seen = new Set();
                chapter.characters = Utils.ensureArrayFromText(chapter.characters)
                    .map((name) => this.resolveKnownCharacterName(name))
                    .filter(Boolean)
                    .filter((name) => {
                        if (seen.has(name)) {
                            return false;
                        }
                        seen.add(name);
                        return true;
                    });
            }
        });
    }

    resolveKnownCharacterName(name) {
        const cleanName = this.normalizeCharacterReferenceLabel(name);
        if (!cleanName) {
            return "";
        }

        const synopsisData = this.novelData.synopsisData || this.novelData.synopsis_data || {};
        const mapping = synopsisData.vague_to_name_mapping || {};
        if (mapping[cleanName]) {
            return String(mapping[cleanName] || "").trim();
        }

        const fuzzyMapped = Object.entries(mapping)
            .sort((left, right) => right[0].length - left[0].length)
            .find(([alias]) => alias && cleanName.includes(alias));
        if (fuzzyMapped?.[1]) {
            return String(fuzzyMapped[1] || "").trim();
        }

        const roleAliases = {
            男主: ["男主", "男主角", "男主人公", "男一", "男一号", "男角"],
            女主: ["女主", "女主角", "女主人公", "女一", "女一号", "女角"],
            主角: ["主角", "主人公"],
            师尊: ["师尊"],
            反派: ["反派", "大反派", "反派boss"],
            男二: ["男二", "男二号"],
            女二: ["女二", "女二号"]
        };
        const matchedRole = Object.entries(roleAliases).find(([, aliases]) => aliases.includes(cleanName))?.[0];
        if (matchedRole && synopsisData.main_characters?.[matchedRole]) {
            return String(synopsisData.main_characters[matchedRole] || "").trim();
        }

        for (const [realName, info] of Object.entries(synopsisData.locked_character_names || {})) {
            const aliases = Utils.ensureArrayFromText(info?.aliases || []);
            if (realName === cleanName || aliases.includes(cleanName) || aliases.some((alias) => cleanName.includes(alias))) {
                return String(realName || "").trim();
            }
        }

        const matchedCharacter = this.novelData.outline.characters.find((item) => {
            const aliasSet = this.getCharacterAliasSet(item);
            return aliasSet.has(cleanName) || Array.from(aliasSet).some((alias) => cleanName.includes(alias));
        });
        if (matchedCharacter?.name) {
            return String(matchedCharacter.name || "").trim();
        }

        return cleanName;
    }

    getDefaultPromptTemplate() {
        return [
            "请根据以下内容生成小说章节正文。",
            "",
            "【小说标题】",
            "{{title}}",
            "",
            "【题材】",
            "{{genre}}",
            "",
            "【核心主题】",
            "{{theme}}",
            "",
            "【世界观】",
            "{{worldbuilding}}",
            "",
            "【相关角色设定】",
            "{{relevant_characters}}",
            "",
            "【当前章节】",
            "第{{chapter_number}}章 {{chapter_title}}",
            "",
            "【章节细纲】",
            "{{outline}}",
            "",
            "【前文参考】",
            "{{prev_content}}",
            "",
            "【下章预警（仅供边界控制，不可提前写）】",
            "{{next_outline}}",
            "",
            "【全局设定提醒】",
            "{{global_setting_note}}",
            "",
            "【本章设定提醒】",
            "{{chapter_setting_note}}",
            "",
            "要求：",
            "1. 严格沿用既有设定与名字，不得擅自改身份、改秘密、改关系。",
            "2. 结尾保留悬念，但不要提前写到下一章的核心事件。",
            "3. 保持移动端阅读友好的节奏，多用短段。",
            "4. 正文字数控制在 1200-1800 字左右。"
        ].join("\n");
    }

    getDesktopAlignedPromptTemplate() {
        return [
            "请根据以下内容生成小说章节正文。",
            "",
            "【小说标题】",
            "{{title}}",
            "",
            "【题材】",
            "{{genre}}",
            "",
            "【核心主题】",
            "{{theme}}",
            "",
            "【世界观】",
            "{{worldbuilding}}",
            "",
            "【相关角色设定】",
            "{{relevant_characters}}",
            "",
            "【当前章节】",
            "第{{chapter_number}}章 {{chapter_title}}",
            "",
            "【章节细纲】",
            "{{outline}}",
            "",
            "【前文参考】",
            "{{prev_content}}",
            "",
            "【下章预警（仅供边界控制，不可提前写）】",
            "{{next_outline}}",
            "",
            "【全局设定提醒】",
            "{{global_setting_note}}",
            "",
            "【本章设定提醒】",
            "{{chapter_setting_note}}",
            "",
            "要求：",
            "1. 严格沿用既有设定与名字，不得擅自改身份、改秘密、改关系。",
            "2. 正文必须严格执行本章细纲，可以扩写血肉，但不能偏离主线事件。",
            "3. 结尾要留下悬念，但不要提前写到下一章的核心事件。",
            "4. 保持移动端阅读友好的节奏，多用短段，多动作，多对白。",
            "5. 拒绝AI味，不要堆砌嘴角、眼神、瞳孔、喉结、指节等模板化微表情。",
            "6. 不要写空泛比喻、总结腔、文绉绉抒情，不要为了显得高级而故作深沉。",
            "7. 用短句，少副词，少万能形容词，优先让人物通过动作、反应、对白说话。",
            "8. 多用动作和对白推进，不要连续几段都在解释人物心理或总结局势。",
            "9. 正文字数建议 3000-6000 字，至少不要少于 2500 字；如果本章情节很多，要一次性充分展开。"
        ].join("\n");
    }

    loadDefaultPromptTemplate() {
        const prompt = this.getDesktopAlignedPromptTemplate();
        this.novelData.prompt_state.current_prompt = prompt;
        this.elements.currentPromptTemplateInput.value = prompt;
        this.persist(true);
        Utils.showMessage("已载入默认 Prompt 模板。", "success");
    }

    savePromptTemplate() {
        const name = this.elements.promptNameInput.value.trim();
        if (!name) {
            Utils.showMessage("请先填写模板名称。", "error");
            return;
        }

        const promptState = this.novelData.prompt_state;
        promptState.saved_prompts[name] = this.elements.currentPromptTemplateInput.value;
        promptState.selected_prompt = name;
        this.persist(true);
        this.renderPromptLibrary();
        this.elements.promptNameInput.value = "";
        Utils.showMessage(`已保存模板：${name}`, "success");
    }

    applySelectedPromptTemplate() {
        const name = this.elements.savedPromptSelect.value;
        const prompt = this.novelData.prompt_state.saved_prompts?.[name];
        if (!name || !prompt) {
            Utils.showMessage("请先选择一个模板。", "info");
            return;
        }
        this.novelData.prompt_state.selected_prompt = name;
        this.novelData.prompt_state.current_prompt = prompt;
        this.elements.currentPromptTemplateInput.value = prompt;
        this.persist(true);
        Utils.showMessage(`已载入模板：${name}`, "success");
    }

    deletePromptTemplate() {
        const name = this.elements.savedPromptSelect.value;
        if (!name) {
            Utils.showMessage("请先选择要删除的模板。", "info");
            return;
        }
        const ok = window.confirm(`确定要删除模板「${name}」吗？`);
        if (!ok) {
            return;
        }
        delete this.novelData.prompt_state.saved_prompts[name];
        if (this.novelData.prompt_state.selected_prompt === name) {
            this.novelData.prompt_state.selected_prompt = "";
        }
        this.persist(true);
        this.renderPromptLibrary();
        Utils.showMessage(`已删除模板：${name}`, "success");
    }

    getSystemEditorMappings() {
        return {
            outlineStoryState: { path: ["outline", "story_state"], fallback: {} },
            storyState: { path: ["story_state"], fallback: {} },
            nameLocker: { path: ["name_locker"], fallback: {} },
            foreshadowManager: { path: ["foreshadow_manager"], fallback: {} },
            secretMatrix: { path: ["secret_matrix"], fallback: {} },
            dynamicTracker: { path: ["dynamic_tracker"], fallback: {} },
            timelineTracker: { path: ["timeline_tracker"], fallback: {} },
            chapterSnapshot: { path: ["chapter_snapshot"], fallback: {} },
            foreshadowTracker: { path: ["foreshadow_tracker"], fallback: {} },
            personalityEnforcer: { path: ["personality_enforcer"], fallback: {} },
            characterChecker: { path: ["character_checker"], fallback: {} },
            appearanceTracker: { path: ["character_appearance_tracker"], fallback: {} },
            dialogueTracker: { path: ["dialogue_tracker"], fallback: {} },
            worldTracker: { path: ["world_tracker"], fallback: {} },
            worldStateManager: { path: ["world_state_manager"], fallback: {} },
            genreProgressTracker: { path: ["genre_progress_tracker"], fallback: {} },
            supportingCharacters: { path: ["supporting_characters"], fallback: {} },
            legacyForeshadows: { path: ["foreshadows"], fallback: [] },
            chapterRhythms: { path: ["chapter_rhythms"], fallback: {} },
            chapterEmotions: { path: ["chapter_emotions"], fallback: {} },
            stateSnapshots: { path: ["outline", "state_snapshots"], fallback: {} },
            synopsisData: { path: ["synopsis_data"], fallback: {} }
        };
    }

    saveSystemEditors() {
        try {
            const mappings = this.getSystemEditorMappings();
            Object.entries(mappings).forEach(([key, config]) => {
                const element = this.systemEditors[key];
                if (!element) {
                    return;
                }
                const parsed = JSON.parse(element.value || "{}");
                this.setByPath(this.novelData, config.path, parsed);
            });

            this.novelData.synopsisData = this.storage.normalizeSynopsisData(this.novelData.synopsis_data || this.novelData.synopsisData || {});
            this.syncCompatibilityFields();
            this.persist(true);
            this.renderAll();
            Utils.showMessage("系统 JSON 已保存。", "success");
        } catch (error) {
            Utils.showMessage(`系统 JSON 保存失败：${error.message}`, "error");
        }
    }

    readDataByPath(path) {
        const keys = Array.isArray(path) ? path : [path];
        let cursor = this.novelData;
        for (const key of keys) {
            if (cursor == null) {
                return undefined;
            }
            cursor = cursor[key];
        }
        return cursor;
    }

    setByPath(target, path, value) {
        const keys = Array.isArray(path) ? path : [path];
        let cursor = target;
        for (let index = 0; index < keys.length - 1; index += 1) {
            if (!cursor[keys[index]] || typeof cursor[keys[index]] !== "object") {
                cursor[keys[index]] = {};
            }
            cursor = cursor[keys[index]];
        }
        cursor[keys[keys.length - 1]] = value;
    }
}

let app = null;
document.addEventListener("DOMContentLoaded", () => {
    app = new NovelOutlineWebApp();
});
