const express = require("express");
const path = require("path");
const router = new express.Router();

router.get("/game/wordle", (req, res) => {
    res.render("game/wordle/index.html");
});

router.get("/game/wordle/api/words", (req, res) => {
    res.sendFile(__dirname + "/words.json");
});

module.exports = router;
