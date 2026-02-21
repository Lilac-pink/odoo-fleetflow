// src/controllers/tripController.js
const prisma = require('../prismaClient');

const getAllTrips = async (req, res) => {
  try {
    const { status, vehicleId, driverId, search } = req.query;

    const where = {};

    if (status) where.status = status;
    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (driverId) where.driverId = Number(driverId);
    if (search) {
      where.OR = [
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: { select: { licensePlate: true, type: true } },
        driver: { select: { name: true } },
      },
    });

    res.json(trips);
  } catch (err) {
    console.error('Get trips error:', err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: Number(id) },
      include: {
        vehicle: true,
        driver: true,
        fuelLogs: true,
        expenses: true,
      },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    res.json(trip);
  } catch (err) {
    console.error('Get trip error:', err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
};

const createTrip = async (req, res) => {
  try {
    const {
      origin,
      destination,
      cargoWeightKg,
      estimatedFuelCost,
      revenue,
      vehicleId,
      driverId,
    } = req.body;

    // Required fields check
    if (!origin || !destination || !cargoWeightKg || !vehicleId || !driverId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(vehicleId) },
    });

    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Core business rule: cargo weight validation
    if (Number(cargoWeightKg) > vehicle.maxCapacityKg) {
      return res.status(400).json({
        error: `Cargo weight (${cargoWeightKg} kg) exceeds vehicle capacity (${vehicle.maxCapacityKg} kg)`,
      });
    }

    // Vehicle must be AVAILABLE
    if (vehicle.status !== 'AVAILABLE') {
      return res.status(400).json({ error: `Vehicle is currently ${vehicle.status}` });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: Number(driverId) },
    });

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Driver must be ON_DUTY
    if (driver.dutyStatus !== 'ON_DUTY') {
      return res.status(400).json({ error: `Driver is ${driver.dutyStatus}` });
    }

    // Optional: license category match
    if (vehicle.requiredLicenseCategory && driver.licenseCategory !== vehicle.requiredLicenseCategory) {
      return res.status(400).json({
        error: `Driver license category (${driver.licenseCategory}) does not match vehicle requirement (${vehicle.requiredLicenseCategory})`,
      });
    }

    const trip = await prisma.trip.create({
      data: {
        origin,
        destination,
        cargoWeightKg: Number(cargoWeightKg),
        estimatedFuelCost: estimatedFuelCost ? Number(estimatedFuelCost) : null,
        revenue: revenue ? Number(revenue) : null,
        status: 'DRAFT',
        vehicleId: Number(vehicleId),
        driverId: Number(driverId),
      },
    });

    // Optional: auto-update vehicle to ON_TRIP if dispatched immediately (your choice)
    // await prisma.vehicle.update({ where: { id: Number(vehicleId) }, data: { status: 'ON_TRIP' } });

    // Optional real-time emit
    // req.io.emit('tripCreated', trip);

    res.status(201).json(trip);
  } catch (err) {
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
};

const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Prevent changing status here — use completeTrip for that
    if (data.status) {
      return res.status(400).json({ error: 'Use /complete endpoint to mark as completed' });
    }

    const trip = await prisma.trip.update({
      where: { id: Number(id) },
      data,
    });

    res.json(trip);
  } catch (err) {
    console.error('Update trip error:', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Trip not found' });
    res.status(500).json({ error: 'Failed to update trip' });
  }
};

const completeTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalOdometer } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id: Number(id) },
      include: { vehicle: true },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (trip.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Trip already completed' });
    }

    if (!finalOdometer || finalOdometer <= trip.vehicle.currentOdometer) {
      return res.status(400).json({ error: 'Valid final odometer required (higher than current)' });
    }

    // Update trip
    const updatedTrip = await prisma.trip.update({
      where: { id: Number(id) },
      data: {
        status: 'COMPLETED',
        finalOdometer: Number(finalOdometer),
      },
    });

    // Update vehicle odometer + status back to AVAILABLE
    await prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        currentOdometer: Number(finalOdometer),
        status: 'AVAILABLE',
      },
    });

    // Optional: update driver duty if needed

    // Optional real-time emit
    // req.io.emit('tripCompleted', updatedTrip);

    res.json({
      message: 'Trip completed successfully',
      trip: updatedTrip,
    });
  } catch (err) {
    console.error('Complete trip error:', err);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
};

const dispatchTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: Number(id) },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'DRAFT') {
      return res.status(400).json({ error: `Cannot dispatch a trip with status ${trip.status}` });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: Number(id) },
      data: { status: 'DISPATCHED' },
    });

    await prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: 'ON_TRIP' },
    });

    await prisma.driver.update({
      where: { id: trip.driverId },
      data: { dutyStatus: 'ON_DUTY' },
    });

    res.json(updatedTrip);
  } catch (err) {
    console.error('Dispatch trip error:', err);
    res.status(500).json({ error: 'Failed to dispatch trip' });
  }
};

const cancelTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id: Number(id) },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
      return res.status(400).json({ error: `Cannot cancel a trip with status ${trip.status}` });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: Number(id) },
      data: { status: 'CANCELLED' },
    });

    // If it was dispatched, free up the vehicle and driver
    if (trip.status === 'DISPATCHED') {
      await prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'AVAILABLE' },
      });
      await prisma.driver.update({
        where: { id: trip.driverId },
        data: { dutyStatus: 'OFF_DUTY' },
      });
    }

    res.json(updatedTrip);
  } catch (err) {
    console.error('Cancel trip error:', err);
    res.status(500).json({ error: 'Failed to cancel trip' });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({ where: { id: Number(id) } });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (!['DRAFT', 'CANCELLED'].includes(trip.status)) {
      return res.status(400).json({ error: 'Only DRAFT or CANCELLED trips can be deleted' });
    }

    await prisma.trip.delete({ where: { id: Number(id) } });

    res.status(204).send();
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
};

module.exports = {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  dispatchTrip,
  cancelTrip,
  completeTrip,
  deleteTrip,
};