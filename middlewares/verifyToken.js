const jwt = require("jsonwebtoken");

// 1. التحقق من التوكن الأساسي
function verifyToken(req, res, next) {
    const token = req.cookies.token || req.headers.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: error });
        }
    } else {
        if (!res.locals.user) return res.redirect('/auth/login');
    }
}

// 2. التحقق من صاحب الحساب أو الأدمن 
function verifyTokenAndAuthorize(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.id.toString() === req.params.id.toString() || req.user.isAdmin) {
            next();
        } else {
            res.status(403).json({ message: "غير مسموح لك بالقيام بهذا الإجراء" });
        }
    });
}

// 3. التحقق من رتبة الأدمن فقط
function verifyTokenAndAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        } else {
            res.status(403).json({ message: "هذا الإجراء متاح فقط للمدراء (Admin)" });
        }
    });
}

// تصدير جميع الدوال بشكل صحيح
module.exports = { 
    verifyToken, 
    verifyTokenAndAuthorize, 
    verifyTokenAndAdmin 
};