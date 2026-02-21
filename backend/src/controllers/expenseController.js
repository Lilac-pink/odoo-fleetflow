// src/controllers/fuelExpenseController.js
const prisma = require('../prismaClient');

// ───────────────────────────────────────────────
// Fuel Logs
// ───────────────────────────────────────────────

const getFuelLogs = async (req, res) => {
    try {
        const { vehicleId, tripId, startDate, endDate } = req.query;

        const where = {};

        if (vehicleId) where.vehicleId = Number(vehicleId);
        if (tripId) where.tripId = Number(tripId);
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const logs = await prisma.fuelLog.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                vehicle: { select: { licensePlate: true } },
                trip: { select: { id: true, origin: true, destination: true } },
            },
        });

        res.json(logs);
    } catch (err) {
        console.error('Get fuel logs error:', err);
        res.status(500).json({ error: 'Failed to fetch fuel logs' });
    }
};

const createFuelLog = async (req, res) => {
    try {
        const { vehicleId, tripId, liters, cost, distance, date } = req.body;

        if (!vehicleId || !liters || !cost) {
            return res.status(400).json({ error: 'vehicleId, liters, and cost are required' });
        }

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: Number(vehicleId) },
        });

        if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

        const fuelLog = await prisma.fuelLog.create({
            data: {
                vehicleId: Number(vehicleId),
                tripId: tripId ? Number(tripId) : null,
                liters: Number(liters),
                cost: Number(cost),
                distance: distance ? Number(distance) : null,
                date: date ? new Date(date) : new Date(),
            },
        });

        // Optional real-time emit
        // req.io.emit('fuelLogCreated', fuelLog);

        res.status(201).json(fuelLog);
    } catch (err) {
        console.error('Create fuel log error:', err);
        res.status(500).json({ error: 'Failed to create fuel log' });
    }
};

const updateFuelLog = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Convert numeric fields
        if (data.liters) data.liters = Number(data.liters);
        if (data.cost) data.cost = Number(data.cost);
        if (data.distance) data.distance = Number(data.distance);
        if (data.date) data.date = new Date(data.date);

        const log = await prisma.fuelLog.update({
            where: { id: Number(id) },
            data,
        });

        res.json(log);
    } catch (err) {
        console.error('Update fuel log error:', err);
        if (err.code === 'P2025') return res.status(404).json({ error: 'Fuel log not found' });
        res.status(500).json({ error: 'Failed to update fuel log' });
    }
};

const deleteFuelLog = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.fuelLog.delete({ where: { id: Number(id) } });

        res.status(204).send();
    } catch (err) {
        console.error('Delete fuel log error:', err);
        res.status(500).json({ error: 'Failed to delete fuel log' });
    }
};

// ───────────────────────────────────────────────
// Expenses (non-fuel)
// ───────────────────────────────────────────────

const getExpenses = async (req, res) => {
  try {
    const { vehicleId, tripId, driverId, category } = req.query;

    const where = {};

    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (tripId) where.tripId = Number(tripId);
    if (driverId) where.driverId = Number(driverId);
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { licensePlate: true } },
        trip: { select: { id: true } },
        driver: { select: { name: true } },
      },
    });

    res.json(expenses);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

const createExpense = async (req, res) => {
  try {
    const { vehicleId, tripId, driverId, amount, category, date } = req.body;

    if (!vehicleId || !amount || !category) {
      return res.status(400).json({ error: 'vehicleId, amount, and category required' });
    }

    const expense = await prisma.expense.create({
      data: {
        vehicleId: Number(vehicleId),
        tripId: tripId ? Number(tripId) : null,
        driverId: driverId ? Number(driverId) : null,
        amount: Number(amount),
        category,
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.amount) data.amount = Number(data.amount);
    if (data.date) data.date = new Date(data.date);

    const expense = await prisma.expense.update({
      where: { id: Number(id) },
      data,
    });

    res.json(expense);
  } catch (err) {
    console.error('Update expense error:', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Expense not found' });
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.expense.delete({ where: { id: Number(id) } });

    res.status(204).send();
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// Add to exports at the bottom of the file
module.exports = {
  // Fuel logs
  getFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
  // Expenses
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};