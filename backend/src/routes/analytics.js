// src/routes/analytics.js
const express = require('express');
const router = express.Router();

const {
  getAnalyticsMetrics,
  getFuelEfficiencyTrend,
  getVehicleRoi,
  getMonthlySummary,
  exportAnalyticsData,
  exportAnalyticsCsv
} = require('../controllers/analyticsController');

const { authenticate, authorize } = require('../middleware/auth');

// Protect all analytics routes
router.use(authenticate);

// Optional: restrict full analytics to specific roles
// router.use(authorize('FINANCIAL_ANALYST', 'ADMIN'));

router.get('/metrics', getAnalyticsMetrics);
router.get('/fuel-efficiency', getFuelEfficiencyTrend);
router.get('/vehicle-roi', getVehicleRoi);
router.get('/monthly-summary', getMonthlySummary);
router.get('/export', exportAnalyticsData);
router.get('/export-csv', authenticate, exportAnalyticsCsv);

module.exports = router;