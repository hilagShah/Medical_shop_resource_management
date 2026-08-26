const mongoose = require('mongoose');

const medicineMasterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      unique: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Text & prefix indexing for fast search
medicineMasterSchema.index({ name: 'text' });

const MedicineMaster = mongoose.model('MedicineMaster', medicineMasterSchema);
module.exports = MedicineMaster;
