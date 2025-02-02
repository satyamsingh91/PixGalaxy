const express = require("express");
const passport = require("passport");
const router = express.Router();
const userModel = require("../models/userModel");
const postModel = require("../models/postModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const isLoggedIn = require("../middlewares/isLoggedIn");
const upload = require("../config/multer");
const fs = require("fs");


router.get("/", function(req, res) {
    res.render("index");
});


router.get("/register", function(req, res) {
    res.render("register");
});


router.post("/register", async function(req, res) {
    const { email, password, name } = req.body;
    let existUser = await userModel.findOne({ email });
    if (existUser) {
        return res.status(404).send("User Already Exist Please Login");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({
        name,
        email,
        password: hashedPassword,
    });
    await newUser.save();
    const token = jwt.sign({ id: newUser._id }, process.env.SECRET_KEY, {
        expiresIn: "1h",
    });
    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect("/profile");
});


router.get("/login", function(req, res) {
    res.render("login");
});


router.post("/login", async function(req, res) {
    const { email, password } = req.body;
    const existUser = await userModel.findOne({ email });
    if (!existUser) {
        return res.status(400).send("User Doesn't Exist Please Register ");
    }
    const result = await bcrypt.compare(password, existUser.password);
    if (!result) {
        return res.status(404).send("Invalid Email And Password");
    }
    const token = jwt.sign({ id: existUser._id }, process.env.SECRET_KEY, {
        expiresIn: "1h",
    });
    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect("/profile");
});


router.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    async (req, res) => {
        try {
            const user = req.user;
            const email = user.emails[0].value;
            const image = user.photos[0].value;
            const name = user.displayName;

            let existingUser = await userModel.findOne({ email });

            if (!existingUser) {
                existingUser = new userModel({
                    name,
                    email,
                    image, 
                });
                await existingUser.save();
            }

            const token = jwt.sign({ id: existingUser._id }, process.env.SECRET_KEY, {
                expiresIn: "1h",
            });
            res.cookie("token", token, {
                httpOnly: true,
                maxAge: 60 * 60 * 1000,
            });

            res.redirect("/profile");
        } catch (error) {
            console.error("Error during Google authentication:", error);
            res.redirect("/?error=auth_failed");
        }
    }
);


router.get("/profile", isLoggedIn, async function(req, res) {
    const user = await userModel.findById(req.id).populate("posts");
    res.render("profile", { user });
});


router.post("/fileupload", isLoggedIn, upload.single("profileImage"), async function(
    req,
    res
) {
    const user = await userModel.findById(req.id);

    if (user.image !== "default.png") {
        fs.unlinkSync(`public/images/${user.image}`);
    }

    user.image = req.file.filename;
    await user.save();
    res.redirect("/profile");
});


router.get("/createpin", isLoggedIn, async function(req, res) {
    const user = await userModel.findById(req.id);
    res.render("create");
});


router.post("/createpin", isLoggedIn, upload.single("postimage"), async function(req, res) {
    const user = await userModel.findById(req.id);
    const post = await postModel.create({
        user: user.id,
        title: req.body.title,
        description: req.body.description,
        image: req.file.filename,
    });
    user.posts.push(post);
    await user.save();
    res.redirect("/show/posts");
});


router.get("/show/posts", isLoggedIn, async function(req, res) {
    const user = await userModel.findById(req.id).populate("posts");
    res.render("show", { user });
});

router.get("/feed", isLoggedIn, async function(req, res) {
    const user = await userModel.findById(req.id);
    const posts = await postModel.find().populate("user");
    res.render("feed", { user, posts });
});

router.post("/delete-pin/:id", isLoggedIn, async function(req, res) {
    try {
        const postId = req.params.id;
        const user = await userModel.findById(req.id);

        
        const post = await postModel.findById(postId);

        if (!post || post.user.toString() !== user.id.toString()) {
            return res.status(404).send("Post not found or you don't have permission to delete this post");
        }

        
        if (fs.existsSync(`public/images/${post.image}`)) {
            fs.unlinkSync(`public/images/${post.image}`);
        }

       
        user.posts.pull(postId);

    
        await user.save();
        await postModel.findByIdAndDelete(postId);
        res.redirect("/show/posts");
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/edit-pin/:id", async (req, res) => {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).send("Pin not found");
    res.render("edit", { post });
});


router.post("/edit-pin/:id", upload.single("image"), async (req, res) => {
    const { title, description } = req.body;
    let updateData = { title, description };

    
    if (req.file) {
        updateData.image = req.file.filename;
    }

    await postModel.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/show/posts");
});




router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

module.exports = router