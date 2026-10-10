const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const nodemailer = require('nodemailer');   
const { Book } = require("../models/Book");
const {User} = require("../models/User");

router.get("/", asyncHandler(async (req, res) => {
    const latestBooks = await Book.find({}).sort({ createdAt: -1 }).limit(8).populate('author'); 
    const books = await Book.find().populate("author", ["firstName", "lastName"]);
    res.render("index", { books, latestBooks });
}));

router.get('/contact', (req, res) => {
    res.render('contact', { title: 'اتصل بنا' });
});

router.post('/contact', async (req, res) => {
    let name, email;

    if (req.user) {
        const user = await User.findById(req.user.id);
        name = user.username;
        email = user.email;
    } else {
        name = req.body.name;
        email = req.body.email;
    }

    const subject = req.body.subject || 'رسالة جديدة من موقع بيت الكتب';
    const message = req.body.message;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS   
        }
    });

    const mailOptions = {
        from: email, 
        to: process.env.EMAIL_USER, 
        subject: subject,
        replyTo: email,
        html: `<h3>رسالة من: ${name}</h3><p>البريد: ${email}</p><hr><p>${message}</p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        return res.render('contact', { 
            title: 'اتصل بنا', 
            success: 'تم إرسال رسالتك بنجاح! سنرد عليك قريباً.',
            user: req.user || null // نمرر اليوزر لكي لا يختفي النافبار
        });
    } catch (error) {
        console.error("خطأ في الإرسال:", error);
        return res.render('contact', { 
            title: 'اتصل بنا', 
            error: 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.',
            user: req.user || null 
        });
    }
});

router.get('/about', (req, res) => {
    res.render('about', { title: 'من نحن' });
});


module.exports = router;