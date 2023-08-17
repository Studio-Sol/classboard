var loaded = 0;
function loadComment(reply) {
    if (reply) {
        var skip = replyStorage[reply] ?? 0;
    } else {
        var skip = loaded;
    }
    $.ajax({
        url: "/api/comment",
        method: "GET",
        data: {
            id: id,
            skip: skip,
            reply: reply,
        },
        success: (data) => {
            data.comment.forEach((d) => {
                renderComment(d);
            });
            if (reply) {
                if (!replyStorage[reply]) {
                    replyStorage[reply] = 0;
                }
                replyStorage[reply] += data.comment.length;
                if (data.total > replyStorage[reply] * 30) {
                    $("#" + reply).append(`
                        <div class="mt-4 ms-5 p-1" id="more">
                            <div>
                                <button class="btn btn-primary" onclick="$('#more').remove();loadComment();">더보기</button>
                            </div>
                        </div>
                    `);
                }
            }
            loaded += data.comment.length;
            if (!reply && data.total > loaded) {
                $("#comment").append(`
                    <div class="mt-4 p-1" id="more">
                        <div style="display: flex; justify-content: center;">
                            <button class="btn btn-primary" onclick="$('#more').remove();loadComment();">더보기</button>
                        </div>
                    </div>
                `);
            }
        },
    });
}
function addComment(reply) {
    var content = $(`#content-${reply ?? ""}`).val();
    if (!content) {
        alert("내용을 입력해주세요.");
        return;
    }

    $(`#content-${reply ?? ""}`).val("");

    $.ajax({
        url: "/api/comment",
        method: "POST",
        data: {
            id: id,
            content: content,
            reply: reply,
        },
        success: (data) => {
            renderComment(data.comment);
        },
    });
}
function xsssafe(content) {
    var result = "";

    result = content;
    result = result.replaceAll("<", "&lt;");
    result = result.replaceAll(">", "&gt;");

    return result;
}
function renderComment(d) {
    if (!d.reply) {
        $("#comment").append(`
            <div class="mt-4 p-1" id="${d._id}">
                <div style="display: flex; justify-content: space-between">
                    <div style="display: flex;">
                        <img class="rounded" style="width: 2rem; height: 2rem; margin-right: 1rem;" src="${
                            d.author.avatar
                        }">
                        <h4 style="width: fit-content; margin: 0px; padding: 0px;"><strong>${
                            d.author.name
                        }</strong></h4>
                    </div>
                    <div>
                        <a href="#" onclick="deleteComment('${
                            d._id
                        }');"><i class="fa fa-trash"></i>삭제</a>
                    </div>
                </div>
                <div style="margin-left: 2rem">
                    <div class="p-3 pt-0 pb-1" style="font-size: large;">
                        ${xsssafe(d.content).replaceAll("\n", "<br>")}
                    </div>
                    <div class="p-3 pt-0" style="font-size: small; color: #888;">
                        ${new luxon.DateTime(
                            d.timestamp
                        ).toLocaleString()} ${replycount(
            d
        )} <span class="btn" style="color: #888" onclick="$('#reply-${
            d._id
        }').show()">답글 달기</span>
                    </div>
                    <div style="display: none;" id="reply-${d._id}">
                        <textarea style="width: 100%;" placeholder="댓글을 남겨보세요" id="content-${
                            d._id
                        }"></textarea>
                        <div style="display: flex;justify-content: space-between">
                            <div></div>
                            <div>
                                <button class="btn btn-secondary" style="color: #888" onclick="$('#reply-${
                                    d._id
                                }').hide()">닫기</button>
                                <button class="btn btn-primary" onclick="addComment('${
                                    d._id
                                }')">등록</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    } else {
        $("#" + d.reply).append(`
            <div class="ms-5 p-1" id="${d._id}">
                <div style="display: flex;">
                    <img class="rounded" style="width: 2rem; height: 2rem; margin-right: 1rem;" src="${
                        d.author.avatar
                    }">
                    <h4 style="width: fit-content; margin: 0px; padding: 0px;"><strong>${
                        d.author.name
                    }</strong></h4>
                </div>
                <div style="margin-left: 2rem">
                    <div class="p-3 pt-0 pb-1" style="font-size: large;">
                        ${d.content}
                    </div>
                    <div class="p-3 pt-0" style="font-size: small; color: #888;">
                        ${new luxon.DateTime(d.timestamp).toLocaleString()}
                    </div>
                </div>
            </div>
        `);
    }
}
function replycount(d) {
    if (d.reply_count > 0) {
        return `<span class="btn" style="color: #888" onclick="loadComment('${d._id}'); $(event.target).remove()">답글 보기</span>`;
    } else {
        return "";
    }
}
function deleteComment(id) {
    if (confirm("정말 삭제하시겠습니까?"))
        $.ajax({
            url: "/api/comment/" + id,
            method: "DELETE",
            success: (data) => {
                if (data.status == "success") {
                    $("#" + id).remove();
                    setTimeout(() => alert("삭제되었습니다."));
                } else alert("삭제에 실패했습니다.");
            },
        });
}
var replyStorage = {};
document.head.append(`<style>.dropdown {
    display: inline-block;
}

.dropdown li {
    float: left;
    list-style-type: none;
    position: relative;
}

.dropdown li a {
    font-size: 16px;
    color: var(--text);
    display: block;
    line-height: 60px;
    padding: 0 26px;
    text-decoration: none;
    border-left: 1px solid #2e2e2e;
    font-family: Montserrat, sans-serif;
    text-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
}

#options a {
    border-left: 0 none;
}
#options > a {
    background-position: 85% center;
    background-repeat: no-repeat;
    padding-right: 42px;
}
.subnav {
    visibility: hidden;
    position: absolute;
    top: 110%;
    right: 0;
    width: 200px;
    height: auto;
    opacity: 0;
    transition: all 0.1s;
    background: var(--bg);
}
.subnav {
    padding: 0px;
}
.subnav li {
    float: none;
}
.subnav li a {
    border-bottom: 1px solid #2e2e2e;
}
#options:hover .subnav {
    visibility: visible;
    top: 100%;
    opacity: 1;
}
.subnav li:nth-child(1) > a:hover {
    color: red;
}</style>`);
