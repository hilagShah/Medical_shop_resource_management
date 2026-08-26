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
    hsnCode: {
      type: String,
      default: '',
    },
    gstRate: {
      type: Number,
      default: 5,
    },
    taxableValue: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
    },
  },
  { _id: true }
);

const taxSummarySlabSchema = new mongoose.Schema(
  {
    slab: { type: Number, required: true },
    gstBase: { type: Number, required: true },
    sgst: { type: Number, required: true },
    cgst: { type: Number, required: true },
    igst: { type: Number, default: 0 },
    totalTax: { type: Number, required: true },
  },
  { _id: false }
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
    totalTaxableValue: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      default: 0,
    },
    totalSgst: {
      type: Number,
      default: 0,
    },
    totalCgst: {
      type: Number,
      default: 0,
    },
    taxSummary: [taxSummarySlabSchema],
    roundOff: {
      type: Number,
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
