const express = require("express")
const PythonShell = require("python-shell").PythonShell;
const request = require("request");
var { MongoClient } = require('mongodb');
const fs = require("fs");
const rateLimit = require('express-rate-limit')



function discord_alert(content) {
    request.post("https://ptb.discord.com/api/webhooks/960146429970624562/tNpzHEp6INI-peVkABcHNSp4tBjJp3PazVGFSuU7AWfsB4xNi--rGKvXysiBvnPLH3F4", {
        form: {
            username: "웹서버 알림",
            content: content,
            avatar_url: "https://brands-up.ch/public/images/uploads/4992df9efc2903c7cfb07e7a6824b6674064e9f6.png"
        }
    })
}


const router = new express.Router()

router.use(["/api/captcha/gen", "/api/captcha/verify"], (req, res, next) => {
    if (req.header("Auth") == undefined) {
        res.status(403).json({success: false, mesage: "use 'Auth' header"});
        return;
    }
    if (req.header("Auth") != "715815246127693825") {
        res.status(403).json({success: false, mesage: "Unknown Auth Token"});
        return;
    }
    next();
});


router.use("/api/captcha/gen", rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 5,
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    statusCode: 200,
    handler: (req, res) => {
        discord_alert(`rateLimit 알림 : \`{ip: "${req.ip}", auth: "${req.header("Auth")}"}\``)
        res.status(429).send({success: false, message: "too fast, please slow down"})
    },
    keyGenerator: (req, res) => {
        return req.header("Auth")
    },
}));


router.get("/api/captcha/gen", (req, res) => {
    PythonShell.run("captcha.py", {
        scriptPath: "/home/ubuntu/storage/school/router/api/captcha/"
    }, async function(err, data) {
        var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
        var data = JSON.parse(data)
        var insert = {
            token: data.id,
            value: data.value,
            expireAt: new Date(new Date().getTime() + 1000 * 60 * 5),
            image: fs.readFileSync("./captcha_img/" + data.id + ".jpg").toString("base64")
        }
        fs.unlink("./captcha_img/" + data.id + ".jpg", () => {})
        client.db("school").collection("captcha").insertOne(insert)
        res.json({success: true, token: insert.token, expireAt: insert.expireAt})
    })
});


router.get("/api/captcha/verify", async (req, res) => {
    if (req.header("Secret") != "Mythical") {
        res.status(403).json({success: false, mesage: "Unknown Secret Key"});
        return;
    }
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var data = await client.db("school").collection("captcha").findOne({
        token: req.query.token,
        value: req.query.value.toUpperCase()
    });
    if (data) {
        res.json({verify: true})
        return;
    }
    res.json({verify: false})
});


router.get("/api/captcha/img/:token", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var data = await client.db("school").collection("captcha").findOne({
        token: req.params.token
    });
    if (data) {
        var img = Buffer.from(data.image, 'base64');

        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': img.length
        });
        res.end(img); 
    }
    else {
        res.sendStatus(404)
    }
});






module.exports = router