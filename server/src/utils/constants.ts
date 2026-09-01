export const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  EMPLOYEE: 'employee',
} as const;

export const VISIT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
} as const;

export const ID_PROOF_TYPES = {
  AADHAR: 'aadhar',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  VOTER_ID: 'voter_id',
  OTHER: 'other',
} as const;

export const ACTIVITY_ACTIONS = {
  CREATED: 'created',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
