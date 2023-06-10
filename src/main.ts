var inspecting = false;
var startAt = new Date().getMilliseconds();
const serviceHost = "redirect.kro.kr";
const allow_hosts = ["sol-studio.ga", "127.0.0.1", "redirect.kro.kr"];
// Express
import express, { Request, Response } from "express";
import express_session from "express-session";
import MongoStore from "connect-mongo";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import compression from "compression";

// Neis
import Neis from "@my-school.info/neis-api";
const neis = new Neis({
    KEY: "451d037d3e6343f097c4d6ff75d543f1",
    Type: "json",
});

// mongoDB
import { MongoClient, ObjectId } from "mongodb";

// GOOGLE CLIENT
import { OAuth2Client } from "google-auth-library";

// LOG
import winston from "./config/winston";
import morgan from "morgan";

// ETC
// discord webhook
import request from "request";
// uid
import UID from "uid-safe";
// img resize&webp
import sharp from "sharp";
// fs
import fs from "fs";
import path from "path";
// JWT
import jwt from "./modules/jwt";

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

// neis date format
function formatDate(d: string | Date) {
    var dateString = new Date(d);
    var date = new Date(dateString);
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);

    return year + month + day;
}

function discord_alert(content: string) {
    request.post(
        "https://discord.com/api/webhooks/1106460848492400720/7gEIOYmOCxhgYlskzbchlCwLpF-djIzlIuQBHPhudkcoT_fA1lxFWU5RCadCaDhv_o5v",
        {
            form: {
                username: "웹서버 알림",
                content: content,
                avatar_url:
                    "https://brands-up.ch/public/images/uploads/4992df9efc2903c7cfb07e7a6824b6674064e9f6.png",
            },
        }
    );
}

// log
async function log(payload: any) {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    payload.timestamp = new Date().getTime();
    await client.db("school").collection("log").insertOne(payload);
    discord_alert("LOG : " + JSON.stringify(payload));
}

// EXPRESS SETTING
const app = express();
import http from "http";
import { NextFunction } from "connect";
const httpServer = http.createServer(app);

app.use(compression());

morgan.token("user", (req: Request) => {
    if (req.session) {
        return req.session.user_id ?? '"' + req.header("User-Agent") + '"';
    } else {
        return '"' + req.header("User-Agent") + '"';
    }
});

app.use((req, res, next) => {
    if (allow_hosts.includes(req.hostname)) next();
    else res.sendStatus(403);
});

var session = express_session({
    secret: "dhibzxubgfueolw",
    store: MongoStore.create({
        mongoUrl: "mongodb://127.0.0.1:/",
        dbName: "school",
        collectionName: "session",
    }),
    resave: false,
    saveUninitialized: false,
    genid: (req) => {
        return req.ip + "-" + UID.sync(24);
    },
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30,
    },
});

app.use(session);
app.use(
    morgan(
        ':remote-addr - :user - "HTTP/:http-version :method :url" :status :res[content-length]',
        { stream: winston.stream }
    )
);
app.use(cookieParser());
app.use(fileUpload());
app.set("trust proxy", 1);
app.use(
    cors({
        origin: ["sol-studio.ga", "discord.com"], //frontend server localhost:8080
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true, // enable set cookie
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("views", path.join(__dirname, "..", "/view"));
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);
app.use("/static", express.static(path.join(__dirname, "..", "/static")));

app.disable("x-powered-by");
app.use((req, res, next) => {
    res.setHeader("X-Powered-By", "Sol Studio Server");
    if (req.ip != "114.207.98.231" && inspecting) {
        res.render("inspect.html");
    } else if (req.session.user_id == undefined) {
        if (
            req.path.startsWith("/test") ||
            req.path == "/" ||
            req.path.startsWith("/api/captcha") ||
            req.path.startsWith("/login") ||
            req.path.startsWith("/static") ||
            req.path == "/terms" ||
            req.path == "/privacy" ||
            req.path == "/favicon.ico"
        ) {
            next();
        } else {
            res.cookie("next", req.url);
            res.redirect("/login");
        }
    } else {
        next();
    }
});

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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ _id: new ObjectId(req.session.user_id) });
    if (!user) return res.redirect("/login");
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

// SIGNUP and LOGIN and LOGOUT
app.get("/login", (req, res) => {
    res.render("login/login.html");
});

app.get("/login/naver", (req, res) => {
    var client_id = "HbpEftfFEhhUEbMDUXf4";
    var redirectURI = encodeURI(`http://${serviceHost}/login/callback/naver`);
    var state = Math.round(Math.random() * 1000);
    var url =
        "https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=" +
        client_id +
        "&redirect_uri=" +
        redirectURI +
        "&state=" +
        state;
    if (req.query.error) {
        res.render("login/naver.html", { url: url, error: req.query.error });
        return;
    } else {
        res.redirect(url);
    }
});

app.get("/login/google", (req, res) => {
    res.render("login/google.html");
});

app.get("/login/callback/google", async (req, res) => {
    const googleClient = new OAuth2Client(
        "466546474630-s48sd0jjph3qdfup2mkjcevt8ch28nif.apps.googleusercontent.com"
    );
    try {
        var ticket = await googleClient.verifyIdToken({
            idToken: req.query.token as string,
            audience:
                "466546474630-s48sd0jjph3qdfup2mkjcevt8ch28nif.apps.googleusercontent.com",
        });
    } catch {
        res.send("오류");
        return;
    }
    const payload = ticket.getPayload();
    // const userid = payload['sub'];

    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ email: payload.email, auth: "google" });
    if (user != null) {
        req.session.user_id = user._id;
        var next = req.cookies.next ?? "/";
        res.clearCookie("next");
        res.redirect(next);
    } else {
        let user = await client.db("school").collection("user").insertOne({
            type: null,
            auth: "google",
            email: payload.email,
            name: payload.name,
            avatar: payload.picture,
            class: null,
            waiting: false,
            signup_at: new Date().getTime(),
        });
        req.session.user_id = user.insertedId;
        req.session.save(() => {
            res.redirect("/login/type");
        });
        log({
            user: user.insertedId,
            event_name: "register user",
        });
    }
});
app.get("/test/login/teacher", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ email: "cloud8862@naver.com", auth: "naver" });
    req.session.user_id = user._id;
    var next = req.cookies.next ?? "/";
    res.clearCookie("next");
    res.redirect(next);
});
app.get("/test/login/student", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ email: "cloud8862@google.com", auth: "google" });
    req.session.user_id = user._id;
    var next = req.cookies.next ?? "/";
    res.clearCookie("next");
    res.redirect(next);
});
app.get("/login/callback/naver", async (req, res) => {
    var client_id = "HbpEftfFEhhUEbMDUXf4";
    var client_secret = "BXc89OVv2j";
    var redirectURI = encodeURI(`http://${serviceHost}/login/callback/naver`);
    var api_url = "";
    var code = req.query.code;
    var state = req.query.state;
    api_url =
        "https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=" +
        client_id +
        "&client_secret=" +
        client_secret +
        "&redirect_uri=" +
        redirectURI +
        "&code=" +
        code +
        "&state=" +
        state;

    var options = {
        url: api_url,
        headers: {
            "X-Naver-Client-Id": client_id,
            "X-Naver-Client-Secret": client_secret,
        },
    };
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            var api_url2 = "https://openapi.naver.com/v1/nid/me";
            var options2 = {
                url: api_url2,
                headers: { Authorization: "Bearer " + body["access_token"] },
            };
            request.get(options2, async function (error2, response2, body2) {
                if (!error2 && response2.statusCode == 200) {
                    var client = await MongoClient.connect(
                        "mongodb://127.0.0.1/"
                    );
                    var payload = JSON.parse(body2).response;
                    var keys = Object.keys(payload);
                    if (
                        !keys.includes("email") ||
                        !keys.includes("name") ||
                        !keys.includes("profile_image")
                    ) {
                        res.redirect("/login/naver?error=3");
                        return;
                    }
                    var user = await client
                        .db("school")
                        .collection("user")
                        .findOne({ email: payload.email, auth: "naver" });
                    if (user != null) {
                        req.session.user_id = user._id;
                        var next = req.cookies.next ?? "/";
                        res.clearCookie("next");
                        res.redirect(next);
                    } else {
                        let user = await client
                            .db("school")
                            .collection("user")
                            .insertOne({
                                type: null,
                                auth: "naver",
                                email: payload.email,
                                name: payload.name,
                                avatar: payload.profile_image,
                                class: null,
                                waiting: false,
                                signup_at: new Date().getTime(),
                            });
                        req.session.user_id = user.insertedId;
                        req.session.save(() => {
                            res.redirect("/login/type");
                        });
                        log({
                            user: user.insertedId,
                            event_name: "register user",
                        });
                    }
                } else {
                    if (response2 != null) {
                        res.redirect("/login/naver?error=2");
                    }
                }
            });
        } else {
            res.send("/login/naver?error=1");
        }
    });
});

app.get("/login/type", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ _id: new ObjectId(req.session.user_id) });
    if (user.class != null) {
        res.redirect("/");
    } else {
        res.render("login/type.html", { id: req.session.user_id });
    }
});

app.get("/login/type/callback", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ _id: new ObjectId(req.session.user_id) });
    if (user.class == null) {
        if (req.query.type == "teacher") {
            await client
                .db("school")
                .collection("user")
                .updateOne(
                    { _id: new ObjectId(req.session.user_id) },
                    { $set: { type: "teacher" } }
                );
            res.redirect("/register-class");
        } else if (req.query.type == "student") {
            await client
                .db("school")
                .collection("user")
                .updateOne(
                    { _id: new ObjectId(req.session.user_id) },
                    { $set: { type: "student" } }
                );
            var next = req.cookies.next ?? "/";
            res.clearCookie("next");
            res.redirect(next);
        }
    } else {
        res.redirect("/");
    }
});

app.get("/register-class", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");

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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");

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
            invite: choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6).join(""),
        });
    log({
        user: user._id,
        event_name: "register class",
        class: i.insertedId,
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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
        log({
            user: user._id,
            event_name: "join class",
            class: classroom._id,
        });
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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    res.render("teacher/teacher.html", {
        classroom: classroom,
        user: user,
        students: students,
        join_request: join_request,
    });
});

// 소셜 기능
app.get("/user/:id", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    });
});

app.get("/new-notice", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    });
});

// API
app.get("/api/meal", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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

    let meals;
    try {
        meals = await neis.getMealInfo(
            {
                ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                MLSV_YMD: req.query.date as string,
            },
            {
                pSize: 1,
            }
        );
    } catch {}

    if (meals?.length ?? 0 != 0) {
        res.json({ success: true, meal: meals });
    } else {
        res.json({ success: true, meal: [] });
    }
});

app.post("/api/post", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({
            _id: new ObjectId(req.session.user_id),
        });
    var post_new = await client
        .db("school")
        .collection("post")
        .insertOne({
            title: req.body.title,
            content: req.body.content,
            preview: req.body.content.replace(/<[^>]*>?/gm, "").slice(0, 20),
            author: user._id,
            class: user.class,
            timestamp: new Date().getTime(),
        });

    res.redirect("/post");
});

app.post("/api/notice", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({
            _id: new ObjectId(req.session.user_id),
        });

    var body = JSON.parse(req.body.body);
    if (body.question) {
        if (body.question.type == "text") {
            var question: any = {
                type: body.question.type,
                content: body.question.content,
            };
        } else if (body.question.type == "select") {
            var question: any = {
                type: body.question.type,
                content: body.question.content,
                items: body.question.items,
            };
        } else {
            var question;
        }
    }
    var notice_new = await client
        .db("school")
        .collection("notice")
        .insertOne({
            title: body.title,
            content: body.content,
            preview: body.content.replace(/<[^>]*>?/gm, "").slice(0, 20),
            author: user._id,
            class: user.class,
            timestamp: new Date().getTime(),
            question: question,
        });
    res.json({ status: "success", id: notice_new.insertedId });
});

app.post("/api/notice/question/reply", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({
            _id: new ObjectId(req.session.user_id),
        });
    try {
        new ObjectId(req.body.id);
    } catch {
        res.sendStatus(404);
        return;
    }
    var question = (
        await client
            .db("school")
            .collection("notice")
            .findOne({ _id: new ObjectId(req.body.id) })
    ).question;
    if (question) {
        if (question.type == "select") {
            if (isNaN(parseInt(req.body.answer))) {
                res.json({
                    success: false,
                    message: "정상적인 요청이 아닙니다.",
                });
                return;
            }
            if (question.items[parseInt(req.body.answer)].limit != null) {
                if (
                    (await client
                        .db("school")
                        .collection("reply")
                        .count({ id: req.body.id, answer: req.body.answer })) >=
                    question.items[parseInt(req.body.answer)].limit
                ) {
                    res.json({
                        success: false,
                        message:
                            "해당 항목의 회신 최대 수 제한을 초과했습니다.",
                    });
                    return;
                }
            }

            if (
                await client
                    .db("school")
                    .collection("reply")
                    .findOne({ user: user._id, id: req.body.id })
            ) {
                await client
                    .db("school")
                    .collection("reply")
                    .updateOne(
                        {
                            user: user._id,
                            id: req.body.id,
                        },
                        {
                            $set: {
                                answer: req.body.answer,
                                timestamp: new Date().getTime(),
                            },
                        }
                    );
            } else {
                await client.db("school").collection("reply").insertOne({
                    user: user._id,
                    id: req.body.id,
                    answer: req.body.answer,
                    timestamp: new Date().getTime(),
                });
            }
        } else if (question.type == "text") {
            await client.db("school").collection("reply").insertOne({
                user: user._id,
                id: req.body.id,
                answer: req.body.answer,
                timestamp: new Date().getTime(),
            });
        }
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.get("/api/post", async (req, res) => {
    try {
        var client = await MongoClient.connect("mongodb://127.0.0.1/");
        var user = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(req.session.user_id),
            });
        if (isNaN(parseInt(req.query.skip as string))) {
            res.json({ success: false });
            return;
        }
        var data = await client
            .db("school")
            .collection("post")
            .find({
                class: user.class,
            })
            .sort("_id", -1)
            .skip(parseInt(req.query.skip as string))
            .limit(10)
            .toArray();

        var result = [];
        for (const d of data) {
            if (req.query.preview) {
                var author = await client
                    .db("school")
                    .collection("user")
                    .findOne({
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

app.get("/api/notice", async (req, res) => {
    try {
        var client = await MongoClient.connect("mongodb://127.0.0.1/");
        var user = await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(req.session.user_id),
            });
        if (isNaN(parseInt(req.query.skip as string))) {
            res.json({ success: false, message: "비정상적인 요청" });
            return;
        }
        var data = await client
            .db("school")
            .collection("notice")
            .find({
                class: user.class,
            })
            .sort("_id", -1)
            .skip(parseInt(req.query.skip as string))
            .limit(10)
            .toArray();

        var result = [];
        for (const d of data) {
            if (req.query.preview) {
                var author = await client
                    .db("school")
                    .collection("user")
                    .findOne({
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
        res.json({ success: true, notice: result });
    } catch {
        res.json({
            success: false,
            message: "알 수 없는 에러 (GET 파라미터를 확인해주세요)",
        });
    }
});

app.get("/api/timetable", async (req, res) => {
    function refine(data) {
        var result = [];
        for (const d of data) {
            result.push({
                ITRT_CNTNT: d.ITRT_CNTNT,
                PERIO: d.PERIO,
                ALL_TI_YMD: d.ALL_TI_YMD,
            });
        }
        return result;
    }
    var friday = new Date(
        new Date(
            `${(req.query.monday as string).slice(0, 4)}-${(
                req.query.monday as string
            ).slice(4, 6)}-${(req.query.monday as string).slice(6, 8)}`
        ).getTime() +
            1000 * 60 * 60 * 24 * 5
    );
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    if (!req.query.refresh) {
        var cache = [];
        for (var i = 0; i < 5; i++) {
            var tmp = new Date(
                new Date(
                    `${(req.query.monday as string).slice(0, 4)}-${(
                        req.query.monday as string
                    ).slice(4, 6)}-${(req.query.monday as string).slice(6, 8)}`
                ).getTime() +
                    1000 * 60 * 60 * 24 * i
            );

            cache.push.apply(
                cache,
                await client
                    .db("school")
                    .collection("timetable")
                    .find({
                        ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                        SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                        ALL_TI_YMD: formatDate(tmp),
                        CLASS_NM: classroom.class.CLASS_NM,
                        GRADE: classroom.class.GRADE,
                    })
                    .toArray()
            );
        }
        if (cache.length != 0) {
            res.json({
                success: true,
                table: refine(cache),
                friday: formatDate(friday),
            });
            return;
        }
        try {
            var timetable = await neis.getTimetable(
                {
                    ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                    SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                },
                {
                    TI_FROM_YMD: req.query.monday as string,
                    TI_TO_YMD: formatDate(friday),
                    CLASS_NM: classroom.class.CLASS_NM,
                    GRADE: classroom.class.GRADE,
                },
                {
                    pSize: 100,
                }
            );
        } catch {
            res.json({ success: false });
            return;
        }
        var result = [];
        for (let t of timetable) {
            result.push({
                ATPT_OFCDC_SC_CODE: t.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: t.SD_SCHUL_CODE,
                ALL_TI_YMD: t.ALL_TI_YMD,
                CLASS_NM: t.CLASS_NM,
                GRADE: t.GRADE,
                ITRT_CNTNT: t.ITRT_CNTNT.replace("-", ""),
                PERIO: t.PERIO,
            });
        }

        client.db("school").collection("timetable").insertMany(result);
        res.json({
            success: true,
            table: refine(timetable),
            friday: formatDate(friday),
        });
    } else {
        for (var i = 0; i < 5; i++) {
            var tmp = new Date(
                new Date(
                    `${(req.query.monday as string).slice(0, 4)}-${(
                        req.query.monday as string
                    ).slice(4, 6)}-${(req.query.monday as string).slice(6, 8)}`
                ).getTime() +
                    1000 * 60 * 60 * 24 * i
            );

            await client
                .db("school")
                .collection("timetable")
                .deleteMany({
                    ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                    SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                    ALL_TI_YMD: formatDate(tmp),
                    CLASS_NM: classroom.class.CLASS_NM,
                    GRADE: classroom.class.GRADE,
                });
        }
        try {
            var timetable = await neis.getTimetable(
                {
                    ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                    SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                },
                {
                    TI_FROM_YMD: req.query.monday as string,
                    TI_TO_YMD: formatDate(friday),
                    CLASS_NM: classroom.class.CLASS_NM,
                    GRADE: classroom.class.GRADE,
                },
                {
                    pSize: 100,
                }
            );
        } catch {
            res.json({
                success: false,
            });
            return;
        }
        var result = [];
        for (let t of timetable) {
            result.push({
                ATPT_OFCDC_SC_CODE: t.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: t.SD_SCHUL_CODE,
                ALL_TI_YMD: t.ALL_TI_YMD,
                CLASS_NM: t.CLASS_NM,
                GRADE: t.GRADE,
                ITRT_CNTNT: t.ITRT_CNTNT.replace("-", ""),
                PERIO: t.PERIO,
            });
        }
        client.db("school").collection("timetable").insertMany(result);
        res.json({
            success: true,
            table: refine(result),
            friday: formatDate(friday),
        });
    }
});

app.get("/api/teacher/student.ban", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    try {
        new ObjectId(req.query.user as string);
    } catch {
        res.json({ success: false });
        return;
    }
    await client
        .db("school")
        .collection("user")
        .updateOne(
            {
                _id: new ObjectId(req.query.user as string),
                class: user.class,
            },
            {
                $set: {
                    class: null,
                },
            }
        );
    res.json({ success: true });
    log({
        user: user.insertedId,
        event_name: "ban student",
        event_target: req.query.user,
    });
});

app.get("/api/teacher/join.accept", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    try {
        new ObjectId(req.query.user as string);
    } catch {
        res.json({ success: false });
        return;
    }
    await client
        .db("school")
        .collection("user")
        .updateOne(
            {
                _id: new ObjectId(req.query.user as string),
                class: user.class,
            },
            {
                $set: {
                    waiting: false,
                },
            }
        );
    res.json({
        success: true,
        user: await client
            .db("school")
            .collection("user")
            .findOne({
                _id: new ObjectId(req.query.user as string),
                class: user.class,
            }),
    });
    log({
        user: user.insertedId,
        event_name: "accept student",
        event_target: req.query.user,
    });
});

app.get("/api/teacher/join.reject", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
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
    try {
        new ObjectId(req.query.user as string);
    } catch {
        res.json({ success: false });
        return;
    }
    await client
        .db("school")
        .collection("user")
        .updateOne(
            {
                _id: new ObjectId(req.query.user as string),
                class: user.class,
            },
            {
                $set: {
                    class: null,
                    waiting: false,
                },
            }
        );
    res.json({ success: true });
    log({
        user: user.insertedId,
        event_name: "reject student",
        event_target: req.query.user,
    });
});

app.get("/api/comment", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    if (isNaN(parseInt(req.query.skip as string))) {
        res.json({ success: false });
        return;
    }
    var raw = await client
        .db("school")
        .collection("comment")
        .find({
            id: req.query.id,
            reply: req.query.reply ?? null,
        })
        .limit(30)
        .skip(parseInt(req.query.skip as string))
        .toArray();

    var comments = [];

    for (const r of raw) {
        var author = await client.db("school").collection("user").findOne({
            _id: r.author,
        });
        comments.push({
            _id: r._id,
            author: {
                name: author.name,
                avatar: author.avatar,
            },
            content: r.content,
            timestamp: r.timestamp,
            reply: r.reply,
            reply_count: await client
                .db("school")
                .collection("comment")
                .count({ reply: String(r._id) }),
        });
    }

    res.json({
        success: true,
        comment: comments,
        total: await client
            .db("school")
            .collection("comment")
            .count({ id: req.query.id, reply: req.query.reply ?? null }),
    });
});

app.post("/api/comment", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ _id: new ObjectId(req.session.user_id) });
    var comment = await client
        .db("school")
        .collection("comment")
        .insertOne({
            id: req.body.id,
            author: user._id,
            content: req.body.content,
            timestamp: new Date().getTime(),
            reply: req.body.reply ?? null,
        });

    res.json({
        success: true,
        comment: {
            _id: comment.insertedId,
            id: req.body.id,
            author: {
                name: user.name,
                avatar: user.avatar,
            },
            content: req.body.content,
            timestamp: new Date().getTime(),
            reply: req.body.reply ?? null,
        },
    });
});

app.post("/api/upload-img", async (req, res) => {
    var verify = await jwt.verify(req.query.token);
    if (verify != -1) {
        if (req.files) {
            var uid = UID.sync(64);
            var url = `/static/img/${req.session.user_id}-${uid}.webp`;
            fs.writeFileSync(
                path.join(
                    __dirname,
                    "..",
                    `static/img/${req.session.user_id}-${uid}.webp`
                ),
                //@ts-ignore
                await sharp(req.files.file.data).webp().rotate().toBuffer()
            );
            res.json({ url: url });
        } else {
            res.json({ url: null });
        }
    } else {
        res.json({ code: -1, message: "JWT TOKEN IS INVALID!!" });
    }
});

app.get("/error", (req, res) => {
    log({
        event_name: "client error",
        stack: req.query.message,
        log_text: `${req.ip} - ${
            req.session.user_id ?? req.header("User-Agent")
        } - "${req.protocol}/${req.httpVersion} ${req.method} ${
            req.url
        }" 500 0`,
    });
    res.end();
});

// ETC
app.get("/privacy", (req, res) => {
    res.render("privacy.html");
});

app.get("/terms", (req, res) => {
    res.render("terms.html");
});

app.get("/jobs", (req, res) => {
    res.render("jobs.html");
});

app.get("/delete-user", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ _id: new ObjectId(req.session.user_id) });
    var classroom = await client
        .db("school")
        .collection("class")
        .findOne({ _id: new ObjectId(user.class) });

    res.render("delete-user.html", {
        token: await jwt.sign({
            sub: "sol-delete-user",
            iss: "sol-studio",
            url: "/delete-user",
            user: req.session.user_id,
        }),
        user: user,
        classroom: classroom,
    });
});

app.post("/delete-user", async (req, res) => {
    var payload = await jwt.verify(req.body.token);
    if (payload.url == "/delete-user" && payload.user == req.session.user_id) {
        var client = await MongoClient.connect("mongodb://127.0.0.1/");
        var user = await client
            .db("school")
            .collection("user")
            .findOne({ _id: new ObjectId(req.session.user_id) });
        client.db("school").collection("user_deleted").insertOne(user);
        client
            .db("school")
            .collection("user")
            .deleteOne({ _id: new ObjectId(req.session.user_id) });
        req.session.destroy();
        log({
            user: req.session.user_id,
            event_name: "delete user",
        });
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.get("/contact", (req, res) => {
    res.redirect("mailto:dev.sol.studio@gmail.com");
});

app.get("/redirect", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ _id: new ObjectId(req.session.user_id) });
    if (!user.class) res.redirect("/invite/" + req.query.url);
    else {
        res.redirect("/main");
    }
});

app.get("/setting", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    var user = await client
        .db("school")
        .collection("user")
        .findOne({ _id: new ObjectId(req.session.user_id) });
    res.render("setting.html", { user: user });
});

app.post("/setting/save", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/");
    if (req.files) {
        var uid = UID.sync(16);
        var url = `/static/avatar/${req.session.user_id}-${uid}.webp`;
        fs.writeFileSync(
            path.join(
                __dirname,
                "..",
                `static/avatar/${req.session.user_id}-${uid}.webp`
            ),
            //@ts-ignore
            await sharp(req.files.avatar.data)
                .resize({
                    width: 300,
                    height: 300,
                })
                .webp()
                .rotate()
                .toBuffer()
        );
        await client
            .db("school")
            .collection("user")
            .updateOne(
                { _id: new ObjectId(req.session.user_id) },
                { $set: { name: req.body.name, avatar: url } }
            );
    } else {
        await client
            .db("school")
            .collection("user")
            .updateOne(
                { _id: new ObjectId(req.session.user_id) },
                { $set: { name: req.body.name } }
            );
    }

    res.json({ status: "success" });
});

// WORDLE
app.get("/game/wordle", (req, res) => {
    res.render("game/wordle/index.html");
});

// ERRORs
// 404 NOT FOUND
app.use((req, res) => {
    res.render("404.html", { user_id: req.session.user_id });
});

// STATIC과 API는 404페이지 렌더링 안함
app.use("/static/", (req, res) => {
    res.sendStatus(404);
});

app.use("/api/", (req, res) => {
    res.sendStatus(404);
});

app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
    log({
        event_name: "server error",
        stack: err.stack,
        log_text: `${req.ip} - ${
            req.session.user_id ?? req.header("User-Agent")
        } - "${req.protocol}/${req.httpVersion} ${req.method} ${
            req.url
        }" 500 0`,
    });
    console.error(err.stack);
    res.sendStatus(500);
});

// RUN
httpServer.listen(3000, "0.0.0.0", () => {
    console.log("listening...");
    discord_alert(
        '재시작 알림 : `{success: true, time: "' +
            (new Date().getMilliseconds() - startAt) +
            'ms"}`'
    );
});
