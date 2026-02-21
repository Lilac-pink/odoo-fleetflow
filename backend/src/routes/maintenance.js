// src/routes/maintenance.js
const express = require('express');
const router = express.Router();

const {
  getAllMaintenanceLogs,
  getMaintenanceLogById,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
} = require('../controllers/maintenanceController');

const { authenticate, authorize } = require('../middleware/auth');

// Protect all maintenance routes
router.use(authenticate);

// List logs (filters: ?vehicleId=5&status=NEW)
router.get('/', getAllMaintenanceLogs);

// Get single log
router.get('/:id', getMaintenanceLogById);

// Create new log (DISPATCHER / ADMIN)
router.post('/', authorize('DISPATCHER', 'ADMIN'), createMaintenanceLog);

// Update log (e.g. mark completed → reset vehicle status)
router.put('/:id', authorize('DISPATCHER', 'ADMIN'), updateMaintenanceLog);

// Delete log (ADMIN only, optional)
router.delete('/:id', authorize('ADMIN'), deleteMaintenanceLog);

module.exports = router;