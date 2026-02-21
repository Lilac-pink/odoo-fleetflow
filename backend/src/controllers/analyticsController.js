// src/controllers/analyticsController.js
const prisma = require('../prismaClient');
const fastCsv = require('@fast-csv/format');
const { startOfMonth, endOfMonth, subMonths } = require('date-fns'); // npm install date-fns

// Helper: calculate cost per km (total costs / total distance)
async function calculateCostPerKm() {
  const totalDistance = await prisma.fuelLog.aggregate({
    _sum: { distance: true },
  });

  const totalCosts = await prisma.$transaction([
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);

  const totalCost = totalCosts.reduce((sum, agg) => sum + (agg._sum?.cost || agg._sum?.amount || 0), 0);

  return totalDistance._sum.distance > 0 ? totalCost / totalDistance._sum.distance : 0;
}

const getAnalyticsMetrics = async (req, res) => {
  try {
    // 1. Total Fuel Cost (all time)
    const totalFuel = await prisma.fuelLog.aggregate({
      _sum: { cost: true },
    });

    // 2. Total Maintenance Cost
    const totalMaintenance = await prisma.maintenanceLog.aggregate({
      _sum: { cost: true },
    });

    // 3. Fleet ROI % (simplified: total revenue - total costs / total acquisition cost)
    const totalRevenue = await prisma.trip.aggregate({
      _sum: { revenue: true },
    });

    const totalAcquisition = await prisma.vehicle.aggregate({
      _sum: { acquisitionCost: true },
      where: { acquisitionCost: { not: null } },
    });

    const totalCosts = (totalFuel._sum.cost || 0) + (totalMaintenance._sum.cost || 0);
    const netProfit = (totalRevenue._sum.revenue || 0) - totalCosts;
    const roi = totalAcquisition._sum.acquisitionCost > 0
      ? (netProfit / totalAcquisition._sum.acquisitionCost) * 100
      : 0;
    const safeRoi = Object.is(roi, -0) ? 0 : roi;

    // 4. Average Utilization Rate (from previous dashboard logic)
    const totalVehicles = await prisma.vehicle.count();
    const activeVehicles = await prisma.vehicle.count({
      where: { status: { in: ['ON_TRIP', 'IN_SHOP'] } },
    });
    const utilizationRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    // 5. Cost per km
    const costPerKm = await calculateCostPerKm();

    res.json({
      totalFuelCost: totalFuel._sum.cost || 0,
      totalMaintenanceCost: totalMaintenance._sum.cost || 0,
      fleetRoiPercent: safeRoi.toFixed(2),
      averageUtilizationRate: utilizationRate,
      costPerKm: costPerKm.toFixed(2),
    });
  } catch (err) {
    console.error('Analytics metrics error:', err);
    res.status(500).json({ error: 'Failed to load analytics metrics' });
  }
};

const getFuelEfficiencyTrend = async (req, res) => {
  try {
    const monthsBack = parseInt(req.query.months) || 12;

    const startDate = subMonths(new Date(), monthsBack);

    const logs = await prisma.fuelLog.groupBy({
      by: ['date'],
      _sum: { liters: true, distance: true },
      where: { date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthly = logs.reduce((acc, log) => {
      const month = log.date.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = { distance: 0, liters: 0 };
      acc[month].distance += log._sum.distance || 0;
      acc[month].liters += log._sum.liters || 0;
      return acc;
    }, {});

    const trend = Object.entries(monthly).map(([month, data]) => ({
      month,
      kmPerLiter: data.liters > 0 ? (data.distance / data.liters).toFixed(2) : 0,
      totalLiters: data.liters,
      totalDistance: data.distance,
    }));

    res.json(trend);
  } catch (err) {
    console.error('Fuel efficiency trend error:', err);
    res.status(500).json({ error: 'Failed to load fuel efficiency trend' });
  }
};

const getVehicleRoi = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { acquisitionCost: { not: null } },
      include: {
        trips: { select: { revenue: true } },
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
      },
    });

    const roiData = vehicles.map(v => {
      const totalRevenue = v.trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const totalCosts =
        v.fuelLogs.reduce((sum, f) => sum + f.cost, 0) +
        v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0) +
        v.expenses.reduce((sum, e) => sum + e.amount, 0);

      const roi = v.acquisitionCost > 0 ? ((totalRevenue - totalCosts) / v.acquisitionCost) * 100 : 0;
      const safeRoi = Object.is(roi, -0) ? 0 : roi;

      return {
        vehicleId: v.id,
        licensePlate: v.licensePlate,
        model: v.model,
        acquisitionCost: v.acquisitionCost,
        totalRevenue,
        totalCosts,
        roiPercent: safeRoi.toFixed(2),
      };
    });

    res.json(roiData);
  } catch (err) {
    console.error('Vehicle ROI error:', err);
    res.status(500).json({ error: 'Failed to calculate vehicle ROI' });
  }
};

const getMonthlySummary = async (req, res) => {
  try {
    const monthsBack = parseInt(req.query.months) || 12;
    const startDate = subMonths(startOfMonth(new Date()), monthsBack);

    const summaries = [];

    for (let i = 0; i < monthsBack; i++) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(monthStart);

      const fuel = await prisma.fuelLog.aggregate({
        _sum: { cost: true },
        where: { date: { gte: monthStart, lte: monthEnd } },
      });

      const maintenance = await prisma.maintenanceLog.aggregate({
        _sum: { cost: true },
        where: { date: { gte: monthStart, lte: monthEnd } },
      });

      const revenue = await prisma.trip.aggregate({
        _sum: { revenue: true },
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
      });

      summaries.push({
        month: monthStart.toISOString().slice(0, 7),
        fuelCost: fuel._sum.cost || 0,
        maintenanceCost: maintenance._sum.cost || 0,
        revenue: revenue._sum.revenue || 0,
        netProfit: (revenue._sum.revenue || 0) - (fuel._sum.cost || 0) - (maintenance._sum.cost || 0),
      });
    }

    res.json(summaries.reverse()); // newest first
  } catch (err) {
    console.error('Monthly summary error:', err);
    res.status(500).json({ error: 'Failed to load monthly summary' });
  }
};

const exportAnalyticsData = async (req, res) => {
  try {
    // For simplicity, return JSON — frontend can convert to CSV/PDF
    // In production, use csv-stringify or pdfmake here
    const data = {
      metrics: await getAnalyticsMetrics(req, { json: d => d }), // reuse function
      monthly: await getMonthlySummary(req, { json: d => d }),
      // Add more if needed
    };

    res.json({
      message: 'Export data ready (use this in frontend for CSV/PDF)',
      data,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to prepare export data' });
  }
};

const exportAnalyticsCsv = async (req, res) => {
  try {
    const { type = 'monthly-summary', months = 12, vehicleId } = req.query;
    let data = [];
    let filename = 'fleetflow-export.csv';
    let headers = [];

    switch (type) {
      case 'monthly-summary':
        // Reuse your existing monthly summary logic
        const startDate = subMonths(startOfMonth(new Date()), Number(months));
        data = []; // Build like in getMonthlySummary

        for (let i = 0; i < Number(months); i++) {
          const monthStart = startOfMonth(subMonths(new Date(), i));
          const monthEnd = endOfMonth(monthStart);

          const fuel = await prisma.fuelLog.aggregate({
            _sum: { cost: true },
            where: { date: { gte: monthStart, lte: monthEnd } },
          });

          const maintenance = await prisma.maintenanceLog.aggregate({
            _sum: { cost: true },
            where: { date: { gte: monthStart, lte: monthEnd } },
          });

          const revenue = await prisma.trip.aggregate({
            _sum: { revenue: true },
            where: { createdAt: { gte: monthStart, lte: monthEnd } },
          });

          data.push({
            Month: monthStart.toISOString().slice(0, 7),
            FuelCost: fuel._sum.cost || 0,
            MaintenanceCost: maintenance._sum.cost || 0,
            Revenue: revenue._sum.revenue || 0,
            NetProfit: (revenue._sum.revenue || 0) - (fuel._sum.cost || 0) - (maintenance._sum.cost || 0),
          });
        }

        data.reverse(); // newest first
        headers = ['Month', 'FuelCost', 'MaintenanceCost', 'Revenue', 'NetProfit'];
        filename = `fleetflow-monthly-summary-${new Date().toISOString().slice(0, 10)}.csv`;
        break;

      case 'vehicle-roi':
        const vehicles = await prisma.vehicle.findMany({
          where: { acquisitionCost: { not: null } },
          include: {
            trips: { select: { revenue: true } },
            fuelLogs: { select: { cost: true } },
            maintenanceLogs: { select: { cost: true } },
            expenses: { select: { amount: true } },
          },
        });

        data = vehicles.map(v => {
          const totalRevenue = v.trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
          const totalCosts =
            v.fuelLogs.reduce((sum, f) => sum + f.cost, 0) +
            v.maintenanceLogs.reduce((sum, m) => sum + m.cost, 0) +
            v.expenses.reduce((sum, e) => sum + e.amount, 0);

          const roi = v.acquisitionCost > 0 ? ((totalRevenue - totalCosts) / v.acquisitionCost) * 100 : 0;

          return {
            LicensePlate: v.licensePlate,
            Model: v.model,
            AcquisitionCost: v.acquisitionCost,
            TotalRevenue: totalRevenue,
            TotalCosts: totalCosts,
            RoiPercent: roi.toFixed(2),
          };
        });

        headers = ['LicensePlate', 'Model', 'AcquisitionCost', 'TotalRevenue', 'TotalCosts', 'RoiPercent'];
        filename = `fleetflow-vehicle-roi-${new Date().toISOString().slice(0, 10)}.csv`;
        break;

      case 'fuel-logs':
        const where = vehicleId ? { vehicleId: Number(vehicleId) } : {};
        const logs = await prisma.fuelLog.findMany({
          where,
          include: {
            vehicle: { select: { licensePlate: true } },
            trip: { select: { origin: true, destination: true } },
          },
          orderBy: { date: 'desc' },
        });

        data = logs.map(log => ({
          Date: log.date.toISOString().split('T')[0],
          Vehicle: log.vehicle?.licensePlate || 'N/A',
          Trip: log.trip ? `${log.trip.origin} → ${log.trip.destination}` : 'N/A',
          Liters: log.liters,
          Cost: log.cost,
          DistanceKm: log.distance || 0,
          CostPerKm: log.distance > 0 ? (log.cost / log.distance).toFixed(2) : 0,
        }));

        headers = ['Date', 'Vehicle', 'Trip', 'Liters', 'Cost', 'DistanceKm', 'CostPerKm'];
        filename = `fleetflow-fuel-logs-${new Date().toISOString().slice(0, 10)}.csv`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type. Use: monthly-summary, vehicle-roi, fuel-logs' });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Generate and stream CSV
    fastCsv
      .format({ headers: true })
      .transform(row => {
        // Optional: format numbers/dates nicely
        const formatted = { ...row };
        if (formatted.Date) formatted.Date = new Date(formatted.Date).toISOString().split('T')[0];
        return formatted;
      })
      .pipe(res)
      .on('error', err => {
        console.error('CSV stream error:', err);
        res.status(500).end();
      });

    // Write headers + data
    fastCsv.write(data, { headers }).pipe(res);

  } catch (err) {
    console.error('Export CSV error:', err);
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
};

module.exports = {
  getAnalyticsMetrics,
  getFuelEfficiencyTrend,
  getVehicleRoi,
  getMonthlySummary,
  exportAnalyticsData,
  exportAnalyticsCsv
};