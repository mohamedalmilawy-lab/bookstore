const express = require('express');
const router = express.Router();
const { Book } = require('../models/Book'); 
const { Author } = require('../models/Author');

router.post('/', async (req, res) => {
    try {
        const userMessage = req.body.message;

        const availableBooks = await Book.find({}).populate('author').limit(50);
        
        const allAuthors = await Author.find({});

        let catalogText = "بيانات المتجر المتاحة:\n";
        
        catalogText += "\n--- المؤلفون وكتبهم ---\n";
        allAuthors.forEach(author => {
            const authorBooks = availableBooks.filter(b => b.author && b.author._id.toString() === author._id.toString());
            const bookTitles = authorBooks.length > 0 ? authorBooks.map(b => b.title).join('، ') : "ليس له كتب حالياً";
            catalogText += `- المؤلف: ${author.firstName} ${author.lastName} (الجنسية: ${author.nationality}). كتبه المتوفرة: [${bookTitles}]\n`;
        });

        catalogText += "\n--- قائمة أسعار الكتب ---\n";
        availableBooks.forEach(book => {
            catalogText += `- كتاب "${book.title}" بسعر ${book.price}$ (المخزون: ${book.stock})\n`;
        });

        // 4. إضافة سياسات المتجر
        const shopPolicies = `
--- سياسات المتجر ---
- الشحن والدفع: نحن نوفر خدمة "الدفع عند الاستلام" (Cash on Delivery).
- إجراءات الطلب: يجب على المستخدم تزويدنا بالعنوان الكامل ورقم الهاتف لتأكيد الطلب.
- سياسة التوصيل: يتم التوصيل خلال 24 ساعة عمل بعد تأكيد معلومات الشحن.
`;

        const systemPrompt = `أنت مساعد ذكي في متجر "بيت الكتب" (مشروع تخرج). 
أجب بلباقة بناءً على البيانات التالية فقط:
${catalogText}
${shopPolicies}
تعليمات إضافية:
1. إذا سأل المستخدم عن مؤلف، اذكر له قائمة كتبه المتاحة عندنا.
2. إذا أراد الشراء، أخبره أن الدفع "ديليفري" (عند الاستلام) واطلب منه تزويدك بالعنوان ورقم الهاتف (بشكل نظري).
3. لا تقترح كتباً أو مؤلفين غير موجودين في القائمة أعلاه.`;

    // 6. الاتصال بـ OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.API_KEY}`, 
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "qwen/qwen-plus", 
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ]
        })
    });

    const data = await response.json();
    res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("تفاصيل الخطأ:", error);
        res.status(500).json({ error: 'حدث خطأ في الاتصال بالذكاء الصناعي.' });
    }
});

module.exports = router;