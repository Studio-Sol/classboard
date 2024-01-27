import express from "express";
import AllNotice from "../models/all_notice.entity.js";

const router = express.Router();

router.get("/api/all-notice", async (req, res) => {
    let allNotices = await AllNotice.find().exec();
    let result = [];
    for (let e of allNotices) {
        result.push({ color: e.color, html: e.html });
    }
    res.json(result);
});
export default router;
