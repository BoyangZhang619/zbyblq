window.onload = () => {
    if (JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] !== "undefined") document.querySelector("#themeBlock").style.display = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`)).theme == "light" ? "none" : "block";
    boxWidth = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-labyrinth-1`)).gameInfo.defaultWidth || 29;// means 29 blocks in a row and 29 blocks in a column
    creatingBoxIndex = 0;
    isStart = false;
    gameScore = 0;
    startX = 0;
    startY = 0;
    movedX = 0;
    movedY = 0;
    minElement = document.querySelectorAll(".showDiv")[0].children[0];
    secElement = document.querySelectorAll(".showDiv")[0].children[2];
    stepElement = document.querySelectorAll(".showDiv")[1].children[0];
    currentPoint = [null, null];
    [startPoint, endPoint] = [[null, null], [null, null]];
    initialCreate(boxWidth);
}

window.addEventListener("resize", () => { pageStyleFunc(boxWidth) });

window.onkeydown = function (event) {
    if (document.querySelector("#screenBlock").style.display === "block") return;
    if (currentPoint[0] == null || currentPoint[1] == null) return;
    let key = event.code;
    switch (key) {
        case "KeyW": case "ArrowUp": go("up"); break;
        case "KeyS": case "ArrowDown": go("down"); break;
        case "KeyA": case "ArrowLeft": go("left"); break;
        case "KeyD": case "ArrowRight": go("right"); break;
    }
    console.log(`${key} pressed|time: ${new Date().toLocaleTimeString()}`);
}

class ValueError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValueError";
    }
}

const minSwipeDistance = 10;
let touchArea = document.querySelector("#main>main");
touchArea.addEventListener('touchstart', handleTouchStart);
touchArea.addEventListener('touchmove', handleTouchMove);
function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    movedX = touch.clientX;
    movedY = touch.clientY;
}

function handleTouchMove(event) {
    const touch = event.touches[0];
    const deltaX = touch.clientX - movedX;
    const deltaY = touch.clientY - movedY;
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;
    movedX = touch.clientX;
    movedY = touch.clientY;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) go("right");
        else go("left");
    } else {
        if (deltaY > 0) go("down");
        else go("up");
    }
}


function initialCreate(_width) {
    try {
        if (_width >= 150 || _width <= 10) {
            alertInfo("Width must be between 11 and 149.", "Error");
            throw new ValueError("Width must be between 11 and 149.")
        }
        if ((_width - 1) % 2 !== 0) {
            alertInfo("Width must be an odd number.", "Error");
            throw new ValueError("Width must be an odd number");
        }
    } catch (error) {
        if (error instanceof ValueError)
            console.error(error.stack);
        return;
    } finally {
        document.querySelector("#boxWHnum").value = "";
    }
    let _gameInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-labyrinth-1`));
    _gameInfo.gameInfo.defaultWidth = _width;
    localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-labyrinth-1`, JSON.stringify(_gameInfo))
    boxWidth = _width;
    stepElement.textContent = 0;
    secElement.textContent = 0;
    minElement.textContent = 0;
    min = 0, sec = 0, step = 0;
    isStart = false;
    currentPoint = [null, null];
    document.querySelector("#box").innerHTML = ""; // Clear the previous labyrinth
    document.querySelector("#boxWHnum").disabled = true;
    document.querySelector("#wait").style.display = "block";
    document.querySelector("#box").style.display = "none";
    // Create the labyrinth with the given _width(height=_width)
    dataArray = new Array(_width).fill([]).map(() => new Array(_width));
    for (let i = 0; i < _width; i++)for (let j = 0; j < _width; j++)dataArray[i][j] = {
        isWall: true,
        isVisited: null,//for pathfinding algorithm
        isStartPoint: null,
        isEndPoint: null
    };
    pageStyleFunc(_width);
    createLabyrinth(_width);
    let promise = new Promise(resolve => {
        setTimeout(() => resolve())
    });
    promise.then(creatingBox());
    function creatingBox() {
        document.querySelector("#wait").textContent = `Please Wait A Moment(${((creatingBoxIndex + 1) / _width * 100).toFixed(0)}%)`;
        let row = document.createElement("ul");
        row.className = "labyrinthRow";
        row.id = `row-${creatingBoxIndex}`;
        for (let i = 0; i < _width; i++) {
            let cell = document.createElement("li");
            cell.className = "labyrinthCell";
            cell.id = `cell-${creatingBoxIndex}-${i}`;
            row.appendChild(cell);
        }
        document.querySelector("#box").appendChild(row);
        for (let i = 0; i < _width; i++) {
            if (dataArray[creatingBoxIndex][i].isWall) {
                document.querySelector(`#cell-${creatingBoxIndex}-${i}`).style.backgroundColor = "rgb(132, 117, 106)";
            } else {
                document.querySelector(`#cell-${creatingBoxIndex}-${i}`).style.backgroundColor = "rgb(248, 247, 240)";
                document.querySelector(`#cell-${creatingBoxIndex}-${i}`).style.innerText = dataArray[creatingBoxIndex][i].isStartPoint ? "S" : dataArray[creatingBoxIndex][i].isEndPoint ? "E" : "";
            }
        }
        creatingBoxIndex++;
        if (creatingBoxIndex == _width) {
            creatingBoxIndex = 0;
            document.querySelector(`#cell-${startPoint[0]}-${startPoint[1]}`).style.backgroundColor = "rgb(88, 84, 48)"
            document.querySelector(`#cell-${startPoint[0]}-${startPoint[1]}`).innerText = "S";
            document.querySelector(`#cell-${endPoint[0]}-${endPoint[1]}`).style.backgroundColor = "rgb(86, 66, 50)"
            document.querySelector(`#cell-${endPoint[0]}-${endPoint[1]}`).innerText = "E";
            document.querySelector("#boxWHnum").disabled = false;
            document.querySelector("#wait").style.display = "none";
            document.querySelector("#box").style.display = "block";
            return;
        }
        if (creatingBoxIndex < _width) {
            setTimeout(creatingBox, 0);
        }
    }
}

function createLabyrinth(_width) {
    // Create the labyrinth structure
    const [_startPoint, _endPoint] = createStartEnd(_width);
    dataArray[_startPoint[0]][_startPoint[1]].isStartPoint = true;
    dataArray[_endPoint[0]][_endPoint[1]].isEndPoint = true;
    createPath(_width, _startPoint, _endPoint);
    dataArray[_startPoint[0]][_startPoint[1]].isWall = false;
    dataArray[_endPoint[0]][_endPoint[1]].isWall = false;
    [startPoint, endPoint] = [_startPoint, _endPoint];
    // Call the pathfinding algorithm with the labyrinth data
    // pathfindingAlgorithm(dataArray, _width);
    currentPoint = _startPoint;
    dataArray[currentPoint[0]][currentPoint[1]].isVisited = "start";
}

function createStartEnd(_width) {
    let _switchNum = -1;
    do {
        _switchNum = Math.floor(Math.random() * 10)
    } while (_switchNum > 7)
    switch (_switchNum %= 4) {
        case 0: return [[1, (_width - 1) / 2], [_width - 2, (_width - 1) / 2]];//up,down
        case 1: return [[_width - 2, (_width - 1) / 2], [1, (_width - 1) / 2]];//down,up
        case 2: return [[(_width - 1) / 2, 1], [(_width - 1) / 2, _width - 2]];//left,right
        case 3: return [[(_width - 1) / 2, _width - 2], [(_width - 1) / 2, 1]];//right,left
    }
}

function createPath(_width, _startPoint, _endPoint) {
    //start from the center of the labyrinth
    let _currentPoint = (_width + 1) % 4 ? [(_width + 1) / 2, (_width + 1) / 2] : [(_width - 1) / 2, (_width - 1) / 2];
    let _path = "#";//start with "#",following 0,1,2,3 for up,down,left,right
    let _isCreating = true;
    let _switchNum = -1;
    let _pathAllowed = 1;
    let _pathAllowedNum = 0;
    let __test = 0;
    do {
        __test++;
        // console.log("path:", _path);
        // console.log("current coordinate:", _currentPoint);
        //detect the quantity of path-allowed directions
        if (_currentPoint[0] > 2 && dataArray[_currentPoint[0] - 2][_currentPoint[1]].isWall) {
            _pathAllowed *= 2;
            _pathAllowedNum += 1;
        }//up
        if (_currentPoint[0] < _width - 3 && dataArray[_currentPoint[0] + 2][_currentPoint[1]].isWall) {
            _pathAllowed *= 3;
            _pathAllowedNum += 1;
        }//down
        if (_currentPoint[1] > 2 && dataArray[_currentPoint[0]][_currentPoint[1] - 2].isWall) {
            _pathAllowed *= 5;
            _pathAllowedNum += 1;
        }//left
        if (_currentPoint[1] < _width - 3 && dataArray[_currentPoint[0]][_currentPoint[1] + 2].isWall) {
            _pathAllowed *= 7;
            _pathAllowedNum += 1;
        }//right
        if (_pathAllowedNum == 0) {
            pathRetreat();
            continue;
        }
        do {
            _switchNum = Math.floor(Math.random() * 10)
        } while (_switchNum > (_pathAllowedNum * 2 - 1))
        //connect right dir and num
        //......
        let _remainder = _switchNum % _pathAllowedNum;
        [2, 3, 5, 7].forEach((elem, index) => {
            if (_pathAllowedNum !== 4 && _pathAllowed % elem !== 0) {
                _remainder = _remainder >= index ? _remainder + 1 : _remainder;
                _pathAllowedNum += 1;
            }
        });
        switch (_remainder) {
            case 0: createPathUp(); break;
            case 1: createPathDown(); break;
            case 2: createPathLeft(); break;
            case 3: createPathRight(); break;
        }
        _pathAllowed = 1;
        _pathAllowedNum = 0;
    } while (_isCreating)
    console.log("test", __test)
    function createPathUp() {
        for (let i = 1; i <= 2; i++)dataArray[_currentPoint[0] - i][_currentPoint[1]]["isWall"] = false;
        _currentPoint[0] -= 2;
        _path += "0";
    }
    function createPathDown() {
        for (let i = 1; i <= 2; i++)dataArray[_currentPoint[0] + i][_currentPoint[1]]["isWall"] = false;
        _currentPoint[0] += 2;
        _path += "1";
    }
    function createPathLeft() {
        for (let i = 1; i <= 2; i++)dataArray[_currentPoint[0]][_currentPoint[1] - i]["isWall"] = false;
        _currentPoint[1] -= 2;
        _path += "2";
    }
    function createPathRight() {
        for (let i = 1; i <= 2; i++)dataArray[_currentPoint[0]][_currentPoint[1] + i]["isWall"] = false;
        _currentPoint[1] += 2;
        _path += "3";
    }
    //obviously,these above four funcs could be replaced to a more complex func,for easier maintain,we dont use that
    function pathRetreat() {
        switch (_path[_path.length - 1]) {
            case "0": _currentPoint[0] += 2; _path = _path.slice(0, -1); break;
            case "1": _currentPoint[0] -= 2; _path = _path.slice(0, -1); break;
            case "2": _currentPoint[1] += 2; _path = _path.slice(0, -1); break;
            case "3": _currentPoint[1] -= 2; _path = _path.slice(0, -1); break;
            case "#": _isCreating = false; break;
        }
    }
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

function go(_direction) {
    isStart = isStart ? isStart : true;
    switch (_direction) {
        case "up":
            if (dataArray[currentPoint[0] - 1][currentPoint[1]].isWall) return;
            if (dataArray[currentPoint[0] - 1][currentPoint[1]].isVisited) gameScore -= 3;
            dataArray[currentPoint[0] - 1][currentPoint[1]].isVisited = "up";
            stepElement.textContent = ++step;
            currentPoint[0] -= 1;
            gameScore += 1;
            // check if the point have arrived at the end point and dye it
            dyeingFunction(currentPoint, _direction);
            break;
        case "down":
            if (dataArray[currentPoint[0] + 1][currentPoint[1]].isWall) return;
            if (dataArray[currentPoint[0] + 1][currentPoint[1]].isVisited) gameScore -= 3;
            dataArray[currentPoint[0] + 1][currentPoint[1]].isVisited = "down";
            stepElement.textContent = ++step;
            currentPoint[0] += 1;
            gameScore += 1;
            dyeingFunction(currentPoint, _direction);
            break;
        case "left":
            if (dataArray[currentPoint[0]][currentPoint[1] - 1].isWall) return;
            if (dataArray[currentPoint[0]][currentPoint[1] - 1].isVisited) gameScore -= 3;
            dataArray[currentPoint[0]][currentPoint[1] - 1].isVisited = "left";
            stepElement.textContent = ++step;
            currentPoint[1] -= 1;
            gameScore += 1;
            dyeingFunction(currentPoint, _direction);
            break;
        case "right":
            if (dataArray[currentPoint[0]][currentPoint[1] + 1].isWall) return;
            if (dataArray[currentPoint[0]][currentPoint[1] + 1].isVisited) gameScore -= 3;
            dataArray[currentPoint[0]][currentPoint[1] + 1].isVisited = "right";
            stepElement.textContent = ++step;
            currentPoint[1] += 1;
            gameScore += 1;
            dyeingFunction(currentPoint, _direction);
            break;
    }
}


function dyeingFunction([paramA, paramB], _direction) {
    switch (_direction) {
        case "up": document.querySelector(`#cell-${paramA + 1}-${paramB}`).style.backgroundColor = "rgba(175, 161, 58, 0.5)"; break;
        case "down": document.querySelector(`#cell-${paramA - 1}-${paramB}`).style.backgroundColor = "rgba(175, 161, 58, 0.5)"; break;
        case "left": document.querySelector(`#cell-${paramA}-${paramB + 1}`).style.backgroundColor = "rgba(175, 161, 58, 0.5)"; break;
        case "right": document.querySelector(`#cell-${paramA}-${paramB - 1}`).style.backgroundColor = "rgba(175, 161, 58, 0.5)"; break;
    }
    document.querySelector(`#cell-${paramA}-${paramB}`).style.backgroundColor = "rgba(104, 96, 30, 0.75)";
    if (dataArray[paramA][paramB].isEndPoint) {
        alertInfo("You have reached the end point!");
        infoT();
        isStart = false;
        restart();
        return;
    }
}

function restart() {
    if (isStart) infoT(false)
    document.querySelector("#box").innerHTML = ""; // Clear the previous labyrinth
    initialCreate(boxWidth);
}

function infoT(_isover = true) {
    let _gameInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-labyrinth-1`));
    _gameInfo.gameInfo.totalTimes += 1;
    if (_gameInfo.gameInfo.totalTimes % 10 == 1 && _gameInfo.gameInfo.totalTimes != 1) {
        _gameInfo.gameInfo.totalPages += 1;
        localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-labyrinth-${_gameInfo.gameInfo.totalPages}`, JSON.stringify({ "record": { "times0": { "this one isn't a record": "undefined" } } }));
    }
    localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-labyrinth-1`, JSON.stringify(_gameInfo));
    let _times = Object.keys(JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-labyrinth-" + _gameInfo.gameInfo.totalPages)).record).length;
    let _currentUserGameRecord = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-labyrinth-" + _gameInfo.gameInfo.totalPages));
    let _currentTime = {
        "s": step,//step
        "t": min * 60 + sec,//time
        "w": boxWidth,//width
        "mN": null,//max number
        "bS": (step) - (min * 60 + sec) * 2,//best score
        "iS": 1,//is start
        "iO": _isover ? 1 : 0,//is over 
        "dT": new Date().toLocaleString(),//date time
        // "dA": JSON.stringify(dataArray),//data array//too much data
    }
    _currentUserGameRecord.record[`times${_times}`] = _currentTime;
    localStorage.setItem((JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-labyrinth-" + _gameInfo.gameInfo.totalPages), JSON.stringify(_currentUserGameRecord));
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
        gameScore -= 2;
    }
}
timer = setInterval(timerFunc, 1000);