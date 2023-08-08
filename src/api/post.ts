import express from "express";
import Post from "../models/post.entity.js";
import { ObjectId } from "bson";
import User from "../models/user.entity.js";
import { getUserById } from "../util/index.js";

const router = express.Router();
router.post("/api/post", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    var post_new = await new Post({
        title: req.body.title,
        content: req.body.content,
        preview: req.body.content.replace(/<[^>]*>?/gm, "").slice(0, 20),
        author: user._id,
        class: user.class,
        timestamp: new Date().getTime(),
    }).save();

    res.redirect("/post/" + post_new._id.toString());
});

router.get("/api/post", async (req, res) => {
    try {
        var user = await getUserById(req.session.user_id);
        if (isNaN(parseInt(req.query.skip as string))) {
            res.json({ success: false });
            return;
        }
        var data = await Post.find({
            class: user.class,
        })
            .sort({ _id: -1 })
            .skip(parseInt(req.query.skip as string))
            .limit(10)
            .exec();

        var result = [];
        for (const d of data) {
            if (req.query.preview) {
                var author = await User.findOne({
                    _id: new ObjectId(d.author),
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
        res.json({ success: true, post: result });
    } catch {
        res.json({
            success: false,
            message: "알 수 없는 에러 (GET 파라미터를 확인해주세요)",
        });
    }
});
router.post("/api/post/:id", async (req, res) => {
    let post = await Post.findById(req.params.id);
    if (String(req.session.user_id) != String(post.author)) {
        return res.json({
            status: "failed",
            message: "수정 권한이 없습니다.",
        });
    }
    let post_update = await Post.updateOne(
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
    if (post_update.modifiedCount == 0) {
        return res.json({
            status: "failed",
            message: `요청이 잘못되었습니다. 존재하지 않는 ID(${req.params.id})`,
        });
    }
    return res.json({ status: "success", id: post._id });
});
router.delete("/api/post/:id", async (req, res) => {
    let post = await Post.findById(req.params.id);
    if (String(req.session.user_id) != String(post.author)) {
        return res
            .status(403)
            .json({ status: "failed", message: "삭제 권한이 없습니다" });
    }
    post.deleteOne();
    return res.json({
        status: "success",
        message: "성공적으로 삭제되었습니다.",
    });
});
export default router;
