import { ObjectId } from "bson";
import User from "../models/user.entity.js";
import Class from "../models/class.entity.js";
import Notice from "../models/notice.entity.js";
import Reply from "../models/reply.entity.js";
import express from "express";
import { getUserById } from "../util/index.js";
const router = express.Router();

router.get("/new-notice", async (req, res) => {
    var user = await User.findOne({
        _id: new ObjectId(req.session.user_id),
    });
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    res.render("new_notice.html");
});

router.get("/notice", async (req, res) => {
    var user = await User.findOne({
        _id: new ObjectId(req.session.user_id),
    });
    var classroom = await Class.findOne({
        _id: user.class,
    });
    res.render("notice_list.html", {
        grade: classroom.class.GRADE,
        classroom: classroom.class.CLASS_NM,
        school_name: classroom.school.SCHUL_NM,
    });
});

router.get("/notice/:id", async (req, res) => {
    var user = await User.findOne({
        _id: new ObjectId(req.session.user_id),
    });
    try {
        new ObjectId(req.params.id);
    } catch {
        res.sendStatus(404);
        return;
    }

    var data = await Notice.findOne({
        class: user.class,
        _id: new ObjectId(req.params.id),
    });
    if (!data) {
        res.sendStatus(404);
        return;
    }
    let questions = [];
    if (data.questions) {
        for (let [idx, q] of data.questions.entries()) {
            questions.push(q);
            if (user.type == "teacher") {
                let rawReplies = await Reply.find({
                    id: String(data._id),
                }).exec();
                questions[idx]["replies"] = [];
                for (const r of rawReplies) {
                    questions[idx]["replies"].push({
                        timestamp: r.timestamp,
                        user: await User.findOne({ _id: r.user }),
                        answer: r.answers[idx],
                    });
                }
            } else if (q.qtype == "select") {
                let rawReplies = await Reply.find({
                    id: String(data._id),
                }).exec();
                questions[idx]["replies"] = [];
                for (const r of rawReplies) {
                    questions[idx]["replies"].push({
                        timestamp: r.timestamp,
                        user: await User.findOne({ _id: r.user }),
                        answer: r.answers[idx],
                    });
                }
            }
        }
    }

    var author = await getUserById(data.author);
    if (data == null) {
        return res.sendStatus(404);
    }
    res.render("notice.html", {
        user: user,
        author: author,
        data: data,
        questions: questions,
        formatDate: (date) => {
            let formatted_date =
                date.getFullYear() +
                "/" +
                (date.getMonth() + 1) +
                "/" +
                date.getDate() +
                " " +
                date.getHours() +
                ":" +
                date.getMinutes();
            return formatted_date;
        },
        serviceURL: process.env.SERVICE_URL,
    });
});
export default router;
