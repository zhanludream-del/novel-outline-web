// 调试版app.js
console.log('[DEBUG] app.js 开始加载');

class NovelOutlineApp {
    constructor() {
        console.log('[DEBUG] NovelOutlineApp 构造函数开始');
        
        try {
            console.log('[DEBUG] 加载数据...');
            this.novelData = storage.load();
            console.log('[DEBUG] 数据加载成功:', this.novelData);
        } catch (error) {
            console.error('[ERROR] 数据加载失败:', error);
            this.novelData = DEFAULT_NOVEL_DATA;
        }
        
        try {
            console.log('[DEBUG] 创建API客户端...');
            this.api = new AIAPIClient();
            console.log('[DEBUG] API客户端创建成功');
        } catch (error) {
            console.error('[ERROR] API客户端创建失败:', error);
        }
        
        try {
            console.log('[DEBUG] 创建生成器...');
            this.generator = new NovelGenerator({
                api: this.api,
                showMessage: (msg, type) => {
                    console.log(`[MESSAGE-${type}] ${msg}`);
                    Utils.showMessage(msg, type);
                }
            });
            console.log('[DEBUG] 生成器创建成功');
        } catch (error) {
            console.error('[ERROR] 生成器创建失败:', error);
        }
        
        this.currentFile = null;
        
        console.log('[DEBUG] 调用init()...');
        this.init();
        console.log('[DEBUG] init()完成');
    }

    init() {
        console.log('[DEBUG] init() 开始');
        
        try {
            console.log('[DEBUG] 初始化题材选择器...');
            this.initGenreSelector();
            console.log('[DEBUG] 题材选择器初始化完成');
        } catch (error) {
            console.error('[ERROR] 题材选择器初始化失败:', error);
        }
        
        try {
            console.log('[DEBUG] 绑定事件...');
            this.bindEvents();
            console.log('[DEBUG] 事件绑定完成');
        } catch (error) {
            console.error('[ERROR] 事件绑定失败:', error);
        }
        
        try {
            console.log('[DEBUG] 加载设置...');
            this.loadSettings();
            console.log('[DEBUG] 设置加载完成');
        } catch (error) {
            console.error('[ERROR] 设置加载失败:', error);
        }
        
        try {
            console.log('[DEBUG] 加载当前数据...');
            this.loadCurrentData();
            console.log('[DEBUG] 当前数据加载完成');
        } catch (error) {
            console.error('[ERROR] 当前数据加载失败:', error);
        }
        
        console.log('[DEBUG] 初始化完成');
        Utils.log("晨曦微露AI创作软件 Web版初始化完成", "success");
    }

    initGenreSelector() {
        const genreSelect = document.getElementById('novelGenre');
        const subgenreSelect = document.getElementById('novelSubgenre');

        if (!genreSelect) {
            console.warn('[WARN] 未找到novelGenre元素');
            return;
        }

        console.log('[DEBUG] 填充题材选项...');
        
        // 填充主类型
        for (const genre in NOVEL_GENRES) {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreSelect.appendChild(option);
        }

        // 主类型变化时更新子类型
        genreSelect.addEventListener('change', () => {
            const genre = genreSelect.value;
            subgenreSelect.innerHTML = '<option value="">请选择子类型</option>';
            
            if (genre && NOVEL_GENRES[genre]) {
                NOVEL_GENRES[genre].subgenres.forEach(sub => {
                    const option = document.createElement('option');
                    option.value = sub;
                    option.textContent = sub;
                    subgenreSelect.appendChild(option);
                });
            }
        });
        
        console.log('[DEBUG] 题材选择器设置完成');
    }

    bindEvents() {
        console.log('[DEBUG] bindEvents() 开始');
        
        // 标签页切换
        console.log('[DEBUG] 绑定标签页切换事件...');
        const navItems = document.querySelectorAll('.nav-item');
        console.log(`[DEBUG] 找到 ${navItems.length} 个导航按钮`);
        
        navItems.forEach((item, index) => {
            console.log(`[DEBUG] 绑定按钮 ${index}: ${item.dataset.tab}`);
            item.addEventListener('click', (e) => {
                console.log(`[DEBUG] 点击了按钮: ${e.target.dataset.tab}`);
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        console.log('[DEBUG] 标签页切换事件绑定完成');

        // 菜单切换（移动端）
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // === 细纲生成器事件 ===
        this.bindSynopsisEvents();

        // === 大纲管理事件 ===
        this.bindOutlineEvents();

        // === 章节生成事件 ===
        this.bindChapterEvents();

        // === 人物管理事件 ===
        this.bindCharacterEvents();

        // === 通用按钮事件 ===
        document.getElementById('btnSettings')?.addEventListener('click', () => {
            this.showSettingsModal();
        });

        document.getElementById('btnSave')?.addEventListener('click', () => {
            this.saveData();
        });

        document.getElementById('btnExport')?.addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('btnImport')?.addEventListener('click', () => {
            this.importData();
        });
        
        console.log('[DEBUG] bindEvents() 完成');
    }

    switchTab(tabId) {
        console.log(`[DEBUG] switchTab(${tabId}) 开始`);
        
        // 切换标签页激活状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            console.log(`[DEBUG] 按钮已激活: ${tabId}`);
        } else {
            console.warn(`[WARN] 未找到按钮: ${tabId}`);
        }

        // 切换内容区
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(tabId);
        if (activeContent) {
            activeContent.classList.add('active');
            console.log(`[DEBUG] 内容区已激活: ${tabId}`);
        } else {
            console.warn(`[WARN] 未找到内容区: ${tabId}`);
        }

        // 特定标签页的初始化
        if (tabId === 'tab-chapter') {
            this.displayChapterList();
        } else if (tabId === 'tab-character') {
            this.displayCharacterList();
        }
        
        console.log(`[DEBUG] switchTab(${tabId}) 完成`);
    }

    // 简化版的其他方法
    bindSynopsisEvents() {
        console.log('[DEBUG] 绑定细纲生成器事件...');
        
        const btnWorld = document.getElementById('btnGenWorldbuilding');
        if (btnWorld) {
            btnWorld.addEventListener('click', () => {
                console.log('[DEBUG] 点击了生成世界观按钮');
                this.generateWorldbuilding();
            });
        }
        
        // 其他按钮绑定...
    }

    bindOutlineEvents() {
        console.log('[DEBUG] 绑定大纲管理事件...');
    }

    bindChapterEvents() {
        console.log('[DEBUG] 绑定章节生成事件...');
    }

    bindCharacterEvents() {
        console.log('[DEBUG] 绑定人物管理事件...');
    }

    loadSettings() {
        console.log('[DEBUG] 加载设置...');
    }

    loadCurrentData() {
        console.log('[DEBUG] 加载当前数据...');
    }

    displayChapterList() {
        console.log('[DEBUG] 显示章节列表...');
    }

    displayCharacterList() {
        console.log('[DEBUG] 显示角色列表...');
    }

    generateWorldbuilding() {
        console.log('[DEBUG] 生成世界观...');
        alert('生成世界观功能待实现');
    }

    saveData() {
        console.log('[DEBUG] 保存数据...');
    }

    exportData() {
        console.log('[DEBUG] 导出数据...');
    }

    importData() {
        console.log('[DEBUG] 导入数据...');
    }

    showSettingsModal() {
        console.log('[DEBUG] 显示设置弹窗...');
    }
}

console.log('[DEBUG] NovelOutlineApp 类定义完成');

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOMContentLoaded 事件触发');
    console.log('[DEBUG] 开始创建 NovelOutlineApp 实例...');
    
    try {
        app = new NovelOutlineApp();
        console.log('[DEBUG] NovelOutlineApp 实例创建成功');
        console.log('[DEBUG] app对象:', app);
    } catch (error) {
        console.error('[ERROR] NovelOutlineApp 实例创建失败:', error);
        console.error('[ERROR] 错误堆栈:', error.stack);
    }
});

console.log('[DEBUG] app.js 加载完成');
