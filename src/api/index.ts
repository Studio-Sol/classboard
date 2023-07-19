import UID from "uid-safe";
import jwt from "../modules/jwt.js";
import express, { NextFunction } from "express";
import fs from "fs";
import path from "path";
import routes from "../routes/index.js";
import sharp from "sharp";
import { ObjectId } from "bson";
import Calander from "../models/calander.entity.js";
import Timetable from "../models/timetable.entity.js";
import User from "../models/user.entity.js";
import Class from "../models/class.entity.js";
import Post from "../models/post.entity.js";
import Comment from "../models/comment.entity.js";
import DeletedUser from "../models/deleted_user.entity.js";
import AllNotice from "../models/all_notice.entity.js";
import AllNoticeNoagain from "../models/all_notice_noagain.entity.js";
import Neis from "../modules/neis.js";
import { fileURLToPath } from "url";
import mealEntity from "../models/meal.entity.js";
import { getUserById } from "../util/index.js";
import noticeRouter from "./notice.js";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
function formatDate(date: Date) {
    return date.toISOString().slice(0, 10).replace("-", "").replace("-", "");
}
export default async (
    app: express.Application,
    neis: Neis,
    serviceURL: string
) => {
    await routes(app, neis, serviceURL);
    app.use("/api/*", async (req, res, next) => {
        var user = await getUserById(req.session.user_id);
        if (!user.class) return res.sendStatus(403);
        req.session.user = user;
        next();
    });
    app.use("/api/teacher/*", async (req, res, next) => {
        console.log(req.session.user);
        if (req.session.user.type != "teacher") return res.sendStatus(403);
        next();
    });
    app.post("/api/calendar", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        var event = {
            user: user._id,
            class: user.class,
            start: new Date(req.body.start),
            end: new Date(req.body.end),
            title: req.body.title,
            description: req.body.description,
        };
        await new Calander(event).save();
        res.json({
            sucess: true,
            event: event,
        });
    });
    app.get("/api/calendar", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        var result = await Calander.find({
            class: user.class,
            start: {
                $gte: new Date(req.query.start as string),
                $lt: new Date(req.query.end as string),
            },
        }).exec();
        res.json(result);
    });
    app.get("/api/meal", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        var classroom = await Class.findOne({
            _id: user.class,
        });

        let meals: any[] = await mealEntity
            .find({
                SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                MLSV_YMD: req.query.date as string,
            })
            .exec();
        if (meals.length == 0)
            try {
                meals = await neis.getMealInfo(
                    {
                        ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                        SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                        MLSV_YMD: req.query.date as string,
                    },
                    {
                        pSize: 10,
                    }
                );
                if (meals) await mealEntity.insertMany(meals);
            } catch {}

        if (meals?.length ?? 0 != 0) {
            res.json({ success: true, meal: meals });
        } else {
            res.json({ success: true, meal: [] });
        }
    });

    app.post("/api/post", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        var post_new = await new Post({
            title: req.body.title,
            content: req.body.content,
            preview: req.body.content.replace(/<[^>]*>?/gm, "").slice(0, 20),
            author: user._id,
            class: user.class,
            timestamp: new Date().getTime(),
        }).save();

        res.redirect("/post/" + post_new._id.toString());
    });

    app.get("/api/post", async (req, res) => {
        try {
            var user = await User.findOne({
                _id: new ObjectId(req.session.user_id),
            });
            if (isNaN(parseInt(req.query.skip as string))) {
                res.json({ success: false });
                return;
            }
            var data = await Post.find({
                class: user.class,
            })
                .sort({ _id: -1 })
                .skip(parseInt(req.query.skip as string))
                .limit(10)
                .exec();

            var result = [];
            for (const d of data) {
                if (req.query.preview) {
                    var author = await User.findOne({
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

    app.get("/api/timetable", async (req, res) => {
        const refine = (data: any[]) => {
            var result = [];
            for (const d of data) {
                result.push({
                    ITRT_CNTNT: d.ITRT_CNTNT,
                    PERIO: d.PERIO,
                    ALL_TI_YMD: d.ALL_TI_YMD,
                });
            }
            return result;
        };
        var m = req.query.monday as string;
        var monday = new Date(
            `${m.slice(0, 4)}-${m.slice(4, 6)}-${m.slice(6, 8)}`
        );
        var friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);

        var user = await getUserById(req.session.user_id);
        var classroom = await Class.findOne({
            _id: user.class,
        });
        if (!req.query.refresh) {
            var cache = await Timetable.find({
                ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                CLASS_NM: classroom.class.CLASS_NM,
                GRADE: classroom.class.GRADE,
                date: { $lte: friday, $gte: monday },
            }).exec();
            if (cache.length > 0) {
                return res.json({
                    success: true,
                    table: refine(cache),
                    friday: formatDate(friday),
                });
            }
        } else {
            await Timetable.deleteMany({
                ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                CLASS_NM: classroom.class.CLASS_NM,
                GRADE: classroom.class.GRADE,
                date: { $lte: friday },
            }).exec();
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
            res.json({ success: false, message: "NEIS API ERROR" });
            return;
        }
        var result = [];
        for (let t of timetable) {
            result.push({
                date: new Date(
                    `${t.ALL_TI_YMD.slice(0, 4)}-${t.ALL_TI_YMD.slice(
                        4,
                        6
                    )}-${t.ALL_TI_YMD.slice(6, 8)}`
                ),
                ATPT_OFCDC_SC_CODE: t.ATPT_OFCDC_SC_CODE,
                SD_SCHUL_CODE: t.SD_SCHUL_CODE,
                ALL_TI_YMD: t.ALL_TI_YMD,
                CLASS_NM: t.CLASS_NM,
                GRADE: t.GRADE,
                ITRT_CNTNT: t.ITRT_CNTNT?.replace("-", "") ?? "알 수 없음",
                PERIO: t.PERIO,
            });
        }

        Timetable.insertMany(result);
        res.json({
            success: true,
            table: refine(result),
            friday: formatDate(friday),
        });
    });

    app.get("/api/teacher/student.ban", async (req, res) => {
        try {
            new ObjectId(req.query.user as string);
        } catch {
            res.json({ success: false });
            return;
        }
        await User.updateOne(
            {
                _id: new ObjectId(req.query.user as string),
            },
            {
                $unset: {
                    class: 1,
                },
            }
        );
        res.json({ success: true });
    });

    app.get("/api/teacher/join.accept", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        try {
            new ObjectId(req.query.user as string);
        } catch {
            res.json({ success: false });
            return;
        }
        await User.updateOne(
            {
                _id: new ObjectId(req.query.user as string),
            },
            {
                $set: {
                    waiting: false,
                },
            }
        );
        res.json({
            success: true,
            user: await User.findOne({
                _id: new ObjectId(req.query.user as string),
                class: user.class,
            }),
        });
    });

    app.get("/api/teacher/join.reject", async (req, res) => {
        var user = await User.findOne({
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
        await User.updateOne(
            {
                _id: new ObjectId(req.query.user as string),
            },
            {
                $set: {
                    class: null,
                    waiting: false,
                },
            }
        );
        res.json({ success: true });
    });

    app.get("/api/comment", async (req, res) => {
        if (isNaN(parseInt(req.query.skip as string))) {
            res.json({ success: false });
            return;
        }
        var raw = await Comment.find({
            id: req.query.id,
            reply: req.query.reply ?? null,
        })
            .limit(30)
            .skip(parseInt(req.query.skip as string))
            .exec();

        var comments = [];

        for (const r of raw) {
            var author = await User.findOne({
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
                reply_count: await Comment.count({ reply: String(r._id) }),
            });
        }

        res.json({
            success: true,
            comment: comments,
            total: await Comment.count({
                id: req.query.id,
                reply: req.query.reply ?? null,
            }),
        });
    });

    app.post("/api/comment", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        var comment = await new Comment({
            id: req.body.id,
            author: user._id,
            content: req.body.content,
            timestamp: new Date().getTime(),
            reply: req.body.reply ?? null,
        }).save();

        res.json({
            success: true,
            comment: {
                _id: comment._id,
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
        if (req.files) {
            var uid = UID.sync(64);
            var url = `/static/img/${req.session.user_id}-${uid}.webp`;
            fs.writeFileSync(
                path.join(
                    __dirname,
                    "..",
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
    });

    app.get("/error", (req, res) => {
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
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        var classroom = await Class.findOne({ _id: user.class });

        res.render("delete-user.html", {
            user: user,
            classroom: classroom,
        });
    });

    app.post("/api/delete-user", async (req, res) => {
        if (new Date().getTime() - parseInt(req.query.t as string) > 5000) {
            console.log("yeah?");
            return res.json({ success: false });
        }
        let user = await getUserById(req.session.user_id);
        const {
            _id: _,
            __v: __,
            ...deletedUser
        } = JSON.parse(JSON.stringify(user));
        console.log(deletedUser);
        new DeletedUser(deletedUser).save();
        await User.deleteOne({ _id: user._id });

        req.session.destroy();
        res.json({ success: true });
    });

    app.get("/contact", (req, res) => {
        res.redirect("mailto:dev.sol.studio@gmail.com");
    });

    app.get("/redirect", async (req, res) => {
        res.redirect("/invite/" + req.query.url);
    });

    app.get("/setting", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        res.render("setting.html", { user: user });
    });

    app.post("/api/setting/save", async (req, res) => {
        if (req.files) {
            var uid = UID.sync(16);
            var url = `/static/avatar/${req.session.user_id}-${uid}.webp`;
            fs.writeFileSync(
                path.join(
                    __dirname,
                    "..",
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
            fs.writeFileSync(
                path.join(
                    __dirname,
                    "..",
                    "..",
                    `static/avatar/${req.session.user_id}-${uid}.jpg`
                ),
                //@ts-ignore
                await sharp(req.files.avatar.data)
                    .resize({
                        width: 300,
                        height: 300,
                    })
                    .toFormat("jpeg")
                    .jpeg({
                        quality: 100,
                        force: true,
                    })
                    .rotate()
                    .toBuffer()
            );
            await User.updateOne(
                { _id: new ObjectId(req.session.user_id) },
                { $set: { name: req.body.name, avatar: url } }
            );
        } else {
            await User.updateOne(
                { _id: new ObjectId(req.session.user_id) },
                { $set: { name: req.body.name } }
            );
        }

        res.json({ status: "success" });
    });
    app.get("/api/all-notice", async (req, res) => {
        let allNotices = await AllNotice.find().exec();
        let result = [];
        for (let n of allNotices) {
            if (
                !(await AllNoticeNoagain.findOne({
                    user: req.session.user_id,
                    notice: String(n._id),
                }))
            ) {
                result.push(n);
            }
        }
        res.json(result);
    });
    app.get("/api/all-notice/noagain", async (req, res) => {
        if (
            !(await AllNoticeNoagain.findOne({
                user: req.session.user_id,
                notice: req.query.notice,
            }))
        ) {
            await new AllNoticeNoagain({
                user: req.session.user_id,
                notice: req.query.notice,
            }).save();
            res.json({ success: true });
        } else {
            res.json({
                success: false,
                message: "이미 다시 보지 않기로 했으면서..",
            });
        }
    });

    app.use(noticeRouter);

    // STATIC과 API는 404페이지 렌더링 안함
    app.use("/static/", (req, res) => {
        res.sendStatus(404);
    });

    app.use("/api/", (req, res) => {
        res.sendStatus(404);
    });
    // ERRORs
    // 404 NOT FOUND
    app.use((req, res) => {
        console.log(req.originalUrl);
        res.status(404).render("404.html", { user_id: req.session.user_id });
    });
    app.use(
        (
            err: any,
            req: express.Request,
            res: express.Response,
            _next: NextFunction
        ) => {
            console.error(err.stack);
            res.sendStatus(500);
        }
    );
};
