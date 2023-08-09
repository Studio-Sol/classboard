/**
 * @author sol
 * @param {string} q
 * @returns Element[] | Element
 */
function $(q) {
    var result = document.querySelectorAll(q);
    return result.length == 1 ? result[0] : result;
}
// BASIC PAGE MAKE
function window_onresize() {
    if (window.innerWidth > 1200) {
        $(
            "#school-grade-class"
        ).innerHTML = `${school_name} ${grade}학년 ${class_}반`;
    } else {
        $("#school-grade-class").innerHTML = `${grade}-${class_}`;
    }
}
window_onresize();
window.onresize = window_onresize;

// FETCH WITH USER INTERACTION
$("td.class, th.dayofweek").forEach((e) => {
    e.addEventListener("click", (event) => {
        $(".active")?.classList?.remove("active");
        event.target.classList.add("active");
        fetchMeal(event.target.dataset.date);
    });
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
async function fetchAllNotice() {
    let response = await (await fetch("/api/all-notice")).json();
    const steps = [];
    for (let i = 0; i < response.length; i++) {
        steps.push(String(i));
    }
    const Queue = Swal.mixin({
        progressSteps: steps,
        confirmButtonText: "다음 >",
        showDenyButton: true,
        denyButtonText: `다시 보지 않기`,
        // optional classes to avoid backdrop blinking between steps
        showClass: { backdrop: "swal2-noanimation" },
        hideClass: { backdrop: "swal2-noanimation" },
    });
    for (let i = 0; i < response.length; i++) {
        if (i + 1 == response.length) {
            response[i].confirmButtonText = "닫기";
        }
        await Queue.fire({
            currentProgressStep: i,
            ...response[i],
        }).then((result) => {
            /* Read more about isConfirmed, isDenied below */
            if (result.isDenied) {
                fetch(`/api/all-notice/noagain?notice=${response[i]._id}`);
            }
        });
    }
}
async function fetchMeal(dateString) {
    $("#meal").innerHTML = "로드중...";
    $("#meal-date").innerHTML = `${
        getDate(dateString).getMonth() + 1
    }/${getDate(dateString).getDate()}(${
        "일월화수목금토"[getDate(dateString).getDay()]
    })`;

    if (Object.keys(cache.meal).indexOf(dateString) != -1) {
        var data = cache.meal[dateString];
        if (data.meal.length == 0) {
            $("#meal").innerHTML = "데이터 없음";
        } else {
            $("#meal").innerHTML = "";
            data.meal.forEach((d, i) => {
                $("#meal").insertAdjacentHTML(
                    "beforeend",
                    `<strong>${d.MMEAL_SC_NM}</strong><br>${d.DDISH_NM}${
                        i + 1 < data.meal.length ? "<br><br>" : ""
                    }`
                );
            });
        }

        return;
    }

    fetch("/api/meal?date=" + dateString, {
        method: "GET",
    })
        .then((d) => d.json())
        .then((data) => {
            if (data.success) {
                cache.meal[dateString] = data;
                if (data.meal.length == 0) {
                    $("#meal").innerHTML = "데이터 없음";
                } else {
                    $("#meal").innerHTML = "";
                    data.meal.forEach((d, i) => {
                        $("#meal").insertAdjacentHTML(
                            "beforeend",
                            `<strong>${d.MMEAL_SC_NM}</strong><br>${
                                d.DDISH_NM
                            }${i + 1 < data.meal.length ? "<br><br>" : ""}`
                        );
                    });
                }
            } else {
                $("#meal").innerHTML = "Error";
                throw Error(
                    data.message ?? "fetchMeal:success->false, no message"
                );
            }
        });
}

async function fetchpost() {
    $("#posts").innerHTML = "로드중...";

    fetch(`/api/post?skip=0`, {
        method: "GET",
    })
        .then((d) => d.json())
        .then((data) => {
            if (data.success) {
                $("#posts").innerHTML = "";
                for (const d of data.post) {
                    $("#posts").insertAdjacentHTML(
                        "beforeend",
                        `<li class="list-group-item" onclick="openPost('${d.id}')">${d.title}</li>`
                    );
                }
                if (data.post.length == 0) {
                    $("#posts").insertAdjacentHTML(
                        "beforeend",
                        `<li class="list-group-item"><strong style="color: black;">게시글 없음</strong></li>`
                    );
                }
            } else {
                $("#posts").insertAdjacentHTML(
                    "beforeend",
                    `<li class="list-group-item"><strong style="color: black;">오류 발생</strong></li>`
                );
                throw Error(
                    data.message ?? "fetchpost:success->false, no message"
                );
            }
        });
}

async function fetchNotice() {
    $("#notice").innerHTML = "로드중...";

    fetch(`/api/notice?skip=0`, {
        method: "GET",
    })
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            if (data.success) {
                $("#notice").innerHTML = "";
                for (const d of data.notice) {
                    $("#notice").insertAdjacentHTML(
                        "beforeend",
                        `<li class="list-group-item" onclick="openNotice('${d.id}')">${d.title}</li>`
                    );
                }
                if (data.notice.length == 0) {
                    $("#notice").insertAdjacentHTML(
                        "beforeend",
                        `<strong class="list-group-item">공지 없음</strong>`
                    );
                }
            } else {
                $("#notice").innerHTML = "오류가 발생했습니다.";
                throw Error(
                    data.message ?? "fetchNotice:success->false, no message"
                );
            }
        });
}
function getDate(stringDate) {
    return new Date(
        stringDate.slice(0, 4) +
            "-" +
            stringDate.slice(4, 6) +
            "-" +
            stringDate.slice(6)
    );
}
async function fetchTimeTable(fmonday, refresh) {
    document.querySelectorAll(".class").forEach((e) => (e.innerHTML = ""));
    var fmonday = getDate(fmonday);
    var ffriday = new Date(fmonday.getTime() + 1000 * 60 * 60 * 24 * 4);
    if (window.innerWidth < 800) {
        $("#timetable-title").innerHTML = "<span id='timetable-date'></span>";
    }
    $("#timetable-date").textContent = `${fmonday.getMonth() + 1}.
        ${fmonday.getDate()} ~ ${ffriday.getMonth() + 1}.${ffriday.getDate()}`;
    await fetch(
        `/api/timetable?monday=${formatDate(fmonday)}&refresh=${refresh ?? ""}`,
        {
            method: "GET",
        }
    )
        .then((d) => d.json())
        .then((data) => {
            if (data.success) {
                data.table.forEach((b) => {
                    $(
                        `tbody > tr:nth-child(${b.PERIO}) > td:nth-child(${
                            (getDate(b.ALL_TI_YMD) - fmonday) / 86400000 + 2
                        })`
                    ).innerHTML = b.ITRT_CNTNT.replace("-", "");
                });
                for (var i = 0; i < 5; i++) {
                    $(`thead > tr > th:nth-child(${i + 2})`).dataset.date =
                        formatDate(
                            new Date(
                                fmonday.getTime() + 1000 * 60 * 60 * 24 * i
                            )
                        );

                    for (var j = 0; j < 7; j++) {
                        $(
                            `tbody > tr:nth-child(${j + 1}) > td:nth-child(${
                                i + 2
                            })`
                        ).dataset.date = formatDate(
                            new Date(
                                fmonday.getTime() + 1000 * 60 * 60 * 24 * i
                            )
                        );
                    }
                }
                if (refresh) {
                    setTimeout(() => alert("새로고침을 완료했습니다."));
                }
            }
        });
}

// FETCH CACHE STORAGE
var cache = {
    meal: {},
    meta: {},
};
var today = formatDate(new Date());

// FETCH
window.onload = async () => {
    fetchTimeTable(monday);
    fetchMeal(today);
    fetchpost();
    fetchNotice();
    fetchAllNotice();
};

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
    location.href = "/notice/" + link;
}

function openPost(link) {
    location.href = "/post/" + link;
}

function newPost() {
    location.href = "/new-post";
}

window.onerror = (message, url, lineNumber) => {
    $("#error").classList.add("show");
    $("#error").style.display = "block";
    $("#error-message").innerHTML = "문제가 보고되었습니다. <br>" + message;
    fetch(
        `/error?message=${message}&url=${url}&line=${lineNumber}&page=${location.href}`,
        {
            method: "GET",
        }
    );
    return true;
};
