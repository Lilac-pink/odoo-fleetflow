// src/controllers/resourcesController.js
const prisma = require('../prismaClient');

const getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'AVAILABLE',                // only idle/ready vehicles
        // Optional: exclude ones with pending maintenance or other logic
        // maintenanceLogs: { none: { status: { in: ['NEW', 'IN_PROGRESS'] } } },
      },
      select: {
        id: true,
        licensePlate: true,
        model: true,
        type: true,
        maxCapacityKg: true,
        requiredLicenseCategory: true,
        currentOdometer: true,
      },
      orderBy: { licensePlate: 'asc' },
    });

    res.json(vehicles);
  } catch (err) {
    console.error('Available vehicles error:', err);
    res.status(500).json({ error: 'Failed to fetch available vehicles' });
  }
};

const getAvailableDrivers = async (req, res) => {
  try {
    const today = new Date();

    const drivers = await prisma.driver.findMany({
      where: {
        dutyStatus: 'ON_DUTY',                    // must be on duty
        licenseExpiry: { gt: today },             // license not expired
        // Optional: exclude drivers already on a trip
        trips: {
          none: {
            status: { in: ['DRAFT', 'DISPATCHED'] },
          },
        },
      },
      select: {
        id: true,
        name: true,
        licenseNumber: true,
        licenseCategory: true,
        safetyScore: true,
        completionRate: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(drivers);
  } catch (err) {
    console.error('Available drivers error:', err);
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
};

module.exports = {
  getAvailableVehicles,
  getAvailableDrivers,
};