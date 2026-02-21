// src/lib/adapters.ts
// Maps DB camelCase + SCREAMING_SNAKE_CASE enum values to frontend snake_case + human strings.
import type {
    User,
    UserRole,
    Vehicle,
    VehicleStatus,
    Driver,
    DriverDutyStatus,
    Trip,
    TripStatus,
    ServiceLog,
    ServiceLogStatus,
    ExpenseLog,
} from '@/types/fleet';

// ── Role mapping ──────────────────────────────────────────────────────────────
const DB_ROLE_TO_UI: Record<string, UserRole> = {
    ADMIN: 'Fleet Manager',
    DISPATCHER: 'Dispatcher',
    SAFETY_OFFICER: 'Safety Officer',
    FINANCIAL_ANALYST: 'Financial Analyst',
};

export const UI_ROLE_TO_DB: Record<UserRole, string> = {
    'Fleet Manager': 'ADMIN',
    'Dispatcher': 'DISPATCHER',
    'Safety Officer': 'SAFETY_OFFICER',
    'Financial Analyst': 'FINANCIAL_ANALYST',
};

// ── Vehicle status mapping ────────────────────────────────────────────────────
const DB_VEHICLE_STATUS: Record<string, VehicleStatus> = {
    AVAILABLE: 'Available',
    ON_TRIP: 'On Trip',
    IN_SHOP: 'In Shop',
    OUT_OF_SERVICE: 'Retired',
};

// ── Driver duty status mapping ─────────────────────────────────────────────────
const DB_DUTY_STATUS: Record<string, DriverDutyStatus> = {
    ON_DUTY: 'On Duty',
    OFF_DUTY: 'Off Duty',
    SUSPENDED: 'Suspended',
};

// ── Trip status mapping ────────────────────────────────────────────────────────
const DB_TRIP_STATUS: Record<string, TripStatus> = {
    DRAFT: 'Draft',
    DISPATCHED: 'Dispatched',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

// ── Service log status mapping ──────────────────────────────────────────────────
const DB_MAINT_STATUS: Record<string, ServiceLogStatus> = {
    NEW: 'Open',
    IN_PROGRESS: 'Open',
    COMPLETED: 'Closed',
};

// ── Adapters ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptUser(raw: any): User {
    return {
        id: String(raw.id),
        name: raw.name ?? raw.email?.split('@')[0] ?? 'User',
        email: raw.email,
        role: DB_ROLE_TO_UI[raw.role] ?? 'Fleet Manager',
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptVehicle(raw: any): Vehicle {
    return {
        id: String(raw.id),
        license_plate: raw.licensePlate,
        make: raw.name ?? raw.model,   // DB has no separate "make" field; use name or model
        model: raw.model,
        year: raw.year ?? new Date().getFullYear(),
        type: raw.type,
        max_load_kg: raw.maxCapacityKg,
        odometer_km: raw.currentOdometer,
        status: DB_VEHICLE_STATUS[raw.status] ?? 'Available',
        acquisition_cost: raw.acquisitionCost ?? 0,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptDriver(raw: any): Driver {
    return {
        id: String(raw.id),
        name: raw.name,
        license_number: raw.licenseNumber,
        license_category: raw.licenseCategory ?? 'Truck',
        license_expiry: raw.licenseExpiry
            ? new Date(raw.licenseExpiry).toISOString().slice(0, 10)
            : '',
        trips_completed: raw.completionRate ?? 0,
        safety_score: raw.safetyScore ?? 0,
        duty_status: DB_DUTY_STATUS[raw.dutyStatus] ?? 'Off Duty',
        created_at: raw.createdAt
            ? new Date(raw.createdAt).toISOString().slice(0, 10)
            : '',
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptTrip(raw: any): Trip {
    return {
        id: String(raw.id),
        vehicle_id: String(raw.vehicleId),
        driver_id: String(raw.driverId),
        cargo_weight_kg: raw.cargoWeightKg,
        origin: raw.origin,
        destination: raw.destination,
        estimated_fuel_cost: raw.estimatedFuelCost ?? 0,
        final_odometer: raw.finalOdometer ?? null,
        status: DB_TRIP_STATUS[raw.status] ?? 'Draft',
        created_at: raw.createdAt
            ? new Date(raw.createdAt).toISOString().slice(0, 10)
            : '',
        completed_at: raw.updatedAt && raw.status === 'COMPLETED'
            ? new Date(raw.updatedAt).toISOString().slice(0, 10)
            : null,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptServiceLog(raw: any): ServiceLog {
    return {
        id: String(raw.id),
        vehicle_id: String(raw.vehicleId),
        issue_description: raw.issue,
        date: raw.date ? new Date(raw.date).toISOString().slice(0, 10) : '',
        cost: raw.cost ?? 0,
        status: DB_MAINT_STATUS[raw.status] ?? 'Open',
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptExpenseLog(raw: any): ExpenseLog {
    return {
        id: String(raw.id),
        trip_id: raw.tripId ? String(raw.tripId) : '',
        vehicle_id: String(raw.vehicleId),
        driver_id: raw.driverId ? String(raw.driverId) : '',
        distance_km: 0,           // not stored in Expense model; default 0
        fuel_liters: 0,           // not stored in Expense model; default 0
        fuel_cost: raw.amount,
        revenue: 0,
        notes: raw.category ?? '',
        date: raw.date ? new Date(raw.date).toISOString().slice(0, 10) : '',
    };
}
