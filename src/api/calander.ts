import express from "express";
import Calander from "../models/calander.entity.js";
import { getUserById } from "../util/index.js";

const router = express.Router();
router.post("/api/calendar", async (req, res) => {
    var user = await getUserById(req.session.user_id);
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
router.get("/api/calendar", async (req, res) => {
    var user = await getUserById(req.session.user_id);
    var result = await Calander.find({
        class: user.class,
        start: {
            $gte: new Date(req.query.start as string),
            $lt: new Date(req.query.end as string),
        },
    }).exec();
    res.json(result);
});
export default router;
