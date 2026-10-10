const express = require("express");
const path = require("path");
const logger = require("./middlewares/logger");
const {notFound, errorHandler} = require("./middlewares/errors");
const setUsers = require("./middlewares/setUsers");
require("dotenv").config();
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken"); 
const methodOverride = require('method-override');
//Connection To Database
const connectDB = require("./config/db");
connectDB();

const app = express();

// Static Files
app.use("/images", express.static(path.join(__dirname, "images")));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

//Middlewares
app.use(express.json());
app.use(cookieParser()); 
app.use(express.urlencoded({extended: false}));
app.use(methodOverride('_method'));
app.use(logger);
app.use(helmet({
    contentSecurityPolicy: false, 
}));
app.use(cors());
app.use(express.static('public'));
//Set View Engine
app.set("view engine", "ejs");
//to make the views accessible to the Users
app.use(setUsers);
//Routes
app.use("/", require("./routes/home"));
app.use("/books", require("./routes/book"));
app.use("/authors", require("./routes/authors"));
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/cart", require("./routes/cart"));
app.use("/admin", require("./routes/admin"));
app.use("/chat", require("./routes/chat"));
app.use("/favorites", require("./routes/favorite"));


//Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

//Start The Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});