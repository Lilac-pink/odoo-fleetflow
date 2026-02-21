// src/routes/trips.js
const express = require('express');
const router = express.Router();

const {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  dispatchTrip,
  cancelTrip,
  completeTrip,
  deleteTrip,
} = require('../controllers/tripController');

const { authenticate, authorize } = require('../middleware/auth');

// Protect all trip routes
router.use(authenticate);

// List trips (with filters: ?status=DISPATCHED&vehicleId=5&driverId=3)
router.get('/', getAllTrips);

// Get single trip details
router.get('/:id', getTripById);

// Create new trip (DISPATCHER / ADMIN)
router.post('/', authorize('DISPATCHER', 'ADMIN'), createTrip);

// Update trip metadata (re-assign, etc.) — cannot change status here
router.put('/:id', authorize('DISPATCHER', 'ADMIN'), updateTrip);

// Dispatch trip → DISPATCHED + vehicle ON_TRIP + driver ON_DUTY
router.put('/:id/dispatch', authorize('DISPATCHER', 'ADMIN'), dispatchTrip);

// Cancel trip → CANCELLED, restores vehicle + driver if was DISPATCHED
router.put('/:id/cancel', authorize('DISPATCHER', 'ADMIN'), cancelTrip);

// Mark as completed + business logic (update odometer, statuses)
router.put('/:id/complete', authorize('DISPATCHER', 'ADMIN'), completeTrip);

// Delete / cancel trip (only DRAFT or CANCELLED allowed)
router.delete('/:id', authorize('DISPATCHER', 'ADMIN'), deleteTrip);

module.exports = router;