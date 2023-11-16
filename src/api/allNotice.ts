import express from "express";
import AllNotice from "../models/all_notice.entity.js";

const router = express.Router();

router.get("/api/all-notice", async (req, res) => {
    let allNotices = await AllNotice.find().exec();
    res.json(allNotices);
});
export default router;
