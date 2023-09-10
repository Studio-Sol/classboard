import express from "express";
import { ObjectId } from "bson";
import Class from "../models/class.entity.js";
import User from "../models/user.entity.js";
import { getMondayDate, getUserById } from "../util/index.js";
import teacherRouter from "./teacher.js";
import authRouter from "./auth.js";
import noticeRouter from "./notice.js";
import postRouter from "./post.js";
const router = express.Router();
router.get("/", async (req, res) => {
    let user = null;
    if (req.session.user_id) user = await getUserById(req.session.user_id);
    return res.render("index.html", { user });
});
// MAIN
router.get("/main", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    if (!user.class) {
        if (user.type == "teacher") {
            res.redirect("/register-class");
        } else if (user.type == "student") {
            res.redirect("/invite");
        } else {
            res.redirect("/login/type");
        }
        return;
    }
    var classroom = await Class.findOne({
        _id: user.class,
    });
    if (user.waiting) {
        return res.render("wait.html", { waiting: user.class });
    }
    var monday = getMondayDate(new Date());
    res.render("main.html", {
        monday: monday,
        grade: classroom.class.GRADE,
        classroom: classroom.class.CLASS_NM,
        school_name: classroom.school.SCHUL_NM,
        user: user,
        sidebar: ["notice", "post", "calander"],
    });
});

router.get("/invite", async (req, res) => {
    var user = await User.findOne({
        _id: new ObjectId(req.session.user_id),
    });
    if (user.class) {
        res.redirect("/");
        return;
    }
    if (user.type != "student") {
        res.redirect("/");
        return;
    }
    res.render("invite.html", { error: req.query.error ?? "" });
});

router.get("/invite/:code", async (req, res) => {
    var user = await User.findOne({
        _id: new ObjectId(req.session.user_id),
    });
    if (user.class) {
        res.redirect("/");
        return;
    }
    if (user.type != "student") {
        res.redirect("/");
        return;
    }
    var classroom = await Class.findOne({
        invite: req.params.code.toUpperCase(),
    });

    if (classroom) {
        await User.updateOne(
            { _id: new ObjectId(req.session.user_id) },
            { $set: { class: classroom._id, waiting: true } }
        );
        res.redirect("/main");
    } else {
        res.redirect("/invite?error=noinvite");
    }
});

// 소셜 기능
router.get("/user/:id", async (req, res) => {
    try {
        new ObjectId(req.params.id);
    } catch {
        res.sendStatus(404);
        return;
    }
    var user = await User.findOne({ _id: new ObjectId(req.params.id) });
    if (!user) {
        res.sendStatus(404);
        return;
    }
    var classroom = await Class.findOne({ _id: user.class });
    res.render("user.html", { user: user, classroom: classroom });
});

// POST and NOTICE

router.get("/calendar", (req, res) => {
    res.render("calendar.html");
});
router.get("/how-to-install-app", (req, res) => {
    res.render("how_to_install_app.html");
});
// ETC
router.get("/privacy", (req, res) => {
    res.render("privacy.html");
});

router.get("/terms", (req, res) => {
    res.render("terms.html");
});

router.get("/jobs", (req, res) => {
    res.render("jobs.html");
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
    res.redirect("mailto:dev.sol.studio@gmail.com");
});

router.get("/redirect", async (req, res) => {
    res.redirect("/invite/" + req.query.url);
});

router.get("/setting", async (req, res) => {
    var user = await User.findOne({
        _id: new ObjectId(req.session.user_id),
    });
    res.render("setting.html", { user: user });
});

router.use(teacherRouter);
router.use(authRouter);
router.use(noticeRouter);
router.use(postRouter);

export default router;
