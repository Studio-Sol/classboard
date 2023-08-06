import { ObjectId } from "bson";
import User from "../models/user.entity.js";
import Class from "../models/class.entity.js";
import Post from "../models/post.entity.js";
import express from "express";
import { getUserById } from "../util/index.js";
const router = express.Router();

router.get("/new-post", async (req, res) => {
    res.render("new_post.html", { mode: "new" });
});

router.get("/post", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    var classroom = await Class.findOne({
        _id: user.class,
    });
    res.render("post_list.html", {
        grade: classroom.class.GRADE,
        classroom: classroom.class.CLASS_NM,
        school_name: classroom.school.SCHUL_NM,
    });
});

router.get("/post/:id", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    try {
        new ObjectId(req.params.id);
    } catch {
        res.sendStatus(404);
        return;
    }
    var data = await Post.findOne({
        class: user.class,
        _id: new ObjectId(req.params.id),
    });
    if (data == null) {
        res.sendStatus(404);
        return;
    }
    var author = await User.findOne({
        _id: new ObjectId(data.author),
    });
    data.content = data.content
        .replace(/<script/gi, "&lt;script")
        .replace(/<\/script/gi, "&lt;/script&gt;");
    res.render("post.html", {
        data: data,
        author: author,
        user: {
            _id: user._id,
            type: user.type,
            name: user.name,
            avatar: user.avatar,
        },
        serviceURL: process.env.SERVICE_URL,
    });
});
router.get("/post/:id/edit", async (req, res) => {
    let post = await Post.findById(req.params.id);
    if (String(req.session.user_id) != String(post.author)) {
        res.redirect("/");
        return;
    }
    res.render("new_post.html", {
        mode: "edit",
        post: await Post.findById(req.params.id),
    });
});
export default router;
