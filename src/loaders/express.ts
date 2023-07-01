import * as express from "express";
import cors from "cors";
import express_session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import UID from "uid-safe";
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import { fileURLToPath } from "url";
import ejs from "ejs";
import { stream } from "../config/winston.js";
import all_noticeEntity from "../models/all_notice.entity.js";
import all_notice_noagainEntity from "../models/all_notice_noagain.entity.js";
import calanderEntity from "../models/calander.entity.js";
import classEntity from "../models/class.entity.js";
import commentEntity from "../models/comment.entity.js";
import deleted_userEntity from "../models/deleted_user.entity.js";
import noticeEntity from "../models/notice.entity.js";
import postEntity from "../models/post.entity.js";
import replyEntity from "../models/reply.entity.js";
import sessionEntity from "../models/session.entity.js";
import timetableEntity from "../models/timetable.entity.js";
import userEntity from "../models/user.entity.js";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DEFAULT_ADMIN = { email: "sol762@classboard.kr", password: "sol762!" };
export default async ({
    app,
    allow_hosts,
    inspecting,
}: {
    app: express.Application;
    allow_hosts: string[];
    inspecting: boolean;
}) => {
    AdminJS.registerAdapter({
        Resource: AdminJSMongoose.Resource,
        Database: AdminJSMongoose.Database,
    });

    const router = AdminJSExpress.buildAuthenticatedRouter(
        new AdminJS({
            resources: [
                all_noticeEntity,
                all_notice_noagainEntity,
                calanderEntity,
                classEntity,
                commentEntity,
                deleted_userEntity,
                noticeEntity,
                postEntity,
                replyEntity,
                sessionEntity,
                timetableEntity,
                userEntity,
            ],
            rootPath: "/admin",
        }),
        {
            authenticate: async (email: string, password: string) => {
                if (
                    email === DEFAULT_ADMIN.email &&
                    password === DEFAULT_ADMIN.password
                ) {
                    return Promise.resolve(DEFAULT_ADMIN);
                }
                return null;
            },
            cookiePassword: "secret",
        }
    );
    app.use("/admin", router);
    app.get("/ads.txt", (req, res) => {
        res.send("google.com, pub-8112542064837410, DIRECT, f08c47fec0942fa0");
    });

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(compression());
    morgan.token("user", (req: express.Request) => {
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
            mongoUrl: "mongodb://192.168.0.19:27017/",
            dbName: "school",
            collectionName: "sessions",
        }),
        genid: (req) => {
            return req.ip + "-" + UID.sync(24);
        },
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 30,
        },
    });

    app.use(session);
    app.use(
        morgan("combined", {
            stream: stream,
        })
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

    app.set("views", path.join(__dirname, "..", "..", "/view"));
    app.set("view engine", "ejs");
    app.engine("html", ejs.renderFile);
    app.use(
        "/static",
        express.static(path.join(__dirname, "..", "..", "/static"))
    );

    app.disable("x-powered-by");
    app.use((req, res, next) => {
        res.setHeader("X-Powered-By", "Sol Studio Server");
        if (
            req.path.startsWith("/admin") &&
            req.session.user_id != "6492c566b816d5acb3928260"
        ) {
            res.sendStatus(403);
            return;
        }
        if (req.ip != "114.207.98.231" && inspecting) {
            res.render("inspect.html");
        } else if (!req.session.user_id) {
            if (
                req.path == "/" ||
                req.path.startsWith("/login") ||
                req.path.startsWith("/static") ||
                req.path == "/terms" ||
                req.path == "/privacy" ||
                req.path == "/favicon.ico" ||
                req.path == "/jobs"
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

    return app;
};
