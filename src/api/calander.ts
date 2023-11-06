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
        title: req.body.title ?? req.body.description.split("\n")[0],
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
    let limit = parseInt(req.query.limit as string);
    if (isNaN(limit)) {
        limit = 100;
    }
    if (limit > 100) {
        limit = 100;
    }
    var events = await Calander.find({
        class: user.class,
        start: {
            $gte: new Date(req.query.start as string),
            $lt: new Date(req.query.end as string),
        },
    })
        .limit(limit)
        .sort({ start: 1 })
        .exec();
    let result = [];
    for (let event of events) {
        let { _id, title, description, start, end } = event;
        title =
            title.replaceAll(" ", "") == ""
                ? description.split("\n")[0]
                : title;
        result.push({ id: _id, title, description, start, end });
    }
    res.json(result);
});
export default router;
