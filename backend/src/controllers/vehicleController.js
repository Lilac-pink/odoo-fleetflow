// src/controllers/vehicleController.js
const prisma = require('../prismaClient');

const getAllVehicles = async (req, res) => {
  try {
    const { status, type, search } = req.query;

    const where = {};

    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        // Optional: include related data if needed in UI
        trips: { select: { id: true, status: true } },
        maintenanceLogs: { select: { id: true, status: true } },
      },
    });

    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
      include: {
        trips: true,
        maintenanceLogs: true,
        fuelLogs: true,
        expenses: true,
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
};

const createVehicle = async (req, res) => {
  try {
    const {
      name,
      model,
      licensePlate,
      type,
      maxCapacityKg,
      currentOdometer,
      acquisitionCost,
      requiredLicenseCategory,
      status = 'AVAILABLE',
      year,
    } = req.body;

    // Basic validation
    if (!licensePlate || !model || !type || !maxCapacityKg) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check unique license plate
    const existing = await prisma.vehicle.findUnique({
      where: { licensePlate },
    });
    if (existing) {
      return res.status(409).json({ error: 'License plate already exists' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        name,
        model,
        licensePlate,
        type,
        maxCapacityKg: Number(maxCapacityKg),
        currentOdometer: currentOdometer ? Number(currentOdometer) : 0,
        acquisitionCost: acquisitionCost ? Number(acquisitionCost) : null,
        requiredLicenseCategory,
        status,
        year: year ? Number(year) : null,
      },
    });

    // Optional: emit real-time event
    // req.io.emit('vehicleCreated', vehicle);

    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Convert numeric fields
    if (data.maxCapacityKg) data.maxCapacityKg = Number(data.maxCapacityKg);
    if (data.currentOdometer) data.currentOdometer = Number(data.currentOdometer);
    if (data.acquisitionCost) data.acquisitionCost = Number(data.acquisitionCost);
    if (data.year) data.year = Number(data.year);

    const vehicle = await prisma.vehicle.update({
      where: { id: Number(id) },
      data,
    });

    // Optional: emit status change if status was updated
    if (data.status) {
      // req.io.emit('vehicleStatusUpdate', { id: vehicle.id, status: vehicle.status });
    }

    res.json(vehicle);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Optional: check if vehicle has active trips before delete
    const activeTrips = await prisma.trip.count({
      where: {
        vehicleId: Number(id),
        status: { in: ['DISPATCHED', 'DRAFT'] },
      },
    });

    if (activeTrips > 0) {
      return res.status(400).json({ error: 'Cannot delete vehicle with active trips' });
    }

    await prisma.vehicle.delete({
      where: { id: Number(id) },
    });

    // Optional: emit delete event
    // req.io.emit('vehicleDeleted', { id });

    res.status(204).send();
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};