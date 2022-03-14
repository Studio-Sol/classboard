$("#school-grade-class").html(`${school_name} ${grade}학년 ${class_}반`)


$("td.class, th.dayofweek").on("click", (event) => {
    $(".active").removeClass("active")
    $(`*[data-date='${event.target.attributes["data-date"].value}']`).addClass("active")

    var date = formatDate(parseInt(event.target.attributes["data-date"].value))
    fetchpost(date)
    fetchMeal(date)
    currentDate = date

});


function addMeta() {
    $("#add-meta").css("display", "flex");
    $("#overlay").show()
}

function formatDate(date) {
    var date = new Date(date);
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + month + day;
}

function fetchMeal(date) {
    $("#meal").html("로드중...");
    $("#meal-date").html(date.slice(0, 4) + "/" + date.slice(4, 6) + "/" + date.slice(6));

    if (Object.keys(cache.meal).indexOf(date) != -1) {
        var data = cache.meal[date]
        if (data.meal.length == 0) {
            $("#meal").html("데이터 없음");
            $("#meal-date").html(date.slice(0, 4) + "/" + date.slice(4, 6) + "/" + date.slice(6));
        }
        else {
            $("#meal").html("")
            data.meal.forEach(d => {
                $("#meal").append(`<strong>${d.MMEAL_SC_NM}</strong><br>`);
                $("#meal").append(d.DDISH_NM);
            })
            $("#meal-date").html(date.slice(0, 4) + "/" + date.slice(4, 6) + "/" + date.slice(6));
        }

        return;
    }


    $.ajax({
        url: "/api/meal?date=" + date,
        method: "GET",
        success: (data) => {
            cache.meal[date] = data;
            if (data.meal.length == 0) {
                $("#meal").html("데이터 없음");
                $("#meal-date").html(date.slice(0, 4) + "/" + date.slice(4, 6) + "/" + date.slice(6))
            }
            else {
                $("#meal").html("")
                data.meal.forEach(d => {
                    $("#meal").append(`<strong>${d.MMEAL_SC_NM}</strong><br>`);
                    $("#meal").append(d.DDISH_NM);
                })
                
                $("#meal-date").html(date.slice(0, 4) + "/" + date.slice(4, 6) + "/" + date.slice(6))
            }

        }
    })
}

function fetchpost() {
    $("#metadata").html("로드중...");

    $.ajax({
        url: `/api/post?_=${Math.random()}`,
        method: "GET",
        success: (data) => {
            if (data.success) {
                $("#metadata").html("");
                for (const d of data.post) {
                    $("#metadata").append(`<li class="list-group-item" onclick="openPost('${d.id}')">${d.title}</li>`)
                }
                if (data.post.length == 0) {
                    $("#metadata").append(`<strong class="list-group-item">메모 없음</strong>`)
                }
            } else {
                $("#metadata").html("오류가 발생했습니다.");
                throw Error("fetchpost.ajax.success.false");
            }
        }
    })
}
function fetchNotice() {
    $("#notice").html("로드중...");

    $.ajax({
        url: `/api/notice?_=${Math.random()}`,
        method: "GET",
        success: (data) => {
            if (data.success) {
                $("#notice").html("");
                for (const d of data.notice) {
                    $("#notice").append(`<li class="list-group-item" onclick="openNotice('${d.id}')">${d.title}</li>`)
                }
                if (data.notice.length == 0) {
                    $("#notice").append(`<strong class="list-group-item">공지 없음</strong>`)
                }
            } else {
                $("#notice").html("오류가 발생했습니다.");
                throw Error("fetchNotice.ajax.success.false");
            }
        }
    })
}
function fetchTimeTable(monday, refresh) {
    $.ajax({
        url: `/api/timetable?monday=${monday}&school_name=${school_name}&grade=${grade}&class_num=${class_}&refresh=${refresh ?? ""}`,
        method: "GET",
        beforeSend : () => {
            $("#loading-overlay").hide();
        },
        success: (data) => {
            if (data.success) {
                data.timedata.forEach(a => {
                    a.forEach(b=> {
                        $(`tbody > tr:nth-child(${b.classTime}) > td:nth-child(${b.weekday + 2})`).html(`${b.subject}<br>${b.teacher}`).attr("data-date", new Date(monday.slice(0,4) + "-" + monday.slice(4, 6) + "-" + monday.slice(6)).getTime() + 1000 * 60 * 60 * 24 * b.weekday)
                        $(`thead > tr > th:nth-child(${b.weekday + 2})`).attr("data-date", new Date(monday.slice(0,4) + "-" + monday.slice(4, 6) + "-" + monday.slice(6)).getTime() + 1000 * 60 * 60 * 24 * b.weekday)
                    })
                })
                var tmp = 0;
                data.classtime.forEach(a => {
                    tmp++;
                    $(`tbody > tr:nth-child(${tmp}) > td:nth-child(1)`).html(a.split("(")[0] + "<br>(" + a.split("(")[1])
                })
            }
            else {
                throw Error("fetchTimeTable.ajax.success.false\n" + data.message)
            }
            if (refresh) {
                alert("새로고침을 완료했습니다.")
            }
        }
    })
}


$("#form-cancel").on("click", (event) => {
    $("#add-meta").hide();
    $("#overlay").hide()
})
$("form").on("submit", (event) => {
    event.preventDefault();
    $.ajax({
        url: `/api/post`,
        method: "POST",
        data: {
            title: $("#form-title").val(),
            content: $("#form-content").val()
        },
        success: (data) => {
            fetchpost(currentDate)
        }
    });
    $("#add-meta").hide();
    $("#overlay").hide()
})
var cache = {
    meal: {},
    meta: {}
}
var today = formatDate(new Date());

var currentDate = today;

fetchTimeTable(monday)
fetchMeal(today);
fetchpost();
fetchNotice();


function openNotice(link) {
    open("/notice/" + link, "__blank")
}
function openPost(link) {
    open("/post/" + link, "__blank")
}


const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);

    if (currentTheme === 'dark') {
        toggleSwitch.checked = true;
    }
}

function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
}

toggleSwitch.addEventListener('change', switchTheme, false);

window.onerror = (message, url, lineNumber) => {
    $("#error").addClass("show").show();
    $("#overlay").show()
    $("#error-message").html(message);
    $.ajax({
        url: `/api/error?message=${message}&url=${url}&line=${lineNumber}&page=${location.href}`,
        method: "GET"
    })
    return true;
}
