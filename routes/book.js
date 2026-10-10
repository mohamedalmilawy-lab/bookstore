const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");

const { Book, validateCreatBook, validateUpdateBook } = require("../models/Book");
const { Author } = require("../models/Author");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");
const upload = require("../middlewares/upload");

/**
 * @desc Get all books (Public)
 */
router.get('/', async (req, res) => {
    try {
        let { search, minPrice, maxPrice, author, category, pageNumber = 1 } = req.query;
        
        pageNumber = parseInt(pageNumber) || 1;
        const pageSize = 9;
        let filter = {};

        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }

        if (category) filter.category = category;

        if (author) {
            filter.author = author; 
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        const count = await Book.countDocuments(filter);
        const pages = Math.ceil(count / pageSize);

        const books = await Book.find(filter).populate("author").skip((pageNumber - 1) * pageSize).limit(pageSize);
            
        const authors = await Author.find();
        const categories = await Book.distinct("category");

        res.render('books/books', { 
            books, 
            categories,
            query: req.query, 
            currentPage: pageNumber, 
            pages: pages ,
            authors
        });

    } catch (error) {
        console.error("Error details:", error); 
        res.status(500).send("خطأ في الخادم");
    }
});

/**
 * @desc Get single book (Public)
 */
router.get("/:id", asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id).populate("author");

    if (!book) {
        return res.render("404");
    }

    res.render("books/show", { book });
}));


/**
 * ===============================
 * 🧑‍💼 ADMIN ROUTES
 * ===============================
 */

/**
 * @desc Admin - list books
 */
router.get("/admin/books", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const books = await Book.find().populate("author");
    res.render("admin/books/index", { books });
}));

/**
 * @desc Admin - create form
 */
router.get("/admin/books/create", verifyTokenAndAdmin, (req, res) => {
    res.render("admin/books/create");
});

/**
 * @desc Admin - create book
 */
router.post("/admin/books", verifyTokenAndAdmin, upload.single("cover"), asyncHandler(async (req, res) => {

    if (req.file) {
        req.body.cover = req.file.filename;
    }

    const { error } = validateCreatBook(req.body);
    if (error) {
        return res.render("admin/books/create", {
            errorMessage: error.details[0].message
        });
    }

    await Book.create(req.body);

    res.redirect("/admin/books");
}));

/**
 * @desc Admin - edit form
 */
router.get("/admin/books/edit/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);

    if (!book) return res.redirect("/admin/books");

    res.render("admin/books/edit", { book });
}));

/**
 * @desc Admin - update book
 */
router.post("/admin/books/edit/:id", verifyTokenAndAdmin, upload.single("cover"), asyncHandler(async (req, res) => {

    if (req.file) {
        req.body.cover = req.file.filename;
    }

    const { error } = validateUpdateBook(req.body);
    if (error) {
        return res.render("admin/books/edit", {
            errorMessage: error.details[0].message,
            book: req.body
        });
    }

    await Book.findByIdAndUpdate(req.params.id, req.body);

    res.redirect("/admin/books");
}));

/**
 * @desc Admin - delete book
 */
router.post("/admin/books/delete/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    await Book.findByIdAndDelete(req.params.id);
    res.redirect("/admin/books");
}));

module.exports = router;