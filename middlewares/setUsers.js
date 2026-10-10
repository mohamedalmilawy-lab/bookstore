const jwt = require("jsonwebtoken");
const { User } = require("../models/User");

module.exports = async (req, res, next) => {
    // 1. تعريف المسار الحالي (هذا هو السطر المنقذ)
    res.locals.path = req.path; 

    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select("-password");
            res.locals.user = user;
            req.user = user;
        } catch (error) {
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
};