const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");

const { Author, validateCreateAuthor, validateUpdateAuthor } = require("../models/Author");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

/* =========================================================
   🌍 PUBLIC ROUTES
========================================================= */

/**
 * 🔹 عرض كل المؤلفين
 */
router.get("/", asyncHandler(async (req, res) => {
    const authors = await Author.find();
    res.render("authors/index", { authors });
}));

/**
 * 🔹 عرض مؤلف واحد
 */
router.get("/:id", asyncHandler(async (req, res) => {
    const author = await Author.findById(req.params.id);

    if (!author) {
        return res.render("404");
    }

    res.render("authors/show", { author });
}));

/* =========================================================
   🧑‍💼 ADMIN ROUTES
========================================================= */

/**
 * 🔹 لوحة تحكم المؤلفين
 */
router.get("/admin/list", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const authors = await Author.find();
    res.render("admin/authors/index", { authors });
}));

/**
 * 🔹 صفحة إنشاء مؤلف
 */
router.get("/admin/create", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    res.render("admin/authors/create");
}));

/**
 * 🔹 إنشاء مؤلف
 */
router.post("/admin/create", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const { error } = validateCreateAuthor(req.body);

    if (error) {
        return res.render("admin/authors/create", {
            error: error.details[0].message
        });
    }

    await Author.create(req.body);

    res.redirect("/authors/admin/list");
}));

/**
 * 🔹 صفحة تعديل مؤلف
 */
router.get("/admin/edit/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const author = await Author.findById(req.params.id);

    if (!author) return res.redirect("/authors/admin/list");

    res.render("admin/authors/edit", { author });
}));

/**
 * 🔹 تعديل مؤلف
 */
router.post("/admin/edit/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {

    const { error } = validateUpdateAuthor(req.body);

    if (error) {
        return res.render("admin/authors/edit", {
            error: error.details[0].message,
            author: req.body
        });
    }

    await Author.findByIdAndUpdate(req.params.id, req.body);

    res.redirect("/authors/admin/list");
}));

/**
 * 🔹 حذف مؤلف
 */
router.post("/admin/delete/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    await Author.findByIdAndDelete(req.params.id);
    res.redirect("/authors/admin/list");
}));

module.exports = router;