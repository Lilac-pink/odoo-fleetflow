// src/routes/drivers.js
const express = require('express');
const router = express.Router();

const {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
} = require('../controllers/driverController');

const { authenticate, authorize } = require('../middleware/auth');

// Protect all driver routes
router.use(authenticate);

// List drivers (filters: ?dutyStatus=ON_DUTY&licenseExpiryBefore=2026-01-01)
router.get('/', getAllDrivers);

// Get single driver profile
router.get('/:id', getDriverById);

// Create new driver (DISPATCHER / ADMIN)
router.post('/', authorize('DISPATCHER', 'ADMIN'), createDriver);

// Update driver (safety score, duty status, license, etc.)
router.put('/:id', authorize('DISPATCHER', 'ADMIN'), updateDriver);

// Delete driver (ADMIN only, rare)
router.delete('/:id', authorize('ADMIN'), deleteDriver);

module.exports = router;