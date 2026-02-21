// prisma/seed.js
// Run with:  node prisma/seed.js
// Or add to package.json:  "prisma": { "seed": "node prisma/seed.js" }

require('dotenv').config();
const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');
const { subMonths, subDays, addDays } = require('date-fns');

const d = (daysAgo) => subDays(new Date(), daysAgo);

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ──────────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fleetflow.local' },
    update: {},
    create: { email: 'admin@fleetflow.local', password: pw, role: 'ADMIN' },
  });
  const dispatcher = await prisma.user.upsert({
    where: { email: 'dispatcher@fleetflow.local' },
    update: {},
    create: { email: 'dispatcher@fleetflow.local', password: pw, role: 'DISPATCHER' },
  });
  const safety = await prisma.user.upsert({
    where: { email: 'safety@fleetflow.local' },
    update: {},
    create: { email: 'safety@fleetflow.local', password: pw, role: 'SAFETY_OFFICER' },
  });
  console.log('✅ Users');

  // ─── Drivers ─────────────────────────────────────────────────────────────────
  const dr1 = await prisma.driver.upsert({
    where: { licenseNumber: 'GJ01-2020-12345' },
    update: {},
    create: {
      name: 'Rahul Sharma', licenseNumber: 'GJ01-2020-12345',
      licenseExpiry: new Date('2027-12-31'), licenseCategory: 'Truck',
      safetyScore: 92, completionRate: 96.5, complaints: 1,
      dutyStatus: 'ON_DUTY', userId: dispatcher.id,
    },
  });
  const dr2 = await prisma.driver.upsert({
    where: { licenseNumber: 'GJ05-2019-67890' },
    update: {},
    create: {
      name: 'Priya Patel', licenseNumber: 'GJ05-2019-67890',
      licenseExpiry: new Date('2026-08-15'), licenseCategory: 'Van',
      safetyScore: 88, completionRate: 91.2, complaints: 3,
      dutyStatus: 'ON_DUTY',
    },
  });
  const dr3 = await prisma.driver.upsert({
    where: { licenseNumber: 'GJ22-2018-54321' },
    update: {},
    create: {
      name: 'Amit Verma', licenseNumber: 'GJ22-2018-54321',
      licenseExpiry: new Date('2025-03-01'), licenseCategory: 'Truck',
      safetyScore: 74, completionRate: 82.0, complaints: 7,
      dutyStatus: 'SUSPENDED',
    },
  });
  const dr4 = await prisma.driver.upsert({
    where: { licenseNumber: 'GJ09-2022-11122' },
    update: {},
    create: {
      name: 'Sneha Mehta', licenseNumber: 'GJ09-2022-11122',
      licenseExpiry: new Date('2028-06-30'), licenseCategory: 'Van',
      safetyScore: 97, completionRate: 99.1, complaints: 0,
      dutyStatus: 'ON_DUTY', userId: safety.id,
    },
  });
  const dr5 = await prisma.driver.upsert({
    where: { licenseNumber: 'GJ14-2021-99001' },
    update: {},
    create: {
      name: 'Kunal Desai', licenseNumber: 'GJ14-2021-99001',
      licenseExpiry: new Date('2026-11-20'), licenseCategory: 'Truck',
      safetyScore: 83, completionRate: 87.5, complaints: 4,
      dutyStatus: 'OFF_DUTY',
    },
  });
  console.log('✅ Drivers');

  // ─── Vehicles ────────────────────────────────────────────────────────────────
  const v1 = await prisma.vehicle.upsert({
    where: { licensePlate: 'GJ 05 AB 1234' }, update: {},
    create: {
      name: 'Eicher Pro 2049', model: 'Pro 2049', licensePlate: 'GJ 05 AB 1234',
      type: 'Truck', maxCapacityKg: 9000, currentOdometer: 124500,
      acquisitionCost: 2800000, requiredLicenseCategory: 'Truck',
      status: 'AVAILABLE', year: 2021,
    },
  });
  const v2 = await prisma.vehicle.upsert({
    where: { licensePlate: 'GJ 01 CD 5678' }, update: {},
    create: {
      name: 'Tata Ace Gold', model: 'Ace Gold', licensePlate: 'GJ 01 CD 5678',
      type: 'Van', maxCapacityKg: 1000, currentOdometer: 87500,
      acquisitionCost: 650000, requiredLicenseCategory: 'Van',
      status: 'ON_TRIP', year: 2022,
    },
  });
  const v3 = await prisma.vehicle.upsert({
    where: { licensePlate: 'GJ 28 EF 9012' }, update: {},
    create: {
      name: 'Mahindra Bolero', model: 'Bolero Pik-Up', licensePlate: 'GJ 28 EF 9012',
      type: 'Truck', maxCapacityKg: 1500, currentOdometer: 45000,
      acquisitionCost: 1100000, requiredLicenseCategory: 'Truck',
      status: 'IN_SHOP', year: 2023,
    },
  });
  const v4 = await prisma.vehicle.upsert({
    where: { licensePlate: 'GJ 15 GH 3456' }, update: {},
    create: {
      name: 'Force Traveller', model: 'Traveller 3350', licensePlate: 'GJ 15 GH 3456',
      type: 'Van', maxCapacityKg: 2500, currentOdometer: 32000,
      acquisitionCost: 2200000, requiredLicenseCategory: 'Van',
      status: 'AVAILABLE', year: 2020,
    },
  });
  const v5 = await prisma.vehicle.upsert({
    where: { licensePlate: 'GJ 33 JK 7890' }, update: {},
    create: {
      name: 'Ashok Leyland Dost', model: 'Dost+', licensePlate: 'GJ 33 JK 7890',
      type: 'Truck', maxCapacityKg: 3000, currentOdometer: 200000,
      acquisitionCost: 1500000, requiredLicenseCategory: 'Truck',
      status: 'OUT_OF_SERVICE', year: 2018,
    },
  });
  console.log('✅ Vehicles');

  // ─── Trips ────────────────────────────────────────────────────────────────────
  const trips = await prisma.$transaction([
    prisma.trip.create({ data: { origin: 'Surat', destination: 'Vadodara', cargoWeightKg: 7200, estimatedFuelCost: 4500, revenue: 18500, status: 'DRAFT', vehicleId: v1.id, driverId: dr1.id } }),
    prisma.trip.create({ data: { origin: 'Surat', destination: 'Ahmedabad', cargoWeightKg: 850, estimatedFuelCost: 1200, revenue: 6200, status: 'DISPATCHED', vehicleId: v2.id, driverId: dr2.id } }),
    prisma.trip.create({ data: { origin: 'Navsari', destination: 'Vapi', cargoWeightKg: 1300, estimatedFuelCost: 1800, revenue: 4800, status: 'COMPLETED', vehicleId: v3.id, driverId: dr1.id, finalOdometer: 46250 } }),
    prisma.trip.create({ data: { origin: 'Ankleshwar', destination: 'Rajkot', cargoWeightKg: 5800, estimatedFuelCost: 6200, revenue: 24000, status: 'COMPLETED', vehicleId: v1.id, driverId: dr5.id, finalOdometer: 126950 } }),
    prisma.trip.create({ data: { origin: 'Bharuch', destination: 'Mumbai', cargoWeightKg: 2200, estimatedFuelCost: 9800, revenue: 38500, status: 'COMPLETED', vehicleId: v4.id, driverId: dr4.id, finalOdometer: 33200 } }),
    prisma.trip.create({ data: { origin: 'Junagadh', destination: 'Rajkot', cargoWeightKg: 960, estimatedFuelCost: 800, revenue: 3200, status: 'CANCELLED', vehicleId: v2.id, driverId: dr3.id } }),
    prisma.trip.create({ data: { origin: 'Surat', destination: 'Pune', cargoWeightKg: 6400, estimatedFuelCost: 11000, revenue: 42000, status: 'COMPLETED', vehicleId: v5.id, driverId: dr1.id, finalOdometer: 201800 } }),
    prisma.trip.create({ data: { origin: 'Vadodara', destination: 'Delhi', cargoWeightKg: 8200, estimatedFuelCost: 32000, revenue: 98000, status: 'COMPLETED', vehicleId: v1.id, driverId: dr5.id, finalOdometer: 128750 } }),
  ]);
  console.log('✅ Trips');

  // ─── Maintenance Logs ─────────────────────────────────────────────────────────
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: v3.id, issue: 'Brake pad replacement + wheel alignment', cost: 14500, status: 'COMPLETED', date: d(60) },
      { vehicleId: v1.id, issue: 'Oil change + filter replacement', cost: 3200, status: 'NEW', date: d(5) },
      { vehicleId: v2.id, issue: 'Coolant leak repair', cost: 8700, status: 'IN_PROGRESS', date: d(12) },
      { vehicleId: v4.id, issue: 'Tyre replacement (all 4)', cost: 22000, status: 'COMPLETED', date: d(45) },
      { vehicleId: v5.id, issue: 'Engine overhaul', cost: 95000, status: 'COMPLETED', date: d(20) },
      { vehicleId: v1.id, issue: 'AC compressor replacement', cost: 18000, status: 'IN_PROGRESS', date: d(3) },
      { vehicleId: v3.id, issue: 'Windscreen crack repair', cost: 4500, status: 'NEW', date: d(1) },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Maintenance logs');

  // ─── Fuel Logs (12 months of data for Analytics charts) ──────────────────────
  const fuelRows = [];
  for (let m = 11; m >= 0; m--) {
    const base = subMonths(new Date(), m);
    base.setDate(10);
    fuelRows.push(
      { vehicleId: v1.id, liters: 60 + Math.round(Math.random() * 20), cost: 5500 + Math.round(Math.random() * 2000), distance: 280 + Math.round(Math.random() * 80), date: base },
      { vehicleId: v2.id, liters: 38 + Math.round(Math.random() * 12), cost: 3400 + Math.round(Math.random() * 1200), distance: 200 + Math.round(Math.random() * 60), date: new Date(base.getTime() + 5 * 86400000) },
      { vehicleId: v4.id, liters: 45 + Math.round(Math.random() * 15), cost: 4100 + Math.round(Math.random() * 1500), distance: 230 + Math.round(Math.random() * 70), date: new Date(base.getTime() + 12 * 86400000) },
    );
  }
  await prisma.fuelLog.createMany({ data: fuelRows, skipDuplicates: true });
  console.log('✅ Fuel logs (12 months)');

  // ─── Expenses ─────────────────────────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      { vehicleId: v2.id, tripId: trips[1].id, driverId: dr2.id, amount: 450, category: 'Toll', date: d(10) },
      { vehicleId: v1.id, amount: 1200, category: 'Parking + food allowance', date: d(5) },
      { vehicleId: v4.id, tripId: trips[4].id, driverId: dr4.id, amount: 2800, category: 'Toll', date: d(20) },
      { vehicleId: v5.id, tripId: trips[6].id, driverId: dr1.id, amount: 3500, category: 'Driver Allowance', date: d(15) },
      { vehicleId: v1.id, tripId: trips[7].id, driverId: dr5.id, amount: 12000, category: 'Long Haul Allowance', date: d(8) },
      { vehicleId: v3.id, amount: 500, category: 'Permit', date: d(3) },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Expenses');

  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });