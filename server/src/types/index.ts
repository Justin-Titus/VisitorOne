import { Document, Model, Types } from 'mongoose';

// ─── Role & Status Constants ───────────────────────────────────────────────────

export type Role = 'admin' | 'receptionist' | 'employee';
export type VisitStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';
export type IdProofType =
  | 'aadhar'
  | 'passport'
  | 'driving_license'
  | 'voter_id'
  | 'other';
export type ActivityAction =
  | 'created'
  | 'approved'
  | 'rejected'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';
export type EmployeeStatus = 'active' | 'inactive';

// ─── Environment Config ────────────────────────────────────────────────────────

export interface EnvConfig {
  port: string;
  nodeEnv: string;
  mongoUri: string;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  corsOrigin: string;
}

// ─── Mongoose Document Interfaces ──────────────────────────────────────────────

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: Role;
  employeeRef?: Types.ObjectId;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

export interface IEmployee {
  name: string;
  employeeCode: string;
  department: string;
  designation?: string;
  email: string;
  phone: string;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVisitor {
  name: string;
  phone: string;
  email?: string;
  idProofType?: IdProofType;
  idProofNumber?: string;
  company?: string;
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVisitRequest {
  visitor: Types.ObjectId;
  employeeToVisit: Types.ObjectId;
  purpose: string;
  visitDate: Date;
  visitDateString: string;
  expectedArrivalTime: string;
  status: VisitStatus;
  remarks?: string;
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  rejectedBy?: Types.ObjectId;
  decidedAt?: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog {
  visitRequest: Types.ObjectId;
  action: ActivityAction;
  performedBy: Types.ObjectId;
  remarks?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Express Request Augmentation ──────────────────────────────────────────────

export type AuthUser = Document<Types.ObjectId, Record<string, never>, IUser> &
  IUser &
  IUserMethods & { _id: Types.ObjectId };

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

// ─── Service / Controller Helpers ──────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BulkOperationResult {
  succeeded: Types.ObjectId[];
  failed: Array<{ id: string; reason: string }>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VisitorData {
  name: string;
  phone: string;
  email?: string;
  idProofType?: IdProofType;
  idProofNumber?: string;
  company?: string;
  photoUrl?: string;
}

export interface CreateVisitRequestPayload {
  visitorData: VisitorData;
  visitDate: string;
  expectedArrivalTime: string;
  employeeToVisit: string;
  purpose: string;
}

export interface NotificationEmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface NotificationSmsPayload {
  phone: string;
  message: string;
}

export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

export interface AnalyticsSummary {
  total: number;
  pending: number;
  approved: number;
  checkedIn: number;
  checkedOut: number;
  rejected: number;
  cancelled: number;
}
