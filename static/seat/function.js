var isfocus = 0;
var mode = 0;
var macro = [2, 5];
var remove = 0;
function changeTitle() {
    document.getElementById("title").style.padding = "7px 20px 0px 20px";
    document.getElementById("title").style.border = "2px solid white";
    document.getElementById("title").innerHTML = "교탁";
}

document.onkeydown = keyDown;
function keyDown(event) {
    var key = event.which || event.keyCode;
    if (isfocus === 1) {
        return;
    }
    switch (key) {
        case 69:
            createButtonPressed();
            break;
        case 81:
            maleButtonPressed();
            break;
        case 82:
            removeButtonPressed();
            break;
        case 87:
            constButtonPressed();
            break;
    }
    if (isfocus === 2 || isfocus === 3) {
        if (key === 27) {
            document.getElementsByClassName("createbox")[0].style.display =
                "none";
            document.getElementsByClassName("removebox")[0].style.display =
                "none";
        }
        if (isfocus === 2 && key === 13) {
            createTableWithButton();
        }
        if (isfocus === 3 && key === 13) {
            removeTableWithButton();
        }
    }
}
function createButtonPressed() {
    var box = document.getElementsByClassName("createbox")[0];
    var antibox = document.getElementsByClassName("removebox")[0];
    var input = document.getElementsByClassName("createbox_input")[0];
    document.getElementsByClassName("removebutton")[0].classList.remove("on");
    document.getElementsByClassName("createbutton")[0].classList.toggle("on");
    if (box.style.display === "none") {
        box.style.display = "inline-block";
        antibox.style.display = "none";
        input.value = "";
        input.focus();
    } else {
        box.style.display = "none";
    }
}

function removeButtonPressed() {
    var box = document.getElementsByClassName("removebox")[0];
    var antibox = document.getElementsByClassName("createbox")[0];
    var msg = document.getElementsByClassName("removebox_msg")[0];
    var input = document.getElementsByClassName("removebox_input")[0];
    var button = document.getElementsByClassName("removebox_button")[0];
    var table = document.getElementsByClassName("table");
    document.getElementsByClassName("createbutton")[0].classList.remove("on");
    document.getElementsByClassName("removebutton")[0].classList.toggle("on");
    if (box.style.display === "none") {
        box.style.display = "inline-block";
        antibox.style.display = "none";
        input.value = "";
        if (table.length === 0) {
            msg.innerHTML = "더 이상 지울 분단이 없습니다!";
            input.placeholder = "지울 분단 없음!";
            input.disabled = true;
            button.disabled = true;
        } else {
            if (table.length === 1) {
                msg.innerHTML = "1분단을 지우시겠어요?";
                input.value = 1;
                input.disabled = false;
                input.readOnly = true;
                button.disabled = false;
            } else {
                input.disabled = false;
                input.readOnly = false;
                button.disabled = false;
                input.placeholder = table.length;
                if (remove === 0) {
                    msg.innerHTML =
                        "<span style = 'font-weight: 600;'>입력 방법: </span>" +
                        table.length +
                        "분단: " +
                        "<span style = 'color: yellow; font-weight: 600;'>" +
                        table.length +
                        "</span>";
                } else {
                    msg.innerHTML =
                        "입력란을 비우실 경우 마지막 분단인 <span style = 'font-weight: 600; color: yellow;'>" +
                        table.length +
                        "</span> 분단을 지우겠습니다.";
                }
            }
        }
        input.focus();
    } else {
        box.style.display = "none";
    }
}

function createTableWithButton() {
    var input_x = document.getElementsByClassName("createbox_input_x")[0];
    var input_y = document.getElementsByClassName("createbox_input_y")[0];
    var msg = document.getElementsByClassName("createbox_msg")[0];
    if (!input_x.value || !input_y.value) {
        alert("가로와 세로를 모두 입력해주세요");
        return;
    }
    splitAnswer = [input_x.value, input_y.value];
    if (splitAnswer.length === 2) {
        var rows = Number(splitAnswer[0]);
        var columns = Number(splitAnswer[1]);
        if (rows % 1 === 0 && rows > 0 && columns % 1 === 0 && columns > 0) {
            if (rows <= 30 && columns <= 30) {
                macro[0] = input_x.value;
                macro[1] = input_y.value;
                createTableAuto(rows, columns);
                changeTitle();
            } else {
                msg.innerHTML =
                    "너무 큰 수는 힘들어요. <span style = 'font-weight: 600; color: yellow;'>10 이하의 숫자</span>로 입력해 주시겠어요?";
            }
        } else {
            msg.innerHTML =
                "분단의 크기는 <span style = 'font-weight: 600; color: yellow;'>자연수</span>로만 입력해 주세요!";
        }
    } else {
        msg.innerHTML =
            "<span style = 'font-weight: 600; color: yellow;'>가로, 세로</span> 값을 확인해주세요!";
    }
    input_x.value = "";
    input_y.value = "";
}

function createTableAuto(rows, columns) {
    var tablemaker = document.createElement("table"); //새로운 테이블 엘리먼트 생성
    tablemaker.setAttribute("class", "table"); //class 설정
    var a = "";
    for (var i = 1; i <= columns; i++) {
        a += "<tr>";
        for (var j = 1; j <= rows; j++) {
            a +=
                "<td><input class = 'normal cell' type = 'text' onclick = 'tableSelected(this)' onfocusin = 'isfocus = 1;' onfocusout = 'isfocus = 0;' onkeyup = 'this.value = this.value.replace(/¡/gi, \"\").replace(/¿/gi, \"\");'></input></td>";
        }
        a += "</tr>";
    }
    a += "</table>";
    tablemaker.innerHTML = a; //생성한 표 삽입
    document.getElementsByClassName("main")[0].appendChild(tablemaker);
    document.getElementsByClassName("sleep")[0].style.display = "none";
    document.getElementsByClassName("createbox_msg")[0].innerHTML =
        "<span style = 'color: yellow; font-weight: 600;'>" +
        macro[0] +
        ", " +
        macro[1] +
        "</span> 크기의 분단을 만들었습니다!";
}

function removeTableWithButton() {
    var main = document.getElementsByClassName("main")[0];
    var tip = document.getElementsByClassName("tip");
    var table = document.getElementsByClassName("table");
    var input = document.getElementsByClassName("removebox_input")[0];
    var msg = document.getElementsByClassName("removebox_msg")[0];
    if (table.length === 0) {
        return;
    }
    if (input.value === "") {
        main.removeChild(table[table.length - 1]);
        input.value = "";
        if (table.length === 1) {
            input.value = 1;
        }
        afterRemove(table.length + 1);
        return;
    }
    if (Number(input.value) != NaN) {
        if (input.value % 1 === 0 && input.value > 0) {
            if (input.value <= table.length) {
                main.removeChild(table[input.value - 1]);
                afterRemove(input.value);
            } else {
                msg.innerHTML =
                    "최대 <span style = 'font-weight: 600; color: yellow;'>" +
                    table.length +
                    "</span>분단까지만 입력하실 수 있어요!";
            }
        } else {
            msg.innerHTML =
                "분단의 번호는 <span style = 'font-weight: 600; color: yellow;'>자연수</span>로만 입력해 주세요!";
        }
    } else {
        msg.innerHTML =
            "지울 분단의 번호를 <span style = 'font-weight: 600; color: yellow;'>숫자</span> 형식으로 입력해 주세요!";
    }
    input.value = "";
    if (table.length === 1) {
        input.value = 1;
    }
}

function afterRemove(value) {
    if (remove === 0) {
        remove = 1;
    }
    var table = document.getElementsByClassName("table");
    var msg = document.getElementsByClassName("removebox_msg")[0];
    var input = document.getElementsByClassName("removebox_input")[0];
    if (table.length === 1) {
        msg.innerHTML =
            "<span style = 'font-weight: 600; color: yellow;'>" +
            value +
            "</span>분단을 지웠습니다. 이제 마지막 하나만 남았네요!";
        input.readOnly = true;
        input.disabled = false;
    } else {
        if (table.length === 0) {
            msg.innerHTML =
                "<span style = 'font-weight: 600; color: yellow;'>1</span>분단을 지웠습니다. 다 지웠네요!";
            input.readOnly = true;
            input.disabled = true;
            input.placeholder = "지울 분단 없음!";
            document.getElementsByClassName("sleep")[0].style.display =
                "inline-block";
        } else {
            msg.innerHTML =
                "<span style = 'font-weight: 600; color: yellow;'>" +
                value +
                "</span>분단을 지웠습니다!";
            input.readOnly = false;
            input.disabled = false;
            button.disabled = false;
            input.placeholder = table.length;
        }
    }
}

function xButton(type) {
    if (type === 0) {
        document.getElementsByClassName("createbox")[0].style.display = "none";
    } else {
        document.getElementsByClassName("removebox")[0].style.display = "none";
    }
    document.getElementsByClassName("removebutton")[0].classList.remove("on");
    document.getElementsByClassName("createbutton")[0].classList.remove("on");
}

function maleButtonPressed() {
    var cell = document.querySelectorAll(".table .cell");
    if (mode === 1) {
        mode = 0;
        try {
            document.getElementsByClassName("malebutton on")[0].className =
                "malebutton button off";
        } catch (e) {}
        for (var i = 0; i <= cell.length - 1; i++) {
            cell[i].readOnly = false;
        }
    } else {
        mode = 1;
        document.getElementsByClassName("malebutton off")[0].className =
            "malebutton button on";
        try {
            document.getElementsByClassName("constbutton on")[0].className =
                "constbutton button off";
        } catch (e) {}
        for (var i = 0; i <= cell.length - 1; i++) {
            cell[i].readOnly = true;
        }
    }
}

function constButtonPressed() {
    var cell = document.querySelectorAll(".table .cell");
    if (mode === 2) {
        mode = 0;
        try {
            document.getElementsByClassName("constbutton on")[0].className =
                "constbutton button off";
        } catch (e) {}
        for (var i = 0; i <= cell.length - 1; i++) {
            cell[i].readOnly = false;
        }
    } else {
        mode = 2;
        document.getElementsByClassName("constbutton off")[0].className =
            "constbutton button on";
        try {
            document.getElementsByClassName("malebutton on")[0].className =
                "malebutton button off";
        } catch (e) {}
        for (var i = 0; i <= cell.length - 1; i++) {
            cell[i].readOnly = true;
        }
    }
}

function tableSelected(select) {
    var normal = document.getElementsByClassName("normal");
    var normal_empty = document.getElementsByClassName("normal_empty");
    var female = document.getElementsByClassName("female");
    var female_empty = document.getElementsByClassName("female_empty");
    var male_empty = document.getElementsByClassName("male_empty");
    var const_empty = document.getElementsByClassName("const_empty");
    if (mode === 1) {
        if (select.className != "male cell") {
            select.className = "male cell";
        } else {
            select.className = "normal cell";
        }
    }
    if (mode === 2) {
        if (select.className != "const cell") {
            select.className = "const cell";
        } else {
            select.className = "normal cell";
        }
    }
    for (var i = female.length - 1; i >= 0; i--) {
        female[i].className = "normal cell";
    }
    for (var i = female_empty.length - 1; i >= 0; i--) {
        female_empty[i].className = "normal cell";
    }
    for (var i = normal_empty.length - 1; i >= 0; i--) {
        normal_empty[i].className = "normal cell";
    }
    for (var i = male_empty.length - 1; i >= 0; i--) {
        male_empty[i].className = "male cell";
    }
    for (var i = const_empty.length - 1; i >= 0; i--) {
        const_empty[i].className = "const cell";
    }
}

function shuffleSeats(list) {
    var index, temp;
    for (var i = list.length - 1; i > 0; i--) {
        index = Math.floor((i + 1) * Math.random()); //랜덤 인덱스 생성
        temp = list[i]; // 마지막 값 임시저장
        list[i] = list[index]; // 마지막 값에 인덱스 값 덮어씌우기
        list[index] = temp; // 임시 값을 바뀐 위치에 저장
    }
    return list;
}
function changeSeats() {
    var normal = document.getElementsByClassName("normal");
    var male = document.getElementsByClassName("male");
    var const_ = document.getElementsByClassName("const");
    var normal_empty = document.getElementsByClassName("normal_empty");
    var male_empty = document.getElementsByClassName("male_empty");
    var const_empty = document.getElementsByClassName("const_empty");
    var female = document.getElementsByClassName("female");
    var female_empty = document.getElementsByClassName("female_empty");
    var normalList = [];
    var maleList = [];
    if (female.length != 0 || female_empty.length != 0) {
        //female class -> normal class
        for (var i = female.length - 1; i >= 0; i--) {
            female[i].className = "normal cell";
        }
        for (var i = female_empty.length - 1; i >= 0; i--) {
            female_empty[i].className = "normal cell";
        }
    }
    for (var i = normal_empty.length - 1; i >= 0; i--) {
        //normal_empty -> normal
        if (normal_empty[i].value.replace(" ", "") != "") {
            normal_empty[i].className = "normal cell";
        }
    }
    for (var i = male_empty.length - 1; i >= 0; i--) {
        //male_empty -> male
        if (male_empty[i].value.replace(" ", "") != "") {
            male_empty[i].className = "male cell";
        }
    }
    for (var i = const_empty.length - 1; i >= 0; i--) {
        //const_empty -> male
        if (const_empty[i].value.replace(" ", "") != "") {
            const_empty[i].className = "const cell";
        }
    }
    for (var i = normal.length - 1; i >= 0; i--) {
        //normal -> normal_empty
        if (normal[i].value.replace(" ", "") != "") {
            normal[i].className = "normal cell";
            normalList.push(normal[i].value);
        } else {
            normal[i].className = "normal_empty cell";
        }
    }
    for (var i = male.length - 1; i >= 0; i--) {
        //male -> male_empty
        if (male[i].value.replace(" ", "") != "") {
            male[i].className = "male cell";
            maleList.push(male[i].value);
        } else {
            male[i].className = "male_empty cell";
        }
    }
    for (var i = const_.length - 1; i >= 0; i--) {
        //const -> const_empty
        if (const_[i].value.replace(" ", "") === "") {
            const_[i].className = "const_empty cell";
        }
    }
    normalList = shuffleSeats(normalList);
    maleList = shuffleSeats(maleList);
    for (var i = 0; i < normalList.length; i++) {
        normal[i].value = normalList[i];
    }
    for (var i = 0; i < maleList.length; i++) {
        male[i].value = maleList[i];
    }
    if (male.length != 0 || male_empty.length != 0) {
        //normal class -> female class
        for (var i = normal.length - 1; i >= 0; i--) {
            normal[i].className = "female cell";
        }
        for (var i = normal_empty.length - 1; i >= 0; i--) {
            normal_empty[i].className = "female_empty cell";
        }
    }
}
function tipMsg(command) {
    var tip = document.getElementsByClassName("tip");
    var table = document.getElementsByClassName("table");
    switch (command) {
        case "default":
            tip[0].innerHTML =
                "<font color = 'gray'>자리바꾸기 공장에 오신 것을 환영합니다!</font>";
            break;
        case "print":
            tip[0].innerHTML =
                "교탁 부착용 자리 배치표를 <font color = '#ED7D31'>출력</font>합니다.";
            break;
        case "male":
            if (mode === 1) {
                tip[0].innerHTML =
                    "<font color = '#6DE3FF'>남학생 자리 지정 </font>모드를 비활성화합니다.";
            } else {
                tip[0].innerHTML =
                    "<font color = '#6DE3FF'>남학생 자리 지정 </font>모드를 활성화합니다. 남학생 자리가 지정되면, 성별을 구분하여 자리가 배정됩니다.";
            }
            break;
        case "const":
            if (mode === 2) {
                tip[0].innerHTML =
                    "<font color = '#FFD966'>고정석 지정 </font>모드를 비활성화합니다.";
            } else {
                tip[0].innerHTML =
                    "<font color = '#FFD966'>고정석 지정 </font>모드를 활성화합니다. 고정석으로 지정된 자리는 자리가 바뀌지 않습니다.";
            }
            break;
        case "change":
            if (table[0] === undefined) {
                tip[0].innerHTML =
                    "최종적으로 자리를 바꿉니다. 그러려면, 먼저 분단을 만드셔야겠죠?";
            } else {
                tip[0].innerHTML =
                    "최종적으로 자리를 바꿉니다. 준비 되셨으면, 누르세요!";
            }
            break;
        case "create":
            if (table.length >= 10) {
                tip[0].innerHTML =
                    "<font color = '#6DFFA5'>새로운 분단</font>을 만듭니다. 근데 선생님, 분단이 대체 몇 개인가요...";
            } else {
                tip[0].innerHTML =
                    "<font color = '#6DFFA5'>새로운 분단</font>을 만듭니다. 가로, 세로 칸 수로 분단의 크기를 결정하실 수 있습니다.";
            }
            break;
        case "remove":
            if (table.length >= 1) {
                tip[0].innerHTML =
                    "분단을 지정해 <font color = '#FF5B96'>지울</font> 수 있습니다.";
            } else {
                tip[0].innerHTML =
                    "분단을 지정해 <font color = '#FF5B96'>지울</font> 수 있습니다. 우선 분단부터 만들어 보세요!";
            }
            break;
        case "save":
            tip[0].innerHTML =
                "지금까지의 작업을 <font color = '#A15BFF'>저장</font>합니다. 언제든 다시 불러올 수 있어요.";
            break;
        case "load":
            tip[0].innerHTML =
                "이전에 작업한 내용을 <font color = '#A15BFF'>로드</font>합니다.";
            break;
        case "loaded":
            tip[0].innerHTML = "이전에 작업한 내용을 성공적으로 불러왔습니다.";
            break;
    }
}

function info() {
    alert("준비중입니다");
}
function generageSaveData() {
    var data = { scale: [], cell: [] };
    var table = document.getElementsByClassName("table");
    var cell = document.getElementsByClassName("cell");

    for (var i = 0; i < table.length; i++) {
        curData = {};
        curData.col = table[i].rows[0].cells.length;
        curData.row = table[i].rows.length;
        data.scale.push(curData);
    }

    for (var i = 0; i < cell.length; i++) {
        data.cell.push({
            type: cell[i].className.split(" ")[0],
            value: cell[i].value,
        });
    }
    return data;
}
function saveSeats() {
    var table = document.getElementsByClassName("table");
    if (table.length === 0) {
        alert("저장할 데이터가 없습니다.");
        return;
    }
    if (confirm("저장하시겠습니까?") === false) {
        return;
    }
    let fileData = JSON.stringify(generageSaveData());
    function download(data, filename, type) {
        var file = new Blob([data], { type: type });
        if (window.navigator.msSaveOrOpenBlob)
            // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else {
            // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }
    download(fileData, "자리바꾸기.seat", "text/plain");
}

function loadSeats() {
    var table = document.getElementsByClassName("table");
    if (table.length) {
        if (!confirm("현재 작업 내용에 덮어쓰시겠습니까?")) return;
    }
    var input = document.createElement("input");
    input.type = "file";

    input.onchange = (e) => {
        // getting a hold of the file reference
        var file = e.target.files[0];

        // setting up the reader
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");

        // here we tell the reader what to do when it's done reading...
        reader.onload = (readerEvent) => {
            try {
                var data = JSON.parse(readerEvent.target.result);
                document.querySelectorAll("table").forEach((e) => e.remove());
                if (!data) {
                    return;
                }

                for (var i = 0; i < data.scale.length; i++) {
                    createTableAuto(data.scale[i].col, data.scale[i].row);
                }

                cellList = document.getElementsByClassName("cell");
                for (var i = 0; i < data.cell.length; i++) {
                    var type = data.cell[i].type;
                    var value = data.cell[i].value;

                    cellList[i].className = `${type} cell`;
                    cellList[i].value = value;
                }
                tipMsg("loaded");
                changeTitle();
            } catch (e) {
                alert("자리바꾸기 파일 형식이 아닙니다!");
            }
        };
    };

    input.click();
}
function beforePrint() {
    localStorage.setItem("seat", JSON.stringify(generageSaveData()));
    location.href = "/teacher/seat/print";
}
window.onbeforeprint = beforePrint;
if (window.matchMedia) {
    var mQuery = window.matchMedia("print");
    mQuery.addEventListener("change", function (mql) {
        if (mql.matches) {
            beforePrint();
        }
    });
}
document.body.onload = () => {
    if (localStorage.getItem("seat")) {
        let data = JSON.parse(localStorage.getItem("seat"));
        for (var i = 0; i < data.scale.length; i++) {
            createTableAuto(data.scale[i].col, data.scale[i].row);
        }
        cellList = document.getElementsByClassName("cell");
        for (var i = 0; i < data.cell.length; i++) {
            var type = data.cell[i].type;
            var value = data.cell[i].value;
            cellList[i].className = `${type} cell`;
            cellList[i].value = value;
        }
        localStorage.removeItem("seat");
    }
};
var isfocus = 0;
var mode = 0;
var macro = [2, 5];
var remove = 0;
function changeTitle() {
    document.getElementById("title").style.padding = "7px 20px 0px 20px";
    document.getElementById("title").style.border = "2px solid white";
    document.getElementById("title").innerHTML = "교탁";
}

document.onkeydown = keyDown;
function keyDown(event) {
    var key = event.which || event.keyCode;
    if (isfocus === 1) {
        return;
    }
    switch (key) {
        case 69:
            createButtonPressed();
            break;
        case 81:
            maleButtonPressed();
            break;
        case 82:
            removeButtonPressed();
            break;
        case 87:
            constButtonPressed();
            break;
    }
    if (isfocus === 2 || isfocus === 3) {
        if (key === 27) {
            document.getElementsByClassName("createbox")[0].style.display =
                "none";
            document.getElementsByClassName("removebox")[0].style.display =
                "none";
        }
        if (isfocus === 2 && key === 13) {
            createTableWithButton();
        }
        if (isfocus === 3 && key === 13) {
            removeTableWithButton();
        }
    }
}
function createButtonPressed() {
    var box = document.getElementsByClassName("createbox")[0];
    var antibox = document.getElementsByClassName("removebox")[0];
    var input = document.getElementsByClassName("createbox_input")[0];
    document.getElementsByClassName("removebutton")[0].classList.remove("on");
    document.getElementsByClassName("createbutton")[0].classList.toggle("on");
    if (box.style.display === "none") {
        box.style.display = "inline-block";
        antibox.style.display = "none";
        input.value = "";
        input.focus();
    } else {
        box.style.display = "none";
    }
}

function removeButtonPressed() {
    var box = document.getElementsByClassName("removebox")[0];
    var antibox = document.getElementsByClassName("createbox")[0];
    var msg = document.getElementsByClassName("removebox_msg")[0];
    var input = document.getElementsByClassName("removebox_input")[0];
    var button = document.getElementsByClassName("removebox_button")[0];
    var table = document.getElementsByClassName("table");
    document.getElementsByClassName("createbutton")[0].classList.remove("on");
    document.getElementsByClassName("removebutton")[0].classList.toggle("on");
    if (box.style.display === "none") {
        box.style.display = "inline-block";
        antibox.style.display = "none";
        input.value = "";
        if (table.length === 0) {
            msg.innerHTML = "더 이상 지울 분단이 없습니다!";
            input.placeholder = "지울 분단 없음!";
            input.disabled = true;
            button.disabled = true;
        } else {
            if (table.length === 1) {
                msg.innerHTML = "1분단을 지우시겠어요?";
                input.value = 1;
                input.disabled = false;
                input.readOnly = true;
                button.disabled = false;
            } else {
                input.disabled = false;
                input.readOnly = false;
                button.disabled = false;
                input.placeholder = table.length;
                if (remove === 0) {
                    msg.innerHTML =
                        "<span style = 'font-weight: 600;'>입력 방법: </span>" +
                        table.length +
                        "분단: " +
                        "<span style = 'color: yellow; font-weight: 600;'>" +
                        table.length +
                        "</span>";
                } else {
                    msg.innerHTML =
                        "입력란을 비우실 경우 마지막 분단인 <span style = 'font-weight: 600; color: yellow;'>" +
                        table.length +
                        "</span> 분단을 지우겠습니다.";
                }
            }
        }
        input.focus();
    } else {
        box.style.display = "none";
    }
}

function createTableWithButton() {
    var input_x = document.getElementsByClassName("createbox_input_x")[0];
    var input_y = document.getElementsByClassName("createbox_input_y")[0];
    var msg = document.getElementsByClassName("createbox_msg")[0];
    if (!input_x.value || !input_y.value) {
        alert("가로와 세로를 모두 입력해주세요");
        return;
    }
    splitAnswer = [input_x.value, input_y.value];
    if (splitAnswer.length === 2) {
        var rows = Number(splitAnswer[0]);
        var columns = Number(splitAnswer[1]);
        if (rows % 1 === 0 && rows > 0 && columns % 1 === 0 && columns > 0) {
            if (rows <= 30 && columns <= 30) {
                macro[0] = input_x.value;
                macro[1] = input_y.value;
                createTableAuto(rows, columns);
                changeTitle();
            } else {
                msg.innerHTML =
                    "너무 큰 수는 힘들어요. <span style = 'font-weight: 600; color: yellow;'>10 이하의 숫자</span>로 입력해 주시겠어요?";
            }
        } else {
            msg.innerHTML =
                "분단의 크기는 <span style = 'font-weight: 600; color: yellow;'>자연수</span>로만 입력해 주세요!";
        }
    } else {
        msg.innerHTML =
            "<span style = 'font-weight: 600; color: yellow;'>가로, 세로</span> 값을 확인해주세요!";
    }
    input_x.value = "";
    input_y.value = "";
}

function createTableAuto(rows, columns) {
    var tablemaker = document.createElement("table"); //새로운 테이블 엘리먼트 생성
    tablemaker.setAttribute("class", "table"); //class 설정
    var a = "";
    for (var i = 1; i <= columns; i++) {
        a += "<tr>";
        for (var j = 1; j <= rows; j++) {
            a +=
                "<td><input class = 'normal cell' type = 'text' onclick = 'tableSelected(this)' onfocusin = 'isfocus = 1;' onfocusout = 'isfocus = 0;' onkeyup = 'this.value = this.value.replace(/¡/gi, \"\").replace(/¿/gi, \"\");'></input></td>";
        }
        a += "</tr>";
    }
    a += "</table>";
    tablemaker.innerHTML = a; //생성한 표 삽입
    document.getElementsByClassName("main")[0].appendChild(tablemaker);
    document.getElementsByClassName("sleep")[0].style.display = "none";
    document.getElementsByClassName("createbox_msg")[0].innerHTML =
        "<span style = 'color: yellow; font-weight: 600;'>" +
        macro[0] +
        ", " +
        macro[1] +
        "</span> 크기의 분단을 만들었습니다!";
}

function removeTableWithButton() {
    var main = document.getElementsByClassName("main")[0];
    var tip = document.getElementsByClassName("tip");
    var table = document.getElementsByClassName("table");
    var input = document.getElementsByClassName("removebox_input")[0];
    var msg = document.getElementsByClassName("removebox_msg")[0];
    if (table.length === 0) {
        return;
    }
    if (input.value === "") {
        main.removeChild(table[table.length - 1]);
        input.value = "";
        if (table.length === 1) {
            input.value = 1;
        }
        afterRemove(table.length + 1);
        return;
    }
    if (Number(input.value) != NaN) {
        if (input.value % 1 === 0 && input.value > 0) {
            if (input.value <= table.length) {
                main.removeChild(table[input.value - 1]);
                afterRemove(input.value);
            } else {
                msg.innerHTML =
                    "최대 <span style = 'font-weight: 600; color: yellow;'>" +
                    table.length +
                    "</span>분단까지만 입력하실 수 있어요!";
            }
        } else {
            msg.innerHTML =
                "분단의 번호는 <span style = 'font-weight: 600; color: yellow;'>자연수</span>로만 입력해 주세요!";
        }
    } else {
        msg.innerHTML =
            "지울 분단의 번호를 <span style = 'font-weight: 600; color: yellow;'>숫자</span> 형식으로 입력해 주세요!";
    }
    input.value = "";
    if (table.length === 1) {
        input.value = 1;
    }
}

function afterRemove(value) {
    if (remove === 0) {
        remove = 1;
    }
    var table = document.getElementsByClassName("table");
    var msg = document.getElementsByClassName("removebox_msg")[0];
    var input = document.getElementsByClassName("removebox_input")[0];
    if (table.length === 1) {
        msg.innerHTML =
            "<span style = 'font-weight: 600; color: yellow;'>" +
            value +
            "</span>분단을 지웠습니다. 이제 마지막 하나만 남았네요!";
        input.readOnly = true;
        input.disabled = false;
    } else {
        if (table.length === 0) {
            msg.innerHTML =
                "<span style = 'font-weight: 600; color: yellow;'>1</span>분단을 지웠습니다. 다 지웠네요!";
            input.readOnly = true;
            input.disabled = true;
            input.placeholder = "지울 분단 없음!";
            document.getElementsByClassName("sleep")[0].style.display =
                "inline-block";
        } else {
            msg.innerHTML =
                "<span style = 'font-weight: 600; color: yellow;'>" +
                value +
                "</span>분단을 지웠습니다!";
            input.readOnly = false;
            input.disabled = false;
            button.disabled = false;
            input.placeholder = table.length;
        }
    }
}

function xButton(type) {
    if (type === 0) {
        document.getElementsByClassName("createbox")[0].style.display = "none";
    } else {
        document.getElementsByClassName("removebox")[0].style.display = "none";
    }
    document.getElementsByClassName("removebutton")[0].classList.remove("on");
    document.getElementsByClassName("createbutton")[0].classList.remove("on");
}

function maleButtonPressed() {
    var cell = document.querySelectorAll(".table .cell");
    if (mode === 1) {
        mode = 0;
        try {
            document.getElementsByClassName("malebutton on")[0].className =
                "malebutton button off";
        } catch (e) {}
        for (var i = 0; i <= cell.length - 1; i++) {
            cell[i].readOnly = false;
        }
    } else {
        mode = 1;
        document.getElementsByClassName("malebutton off")[0].className =
            "malebutton button on";
        try {
            document.getElementsByClassName("constbutton on")[0].className =
                "constbutton button off";
        } catch (e) {}
        for (var i = 0; i <= cell.length - 1; i++) {
            cell[i].readOnly = true;
        }
    }
}

function constButtonPressed() {
    var cell = document.querySelectorAll(".table .cell");
    if (mode === 2) {
        mode = 0;
        try {
            document.getElementsByClassName("constbutton on")[0].className =
                "constbutton button off";
        } catch (e) {}
        for (var i = 0; i <= cell.length - 1; i++) {
            cell[i].readOnly = false;
        }
    } else {
        mode = 2;
        document.getElementsByClassName("constbutton off")[0].className =
            "constbutton button on";
        try {
            document.getElementsByClassName("malebutton on")[0].className =
                "malebutton button off";
        } catch (e) {}
        for (var i = 0; i <= cell.length - 1; i++) {
            cell[i].readOnly = true;
        }
    }
}

function tableSelected(select) {
    var normal = document.getElementsByClassName("normal");
    var normal_empty = document.getElementsByClassName("normal_empty");
    var female = document.getElementsByClassName("female");
    var female_empty = document.getElementsByClassName("female_empty");
    var male_empty = document.getElementsByClassName("male_empty");
    var const_empty = document.getElementsByClassName("const_empty");
    if (mode === 1) {
        if (select.className != "male cell") {
            select.className = "male cell";
        } else {
            select.className = "normal cell";
        }
    }
    if (mode === 2) {
        if (select.className != "const cell") {
            select.className = "const cell";
        } else {
            select.className = "normal cell";
        }
    }
    for (var i = female.length - 1; i >= 0; i--) {
        female[i].className = "normal cell";
    }
    for (var i = female_empty.length - 1; i >= 0; i--) {
        female_empty[i].className = "normal cell";
    }
    for (var i = normal_empty.length - 1; i >= 0; i--) {
        normal_empty[i].className = "normal cell";
    }
    for (var i = male_empty.length - 1; i >= 0; i--) {
        male_empty[i].className = "male cell";
    }
    for (var i = const_empty.length - 1; i >= 0; i--) {
        const_empty[i].className = "const cell";
    }
}

function shuffleSeats(list) {
    var index, temp;
    for (var i = list.length - 1; i > 0; i--) {
        index = Math.floor((i + 1) * Math.random()); //랜덤 인덱스 생성
        temp = list[i]; // 마지막 값 임시저장
        list[i] = list[index]; // 마지막 값에 인덱스 값 덮어씌우기
        list[index] = temp; // 임시 값을 바뀐 위치에 저장
    }
    return list;
}
function changeSeats() {
    var normal = document.getElementsByClassName("normal");
    var male = document.getElementsByClassName("male");
    var const_ = document.getElementsByClassName("const");
    var normal_empty = document.getElementsByClassName("normal_empty");
    var male_empty = document.getElementsByClassName("male_empty");
    var const_empty = document.getElementsByClassName("const_empty");
    var female = document.getElementsByClassName("female");
    var female_empty = document.getElementsByClassName("female_empty");
    var normalList = [];
    var maleList = [];
    if (female.length != 0 || female_empty.length != 0) {
        //female class -> normal class
        for (var i = female.length - 1; i >= 0; i--) {
            female[i].className = "normal cell";
        }
        for (var i = female_empty.length - 1; i >= 0; i--) {
            female_empty[i].className = "normal cell";
        }
    }
    for (var i = normal_empty.length - 1; i >= 0; i--) {
        //normal_empty -> normal
        if (normal_empty[i].value.replace(" ", "") != "") {
            normal_empty[i].className = "normal cell";
        }
    }
    for (var i = male_empty.length - 1; i >= 0; i--) {
        //male_empty -> male
        if (male_empty[i].value.replace(" ", "") != "") {
            male_empty[i].className = "male cell";
        }
    }
    for (var i = const_empty.length - 1; i >= 0; i--) {
        //const_empty -> male
        if (const_empty[i].value.replace(" ", "") != "") {
            const_empty[i].className = "const cell";
        }
    }
    for (var i = normal.length - 1; i >= 0; i--) {
        //normal -> normal_empty
        if (normal[i].value.replace(" ", "") != "") {
            normal[i].className = "normal cell";
            normalList.push(normal[i].value);
        } else {
            normal[i].className = "normal_empty cell";
        }
    }
    for (var i = male.length - 1; i >= 0; i--) {
        //male -> male_empty
        if (male[i].value.replace(" ", "") != "") {
            male[i].className = "male cell";
            maleList.push(male[i].value);
        } else {
            male[i].className = "male_empty cell";
        }
    }
    for (var i = const_.length - 1; i >= 0; i--) {
        //const -> const_empty
        if (const_[i].value.replace(" ", "") === "") {
            const_[i].className = "const_empty cell";
        }
    }
    normalList = shuffleSeats(normalList);
    maleList = shuffleSeats(maleList);
    for (var i = 0; i < normalList.length; i++) {
        normal[i].value = normalList[i];
    }
    for (var i = 0; i < maleList.length; i++) {
        male[i].value = maleList[i];
    }
    if (male.length != 0 || male_empty.length != 0) {
        //normal class -> female class
        for (var i = normal.length - 1; i >= 0; i--) {
            normal[i].className = "female cell";
        }
        for (var i = normal_empty.length - 1; i >= 0; i--) {
            normal_empty[i].className = "female_empty cell";
        }
    }
}
function tipMsg(command) {
    var tip = document.getElementsByClassName("tip");
    var table = document.getElementsByClassName("table");
    switch (command) {
        case "default":
            tip[0].innerHTML =
                "<font color = 'gray'>자리바꾸기 공장에 오신 것을 환영합니다!</font>";
            break;
        case "print":
            tip[0].innerHTML =
                "교탁 부착용 자리 배치표를 <font color = '#ED7D31'>출력</font>합니다.";
            break;
        case "male":
            if (mode === 1) {
                tip[0].innerHTML =
                    "<font color = '#6DE3FF'>남학생 자리 지정 </font>모드를 비활성화합니다.";
            } else {
                tip[0].innerHTML =
                    "<font color = '#6DE3FF'>남학생 자리 지정 </font>모드를 활성화합니다. 남학생 자리가 지정되면, 성별을 구분하여 자리가 배정됩니다.";
            }
            break;
        case "const":
            if (mode === 2) {
                tip[0].innerHTML =
                    "<font color = '#FFD966'>고정석 지정 </font>모드를 비활성화합니다.";
            } else {
                tip[0].innerHTML =
                    "<font color = '#FFD966'>고정석 지정 </font>모드를 활성화합니다. 고정석으로 지정된 자리는 자리가 바뀌지 않습니다.";
            }
            break;
        case "change":
            if (table[0] === undefined) {
                tip[0].innerHTML =
                    "최종적으로 자리를 바꿉니다. 그러려면, 먼저 분단을 만드셔야겠죠?";
            } else {
                tip[0].innerHTML =
                    "최종적으로 자리를 바꿉니다. 준비 되셨으면, 누르세요!";
            }
            break;
        case "create":
            if (table.length >= 10) {
                tip[0].innerHTML =
                    "<font color = '#6DFFA5'>새로운 분단</font>을 만듭니다. 근데 선생님, 분단이 대체 몇 개인가요...";
            } else {
                tip[0].innerHTML =
                    "<font color = '#6DFFA5'>새로운 분단</font>을 만듭니다. 가로, 세로 칸 수로 분단의 크기를 결정하실 수 있습니다.";
            }
            break;
        case "remove":
            if (table.length >= 1) {
                tip[0].innerHTML =
                    "분단을 지정해 <font color = '#FF5B96'>지울</font> 수 있습니다.";
            } else {
                tip[0].innerHTML =
                    "분단을 지정해 <font color = '#FF5B96'>지울</font> 수 있습니다. 우선 분단부터 만들어 보세요!";
            }
            break;
        case "save":
            tip[0].innerHTML =
                "지금까지의 작업을 <font color = '#A15BFF'>저장</font>합니다. 언제든 다시 불러올 수 있어요.";
            break;
        case "load":
            tip[0].innerHTML =
                "이전에 작업한 내용을 <font color = '#A15BFF'>로드</font>합니다.";
            break;
        case "loaded":
            tip[0].innerHTML = "이전에 작업한 내용을 성공적으로 불러왔습니다.";
            break;
    }
}

function info() {
    alert("준비중입니다");
}
function generageSaveData() {
    var data = { scale: [], cell: [] };
    var table = document.getElementsByClassName("table");
    var cell = document.getElementsByClassName("cell");

    for (var i = 0; i < table.length; i++) {
        curData = {};
        curData.col = table[i].rows[0].cells.length;
        curData.row = table[i].rows.length;
        data.scale.push(curData);
    }

    for (var i = 0; i < cell.length; i++) {
        data.cell.push({
            type: cell[i].className.split(" ")[0],
            value: cell[i].value,
        });
    }
    return data;
}
function saveSeats() {
    var table = document.getElementsByClassName("table");
    if (table.length === 0) {
        alert("저장할 데이터가 없습니다.");
        return;
    }
    if (confirm("저장하시겠습니까?") === false) {
        return;
    }
    let fileData = JSON.stringify(generageSaveData());
    function download(data, filename, type) {
        var file = new Blob([data], { type: type });
        if (window.navigator.msSaveOrOpenBlob)
            // IE10+
            window.navigator.msSaveOrOpenBlob(file, filename);
        else {
            // Others
            var a = document.createElement("a"),
                url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
        }
    }
    download(fileData, "자리바꾸기.seat", "text/plain");
}

function loadSeats() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".seat";

    input.onchange = (e) => {
        // getting a hold of the file reference
        var file = e.target.files[0];

        // setting up the reader
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");

        // here we tell the reader what to do when it's done reading...
        reader.onload = (readerEvent) => {
            try {
                var data = JSON.parse(readerEvent.target.result);
                if (!data) {
                    return;
                }

                for (var i = 0; i < data.scale.length; i++) {
                    createTableAuto(data.scale[i].col, data.scale[i].row);
                }

                cellList = document.getElementsByClassName("cell");
                for (var i = 0; i < data.cell.length; i++) {
                    var type = data.cell[i].type;
                    var value = data.cell[i].value;

                    cellList[i].className = `${type} cell`;
                    cellList[i].value = value;
                }
                tipMsg("loaded");
                changeTitle();
            } catch (e) {
                alert("자리바꾸기 파일 형식이 아닙니다!");
            }
        };
    };

    input.click();
}
function beforePrint() {
    localStorage.setItem("seat", JSON.stringify(generageSaveData()));
    location.href = "/teacher/seat/print";
}
window.onbeforeprint = beforePrint;
if (window.matchMedia) {
    var mQuery = window.matchMedia("print");
    mQuery.addEventListener("change", function (mql) {
        if (mql.matches) {
            beforePrint();
        }
    });
}
document.body.onload = () => {
    if (localStorage.getItem("seat")) {
        let data = JSON.parse(localStorage.getItem("seat"));
        for (var i = 0; i < data.scale.length; i++) {
            createTableAuto(data.scale[i].col, data.scale[i].row);
        }
        cellList = document.getElementsByClassName("cell");
        for (var i = 0; i < data.cell.length; i++) {
            var type = data.cell[i].type;
            var value = data.cell[i].value;
            cellList[i].className = `${type} cell`;
            cellList[i].value = value;
        }
        localStorage.removeItem("seat");
    }
};
