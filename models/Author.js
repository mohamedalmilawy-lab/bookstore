const mongoose = require('mongoose');
const joi = require("joi");

const AuthorSchema = new mongoose.Schema({
    firstName: {type: String, required: true , trim: true, minlength: 2, maxlength: 100},
    lastName: {type: String, required: true , trim: true, minlength: 2, maxlength: 100},
    nationality: {type: String, required: true , trim: true, minlength: 2, maxlength: 100},
},{timestamps: true}
);  

AuthorSchema.virtual('booksCount', {
    ref: 'Book',         
    localField: '_id',  
    foreignField: 'author',
    count: true       
});

AuthorSchema.set('toJSON', { virtuals: true });
AuthorSchema.set('toObject', { virtuals: true });

const Author = mongoose.model("Author",AuthorSchema);

//validate
//validate create author using joi
function validateCreateAuthor(author){
    const schema = joi.object({
        firstName: joi.string().trim().min(2).max(100).required(),
        lastName: joi.string().trim().min(2).max(100).required(),
        nationality: joi.string().trim().min(2).max(100).required(),
    });
    return schema.validate(author);
}

//validate Update author using joi
function validateUpdateAuthor(author){
    const schema = joi.object({
        firstName: joi.string().trim().min(2).max(100),
        lastName: joi.string().trim().min(2).max(100),
        nationality: joi.string().trim().min(2).max(100),
    });
    return schema.validate(author);
}

module.exports = {Author ,validateCreateAuthor,validateUpdateAuthor};