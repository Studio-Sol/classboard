import express from "express";
import { ObjectId } from "bson";
import Neis from "../modules/neis.js";
import auth from "./auth.js";
import Class from "../models/class.entity.js";
import User from "../models/user.entity.js";
import Post from "../models/post.entity.js";
import Notice from "../models/notice.entity.js";
import Reply from "../models/reply.entity.js";
import { getMondayDate, getUserById } from "../util/index.js";
import teacher from "./teacher.js";
export default (app: express.Application, neis: Neis, serviceURL) => {
    // STATUS BOT
    app.head("/", (req, res) => {
        res.set("status", "success");
        res.end();
    });

    app.get("/", (req, res) => {
        res.render("index.html", { user_id: req.session.user_id ?? false });
    });
    auth(app, serviceURL);
    // MAIN
    app.get("/main", async (req, res) => {
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
        });
    });

    app.get("/invite", async (req, res) => {
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

    app.get("/invite/:code", async (req, res) => {
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
    app.get("/user/:id", async (req, res) => {
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
    app.get("/new-post", async (req, res) => {
        res.render("new_post.html");
    });

    app.get("/post", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        var classroom = await Class.findOne({
            _id: user.class,
        });
        res.render("post_list.html", {
            grade: classroom.class.GRADE,
            classroom: classroom.class.CLASS_NM,
            school_name: classroom.school.SCHUL_NM,
        });
    });

    app.get("/post/:id", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
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
            user: { name: user.name, avatar: user.avatar },
            serviceURL: serviceURL,
        });
    });

    app.get("/new-notice", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        if (user.type != "teacher") {
            res.redirect("/");
            return;
        }
        res.render("new_notice.html");
    });

    app.get("/notice", async (req, res) => {
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

    app.get("/notice/:id", async (req, res) => {
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
        if (data.question) {
            let raw = [];
            if (data.question.type == "select") {
                raw = await Reply.find({
                    id: String(data._id),
                }).exec();
                var items = {};
                for (const r of raw) {
                    if (Object.keys(items).includes(r.answer)) {
                        items[r.answer] += 1;
                    } else {
                        items[r.answer] = 1;
                    }
                }
            } else {
                if (user.type == "teacher") {
                    raw = await Reply.find({
                        id: String(data._id),
                    }).exec();
                }
            }
            if (user.type == "teacher") {
                var replies = [];
                for (const r of raw) {
                    replies.push({
                        timestamp: r.timestamp,
                        user: await User.findOne({ _id: new ObjectId(r.user) }),
                        answer: r.answer,
                    });
                }
            }
        }

        var author = await User.findOne({
            _id: data.author,
        });
        if (data == null) {
            res.sendStatus(404);
            return;
        }
        res.render("notice.html", {
            replies: replies,
            user: user,
            data: data,
            author: author,
            items: items ?? null,
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
            serviceURL: serviceURL,
        });
    });

    app.get("/calendar", (req, res) => {
        res.render("calendar.html");
    });
    app.get("/how-to-install-app", (req, res) => {
        res.render("how_to_install_app.html");
    });
    teacher(app, neis);
};
