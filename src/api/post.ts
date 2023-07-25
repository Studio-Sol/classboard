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
export default router;
