import UID from "uid-safe";
import jwt from "../modules/jwt.js";
import express, { NextFunction } from "express";
import fs from "fs";
import path from "path";
import routes from "../routes/index.js";
import sharp from "sharp";
import { ObjectId } from "bson";
import Calander from "../models/calander.entity.js";
import Reply from "../models/reply.entity.js";
import Timetable from "../models/timetable.entity.js";
import User from "../models/user.entity.js";
import Class from "../models/class.entity.js";
import Post from "../models/post.entity.js";
import Notice from "../models/notice.entity.js";
import Comment from "../models/comment.entity.js";
import DeletedUser from "../models/deleted_user.entity.js";
import AllNotice from "../models/all_notice.entity.js";
import AllNoticeNoagain from "../models/all_notice_noagain.entity.js";
import Neis from "../modules/neis.js";
import { fileURLToPath } from "url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
import mealEntity from "../models/meal.entity.js";
function formatDate(date: Date) {
    return date.toISOString().slice(0, 10).replace("-", "").replace("-", "");
}
export default async (
    app: express.Application,
    neis: Neis,
    serviceURL: string
) => {
    await routes(app, neis, serviceURL);
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

    app.post("/api/notice", async (req, res) => {
        var user = await User.findOne({
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
        var notice_new = await new Notice({
            title: body.title,
            content: body.content,
            preview: body.content.replace(/<[^>]*>?/gm, "").slice(0, 20),
            author: user._id,
            class: user.class,
            timestamp: new Date().getTime(),
            question: question,
        }).save();
        res.json({ status: "success", id: notice_new._id });
    });

    app.post("/api/notice/question/reply", async (req, res) => {
        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        try {
            new ObjectId(req.body.id);
        } catch {
            res.sendStatus(404);
            return;
        }
        var question = (
            await Notice.findOne({ _id: new ObjectId(req.body.id) })
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
                        Reply.count({
                            id: req.body.id,
                            answer: req.body.answer,
                        }) >= question.items[parseInt(req.body.answer)].limit
                    ) {
                        res.json({
                            success: false,
                            message:
                                "해당 항목의 회신 최대 수 제한을 초과했습니다.",
                        });
                        return;
                    }
                }

                if (await Reply.findOne({ user: user._id, id: req.body.id })) {
                    await Reply.updateOne(
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
                    await new Reply({
                        user: user._id,
                        id: req.body.id,
                        answer: req.body.answer,
                        timestamp: new Date().getTime(),
                    }).save();
                }
            } else if (question.type == "text") {
                if (
                    !(await Reply.findOne({
                        id: req.body.id,
                        user: user._id,
                    }))
                )
                    await new Reply({
                        user: user._id,
                        id: req.body.id,
                        answer: req.body.answer,
                        timestamp: new Date().getTime(),
                    }).save();
                else
                    await Reply.updateOne(
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
            }
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
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

    app.get("/api/notice", async (req, res) => {
        try {
            var user = await User.findOne({
                _id: new ObjectId(req.session.user_id),
            });
            if (isNaN(parseInt(req.query.skip as string))) {
                res.json({ success: false, message: "비정상적인 요청" });
                return;
            }
            var data = await Notice.find({
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
                        _id: d.author,
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

        var user = await User.findOne({
            _id: new ObjectId(req.session.user_id),
        });
        var classroom = await Class.findOne({
            _id: user.class,
        });
        console.log(classroom);
        if (!req.query.refresh) {
            var cache = [];
            for (var i = 0; i < 5; i++) {
                var tmp = new Date(
                    new Date(
                        `${(req.query.monday as string).slice(0, 4)}-${(
                            req.query.monday as string
                        ).slice(4, 6)}-${(req.query.monday as string).slice(
                            6,
                            8
                        )}`
                    ).getTime() +
                        1000 * 60 * 60 * 24 * i
                );
                cache.push.apply(
                    cache,
                    await Timetable.find({
                        ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                        SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                        ALL_TI_YMD: formatDate(tmp),
                        CLASS_NM: classroom.class.CLASS_NM,
                        GRADE: classroom.class.GRADE,
                    }).exec()
                );
            }
            if (cache.length > 0) {
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
                res.json({ success: false, message: "NEIS API ERROR" });
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
                    ITRT_CNTNT: t.ITRT_CNTNT?.replace("-", "") ?? "알 수 없음",
                    PERIO: t.PERIO,
                });
            }

            Timetable.insertMany(result);
            res.json({
                success: true,
                table: refine(Timetable),
                friday: formatDate(friday),
            });
        } else {
            for (var i = 0; i < 5; i++) {
                var tmp = new Date(
                    new Date(
                        `${(req.query.monday as string).slice(0, 4)}-${(
                            req.query.monday as string
                        ).slice(4, 6)}-${(req.query.monday as string).slice(
                            6,
                            8
                        )}`
                    ).getTime() +
                        1000 * 60 * 60 * 24 * i
                );

                await Timetable.deleteMany({
                    ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
                    SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
                    ALL_TI_YMD: formatDate(tmp),
                    CLASS_NM: classroom.class.CLASS_NM,
                    GRADE: classroom.class.GRADE,
                });
            }
            try {
                var timetables = await neis.getTimetable(
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
            for (let t of timetables) {
                result.push({
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
        }
    });

    app.get("/api/teacher/student.ban", async (req, res) => {
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
                class: user.class,
            },
            {
                $set: {
                    class: null,
                },
            }
        );
        res.json({ success: true });
    });

    app.get("/api/teacher/join.accept", async (req, res) => {
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
        var verify = await jwt.verify(req.query.token);
        if (verify != -1) {
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
        } else {
            res.json({ code: -1, message: "JWT TOKEN IS INVALID!!" });
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

    app.post("/api/delete-user", async (req, res) => {
        var payload = await jwt.verify(req.body.token);
        if (
            payload.url == "/delete-user" &&
            payload.user == req.session.user_id
        ) {
            var user = await User.findOne({
                _id: new ObjectId(req.session.user_id),
            });
            new DeletedUser(user).save();
            User.deleteOne({ _id: new ObjectId(req.session.user_id) });

            req.session.destroy();
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
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

    // ERRORs
    // 404 NOT FOUND
    app.use((req, res) => {
        console.log(req.originalUrl);
        res.render("404.html", { user_id: req.session.user_id });
    });

    // STATIC과 API는 404페이지 렌더링 안함
    app.use("/static/", (req, res) => {
        res.sendStatus(404);
    });

    app.use("/api/", (req, res) => {
        res.sendStatus(404);
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
