// ============================================
// 空间填充曲线算法 (Gilbert 2D)
// ============================================

function gilbert2d(width, height) {
    const coordinates = [];
    if (width >= height) {
        generate2d(0, 0, width, 0, 0, height, coordinates);
    } else {
        generate2d(0, 0, 0, height, width, 0, coordinates);
    }
    return coordinates;
}

function generate2d(x, y, ax, ay, bx, by, coordinates) {
    const w = Math.abs(ax + ay);
    const h = Math.abs(bx + by);

    const dax = Math.sign(ax), day = Math.sign(ay);
    const dbx = Math.sign(bx), dby = Math.sign(by);

    if (h === 1) {
        for (let i = 0; i < w; i++) {
            coordinates.push([x, y]);
            x += dax;
            y += day;
        }
        return;
    }

    if (w === 1) {
        for (let i = 0; i < h; i++) {
            coordinates.push([x, y]);
            x += dbx;
            y += dby;
        }
        return;
    }

    let ax2 = Math.floor(ax / 2), ay2 = Math.floor(ay / 2);
    let bx2 = Math.floor(bx / 2), by2 = Math.floor(by / 2);

    const w2 = Math.abs(ax2 + ay2);
    const h2 = Math.abs(bx2 + by2);

    if (2 * w > 3 * h) {
        if ((w2 % 2) && (w > 2)) {
            ax2 += dax;
            ay2 += day;
        }
        generate2d(x, y, ax2, ay2, bx, by, coordinates);
        generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by, coordinates);
    } else {
        if ((h2 % 2) && (h > 2)) {
            bx2 += dbx;
            by2 += dby;
        }
        generate2d(x, y, bx2, by2, ax2, ay2, coordinates);
        generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2, coordinates);
        generate2d(x + (ax - dax) + (bx2 - dbx), y + (ay - day) + (by2 - dby),
            -bx2, -by2, -(ax - ax2), -(ay - ay2), coordinates);
    }
}

// ============================================
// 图片处理
// ============================================

const img = document.getElementById("display-img");
const imageContainer = document.querySelector(".image-container");
const loadingOverlay = document.querySelector(".loading-overlay");
const placeholder = document.querySelector(".placeholder");

function showLoading(text = "处理中...") {
    loadingOverlay.querySelector(".loading-text").textContent = text;
    loadingOverlay.classList.add("active");
}

function hideLoading() {
    loadingOverlay.classList.remove("active");
}

function setSrc(src) {
    URL.revokeObjectURL(img.src);
    img.src = src;
    img.style.display = "block";
    imageContainer.classList.add("has-image");
    if (placeholder) placeholder.style.display = "none";
    hideLoading();
    // 更新下载按钮状态
    const btnDownload = document.getElementById("download");
    if (btnDownload) btnDownload.disabled = false;
}

function encrypt(img) {
    showLoading("混淆中...");
    
    setTimeout(() => {
        const cvs = document.createElement("canvas");
        const width = cvs.width = img.naturalWidth;
        const height = cvs.height = img.naturalHeight;
        const ctx = cvs.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imgdata = ctx.getImageData(0, 0, width, height);
        const imgdata2 = new ImageData(width, height);
        const curve = gilbert2d(width, height);
        const offset = Math.round((Math.sqrt(5) - 1) / 2 * width * height);
        
        for (let i = 0; i < width * height; i++) {
            const old_pos = curve[i];
            const new_pos = curve[(i + offset) % (width * height)];
            const old_p = 4 * (old_pos[0] + old_pos[1] * width);
            const new_p = 4 * (new_pos[0] + new_pos[1] * width);
            imgdata2.data.set(imgdata.data.slice(old_p, old_p + 4), new_p);
        }
        
        ctx.putImageData(imgdata2, 0, 0);
        cvs.toBlob(b => {
            setSrc(URL.createObjectURL(b));
        }, "image/jpeg", 0.95);
    }, 50);
}

function decrypt(img) {
    showLoading("解混淆中...");
    
    setTimeout(() => {
        const cvs = document.createElement("canvas");
        const width = cvs.width = img.naturalWidth;
        const height = cvs.height = img.naturalHeight;
        const ctx = cvs.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imgdata = ctx.getImageData(0, 0, width, height);
        const imgdata2 = new ImageData(width, height);
        const curve = gilbert2d(width, height);
        const offset = Math.round((Math.sqrt(5) - 1) / 2 * width * height);
        
        for (let i = 0; i < width * height; i++) {
            const old_pos = curve[i];
            const new_pos = curve[(i + offset) % (width * height)];
            const old_p = 4 * (old_pos[0] + old_pos[1] * width);
            const new_p = 4 * (new_pos[0] + new_pos[1] * width);
            imgdata2.data.set(imgdata.data.slice(new_p, new_p + 4), old_p);
        }
        
        ctx.putImageData(imgdata2, 0, 0);
        cvs.toBlob(b => {
            setSrc(URL.createObjectURL(b));
        }, "image/jpeg", 0.95);
    }, 50);
}

// ============================================
// 事件绑定
// ============================================

const ipt = document.getElementById("ipt");
const btnEnc = document.getElementById("enc");
const btnDec = document.getElementById("dec");
const btnRestore = document.getElementById("re");
const btnDownload = document.getElementById("download");

// 更新下载按钮状态
function updateDownloadBtn() {
    if (img.src && img.style.display !== "none") {
        btnDownload.disabled = false;
    } else {
        btnDownload.disabled = true;
    }
}

ipt.onchange = () => {
    if (ipt.files.length > 0) {
        showLoading("加载图片...");
        const reader = new FileReader();
        reader.onload = () => {
            setSrc(URL.createObjectURL(ipt.files[0]));
            updateDownloadBtn();
        };
        reader.readAsDataURL(ipt.files[0]);
    }
};

btnEnc.onclick = () => {
    if (img.src && img.style.display !== "none") {
        encrypt(img);
    }
};

btnDec.onclick = () => {
    if (img.src && img.style.display !== "none") {
        decrypt(img);
    }
};

btnRestore.onclick = () => {
    if (ipt.files.length > 0) {
        showLoading("还原中...");
        setTimeout(() => {
            setSrc(URL.createObjectURL(ipt.files[0]));
            updateDownloadBtn();
        }, 100);
    }
};

// 下载当前图片
btnDownload.onclick = () => {
    if (img.src && img.style.display !== "none") {
        // 创建 canvas 获取当前图片数据
        const cvs = document.createElement("canvas");
        cvs.width = img.naturalWidth;
        cvs.height = img.naturalHeight;
        const ctx = cvs.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        // 生成下载链接
        cvs.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            // 生成文件名：原文件名 + 时间戳
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
            const originalName = ipt.files[0]?.name?.replace(/\.[^.]+$/, "") || "image";
            a.download = `${originalName}_${timestamp}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, "image/jpeg", 0.95);
    }
};

// 初始化下载按钮状态
updateDownloadBtn();
