import { Router } from 'express';
import * as authRoutes from './auth.routes';
import visitorRequestRouter from './visitorRequest.routes';
import userRouter from './user.routes';
import employeeRouter from './employee.routes';
import dashboardRouter from './dashboard.routes';
import reportRouter from './report.routes';
import activityLogRouter from './activityLog.routes';

const router = Router();

// Health check route
router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'API is running' });
});

router.use('/auth', authRoutes.default ?? authRoutes);
router.use('/users', userRouter);
router.use('/employees', employeeRouter);
router.use('/visitor-requests', visitorRequestRouter);
router.use('/dashboard', dashboardRouter);
router.use('/reports', reportRouter);
router.use('/activity-logs', activityLogRouter);

export default router;
