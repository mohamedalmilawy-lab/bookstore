const mongoose = require('mongoose');
const joi = require("joi");

const booksSchema = new mongoose.Schema({
    cover: { type: String, required: true},
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Author" },
    description: { type: String, required: true, trim: true, minlength: 3 },
    price: { type: Number, required: true, min: 0 },
    category: {type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
}, { timestamps: true });

// Book model
const Book = mongoose.model("Book", booksSchema);

// validation
// validate create book using joi
function validateCreatBook(book) {
    const schema = joi.object({
        title: joi.string().trim().min(2).max(200).required(),
        author: joi.string().trim().required(),
        description: joi.string().trim().min(3).required(),
        price: joi.number().min(0).required(),
        cover: joi.string().required(),
        category: joi.string().trim().min(2).max(100).required(), 
    });
    return schema.validate(book);
}

// validate Update book using joi
function validateUpdateBook(book) {
    const schema = joi.object({
        title: joi.string().trim().min(2).max(200),
        author: joi.string().trim(),
        description: joi.string().trim().min(3),
        price: joi.number().min(0),
        cover: joi.string(),
        category: joi.string().trim().min(2).max(100)
    });
    return schema.validate(book);
}

module.exports = { Book, validateCreatBook, validateUpdateBook };