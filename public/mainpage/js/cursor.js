// ============================================
// 魔法光标系统 - 独立模块
// 使用方法：
// 1. 在HTML中引入 cursor.css 和 cursor.js
// 2. 调用 MagicCursor.init() 或直接使用（会自动初始化）
// ============================================

const MagicCursor = {
    cursor: {
        main: null,
        trail: null,
        wrapper: null
    },
    
    pos: { x: 0, y: 0 },
    prevPos: { x: 0, y: 0 },
    trailPos: { x: 0, y: 0 },
    
    // 粒子配置
    particleColors: ['#a78bfa', '#818cf8', '#f093fb', '#34d399', '#667eea', '#f5576c'],
    lastParticleTime: 0,
    particleInterval: 50,
    
    // 配置选项
    options: {
        enableParticles: true,
        darkMode: false
    },

    // 检测是否应启用魔法光标（在触摸设备上禁用）
    shouldEnable() {
        try {
            // 触摸支持或粗指针设备视为移动端/触摸设备
            const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
            const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            return !(isTouch || isCoarse);
        } catch (e) {
            return true;
        }
    },
    
    // 初始化
    init(options = {}) {
        // 合并配置
        this.options = { ...this.options, ...options };

        // 如果设备是触摸设备或粗指针设备，则不启用光标以免干扰移动端体验
        if (!this.shouldEnable()) {
            console.log('✨ 魔法光标已在触摸/移动设备上禁用');
            // 添加标记以便样式或其他脚本识别
            document.documentElement.classList.add('cursor-disabled-mobile');
            return;
        }

        // 创建光标DOM
        this.createCursorElements();

        // 获取DOM引用
        this.cursor.main = document.querySelector('.cursor-main');
        this.cursor.trail = document.querySelector('.cursor-trail');
        this.cursor.wrapper = document.querySelector('.cursor-wrapper');

        if (!this.cursor.main) {
            console.warn('⚠️ 光标元素创建失败');
            return;
        }

        // 添加启用标记
        document.body.classList.add('cursor-enabled');

        // 深色模式
        if (this.options.darkMode) {
            this.cursor.wrapper.classList.add('cursor-dark');
        }

        // 绑定事件
        this.bindEvents();

        // 启动动画
        this.animate();

        console.log('✨ 魔法光标已启用');
    },
    
    // 创建光标DOM元素
    createCursorElements() {
        // 检查是否已存在
        if (document.querySelector('.cursor-wrapper')) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'cursor-wrapper';
        wrapper.innerHTML = `
            <div class="cursor-main"></div>
            <div class="cursor-trail"></div>
        `;
        document.body.appendChild(wrapper);
    },
    
    // 绑定事件
    bindEvents() {
        // 鼠标移动
        document.addEventListener('mousemove', (e) => {
            this.prevPos.x = this.pos.x;
            this.prevPos.y = this.pos.y;
            this.pos.x = e.clientX;
            this.pos.y = e.clientY;
            
            // 主光标立即跟随
            this.cursor.main.style.left = this.pos.x + 'px';
            this.cursor.main.style.top = this.pos.y + 'px';
            
            // 生成粒子
            if (this.options.enableParticles) {
                this.maybeSpawnParticle();
            }
        });
        
        // 鼠标进入/离开窗口
        document.addEventListener('mouseenter', () => {
            this.cursor.wrapper?.classList.remove('cursor-hidden');
        });
        
        document.addEventListener('mouseleave', () => {
            this.cursor.wrapper?.classList.add('cursor-hidden');
        });
        
        // 点击效果
        document.addEventListener('mousedown', () => {
            this.cursor.wrapper?.classList.add('cursor-click');
            if (this.options.enableParticles) {
                this.burstParticles(8);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.cursor.wrapper?.classList.remove('cursor-click');
        });
        
        // 检测可点击元素
        const clickableSelector = 'a, button, [role="button"], input, select, textarea, label, .clickable';
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches(clickableSelector) || e.target.closest(clickableSelector)) {
                this.cursor.wrapper?.classList.add('cursor-hover');
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.matches(clickableSelector) || e.target.closest(clickableSelector)) {
                this.cursor.wrapper?.classList.remove('cursor-hover');
            }
        });
    },
    
    // 根据移动速度生成粒子
    maybeSpawnParticle() {
        const now = Date.now();
        const dx = this.pos.x - this.prevPos.x;
        const dy = this.pos.y - this.prevPos.y;
        const speed = Math.sqrt(dx * dx + dy * dy);
        
        const interval = Math.max(20, this.particleInterval - speed * 2);
        
        if (now - this.lastParticleTime > interval && speed > 2) {
            this.spawnParticle(this.pos.x, this.pos.y);
            this.lastParticleTime = now;
        }
    },
    
    // 生成单个粒子
    spawnParticle(x, y, size = null) {
        const particle = document.createElement('div');
        particle.className = 'cursor-particle';
        
        const color = this.particleColors[Math.floor(Math.random() * this.particleColors.length)];
        const particleSize = size || (4 + Math.random() * 4);
        
        particle.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: ${particleSize}px;
            height: ${particleSize}px;
            background: ${color};
            box-shadow: 0 0 ${particleSize}px ${color};
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    },
    
    // 点击时爆发粒子
    burstParticles(count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const distance = 10 + Math.random() * 20;
            const x = this.pos.x + Math.cos(angle) * distance;
            const y = this.pos.y + Math.sin(angle) * distance;
            
            setTimeout(() => {
                this.spawnParticle(x, y, 3 + Math.random() * 5);
            }, i * 20);
        }
    },
    
    // 动画循环
    animate() {
        const trailSpeed = 0.12;
        
        this.trailPos.x += (this.pos.x - this.trailPos.x) * trailSpeed;
        this.trailPos.y += (this.pos.y - this.trailPos.y) * trailSpeed;
        
        if (this.cursor.trail) {
            this.cursor.trail.style.left = this.trailPos.x + 'px';
            this.cursor.trail.style.top = this.trailPos.y + 'px';
        }
        
        requestAnimationFrame(() => this.animate());
    },
    
    // 切换深色模式
    setDarkMode(enabled) {
        this.options.darkMode = enabled;
        if (enabled) {
            this.cursor.wrapper?.classList.add('cursor-dark');
        } else {
            this.cursor.wrapper?.classList.remove('cursor-dark');
        }
    },
    
    // 切换粒子效果
    setParticles(enabled) {
        this.options.enableParticles = enabled;
    },
    
    // 销毁
    destroy() {
        document.body.classList.remove('cursor-enabled');
        this.cursor.wrapper?.remove();
    }
};

// 自动初始化（页面加载完成后）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (MagicCursor.shouldEnable()) MagicCursor.init();
        else console.log('✨ 魔法光标在移动/触摸设备上已自动禁用');
    });
} else {
    if (MagicCursor.shouldEnable()) MagicCursor.init();
    else console.log('✨ 魔法光标在移动/触摸设备上已自动禁用');
}

// 导出到全局
window.MagicCursor = MagicCursor;
