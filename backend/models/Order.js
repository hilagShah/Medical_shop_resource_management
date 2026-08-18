const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    itemDiscount: {
      type: {
        type: String,
        enum: ['flat', 'percent'],
        default: 'flat',
      },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    subtotalBeforeDiscount: {
      type: Number,
      required: true,
    },
    subtotalAfterDiscount: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    shopkeeperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerDetails: {
      name: { type: String, default: 'Walk-in Customer' },
      phone: { type: String, default: '' },
      doctorName: { type: String, default: '' },
    },
    items: [orderItemSchema],
    grossTotalBeforeDiscount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalItemDiscount: {
      type: Number,
      required: true,
      default: 0,
    },
    orderDiscount: {
      type: {
        type: String,
        enum: ['flat', 'percent'],
        default: 'flat',
      },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    totalCumulativeDiscount: {
      type: Number,
      required: true,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card'],
      default: 'Cash',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
