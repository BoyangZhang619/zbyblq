window.onload = () => {
    if (JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] !== "undefined") document.querySelector("#themeBlock").style.display = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`)).theme == "light" ? "none" : "block";
    boxWidth = +JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-klotski-1`)).gameInfo.defaultWidth || 10;
    minElement = document.querySelectorAll(".showDiv")[0].children[0];
    secElement = document.querySelectorAll(".showDiv")[0].children[2];
    stepElement = document.querySelectorAll(".showDiv")[1].children[0];
    initialCreate(boxWidth)
}

window.addEventListener("resize", () => { pageStyleFunc(boxWidth) });

window.addEventListener("click", (event) => {
    // judge is same x or y
    // got x or y and evalue the distant of current and white 
    // moving
    if (event.target.className === "cell") {
        isStart = true;
        let [Y, X] = event.target.id.split("-").slice(1);
        X = Number(X);
        Y = Number(Y);
        if ((X != currentWhitePoint[1] && Y != currentWhitePoint[0]) || (X == currentWhitePoint[1] && Y == currentWhitePoint[0])) return;
        if (X == currentWhitePoint[1]) {
            let delayY = currentWhitePoint[0] - Y;
            moving("Y", delayY);
            return;
        }
        if (Y == currentWhitePoint[0]) {
            let delayX = currentWhitePoint[1] - X;
            moving("X", delayX);
            return;
        }
        function moving(_movingLine, _distant) {
            console.log(step);

            stepElement.textContent = ++step;
            if (_movingLine === "X") {
                if (_distant < 0) {
                    for (let i = 0; i < Math.abs(_distant); i++) {
                        dataArray[Y][currentWhitePoint[1] + i] = dataArray[Y][currentWhitePoint[1] + i + 1];
                    }
                    dataArray[Y][currentWhitePoint[1] + Math.abs(_distant)] = "";
                }
                if (_distant > 0) {
                    for (let i = Math.abs(_distant); i > 0; i--) {
                        dataArray[Y][X + i] = dataArray[Y][X + i - 1];
                    }
                    dataArray[Y][X] = "";
                }
            }
            if (_movingLine === "Y") {
                if (_distant < 0) {
                    for (let i = 0; i < Math.abs(_distant); i++) {
                        dataArray[currentWhitePoint[0] + i][X] = dataArray[currentWhitePoint[0] + i + 1][X];
                    }
                    dataArray[currentWhitePoint[0] + Math.abs(_distant)][X] = "";
                }
                if (_distant > 0) {
                    for (let i = Math.abs(_distant); i > 0; i--) {
                        dataArray[Y + i][X] = dataArray[Y + i - 1][X];
                    }
                    dataArray[Y][X] = "";
                }
            }
            // print
            for (let m = 0; m < boxWidth ** 2; m++) document.querySelector(`#cell-${Math.floor(m / boxWidth)}-${m % boxWidth}`).textContent = dataArray[Math.floor(m / boxWidth)][m % boxWidth];
            currentWhitePoint[0] = Y;
            currentWhitePoint[1] = X;
            //isOver
            for (let m = 0; m < boxWidth ** 2; m++) {
                if (m == (boxWidth ** 2) - 1) {
                    alertInfo("You got success!");
                    infoT();
                    isStart = false;
                    restart(true);
                    return;
                }
                if (dataArray[Math.floor(m / boxWidth)][m % boxWidth] != m + 1) break;
            }
        }
    }
})
class ValueError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValueError";
    }
}

function initialCreate(_width) {
    _width = parseInt(_width);
    try {
        if (_width > 10 || _width < 2) {
            alertInfo("Width must be between 5 and 10.", "Error");
            throw new ValueError("Width must be between 5 and 10.")
        }
    } catch (error) {
        if (error instanceof ValueError)
            console.error(error.stack);
        return;
    } finally {
        document.querySelector("#boxWHnum").value = "";
    }
    let _gameInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-klotski-1`));
    _gameInfo.gameInfo.defaultWidth = _width;
    localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-klotski-1`, JSON.stringify(_gameInfo))
    boxWidth = _width;
    stepElement.textContent = 0;
    secElement.textContent = 0;
    minElement.textContent = 0;
    min = 0, sec = 0, step = 0;
    isStart = false;
    currentWhitePoint = [_width - 1, _width - 1];
    document.querySelector("#box").innerHTML = ""; // Clear the previous klotski
    document.querySelector("#boxWHnum").disabled = true;
    // Create the klotski with the given _width(height=_width)
    dataArray = new Array(_width).fill([]).map(() => new Array(_width));
    for (let i = 0; i < _width; i++) {
        let row = document.createElement("ul");
        row.className = "row";
        row.id = `row-${i}`;
        for (let j = 0; j < _width; j++) {
            let cell = document.createElement("li");
            cell.className = "cell";
            cell.id = `cell-${i}-${j}`;
            row.appendChild(cell);
            if (i == _width - 1 && j == _width - 1) {
                document.querySelector("#box").appendChild(row);
                break;
            }
        }
        document.querySelector("#box").appendChild(row);
    }
    do {
        _isContinueA = false;
        for (let i = 0; i < _width; i++) {
            for (let j = 0; j < _width; j++) {
                if (i === _width - 1 && j === _width - 1) {
                    dataArray[i][j] = "";
                    break;
                } else {
                    do {
                        _isContinueB = false;
                        dataArray[i][j] = Math.ceil(Math.random() * (_width ** 2 - 1)).toString();
                        for (let m = 0; m < i * _width + j; m++) {
                            if (dataArray[Math.floor(m / _width)][m % _width] === dataArray[i][j]) {
                                _isContinueB = true;
                                break;
                            }
                        }
                    } while (_isContinueB);
                }
            }
        }
        dataArray[_width - 1][_width - 1] = "";
        //judge sentence
        const flatArr = [];
        for (let i = 0; i < _width; i++) {
            for (let j = 0; j < _width; j++) {
                if (i === _width - 1 && j === _width - 1) continue;
                flatArr.push(parseInt(dataArray[i][j], 10));
            }
        }
        let inversions = 0;
        for (let m = 0; m < flatArr.length; m++) {
            for (let n = m + 1; n < flatArr.length; n++) {
                if (flatArr[m] > flatArr[n]) inversions++;
            }
        }
        _isContinueA = !(inversions % 2 === 0);
    } while (_isContinueA)
    for (let m = 0; m < _width ** 2 - 1; m++) document.querySelector(`#cell-${Math.floor(m / _width)}-${m % _width}`).textContent = dataArray[Math.floor(m / _width)][m % _width];
    document.querySelector("#boxWHnum").disabled = false;
    pageStyleFunc(_width);
}

function pageStyleFunc(_width) {
    if (parseInt(window.getComputedStyle(document.querySelector("#main").children[0]).width) < parseInt(window.getComputedStyle(document.querySelector("#main").children[0]).height)) {
        document.querySelector("#box").style.margin = "calc(50vh - 38.75vw) auto";
        [["--width", _width], ["--paramA", 0], ["--paramB", 70]].forEach(([key, value]) => { document.documentElement.style.setProperty(key, value); });
    } else {
        document.querySelector("#box").style.margin = "0 auto";
        [["--width", _width], ["--paramA", 100], ["--paramB", -7.5]].forEach(([key, value]) => { document.documentElement.style.setProperty(key, value); });
    }
}

function restart(_isWin = false) {
    if (isStart) infoT(_isWin)
    document.querySelector("#box").innerHTML = ""; // Clear the previous klotski
    initialCreate(boxWidth);
}

function infoT(_isover = true) {
    let _gameInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-klotski-1`));
    _gameInfo.gameInfo.totalTimes += 1;
    if (_gameInfo.gameInfo.totalTimes % 10 == 1 && _gameInfo.gameInfo.totalTimes != 1) {
        _gameInfo.gameInfo.totalPages += 1;
        localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-klotski-${_gameInfo.gameInfo.totalPages}`, JSON.stringify({ "record": { "times0": { "this one isn't a record": "undefined" } } }));
    }
    localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-klotski-1`, JSON.stringify(_gameInfo));
    let _times = Object.keys(JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-klotski-" + _gameInfo.gameInfo.totalPages)).record).length;
    let _currentUserGameRecord = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-klotski-" + _gameInfo.gameInfo.totalPages));
    let _currentTime = {
        "s": step,//step
        "t": min * 60 + sec,//time
        "w": boxWidth,//width
        "mN": null,//max number
        "bS": (step) - (min * 60 + sec) * 2,//best score
        "iS": 1,//is start
        "iO": _isover ? "WIN" : "FAIL",//is over 
        "dT": new Date().toLocaleString(),//date time
        "dA": JSON.stringify(dataArray),//data array
    }
    _currentUserGameRecord.record[`times${_times}`] = _currentTime;
    localStorage.setItem((JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-klotski-" + _gameInfo.gameInfo.totalPages), JSON.stringify(_currentUserGameRecord));
}

function pause() {
    isStart = isStart ? false : true;
}

function timerFunc() {
    if (!isStart) return;
    secElement.textContent = ++sec;
    if (sec == 60) {
        sec = 0;
        secElement.textContent = sec;
        minElement.textContent = ++min;
    }
}
timer = setInterval(timerFunc, 1000);