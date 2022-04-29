const express = require("express")
const PythonShell = require("python-shell").PythonShell;
const request = require("request");
var { MongoClient } = require('mongodb');
const fs = require("fs");
const rateLimit = require('express-rate-limit')



function discord_alert(content) {
    request.post("https://ptb.discord.com/api/webhooks/968132224425795624/SmmFS54OFE9oY7QKJvYTCt7WnmFLNN2e0cbPBWTkA0xi30L1VjSr0xQHZgrheIKbehOi", {
        form: {
            username: "웹서버 알림",
            content: content,
            avatar_url: "https://brands-up.ch/public/images/uploads/4992df9efc2903c7cfb07e7a6824b6674064e9f6.png"
        }
    })
}


const router = new express.Router()

router.use(["/api/captcha/gen", "/api/captcha/verify"], async (req, res, next) => {
    if (req.header("Key") == undefined) {
        res.status(403).json({success: false, mesage: "use 'Key' header"});
        return;
    }
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var api_client = client.db("school").collection("api_client").findOne({
        key: req.header("Key")
    });
    if (!api_client) {
        res.status(403).json({success: false, mesage: "Unknown Key"});
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
        discord_alert(`rateLimit 알림 : \`{ip: "${req.ip}", Key: "${req.header("Key")}"}\``)
        res.status(429).send({success: false, message: "too fast, please slow down"})
    },
    keyGenerator: (req, res) => {
        return req.header("Key")
    },
}));


router.get("/api/captcha/gen", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var api_client = await client.db("school").collection("api_client").findOne({
        key: req.header("Key")
    });
    if (!api_client) {
        res.json({});
        return;
    }
    client.db("school").collection("api_client").updateOne({
        key: req.header("Key")
    }, {
        $inc: {
            captcha: 1
        }
    });
    PythonShell.run("captcha.py", {
        scriptPath: "/home/ubuntu/storage/school/router/api/captcha/"
    }, async function(err, data) {
        var data = JSON.parse(data)
        var insert = {
            client: api_client.key,
            token: data.id,
            value: data.value,
            expireAt: new Date(new Date().getTime() + 1000 * 60 * 5),
            image: fs.readFileSync("./tmp/captcha_" + data.id + ".jpg").toString("base64")
        }
        client.db("school").collection("captcha").insertOne(insert)
        res.json({success: true, token: insert.token, expireAt: insert.expireAt})
        fs.unlink("./tmp/captcha_" + data.id + ".jpg", () => {})
    })
});


router.get("/api/captcha/verify", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var api_client = await client.db("school").collection("api_client").findOne({
        key: req.header("Key")
    });
    console.log(req.header("Secret"), api_client.secret)
    if (req.header("Secret") != api_client.secret) {
        res.status(403).json({success: false, mesage: "Incorrect Secret Key"});
        console.log("asdf")
        return;
    }
    
    var data = await client.db("school").collection("captcha").findOne({
        client: api_client.key,
        token: req.query.token,
        value: req.query.value.toUpperCase()
    });
    if (data) {
        res.json({verify: true})
        client.db("school").collection("captcha").deleteOne({
            token: req.query.token
        })
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