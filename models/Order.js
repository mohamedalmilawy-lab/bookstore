const mongoose = require('mongoose');
const joi = require("joi");

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    books: [{
        bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
        quantity: { type: Number, required: true, default: 1 }
    }],
    address: { type: String, required: true },
    phone: { type: String, required: true },
    notes: { type: String },
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "قيد المعالجة", enum: ["قيد المعالجة", "تم التسليم", "ملغي"] }
}, { timestamps: true }); 
const Order = mongoose.model("Order", orderSchema);

// تابع التحقق من بيانات التوصيل
function validateDeliveryInfo(data) {
    const schema = joi.object({
        address: joi.string().trim().min(5).required().messages({
            "string.empty": "العنوان مطلوب لشحن الكتب"
        }),
        phone: joi.string().trim().min(8).required().messages({
            "string.empty": "رقم الهاتف مطلوب للتواصل"
        }),
        notes: joi.string().allow('', null)
    });
    return schema.validate(data);
}

module.exports = { Order, validateDeliveryInfo };