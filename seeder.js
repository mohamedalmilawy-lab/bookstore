const {Book} = require("./models/Book");
const {books} = require("./data");
const connectDB = require("./config/db");
require("dotenv").config();


//connect to database
connectDB();

//seed the database with books
async function seedBooks(){
    try {
        await Book.deleteMany({});
        await Book.insertMany(books);
        console.log("Books seeded successfully");
        process.exit();
    } catch (error) {
        console.error("Error seeding books:", error);
        process.exit(1);
    }
}

seedBooks();    