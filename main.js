const express = require("express")
const Neis = require("@my-school.info/neis-api").default;
const neis = new Neis({ KEY: "451d037d3e6343f097c4d6ff75d543f1", Type: "json" });
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require("mongodb").ObjectId;
const Timetable = require('comcigan-parser');
const {OAuth2Client} = require('google-auth-library');
const session = require('express-session');
const FileStore = require('session-file-store')(session);


const app = express();

app.set('trust proxy',1)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('views', __dirname + '/view');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use("/static", express.static(__dirname + '/static'));
app.use(session({
    secret: 'ehighsdofkjmseo',  // 암호화
    resave: false,
    saveUninitialized: true,
    store: new FileStore(),
    cookie: {
        domain: "sol-studio.shop",
        maxAge: 1000 * 60 * 60 * 24 * 30 // 세션 30일
    },
    key: "sid"
}));
function getMondayDate(d) {
    var paramDate = new Date(d);

    var day = paramDate.getDay();
    var diff = paramDate.getDate() - day + (day == 0 ? -6 : 1);
    var result = new Date(paramDate.setDate(diff)).toISOString().substring(0, 10)
    return result;
}

function choice (a, k=1) {
    if (k == 1) {
        return a[Math.floor(Math.random() * a.length)];
    }
    var return_array = []
    for (var i=0;i < k; i++) {
        return_array.push(a[Math.floor(Math.random() * a.length)])
    }
    return return_array
}


app.use((req, res, next) => {
    if (!req.session.user_id) {
        if (req.path.startsWith("/login") || req.path.startsWith("/static")) {
            next();
        }
        else {
            res.redirect("/login")
        }
    }
    else {
        next();
    }
})


app.get("/", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var classroom = await client.db("school").collection("class").findOne({
        _id: new ObjectId(user.class)
    })
    if (user.waiting) {
        res.render("wait.html", {waiting: user.class})
    }
    else if (user.class == null) {
        if (user.type == "teacher") {
            res.redirect("/register-class");
        }
        else if (user.type == "student") {
            res.redirect("/invite");
        }
        else {
            res.redirect("/login/type")
        }
    }
    else {
        var monday = getMondayDate(new Date());
        res.render("main.html", {monday: monday, grade: classroom.class.GRADE, classroom: classroom.class.CLASS_NM, school_name: classroom.school.SCHUL_NM});
    }
});
app.get("/register-class", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});

    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.session.user_id)})
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    res.render("find-school.html", {error: req.query.error})
});
app.post("/register-class", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});

    var user = await client.db("school").collection("user").findOne({_id: new ObjectId(req.session.user_id)})
    if (user.type != "teacher") {
        res.redirect("/");
        return;
    }
    if (user.class != null) {
        res.redirect("/");
        return;
    }

    var schools = await neis.getSchoolInfo(
        {
            SCHUL_NM: req.body.school
        },
        {
            pSize: 100
        }
    )
    for (const s of schools) {
        if (s.SCHUL_NM == req.body.school) {
            var school = s;
            break;
        }
    }
    var classrooms = await neis.getClassInfo(
        {
            SD_SCHUL_CODE: school.SD_SCHUL_CODE,
            GRADE: req.body.grade,
            ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
            DGHT_CRSE_SC_NM: school.DGHT_SC_NM,
            CLASS_NM: req.body.class
        },
        {
            pSize: 100
        }
    )
    for (const s of classrooms) {
        if (s.CLASS_NM == req.body.class) {
            var classroom = s;
            break;
        }
    }

    if (!schools.length == 100) {
        res.redirect("/register-class?error=toomanyschool")
    }
    else if (schools.length == 0) {
        res.redirect("/register-class?error=noschool")
    }

    if (!classroom) {
        res.redirect("/register-class?error=noclass")
    }
    else {
        var i = await client.db("school").collection("class").insertOne({
            school: {
                SD_SCHUL_CODE: school.SD_SCHUL_CODE,
                ATPT_OFCDC_SC_CODE: school.ATPT_OFCDC_SC_CODE,
                SCHUL_NM: school.SCHUL_NM
            },
            class: {
                MADE: user._id,
                GRADE: classroom.GRADE,
                CLASS_NM: classroom.CLASS_NM
            },
            invite: choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6).join("")
        })
        await client.db("school").collection("user").updateOne(
            {
                _id: new ObjectId(req.session.user_id)
            },
            {
                $set: {
                    class: i.insertedId
                }
            }
        )

        res.redirect("/")
    }
})
app.get("/api/meal", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var classroom = await client.db("school").collection("class").findOne({
        _id: new ObjectId(user.class)
    })
    var meal = await neis.getMealInfo(
        {
            ATPT_OFCDC_SC_CODE: classroom.school.ATPT_OFCDC_SC_CODE,
            SD_SCHUL_CODE: classroom.school.SD_SCHUL_CODE,
            MLSV_YMD: req.query.date
        },
        {
            pSize: 1
        }
    );
    if (meal.success) {
        res.json({meal: meal.meal})
    }
    else {
        res.json({success: true, meal: []})
    }
});

app.post("/api/post", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    client.db("school").collection("post").insertOne({
        title: req.body.title,
        content: req.body.content,
        author: user._id,
        class: user.class,
        timestamp: new Date().getTime()
    })
    res.json({success: true})
});
app.get("/api/post", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var data = await client.db("school").collection("post").find({
        class: user.class
    }).limit(5).toArray();

    var result = []
    for (const d of data) {
        result.push({title: d.title, id: d._id})
    }
    res.json({success: true, post: result})
});
app.get("/api/notice", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var data = await client.db("school").collection("notice").find({
        class: user.class
    }).limit(5).toArray();

    var result = []
    for (const d of data) {
        result.push({title: d.title, id: d._id})
    }
    res.json({success: true, notice: result})
});
app.get("/api/timetable", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var data = await client.db("school").collection("timetable").findOne({

    })
})

app.get("/api/error", (req, res) => {
    res.end();
})
app.get("/login", (req, res) => {
    res.render("login.html");
})
app.get("/login/callback/google", async (req, res) => {
    const googleClient = new OAuth2Client("349199124039-jrrvfbb7cerksel6s9d5uoq3ta9p0lak.apps.googleusercontent.com");
    try {
        var ticket = await googleClient.verifyIdToken({
            idToken: req.query.token,
            audience: "349199124039-jrrvfbb7cerksel6s9d5uoq3ta9p0lak.apps.googleusercontent.com",
        });
    }
    catch {
        res.send("오류");
        return;
    }
    const payload = ticket.getPayload();
    // const userid = payload['sub'];

    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({ email: payload.email })
    if (user != null) {
        req.session.user_id = user._id;
        res.redirect("/")
    }
    else {
        user = await client.db("school").collection("user").insertOne({
            type: null,
            auth: "google",
            email: payload.email,
            name: payload.name,
            avatar: payload.picture,
            class: null,
            waiting: false
        });
        req.session.user_id = user.insertedId;
        req.session.save(() => {
            res.redirect("/login/type");
        })
    }
});
app.get("/login/type", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({ _id: new ObjectId(req.session.user_id) })
    if (user.type != null) {
        res.redirect("/")
    }
    else {
        res.render("login/type.html", {id: req.session.user_id})
    }
    
})
app.get("/login/type/callback", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({ _id: new ObjectId(req.session.user_id) })
    if (user.type == null) {
        if (req.query.type == "teacher") {
            await client.db("school").collection("user").updateOne({ _id: new ObjectId(req.session.user_id) }, {$set: {type: "teacher"}})
            res.redirect("/register-class");
            return;
        }
        if (req.query.type == "student") {
            await client.db("school").collection("user").updateOne({ _id: new ObjectId(req.session.user_id) }, {$set: {type: "student"}})
            res.redirect("/invite");
            return;
        }
    }
    res.redirect("/")
})
app.get("/invite", (req, res) => {
    res.render("invite.html", {error: req.query.error ?? ""})
})
app.get("/invite/:code", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var classroom = await client.db("school").collection("class").findOne({invite: req.params.code})
    if (classroom) {
        client.db("school").collection("user").updateOne({_id: new ObjectId(req.session.user_id)}, {$set: {class: classroom._id, waiting: true}})
        res.redirect("/")
    }
    else {
        res.redirect("/invite?error=noinvite")
    }
});
app.get("/logout", (req, res) => {
    delete req.session.user_id
    res.redirect("/login")
});



app.get("/post", async (req, res) => {
    res.end()
})

app.get("/post/:id", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    try {
        new ObjectId(req.params.id)
    }
    catch {
        res.sendStatus(404);
        return;
    }
    var data = await client.db("school").collection("post").findOne({
        class: user.class,
        _id: new ObjectId(req.params.id)
    });
    if (data == null) {
        res.sendStatus(404);
        return;
    }
    var author =  await client.db("school").collection("user").findOne({
        _id: new ObjectId(data.author)
    });
    res.render("post.html", {data: data, author: author})
})
app.get("/notice", async (req, res) => {
    res.end()
})
app.get("/notice/:id", async (req, res) => {
    var client = await MongoClient.connect("mongodb://127.0.0.1/", {useNewUrlParser: true});
    try {
        new ObjectId(req.params.id)
    }
    catch {
        res.sendStatus(404);
        return;
    }
    var user = await client.db("school").collection("user").findOne({
        _id: new ObjectId(req.session.user_id)
    })
    var data = await client.db("school").collection("notice").findOne({
        class: user.class,
        _id: new ObjectId(req.params.id)
    });
    var author =  await client.db("school").collection("user").findOne({
        _id: new ObjectId(data.author)
    });
    if (data == null) {
        res.sendStatus(404);
        return;
    }
    res.render("notice.html", {data: data, author: author})

    
})







app.listen(3000, () => {
    console.log("hi")
})