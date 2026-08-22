const mongoose = require('mongoose');
const { ID_PROOF_TYPES } = require('../utils/constants');

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: { type: String },
    idProofType: {
      type: String,
      enum: Object.values(ID_PROOF_TYPES),
    },
    idProofNumber: { type: String },
    company: { type: String },
    photoUrl: { type: String },
  },
  { timestamps: true, strict: true }
);

visitorSchema.pre('save', function (next) {
  if (this.isModified('phone') && this.phone) {
    this.phone = this.phone.replace(/\D/g, ''); // strip non-digits
  }
  next();
});

visitorSchema.index({ name: 'text', email: 'text', company: 'text', phone: 'text' });

module.exports = mongoose.model('Visitor', visitorSchema);
