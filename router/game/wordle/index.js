const express = require("express");
const router = new express.Router();

router.get("/game/wordle", (req, res) => {
    res.render("game/wordle/index.html")
});


router.get("/game/wordle/api/words", (req, res) => {
    res.sendFile("/home/ubuntu/storage/school/router/game/wordle/words.json")
});


module.exports = router