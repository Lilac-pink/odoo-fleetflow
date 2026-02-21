// src/controllers/dashboardController.js
const prisma = require('../prismaClient');

const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Active Fleet: vehicles currently ON_TRIP
    const activeFleet = await prisma.vehicle.count({
      where: { status: 'ON_TRIP' },
    });

    // 2. Maintenance Alerts: vehicles IN_SHOP
    const maintenanceAlerts = await prisma.vehicle.count({
      where: { status: 'IN_SHOP' },
    });

    // 3. Utilization Rate: % of vehicles that are NOT AVAILABLE or OUT_OF_SERVICE
    const totalVehicles = await prisma.vehicle.count({
      where: { status: { notIn: ['OUT_OF_SERVICE'] } }, // exclude retired
    });

    const assignedVehicles = await prisma.vehicle.count({
      where: { status: { in: ['ON_TRIP', 'IN_SHOP'] } },
    });

    const utilizationRate = totalVehicles > 0
      ? Math.round((assignedVehicles / totalVehicles) * 100)
      : 0;

    // 4. Pending Cargo: trips in DRAFT with no vehicle/driver yet
    // (or you can define "pending" as DRAFT status)
    const pendingCargo = await prisma.trip.count({
      where: {
        status: 'DRAFT',
        // Optional stricter: vehicleId: null, driverId: null
      },
    });

    res.json({
      activeFleet,
      maintenanceAlerts,
      utilizationRate,
      pendingCargo,
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
};

const getActiveTrips = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const activeTrips = await prisma.trip.findMany({
      where: {
        status: { in: ['DISPATCHED', 'DRAFT'] }, // or just 'DISPATCHED' if you prefer
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        origin: true,
        destination: true,
        status: true,
        cargoWeightKg: true,
        vehicle: {
          select: { licensePlate: true, type: true },
        },
        driver: {
          select: { name: true },
        },
      },
    });

    // Format for frontend table
    const formatted = activeTrips.map(trip => ({
      id: trip.id,
      route: `${trip.origin} → ${trip.destination}`,
      status: trip.status,
      cargoKg: trip.cargoWeightKg,
      vehicle: trip.vehicle?.licensePlate || 'Not assigned',
      driver: trip.driver?.name || 'Not assigned',
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Active trips error:', err);
    res.status(500).json({ error: 'Failed to load active trips' });
  }
};

const createQuickVehicle = async (req, res) => {
  try {
    const {
      licensePlate,
      model,
      type,
      maxCapacityKg,
      name,                    // optional
      currentOdometer = 0,     // default
      requiredLicenseCategory, // optional
      status = 'AVAILABLE',    // default
    } = req.body;

    // Minimal required validation
    if (!licensePlate || !model || !type || !maxCapacityKg) {
      return res.status(400).json({
        error: 'Required: licensePlate, model, type, maxCapacityKg'
      });
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
        licensePlate,
        model,
        type,
        maxCapacityKg: Number(maxCapacityKg),
        name: name || null,
        currentOdometer: Number(currentOdometer),
        requiredLicenseCategory: requiredLicenseCategory || null,
        status,
      },
    });

    // Optional real-time notification
    // req.io.emit('vehicleCreated', vehicle);

    res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (err) {
    console.error('Quick vehicle creation error:', err);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

/**
 * POST /api/dashboard/new-trip
 * Quick trip creation (very minimal fields)
 * Returns trip ID + instruction to complete in full dispatcher form
 */
const createQuickTrip = async (req, res) => {
  try {
    const {
      origin,
      destination,
      // optional minimal fields
      cargoWeightKg = 0,
    } = req.body;

    // Minimal required validation
    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Required: origin and destination'
      });
    }

    const trip = await prisma.trip.create({
      data: {
        origin,
        destination,
        cargoWeightKg: Number(cargoWeightKg),
        status: 'DRAFT',
        // Intentionally leave vehicleId, driverId null → must complete in full form
      },
    });

    // Optional real-time notification
    // req.io.emit('tripQuickCreated', { id: trip.id });

    res.status(201).json({
      message: 'Trip draft created. Please complete details in the full Trip Dispatcher form.',
      tripId: trip.id,
      trip,
    });
  } catch (err) {
    console.error('Quick trip creation error:', err);
    res.status(500).json({ error: 'Failed to create quick trip' });
  }
};

module.exports = {
  getDashboardMetrics,
  getActiveTrips,
  createQuickTrip,
  createQuickVehicle
};