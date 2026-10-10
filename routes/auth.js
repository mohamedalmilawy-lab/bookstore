const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const {
    User,
    validateRegisterUser,
    validateLoginUser,
    validateResetPassword
} = require("../models/User");


/**
 * 🔹 صفحة تسجيل
 */
router.get("/register", (req, res) => {
    res.render("auth/register", { errorMessage: null });
});

/**
 * 🔹 صفحة تسجيل الدخول
 */
router.get("/login", (req, res) => {
    res.render("auth/login", { errorMessage: null });
});

/**
 * 🔹 forgot password
 */
router.get("/forgot-password", (req, res) => {
    res.render("auth/forgot-password", { errorMessage: null });
});

/**
 * 🔹تسجيل مستخدم
 */
router.post("/register", asyncHandler(async (req, res) => {
    const { error } = validateRegisterUser(req.body);

    if (error) {
        return res.render("auth/register", {
            errorMessage: error.details[0].message
        });
    }

    const { email, username , confirmPassword} = req.body;
    let { password } = req.body;

    if (password !== confirmPassword) {
        return res.render("auth/register", {
            errorMessage: "Passwords do not match"
        });
    }

    let user = await User.findOne({ email });
    if (user) {
        return res.render("auth/register", {
            errorMessage: "Email already exists"
        });
    }

    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);

    user = new User({ email, username, password });
    await user.save();

    const token = user.generateToken();

    res.cookie("token", token, {
        httpOnly: true
    });

    res.redirect("/");
}));

/**
 * 🔹 تسجيل الدخول
 */
router.post("/login", asyncHandler(async (req, res) => {
    const { error } = validateLoginUser(req.body);

    if (error) {
        return res.render("auth/login", {
            errorMessage: error.details[0].message
        });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.render("auth/login", {
            errorMessage: "Invalid email or password"
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.render("auth/login", {
            errorMessage: "Invalid email or password"
        });
    }

    const token = user.generateToken();

    // نحفظ التوكن في cookie
    res.cookie("token", token, {
        httpOnly: true
    });

    res.redirect("/");
}));

/**
 * 🔹 إرسال رابط إعادة تعيين كلمة المرور
 */
router.post("/forgot-password", asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.render("auth/forgot-password", {
            errorMessage: "Email not found"
        });
    }

    const secret = process.env.JWT_SECRET + user.password;
    const token = jwt.sign(
        { email: user.email, id: user._id },
        secret,
        { expiresIn: "10m" }
    );

    const link = `http://localhost:3000/auth/reset-password/${user._id}/${token}`;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset",
        html: `<p>Click <a href="${link}">here</a> to reset your password</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.render("auth/link-sent");
    } catch (error) {
        res.render("auth/forgot-password", {
            errorMessage: "Error sending email"
        });
    }
}));

/**
 * 🔹 صفحة إعادة التعيين
 */
router.get("/reset-password/:id/:token", asyncHandler(async (req, res) => {
    const { id, token } = req.params;

    const user = await User.findById(id);
    if (!user) return res.render("404");

    const secret = process.env.JWT_SECRET + user.password;

    try {
        jwt.verify(token, secret);
        res.render("auth/reset-password", {
            email: user.email,
            errorMessage: null
        });
    } catch (error) {
        res.render("404");
    }
}));

/**
 * 🔹 تنفيذ إعادة التعيين
 */
router.post("/reset-password/:id/:token", asyncHandler(async (req, res) => {
    const { error } = validateResetPassword(req.body);

    if (error) {
        return res.render("auth/reset-password", {
            errorMessage: error.details[0].message
        });
    }

    const { id, token } = req.params;
    const { password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.render("404");

    const secret = process.env.JWT_SECRET + user.password;

    try {
        jwt.verify(token, secret);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        await user.save();

        res.render("auth/success-password");
    } catch (error) {
        res.render("404");
    }
}));


router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/"); 
});

module.exports = router;