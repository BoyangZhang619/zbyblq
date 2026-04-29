console.log("关于这网站的名字--zbyblq\n其中zby是我的名字拼音首字母\n而blq则有所不同,他其实是数字619的象形字,我最早用619这个数字在我的互联网账号的时间其实是在小学快初中的时候,那时候为了玩minecraft bedrock版,而为了进服务器和联机我创了一个xbox账号,而当时我看很多玩家后面都带个数字,我就想了想用什么数字好,最后就选了619,这个数字甚至还是旋转对称的,我的minecraft名是zhangby619,后来我的游戏账号名,互联网账号都是直接用这个或者后缀,至于网站为什么是zby+blq呢,zby而不是zhangby是因为我要域名名称短一点,而blq而不是619也是因为我觉得数字不太好看,而且blq是619的象形字,所以就这样了\n很多人看到我用619会觉得这是我的生日或者啥我喜欢的人的生日之类的(想象力很厉害了),不过的确很少见把一个没有象征意义的数字用在自身的人,哈哈\n2026-2-9/18:23:12.619");
// ============================================
// 【主页导航系统】
// ============================================

const NavSystem = {
    // 配置路径
    paths: {
        navItems: './mainpage/data/navItems.json',
        theme: './mainpage/data/theme.json'
    },

    // 缓存数据
    data: {
        navItems: null,
        theme: null,
        settings: null
    },

    // ✅ 新增：状态管理
    state: {
        activeTag: 'ALL',     // 当前筛选标签：ALL 表示全部
        tags: [],             // 所有可用标签
        tagCounts: {}         // 各标签对应数量
    },

    // 初始化
    async init() {
        try {
            // 并行加载数据
            await Promise.all([
                this.loadTheme(),
                this.loadNavItems()
            ]);

            // 应用主题
            this.applyTheme();

            // ✅ 新增：初始化 Tag（从数据里提取 + 读 URL）
            this.buildTagsFromNavItems();
            this.initTagFromURL();
            this.renderTagFilter();

            // 渲染导航项（会应用筛选）
            this.renderNavItems();

            console.log('✅ 导航系统初始化完成');
        } catch (error) {
            console.error('❌ 初始化失败:', error);
            this.showError('加载失败，请刷新页面重试');
        }
    },

    // 加载主题配置
    async loadTheme() {
        try {
            const response = await fetch(this.paths.theme);
            if (!response.ok) throw new Error('主题配置加载失败');
            this.data.theme = await response.json();
        } catch (error) {
            console.warn('⚠️ 主题配置加载失败，使用默认主题');
            this.data.theme = null;
        }
    },

    // 加载导航项数据
    async loadNavItems() {
        try {
            const response = await fetch('mainpage/data/navItems.json');
            if (!response.ok) throw new Error('导航数据加载失败');
            const data = await response.json();
            this.data.navItems = data.items || [];
            this.data.IP = data.IP || 'Unknown';
            this.data.auth = data.auth || 'guest';
            this.data.settings = data.settings || {};
            document.querySelector('.footer p').textContent = `© 2025-${new Date().getFullYear()} zby | Powered by JavaScript | Your IP: ${this.data.IP} | Auth: ${'guest' || this.data.auth}`;
            // console.log('hello?');
            // console.log('🔍 导航项数据加载成功:', this.data.navItems.length, '项');
            // console.log('🔍 用户信息及数据访问权限:', this.data.IP, this.data.auth);
        } catch (error) {
            console.error('❌ 导航项数据加载失败:', error);
            this.data.navItems = [];
            this.data.settings = {};
        }
    },

    // 应用主题到CSS变量
    applyTheme() {
        if (!this.data.theme) return;

        const root = document.documentElement;
        const { theme, typography, layout } = this.data.theme;

        // 应用主题色
        if (theme) {
            this.setCSSVar(root, '--primary-color', theme.primaryColor);
            this.setCSSVar(root, '--bg-color', theme.bgColor);
            this.setCSSVar(root, '--card-bg', theme.cardBg);
            this.setCSSVar(root, '--card-hover-bg', theme.cardHoverBg);
            this.setCSSVar(root, '--border-color', theme.borderColor);
            this.setCSSVar(root, '--text-color', theme.textColor);
            this.setCSSVar(root, '--text-secondary', theme.textSecondary);
            this.setCSSVar(root, '--accent-color', theme.accentColor);
            this.setCSSVar(root, '--shadow', theme.shadow);
            this.setCSSVar(root, '--shadow-hover', theme.shadowHover);
            this.setCSSVar(root, '--transition-duration', theme.transitionDuration);
            this.setCSSVar(root, '--border-radius', theme.borderRadius);
        }

        // 应用字体设置
        if (typography) {
            this.setCSSVar(root, '--font-family', typography.fontFamily);
            this.setCSSVar(root, '--header-size', typography.headerSize);
            this.setCSSVar(root, '--header-size-mobile', typography.headerSizeMobile);
            this.setCSSVar(root, '--title-size', typography.titleSize);
            this.setCSSVar(root, '--desc-size', typography.descSize);
            this.setCSSVar(root, '--tag-size', typography.tagSize);
            this.setCSSVar(root, '--badge-size', typography.badgeSize);
        }

        // 应用布局设置
        if (layout) {
            this.setCSSVar(root, '--container-max-width', layout.containerMaxWidth);
            this.setCSSVar(root, '--container-padding', layout.containerPadding);
            this.setCSSVar(root, '--container-padding-mobile', layout.containerPaddingMobile);
            this.setCSSVar(root, '--card-padding', layout.cardPadding);
            this.setCSSVar(root, '--card-padding-mobile', layout.cardPaddingMobile);
            this.setCSSVar(root, '--card-gap', layout.cardGap);
            this.setCSSVar(root, '--icon-size', layout.iconSize);
            this.setCSSVar(root, '--icon-size-mobile', layout.iconSizeMobile);
        }
    },

    // 设置CSS变量
    setCSSVar(element, property, value) {
        if (value !== undefined && value !== null) {
            element.style.setProperty(property, value);
        }
    },

    // ============================================
    // ✅ Tag 筛选（方案一）
    // ============================================

    // 从 navItems 里提取 tags，并统计数量
    buildTagsFromNavItems() {
        const items = this.data.navItems || [];
        const tagCounts = {};

        items.forEach(item => {
            const tags = Array.isArray(item.tags) ? item.tags : [];
            tags.forEach(t => {
                const tag = String(t).trim();
                if (!tag) return;
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        // 稳定排序：数量多的在前，其次按字面排序
        const tags = Object.keys(tagCounts).sort((a, b) => {
            const diff = (tagCounts[b] || 0) - (tagCounts[a] || 0);
            if (diff !== 0) return diff;
            return a.localeCompare(b, 'zh-Hans-CN');
        });

        this.state.tags = tags;
        this.state.tagCounts = tagCounts;
    },

    // 从 URL 读取 ?tag=
    initTagFromURL() {
        try {
            const params = new URLSearchParams(window.location.search);
            const tag = params.get('tag');
            if (tag && this.state.tagCounts[tag]) {
                this.state.activeTag = tag;
            } else {
                this.state.activeTag = 'ALL';
            }
        } catch (e) {
            this.state.activeTag = 'ALL';
        }
    },

    // 更新 URL（便于分享）
    syncURLWithTag() {
        try {
            const url = new URL(window.location.href);
            if (this.state.activeTag === 'ALL') {
                url.searchParams.delete('tag');
            } else {
                url.searchParams.set('tag', this.state.activeTag);
            }
            window.history.replaceState({}, '', url.toString());
        } catch (e) {}
    },

    // 渲染顶部筛选条
    renderTagFilter() {
        const wrap = document.getElementById('tagFilter');
        if (!wrap) return;

        // 没有任何 tag，就隐藏过滤条（不打扰）
        if (!this.state.tags || this.state.tags.length === 0) {
            wrap.innerHTML = '';
            wrap.style.display = 'none';
            return;
        }

        wrap.style.display = 'flex';

        const totalCount = (this.data.navItems || []).length;

        const chips = [];

        // 全部
        chips.push(this.createTagChip('ALL', '全部', totalCount));

        // 动态标签
        this.state.tags.forEach(tag => {
            chips.push(this.createTagChip(tag, tag, this.state.tagCounts[tag] || 0));
        });

        wrap.innerHTML = '';
        chips.forEach(chip => wrap.appendChild(chip));

        // 初次渲染后，把当前激活的 chip 滚动到可见区域
        const active = wrap.querySelector('.tag-chip.active');
        if (active && active.scrollIntoView) {
            active.scrollIntoView({ inline: 'center', block: 'nearest' });
        }
    },

    // 创建 chip DOM
    createTagChip(tagValue, label, count) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tag-chip' + (this.state.activeTag === tagValue ? ' active' : '');
        btn.dataset.tag = tagValue;
        btn.setAttribute('aria-pressed', this.state.activeTag === tagValue ? 'true' : 'false');

        btn.innerHTML = `
            <span class="tag-label">${label}</span>
            <span class="tag-count">${count}</span>
        `.trim();

        btn.addEventListener('click', () => {
            if (this.state.activeTag === tagValue) return;

            this.state.activeTag = tagValue;
            this.syncURLWithTag();

            // 更新 active 样式
            const wrap = document.getElementById('tagFilter');
            if (wrap) {
                wrap.querySelectorAll('.tag-chip').forEach(el => {
                    const isActive = el.dataset.tag === tagValue;
                    el.classList.toggle('active', isActive);
                    el.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                });
            }

            // 重新渲染列表
            this.renderNavItems();
        });

        return btn;
    },

    // ============================================
    // 渲染导航项（✅ 支持 Tag 过滤）
    // ============================================

    renderNavItems() {
        const navList = document.getElementById('navList');
        if (!navList) return;

        // 清空加载提示
        navList.innerHTML = '';

        const items = [...(this.data.navItems || [])];

        // ✅ 先过滤
        const filtered = this.state.activeTag === 'ALL'
            ? items
            : items.filter(it => Array.isArray(it.tags) && it.tags.includes(this.state.activeTag));

        // 排序：active 在前，inactive 在后（在过滤结果中保持你的规则）
        const sortedItems = filtered.sort((a, b) => {
            const aActive = a.status !== 'inactive' ? 0 : 1;
            const bActive = b.status !== 'inactive' ? 0 : 1;
            return aActive - bActive;
        });

        if (sortedItems.length === 0) {
            navList.innerHTML = `
                <div class="nav-empty">
                    <div style="font-size:1.1rem; margin-bottom:6px;">这里还没有内容</div>
                    <div>试试切换到「全部」或换一个标签看看 👀</div>
                </div>
            `;
            return;
        }

        // 渲染每个导航项
        sortedItems.forEach(item => {
            const navItem = this.createNavItem(item);
            navList.appendChild(navItem);
        });
    },

    // 创建单个导航项DOM
    createNavItem(item) {
        const {
            id = '',
            href = '#',
            icon = '📄',
            title = '未命名',
            desc = '',
            tags = [],
            badge = '',
            badgeColor = '',
            status = 'active',
            updateTime = '',
            banMsg = '该功能暂不可用'
        } = item;

        const settings = this.data.settings;
        
        // 外层容器改为 div，不再是 a 标签
        const navItem = document.createElement('div');
        navItem.className = 'nav-item';
        navItem.dataset.id = id;
        navItem.dataset.status = status;
        navItem.dataset.href = status === 'inactive' ? '' : href;

        // 点击展开/收起逻辑
        navItem.addEventListener('click', (e) => {
            // 如果点击的是进入按钮，不处理展开逻辑
            if (e.target.closest('.nav-enter-btn')) return;
            
            // 禁用状态点击弹窗
            if (status === 'inactive') {
                alert(banMsg || '该功能暂不可用');
                return;
            }
            
            // 切换展开状态
            const isExpanded = navItem.classList.contains('expanded');
            
            // 收起其他已展开的卡片
            document.querySelectorAll('.nav-item.expanded').forEach(el => {
                if (el !== navItem) el.classList.remove('expanded');
            });
            
            navItem.classList.toggle('expanded', !isExpanded);
        });

        // 构建标签HTML
        let tagsHtml = '';
        if (settings.showTags && tags.length > 0) {
            const displayTags = tags.slice(0, settings.maxTagsDisplay || 3);
            tagsHtml = `
                <div class="nav-tags">
                    ${displayTags.map(tag => `<span class="nav-tag">${tag}</span>`).join('')}
                </div>
            `;
        }

        // 构建徽章HTML
        let badgeHtml = '';
        if (settings.showBadge && badge) {
            const badgeClass = this.getBadgeClass(badge);
            const style = badgeColor ? `background:${this.resolveBadgeColor(badgeColor)};` : '';
            badgeHtml = `<span class="nav-badge ${badgeClass}" style="${style}">${badge}</span>`;
        }

        // 构建元信息HTML
        let metaHtml = '';
        if (settings.showUpdateTime && updateTime) {
            metaHtml = `
                <div class="nav-meta">
                    <span class="nav-meta-item">
                        <span>🕐</span>
                        <span>更新于 ${updateTime}</span>
                    </span>
                </div>
            `;
        }

        // 构建进入按钮（仅 active 状态显示）
        let enterBtnHtml = '';
        if (status !== 'inactive') {
            enterBtnHtml = `<a class="nav-enter-btn" href="${href}">进入 →</a>`;
        }

        navItem.innerHTML = `
            <div class="nav-icon">${icon}</div>
            <div class="nav-content">
                <div class="nav-header">
                    <span class="nav-title">${title}</span>
                    ${badgeHtml}
                </div>
                <div class="nav-desc">${desc}</div>
                ${tagsHtml}
                ${metaHtml}
                ${enterBtnHtml}
            </div>
        `;

        return navItem;
    },

    // 解析徽章颜色
    resolveBadgeColor(color) {
        if (!color) return '';
        if (color.startsWith('#') && (color.length === 7 || color.length === 4)) return color;
        // 单字母缩写
        const map = {
            G: '#52c41a', // green
            R: '#ff4d4f', // red
            B: '#1890ff', // blue
            Y: '#faad14', // yellow
            O: '#fa541c', // orange
            P: '#722ed1', // purple
            A: 'var(--accent-color)'
        };
        return map[color.toUpperCase()] || color;
    },

    // 获取徽章样式类
    getBadgeClass(badge) {
        const badgeMap = {
            '新': 'new',
            'NEW': 'new',
            '热': 'hot',
            'HOT': 'hot',
            '更新': 'update',
            'UPDATE': 'update'
        };
        return badgeMap[badge.toUpperCase()] || '';
    },

    // 显示错误信息
    showError(message) {
        const navList = document.getElementById('navList');
        if (navList) {
            navList.innerHTML = `<div class="loading" style="color: #ff4d4f;">${message}</div>`;
        }
    },

    // ============================================
    // 【公共API接口】
    // ============================================

    // 动态添加导航项（✅ 同步 tag 数据）
    addNavItem(config) {
        this.data.navItems.push(config);

        // 更新 tag 列表与筛选条
        this.buildTagsFromNavItems();
        this.renderTagFilter();

        // 重新渲染（确保过滤正确）
        this.renderNavItems();
    },

    // 更新主题
    updateTheme(themeConfig) {
        this.data.theme = { ...this.data.theme, ...themeConfig };
        this.applyTheme();
    },

    // 更新单个CSS变量
    setThemeVar(property, value) {
        document.documentElement.style.setProperty(property, value);
    },

    // 获取当前主题配置
    getTheme() {
        return this.data.theme;
    },

    // 获取导航项数据
    getNavItems() {
        return this.data.navItems;
    }
};

// ============================================
// 深色/浅色主题切换系统
// ============================================
const ThemeToggle = {
    STORAGE_KEY: 'theme-mode',

    init() {
        console.log('🔍 [ThemeToggle] 开始初始化...');

        this.btn = document.getElementById('themeToggle');
        console.log('🔍 [ThemeToggle] 按钮元素:', this.btn);

        if (!this.btn) {
            console.error('❌ [ThemeToggle] 找不到 #themeToggle 按钮!');
            return;
        }

        // 读取保存的主题或跟随系统
        this.loadSavedTheme();

        // 绑定点击事件
        this.btn.addEventListener('click', () => {
            console.log('🔍 [ThemeToggle] 按钮被点击');
            this.toggle();
        });

        // 监听系统主题变化
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });

        console.log('🎨 主题切换系统初始化完成');
    },

    loadSavedTheme() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        console.log('🔍 [ThemeToggle] localStorage 保存的主题:', saved);

        if (saved) {
            // this.setTheme(saved, false);
            this.setTheme('dark', false);
        } else {
            // // 跟随系统主题
            // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            // console.log('🔍 [ThemeToggle] 系统偏好深色模式:', prefersDark);
            // this.setTheme(prefersDark ? 'dark' : 'light', false);
            this.setTheme('dark', false);
        }
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        // const next = current === 'dark' ? 'light' : 'dark';
        const next = 'dark';
        console.log('🔍 [ThemeToggle] 切换主题:', current, '->', next);
        this.setTheme(next, true);
    },

    setTheme(theme, save = true) {
        console.log('🔍 [ThemeToggle] setTheme 被调用, theme =', theme);

        document.documentElement.setAttribute('data-theme', theme);

        // 验证是否设置成功
        const actualTheme = document.documentElement.getAttribute('data-theme');
        console.log('🔍 [ThemeToggle] 实际设置的 data-theme:', actualTheme);

        // 检查 CSS 变量是否生效
        const bgColor = getComputedStyle(document.body).backgroundColor;
        console.log('🔍 [ThemeToggle] 当前 body 背景色:', bgColor);

        const cssVarBgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-color');
        console.log('🔍 [ThemeToggle] CSS 变量 --bg-color:', cssVarBgColor);

        // 保存到本地存储
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, theme);
        }
    },

    // 获取当前主题
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    },

    // 判断是否深色模式
    isDark() {
        return this.getTheme() === 'dark';
    }
};

// ============================================
// 页面加载完成后初始化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    NavSystem.init();
    ThemeToggle.init();
});

// 导出到全局，方便外部调用
window.NavSystem = NavSystem;
window.ThemeToggle = ThemeToggle;
