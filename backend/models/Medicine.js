const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General',
    },
    hsnCode: {
      type: String,
      default: '',
      trim: true,
    },
    gstRate: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: 0,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    supplier: {
      name: { type: String, default: '' },
      contact: { type: String, default: '' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;
