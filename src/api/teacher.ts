import express from "express";
import User from "../models/user.entity.js";
import { getUserById } from "../util/index.js";
import { ObjectId } from "bson";

const router = express.Router();
router.post("/api/teacher/grant-permission", async (req, res) => {
    try {
        new ObjectId(req.body.user as string);
    } catch {
        res.json({ success: false });
        return;
    }
    await User.updateOne(
        {
            _id: new ObjectId(req.body.user as string),
        },
        {
            $set: {
                type: "teacher",
            },
        }
    );
    res.json({ success: true });
});
router.post("/api/teacher/deprive-permission", async (req, res) => {
    try {
        new ObjectId(req.body.user as string);
    } catch {
        res.json({ success: false });
        return;
    }
    await User.updateOne(
        {
            _id: new ObjectId(req.body.user as string),
        },
        {
            $set: {
                type: "student",
            },
        }
    );
    res.json({ success: true });
});
router.post("/api/teacher/student.ban", async (req, res) => {
    try {
        new ObjectId(req.body.user as string);
    } catch {
        res.json({ success: false });
        return;
    }
    await User.updateOne(
        {
            _id: new ObjectId(req.body.user as string),
        },
        {
            $unset: {
                class: 1,
            },
        }
    );
    res.json({ success: true });
});

router.post("/api/teacher/join.accept", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    try {
        new ObjectId(req.body.user as string);
    } catch {
        res.json({ success: false });
        return;
    }
    await User.updateOne(
        {
            _id: new ObjectId(req.body.user as string),
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
            _id: new ObjectId(req.body.user as string),
            class: user.class,
        }),
    });
});

router.post("/api/teacher/join.reject", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    try {
        new ObjectId(req.body.user as string);
    } catch {
        res.json({ success: false });
        return;
    }
    await User.updateOne(
        {
            _id: new ObjectId(req.body.user as string),
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
export default router;
