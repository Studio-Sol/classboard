import express from "express";
const router = express.Router();
router.get("/teacher/seat", async (req, res) => {
    res.render("seat/index.html");
});

router.get("/teacher/seat/print", async (req, res) => {
    res.render("seat/print.html");
});

export default router;
