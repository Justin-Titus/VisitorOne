const express = require('express');
const authRoutes = require('./auth.routes');
const visitorRequestRoutes = require('./visitorRequest.routes');
const userRoutes = require('./user.routes');
const employeeRoutes = require('./employee.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const activityLogRoutes = require('./activityLog.routes');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/visitor-requests', visitorRequestRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/activity-logs', activityLogRoutes);

module.exports = router;
