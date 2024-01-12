import Post from "../models/post.entity.js";
import express from "express";
const router = express.Router();
router.get("/new-post", async (req, res) => {
    res.render("new_post.html", { mode: "new" });
});
router.get("/edit-post/:id", async (req, res) => {
    let post = await Post.findById(req.params.id);
    if (String(req.session.user_id) != String(post.author)) {
        res.redirect("/");
        return;
    }
    res.render("new_post.html", {
        mode: "edit",
        post: post,
    });
});
export default router;
