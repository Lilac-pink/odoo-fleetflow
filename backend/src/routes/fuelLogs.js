// src/routes/fuelLogs.js
const express = require('express');
const router = express.Router();

const {
  getFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
} = require('../controllers/expenseController');

const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getFuelLogs);

router.post('/', authorize('DISPATCHER', 'ADMIN'), createFuelLog);

router.put('/:id', authorize('DISPATCHER', 'ADMIN'), updateFuelLog);

router.delete('/:id', authorize('ADMIN'), deleteFuelLog);

module.exports = router;