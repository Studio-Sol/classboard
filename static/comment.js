var loaded = 0;
function loadComment(reply) {
    if (reply) {
        var skip = replyStorage[reply] ?? 0;
    }
    else {
        var skip = loaded
    }
    $.ajax({
        url: "/api/comment",
        method: "GET",
        data: {
            id: id,
            skip: skip,
            reply: reply
        },
        success: (data) => {
            data.comment.forEach((d) => {
                renderComment(d);
            })
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
                    `)
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
                `)
            }
        }
    })
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
            reply: reply
        },
        success: (data) => {
            renderComment(data.comment)
        }
    })
}

function renderComment(d) {
    if (!d.reply) {
        console.log("no reply")
        $("#comment").append(`
            <div class="mt-4 p-1" id="${d._id}">
                <div style="display: flex;">
                    <img style="width: 2rem; height: 2rem; margin-right: 1rem;" src="${d.author.avatar}">
                    <h4 style="width: fit-content; margin: 0px; padding: 0px;"><strong>${d.author.name}</strong></h4>
                </div>
                <div style="margin-left: 2rem">
                    <div class="p-3 pt-0 pb-1" style="font-size: large;">
                        ${d.content}
                    </div>
                    <div class="p-3 pt-0" style="font-size: small; color: #888;">
                        ${moment(new Date(d.timestamp)).format("YYYY.MM.DD HH:mm")} ${replycount(d)} <span class="btn" style="color: #888" onclick="$('#reply-${d._id}').show()">답글 달기</span>
                    </div>
                    <div style="display: none;" id="reply-${d._id}">
                        <textarea style="width: 100%;" placeholder="댓글을 남겨보세요" id="content-${d._id}"></textarea>
                        <div style="display: flex;justify-content: space-between">
                            <div></div>
                            <div>
                                <button class="btn btn-secondary" style="color: #888" onclick="$('#reply-${d._id}').hide()">닫기</button>
                                <button class="btn btn-primary" onclick="addComment('${d._id}')">등록</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `)
    }
    else {
        $("#" + d.reply).append(`
            <div class="ms-5 p-1" id="${d._id}">
                <div style="display: flex;">
                    <img style="width: 2rem; height: 2rem; margin-right: 1rem;" src="${d.author.avatar}">
                    <h4 style="width: fit-content; margin: 0px; padding: 0px;"><strong>${d.author.name}</strong></h4>
                </div>
                <div style="margin-left: 2rem">
                    <div class="p-3 pt-0 pb-1" style="font-size: large;">
                        ${d.content}
                    </div>
                    <div class="p-3 pt-0" style="font-size: small; color: #888;">
                        ${moment(new Date(d.timestamp)).format("YYYY.MM.DD HH:mm")}
                    </div>
                </div>
            </div>
        `)
    }
}
function replycount (d) {
    if (d.reply_count > 0) {
        return `<span class="btn" style="color: #888" onclick="loadComment('${d._id}'); $(event.target).remove()">답글 보기</span>`
    }
    else {
        return ""
    }
}



var replyStorage = {}