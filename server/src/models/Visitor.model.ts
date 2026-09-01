import mongoose, { Schema } from 'mongoose';
import { ID_PROOF_TYPES } from '../utils/constants';
import { IVisitor } from '../types';

const visitorSchema = new Schema<IVisitor>(
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
  { timestamps: true, strict: true },
);

visitorSchema.pre('save', function (next) {
  if (this.isModified('phone') && this.phone) {
    this.phone = this.phone.replace(/\D/g, ''); // strip non-digits
  }
  next();
});

visitorSchema.index({
  name: 'text',
  email: 'text',
  company: 'text',
  phone: 'text',
});

const Visitor = mongoose.model<IVisitor>('Visitor', visitorSchema);
export default Visitor;
