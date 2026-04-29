console.log("The storage space has been used up to " + getLocalStorageSize() + "/5242880 bytes.(" + (getLocalStorageSize() / 5242880).toFixed(5) * 100 + "%)");
gameIntroContent = {
    "game2048": "Genre: Number puzzle/Strategy game\n\nGameplay: Slide numbered tiles on a 4x4 grid to combine matching numbers (e.g., 2+2=4, 4+4=8). The goal is to create the tile numbered 2048 before the grid fills up.\n\nKey Feature: Simple controls (swipe or arrow keys) with addictive, brain-teasing strategy.",
    "klotski": "Genre: Sliding block puzzle\n\nOrigin: Inspired by the ancient Chinese legend of Cao Cao escaping a trap.\n\nGameplay: Move irregular wooden blocks within a confined space to slide the largest block (representing Cao Cao) to the exit.\n\nKey Feature: Requires spatial reasoning and patience, with hundreds of challenging variations.",
    "labyrinth": "Genre: Pathfinding puzzle\n\nGameplay: Navigate through a labyrinth from a start point to an exit, avoiding dead ends. Mazes can be physical (paper) or digital.\n\nKey Feature: Tests memory and problem-solving skills, often with time limits or hidden traps in modern versions.",
    "mineClearance": "Genre: Logic puzzle\n\nGameplay: Clear a grid of hidden mines using numeric clues indicating nearby explosives. Right-click to flag suspected mines.\n\nKey Feature: Iconic Windows pre-installed game since 1990; balances luck and deductive reasoning.",
}
window.addEventListener("pointerdown", () => {
    if (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      document.documentElement.requestFullscreen();
    }
});
function gameIntro(type) {
    //run the func which pauses the game
    alertInfo(gameIntroContent[type]);
}
function back() {
    window.open(`../littleGameMainPage.html`, "_self");
}
function getLocalStorageSize() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += (key.length + localStorage[key].length) * 2; // 2 bytes per character (UTF-16)
        }
    }
    return total;
}

if (getLocalStorageSize() > 4.5 * 1024 * 1024) { // alarm when local storage is over 4.5MB
    console.log("the storage space will be used up soon, please clear the local storage.");
}
document.querySelector("#determine").addEventListener("click", () => alertInfo(null,null, true))
function alertInfo(_txt, _title = "Alert", _close = false) {
    if (_close) return document.querySelector("#screenBlock").style.display = "none";
    document.querySelector("#info>h2").textContent = _title;
    document.querySelector("#info>p").textContent = _txt;
    document.querySelector("#screenBlock").style.display = "block";
}
