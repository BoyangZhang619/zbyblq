const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const lower = "abcdefghijklmnopqrstuvwxyz";
const smallCapsLower = "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ";

const alphabet = {
    "Normal": upper + lower,
    "𝕂𝔞𝔩𝔩𝔦𝔤𝔯𝔞𝔭𝔥𝔶": "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷",
    "𝐁𝐨𝐥𝐝": "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳",
    "𝑰𝒕𝒂𝒍𝒊𝒄": "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧",
    "𝐁𝐨𝐥𝐝 𝐈𝐭𝐚𝐥𝐢𝐜": "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛",
    "𝔊𝔬𝔱𝔥𝔦𝔠": "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷",
    "𝕭𝖔𝖑𝖉 𝕲𝖔𝖙𝖍𝖎𝖈": "𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟",
    "𝕄𝕠𝕟𝕠": "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣",
    "Ｓｐａｃｅｄ": "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ",
    "sᴍᴀʟʟ ᴄᴀᴘs": upper + lower.replace(/[a-z]/g, c => smallCapsLower[lower.indexOf(c)]),
    "𝒮𝒸𝓇𝒾𝓅𝓉": "𝒜𝐵𝒞𝒟𝐸𝐹𝒢𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏",
    "𝓑𝓸𝔁𝓮𝓭": "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉",
    "C͟o͟m͟b͟o͟": "A̲B̲C̲D̲E̲F̲G̲H̲I̲J̲K̲L̲M̲N̲O̲P̲Q̲R̲S̲T̲U̲V̲W̲X̲Y̲Z̲a̲b̲c̲d̲e̲f̲g̲h̲i̲j̲k̲l̲m̲n̲o̲p̲q̲r̲s̲t̲u̲v̲w̲x̲y̲z̲"
};

const normal = upper + lower;
let isTransforming = false;

function splitGlyphs(str) {
    const glyphs = [];
    let buffer = "";

    for (const ch of str) {
        if (buffer && /\p{M}/u.test(ch)) {
            buffer += ch;
        } else {
            if (buffer) glyphs.push(buffer);
            buffer = ch;
        }
    }
    if (buffer) glyphs.push(buffer);
    return glyphs;
}

function transformText(input, font) {
    const fontArr = splitGlyphs(font);
    let output = "";

    for (let c of input) {
        const idx = normal.indexOf(c);
        if (idx !== -1 && fontArr.length >= 52) {
            output += fontArr[idx];
        } else {
            output += c;
        }
    }
    return output;
}

function setDisabled(disabled) {
    isTransforming = disabled;
    const input = document.getElementById("inputText");
    const items = document.querySelectorAll("#fontList li");

    input.disabled = disabled;
    items.forEach(li => li.classList.toggle("disabled", disabled));
}

function updateResult(text) {
    const result = document.getElementById("result");
    result.innerText = text || "转换结果将显示在这里";
    result.scrollTop = 0;
}

function handleTransform(fontName, li) {
    if (isTransforming) return;

    const input = document.getElementById("inputText").value;
    const result = document.getElementById("result");
    const allItems = document.querySelectorAll("#fontList li");

    allItems.forEach(item => item.classList.remove("selected"));
    li.classList.add("selected");

    setDisabled(true);
    result.classList.add("transforming");

    setTimeout(() => {
        updateResult(transformText(input, alphabet[fontName]));

        setTimeout(() => {
            result.classList.remove("transforming");
            setDisabled(false);
        }, 300);
    }, 150);
}

function renderFontList() {
    const fontList = document.getElementById("fontList");
    fontList.innerHTML = "";

    Object.keys(alphabet).forEach(fontName => {
        const li = document.createElement("li");
        const fontArr = splitGlyphs(alphabet[fontName]);
        const sample = fontArr.slice(0, 12).join("") + "...";

        li.innerHTML = `
            <div class="font-title">${fontName}</div>
            <div class="font-sample">${sample}</div>
        `;

        li.addEventListener("click", () => handleTransform(fontName, li));
        fontList.appendChild(li);
    });
}

function bindCopy() {
    const copyBtn = document.getElementById("copyBtn");
    const resultEl = document.getElementById("result");

    copyBtn.addEventListener("click", async () => {
        const text = resultEl.innerText.trim();
        if (!text || text === "转换结果将显示在这里") return;
        try {
            await navigator.clipboard.writeText(text);
            copyBtn.textContent = "已复制";
            setTimeout(() => (copyBtn.textContent = "复制"), 1200);
        } catch (err) {
            copyBtn.textContent = "复制失败";
            setTimeout(() => (copyBtn.textContent = "复制"), 1200);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderFontList();
    bindCopy();

    const inputEl = document.getElementById("inputText");
    inputEl.addEventListener("input", function() {
        if (!isTransforming) {
            updateResult(this.value);
        }
    });
});
