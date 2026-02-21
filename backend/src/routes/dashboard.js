// src/routes/dashboard.js
const express = require('express');
const router = express.Router();

const {
  getDashboardMetrics,
  getActiveTrips,
  createQuickTrip, 
  createQuickVehicle
} = require('../controllers/dashboardController');

const { authenticate } = require('../middleware/auth');

// All dashboard routes require login
router.use(authenticate);

router.get('/metrics', getDashboardMetrics);
router.get('/active-trips', getActiveTrips);
router.post('/new-vehicle', authenticate, createQuickVehicle);
router.post('/new-trip', authenticate, createQuickTrip);

module.exports = router;