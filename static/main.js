// BASIC PAGE MAKE
function window_onresize() {
    if (window.innerWidth > 1200) {
        var i = 0;
        Array.from($("th[scope='row']")).forEach((e) => {
            i++;
            $(e).text(i + "교시");
        });
        $("#school-grade-class").html(
            `${school_name} ${grade}학년 ${class_}반`
        );
    } else {
        var i = 0;
        Array.from($("th[scope='row']")).forEach((e) => {
            i++;
            $(e).text(i);
        });
        $("#school-grade-class").html(
            `${school_name.replace("학교", "")} ${grade}-${class_}`
        );
    }
}
window_onresize();
window.onresize = window_onresize;

// FETCH WITH USER INTERACTION
$("td.class, th.dayofweek").on("click", (event) => {
    $(".active").removeClass("active");
    $(`*[data-date='${event.target.attributes["data-date"].value}']`).addClass(
        "active"
    );
    var date = formatDate(parseInt(event.target.attributes["data-date"].value));
    fetchMeal(date);
});

// Date to NeisDate
function formatDate(date) {
    var date = new Date(date);
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + month + day;
}

// FETCH FUNC
async function fetchMeal(date) {
    $("#meal").html("로드중...");
    var dateString =
        date.slice(0, 4) + "/" + date.slice(4, 6) + "/" + date.slice(6);
    $("#meal-date").html(
        `${dateString}(${"일월화수목금토"[new Date(dateString).getDay()]})`
    );

    if (Object.keys(cache.meal).indexOf(date) != -1) {
        var data = cache.meal[date];
        if (data.meal.length == 0) {
            $("#meal").html("데이터 없음");
        } else {
            $("#meal").html("");
            data.meal.forEach((d) => {
                $("#meal").append(`<strong>${d.MMEAL_SC_NM}</strong><br>`);
                $("#meal").append(d.DDISH_NM);
            });
        }

        return;
    }

    $.ajax({
        url: "/api/meal?date=" + date,
        method: "GET",
        success: (data) => {
            if (data.success) {
                cache.meal[date] = data;
                if (data.meal.length == 0) {
                    $("#meal").html("데이터 없음");
                } else {
                    $("#meal").html("");
                    data.meal.forEach((d) => {
                        $("#meal").append(
                            `<strong>${d.MMEAL_SC_NM}</strong><br>`
                        );
                        $("#meal").append(d.DDISH_NM);
                    });
                }
            } else {
                $("#meal").html("Error");
                throw Error(
                    data.message ?? "fetchMeal:success->false, no message"
                );
            }
        },
    });
}

async function fetchpost() {
    $("#metadata").html("로드중...");

    $.ajax({
        url: `/api/post?skip=0&_=${Math.random()}`,
        method: "GET",
        success: (data) => {
            if (data.success) {
                $("#metadata").html("");
                for (const d of data.post) {
                    $("#metadata").append(
                        `<li class="list-group-item" onclick="openPost('${d.id}')">${d.title}</li>`
                    );
                }
                if (data.post.length == 0) {
                    $("#metadata").append(
                        `<strong class="list-group-item">게시글 없음</strong>`
                    );
                }
            } else {
                $("#metadata").html("오류가 발생했습니다.");
                throw Error(
                    data.message ?? "fetchpost:success->false, no message"
                );
            }
        },
    });
}

async function fetchNotice() {
    $("#notice").html("로드중...");

    $.ajax({
        url: `/api/notice?_=${Math.random()}&skip=0`,
        method: "GET",
        success: (data) => {
            if (data.success) {
                $("#notice").html("");
                for (const d of data.notice) {
                    $("#notice").append(
                        `<li class="list-group-item" onclick="openNotice('${d.id}')">${d.title}</li>`
                    );
                }
                if (data.notice.length == 0) {
                    $("#notice").append(
                        `<strong class="list-group-item">공지 없음</strong>`
                    );
                }
            } else {
                $("#notice").html("오류가 발생했습니다.");
                throw Error(
                    data.message ?? "fetchNotice:success->false, no message"
                );
            }
        },
    });
}

async function fetchTimeTable(fmonday, refresh) {
    await $.ajax({
        url: `/api/timetable?monday=${fmonday}&refresh=${refresh ?? ""}`,
        method: "GET",
        success: (data) => {
            $("#loading").addClass("fadeout");
            setTimeout(() => {
                $("#loading").hide();
            }, 500);
            var tmp = new Date(
                fmonday.slice(0, 4) +
                    "-" +
                    fmonday.slice(4, 6) +
                    "-" +
                    fmonday.slice(6)
            );
            var tmp2 = new Date(tmp.getTime() + 1000 * 60 * 60 * 24 * 4);
            $("#timetable-date").text(
                `${tmp.getMonth() + 1}.${tmp.getDate()} ~ ${
                    tmp2.getMonth() + 1
                }.${tmp2.getDate()}`
            );
            if (data.success) {
                var lastDate = "";
                var tmp = 0;
                data.table.forEach((b) => {
                    if (lastDate != b.ALL_TI_YMD) {
                        tmp++;
                        lastDate = b.ALL_TI_YMD;
                    }
                    $(
                        `tbody > tr:nth-child(${b.PERIO}) > td:nth-child(${
                            tmp + 1
                        })`
                    ).html(`${b.ITRT_CNTNT.replace("-", "")}`);
                });
                for (var i = 0; i < 5; i++) {
                    $(`thead > tr > th:nth-child(${i + 2})`).attr(
                        "data-date",
                        new Date(
                            fmonday.slice(0, 4) +
                                "-" +
                                fmonday.slice(4, 6) +
                                "-" +
                                fmonday.slice(6)
                        ).getTime() +
                            1000 * 60 * 60 * 24 * i
                    );

                    for (var j = 0; j < 7; j++) {
                        $(
                            `tbody > tr:nth-child(${j + 1}) > td:nth-child(${
                                i + 2
                            })`
                        ).attr(
                            "data-date",
                            new Date(
                                fmonday.slice(0, 4) +
                                    "-" +
                                    fmonday.slice(4, 6) +
                                    "-" +
                                    fmonday.slice(6)
                            ).getTime() +
                                1000 * 60 * 60 * 24 * i
                        );
                    }
                }
                if (refresh) {
                    alert("새로고침을 완료했습니다.");
                }
            } else {
                throw Error(
                    data.message ?? "fetchTimetable:success->false, no message"
                );
            }
        },
    });
}

// FETCH CACHE STORAGE
var cache = {
    meal: {},
    meta: {},
};
var today = formatDate(new Date());

// FETCH
setTimeout(async () => {
    fetchTimeTable(monday);
    fetchMeal(today);
    fetchpost();
    fetchNotice();
}, 0);

var currentMonday = monday;
function getLastMonday() {
    var tmp = new Date(
        currentMonday.slice(0, 4) +
            "-" +
            currentMonday.slice(4, 6) +
            "-" +
            currentMonday.slice(6)
    );
    tmp.setDate(tmp.getDate() - 7);
    currentMonday = formatDate(tmp);

    return currentMonday;
}

function getNextMonday() {
    var tmp = new Date(
        currentMonday.slice(0, 4) +
            "-" +
            currentMonday.slice(4, 6) +
            "-" +
            currentMonday.slice(6)
    );
    tmp.setDate(tmp.getDate() + 7);
    currentMonday = formatDate(tmp);
    return currentMonday;
}

function openNotice(link) {
    open("/notice/" + link);
}

function openPost(link) {
    open("/post/" + link);
}

function newPost() {
    open("/new-post");
}

window.onerror = (message, url, lineNumber) => {
    $("#error").addClass("show").show();
    if (
        message.includes("요청이 너무 빠릅니다! 잠시 후에 다시 시도해주세요.")
    ) {
        $("#error-message").html(message);
        return;
    }

    $("#error-message").html("문제가 보고되었습니다. <br>" + message);
    $.ajax({
        url: `/error?message=${message}&url=${url}&line=${lineNumber}&page=${location.href}`,
        method: "GET",
    });
    return true;
};
