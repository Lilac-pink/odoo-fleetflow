// src/routes/resources.js  (recommended – separate for clarity)
const express = require('express');
const router = express.Router();

const {
  getAvailableVehicles,
  getAvailableDrivers,
} = require('../controllers/resourcesController');

const { authenticate } = require('../middleware/auth');

// All authenticated users can see available resources for trip creation
router.use(authenticate);

router.get('/available-vehicles', getAvailableVehicles);
router.get('/available-drivers', getAvailableDrivers);

module.exports = router;