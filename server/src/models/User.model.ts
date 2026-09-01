import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../utils/constants';
import { IUser, IUserMethods, UserModel } from '../types';

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true },
    employeeRef: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: function (this: IUser) {
        return this.role === ROLES.EMPLOYEE;
      },
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, strict: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (
  this: IUser,
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser, UserModel>('User', userSchema);
export default User;
