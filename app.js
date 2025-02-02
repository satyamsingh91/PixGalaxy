require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/mongoose-connection");
const cookie = require("cookie-parser");
const morgan = require("morgan");

const expressSession = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

app.use(cookie());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

// Ensure express-session is initialized before passport.session
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you can save the user profile to your database
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const indexRouter = require("./routes/indexRouter");
app.use("/", indexRouter);

app.listen(process.env.PORT || 3000, function () {
  console.log("Server Is Running");
});
