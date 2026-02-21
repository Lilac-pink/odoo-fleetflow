// src/controllers/driverController.js
const prisma = require('../prismaClient');
const { addDays } = require('date-fns'); // optional: npm install date-fns (for expiry checks)

const getAllDrivers = async (req, res) => {
  try {
    const { dutyStatus, licenseExpiryBefore, minSafetyScore, search } = req.query;

    const where = {};

    if (dutyStatus) where.dutyStatus = dutyStatus;
    if (licenseExpiryBefore) {
      where.licenseExpiry = { lte: new Date(licenseExpiryBefore) };
    }
    if (minSafetyScore) {
      where.safetyScore = { lte: Number(minSafetyScore) };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        user: { select: { email: true, role: true } }, // if linked
        _count: { select: { trips: true } },
        trips: {
          select: { id: true, status: true },
          where: { status: { in: ['DISPATCHED', 'DRAFT'] } }, // active trips count
        },
      },
    });

    // Optional: add computed "isLicenseExpired" flag
    const today = new Date();
    const enhanced = drivers.map(driver => ({
      ...driver,
      isLicenseExpired: driver.licenseExpiry < today,
      activeTripsCount: driver.trips.length,
    }));

    res.json(enhanced);
  } catch (err) {
    console.error('Get drivers error:', err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
        _count: { select: { trips: true } },
        trips: {
          include: {
            vehicle: { select: { licensePlate: true } },
          },
        },
      },
    });

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const today = new Date();
    const enhanced = {
      ...driver,
      isLicenseExpired: driver.licenseExpiry < today,
      activeTripsCount: driver.trips.filter(t => ['DRAFT', 'DISPATCHED'].includes(t.status)).length,
    };

    res.json(enhanced);
  } catch (err) {
    console.error('Get driver error:', err);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
};

const createDriver = async (req, res) => {
  try {
    const {
      name,
      licenseNumber,
      licenseExpiry,
      licenseCategory,
      safetyScore = 100,
      completionRate = 0,
      complaints = 0,
      dutyStatus = 'ON_DUTY',
      userId, // optional link to user account
    } = req.body;

    if (!name || !licenseNumber || !licenseExpiry) {
      return res.status(400).json({ error: 'name, licenseNumber, licenseExpiry required' });
    }

    // Check unique license number
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber },
    });
    if (existing) return res.status(409).json({ error: 'License number already exists' });

    const driver = await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        licenseExpiry: new Date(licenseExpiry),
        licenseCategory,
        safetyScore: Number(safetyScore),
        completionRate: Number(completionRate),
        complaints: Number(complaints),
        dutyStatus,
        userId: userId ? Number(userId) : null,
      },
    });

    res.status(201).json(driver);
  } catch (err) {
    console.error('Create driver error:', err);
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Convert numbers
    if (data.safetyScore) data.safetyScore = Number(data.safetyScore);
    if (data.completionRate) data.completionRate = Number(data.completionRate);
    if (data.complaints) data.complaints = Number(data.complaints);
    if (data.licenseExpiry) data.licenseExpiry = new Date(data.licenseExpiry);

    const driver = await prisma.driver.update({
      where: { id: Number(id) },
      data,
    });

    // Optional: auto-suspend if license expired
    const today = new Date();
    if (driver.licenseExpiry < today && driver.dutyStatus !== 'SUSPENDED') {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { dutyStatus: 'SUSPENDED' },
      });
      // Optional emit: req.io.emit('driverSuspended', { id: driver.id });
    }

    res.json(driver);
  } catch (err) {
    console.error('Update driver error:', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Driver not found' });
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await prisma.driver.findUnique({
      where: { id: Number(id) },
      include: {
        trips: {
          where: { status: { in: ['DRAFT', 'DISPATCHED'] } },
        },
      },
    });

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    if (driver.trips.length > 0) {
      return res.status(400).json({ error: 'Cannot delete driver with active trips' });
    }

    await prisma.driver.delete({ where: { id: Number(id) } });

    res.status(204).send();
  } catch (err) {
    console.error('Delete driver error:', err);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
};