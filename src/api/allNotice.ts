import express from "express";
import AllNotice from "../models/all_notice.entity.js";
import AllNoticeNoagain from "../models/all_notice_noagain.entity.js";

const router = express.Router();

router.get("/api/all-notice", async (req, res) => {
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
router.get("/api/all-notice/noagain", async (req, res) => {
    await AllNoticeNoagain.updateOne(
        {
            user: req.session.user_id,
            notice: req.query.notice,
        },
        {
            $set: {
                user: req.session.user_id,
                notice: req.query.notice,
            },
        },
        { upsert: true }
    );
    return res.json({ success: true });
});
export default router;
