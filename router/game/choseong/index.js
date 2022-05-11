const express = require("express");
var { MongoClient } = require('mongodb');
const UID = require("uid-safe");
const Hangul = require('hangul-js');

const router = new express.Router();


var games = {}
function randint(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}


router.get("/game/choseong", (req, res) => {
    res.render("game/choseong/index.html")
});

router.post("/game/choseong/api/game/create", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var uid = UID.sync(24);
    var word = (await client.db("dict").collection("ko").find({word:{$regex:/^[\s\S]{2}$/}}).skip(randint(0, 111997)).limit(1).toArray())[0].word
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
    if (!req.body.word || !req.body.id) {
        res.json({success: false, message:"invalid request"});
        return;
    }
    if (!Object.keys(games).includes(req.body.id)) {
        res.json({success: false, message:"Game Not Exists"});
        return;
    }

    if (req.body.word.length != 3) {
        res.json({success: false, message:"invalid request"});
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


    var correct = []
    var include = []
    var i = 0
    for (var i = 0; i<3;i++) {
        if (req.body.word[i] == games[req.body.id].solution[i]) {
            correct.push(i)
        }
        else if (games[req.body.id].solution.includes(req.body.word[i])) {
            include.push(i)
        }
    }

    // 아직 진행중: 맞는 글자, 포함된 글자 정보
    res.json({success: true, status: "progressing", word: req.body.word, life: 10 - games[req.body.id].attempts.length, correct: correct, include:include});
    return;
});


router.get("/game/choseong/api/record", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var data = await client.db("school").collection("game_choseong").findOne({id: req.query.id});
    delete data._id
    res.json({success: true, data: data});
});


module.exports = router