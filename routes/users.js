const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

const { User, validateUpdateUser } = require("../models/User");
const {Order} = require("../models/Order");
const { verifyTokenAndAuthorize } = require("../middlewares/verifyToken");

// View User Profile (User himself or Admin)
router.get('/profile/:id', verifyTokenAndAuthorize, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        // جلب الطلبات الخاصة بالمستخدم وعمل populate لأسماء الكتب
        const orders = await Order.find({ userId: req.params.id })
                                  .populate('books.bookId')
                                  .sort({ createdAt: -1 }); // عرض الأحدث أولاً

        res.render('users/profile', { 
            user, 
            orders, // نمرر مصفوفة الطلبات للصفحة
            errorMessage: null 
        });
    } catch (error) {
        res.status(500).send("خطأ في تحميل البروفايل");
    }
});


// Update User Profile (User himself or Admin)
router.post("/profile/:id", verifyTokenAndAuthorize, asyncHandler(async (req, res) => {

    const { error } = validateUpdateUser(req.body);

    if (error) {
    return res.render("users/profile", {
        errorMessage: error.details[0].message,
        user: { ...req.body, _id: req.params.id } 
    });
}

    let updateData = {
        username: req.body.username,
        email: req.body.email
    };

    if (req.body.password && req.body.password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
    ).select("-password");

    res.render("users/profile", { user: updatedUser, errorMessage: "تم تحديث البيانات بنجاح" });
}));

router.get("/orders/:id", verifyTokenAndAuthorize, asyncHandler(async (req, res) => {

    const currentUser = await User.findById(req.params.id).select("-password");

    const orders = await Order.find({ userId: req.params.id })
        .populate("books.bookId") 
        .sort({ createdAt: -1 }); 

    res.render("users/orders", { 
        orders: orders, 
        user: currentUser, 
        errorMessage: null 
    });
}));


//Remove User Account (User himself or Admin)
router.post("/delete/:id", verifyTokenAndAuthorize, asyncHandler(async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie("token");
    res.redirect("/");
}));

module.exports = router;