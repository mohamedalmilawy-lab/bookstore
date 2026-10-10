const express = require('express');
const router = express.Router();
const {verifyTokenAndAdmin} = require('../middlewares/verifyToken');
const asyncHandler = require("express-async-handler");
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: 'public/images/' });

const { Order } = require('../models/Order'); 
const { Book,validateCreatBook,validateUpdateBook } = require('../models/Book');
const { User,validateUpdateUser } = require('../models/User');
const { Author,validateCreateAuthor,validateUpdateAuthor } = require('../models/Author');

router.use(verifyTokenAndAdmin);

// احصائية لوحة التحكم
router.get('/dashboard', verifyTokenAndAdmin, async (req, res) => {
    try {
        // جلب الأعداد من الداتابيز
        const booksCount = await Book.countDocuments();
        const authorsCount = await Author.countDocuments();
        const usersCount = await User.countDocuments();
        const ordersCount = await Order.countDocuments();

        res.render('admin/dashboard', {
            booksCount,  
            authorsCount, 
            usersCount,   
            ordersCount, 
            path: '/admin/dashboard'
        });
    } catch (error) {
        res.render('error', { message: "فشل في تحميل لوحة التحكم" });
    }
});
//---------------------------------------------------------------------------
// عرض كل المستخدمين
router.get("/users", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    
    res.render("admin/users/users", { 
        users: users,
        user: req.user ,
        query: req.query
    });
}));

// حذف المستخدمين
router.post("/users/delete/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    // لاحظ كيف نضع الرسالة بعد علامة الاستفهام في الرابط
    res.redirect("/admin/users?success=" + encodeURIComponent("تم حذف المستخدم بنجاح")); 
}));

// تحديث المستخدمين
router.post("/users/update/:id", verifyTokenAndAdmin, asyncHandler(async (req, res) => {
    const { username, email, isAdmin } = req.body;
    const isAdminBool = isAdmin === "true"; // تحويل القيمة إلى Boolean بوضوح

    // 1. التحقق من صحة البيانات أولاً (Validation)
    const { error } = validateUpdateUser({ 
        username, 
        email, 
        isAdmin: isAdminBool 
    });

    if (error) {
        // إذا وجد خطأ، توقف هنا وعد إلى الصفحة مع رسالة الخطأ
        return res.redirect("/admin/users?errorU=" + encodeURIComponent(error.details[0].message));
    }

    // 2. تحديث البيانات في قاعدة البيانات فقط إذا كانت البيانات سليمة
    const updatedUser = await User.findByIdAndUpdate(
        req.params.id, 
        { $set: { username, email, isAdmin: isAdminBool } },
        { new: true }
    );

    // 3. التأكد أن المستخدم موجود فعلاً قبل النجاح
    if (!updatedUser) {
        return res.redirect("/admin/users?errorU=" + encodeURIComponent("المستخدم غير موجود"));
    }
    
    // 4. إعادة التوجيه مع رسالة النجاح
    res.redirect("/admin/users?success=" + encodeURIComponent("تم تحديث البيانات بنجاح"));
}));
//---------------------------------------------------------------------------

// راوتر لوحة التحكم - إدارة الكتب
// عرض جميع الكتب
router.get('/books', verifyTokenAndAdmin, async (req, res) => {
    try {
        let { search, category, author, minPrice, maxPrice, pageNumber = 1 } = req.query;
        
        pageNumber = parseInt(pageNumber) || 1;
        const pageSize = 15; 
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

        const books = await Book.find(filter)
            .populate("author", "firstName lastName")
            .sort({ createdAt: -1 }) 
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        const categories = await Book.distinct("category");
        const authors= await Author.find();
        
        res.render('admin/books/books', { 
            books, 
            authors,
            categories, 
            query: req.query, 
            currentPage: pageNumber, 
            pages: pages 
        });

    } catch (error) {
        console.error("Admin Books Error:", error); 
        res.status(500).send("خطأ في جلب بيانات لوحة التحكم: " + error.message);
    }
});

// اضافة كتاب جديد
router.post('/books/add', verifyTokenAndAdmin, upload.single('cover'), async (req, res) => {
    try {
        const { title, author, category, price, description } = req.body;
        
        if (!req.file) {
            return res.redirect(`/admin/books?errorC=${encodeURIComponent("يرجى رفع غلاف للكتاب")}`);
        }

        const { error } = validateCreatBook({ 
            title, author, category, price, description, cover: req.file.filename 
        });

        if (error) {
            return res.redirect(`/admin/books?errorC=${encodeURIComponent(error.details[0].message)}`);
        }

        const newBook = new Book({
            title, author, category, price, description,
            cover: req.file.filename 
        });

        await newBook.save();
        res.redirect('/admin/books?success=' + encodeURIComponent("تم إضافة الكتاب بنجاح")); 
    } catch (error) {
        res.redirect('/admin/books?errorC=' + encodeURIComponent("خطأ أثناء إضافة الكتاب"));
    }
});

// تحديث الكتاب
router.post('/books/update/:id', verifyTokenAndAdmin, upload.single('cover'), async (req, res) => {
    try {
        const { title, category, price, description, author } = req.body;
        const book = await Book.findById(req.params.id);
        if (!book) return res.redirect('/admin/books?errorU=' + encodeURIComponent("الكتاب غير موجود"));

        const updateData = { 
            title, author, category, price, description, 
            cover: req.file ? req.file.filename : book.cover 
        };

        const { error } = validateUpdateBook(updateData);
        if (error) {
            return res.redirect(`/admin/books?errorU=${encodeURIComponent(error.details[0].message)}`);
        }

        await Book.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
        res.redirect('/admin/books?success=' + encodeURIComponent("تم تحديث بيانات الكتاب بنجاح"));
    } catch (error) {
        res.redirect('/admin/books?errorU=' + encodeURIComponent("خطأ أثناء التحديث"));
    }
});

// حذف الكتاب
router.post('/books/delete/:id', verifyTokenAndAdmin, async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.redirect('/admin/books?errorU=' + encodeURIComponent("الكتاب غير موجود"));

        await Book.findByIdAndDelete(req.params.id);        
        res.redirect('/admin/books?success=' + encodeURIComponent("تم حذف الكتاب بنجاح"));
    } catch (error) {
        res.redirect('/admin/books?errorU=' + encodeURIComponent("خطأ أثناء الحذف"));
    }
});
//---------------------------------------------------------------------------
//لوحة تحكم المؤلفين
// عرض جميع المؤلفين مع البحث 
router.get('/authors',verifyTokenAndAdmin, async (req, res) => {
    try {
        const query = req.query;
        let filter = {};
        
        if (query.search) {
            filter = { 
                $or: [
                    { firstName: { $regex: query.search, $options: 'i' } },
                    { lastName: { $regex: query.search, $options: 'i' } }
                ]
            };
        }
        
        const authors = await Author.find(filter).populate('booksCount').sort({ createdAt: -1 });

        res.render('admin/authors/authors', { authors, query});
    } catch (err) {
        res.redirect('/admin/authors?error=' + encodeURIComponent('حدث خطأ أثناء جلب البيانات'));
    }
});
// إضافة مؤلف جديد
router.post('/authors/add',verifyTokenAndAdmin,async (req, res) => {
    try {
        const { firstName , lastName, nationality } = req.body;
        const { error } = validateCreateAuthor({ firstName, lastName, nationality});
        if(error)
            return res.redirect(`/admin/authors?errorC=${encodeURIComponent(error.details[0].message)}`);
        const newAuthor = new Author({ firstName, lastName, nationality});
        await newAuthor.save();
        res.redirect('/admin/authors?success=' + encodeURIComponent("تم إضافة المؤلف بنجاح"));
    }catch (error) {
        res.redirect('/admin/authors?errorC=' + encodeURIComponent("خطأ أثناء إضافة المؤلف"));
    }
});
// تحديث بيانات المؤلف
router.post('/authors/update/:id', verifyTokenAndAdmin, async (req, res) => {
    try {
        const { firstName , lastName, nationality } = req.body;
        const {error} = validateUpdateAuthor({ firstName, lastName, nationality});
        if(error)
            return res.redirect(`/admin/authors?errorU=${encodeURIComponent(error.details[0].message)}`);
        const author = await Author.findById(req.params.id);
        if (!author) return res.redirect('/admin/authors?errorU=' + encodeURIComponent("المؤلف غير موجود"));

        await Author.findByIdAndUpdate(req.params.id, { $set: { firstName, lastName, nationality } }, { new: true });
        res.redirect('/admin/authors?success=' + encodeURIComponent("تم تحديث بيانات المؤلف بنجاح"));
    } catch (error) {
        res.redirect('/admin/authors?errorU=' + encodeURIComponent("خطأ أثناء التحديث"));
    }
});

// حذف المؤلف
router.post('/authors/delete/:id', verifyTokenAndAdmin, async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) return res.redirect('/admin/authors?errorU=' + encodeURIComponent("المؤلف غير موجود"));

        await Author.findByIdAndDelete(req.params.id);        
        res.redirect('/admin/authors?success=' + encodeURIComponent("تم حذف الكتاب بنجاح"));
    } catch (error) {
        res.redirect('/admin/authors?errorU=' + encodeURIComponent("خطأ أثناء الحذف"));
    }
});
//---------------------------------------------------------------------------

//لوحة تحكم الطلبات
// 1. عرض جميع الطلبات مع جلب بيانات المستخدم والكتب
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'username email') // جلب اسم وايميل المستخدم
            .populate('books.bookId', 'title price') // جلب عنوان وسعر الكتاب
            .sort({ createdAt: -1 });

        res.render('admin/orders/orders', { orders,query: req.query });
    } catch (error) {
        res.redirect('/admin/orders?error=' + encodeURIComponent("خطأ في جلب بيانات الطلبات"));
    }
});

// 2. تحديث حالة الطلب
router.post('/orders/update-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await Order.findByIdAndUpdate(req.params.id, { status });
        res.redirect('/admin/orders?success=' + encodeURIComponent("تم تحديث حالة الطلب"));
    } catch (error) {
        res.redirect('/admin/orders?error=' + encodeURIComponent("فشل تحديث الحالة"));
    }
});

// 3. حذف طلب
router.post('/orders/delete/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.redirect('/admin/orders?success=' + encodeURIComponent("تم حذف الطلب بنجاح"));
    } catch (error) {
        res.redirect('/admin/orders?error=' + encodeURIComponent("خطأ أثناء الحذف"));
    }
});

module.exports = router;