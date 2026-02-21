// prisma/seed.js

require('dotenv').config();

const prisma = require('../src/prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Starting database seeding...');

  // ───────────────────────────────────────────────
  // 1. Users
  // ───────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fleetflow.local' },
    update: {},
    create: {
      email: 'admin@fleetflow.local',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: 'dispatcher@fleetflow.local' },
    update: {},
    create: {
      email: 'dispatcher@fleetflow.local',
      password: hashedPassword,
      role: 'DISPATCHER',
    },
  });

  console.log('Users created/updated');

  // ───────────────────────────────────────────────
  // 2. Drivers
  // ───────────────────────────────────────────────
  const driver1 = await prisma.driver.upsert({
    where: { licenseNumber: 'GJ01-2020-12345' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      licenseNumber: 'GJ01-2020-12345',
      licenseExpiry: new Date('2027-12-31'),
      licenseCategory: 'Truck',
      safetyScore: 92,
      completionRate: 96.5,
      complaints: 1,
      dutyStatus: 'ON_DUTY',
      userId: dispatcher.id,
    },
  });

  const driver2 = await prisma.driver.upsert({
    where: { licenseNumber: 'GJ05-2019-67890' },
    update: {},
    create: {
      name: 'Priya Patel',
      licenseNumber: 'GJ05-2019-67890',
      licenseExpiry: new Date('2026-08-15'),
      licenseCategory: 'Van',
      safetyScore: 88,
      completionRate: 91.2,
      complaints: 3,
      dutyStatus: 'ON_DUTY',
    },
  });

  console.log('Drivers created/updated');

  // ───────────────────────────────────────────────
  // 3. Vehicles
  // ───────────────────────────────────────────────
  const vehicle1 = await prisma.vehicle.create({
    data: {
      name: 'Eicher Pro 2049',
      model: 'Pro 2049',
      licensePlate: 'GJ 05 AB 1234',
      type: 'Truck',
      maxCapacityKg: 9000,
      currentOdometer: 124500,
      acquisitionCost: 2800000,
      requiredLicenseCategory: 'Truck',
      status: 'AVAILABLE',
      year: 2021,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      name: 'Tata Ace',
      model: 'Ace Gold',
      licensePlate: 'GJ 01 CD 5678',
      type: 'Mini Truck',
      maxCapacityKg: 1000,
      currentOdometer: 87500,
      acquisitionCost: 650000,
      requiredLicenseCategory: 'Light',
      status: 'ON_TRIP',
      year: 2022,
    },
  });

  const vehicle3 = await prisma.vehicle.create({
    data: {
      name: 'Mahindra Bolero Pickup',
      model: 'Bolero Pik-Up',
      licensePlate: 'GJ 28 EF 9012',
      type: 'Pickup',
      maxCapacityKg: 1500,
      currentOdometer: 45000,
      requiredLicenseCategory: 'Light',
      status: 'IN_SHOP',
      year: 2023,
    },
  });

  const vehicle4 = await prisma.vehicle.create({
    data: {
      name: 'Force Traveller',
      model: 'Traveller 3350',
      licensePlate: 'GJ 15 GH 3456',
      type: 'Van',
      maxCapacityKg: 2500,
      currentOdometer: 32000,
      acquisitionCost: 2200000,
      requiredLicenseCategory: 'Van',
      status: 'OUT_OF_SERVICE',
      year: 2020,
    },
  });

  console.log('Vehicles created');

  // ───────────────────────────────────────────────
  // 4. Trips
  // ───────────────────────────────────────────────
  await prisma.trip.createMany({
    data: [
      {
        origin: 'Surat',
        destination: 'Vadodara',
        cargoWeightKg: 7200,
        estimatedFuelCost: 4500,
        revenue: 18500,
        status: 'DRAFT',
        vehicleId: vehicle1.id,
        driverId: driver1.id,
      },
      {
        origin: 'Surat',
        destination: 'Ahmedabad',
        cargoWeightKg: 850,
        estimatedFuelCost: 1200,
        revenue: 6200,
        status: 'DISPATCHED',
        vehicleId: vehicle2.id,
        driverId: driver2.id,
      },
      {
        origin: 'Navsari',
        destination: 'Vapi',
        cargoWeightKg: 1300,
        estimatedFuelCost: 1800,
        revenue: 4800,
        status: 'COMPLETED',
        vehicleId: vehicle3.id,
        driverId: driver1.id,
        finalOdometer: 46250,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Trips created');

  // ───────────────────────────────────────────────
  // 5. Maintenance Logs
  // ───────────────────────────────────────────────
  await prisma.maintenanceLog.createMany({
    data: [
      {
        vehicleId: vehicle3.id,
        issue: 'Brake pad replacement + wheel alignment',
        cost: 14500,
        status: 'COMPLETED',
        date: new Date('2026-01-15'),
      },
      {
        vehicleId: vehicle1.id,
        issue: 'Oil change + filter replacement',
        cost: 3200,
        status: 'NEW',
        date: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  console.log('Maintenance logs created');

  // ───────────────────────────────────────────────
  // 6. Fuel Logs
  // ───────────────────────────────────────────────
  await prisma.fuelLog.createMany({
    data: [
      {
        vehicleId: vehicle2.id,
        tripId: 2,
        liters: 42.5,
        cost: 3850,
        distance: 185,
        date: new Date('2026-02-10'),
      },
      {
        vehicleId: vehicle1.id,
        liters: 68,
        cost: 6120,
        distance: 320,
        date: new Date('2026-02-18'),
      },
    ],
    skipDuplicates: true,
  });

  console.log('Fuel logs created');

  // ───────────────────────────────────────────────
  // 7. Expenses
  // ───────────────────────────────────────────────
  await prisma.expense.createMany({
    data: [
      {
        vehicleId: vehicle2.id,
        tripId: 2,
        driverId: driver2.id,
        amount: 450,
        category: 'Toll',
        date: new Date('2026-02-10'),
      },
      {
        vehicleId: vehicle1.id,
        amount: 1200,
        category: 'Parking + food allowance',
        date: new Date('2026-02-18'),
      },
    ],
    skipDuplicates: true,
  });

  console.log('Expenses created');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });