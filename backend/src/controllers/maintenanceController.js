// src/controllers/maintenanceController.js
const prisma = require('../prismaClient');

const getAllMaintenanceLogs = async (req, res) => {
  try {
    const { vehicleId, status, startDate, endDate } = req.query;

    const where = {};

    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const logs = await prisma.maintenanceLog.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        vehicle: { select: { licensePlate: true, model: true } },
      },
    });

    res.json(logs);
  } catch (err) {
    console.error('Get maintenance logs error:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
};

const getMaintenanceLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.maintenanceLog.findUnique({
      where: { id: Number(id) },
      include: { vehicle: true },
    });

    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });

    res.json(log);
  } catch (err) {
    console.error('Get log error:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance log' });
  }
};

const createMaintenanceLog = async (req, res) => {
  try {
    const { vehicleId, issue, cost, date, status = 'NEW' } = req.body;

    if (!vehicleId || !issue) {
      return res.status(400).json({ error: 'vehicleId and issue are required' });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(vehicleId) },
    });

    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const log = await prisma.maintenanceLog.create({
      data: {
        vehicleId: Number(vehicleId),
        issue,
        cost: cost ? Number(cost) : null,
        date: date ? new Date(date) : new Date(),
        status,
      },
    });

    // Core business rule: Auto-set vehicle to IN_SHOP
    await prisma.vehicle.update({
      where: { id: Number(vehicleId) },
      data: { status: 'IN_SHOP' },
    });

    // Optional: real-time notification
    // req.io.emit('vehicleStatusUpdate', { vehicleId, status: 'IN_SHOP' });
    // req.io.emit('maintenanceCreated', log);

    res.status(201).json({
      message: 'Maintenance log created. Vehicle moved to IN_SHOP.',
      log,
    });
  } catch (err) {
    console.error('Create maintenance error:', err);
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
};

const updateMaintenanceLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { issue, cost, date, status } = req.body;

    const log = await prisma.maintenanceLog.findUnique({
      where: { id: Number(id) },
      include: { vehicle: true },
    });

    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });

    const updatedLog = await prisma.maintenanceLog.update({
      where: { id: Number(id) },
      data: {
        issue: issue || log.issue,
        cost: cost !== undefined ? Number(cost) : log.cost,
        date: date ? new Date(date) : log.date,
        status: status || log.status,
      },
    });

    // If status changed to COMPLETED → reset vehicle to AVAILABLE
    if (status === 'COMPLETED' && log.status !== 'COMPLETED') {
      await prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: 'AVAILABLE' },
      });

      // Optional emit
      // req.io.emit('vehicleStatusUpdate', { vehicleId: log.vehicleId, status: 'AVAILABLE' });
    }

    res.json(updatedLog);
  } catch (err) {
    console.error('Update maintenance error:', err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Log not found' });
    res.status(500).json({ error: 'Failed to update maintenance log' });
  }
};

const deleteMaintenanceLog = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.maintenanceLog.findUnique({ where: { id: Number(id) } });

    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });

    // Optional: only allow delete if status is NEW or if no impact
    if (log.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete completed maintenance logs' });
    }

    await prisma.maintenanceLog.delete({ where: { id: Number(id) } });

    // Optional: if vehicle was IN_SHOP because of this log, you could re-check other logs
    // But for simplicity, we leave vehicle status as-is

    res.status(204).send();
  } catch (err) {
    console.error('Delete maintenance error:', err);
    res.status(500).json({ error: 'Failed to delete maintenance log' });
  }
};

module.exports = {
  getAllMaintenanceLogs,
  getMaintenanceLogById,
  createMaintenanceLog,
  updateMaintenanceLog,
  deleteMaintenanceLog,
};