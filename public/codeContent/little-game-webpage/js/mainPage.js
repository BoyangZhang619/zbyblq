window.onload = function () {
    ["record", "account", "language", "theme", "about", "help"].forEach((elem) => settings(elem, true));// Initialization,create all the element
    info = navigator.userAgent;
    isPhone = /mobile/i.test(info); // if it's a mobile device, isPhone = true
    recordGameType = null;
    if (localStorage.getItem("isInfoTransferOpen") === null) {// localStorage
        localStorage.setItem("allUsers", JSON.stringify({ "_currentUser": "undefined" }));
        localStorage.setItem("userDevice", JSON.stringify({ "isPhone": isPhone }));
        localStorage.setItem("isInfoTransferOpen", "of course!");
    }
    if (JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] !== "undefined") {
        document.querySelector("#login").style.display = "none";
        // if the user name is not empty, hide the login part
        isLogin = true;
        document.querySelector("#hello").textContent = `Hello, ${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}`;
        document.querySelector("#hello").style.display = "block";
        document.querySelector("#themeBlock").style.display = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`)).theme == "light" ? "none" : "block";
        // JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-${}`)).gameInfo.totalTimes
    } else {
        document.querySelector("#login").style.display = "block";
    }
}
let isLogin = false;
let selectGameType = "";
document.addEventListener("click", (event) => {
    let targetLi = event.target.closest(".recordNav>li>ul>li");
    console.log("event.target.textContent");
    if (targetLi) {
        let allLis = document.querySelectorAll(".recordNav>li>ul>li");
        let lastLi = allLis[allLis.length - 1];
        recordChanged(recordGameType, true, event.target.textContent, allLis.length, lastLi.textContent, recordGameType);
        return;
    }
    let preLi = event.target.closest(".recordNav>li.pre");
    if (preLi) {
        console.log("preLi");
        let _gameInfo = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-" + recordGameType + "-1")).gameInfo;
        if (_gameInfo.currentShowedPage == 1) return;
        let allLis = document.querySelectorAll(".recordNav>li>ul>li");
        let lastLi = allLis[allLis.length - 1];
        recordChanged(recordGameType, true, Number(_gameInfo.currentShowedPage) - 1, allLis.length, lastLi.textContent, recordGameType);
        return;
    }
    let nextLi = event.target.closest(".recordNav>li.next");
    if (nextLi) {
        console.log("nextLi");
        let _gameInfo = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-" + recordGameType + "-1")).gameInfo;
        if (_gameInfo.currentShowedPage == _gameInfo.totalPages) return console.log(_gameInfo.currentShowedPage == _gameInfo.totalPages);
        let allLis = document.querySelectorAll(".recordNav>li>ul>li");
        let lastLi = allLis[allLis.length - 1];
        recordChanged(recordGameType, true, Number(_gameInfo.currentShowedPage) + 1, allLis.length, lastLi.textContent, recordGameType);
        return;
    }
})
function recordChanged(_type, _isUseNavOnly = false, ...infoArr) {
    console.log(infoArr)
    if (_isUseNavOnly) return recordNavCompute(...infoArr);
    recordGameType = _type;
    if (!isLogin) return alertInfo("Please login to get your record.", "Error");
    _currentShowedPage = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-" + _type + "-1")).gameInfo.currentShowedPage;
    switch (_type) {
        case "game2048": showGame2048Record(_currentShowedPage); break;
        case "labyrinth": showLabyrinthRecord(_currentShowedPage); break;
        case "mineClearance": showMineClearanceRecord(_currentShowedPage); break;
        case "klotski": showKlotskiRecord(_currentShowedPage); break;
        default: console.log("why can you get this case?"); break;
    }
    function showGame2048Record(_page, _isReloadNav = true) {
        console.log("isReloadNav", _isReloadNav)
        let _temporaryString = `<h1 class="interpElem">Record of game2048</h1><hr/><ul class="recordList">`;
        let _game2048Info = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-game2048-1")).gameInfo;
        let _game2048Record = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-game2048-" + _page));
        console.log(_game2048Record)
        for (i = Object.keys(_game2048Record.record).length - 1; i > 0; i--) {
            recordTypeKey = Object.keys(_game2048Record.record)[i];
            _temporaryString += `<li class="recordListChoice interpElem">
            <div>Step<hr/><strong>${_game2048Record.record[recordTypeKey].s}</strong></div>
            <div>Time<hr/><strong>${_game2048Record.record[recordTypeKey].t}</strong></div>
            <div>Score<hr/><strong>${_game2048Record.record[recordTypeKey].bS}</strong></div>
            <div>Num<hr/><strong>${_game2048Record.record[recordTypeKey].mN}</strong></div>
            <div>Data<hr/><div id="recordListDateSearch" onclick="alertInfo('Write time: ${_game2048Record.record[recordTypeKey].dT}\\nFinal array:${_game2048Record.record[recordTypeKey].dA}')">click</div></div>
            </li>`;
        }
        _temporaryString += `<li class="recordListChoice interpElem" style="line-height:15vh" onclick="selectGame(null,'game2048');selectGame(null,0);">let's play more!</li></ul>`;
        _temporaryString += "<ul class='recordNav'><li class='pre'>pre</li><li><ul>";
        for (i = 1; i <= _game2048Info.totalPages; i++) {
            if (i == 6) break;
            _temporaryString += "<li></li>";
        }
        --i;
        _temporaryString += "</ul></li><li class='next'>next</li></ul>";
        document.querySelector("#recordContent").innerHTML = _temporaryString;
        document.querySelectorAll(".recordNav>li>ul>li").forEach(elem => {
            elem.style.margin = `.5vw calc(${(31 - 4 * i) / (2 * i)}vw - ${20 / (2 * i)}px)`;
        });
        recordNavCompute(_page, i, _game2048Info.totalPages)
        _temporaryString = null;
    }
    function showLabyrinthRecord(_page, _isReloadNav = true) {
        console.log("isReloadNav", _isReloadNav)
        let _temporaryString = `<h1 class="interpElem">Record of labyrinth</h1><hr/><ul class="recordList">`;
        let _labyrinthInfo = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-labyrinth-1")).gameInfo;
        let _labyrinthRecord = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-labyrinth-" + _page));
        console.log(_labyrinthRecord)
        for (i = Object.keys(_labyrinthRecord.record).length - 1; i > 0; i--) {
            recordTypeKey = Object.keys(_labyrinthRecord.record)[i];
            _temporaryString += `<li class="recordListChoice interpElem">
            <div>Step<hr/><strong>${_labyrinthRecord.record[recordTypeKey].s}</strong></div>
            <div>Time<hr/><strong>${_labyrinthRecord.record[recordTypeKey].t}</strong></div>
            <div>Width<hr/><strong>${_labyrinthRecord.record[recordTypeKey].w}</strong></div>
            <div>Score<hr/><strong>${_labyrinthRecord.record[recordTypeKey].bS}</strong></div>
            <div>Data<hr/><div id="recordListDateSearch" onclick="alertInfo('Write time: ${_labyrinthRecord.record[recordTypeKey].dT}')">click</div></div>
            </li>`;
        }
        _temporaryString += `<li class="recordListChoice interpElem" style="line-height:15vh" onclick="selectGame(null,'labyrinth');selectGame(null,0);">let's play more!</li></ul>`;
        _temporaryString += "<ul class='recordNav'><li class='pre'>pre</li><li><ul>";
        for (i = 1; i <= _labyrinthInfo.totalPages; i++) {
            if (i == 6) break;
            _temporaryString += "<li></li>";
        }
        --i;
        _temporaryString += "</ul></li><li class='next'>next</li></ul>";
        document.querySelector("#recordContent").innerHTML = _temporaryString;
        document.querySelectorAll(".recordNav>li>ul>li").forEach(elem => {
            elem.style.margin = `.5vw calc(${(31 - 4 * i) / (2 * i)}vw - ${20 / (2 * i)}px)`;
        });
        recordNavCompute(_page, i, _labyrinthInfo.totalPages)
        _temporaryString = null;
    }
    function showMineClearanceRecord(_page, _isReloadNav = true) {
        console.log("isReloadNav", _isReloadNav)
        let _temporaryString = `<h1 class="interpElem">Record of mineClearance</h1><hr/><ul class="recordList">`;
        let _mineClearanceInfo = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-mineClearance-1")).gameInfo;
        let _mineClearanceRecord = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-mineClearance-" + _page));
        console.log(_mineClearanceRecord)
        for (i = Object.keys(_mineClearanceRecord.record).length - 1; i > 0; i--) {
            recordTypeKey = Object.keys(_mineClearanceRecord.record)[i];
            let _isOver = _mineClearanceRecord.record[recordTypeKey].iO === true ? "WIN" : "FAIL";
            _temporaryString += `<li class="recordListChoice interpElem">
            <div>Time<hr/><strong>${_mineClearanceRecord.record[recordTypeKey].t}</strong></div>
            <div>Width<hr/><strong>${_mineClearanceRecord.record[recordTypeKey].w}</strong></div>
            <div>Mines<hr/><strong>${_mineClearanceRecord.record[recordTypeKey].mC}</strong></div>
            <div>Result<hr/><strong>${_isOver}</strong></div>
            <div>Data<hr/><div id="recordListDateSearch" onclick="alertInfo('Write time: ${_mineClearanceRecord.record[recordTypeKey].dT}')">click</div></div>
            </li>`;
        }
        _temporaryString += `<li class="recordListChoice interpElem" style="line-height:15vh" onclick="selectGame(null,'mineClearance');selectGame(null,0);">let's play more!</li></ul>`;
        _temporaryString += "<ul class='recordNav'><li class='pre'>pre</li><li><ul>";
        for (i = 1; i <= _mineClearanceInfo.totalPages; i++) {
            if (i == 6) break;
            _temporaryString += "<li></li>";
        }
        --i;
        _temporaryString += "</ul></li><li class='next'>next</li></ul>";
        document.querySelector("#recordContent").innerHTML = _temporaryString;
        document.querySelectorAll(".recordNav>li>ul>li").forEach(elem => {
            elem.style.margin = `.5vw calc(${(31 - 4 * i) / (2 * i)}vw - ${20 / (2 * i)}px)`;
        });
        recordNavCompute(_page, i, _mineClearanceInfo.totalPages)
        _temporaryString = null;
    }
    function showKlotskiRecord(_page, _isReloadNav = true) {
        console.log("isReloadNav", _isReloadNav)
        let _temporaryString = `<h1 class="interpElem">Record of klotski</h1><hr/><ul class="recordList">`;
        let _klotskiInfo = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-klotski-1")).gameInfo;
        let _klotskiRecord = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-klotski-" + _page));
        console.log(_klotskiRecord)
        for (i = Object.keys(_klotskiRecord.record).length - 1; i > 0; i--) {
            recordTypeKey = Object.keys(_klotskiRecord.record)[i];
            _temporaryString += `<li class="recordListChoice interpElem">
            <div>Step<hr/><strong>${_klotskiRecord.record[recordTypeKey].s}</strong></div>
            <div>Time<hr/><strong>${_klotskiRecord.record[recordTypeKey].t}</strong></div>
            <div>Width<hr/><strong>${_klotskiRecord.record[recordTypeKey].w}</strong></div>
            <div>Result<hr/><strong>${_klotskiRecord.record[recordTypeKey].iO}</strong></div>
            <div>Data<hr/><div id="recordListDateSearch" onclick="alertInfo('Write time: ${_klotskiRecord.record[recordTypeKey].dT}\\nFinal array:${_klotskiRecord.record[recordTypeKey].dA}')">click</div></div>
            </li>`;
        }
        _temporaryString += `<li class="recordListChoice interpElem" style="line-height:15vh" onclick="selectGame(null,'klotski');selectGame(null,0);">let's play more!</li></ul>`;
        _temporaryString += "<ul class='recordNav'><li class='pre'>pre</li><li><ul>";
        for (i = 1; i <= _klotskiInfo.totalPages; i++) {
            if (i == 6) break;
            _temporaryString += "<li></li>";
        }
        --i;
        _temporaryString += "</ul></li><li class='next'>next</li></ul>";
        document.querySelector("#recordContent").innerHTML = _temporaryString;
        document.querySelectorAll(".recordNav>li>ul>li").forEach(elem => {
            elem.style.margin = `.5vw calc(${(31 - 4 * i) / (2 * i)}vw - ${20 / (2 * i)}px)`;
        });
        recordNavCompute(_page, i, _klotskiInfo.totalPages)
        _temporaryString = null;
    }
    function recordNavCompute(_currentPage = 1, _showedPagesNum, _allPages, _type = null) {
        console.log(_currentPage, _showedPagesNum, _allPages, _type)
        if (_type != null) {
            let _gameInfo = JSON.parse(localStorage.getItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-" + _type + "-1"));
            _gameInfo.gameInfo.currentShowedPage = _currentPage;
            localStorage.setItem(JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] + "-" + _type + "-1", JSON.stringify(_gameInfo));
        }
        let _lis = document.querySelectorAll(".recordNav>li>ul>li")
        if (_allPages <= 5) {
            _lis.forEach((elem, index) => elem.textContent = index + 1);
            _lis.forEach(elem => elem.style.backgroundColor = "rgba(240, 248, 255, 0.825)");
            _lis[_currentPage - 1].style.backgroundColor = "rgba(86, 66, 50, 0.375)";
            if (_type != null) eval(`show${(_type + "").charAt(0).toUpperCase() + (_type + "").slice(1)}Record(${_currentPage},false)`);
        }
        if (_allPages > 5 && _currentPage <= 3) {
            _lis[0].textContent = 1;
            _lis[1].textContent = 2;
            _lis[2].textContent = 3;
            _lis[3].textContent = Math.floor((3 + Number(_allPages)) / 2);
            _lis[4].textContent = _allPages;
            _lis.forEach(elem => elem.style.backgroundColor = "rgba(240, 248, 255, 0.825)");
            _lis[_currentPage - 1].style.backgroundColor = "rgba(86, 66, 50, 0.375)";
            if (_type != null) eval(`show${(_type + "").charAt(0).toUpperCase() + (_type + "").slice(1)}Record(${_currentPage},false)`);
        }
        if (_allPages > 5 && _currentPage >= _allPages - 2) {
            _lis[0].textContent = 1;
            _lis[1].textContent = Math.floor((Number(_allPages) - 1) / 2);
            _lis[2].textContent = _allPages - 2;
            _lis[3].textContent = _allPages - 1;
            _lis[4].textContent = _allPages;
            _lis.forEach(elem => elem.style.backgroundColor = "rgba(240, 248, 255, 0.825)");
            _lis[4 - (_allPages - _currentPage)].style.backgroundColor = "rgba(86, 66, 50, 0.375)";
            if (_type != null) eval(`show${(_type + "").charAt(0).toUpperCase() + (_type + "").slice(1)}Record(${_currentPage},false)`);
        }
        if (_allPages > 5 && _currentPage < _allPages - 2 && _currentPage > 3) {
            _lis[0].textContent = 1;
            _lis[1].textContent = Math.floor((Number(_currentPage) + 1) / 2);
            _lis[2].textContent = _currentPage;
            _lis[3].textContent = Math.floor((Number(_currentPage) + Number(_allPages)) / 2);
            _lis[4].textContent = _allPages;
            _lis.forEach(elem => elem.style.backgroundColor = "rgba(240, 248, 255, 0.825)");
            _lis[2].style.backgroundColor = "rgba(86, 66, 50, 0.375)";
            if (_type != null) eval(`show${(_type + "").charAt(0).toUpperCase() + (_type + "").slice(1)}Record(${_currentPage},false)`);
        }
    }
}
function langChanged(type) {
    if (!isLogin) return alertInfo("Please login to change the language.", "Error");
    let _userInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`));
    _userInfo.language = type;
    localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`, JSON.stringify(_userInfo));
    // there will be a language change function in the future
    console.log(`language is changed to ${type},however, there is no language change function now`);
}
function themeChanged(type) {
    if (!isLogin) return alertInfo("Please login to change the theme.", "Error");
    let _userInfo = JSON.parse(localStorage.getItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`));
    _userInfo.theme = type;
    document.querySelector("#themeBlock").style.display = type == "light" ? "none" : "block";
    localStorage.setItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`, JSON.stringify(_userInfo));
    console.log(`theme is changed to ${type},however, there is no theme change function now`);
}

function partsSwitch() {
    let selectGamePart = document.querySelector("#selectGamePart");
    let settingPart = document.querySelector("#settingPart");
    let loginPart = document.querySelector("#login");
    let helloPart = document.querySelector("#hello");
    if (window.getComputedStyle(settingPart).display === "none") {
        selectGamePart.style.display = "none";
        loginPart.style.display = "none";
        helloPart.style.display = "none";
        settingPart.style.display = "block";
        return console.log("settingPart is displayed");
    } else {
        selectGamePart.style.display = "block";
        if (JSON.parse(localStorage.getItem("allUsers"))["_currentUser"] !== "undefined") helloPart.style.display = "block";
        else loginPart.style.display = "block";
        settingPart.style.display = "none";
        settings("other", true)
        return console.log("selectGamePart is displayed");
    }
}

function settings(type, _isInitialization = false, _aboutSentence, _helpSentence, _otherSentence) {
    _aboutSentence = _aboutSentence || "This is a simple webpage.The only one creater is me, who is a student in SZPU university. I am learning web development and this is my first project. I hope you like it!";
    _helpSentence = _helpSentence || "This is a simple webpage.If you have any question about this webpage,please enter <a href='http://chat.deepseek.com' target='_blank'>this page</a>.";
    _otherSentence = _otherSentence || "There are some webpage for other things might be useful or funny before my truemainpage getting run.";
    document.querySelectorAll("#main>main>div[id$=Content]").forEach((elem) => {
        elem.style.display = "none";
    });
    if (!_isInitialization) {
        document.querySelector(`#${type}Content`).style.display = "block";
        if (type) buttonDown(type);
    }
    switch (type) {
        case "record": record(); break;
        case "account": account(); break;
        case "language": language(); break;
        case "theme": theme(); break;
        case "about": about(); break;
        case "help": help(); break;
        case "other": other();break;
        default: console.log("why can you get this case?"); break;
    }
    function buttonDown(type) {
        console.log(type)
        if (type === null || type === "other") return;
        document.querySelectorAll("#aside li").forEach((elem) => {
            elem.style.boxShadow = "2px 2px 10px 1px rgba(86, 66, 50, 0.685)";
        });
        document.querySelector("#setting-" + type).style.boxShadow = ".5px .5px 3px 1px rgba(86, 66, 50, 0.877)";
    }
    function record() {
        document.querySelector("#recordContent").innerHTML = `<h1 class="interpElem">Record</h1><hr/>${["game2048", "labyrinth", "mineClearance", "klotski"].map(recordGameType => `<div class="recordChoice interpElem" onclick='recordChanged("${recordGameType}")'>${recordGameType}</div>`).join("")}`;
    }
    function account() {
        document.querySelector("#accountContent").innerHTML = `<h1 class="interpElem">account</h1><hr/>${["logout", "deleteAccount"].map(option => `<div class="accountChoice interpElem" onclick='${option}()'>${option}</div>`).join("")}`;
    }
    function language() {
        document.querySelector("#languageContent").innerHTML = `<h1 class="interpElem">Language</h1><hr/>${["English", "Chinese", "Copperplate"].map(langType => `<div class="languageChoice interpElem" onclick='langChanged("${langType}")'>${langType}</div>`).join("")}`;
    }
    function theme() {
        document.querySelector("#themeContent").innerHTML = `<h1 class="interpElem">Theme</h1><hr/>${["light", "dark"].map(themeType => `<div class="themeChoice interpElem" onclick='themeChanged("${themeType}")'>${themeType}</div>`).join("")}`;
    }
    function about() {
        document.querySelector("#aboutContent").innerHTML = `<h1 class="interpElem">About</h1><hr/><p class="interpElem">${_aboutSentence}</p>`;
    }
    function help() {
        document.querySelector("#helpContent").innerHTML = `<h1 class="interpElem">help</h1><hr/><p class="interpElem">${_helpSentence}</p>`;
    }
    function other() {
        document.querySelector("#otherContent").innerHTML = `<h1 class="interpElem">Other</h1><hr/><p class="interpElem">${_helpSentence}</p>${["FontTransform"].map(otherType => `<div class="otherChoice interpElem" onclick='otherChanged("${otherType}")'>${otherType}</div>`).join("")}`;
    }
    return console.log(`${type} function is called`);
}


function selectGame(self, type = 1) {
    if (!isLogin) return alertInfo("Please login to change the enter game.", "Error");
    selectGameType = type ? type : selectGameType;
    if (!type && selectGameType !== "") window.open(`./html/${selectGameType}.html`, "_self");
    if (type) buttonDown(self);
    function buttonDown(self) {
        if (self === null) return;
        document.querySelectorAll("#aside li").forEach((elem) => {
            elem.style.boxShadow = "2px 2px 10px 1px rgba(86, 66, 50, 0.685)";
        });
        self.style.boxShadow = ".5px .5px 3px 1px rgba(86, 66, 50, 0.877)";
    }
    return console.log(`game type is ${selectGameType}`);
}

function login() {
    let _username = document.querySelector("#username").value;
    let _password = document.querySelector("#password").value;
    if (_username.replaceAll(" ", "") === "" || _password.replaceAll(" ", "") === "") return alertInfo("Please enter your username and password.", "Error");
    try { if (JSON.parse(localStorage.getItem("allUsers"))[_username] === null || atob(JSON.parse(localStorage.getItem("allUsers"))[_username]) !== _password || _username == "_currentUser" || _username == "undefined") return alertInfo("Username or password is incorrect or haven't registered. Please try again.", "Error"); }
    catch { return alertInfo("Username or password is incorrect or haven't registered. Please try again..", "Error"); }
    let _allUsers = JSON.parse(localStorage.getItem("allUsers"));
    _allUsers["_currentUser"] = _username;
    localStorage.setItem("allUsers", JSON.stringify(_allUsers));
    document.querySelector("#password").value = "";
    document.querySelector("#login").style.display = "none";
    document.querySelector("#hello").textContent = `Hello, ${_username}`;
    document.querySelector("#hello").style.display = "block";
    isLogin = true;
}

function register() {
    let _username = document.querySelector("#username").value;
    let _password = document.querySelector("#password").value;
    let _isUsernameExist = !!JSON.parse(localStorage.getItem("allUsers"))[_username];
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[a-zA-Z0-9]{6,}$/;
    if (_username.replaceAll(" ", "") === "" || _password.replaceAll(" ", "") === "") return alertInfo("Please enter your username and password.", "Error");
    if (_isUsernameExist) return alertInfo("This username already exists. Please choose another one or login this account.", "Error");
    else if (!passwordRegex.test(_password)) return alertInfo("Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.", "Error");
    let _allUsers = JSON.parse(localStorage.getItem("allUsers"));
    _allUsers[_username] = btoa(_password);
    localStorage.setItem("allUsers", JSON.stringify(_allUsers));
    ["game2048", "labyrinth", "mineClearance", "klotski"].forEach((elem) => {
        localStorage.setItem(`${_username}-${elem}-1`, JSON.stringify({ "gameInfo": { "totalTimes": 0, "totalPages": 1, "defaultWidth": null, "currentShowedPage": 1 }, "record": { "times0": { "this one isn't a record": "undefined" } } }));
    });
    localStorage.setItem(`${_username}-info`, JSON.stringify({ "language": "English", "theme": "light" }));
    document.querySelector("#password").value = "";
    alertInfo("you have registered successfully! Please login to continue.");
    // there will be some thing about register
}

function logout() {
    if (!isLogin) return alertInfo("Please login to logout.");
    let _allUsers = JSON.parse(localStorage.getItem("allUsers"));
    _allUsers["_currentUser"] = "undefined";
    localStorage.setItem("allUsers", JSON.stringify(_allUsers));
    partsSwitch()
    document.querySelector("#login").style.display = "block";
    document.querySelector("#hello").style.display = "none";
    isLogin = false;
}

function deleteAccount() {
    if (!isLogin) return alertInfo("Please login to delete your account.");
    let _allUsers = JSON.parse(localStorage.getItem("allUsers"));
    ["game2048", "labyrinth", "mineClearance", "klotski"].forEach((elem) => {
        for (let i = JSON.parse(localStorage.getItem(`${_allUsers["_currentUser"]}-${elem}-1`)).gameInfo.totalPages; i >= 1; i--)
            localStorage.removeItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-${elem}-${i}`);
    });
    localStorage.removeItem(`${JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]}-info`);
    delete _allUsers[JSON.parse(localStorage.getItem("allUsers"))["_currentUser"]];
    _allUsers["_currentUser"] = "undefined";
    localStorage.setItem("allUsers", JSON.stringify(_allUsers));
    partsSwitch()
    document.querySelector("#login").style.display = "block";
    document.querySelector("#hello").style.display = "none";
    isLogin = false;
}