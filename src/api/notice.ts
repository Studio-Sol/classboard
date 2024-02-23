import express from "express";
import Notice from "../models/notice.entity.js";
import Reply from "../models/reply.entity.js";
import { ObjectId } from "bson";
import User from "../models/user.entity.js";
import { getUserById } from "../util/index.js";
import Comment from "../models/comment.entity.js";
const router = express.Router();
router.post("/api/notice", async (req, res) => {
    let questions = [];
    for (let q of req.body.questions ?? []) {
        if (q.qtype == "text") {
            questions.push(q);
        } else {
            for (let i = 0; i < q.items.length; i++) {
                q.items[i].limit = parseInt(q.items[i].limit);
                if (isNaN(q.items[i].limit)) {
                    q.items[i].limit = null;
                }
            }
            questions.push(q);
        }
    }
    var user = await getUserById(req.session.user_id);

    var notice_new = await new Notice({
        title: req.body.title,
        content: req.body.content,
        preview: req.body.content.replace(/<[^>]*>?/gm, "").slice(0, 20),
        author: user._id,
        class: user.class,
        timestamp: new Date().getTime(),
        questions: questions,
    }).save();
    return res.json({ status: "success", id: notice_new._id });
});
router.post("/api/notice/:id", async (req, res) => {
    let notice = await Notice.findById(req.params.id);
    if (String(req.session.user_id) != String(notice.author)) {
        return res.json({
            status: "failed",
            message: "수정 권한이 없습니다.",
        });
    }
    let notice_update = await Notice.updateOne(
        {
            _id: new ObjectId(req.params.id),
        },
        {
            $set: {
                title: req.body.title,
                content: req.body.content,
                preview: req.body.content
                    .replace(/<[^>]*>?/gm, "")
                    .slice(0, 20),
            },
        },
        { upsert: false }
    ).exec();
    if (notice_update.modifiedCount == 0) {
        return res.json({
            status: "failed",
            message: `요청이 잘못되었습니다. 존재하지 않는 ID(${req.params.id})`,
        });
    }
    return res.json({ status: "success", id: notice._id });
});
router.post("/api/notice/question/reply", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    try {
        new ObjectId(req.body.id);
    } catch {
        return res.sendStatus(404);
    }
    var questions = (await Notice.findOne({ _id: new ObjectId(req.body.id) }))
        .questions;

    if (!questions) return res.sendStatus(404);
    let answers = [];
    var i = 0;
    for (let q of questions) {
        let answer;
        if (q.qtype == "select") {
            answer = parseInt(req.body.answers[i]);
            if (isNaN(answer)) {
                return res.json({
                    success: false,
                    message: "정상적인 요청이 아닙니다.",
                });
            }
            if (q.items[answer].limit != null) {
                if (
                    (await Reply.countDocuments({
                        id: req.body.id,
                        answer: req.body.answer,
                    })) >= q.items[answer].limit
                )
                    return res.json({
                        success: false,
                        message: `${i}번 질문의 ${answer}번 항목의 회신 최대 인원수 제한을 초과했습니다.`,
                    });
            }
            answers.push(answer);
        } else {
            answers.push(req.body.answers[i]);
        }
        i++;
    }
    await Reply.updateOne(
        {
            user: user._id,
            id: req.body.id,
        },
        {
            $set: {
                user: user._id,
                id: req.body.id,
                answers: answers,
                timestamp: new Date().getTime(),
            },
        },
        { upsert: true }
    );

    res.json({ success: true });
});

router.get("/api/notice", async (req, res) => {
    try {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        if (isNaN(parseInt(req.query.skip as string))) {
            res.json({ success: false, message: "비정상적인 요청" });
            return;
        }
        var data = await Notice.find({
            class: user.class,
        })
            .sort({ _id: -1 })
            .skip(parseInt(req.query.skip as string))
            .limit(5)
            .exec();

        var result = [];
        for (const d of data) {
            if (req.query.preview) {
                var author = await User.findOne({
                    _id: d.author,
                });
                result.push({
                    title: d.title,
                    id: d._id,
                    preview: d.preview,
                    timestamp: d.timestamp,
                    author: {
                        name: author.name,
                        avatar: author.avatar,
                    },
                });
            } else {
                result.push({ title: d.title, id: d._id });
            }
        }
        res.json({ success: true, notice: result });
    } catch {
        res.json({
            success: false,
            message: "알 수 없는 에러 (GET 파라미터를 확인해주세요)",
        });
    }
});
router.delete("/api/notice/:id", async (req, res) => {
    let notice = await Notice.findById(req.params.id);
    if (String(req.session.user_id) != String(notice.author)) {
        return res
            .status(403)
            .json({ status: "failed", message: "삭제 권한이 없습니다" });
    }

    await Comment.deleteMany({ id: String(notice._id) });
    await notice.deleteOne();

    return res.json({
        status: "success",
        message: "성공적으로 삭제되었습니다.",
    });
});
export default router;
