(function() {
    // 1. 移动端检测
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) return;

    // 2. 创建样式
    const style = document.createElement('style');
    style.textContent = `
        #mobile-fullscreen-btn {
            position: fixed;
            top: 15px;
            left: 15px;
            z-index: 999999;
            width: 45px;
            height: 45px;
            background-color: rgba(0, 0, 0, 0.6);
            color: #fff;
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: transform 0.2s, background-color 0.2s;
            -webkit-tap-highlight-color: transparent;
        }
        #mobile-fullscreen-btn:active {
            transform: scale(0.9);
            background-color: rgba(0, 0, 0, 0.39);
        }
    `;
    document.head.appendChild(style);

    // 3. 创建按钮 (使用 ⛶ 表示进入全屏，❐ 表示退出全屏)
    const btn = document.createElement('div');
    btn.id = 'mobile-fullscreen-btn';
    btn.innerHTML = '⛶'; // 初始图标：进入全屏
    document.body.appendChild(btn);

    // 4. 全屏逻辑切换
    function toggleFullScreen() {
        if (!document.fullscreenElement &&    // 标准
            !document.webkitFullscreenElement && // iOS/Safari
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) { 
            
            // 进入全屏
            const docElm = document.documentElement;
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
            } else if (docElm.webkitRequestFullscreen) {
                docElm.webkitRequestFullscreen();
            } else if (docElm.mozRequestFullScreen) {
                docElm.mozRequestFullScreen();
            } else if (docElm.msRequestFullscreen) {
                docElm.msRequestFullscreen();
            }
        } else {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    // 5. 监听点击事件
    btn.addEventListener('click', toggleFullScreen);

    // 6. 监听全屏状态变化，自动切换图标
    const changeIcon = () => {
        const isFS = document.fullscreenElement || document.webkitFullscreenElement;
        btn.innerHTML = isFS ? '❐' : '⛶';
    };

    document.addEventListener('fullscreenchange', changeIcon);
    document.addEventListener('webkitfullscreenchange', changeIcon);
})();