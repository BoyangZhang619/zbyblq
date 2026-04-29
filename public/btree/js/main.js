// ============================================
// 二叉树可视化工具
// ============================================

// DOM 元素
const treeInput = document.getElementById('treeInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');
const treeContainer = document.getElementById('treeContainer');
const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

// 信息面板
const nodeCountEl = document.getElementById('nodeCount');
const treeHeightEl = document.getElementById('treeHeight');
const leafCountEl = document.getElementById('leafCount');

// 配置
const config = {
    nodeRadius: 24,
    levelHeight: 80,
    minNodeSpacing: 55,
    fontSize: 14,
    lineWidth: 2.5,
    padding: 50,
    colors: {
        nodeGradient: ['#6366f1', '#8b5cf6'],
        nodeShadow: 'rgba(99, 102, 241, 0.4)',
        text: '#ffffff',
        line: '#64748b',
        nullNode: '#475569'
    }
};

// ============================================
// 二叉树节点类
// ============================================
class TreeNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
        // 用于可视化
        this.x = 0;
        this.y = 0;
    }
}

// ============================================
// 解析输入数组
// ============================================
function parseInput(input) {
    try {
        // 清理输入
        let cleaned = input.trim();
        
        // 如果没有括号，尝试添加
        if (!cleaned.startsWith('[')) {
            cleaned = '[' + cleaned + ']';
        }
        
        // 替换 null 字符串为 null 值
        cleaned = cleaned.replace(/\bnull\b/gi, 'null');
        
        // 解析 JSON
        const arr = JSON.parse(cleaned);
        
        if (!Array.isArray(arr)) {
            throw new Error('输入必须是数组');
        }
        
        return arr;
    } catch (e) {
        console.error('解析错误:', e);
        alert('输入格式错误！请输入有效的数组，如：[1, 2, 3, null, 4]');
        return null;
    }
}

// ============================================
// 从层序遍历数组构建二叉树
// ============================================
function buildTree(arr) {
    if (!arr || arr.length === 0 || arr[0] === null) {
        return null;
    }
    
    const root = new TreeNode(arr[0]);
    const queue = [root];
    let i = 1;
    
    while (queue.length > 0 && i < arr.length) {
        const node = queue.shift();
        
        // 左子节点
        if (i < arr.length) {
            if (arr[i] !== null) {
                node.left = new TreeNode(arr[i]);
                queue.push(node.left);
            }
            i++;
        }
        
        // 右子节点
        if (i < arr.length) {
            if (arr[i] !== null) {
                node.right = new TreeNode(arr[i]);
                queue.push(node.right);
            }
            i++;
        }
    }
    
    return root;
}

// ============================================
// 计算树的统计信息
// ============================================
function getTreeStats(root) {
    let nodeCount = 0;
    let leafCount = 0;
    let maxHeight = 0;
    
    function dfs(node, depth) {
        if (!node) return;
        
        nodeCount++;
        maxHeight = Math.max(maxHeight, depth);
        
        if (!node.left && !node.right) {
            leafCount++;
        }
        
        dfs(node.left, depth + 1);
        dfs(node.right, depth + 1);
    }
    
    dfs(root, 1);
    
    return { nodeCount, leafCount, height: maxHeight };
}

// ============================================
// 计算节点位置（改进的算法，避免重叠）
// ============================================
function calculatePositions(root) {
    if (!root) return { width: 0, height: 0 };
    
    const positions = new Map();
    let minX = Infinity;
    let maxX = -Infinity;
    let maxDepth = 0;
    
    // 第一遍：使用中序遍历分配 x 坐标
    let xCounter = 0;
    
    function assignX(node, depth) {
        if (!node) return;
        
        assignX(node.left, depth + 1);
        
        node.x = xCounter * config.minNodeSpacing;
        node.y = depth * config.levelHeight;
        xCounter++;
        
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        maxDepth = Math.max(maxDepth, depth);
        
        assignX(node.right, depth + 1);
    }
    
    assignX(root, 0);
    
    // 调整坐标，使树居中
    const treeWidth = maxX - minX + config.nodeRadius * 2 + config.padding * 2;
    const treeHeight = maxDepth * config.levelHeight + config.nodeRadius * 2 + config.padding * 2;
    
    // 平移所有节点，使最小 x 从 padding 开始
    function adjustPositions(node) {
        if (!node) return;
        node.x = node.x - minX + config.padding + config.nodeRadius;
        node.y = node.y + config.padding + config.nodeRadius;
        adjustPositions(node.left);
        adjustPositions(node.right);
    }
    
    adjustPositions(root);
    
    return { width: treeWidth, height: treeHeight };
}

// ============================================
// 绘制二叉树
// ============================================
function drawTree(root) {
    if (!root) {
        treeContainer.classList.remove('has-tree');
        saveBtn.disabled = true;
        return;
    }
    
    // 计算位置
    const { width, height } = calculatePositions(root);
    
    // 设置 canvas 尺寸 - 使用树的实际宽高，不需要居中偏移
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = width;
    const canvasHeight = height;
    
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    ctx.scale(dpr, dpr);
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 先绘制所有连线
    drawLines(root);
    
    // 再绘制所有节点
    drawNodes(root);
    
    treeContainer.classList.add('has-tree');
    saveBtn.disabled = false;
}

// 调整节点偏移使其居中
function adjustOffset(node, offsetX) {
    if (!node) return;
    node.x += offsetX;
    adjustOffset(node.left, offsetX);
    adjustOffset(node.right, offsetX);
}

// 绘制连线
function drawLines(node) {
    if (!node) return;
    
    ctx.strokeStyle = config.colors.line;
    ctx.lineWidth = config.lineWidth;
    ctx.lineCap = 'round';
    
    if (node.left) {
        drawLineBetweenNodes(node, node.left);
        drawLines(node.left);
    }
    
    if (node.right) {
        drawLineBetweenNodes(node, node.right);
        drawLines(node.right);
    }
}

// 绘制两节点之间的连线（从圆边缘到圆边缘）
function drawLineBetweenNodes(from, to) {
    // 计算两圆心之间的距离和角度
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 如果距离太小，不绘制
    if (distance <= config.nodeRadius * 2) return;
    
    // 计算单位向量
    const unitX = dx / distance;
    const unitY = dy / distance;
    
    // 计算起点（从 from 节点圆边缘开始）
    const startX = from.x + unitX * config.nodeRadius;
    const startY = from.y + unitY * config.nodeRadius;
    
    // 计算终点（到 to 节点圆边缘结束）
    const endX = to.x - unitX * config.nodeRadius;
    const endY = to.y - unitY * config.nodeRadius;
    
    // 绘制线条
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}

// 绘制节点
function drawNodes(node) {
    if (!node) return;
    
    // 绘制阴影
    ctx.beginPath();
    ctx.arc(node.x, node.y, config.nodeRadius, 0, Math.PI * 2);
    ctx.shadowColor = config.colors.nodeShadow;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(
        node.x - config.nodeRadius,
        node.y - config.nodeRadius,
        node.x + config.nodeRadius,
        node.y + config.nodeRadius
    );
    gradient.addColorStop(0, config.colors.nodeGradient[0]);
    gradient.addColorStop(1, config.colors.nodeGradient[1]);
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 绘制节点值
    ctx.fillStyle = config.colors.text;
    ctx.font = `bold ${config.fontSize}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 处理长文本
    let text = String(node.val);
    if (text.length > 4) {
        text = text.substring(0, 3) + '…';
        ctx.font = `bold ${config.fontSize - 2}px -apple-system, sans-serif`;
    }
    
    ctx.fillText(text, node.x, node.y);
    
    // 递归绘制子节点
    drawNodes(node.left);
    drawNodes(node.right);
}

// ============================================
// 更新信息面板
// ============================================
function updateInfoPanel(stats) {
    nodeCountEl.textContent = stats.nodeCount;
    treeHeightEl.textContent = stats.height;
    leafCountEl.textContent = stats.leafCount;
}

// ============================================
// 生成二叉树
// ============================================
function generate() {
    const input = treeInput.value.trim();
    if (!input) {
        alert('请输入层序遍历数组');
        return;
    }
    
    const arr = parseInput(input);
    if (!arr) return;
    
    const root = buildTree(arr);
    
    if (!root) {
        alert('无法构建二叉树，请检查输入');
        return;
    }
    
    // 计算统计信息
    const stats = getTreeStats(root);
    updateInfoPanel(stats);
    
    // 绘制树
    drawTree(root);
}

// ============================================
// 清空
// ============================================
function clear() {
    treeInput.value = '';
    treeContainer.classList.remove('has-tree');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateInfoPanel({ nodeCount: 0, height: 0, leafCount: 0 });
    saveBtn.disabled = true;
}

// ============================================
// 保存图片
// ============================================
function saveImage() {
    if (!treeContainer.classList.contains('has-tree')) {
        alert('请先生成二叉树');
        return;
    }
    
    // 创建一个临时 canvas 用于添加背景
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // 绘制深色背景
    tempCtx.fillStyle = '#0f172a';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 绘制原始 canvas 内容
    tempCtx.drawImage(canvas, 0, 0);
    
    // 创建下载链接
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    link.download = `binary-tree-${timestamp}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

// ============================================
// 事件绑定
// ============================================
generateBtn.addEventListener('click', generate);
clearBtn.addEventListener('click', clear);
saveBtn.addEventListener('click', saveImage);

// 回车生成
treeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        generate();
    }
});

// 示例按钮
document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        treeInput.value = btn.dataset.value;
        generate();
    });
});

// 窗口大小变化时重绘
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (treeContainer.classList.contains('has-tree')) {
            generate();
        }
    }, 200);
});

// 页面加载完成后自动生成默认示例
document.addEventListener('DOMContentLoaded', () => {
    generate();
});
