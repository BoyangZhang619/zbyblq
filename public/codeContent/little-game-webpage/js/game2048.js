window.onload = () => {
    if (JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] !== "undefined") document.querySelector("#themeBlock").style.display = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`)).theme == "light" ? "none" : "block";
    for (i = 0; i < 16; i++) document.querySelector("#box2048").innerHTML += "<li></li>";
    liElements = document.querySelectorAll("#box2048>li");
    mainTagElement = document.querySelector("#main");
    minElement = document.querySelectorAll(".showDiv")[0].children[0];
    secElement = document.querySelectorAll(".showDiv")[0].children[2];
    stepElement = document.querySelectorAll(".showDiv")[1].children[0];
    min = 0, sec = 0, step = 0;
    startX = 0;
    startY = 0;
    endX = 0;
    endY = 0;
    isGameOver = false;
    [Math.floor(Math.random() * 16), Math.floor(Math.random() * 16)].forEach(position => dataArray[Math.floor(position / 4)][position % 4] = Math.ceil(Math.random() * 10) * 2 % 4 + 2);
    console.log("dataArray", dataArray);
    assignFunc(liElements);
    pageStyleFunc();
    dyeingFunc(liElements);
    // game2048Algorithm(dataArray)
    // info = navigator.userAgent;
    // isPhone = /mobile/i.test(info); // if it's a mobile device, isPhone = true
}
window.onkeyup = function (event) {
    if (document.querySelector("#screenBlock").style.display === "block") return;
    let key = event.code;
    switch (key) {
        case "KeyW": case "ArrowUp": dirFunc("up"); break;
        case "KeyS": case "ArrowDown": dirFunc("down"); break;
        case "KeyA": case "ArrowLeft": dirFunc("left"); break;
        case "KeyD": case "ArrowRight": dirFunc("right"); break;
    }
    console.log(`${key} pressed|time: ${new Date().toLocaleTimeString()}`);
}

window.addEventListener("resize", pageStyleFunc);

for (i = 0, dataArray = []; i < 4; dataArray[i] = ["", "", "", ""], i++);
let liBGC = { "2": "198, 202, 185, .3", "4": "186, 188, 170, .3", "8": "173, 164, 155, .3", "16": "161, 150, 140, .3", "32": "148, 136, 125, .3", "64": "136, 122, 110, .3", "128": "123, 108, 95, .3", "256": "111, 94, 80, .3", "512": "98, 80, 65, .3", "1024": "86, 66, 50, .3", "": "86, 66, 50, .3" };
currentScore = 0;
currentMaxNumber = 0;
isstart = false;

const minSwipeDistance = 50;
let touchArea = document.querySelector("#main>main");
touchArea.addEventListener('touchstart', handleTouchStart);
touchArea.addEventListener('touchmove', handleTouchMove);
touchArea.addEventListener('touchend', handleTouchEnd);
function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
}

function handleTouchMove(event) {
    const touch = event.touches[0];
    endX = touch.clientX;
    endY = touch.clientY;
}

function handleTouchEnd() {
    if (document.querySelector("#screenBlock").style.display === "block") return;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
        return;
    }
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            dirFunc("right");
        } else {
            dirFunc("left");
        }
    } else {
        if (deltaY > 0) {
            dirFunc("down");
        } else {
            dirFunc("up");
        }
    }
}

function dirFunc(_dir) {
    // move the numbers in the array according to the direction
    if (!isstart) isstart = true;
    if (["up", "down", "left", "right"].includes(_dir)) stepElement.textContent = ++step;
    switch (_dir) {
        case "up": dirUp(); break;
        case "down": dirDown(); break;
        case "left": dirLeft(); break;
        case "right": dirRight(); break;
    }
    function dirUp() {
        for (let levelA = 0; levelA < 4; levelA++) {
            for (let levelB = 0; levelB < 3; levelB++) {
                for (let levelC = 0; levelC < 3 - levelB; levelC++) {
                    if (dataArray[levelB][levelA] == dataArray[levelB + levelC + 1][levelA] && dataArray[levelB][levelA] != "") {
                        dataArray[levelB][levelA] *= 2;
                        currentScore -= -dataArray[levelB][levelA];
                        currentMaxNumber = Math.max(currentMaxNumber, dataArray[levelB][levelA]);
                        dataArray[levelB + levelC + 1][levelA] = "";
                        levelB++;
                        break;
                    }
                    if (dataArray[levelB][levelA] != "" && dataArray[levelB + levelC + 1][levelA] != "") break;
                }
            }
        }
        for (let levelC = 0; levelC < 3; levelC++)
            for (let levelA = 0; levelA < 4; levelA++)
                for (let levelB = 0; levelB < 3; levelB++) {
                    if (dataArray[levelB][levelA] != "") {
                        dataArray[levelB][levelA] = dataArray[levelB][levelA]
                    } else {
                        dataArray[levelB][levelA] = dataArray[levelB + 1][levelA];
                        dataArray[levelB + 1][levelA] = "";
                    }
                }
    }

    function dirDown() {
        for (let levelA = 0; levelA < 4; levelA++) {
            for (let levelB = 3; levelB > 0; levelB--) {
                for (let levelC = 0; levelC < levelB; levelC++) {
                    if (dataArray[levelB][levelA] == dataArray[levelB - levelC - 1][levelA] && dataArray[levelB][levelA] != "") {
                        dataArray[levelB][levelA] *= 2;
                        currentScore -= -dataArray[levelB][levelA];
                        currentMaxNumber = Math.max(currentMaxNumber, dataArray[levelB][levelA]);
                        dataArray[levelB - levelC - 1][levelA] = "";
                        levelB--;
                        break;
                    }
                    if (dataArray[levelB][levelA] != "" && dataArray[levelB - levelC - 1][levelA] != "") break;
                }
            }
        }
        for (let levelC = 0; levelC < 3; levelC++)
            for (let levelA = 0; levelA < 4; levelA++)
                for (let levelB = 3; levelB > 0; levelB--) {
                    if (dataArray[levelB][levelA] != "") {
                        dataArray[levelB][levelA] = dataArray[levelB][levelA]
                    } else {
                        dataArray[levelB][levelA] = dataArray[levelB - 1][levelA];
                        dataArray[levelB - 1][levelA] = "";
                    }
                }
    }
    function dirLeft() {
        for (let levelA = 0; levelA < 4; levelA++) {
            for (let levelB = 0; levelB < 3; levelB++) {
                for (let levelC = 0; levelC < 3 - levelB; levelC++) {
                    if (dataArray[levelA][levelB] == dataArray[levelA][levelB + levelC + 1] && dataArray[levelA][levelB] != "") {
                        dataArray[levelA][levelB] *= 2;
                        currentScore -= -dataArray[levelB][levelA];
                        currentMaxNumber = Math.max(currentMaxNumber, dataArray[levelB][levelA]);
                        dataArray[levelA][levelB + levelC + 1] = "";
                        levelB++;
                        break;
                    }
                    if (dataArray[levelA][levelB] != "" && dataArray[levelA][levelB + levelC + 1] != "") break;
                }
            }
        }
        for (let levelC = 0; levelC < 3; levelC++)
            for (let levelA = 0; levelA < 4; levelA++)
                for (let levelB = 0; levelB < 3; levelB++) {
                    if (dataArray[levelA][levelB] != "") {
                        dataArray[levelA][levelB] = dataArray[levelA][levelB]
                    } else {
                        dataArray[levelA][levelB] = dataArray[levelA][levelB + 1];
                        dataArray[levelA][levelB + 1] = "";
                    }
                }
    }
    function dirRight() {
        for (let levelA = 0; levelA < 4; levelA++) {
            for (let levelB = 3; levelB > 0; levelB--) {
                for (let levelC = 0; levelC < levelB; levelC++) {
                    if (dataArray[levelA][levelB] == dataArray[levelA][levelB - levelC - 1] && dataArray[levelA][levelB] != "") {
                        dataArray[levelA][levelB] *= 2;
                        currentScore -= -dataArray[levelB][levelA];
                        currentMaxNumber = Math.max(currentMaxNumber, dataArray[levelB][levelA]);
                        dataArray[levelA][levelB - levelC - 1] = "";
                        levelB--;
                        break;
                    }
                    if (dataArray[levelA][levelB] != "" && dataArray[levelA][levelB - levelC - 1] != "") break;
                }
            }
        }
        for (let levelC = 0; levelC < 3; levelC++)
            for (let levelA = 0; levelA < 4; levelA++)
                for (let levelB = 3; levelB > 0; levelB--) {
                    if (dataArray[levelA][levelB] != "") {
                        dataArray[levelA][levelB] = dataArray[levelA][levelB]
                    } else {
                        dataArray[levelA][levelB] = dataArray[levelA][levelB - 1];
                        dataArray[levelA][levelB - 1] = "";
                    }
                }
    }
    // plus the new numbers to the array
    let emptyAmount = 0;
    let emptyAmountClone = 0;
    for (let i = 0; i < 16; i++)if (dataArray[Math.floor(i / 4)][i % 4] == "") emptyAmount++;
    emptyAmountClone = emptyAmount ? emptyAmount : 0;
    if (emptyAmount == 0) emptyAmountClone = 0;

    emptyAmount -= Math.ceil(Math.random() * emptyAmount);
    for (let i = 0; i < 16; i++) {
        if (dataArray[Math.floor(i / 4)][i % 4] == "") {
            if (emptyAmount == 0) {
                dataArray[Math.floor(i / 4)][i % 4] = Math.ceil(Math.random() * 10) * 2 % 4 + 2;
                break;
            }
            emptyAmount--;
        }
    }
    // assign the numbers to the li elements
    assignFunc(liElements);
    // dye the li elements according to the numbers
    dyeingFunc(liElements);
    // check if the game is over
    if (emptyAmountClone == 0) isover();
}

function dyeingFunc(liElements) {
    liElements.forEach(elem => {
        if (elem.textContent in liBGC) elem.style.backgroundColor = `rgba(${liBGC[elem.textContent]})`;
    })
}

function assignFunc(liElements) {
    for (let i = 0; i < 16; i++)  liElements[i].textContent = dataArray[Math.floor(i / 4)][i % 4];
}

function isover() {
    for (let levelA = 0; levelA < 4; levelA++)for (let levelB = 0; levelB < 3; levelB++) {
        if (dataArray[levelA][levelB] == dataArray[levelA][levelB + 1]) return;
        if (dataArray[levelB][levelA] == dataArray[levelB + 1][levelA]) return;
        if (levelA == 3 && levelB == 2) {
            alertInfo("Game over");
            infoT();
            restart();
            isGameOver = true;
            break;
        }
    }
}

function pageStyleFunc() {
    if (parseInt(window.getComputedStyle(mainTagElement.children[0]).width) < parseInt(window.getComputedStyle(mainTagElement.children[0]).height)) {
        liElements.forEach(elem => elem.style.width = elem.style.lineHeight = "17.5vw");//70vw / 4
        liElements.forEach(elem => elem.style.fontSize = "calc(17.5vw / 3)");// 1/3 of 17.5vw
        document.querySelector("#box").style.margin = "calc(50vh - 38.75vw) auto";
    } else {
        liElements.forEach(elem => elem.style.width = elem.style.lineHeight = "calc(25vh - 1.875vw)");//(100vh - 7.5vw) / 4
        liElements.forEach(elem => elem.style.fontSize = "calc((25vh - 1.875vw) / 3)");// 1/3 of 25vh - 1.875vw
        document.querySelector("#box").style.margin = "0 auto";
    }
}

function restart() {
    if (isStart) infoT(false)
    for (i = 0, dataArray = []; i < 4; dataArray[i] = ["", "", "", ""], i++);
    [Math.floor(Math.random() * 16), Math.floor(Math.random() * 16)].forEach(position => dataArray[Math.floor(position / 4)][position % 4] = Math.ceil(Math.random() * 10) * 2 % 4 + 2);
    console.log("restart:dataArray", dataArray);
    assignFunc(liElements);
    pageStyleFunc();
    dyeingFunc(liElements);
    isstart = false;
    secElement.textContent = 0;
    minElement.textContent = 0;
    stepElement.textContent = 0;
    currentMaxNumber = 0;
    currentScore = 0;
    min = 0, sec = 0, step = 0;
}

function infoT(_isover = true) {
    let _gameInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-game2048-1`));
    _gameInfo.gameInfo.totalTimes += 1;
    if (_gameInfo.gameInfo.totalTimes % 10 == 1 && _gameInfo.gameInfo.totalTimes != 1) {
        _gameInfo.gameInfo.totalPages += 1;
        localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-game2048-${_gameInfo.gameInfo.totalPages}`, JSON.stringify({ "record": { "times0": { "this one isn't a record": "undefined" } } }));
    }
    localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-game2048-1`, JSON.stringify(_gameInfo));
    let _times = Object.keys(JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-game2048-" + _gameInfo.gameInfo.totalPages)).record).length;
    let _currentUserGameRecord = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-game2048-" + _gameInfo.gameInfo.totalPages));
    let _currentTime = {
        "s": step,//step
        "t": min * 60 + sec,//time
        "mN": currentMaxNumber,//max number
        "bS": currentScore,//best score
        "iS": 1,//is start
        "iO": _isover ? 1 : 0,//is over 
        "dA": JSON.stringify(dataArray),//data array
        "dT": new Date().toLocaleString(),//date time
    }
    _currentUserGameRecord.record[`times${_times}`] = _currentTime;
    localStorage.setItem((JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-game2048-" + _gameInfo.gameInfo.totalPages), JSON.stringify(_currentUserGameRecord));
}

function pause() {
    isstart = isstart ? false : true;
}

let timer = setInterval(() => {
    if (isstart) {
        secElement.textContent = ++sec;
        if (sec == 60) {
            sec = 0;
            secElement.textContent = step;
            minElement.textContent = ++min;
        }
    }
}, 1000);

//--------------------------
function automaticPlay() {
    if (isGameOver) {
        let promise = new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 1000); // Adjust the delay as needed
        });
        promise.then(() => {
            isGameOver = false; // Reset the game over state
            automaticPlay() // Restart the automatic play after a delay
        });
        return;
    }
    let direction = ["down", "right"];
    let randomDirection = direction[Math.floor(Math.random() * 2)];
    dirFunc(randomDirection);
    setTimeout(automaticPlay); // Adjust the interval as needed
}