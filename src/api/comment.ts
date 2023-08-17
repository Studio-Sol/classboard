import express from "express";
import Comment from "../models/comment.entity.js";
import { getUserById } from "../util/index.js";

const router = express.Router();
router.get("/api/comment", async (req, res) => {
    if (isNaN(parseInt(req.query.skip as string))) {
        res.json({ success: false });
        return;
    }
    var raw = await Comment.find({
        id: req.query.id,
        reply: req.query.reply ?? null,
    })
        .limit(30)
        .skip(parseInt(req.query.skip as string))
        .exec();

    var comments = [];

    for (const r of raw) {
        var author = await getUserById(r.author);
        comments.push({
            _id: r._id,
            author: {
                name: author.name,
                avatar: author.avatar,
            },
            content: r.content,
            timestamp: r.timestamp,
            reply: r.reply,
            reply_count: await Comment.count({ reply: String(r._id) }),
        });
    }

    res.json({
        success: true,
        comment: comments,
        total: await Comment.count({
            id: req.query.id,
            reply: req.query.reply ?? null,
        }),
    });
});

router.post("/api/comment", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    var comment = await new Comment({
        id: req.body.id,
        author: user._id,
        content: req.body.content,
        timestamp: new Date().getTime(),
        reply: req.body.reply ?? null,
    }).save();

    res.json({
        success: true,
        comment: {
            _id: comment._id,
            id: req.body.id,
            author: {
                name: user.name,
                avatar: user.avatar,
            },
            content: req.body.content,
            timestamp: new Date().getTime(),
            reply: req.body.reply ?? null,
        },
    });
});

router.delete("/api/comment/:id", async (req, res) => {
    const comment = await Comment.findById(req.params.id).exec();
    if (String(comment.author) == req.session.user_id) {
        comment.deleteOne();
        res.json({ status: "success" });
    } else {
        res.status(403).json({ status: "failed" });
    }
});
export default router;
