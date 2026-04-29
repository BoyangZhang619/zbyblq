window.onload = () => {
    if (JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] !== "undefined") document.querySelector("#themeBlock").style.display = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`)).theme == "light" ? "none" : "block";
    [boxWidth, minesCount] = (JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-mineClearance-1`)).gameInfo.defaultWidth && JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-mineClearance-1`)).gameInfo.defaultWidth.split(",")) || [10, 16]
    boxWidth = +boxWidth;
    minesCount = +minesCount
    creatingBoxIndex = 0;
    min = 0, sec = 0, remMines = minesCount;
    isStart = false;
    isOver = false;
    isMapCreated = false;
    isClickAllowed = true;
    isDbClickAllowed = false;
    isRightClickAllowed = false;
    minElement = document.querySelectorAll(".showDiv")[0].children[0];
    secElement = document.querySelectorAll(".showDiv")[0].children[2];
    remMinesElement = document.querySelectorAll(".showDiv")[1].children[0];
    initialCreate(boxWidth);
}
window.addEventListener("resize", () => { pageStyleFunc(boxWidth) });
document.querySelector("#box").addEventListener("click", (event) => {
    console.log("click");
    event.preventDefault();
    if (!isClickAllowed) return;
    if (event.target.className == "cell") {
        isStart = true;
        let cellId = event.target.id.split("-");
        let row = parseInt(cellId[1]);
        let column = parseInt(cellId[2]);
        if (!isMapCreated) return createMineMap(row, column);
        if (dataArray[row][column].isShow || dataArray[row][column].isFlagged || dataArray[row][column].isQuestion) return;
        if (dataArray[row][column].isMine) return isGameOver("gameover");
        showEmpty(row, column);
        isGameOver();
    }
});

document.querySelector("#box").addEventListener("dblclick", (event) => {
    console.log("dbclick");
    event.preventDefault();
    if (!isDbClickAllowed) return;
    if (event.target.className == "cell") {
        let cellId = event.target.id.split("-");
        let row = parseInt(cellId[1]);
        let column = parseInt(cellId[2]);
        console.log(row, column);
        if (dataArray[row][column].isShow == true) {
            let mineCount = 0;
            if (row > 0 && column > 0) if (dataArray[row - 1][column - 1].isFlagged) mineCount++;
            if (row > 0) if (dataArray[row - 1][column].isFlagged) mineCount++;
            if (row > 0 && column < boxWidth - 1) if (dataArray[row - 1][column + 1].isFlagged) mineCount++;
            if (column > 0) if (dataArray[row][column - 1].isFlagged) mineCount++;
            if (column < boxWidth - 1) if (dataArray[row][column + 1].isFlagged) mineCount++;
            if (row < boxWidth - 1 && column > 0) if (dataArray[row + 1][column - 1].isFlagged) mineCount++;
            if (row < boxWidth - 1) if (dataArray[row + 1][column].isFlagged) mineCount++;
            if (row < boxWidth - 1 && column < boxWidth - 1) if (dataArray[row + 1][column + 1].isFlagged) mineCount++;
            if (mineCount == dataArray[row][column].isNumber) {
                if (row > 0 && column > 0) if (dataArray[row - 1][column - 1].isShow == null && dataArray[row - 1][column - 1].isFlagged != true) showEmpty(row - 1, column - 1);
                if (row > 0) if (dataArray[row - 1][column].isShow == null && dataArray[row - 1][column].isFlagged != true) showEmpty(row - 1, column);
                if (row > 0 && column < boxWidth - 1) if (dataArray[row - 1][column + 1].isShow == null && dataArray[row - 1][column + 1].isFlagged != true) showEmpty(row - 1, column + 1);
                if (column > 0) if (dataArray[row][column - 1].isShow == null && dataArray[row][column - 1].isFlagged != true) showEmpty(row, column - 1);
                if (column < boxWidth - 1) if (dataArray[row][column + 1].isShow == null && dataArray[row][column + 1].isFlagged != true) showEmpty(row, column + 1);
                if (row < boxWidth - 1 && column > 0) if (dataArray[row + 1][column - 1].isShow == null && dataArray[row + 1][column - 1].isFlagged != true) showEmpty(row + 1, column - 1);
                if (row < boxWidth - 1) if (dataArray[row + 1][column].isShow == null && dataArray[row + 1][column].isFlagged != true) showEmpty(row + 1, column);
                if (row < boxWidth - 1 && column < boxWidth - 1) if (dataArray[row + 1][column + 1].isShow == null && dataArray[row + 1][column + 1].isFlagged != true) showEmpty(row + 1, column + 1);
            }
        }
        isGameOver();
    }
});

document.querySelector("#box").addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (!isRightClickAllowed) return;
    if (event.target.className == "cell") {
        if (!isMapCreated) return;
        let cellId = event.target.id.split("-");
        let row = parseInt(cellId[1]);
        let column = parseInt(cellId[2]);
        if (dataArray[row][column].isShow == true) return;
        if (dataArray[row][column].isFlagged == null && dataArray[row][column].isFlagged == null && dataArray[row][column].isQuestion == null) {
            remMinesElement.textContent = --remMines;
            if (remMines < 0) alertInfo("The number of mines looks like unnormal.");
            dataArray[row][column].isFlagged = true;
            document.querySelector(`#cell-${row}-${column}`).textContent = "🚩";
        } else if (dataArray[row][column].isFlagged == true && dataArray[row][column].isQuestion == null) {
            remMinesElement.textContent = ++remMines;
            dataArray[row][column].isQuestion = true;
            dataArray[row][column].isFlagged = null;
            document.querySelector(`#cell-${row}-${column}`).textContent = "❓";
        } else if (dataArray[row][column].isQuestion == true) {
            dataArray[row][column].isQuestion = null;
            document.querySelector(`#cell-${row}-${column}`).textContent = "";
        }
    }
})

class ValueError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValueError";
    }
}

function initialCreate(_width, _setOfWidthAndMinesCount = null) {
    if (_width === null) {
        creatingBoxIndex = 0;
        isStart = false;
        isOver = true;
        isMapCreated = false;
        isClickAllowed = true;
        isDbClickAllowed = false;
        isRightClickAllowed = false;
        secElement.textContent = 0;
        minElement.textContent = 0;
        try {
            _setOfWidthAndMinesCount = _setOfWidthAndMinesCount.split(",");
            boxWidth = Number(_setOfWidthAndMinesCount[0]);
            minesCount = Number(_setOfWidthAndMinesCount[1]);
            if (isNaN(boxWidth) || isNaN(minesCount)) throw new ValueError("The width and the number of landmines must be integer numbers and separated by an English comma in the middle.");
            if (boxWidth < 10 || boxWidth > 40) throw new ValueError("The width must be between 10 and 40.");
            if (minesCount < 10 || minesCount > (boxWidth ** 2) / 2) throw new ValueError("The number of landmines must be between 10 and half of the total number of blocks.");
        } catch (e) {
            if (e instanceof ValueError) {
                alertInfo(e.message, "Error");
                console.error(e.message);
                return;
            } else {
                alertInfo("An unknown error occurred. Please try again.", "Error");
                return;
            }
        } finally {
            document.querySelector("#boxWHnum").value = "";
        }
        min = 0, sec = 0, remMines = minesCount;
        remMinesElement.textContent = minesCount;
        _width = boxWidth;
        let _gameInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-mineClearance-1`));
        _gameInfo.gameInfo.defaultWidth = boxWidth + "," + minesCount;
        localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-mineClearance-1`, JSON.stringify(_gameInfo))
    }
    dataArray = new Array(_width).fill([]).map(() => new Array(_width));
    for (let i = 0; i < _width; i++)for (let j = 0; j < _width; j++)dataArray[i][j] = {
        isEmpty: null,
        isNumber: null,
        isMine: null,
        isFlagged: null,
        isShow: null,
        isQuestion: null
    };
    document.querySelector("#box").innerHTML = "";
    creatingBoxIndex = 0;
    let promise = new Promise(resolve => {
        setTimeout(() => resolve())
    });
    promise.then(creatingBlocks());
    function creatingBlocks() {
        console.log(boxWidth);
        document.querySelector("#wait").textContent = `Please Wait A Moment(${((creatingBoxIndex + 1) / boxWidth * 100).toFixed(0)}%)`;
        let row = document.createElement("ul");
        row.className = "row";
        row.id = `row-${creatingBoxIndex}`;
        for (let i = 0; i < boxWidth; i++) {
            let cell = document.createElement("li");
            cell.className = "cell";
            cell.id = `cell-${creatingBoxIndex}-${i}`;
            row.appendChild(cell);
        }
        document.querySelector("#box").appendChild(row);
        for (let i = 0; i < boxWidth; i++) {
            document.querySelector(`#cell-${creatingBoxIndex}-${i}`).style.backgroundColor = "rgb(132, 117, 106)";
        }
        creatingBoxIndex++;
        if (creatingBoxIndex < boxWidth) {
            setTimeout(creatingBlocks, 0);
        } else {
            document.querySelector("#wait").style.display = "none";
            document.querySelector("#box").style.display = "block";
            pageStyleFunc(boxWidth);
        }
    }
}

function createMineMap(_row, _column) {
    // make sure the first click is not a mine
    if (_row > 0 && _column > 0) for (let i = _row - 1; i <= _row; i++) for (let j = _column - 1; j <= _column; j++)  dataArray[i][j].isMine = false;
    if (_row > 0 && _column < boxWidth - 1) for (let i = _row - 1; i <= _row; i++) for (let j = _column; j <= _column + 1; j++)dataArray[i][j].isMine = false;
    if (_row < boxWidth - 1 && _column > 0) for (let i = _row; i <= _row + 1; i++) for (let j = _column - 1; j <= _column; j++)dataArray[i][j].isMine = false;
    if (_row < boxWidth - 1 && _column < boxWidth - 1) for (let i = _row; i <= _row + 1; i++) for (let j = _column; j <= _column + 1; j++)dataArray[i][j].isMine = false;
    // create mines
    let unputtedMines = minesCount;
    do {
        let currentRow = Math.floor(Math.random() * boxWidth);
        let currentColumn = Math.floor(Math.random() * boxWidth);
        if (dataArray[currentRow][currentColumn].isMine == null) {
            dataArray[currentRow][currentColumn].isMine = true;
            unputtedMines--;
        }
    } while (unputtedMines > 0)
    // create numbers
    for (let i = 0; i < boxWidth; i++) {
        for (let j = 0; j < boxWidth; j++) {
            if (!dataArray[i][j].isMine) {
                let mineCount = 0;
                if (i > 0 && j > 0) if (dataArray[i - 1][j - 1].isMine) mineCount++;
                if (i > 0) if (dataArray[i - 1][j].isMine) mineCount++;
                if (i > 0 && j < boxWidth - 1) if (dataArray[i - 1][j + 1].isMine) mineCount++;
                if (j > 0) if (dataArray[i][j - 1].isMine) mineCount++;
                if (j < boxWidth - 1) if (dataArray[i][j + 1].isMine) mineCount++;
                if (i < boxWidth - 1 && j > 0) if (dataArray[i + 1][j - 1].isMine) mineCount++;
                if (i < boxWidth - 1) if (dataArray[i + 1][j].isMine) mineCount++;
                if (i < boxWidth - 1 && j < boxWidth - 1) if (dataArray[i + 1][j + 1].isMine) mineCount++;
                if (mineCount == 0) {
                    dataArray[i][j].isEmpty = true;
                    continue;
                }
                dataArray[i][j].isNumber = mineCount;
            }
        }
    }
    isOver = false;
    isMapCreated = true;
    isDbClickAllowed = true;
    isRightClickAllowed = true;
    remMinesElement.textContent = minesCount;
    showEmpty(_row, _column);
    isGameOver();
}

function showEmpty(_row, _column) {
    if (dataArray[_row][_column].isMine) return isGameOver("gameover");
    if (dataArray[_row][_column].isNumber) {
        document.querySelector(`#cell-${_row}-${_column}`).textContent = dataArray[_row][_column].isNumber;
        document.querySelector(`#cell-${_row}-${_column}`).style.backgroundColor = "rgb(248, 247, 240)";
    }
    showEmptyRecursion(_row, _column);
    function showEmptyRecursion(_row, _column) {
        if (dataArray[_row][_column].isShow) return;
        dataArray[_row][_column].isShow = true;
        document.querySelector(`#cell-${_row}-${_column}`).style.backgroundColor = "rgb(248, 247, 240)";
        if (dataArray[_row][_column].isNumber) {
            document.querySelector(`#cell-${_row}-${_column}`).textContent = dataArray[_row][_column].isNumber;
            return;
        }
        if (_row > 0 && _column > 0) showEmptyRecursion(_row - 1, _column - 1);
        if (_row > 0) showEmptyRecursion(_row - 1, _column);
        if (_row > 0 && _column < boxWidth - 1) showEmptyRecursion(_row - 1, _column + 1);
        if (_column > 0) showEmptyRecursion(_row, _column - 1);
        if (_column < boxWidth - 1) showEmptyRecursion(_row, _column + 1);
        if (_row < boxWidth - 1 && _column > 0) showEmptyRecursion(_row + 1, _column - 1);
        if (_row < boxWidth - 1) showEmptyRecursion(_row + 1, _column);
        if (_row < boxWidth - 1 && _column < boxWidth - 1) showEmptyRecursion(_row + 1, _column + 1);
    }
}

function showAll() {
    for (let i = 0; i < boxWidth; i++) for (let j = 0; j < boxWidth; j++) {
        dataArray[i][j].isShow = true;
        document.querySelector(`#cell-${i}-${j}`).style.backgroundColor = "rgb(248, 247, 240)";
        if (dataArray[i][j].isMine) document.querySelector(`#cell-${i}-${j}`).textContent = "💣";
        else if (dataArray[i][j].isNumber !== null) document.querySelector(`#cell-${i}-${j}`).textContent = dataArray[i][j].isNumber;
    }
}
function isGameOver(_result = null) {
    if (_result === "gameover") {
        infoT();
        remMinesElement.textContent = 0;
        isStart = false;
        isOver = true;
        showAll();
        alertInfo("Game over,you got lose!");
        setTimeout(() => restart(), 1500)
    }
    if (_result === null) {
        let isAllShow = true;
        for (let i = 0; i < boxWidth; i++) {
            for (let j = 0; j < boxWidth; j++) {
                if (dataArray[i][j].isShow == null && !dataArray[i][j].isMine) {
                    isAllShow = false;
                    break;
                }
            }
            if (!isAllShow) break;
        }
        if (isAllShow) {
            remMinesElement.textContent = 0;
            isStart = false;
            isOver = true;
            infoT();
            showAll();
            alertInfo("Game over,you got success!");
            setTimeout(() => restart(), 1000)
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

function infoT(_isover = true) {
    let _gameInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-mineClearance-1`));
    _gameInfo.gameInfo.totalTimes += 1;
    if (_gameInfo.gameInfo.totalTimes % 10 == 1 && _gameInfo.gameInfo.totalTimes != 1) {
        _gameInfo.gameInfo.totalPages += 1;
        localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-mineClearance-${_gameInfo.gameInfo.totalPages}`, JSON.stringify({ "record": { "times0": { "this one isn't a record": "undefined" } } }));
    }
    localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-mineClearance-1`, JSON.stringify(_gameInfo));
    let _times = Object.keys(JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-mineClearance-" + _gameInfo.gameInfo.totalPages)).record).length;
    let _currentUserGameRecord = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-mineClearance-" + _gameInfo.gameInfo.totalPages));
    let _currentTime = {
        "t": min * 60 + sec,//time
        "w": boxWidth,//width
        "mN": null,//max number
        "iS": 1,//is start
        "iO": isOver && _isover,//is over 
        "mC": minesCount,//mines count
        "dT": new Date().toLocaleString(),//date time
        // "dA": JSON.stringify(dataArray),//data array//the data array is too large to store in local storage
    }
    _currentUserGameRecord.record[`times${_times}`] = _currentTime;
    localStorage.setItem((JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-mineClearance-" + _gameInfo.gameInfo.totalPages), JSON.stringify(_currentUserGameRecord));
}

function restart() {
    if (isStart) infoT(false)
    initialCreate(null, `${boxWidth},${minesCount}`);
}

function pause() {
    if (isOver) return;
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