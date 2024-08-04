import express from "express";
import { ObjectId } from "bson";
import Class from "../models/class.entity.js";
import User from "../models/user.entity.js";
import teacherRouter from "./teacher.js";
import authRouter from "./auth.js";
import noticeRouter from "./notice.js";
import postRouter from "./post.js";
const router = express.Router();

router.get("/calendar", (req, res) => {
    res.render("calendar.html");
});
router.get("/how-to-install-app", (req, res) => {
    res.render("how_to_install_app.html");
});

router.get("/delete-user", async (req, res) => {
    var user = await User.findOne({
        _id: new ObjectId(req.session.user_id),
    });
    var classroom = await Class.findOne({ _id: user.class });

    res.render("delete-user.html", {
        user: user,
        classroom: classroom,
    });
});
router.get("/contact", (req, res) => {
    res.redirect("mailto:contact@classboard.kr");
});

router.get("/redirect", async (req, res) => {
    res.redirect("/invite/" + req.query.url);
});

router.use(teacherRouter);
router.use(authRouter);
router.use(noticeRouter);
router.use(postRouter);

export default router;
