const express = require("express")
var { MongoClient } = require('mongodb');
const UID = require("uid-safe");
const Hangul = require('hangul-js');

const router = new express.Router();


var games = {}
function randint(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

var counts = {
    "3": 111997,
    "4": 63688
}

router.get("/game/choseong", (req, res) => {
    res.render("game/choseong/index.html")
});

router.post("/game/choseong/api/game/create", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var uid = UID.sync(24);
    var leng = randint(3,5);
    var word = (await client.db("dict").collection("ko").find({length: leng}).skip(randint(0, counts[leng])).limit(1).toArray())[0].word
    var cho_joong_jong = Hangul.d(word, true);
    var choseong = ""
    cho_joong_jong.forEach(e => choseong += e[0])
    var game = {
        id: uid,
        user: req.session.user_id,
        solution: word,
        attempts: [],
        choseong: choseong
    }
    games[uid] = game
    res.json({success: true, id: uid, choseong: choseong})
});


router.post("/game/choseong/api/game/attempt", async (req, res) => {
    if (!Object.keys(games).includes(req.body.id)) {
        res.json({success: false, message:"Game Not Exists"});
        return;
    }
    games[req.body.id].attempts.push(req.body.word);

    // 정답 맞춤
    if (req.body.word == games[req.body.id].solution) {
        var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
        client.db("school").collection("game_choseong").insertOne(games[req.body.id])
        res.json({success: true, status: "success", game: games[req.body.id]});
        return;
    }

    // 목숨 다 씀
    if (games[req.body.id].attempts.length == 10) {
        var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
        client.db("school").collection("game_choseong").insertOne(games[req.body.id])
        res.json({success: true, status: "fail", game: games[req.body.id]});
        return;
    }

    // 아직 진행중
    res.json({success: true, status: "progressing", life: 10 - games[req.body.id].attempts.length});
    return;
});


router.get("/game/choseong/api/record", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var data = await client.db("school").collection("game_choseong").findOne({id: req.query.id});
    res.json({success: true, data: data});
});


module.exports = router