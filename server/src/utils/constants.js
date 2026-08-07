const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  EMPLOYEE: 'employee',
};

const VISIT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
};

const ID_PROOF_TYPES = {
  AADHAR: 'aadhar',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  VOTER_ID: 'voter_id',
  OTHER: 'other',
};

const ACTIVITY_ACTIONS = {
  CREATED: 'created',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
};

const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

module.exports = {
  ROLES,
  VISIT_STATUS,
  ID_PROOF_TYPES,
  ACTIVITY_ACTIONS,
  EMPLOYEE_STATUS,
};
