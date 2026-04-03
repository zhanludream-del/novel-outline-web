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
            worldbuildingText: document.getElementById("worldbuildingText"),
            volumeSynopsisText: document.getElementById("volumeSynopsisText"),
            synopsisCurrentVolume: document.getElementById("synopsisCurrentVolume"),
            synopsisOutput: document.getElementById("synopsisOutput"),
            outlineVolumeList: document.getElementById("outlineVolumeList"),

            chapterVolumeSelect: document.getElementById("chapterVolumeSelect"),
            chapterEditorVolumeSelect: document.getElementById("chapterEditorVolumeSelect"),
            chapterStart: document.getElementById("chapterStart"),
            chapterEnd: document.getElementById("chapterEnd"),
            chapterBatchPreview: document.getElementById("chapterBatchPreview"),
            chapterBatchList: document.getElementById("chapterBatchList"),
            chapterList: document.getElementById("chapterList"),
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

            detailedOutlineInput: document.getElementById("detailedOutlineInput"),
            globalSettingNoteInput: document.getElementById("globalSettingNoteInput"),
            currentPromptTemplateInput: document.getElementById("currentPromptTemplateInput"),
            promptFrequencySelect: document.getElementById("promptFrequencySelect"),
            savedPromptSelect: document.getElementById("savedPromptSelect"),
            promptNameInput: document.getElementById("promptNameInput"),

            settingsModal: document.getElementById("settingsModal"),
            settingProvider: document.getElementById("settingProvider"),
            settingModel: document.getElementById("settingModel"),
            settingApiBase: document.getElementById("settingApiBase"),
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

            btnShowLog: document.getElementById("btnShowLog"),
            btnOpenSettings: document.getElementById("btnOpenSettings"),
            btnCloseSettings: document.getElementById("btnCloseSettings"),
            btnCancelSettings: document.getElementById("btnCancelSettings"),
            btnSaveSettings: document.getElementById("btnSaveSettings"),
            btnSaveData: document.getElementById("btnSaveData"),
            btnExportTxt: document.getElementById("btnExportTxt"),
            btnExportData: document.getElementById("btnExportData"),
            btnImportData: document.getElementById("btnImportData"),
            btnGenerateWorldbuilding: document.getElementById("btnGenerateWorldbuilding"),
            btnGenerateVolumes: document.getElementById("btnGenerateVolumes"),
            btnGenerateChapterSynopsis: document.getElementById("btnGenerateChapterSynopsis"),
            btnGenerateAllSynopsis: document.getElementById("btnGenerateAllSynopsis"),
            btnImportSynopsisToOutline: document.getElementById("btnImportSynopsisToOutline"),
            btnCopySynopsis: document.getElementById("btnCopySynopsis"),
            btnAddVolume: document.getElementById("btnAddVolume"),
            btnClearVolumes: document.getElementById("btnClearVolumes"),
            btnGenerateChapters: document.getElementById("btnGenerateChapters"),
            btnContinueChapters: document.getElementById("btnContinueChapters"),
            btnDetectGaps: document.getElementById("btnDetectGaps"),
            btnExpandChapterContent: document.getElementById("btnExpandChapterContent"),
            btnCopyChapterSummary: document.getElementById("btnCopyChapterSummary"),
            btnExportCurrentChapter: document.getElementById("btnExportCurrentChapter"),
            btnAnalyzeChapter: document.getElementById("btnAnalyzeChapter"),
            btnRunChapterQc: document.getElementById("btnRunChapterQc"),
            btnRefreshChapterList: document.getElementById("btnRefreshChapterList"),
            btnBatchDeleteChapters: document.getElementById("btnBatchDeleteChapters"),
            btnCopyChapter: document.getElementById("btnCopyChapter"),
            btnSaveChapter: document.getElementById("btnSaveChapter"),
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
        this.renderAppVersion();
        this.applyStoredGenreExtensions();
        this.populateGenreOptions();
        this.loadSettingsToForm();
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
        const buildVersion = "2026.04.03-b";
        const label = urlVersion ? `版本 ${urlVersion}` : `版本 ${buildVersion}`;

        this.elements.appVersionChip.textContent = label;
        this.elements.appVersionChip.title = urlVersion
            ? `当前打开的是带版本参数的页面：${urlVersion}`
            : `当前内置版本：${buildVersion}`;
    }

    ensureBaseData() {
        if (!Array.isArray(this.novelData.outline.volumes)) {
            this.novelData.outline.volumes = [];
        }
        if (!Array.isArray(this.novelData.outline.characters)) {
            this.novelData.outline.characters = [];
        }
        if (!this.novelData.prompt_state) {
            this.novelData.prompt_state = JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.prompt_state));
        }
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

        this.elements.outlineVolumeList.addEventListener("input", (event) => this.handleVolumeInput(event));
        this.elements.outlineVolumeList.addEventListener("click", (event) => this.handleVolumeActions(event));
        if (this.elements.chapterBatchList) {
            this.elements.chapterBatchList.addEventListener("click", (event) => this.handleChapterBatchListClick(event));
        }
        if (this.elements.chapterList) {
            this.elements.chapterList.addEventListener("click", (event) => this.handleChapterListClick(event));
        }
        this.elements.characterList.addEventListener("click", (event) => this.handleCharacterListClick(event));

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
        this.elements.importFileInput.addEventListener("change", (event) => this.importData(event));

        this.elements.btnGenerateWorldbuilding.addEventListener("click", () => this.safeAsync(() => this.generateWorldbuilding()));
        this.elements.btnGenerateVolumes.addEventListener("click", () => this.safeAsync(() => this.generateVolumeSynopsis()));
        this.elements.btnGenerateChapterSynopsis.addEventListener("click", () => this.safeAsync(() => this.generateCurrentVolumeSynopsis()));
        this.elements.btnGenerateAllSynopsis.addEventListener("click", () => this.safeAsync(() => this.generateAllVolumeSynopsis()));
        this.elements.btnImportSynopsisToOutline.addEventListener("click", () => this.importSynopsisToOutline());
        this.elements.btnCopySynopsis.addEventListener("click", () => Utils.copyText(this.elements.synopsisOutput.value));
        this.elements.btnAddVolume.addEventListener("click", () => this.addVolume());
        this.elements.btnClearVolumes.addEventListener("click", () => this.clearVolumes());

        this.elements.btnGenerateChapters.addEventListener("click", () => this.safeAsync(() => this.generateChapters()));
        this.elements.btnContinueChapters.addEventListener("click", () => this.safeAsync(() => this.continueChapters()));
        this.elements.btnDetectGaps.addEventListener("click", () => this.detectGaps());
        this.elements.btnExpandChapterContent.addEventListener("click", () => this.safeAsync(() => this.expandCurrentChapter()));
        this.elements.btnCopyChapterSummary.addEventListener("click", () => this.copyCurrentChapterSummary());
        this.elements.btnExportCurrentChapter.addEventListener("click", () => this.exportCurrentChapterTxt());
        this.elements.btnAnalyzeChapter.addEventListener("click", () => this.analyzeCurrentChapter());
        this.elements.btnRunChapterQc.addEventListener("click", () => this.runCurrentChapterQc());
        this.elements.btnRefreshChapterList.addEventListener("click", () => this.refreshChapterWorkspace());
        this.elements.btnBatchDeleteChapters.addEventListener("click", () => this.batchDeleteChapterRange());
        this.elements.btnCopyChapter.addEventListener("click", () => Utils.copyText(this.elements.chapterContentInput.value));
        this.elements.btnSaveChapter.addEventListener("click", () => this.saveChapterEditor());
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

            const raw = await this.api.callLLM(userPrompt, systemPrompt, {
                temperature: 0.35,
                maxTokens: 2200
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

    syncFormFromData() {
        const outline = this.novelData.outline;
        const synopsis = this.novelData.synopsisData || this.novelData.synopsis_data || {};

        this.elements.projectTitle.value = outline.title || "";
        this.elements.projectTheme.value = outline.theme || "";
        this.elements.projectGenre.value = outline.genre || this.novelData.genre || "";
        this.populateSubgenreOptions(outline.genre || this.novelData.genre || "");
        this.elements.projectSubgenre.value = outline.subgenre || this.novelData.subgenre || "";
        this.renderGenreGuide();
        this.elements.projectVolumeCount.value = synopsis.volumeCount || synopsis.vol_count || 5;
        this.elements.projectChaptersPerVolume.value = synopsis.chaptersPerVolume || synopsis.chap_count || 20;
        this.elements.projectConcept.value = outline.storyConcept || synopsis.story_concept || "";
        this.elements.worldbuildingText.value = outline.worldbuilding || synopsis.worldbuilding || "";
        this.elements.volumeSynopsisText.value = synopsis.volumeSynopsis || synopsis.volume_synopsis || "";
        this.elements.synopsisOutput.value = synopsis.synopsisOutput || synopsis.synopsis_output || "";
        this.elements.detailedOutlineInput.value = outline.detailed_outline || "";
        this.elements.globalSettingNoteInput.value = this.novelData.global_setting_note || "";
        if (!this.novelData.prompt_state.current_prompt) {
            this.novelData.prompt_state.current_prompt = this.getDefaultPromptTemplate();
        }
        this.elements.currentPromptTemplateInput.value = this.novelData.prompt_state.current_prompt || "";
        this.elements.promptFrequencySelect.value = this.novelData.prompt_state.chapter_frequency || "male";
        this.renderPromptLibrary();
    }

    loadSettingsToForm() {
        const settings = this.api.getConfig();
        this.elements.settingProvider.value = settings.provider || DEFAULT_API_CONFIG.provider;
        this.elements.settingModel.value = settings.model || DEFAULT_API_CONFIG.model;
        this.elements.settingApiBase.value = settings.apiBase || DEFAULT_API_CONFIG.apiBase;
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
        this.renderVolumeSelectors();
        this.renderVolumeCards();
        this.renderChapterList();
        this.renderChapterBatchPreview();
        this.switchChapterSubview(this.state.activeChapterSubview, true);
        this.renderCharacterList();
        this.renderAdvancedState();
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
        if (!volume || volume.chapters.length === 0) {
            const emptyHTML = '<div class="empty-state">当前卷还没有章节。可以先在“批量章纲”里跑四批生成，再切到“单章正文”逐章扩写。</div>';
            if (this.elements.chapterBatchList) {
                this.elements.chapterBatchList.innerHTML = emptyHTML;
            }
            if (this.elements.chapterList) {
                this.elements.chapterList.innerHTML = emptyHTML;
            }
            return;
        }

        const orderedChapters = [...volume.chapters].sort(Utils.chapterSort);
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
    }

    buildChapterBadgeHTML(chapter) {
        const badges = [];
        const chapterKey = `chapter_${Number(chapter.number || 0)}`;
        const snapshot = this.novelData.chapter_snapshot?.snapshots?.[chapterKey];
        const foreshadowCount = this.countForeshadowsForChapter(Number(chapter.number || 0));

        if ((chapter.content || "").trim()) {
            badges.push('<span class="tracker-pill success">正文</span>');
        }
        if (snapshot) {
            badges.push('<span class="tracker-pill">快照</span>');
        }
        if ((chapter.next_chapter_setup || "").trim()) {
            badges.push('<span class="tracker-pill">下章铺垫</span>');
        }
        if ((chapter.plot_unit || "").trim()) {
            badges.push('<span class="tracker-pill">剧情单元</span>');
        }
        if (foreshadowCount > 0) {
            badges.push(`<span class="tracker-pill warn">伏笔 ${foreshadowCount}</span>`);
        }

        return badges.join("") || '<span class="tracker-pill muted">待生成</span>';
    }

    renderCharacterList() {
        const characters = this.novelData.outline.characters || [];
        if (characters.length === 0) {
            this.elements.characterList.innerHTML = '<div class="empty-state">人物库还是空的。可以手动新增，也可以后面根据章节再补充。</div>';
            return;
        }

        this.elements.characterList.innerHTML = characters.map((character) => `
            <article class="character-card" data-character-id="${character.id}">
                <div class="character-card-head">
                    <div>
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
    }

    renderAdvancedState() {
        this.renderPromptLibrary();
        this.renderTrackerInsights();
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
        this.elements.currentPromptTemplateInput.value = promptState.current_prompt || this.getDefaultPromptTemplate();
    }

    renderTrackerInsights() {
        const snapshotEntries = Object.entries(this.novelData.chapter_snapshot?.snapshots || {})
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
                promptState.current_prompt = this.getDefaultPromptTemplate();
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
        navigator.serviceWorker.register("service-worker.js?v=20260403").then((registration) => {
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

    switchTab(tabName) {
        this.state.activeTab = tabName;
        this.elements.navItems.forEach((item) => {
            item.classList.toggle("active", item.dataset.tab === tabName);
        });
        this.elements.tabPanels.forEach((panel) => {
            panel.classList.toggle("active", panel.id === `tab-${tabName}`);
        });
        this.toggleSidebar(false);
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
        synopsis.vol_count = String(synopsis.volumeCount || synopsis.vol_count || 5);
        synopsis.chap_count = String(synopsis.chaptersPerVolume || synopsis.chap_count || 20);
        synopsis.volumeCount = Number(synopsis.volumeCount || synopsis.vol_count || 5);
        synopsis.chaptersPerVolume = Number(synopsis.chaptersPerVolume || synopsis.chap_count || 20);
        outline.total_chapters = Number(outline.total_chapters || (synopsis.volumeCount * synopsis.chaptersPerVolume) || 100);
        this.novelData.synopsisData = synopsis;
        this.novelData.synopsis_data = JSON.parse(JSON.stringify(synopsis));
        this.novelData.chapters = this.novelData.chapters || {};
        this.novelData.prompt_state = this.novelData.prompt_state || JSON.parse(JSON.stringify(DEFAULT_NOVEL_DATA.prompt_state));
        this.novelData.prompt_state.current_prompt = this.novelData.prompt_state.current_prompt || this.getDefaultPromptTemplate();
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
                if (chapter.content && chapter.uuid) {
                    this.novelData.chapters[chapter.uuid] = chapter.content;
                }
            });
        });

        this.syncGeneratedContexts();
    }

    syncGeneratedContexts() {
        const volumeSynopsisText = this.buildCombinedVolumeSynopsisText();
        const chapterSynopsisText = this.buildCombinedChapterSynopsisText();
        const outline = this.novelData.outline;
        const synopsis = this.novelData.synopsisData;

        this.novelData.generated_context.worldbuilding = outline.worldbuilding || "";

        if (volumeSynopsisText) {
            synopsis.volumeSynopsis = volumeSynopsisText;
            synopsis.volume_synopsis = volumeSynopsisText;
            this.novelData.generated_context.volume_synopsis = volumeSynopsisText;
        }

        if (chapterSynopsisText) {
            outline.user_context = chapterSynopsisText;
            this.novelData.generated_context.chapter_synopsis = chapterSynopsisText;
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

    exportChaptersTxt() {
        const baseName = this.novelData.outline.title || "novel-outline";
        const text = this.buildChaptersTxtExport();
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
        const text = this.buildSingleChapterTxtExport(chapter, volumeNumber);
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
        volume.chapters.forEach((chapter) => {
            const number = Number(chapter.number || 0);
            if (number >= start && number <= end) {
                deleteSet.add(chapter.id);
                if (chapter.uuid && this.novelData.chapters?.[chapter.uuid]) {
                    delete this.novelData.chapters[chapter.uuid];
                }
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
        if (this.state.selectedChapterId && deleteSet.has(this.state.selectedChapterId)) {
            this.state.selectedChapterId = null;
            this.clearChapterEditor();
        }

        this.persist(true);
        this.renderChapterList();
        this.renderDashboard();
        this.renderAdvancedState();
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
        this.novelData.synopsisData.volumeCount = 1;
        this.elements.projectVolumeCount.value = 1;
        this.state.selectedChapterId = null;
        this.clearChapterEditor();
        this.ensureVolumeCount(1, false);
        this.persist(true);
        this.renderAll();
        Utils.showMessage("卷结构已清空。", "success");
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
        await this.runWithLoading("正在生成卷纲...", async () => {
            const volumes = await this.generator.generateVolumeSynopsis({
                project: this.novelData,
                ...payload
            });
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

            const formatted = this.novelData.outline.volumes.map((volume, index) =>
                `【第${index + 1}卷】${volume.title}\n${volume.summary}\n卷尾钩子：${volume.cliffhanger || "暂无"}`
            ).join("\n\n");

            this.novelData.synopsisData.volumeSynopsis = formatted;
            this.elements.volumeSynopsisText.value = formatted;
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
                concept: [
                    preparedSynopsisInput.processedConcept || payload.concept,
                    preparedSynopsisInput.mappingHint,
                    preparedSynopsisInput.pendingHint
                ].filter(Boolean).join("\n\n"),
                volumeNumber,
                chapterCount: Number(this.elements.projectChaptersPerVolume.value || 20),
                volumeSummary: preparedSynopsisInput.processedVolumeSummary || volume.summary,
                existingSynopsis: preparedSynopsisInput.processedExistingSynopsis || volume.chapterSynopsis || ""
            });

            const formatted = chapters.map((chapter) =>
                `【第${chapter.chapter_number}章】${chapter.title}\n核心事件：${chapter.key_event}\n情绪曲线：${chapter.emotion_curve}\n细纲：${chapter.synopsis}`
            ).join("\n\n");

            const synopsisSyncResult = this.generator.mergeSynopsisStateFromGeneratedChapters(
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

    getCurrentChapterVolume() {
        const chapterVolumeNumber = Number(this.elements.chapterEditorVolumeSelect?.value || 0);
        const outlineVolumeNumber = Number(this.elements.chapterVolumeSelect?.value || 1);
        const volumeNumber = this.state.activeTab === "chapters" && chapterVolumeNumber
            ? chapterVolumeNumber
            : (outlineVolumeNumber || chapterVolumeNumber || 1);
        return this.novelData.outline.volumes[volumeNumber - 1];
    }

    splitRangeIntoBatches(startChapter, endChapter, batchCount = 4) {
        const total = Math.max(0, endChapter - startChapter + 1);
        if (!total) {
            return [];
        }

        const normalizedCount = Math.max(1, Math.min(batchCount, total));
        const baseSize = Math.floor(total / normalizedCount);
        const remainder = total % normalizedCount;
        const segments = [];
        let cursor = startChapter;

        for (let index = 0; index < normalizedCount; index += 1) {
            const size = baseSize + (index < remainder ? 1 : 0);
            const segmentStart = cursor;
            const segmentEnd = cursor + size - 1;
            segments.push({
                batchIndex: index + 1,
                totalBatches: normalizedCount,
                start: segmentStart,
                end: segmentEnd
            });
            cursor = segmentEnd + 1;
        }

        return segments;
    }

    renderChapterBatchPreview() {
        if (!this.elements.chapterBatchPreview || !this.elements.chapterStart || !this.elements.chapterEnd) {
            return;
        }

        const startChapter = Number(this.elements.chapterStart.value || 0);
        const endChapter = Number(this.elements.chapterEnd.value || 0);
        if (!startChapter || !endChapter || startChapter > endChapter) {
            this.elements.chapterBatchPreview.innerHTML = '<div class="empty-state compact">设置起止章后，这里会显示固定四批的生成拆分。</div>';
            return;
        }

        const segments = this.splitRangeIntoBatches(startChapter, endChapter, 4);
        this.elements.chapterBatchPreview.innerHTML = segments.map((segment) => `
            <article class="batch-preview-card">
                <span>第 ${segment.batchIndex}/${segment.totalBatches} 批</span>
                <strong>第 ${segment.start}-${segment.end} 章</strong>
            </article>
        `).join("");
    }

    async generateChapters() {
        const volume = this.getCurrentChapterVolume();
        const volumeNumber = Number(this.elements.chapterVolumeSelect.value || 1);
        const startChapter = Number(this.elements.chapterStart.value || 1);
        const endChapter = Number(this.elements.chapterEnd.value || 1);

        if (!volume) {
            throw new Error("当前卷不存在。");
        }
        if (startChapter > endChapter) {
            throw new Error("起始章不能大于结束章。");
        }

        await this.runWithLoading("正在批量生成章节大纲...", async () => {
            const targetNumbers = [];
            for (let number = startChapter; number <= endChapter; number += 1) {
                targetNumbers.push(number);
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

            const batchSegments = this.splitRangeIntoBatches(startChapter, endChapter, 4);
            const MAX_RETRIES_PER_BATCH = 3;
            const generatedAll = [];

            for (const batch of batchSegments) {
                const batchMissingNumbers = [];
                for (let number = batch.start; number <= batch.end; number += 1) {
                    if (!existingNumbers.has(number)) {
                        batchMissingNumbers.push(number);
                    }
                }

                if (!batchMissingNumbers.length) {
                    Utils.log(`第 ${batch.batchIndex}/${batch.totalBatches} 批（第 ${batch.start}-${batch.end} 章）已齐全，跳过。`, "info");
                    continue;
                }

                Utils.log(`第 ${batch.batchIndex}/${batch.totalBatches} 批：准备生成第 ${batch.start}-${batch.end} 章。`, "info");

                const gapSegments = this.findGapSegments(batchMissingNumbers);
                gapSegments.forEach(([segStart, segEnd]) => {
                    Utils.log(`第 ${batch.batchIndex} 批缺口：第 ${segStart}-${segEnd} 章`, "info");
                });

                for (const [segmentStart, segmentEnd] of gapSegments) {
                    let attempt = 0;
                    let success = false;

                    while (!success && attempt < MAX_RETRIES_PER_BATCH) {
                        attempt += 1;
                        Utils.log(`正在生成第 ${batch.batchIndex}/${batch.totalBatches} 批 · 第 ${segmentStart}-${segmentEnd} 章（尝试 ${attempt}/${MAX_RETRIES_PER_BATCH}）...`, "info");

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
                            volume.chapters.sort(Utils.chapterSort);
                            this.persist(true);
                            this.renderChapterList();
                            success = true;
                        } catch (error) {
                            Utils.log(`第 ${batch.batchIndex} 批 · 第 ${segmentStart}-${segmentEnd} 章生成失败：${error.message || error}`, "error");
                            if (attempt >= MAX_RETRIES_PER_BATCH) {
                                throw error;
                            }
                        }
                    }
                }
            }

            if (generatedAll.length) {
                await this.generateCharactersFromOutlines(generatedAll, volumeNumber, false);
            }

            this.persist(true);
            this.renderChapterList();
            Utils.showMessage(`已生成 ${generatedAll.length} 章章节大纲。`, "success");
            Utils.log(`第 ${volumeNumber} 卷新增 ${generatedAll.length} 章。`, "success");
        });
    }

    async continueChapters() {
        const volume = this.getCurrentChapterVolume();
        if (!volume) {
            throw new Error("当前卷不存在。");
        }

        const currentMax = volume.chapters.reduce((max, chapter) => Math.max(max, Number(chapter.number || 0)), 0);
        const continueRangeSize = 16;
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
    }

    clearChapterEditor() {
        this.elements.chapterEditorHeading.textContent = "未选择章节";
        this.elements.chapterNumberInput.value = "";
        this.elements.chapterTitleInput.value = "";
        this.elements.chapterSummaryInput.value = "";
        this.elements.chapterSettingNoteInput.value = "";
        this.elements.chapterContentInput.value = "";
        this.renderChapterContextPreview(null);
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
        const snapshot = this.novelData.chapter_snapshot?.snapshots?.[`chapter_${chapterNumber}`];
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
        if (!snapshot || typeof snapshot !== "object") {
            return "还没有章末快照。";
        }

        const lines = [
            snapshot["时间"] ? `时间：${snapshot["时间"]}` : "",
            snapshot["位置"] ? `位置：${snapshot["位置"]}` : "",
            snapshot.pending_plots ? `待推进：${snapshot.pending_plots}` : "",
            snapshot["下一章预期"] ? `预期：${snapshot["下一章预期"]}` : ""
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
            updatedAt: new Date().toISOString()
        };

        this.refreshChapterReports(chapter);
        this.upsertChapter(volume, chapter);
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

        volume.chapters = volume.chapters.filter((chapter) => chapter.id !== this.state.selectedChapterId);
        this.state.selectedChapterId = null;
        this.clearChapterEditor();
        this.persist(true);
        this.renderChapterList();
        Utils.showMessage("章节已删除。", "success");
    }

    async expandCurrentChapter() {
        const volume = this.getCurrentChapterVolume();
        if (!volume) {
            throw new Error("请先选择一个卷。");
        }

        const chapter = this.getChapterFromEditor() || volume.chapters.find((item) => item.id === this.state.selectedChapterId);
        if (!chapter || !chapter.number || !chapter.summary) {
            throw new Error("请先选中章节，并确保章节号与章纲已填写。");
        }

        await this.runWithLoading("正在扩写当前章节...", async () => {
            const rawContent = await this.generator.expandChapterContent({
                project: this.novelData,
                volume,
                chapter
            });
            const processed = this.processGeneratedChapterResponse(rawContent, volume, chapter);
            this.elements.chapterContentInput.value = processed.cleanedContent;
            this.saveChapterEditor();
            Utils.showMessage("章节正文草稿已生成。", "success");
            if (processed.logs.length) {
                processed.logs.forEach((message) => Utils.log(message, "success"));
            }
            Utils.log(`第 ${chapter.number} 章正文扩写完成。`, "success");
        });
    }

    processGeneratedChapterResponse(rawContent, volume, chapter) {
        const chapterNumber = Number(chapter.number || chapter.chapter_number || 0);
        const logs = [];
        const stateBlock = this.extractDelimitedBlock(rawContent, "<<<STATE_JSON>>>", [
            "<<<EXTRA_CHARACTERS>>>",
            "<<<FORESHADOWS>>>",
            "<<<PERSONALITY_CHANGE>>>",
            "<<<CHARACTER_APPEARANCE>>>",
            "<<<END_STATE>>>"
        ]);
        const extraCharactersBlock = this.extractDelimitedBlock(rawContent, "<<<EXTRA_CHARACTERS>>>", ["<<<END_EXTRA>>>"]);
        const foreshadowsBlock = this.extractDelimitedBlock(rawContent, "<<<FORESHADOWS>>>", ["<<<END_FORESHADOWS>>>"]);
        const personalityChangeBlock = this.extractDelimitedBlock(rawContent, "<<<PERSONALITY_CHANGE>>>", ["<<<END_PERSONALITY_CHANGE>>>"]);
        const appearanceBlock = this.extractDelimitedBlock(rawContent, "<<<CHARACTER_APPEARANCE>>>", ["<<<END_APPEARANCE>>>"]);

        const stateData = this.parseStateJsonBlock(stateBlock);
        if (stateData) {
            this.applyStateUpdate(chapterNumber, chapter.title || `第${chapterNumber}章`, stateData, chapter);
            logs.push("已回写状态 JSON 到故事状态/动态追踪/时间线/章末快照。");
        }

        const extrasCount = this.extractExtraCharacters(extraCharactersBlock);
        if (extrasCount.characters || extrasCount.subplots) {
            logs.push(`已记录 ${extrasCount.characters} 个龙套角色、${extrasCount.subplots} 条临时支线。`);
        }

        const foreshadowStats = this.extractForeshadowsFromBlock(chapterNumber, foreshadowsBlock);
        if (foreshadowStats.newCount || foreshadowStats.resolveCount) {
            logs.push(`已更新伏笔追踪：新埋 ${foreshadowStats.newCount}，回收 ${foreshadowStats.resolveCount}。`);
        }

        const personalityChanges = this.extractPersonalityChanges(chapterNumber, personalityChangeBlock);
        if (personalityChanges > 0) {
            logs.push(`已记录 ${personalityChanges} 条人物性格演变。`);
        }

        const appearanceStats = this.extractCharacterAppearances(chapterNumber, appearanceBlock);
        if (appearanceStats.appearances || appearanceStats.relationships) {
            logs.push(`已更新人物出场 ${appearanceStats.appearances} 条、关系 ${appearanceStats.relationships} 条。`);
        }

        const cleanedContent = this.stripGeneratedMarkers(rawContent).trim();
        this.recordChapterAnalysisTags(chapterNumber, chapter, cleanedContent, stateData || {});

        return {
            cleanedContent,
            logs
        };
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
        return cleaned.replace(/\n{3,}/g, "\n\n");
    }

    parseStateJsonBlock(block) {
        if (!block) {
            return null;
        }

        const parsed = Utils.parseJsonResponse(block);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    }

    applyStateUpdate(chapterNumber, chapterTitle, stateData, chapter = null) {
        const outlineState = this.novelData.outline.story_state || {};
        outlineState.timeline = stateData.timeline || outlineState.timeline || "";
        outlineState.current_location = stateData.current_location || outlineState.current_location || "";
        outlineState.important_items = stateData.important_items || outlineState.important_items || "";
        outlineState.pending_plots = stateData.pending_plots || outlineState.pending_plots || "";
        outlineState.characters = outlineState.characters || {};

        Object.entries(stateData.characters || {}).forEach(([name, state]) => {
            outlineState.characters[name] = {
                ...(outlineState.characters[name] || {}),
                ...state
            };
        });

        if (stateData.key_event) {
            outlineState.key_memories = Array.isArray(outlineState.key_memories) ? outlineState.key_memories : [];
            outlineState.key_memories.push({
                chapter: chapterNumber,
                event: stateData.key_event
            });
            outlineState.key_memories = outlineState.key_memories.slice(-30);
        }

        this.novelData.outline.story_state = outlineState;
        this.novelData.story_state.current_location = outlineState.current_location || "";
        this.novelData.story_state.current_time = outlineState.timeline || "";

        this.recordChapterSnapshot(chapterNumber, chapterTitle, stateData, chapter);
        this.recordTimelineUpdate(chapterNumber, stateData);
        this.recordDynamicStateUpdate(stateData);
        this.recordWorldTrackerUpdate(chapterNumber, stateData);
        this.recordCharacterCheckerState(chapterNumber, stateData);
        this.recordGenreProgressUpdate(chapterNumber, stateData);
        this.recordPendingSubplots(chapterNumber, stateData);
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
        this.novelData.outline.state_snapshots = JSON.parse(JSON.stringify(snapshots));
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
            tracker.locations[location] = {
                ...(tracker.locations[location] || {}),
                last_chapter: chapterNumber
            };
        });

        Utils.ensureArrayFromText(worldChanges.character_movements).forEach((movement) => {
            const [name, position] = movement.split(/->|→|：|:/).map((part) => part.trim());
            if (name && position) {
                tracker.character_positions[name] = position;
            }
        });

        Utils.ensureArrayFromText(worldChanges.offscreen_status).forEach((status) => {
            const [name, detail] = status.split(/：|:/).map((part) => part.trim());
            if (name) {
                tracker.offscreen_status[name] = detail || status;
            }
        });

        Utils.ensureArrayFromText(worldChanges.org_changes).forEach((change) => {
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
        const outlineCoverage = this.estimateOutlineCoverage(summary, content);
        const keywordSummary = this.extractContentKeywords(content, 6);
        const characters = this.collectChapterCharacters(chapterNumber, content);
        const sceneCount = Math.max(1, content.split(/\n{2,}/).filter((block) => block.trim()).length);
        const rhythm = this.novelData.chapter_rhythms?.[`第${chapterNumber}章`] || this.novelData.chapter_rhythms?.[`chapter_${chapterNumber}`] || "待判断";
        const emotion = this.novelData.chapter_emotions?.[`第${chapterNumber}章`] || this.novelData.chapter_emotions?.[`chapter_${chapterNumber}`] || "待判断";
        const snapshot = this.novelData.chapter_snapshot?.snapshots?.[`chapter_${chapterNumber}`] || {};
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
        const outlineCoverage = this.estimateOutlineCoverage(summary, content);
        const duplicateLines = this.detectRepeatedLines(content);
        const previousChapter = this.getAdjacentChapter(chapter.number, -1, this.getVolumeNumberForChapter(chapter));
        const nextChapter = this.getAdjacentChapter(chapter.number, 1, this.getVolumeNumberForChapter(chapter));

        if (content.length < 2000) {
            issues.push("字数偏少：当前正文低于 2000 字，容易显得情节过薄。");
        }
        if (outlineCoverage < 0.3 && summary) {
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
        lines.push(`参考章纲：${summary ? Utils.summarizeText(summary, 90) : "暂无章纲"}`);
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

    estimateOutlineCoverage(summary, content) {
        if (!summary || !content) {
            return 0;
        }
        const fragments = summary
            .split(/[。！？；\n]/)
            .map((item) => item.trim())
            .filter((item) => item.length >= 4 && item.length <= 30)
            .slice(0, 8);
        if (!fragments.length) {
            return 0;
        }
        const matched = fragments.filter((item) => {
            const keywords = this.extractContentKeywords(item, 3).split("、").filter(Boolean);
            return keywords.some((keyword) => content.includes(keyword));
        });
        return matched.length / fragments.length;
    }

    extractContentKeywords(text, limit = 5) {
        const matches = String(text || "").match(/[\u4e00-\u9fa5]{2,6}/g) || [];
        const stopwords = new Set(["当前", "这一章", "本章", "主角", "然后", "因为", "所以", "他们", "自己", "没有", "一个", "出来", "开始", "继续"]);
        const unique = [];
        matches.forEach((item) => {
            if (stopwords.has(item) || unique.includes(item)) {
                return;
            }
            unique.push(item);
        });
        return unique.slice(0, limit).join("、");
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
        const phrases = ["嘴角微扬", "不由得", "下一刻", "与此同时", "仿佛", "只见", "这一刻", "顿时"];
        return phrases.filter((phrase) => String(content || "").includes(phrase));
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

    extractCharacterAppearances(chapterNumber, block) {
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
                const [name, identity] = parts;
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
                const [left, right, relation] = parts;
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
        const outlineChapters = chapters || this.novelData.outline.volumes.flatMap((volume) => volume.chapters || []);
        if (!outlineChapters.length) {
            throw new Error("请先生成章纲，再批量生成人物设定。");
        }

        const task = async () => {
            const generatedCharacters = await this.generator.generateCharactersFromOutlines({
                project: this.novelData,
                chapters: outlineChapters,
                volumeNumber
            });

            if (!generatedCharacters.length) {
                Utils.showMessage("没有识别到需要生成人设的新角色。", "info");
                Utils.log("章纲中未提取到可生成人设的角色。", "info");
                return;
            }

            const added = this.mergeGeneratedCharacters(generatedCharacters);
            this.persist(true);
            this.renderCharacterList();
            this.renderDashboard();
            Utils.showMessage(`人物设定已补充 ${added} 个角色。`, "success");
            Utils.log(`按章纲分批生成人设完成，新增/更新 ${added} 个角色。`, "success");
        };

        if (useLoading) {
            await this.runWithLoading("正在按章纲分批生成人设...", task);
        } else {
            await task();
        }
    }

    mergeGeneratedCharacters(characters) {
        let changed = 0;

        characters.forEach((character) => {
            const normalized = storage.normalizeCharacter({
                ...character,
                id: character.id || Utils.uid("character")
            });
            const existingIndex = this.novelData.outline.characters.findIndex((item) => item.name === normalized.name);

            if (existingIndex >= 0) {
                this.novelData.outline.characters[existingIndex] = {
                    ...this.novelData.outline.characters[existingIndex],
                    ...normalized
                };
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

    loadDefaultPromptTemplate() {
        const prompt = this.getDefaultPromptTemplate();
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
