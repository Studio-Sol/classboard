import UID from "uid-safe";
import express from "express";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { ObjectId } from "bson";
import User from "../models/user.entity.js";
import DeletedUser from "../models/deleted_user.entity.js";
import { fileURLToPath } from "url";
import { getUserById } from "../util/index.js";
import noticeRouter from "./notice.js";
import allNoticeRouter from "./allNotice.js";
import teacherRouter from "./teacher.js";
import calanderRouter from "./calander.js";
import commentRouter from "./comment.js";
import postRouter from "./post.js";
import neisRouter from "./neis.js";
import tokenRouter from "./token.js";
import { logger } from "../config/winston.js";
import classEntity from "../models/class.entity.js";
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const router = express.Router();
router.get("/api/client", async (req, res) => {
    if (req.session.user_id)
        return res.json({ user: await getUserById(req.session.user_id) });
    else return res.json({ user: null });
});
router.get("/api/class", async (req, res) => {
    if (req.session.user_id)
        return res.json({
            class: await classEntity.findById(
                (
                    await getUserById(req.session.user_id)
                ).class
            ),
        });
    else return res.json({ class: null, session: req.session });
});
router.use("/api/*", async (req, res, next) => {
    var user = await getUserById(req.session.user_id);
    if (!user.class) return res.sendStatus(400);
    next();
});
router.use("/api/teacher/*", async (req, res, next) => {
    if (req.session.user_type != "teacher") return res.sendStatus(403);
    next();
});

router.post("/api/upload-img", async (req, res) => {
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

router.get("/error", (req, res) => {
    res.end();
});

router.post("/api/delete-user", async (req, res) => {
    if (new Date().getTime() - parseInt(req.query.t as string) > 5000) {
        return res.json({ success: false });
    }
    let user = await getUserById(req.session.user_id);
    const {
        _id: _,
        __v: __,
        ...deletedUser
    } = JSON.parse(JSON.stringify(user));
    logger.info(
        JSON.stringify({
            file: "api/index",
            payload: {
                action: "delete-user",
                user: user,
            },
        })
    );
    new DeletedUser(deletedUser).save();
    await User.deleteOne({ _id: user._id });

    req.session.destroy();
    res.json({ success: true });
});

router.post("/api/setting/save", async (req, res) => {
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

router.use(noticeRouter);
router.use(allNoticeRouter);
router.use(teacherRouter);
router.use(calanderRouter);
router.use(commentRouter);
router.use(postRouter);
router.use(neisRouter);
router.use(tokenRouter);
export default router;
