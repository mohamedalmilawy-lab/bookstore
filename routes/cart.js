const express = require('express');
const router = express.Router();
const { User } = require("../models/User");
const {Order , validateDeliveryInfo} = require("../models/Order");

//
router.get('/', async (req, res) => {
    try {
        if (!res.locals.user) return res.redirect('/auth/login');

        const user = await User.findById(res.locals.user.id).populate('cart.bookId');

        const validCartItems = user.cart.filter(item => item.bookId);

        let totalPrice = 0;
        validCartItems.forEach(item => {
            totalPrice += item.bookId.price * item.quantity;
        });

        res.render("cart/cart", { cart: validCartItems,totalPrice,query: req.query });

    } catch (error) {
        console.error(error);
        res.status(500).send("خطأ بالسلة");
    }
});

router.post('/add/:bookId', async (req, res) => {
    try {
        if (!res.locals.user) return res.redirect('/auth/login');

        const user = await User.findById(res.locals.user.id);
        const bookId = req.params.bookId;
        const qty = parseInt(req.body.quantity) || 1;

        const item = user.cart.find(i => i.bookId.toString() === bookId);

        if (item) {
            item.quantity += qty;
        } else {
            user.cart.push({ bookId, quantity: qty });
        }

        await user.save();
        res.redirect('/cart?success=' + encodeURIComponent('تم إضافة الكتاب إلى السلة بنجاح'));

    } catch (error) {
        res.status(500).send("خطأ بالإضافة للسلة");
    }
});

router.post('/remove/:bookId', async (req, res) => {
    try {
        if (!res.locals.user) return res.redirect('/auth/login');

        await User.findByIdAndUpdate(res.locals.user.id, {
            $pull: { cart: { bookId: req.params.bookId } }
        });

        res.redirect('/cart?success=' + encodeURIComponent('تم إزالة الكتاب من السلة بنجاح'));

    } catch (error) {
        res.status(500).send("خطأ بالحذف");
    }
});
router.post('/removeOne/:bookId', async (req, res) => {
    try {
        if (!res.locals.user) return res.redirect('/auth/login');

        const user = await User.findById(res.locals.user.id);
        const bookId = req.params.bookId;

        // البحث عن الكتاب داخل السلة
        const itemIndex = user.cart.findIndex(item => item.bookId.toString() === bookId);

        if (itemIndex > -1) {
            // إذا كانت الكمية أكبر من 1، نقص واحد فقط
            if (user.cart[itemIndex].quantity > 1) {
                user.cart[itemIndex].quantity -= 1;
            } else {
                // إذا كانت الكمية 1، احذف العنصر تماماً من المصفوفة
                user.cart.splice(itemIndex, 1);
            }
            
            await user.save();
            res.redirect('/cart?success=' + encodeURIComponent('تم تحديث الكمية بنجاح'));
        } else {
            res.redirect('/cart');
        }

    } catch (error) {
        console.error(error);
        res.status(500).send("خطأ في تحديث الكمية");
    }
});

router.get('/checkout', async (req, res) => {
    try {
        if (!res.locals.user) return res.redirect('/auth/login');

        const user = await User.findById(res.locals.user.id).populate('cart.bookId');

        if (!user.cart.length) return res.redirect('/cart');

        let totalPrice = 0;
        user.cart.forEach(item => {
            if (item.bookId)
                totalPrice += item.bookId.price * item.quantity;
        });

        res.render("cart/checkout", {
            cart: user.cart,
            totalPrice,
            error: null
        });

    } catch (error) {
        res.status(500).send("خطأ checkout");
    }
});

// 5. تنفيذ عملية الشراء وحفظ الطلبية
router.post('/place', async (req, res) => {
    try {
        if (!res.locals.user) 
            return res.redirect('/auth/login');

        const user = await User.findById(res.locals.user.id).populate('cart.bookId');

        if (!user.cart.length) 
            return res.redirect('/cart');

        let totalPrice = 0;
        user.cart.forEach(item => {
            if (item.bookId)
                totalPrice += item.bookId.price * item.quantity;
        });

        const { error } = validateDeliveryInfo(req.body);
        if (error) 
            return res.render("cart/checkout", {cart: user.cart,totalPrice,error: error.details[0].message});

        // إنشاء طلب جديد 
        const order = new Order({
            userId: user._id,
            books: user.cart.map(item => ({
                bookId: item.bookId._id,
                quantity: item.quantity
            })),
            address: req.body.address,
            phone: req.body.phone,
            notes: req.body.notes,
            totalPrice: totalPrice
        });

        await order.save();

        // تفريغ السلة بعد الطلب
        user.cart = [];
        await user.save();

        res.render("cart/success");

    } catch (error) {
        console.error(error);
        res.status(500).send("خطأ تنفيذ الطلب");
    }
});

module.exports = router;