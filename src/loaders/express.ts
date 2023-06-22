import * as express from "express";
import cors from "cors";
import express_session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import compression from "compression";
import winston from "../config/winston";
import morgan from "morgan";
import path from "path";
import UID from "uid-safe";

export default async ({
    app,
    allow_hosts,
    inspecting,
}: {
    app: express.Application;
    allow_hosts: string[];
    inspecting: boolean;
}) => {
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

    app.set("views", path.join(__dirname, "..", "..", "/view"));
    app.set("view engine", "ejs");
    app.engine("html", require("ejs").renderFile);
    app.use(
        "/static",
        express.static(path.join(__dirname, "..", "..", "/static"))
    );

    app.disable("x-powered-by");
    app.use((req, res, next) => {
        res.setHeader("X-Powered-By", "Sol Studio Server");
        if (req.ip != "114.207.98.231" && inspecting) {
            res.render("inspect.html");
        } else if (!req.session.user_id) {
            if (
                req.path == "/" ||
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

    return app;
};
