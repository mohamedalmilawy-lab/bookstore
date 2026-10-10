const router = require("express").Router();
const { User } = require("../models/User"); 
const { verifyToken } = require("../middlewares/verifyToken");


router.get('/', verifyToken, async (req, res) => {
    try {
        const userWithFavorites = await User.findById(req.user.id).populate({
            path: 'favorites',
            populate: {
                path: 'author', 
                model: 'Author'
            }
        });

        if (!userWithFavorites) {
            return res.status(404).send("المستخدم غير موجود");
        }

        res.render('favorites', {
            user: userWithFavorites,
            query: req.query, 
            path: '/favorites'
        });

    } catch (error) {
        console.error("Error fetching favorites:", error);
        res.status(500).send("حدث خطأ في الخادم أثناء جلب المفضلة");
    }
});

router.post('/remove/:bookId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; 
        const bookId = req.params.bookId;
        const user = await User.findById(userId);
        
        user.favorites.pull(bookId);
        await user.save(); // تم إصلاح خطأ المتغير غير المعرف
        
        res.redirect('/favorites?success=' + encodeURIComponent('تم حذف الكتاب من المفضلة بنجاح'));
    }
    catch(error){
        console.error("Error removing favorite:", error);
        res.status(500).send("حدث خطأ أثناء الحذف");
    }
});

router.post("/:bookId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; 
        const bookId = req.params.bookId;
        const user = await User.findById(userId);

        const isFavorite = user.favorites.includes(bookId);

        if (isFavorite) {
            user.favorites.pull(bookId);
            await user.save();
            res.redirect('/favorites?success=' + encodeURIComponent('تم حذف الكتاب من المفضلة بنجاح'));

        } else {
            user.favorites.push(bookId);
            await user.save();
            res.redirect('/favorites?success=' + encodeURIComponent('تم إضافة الكتاب إلى المفضلة بنجاح'));

        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "حدث خطأ في الخادم" });
    }
});

module.exports = router;