import express from "express";
import { MongoClient, ObjectId } from "mongodb";

// JWT
import jwt from "../modules/jwt";
import Neis from "@my-school.info/neis-api";
export default (
    app: express.Application,
    client: MongoClient,
    neis: Neis,
    serviceURL
) => {
    // UTILS
    function getMondayDate(paramDate: Date) {
        paramDate.setUTCHours(0, 0, 0, 0);

        var day = paramDate.getDay();
        if (day == 6) var diff = paramDate.getDate() + 2;
        else var diff = paramDate.getDate() - day + 1;
        var result = new Date(paramDate.setDate(diff))
            .toISOString()
            .substring(0, 10);
        return result;
    }

    // python random.choice
    function choice(a: string, k = 1) {
        var return_array = [];
        for (var i = 0; i < k; i++) {
            return_array.push(a[Math.floor(Math.random() * a.length)]);
        }
        return return_array;
    }
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    app.head("/", (req, res) => {
        res.set("status", "success");
        res.end();
    });

    app.get("/", (req, res) => {
        res.render("index.html", { user_id: req.session.user_id ?? false });
    });

    // MAIN
    app.get("/main", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({ _id: new ObjectId(req.session.user_id) });
        var classroom = await client
            .db("school")
            .collection("class")
            .findOne({
                _id: new ObjectId(user.class),
            });
        if (user.waiting) {
            res.render("wait.html", { waiting: user.class });
        } else if (user.class == null) {
            if (user.type == "teacher") {
                res.redirect("/register-class");
            } else if (user.type == "student") {
                res.redirect("/invite");
            } else {
                res.redirect("/login/type");
            }
        } else {
            var monday = getMondayDate(new Date());
            res.render("main.html", {
                monday: monday,
                grade: classroom.class.GRADE,
                classroom: classroom.class.CLASS_NM,
                school_name: classroom.school.SCHUL_NM,
                user: user,
            });
        }
    });

    app.get("/register-class", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({ _id: new ObjectId(req.session.user_id) });
        if (user.type != "teacher" || user.class != null) {
            res.redirect("/");
            return;
        }
        res.render("find-school.html", { error: req.query.error });
    });

    app.post("/register-class", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({ _id: new ObjectId(req.session.user_id) });
        if (user.type != "teacher") {
            res.redirect("/");
            return;
        }
        if (user.class != null) {
            res.redirect("/");
            return;
        }
        let schools;
        try {
            schools = await neis.getSchoolInfo(
                {
                    SCHUL_NM: req.body.school,
                },
                {
                    pSize: 50,
                }
            );
        } catch {}

        for (const s of schools) {
            if (s.SCHUL_NM == req.body.school) {
                var school = s;
                break;
            }
        }
        if (!school) {
            if (schools.length == 50) {
                res.redirect("/register-class?error=noschool");
                return;
            }
            if (schools.length != 0) {
                res.render("select-school.html", {
                    schools: schools,
                    grade: req.body.grade,
                    classroom: req.body.class,
                });
                return;
            } else {
                res.redirect("/register-class?error=noschool");
                return;
            }
        }
        let classrooms;
        try {
            classrooms = await neis.getClassInfo(
                {
                    SD_SCHUL_CODE: school.SD_SCHUL_CODE,
                    ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
                    GRADE: req.body.grade,
                },
                {
                    pSize: 100,
                }
            );
        } catch {}

        for (const c of classrooms) {
            if (c.CLASS_NM == req.body.class) {
                var classroom = c;
                break;
            }
        }
        if (!classroom) {
            if (req.body.select_school) {
                res.json({
                    success: false,
                    redirect: "/register-class?error=noclass",
                });
                return;
            }
            res.redirect("/register-class?error=noclass");
            return;
        }
        var ay = classroom.AY;
        var tmp = await client.db("school").collection("class").findOne({
            "school.SD_SCHUL_CODE": school.SD_SCHUL_CODE,
            "school.ATPT_OFCDC_SC_CODE": school.ATPT_OFCDC_SC_CODE,
            "school.SCHUL_NM": school.SCHUL_NM,
            "class.GRADE": classroom.GRADE,
            "class.CLASS_NM": classroom.CLASS_NM,
            ay: ay,
        });
        if (tmp != null) {
            if (req.body.select_school) {
                res.json({
                    success: false,
                    redirect: "/register-class?error=alreadyexist",
                });
                return;
            }
            res.redirect("/register-class?error=alreadyexist");
            return;
        }
        var i = await client
            .db("school")
            .collection("class")
            .insertOne({
                school: {
                    SD_SCHUL_CODE: school.SD_SCHUL_CODE,
                    ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
                    SCHUL_NM: school.SCHUL_NM,
                },
                class: {
                    MADE: user._id,
                    GRADE: classroom.GRADE,
                    CLASS_NM: classroom.CLASS_NM,
                },
                ay: ay,
                invite: choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6).join(
                    ""
                ),
            });
        await client
            .db("school")
            .collection("user")
            .updateOne(
                {
                    _id: new ObjectId(req.session.user_id),
                },
                {
                    $set: {
                        class: i.insertedId,
                    },
                }
            );
        if (req.body.select_school) {
            res.json({ success: true, redirect: "/main" });
            return;
        }
        res.redirect("/");
    });

    app.get("/invite", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({ _id: new ObjectId(req.session.user_id) });
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
        var user = await client
            .db("school")
            .collection("user")
            .findOne({ _id: new ObjectId(req.session.user_id) });
        if (user.class != null) {
            res.redirect("/");
            return;
        }
        if (user.type != "student") {
            res.redirect("/");
            return;
        }
        var classroom = await client
            .db("school")
            .collection("class")
            .findOne({ invite: req.params.code });

        if (classroom) {
            client
                .db("school")
                .collection("user")
                .updateOne(
                    { _id: new ObjectId(req.session.user_id) },
                    { $set: { class: classroom._id, waiting: true } }
                );
            res.redirect("/");
        } else {
            res.redirect("/invite?error=noinvite");
        }
    });

    app.get("/logout", (req, res) => {
        delete req.session.user_id;
        res.redirect("/login");
    });

    // 선생님 페이지
    app.get("/teacher", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({ _id: new ObjectId(req.session.user_id) });
        var classroom = await client
            .db("school")
            .collection("class")
            .findOne({ _id: new ObjectId(user.class) });
        if (user.type != "teacher") {
            res.redirect("/");
            return;
        }
        var students = await client
            .db("school")
            .collection("user")
            .find({ class: user.class, waiting: false, type: "student" })
            .toArray();
        var join_request = await client
            .db("school")
            .collection("user")
            .find({ class: user.class, waiting: true, type: "student" })
            .toArray();
        res.render("teacher.html", {
            classroom: classroom,
            user: user,
            students: students,
            join_request: join_request,
        });
    });

    // 소셜 기능
    app.get("/user/:id", async (req, res) => {
        try {
            new ObjectId(req.params.id);
        } catch {
            res.sendStatus(404);
            return;
        }
        var user = await client
            .db("school")
            .collection("user")
            .findOne({ _id: new ObjectId(req.params.id) });
        if (!user) {
            res.sendStatus(404);
            return;
        }
        var classroom = await client
            .db("school")
            .collection("class")
            .findOne({ _id: new ObjectId(user.class) });
        res.render("user.html", { user: user, classroom: classroom });
    });

    // POST and NOTICE
    app.get("/new-post", async (req, res) => {
        res.render("new_post.html", {
            token: await jwt.sign({
                sub: "sol-img-upload-post",
                iss: "sol-studio",
                aud: req.session.user_id,
            }),
        });
    });

    app.get("/post", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(req.session.user_id),
            });
        var classroom = await client
            .db("school")
            .collection("class")
            .findOne({
                _id: new ObjectId(user.class),
            });
        res.render("post_list.html", {
            grade: classroom.class.GRADE,
            classroom: classroom.class.CLASS_NM,
            school_name: classroom.school.SCHUL_NM,
        });
    });

    app.get("/post/:id", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(req.session.user_id),
            });
        try {
            new ObjectId(req.params.id);
        } catch {
            res.sendStatus(404);
            return;
        }
        var data = await client
            .db("school")
            .collection("post")
            .findOne({
                class: user.class,
                _id: new ObjectId(req.params.id),
            });
        if (data == null) {
            res.sendStatus(404);
            return;
        }
        var author = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(data.author),
            });
        data.content = data.content
            .replaceAll("<script", "&lt;script")
            .replaceAll("</script>", "&lt;/script&gt;");
        res.render("post.html", {
            data: data,
            author: author,
            user: { name: user.name, avatar: user.avatar },
            serviceURL: serviceURL,
        });
    });

    app.get("/new-notice", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(req.session.user_id),
            });
        if (user.type != "teacher") {
            res.redirect("/");
            return;
        }
        res.render("new_notice.html", {
            token: await jwt.sign({
                sub: "sol-img-upload-notice",
                iss: "sol-studio",
                aud: req.session.user_id,
            }),
        });
    });

    app.get("/notice", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(req.session.user_id),
            });
        var classroom = await client
            .db("school")
            .collection("class")
            .findOne({
                _id: new ObjectId(user.class),
            });
        res.render("notice_list.html", {
            grade: classroom.class.GRADE,
            classroom: classroom.class.CLASS_NM,
            school_name: classroom.school.SCHUL_NM,
        });
    });

    app.get("/notice/:id", async (req, res) => {
        var user = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(req.session.user_id),
            });
        try {
            new ObjectId(req.params.id);
        } catch {
            res.sendStatus(404);
            return;
        }

        var data = await client
            .db("school")
            .collection("notice")
            .findOne({
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
                raw = await client
                    .db("school")
                    .collection("reply")
                    .find({
                        id: String(data._id),
                    })
                    .toArray();
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
                    raw = await client
                        .db("school")
                        .collection("reply")
                        .find({
                            id: String(data._id),
                        })
                        .toArray();
                }
            }
            if (user.type == "teacher") {
                var replies = [];
                for (const r of raw) {
                    replies.push({
                        timestamp: r.timestamp,
                        user: await client
                            .db("school")
                            .collection("user")
                            .findOne({ _id: new ObjectId(r.user) }),
                        answer: r.answer,
                    });
                }
            }
        }

        var author = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(data.author),
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
};
