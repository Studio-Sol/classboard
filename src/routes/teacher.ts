import { ObjectId } from "bson";
import express from "express";
import User from "../models/user.entity.js";
import Class from "../models/class.entity.js";
import { choice, getUserById } from "../util/index.js";
import Neis from "../modules/neis.js";
const neis = new Neis(process.env.NEIS_API_KEY);
const router = express.Router();
// 선생님 전용 페이지들
router.use(["/teacher", "/teacher/*"], async (req, res, next) => {
    var user = await getUserById(req.session.user_id);
    if (user.type != "teacher") return res.redirect("/");
    if (!user.class) return res.redirect("/register-class");
    next();
});

router.get("/teacher", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    var classroom = await Class.findOne({ _id: user.class });
    if (!classroom) return res.redirect("/");

    var students = await User.find({
        class: classroom._id,
        waiting: false,
    }).exec();
    var join_request = await User.find({
        class: classroom._id,
        waiting: true,
    }).exec();
    res.render("teacher/index.html", {
        classroom,
        students,
        join_request,
        user,
    });
});

router.get("/teacher/seat", async (req, res) => {
    res.render("seat/index.html");
});

router.get("/teacher/seat/print", async (req, res) => {
    res.render("seat/print.html");
});

export default router;
