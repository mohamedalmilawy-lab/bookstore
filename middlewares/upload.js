const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../images")); 
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        cb(null, true);
    } else {
        cb(new Error("Not an image! Please upload an image."), false);
    }
};
const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
});

module.exports = upload;