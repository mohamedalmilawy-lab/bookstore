const mongoose = require('mongoose');
const joi = require("joi");
const passwordComplexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, min: 2, max: 200 },
    email: { type: String, required: true, trim: true, unique: true, min: 5, max: 200 },
    password: { type: String, required: true, trim: true, min: 8 },
    isAdmin: { type: Boolean, default: false },
    cart: [{
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    quantity: { type: Number, default: 1 }
    }],
    favorites: [{type: mongoose.Schema.Types.ObjectId, ref: 'Book' }]

}, { timestamps: true });

userSchema.methods.generateToken = function () {
    return jwt.sign({ id: this._id, isAdmin: this.isAdmin, username: this.username }, process.env.JWT_SECRET);
};

const User = mongoose.model("User", userSchema);

// --- توابع التحقق (Validation) ---
// 1. تحقق التسجيل
function validateRegisterUser(user) {
    const schema = joi.object({
        email: joi.string().email().trim().min(5).max(200).required(),
        username: joi.string().trim().min(2).max(200).required(),
        password: passwordComplexity().required(),
        confirmPassword: joi.string().valid(joi.ref("password")).required().messages({
            "any.only": "كلمة المرور غير متطابقة"
        })
    });
    return schema.validate(user);
}

// 2. تحقق تسجيل الدخول
function validateLoginUser(user) {
    const schema = joi.object({
        email: joi.string().email().trim().min(5).max(200).required(),
        password: joi.string().trim().min(8).required(),
    });
    return schema.validate(user);
}

// التحديث
function validateUpdateUser(user) {
    const schema = joi.object({
        email: joi.string().email().trim().min(5).max(200),
        username: joi.string().trim().min(2).max(200),
        password: passwordComplexity().optional().allow(''),
        isAdmin: joi.boolean()
    });
    return schema.validate(user);
}

function validateResetPassword(data) {
    const schema = joi.object({
        password: passwordComplexity().required(),
        confirmPassword: joi.string().valid(joi.ref("password")).required().messages({
            "any.only": "كلمة المرور غير متطابقة"
        })
    });
    return schema.validate(data);
}

module.exports = { 
    User, 
    validateRegisterUser, 
    validateLoginUser, 
    validateUpdateUser, 
    validateResetPassword,
};