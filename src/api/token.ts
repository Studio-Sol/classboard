import { ObjectId } from "bson";
import express from "express";
import QRCode from "qrcode";
import { getUserById } from "../util/index.js";
import Token from "../models/token.entity.js";
const router = express.Router();

router.get("/api/qrcode", async (req, res) => {
    res.send(await QRCode.toDataURL(req.query.data));
});
export default router;
