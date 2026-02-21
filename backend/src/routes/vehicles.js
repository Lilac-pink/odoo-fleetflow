// src/routes/vehicles.js
const express = require('express');
const router = express.Router();

const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} = require('../controllers/vehicleController');

const { authenticate, authorize } = require('../middleware/auth');

// Protect all vehicle routes
router.use(authenticate);

// List vehicles (with optional query filters: ?status=AVAILABLE&type=Truck&search=abc)
router.get('/', getAllVehicles);

// Get single vehicle
router.get('/:id', getVehicleById);

// Create new vehicle (ADMIN / DISPATCHER only)
router.post('/', authorize('ADMIN', 'DISPATCHER'), createVehicle);

// Update vehicle (ADMIN / DISPATCHER only)
router.put('/:id', authorize('ADMIN', 'DISPATCHER'), updateVehicle);

// Delete vehicle (ADMIN only)
router.delete('/:id', authorize('ADMIN'), deleteVehicle);

module.exports = router;