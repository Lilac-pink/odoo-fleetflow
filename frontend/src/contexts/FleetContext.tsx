import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  User, UserRole, Vehicle, Driver, Trip, ServiceLog, ExpenseLog,
  VehicleStatus, TripStatus, DriverDutyStatus, ServiceLogStatus,
} from '@/types/fleet';
import { api, ApiError } from '@/lib/api';
import {
  adaptUser, adaptVehicle, adaptDriver, adaptTrip, adaptServiceLog,
  adaptExpenseLog, UI_ROLE_TO_DB,
} from '@/lib/adapters';

interface FleetContextType {
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  vehicles: Vehicle[];
  addVehicle: (v: Omit<Vehicle, 'id'>) => Promise<void>;
  updateVehicle: (id: string, v: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<string | null>;
  drivers: Driver[];
  addDriver: (d: Omit<Driver, 'id' | 'trips_completed' | 'created_at'>) => Promise<void>;
  updateDriver: (id: string, d: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  trips: Trip[];
  addTrip: (t: Omit<Trip, 'id' | 'created_at' | 'completed_at' | 'final_odometer' | 'status'>) => Promise<void>;
  dispatchTrip: (id: string) => Promise<void>;
  completeTrip: (id: string, finalOdometer: number) => Promise<void>;
  cancelTrip: (id: string) => Promise<void>;
  serviceLogs: ServiceLog[];
  addServiceLog: (s: Omit<ServiceLog, 'id' | 'status'>) => Promise<void>;
  closeServiceLog: (id: string) => Promise<void>;
  expenseLogs: ExpenseLog[];
  addExpenseLog: (e: Omit<ExpenseLog, 'id'>) => Promise<void>;
  refreshVehicles: () => Promise<void>;
  refreshDrivers: () => Promise<void>;
  refreshTrips: () => Promise<void>;
}

const FleetContext = createContext<FleetContextType | null>(null);

export const useFleet = () => {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error('useFleet must be used within FleetProvider');
  return ctx;
};

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // starts true — restoring session
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [expenseLogs, setExpenseLogs] = useState<ExpenseLog[]>([]);

  // ── Session restore ────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAuthLoading(false); return; }

    api.get<{ user: Record<string, unknown> }>('/api/auth/me')
      .then(({ user: raw }) => setUser(adaptUser(raw)))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setAuthLoading(false));
  }, []);

  // ── Data fetching (triggered when user logs in) ───────────────────────────
  const fetchAllData = useCallback(async () => {
    try {
      const [rawVehicles, rawDrivers, rawTrips, rawMaint, rawExpenses] = await Promise.all([
        api.get<unknown[]>('/api/vehicles'),
        api.get<unknown[]>('/api/drivers'),
        api.get<unknown[]>('/api/trips'),
        api.get<unknown[]>('/api/maintenance'),
        api.get<unknown[]>('/api/expenses'),
      ]);
      setVehicles((rawVehicles as Record<string, unknown>[]).map(adaptVehicle));
      setDrivers((rawDrivers as Record<string, unknown>[]).map(adaptDriver));
      setTrips((rawTrips as Record<string, unknown>[]).map(adaptTrip));
      setServiceLogs((rawMaint as Record<string, unknown>[]).map(adaptServiceLog));
      setExpenseLogs((rawExpenses as Record<string, unknown>[]).map(adaptExpenseLog));
    } catch (e) {
      console.error('Error fetching fleet data:', e);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAllData();
    else {
      setVehicles([]); setDrivers([]); setTrips([]);
      setServiceLogs([]); setExpenseLogs([]);
    }
  }, [user, fetchAllData]);

  // ── Granular refreshers ────────────────────────────────────────────────────
  const refreshVehicles = useCallback(async () => {
    const raw = await api.get<unknown[]>('/api/vehicles');
    setVehicles((raw as Record<string, unknown>[]).map(adaptVehicle));
  }, []);

  const refreshDrivers = useCallback(async () => {
    const raw = await api.get<unknown[]>('/api/drivers');
    setDrivers((raw as Record<string, unknown>[]).map(adaptDriver));
  }, []);

  const refreshTrips = useCallback(async () => {
    const raw = await api.get<unknown[]>('/api/trips');
    setTrips((raw as Record<string, unknown>[]).map(adaptTrip));
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string, role: UserRole): Promise<boolean> => {
    const dbRole = UI_ROLE_TO_DB[role];
    const data = await api.post<{ token: string; user: Record<string, unknown> }>(
      '/api/auth/login', { email, password, role: dbRole }
    );
    localStorage.setItem('token', data.token);
    setUser(adaptUser(data.user));
    return true;
  }, []);

  const register = useCallback(async (
    name: string, email: string, password: string, role: UserRole
  ) => {
    const dbRole = UI_ROLE_TO_DB[role];
    await api.post('/api/auth/register', { name, email, password, role: dbRole });
    await login(email, password, role);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const addVehicle = useCallback(async (v: Omit<Vehicle, 'id'>) => {
    await api.post('/api/vehicles', {
      name: v.make,
      model: v.model,
      licensePlate: v.license_plate,
      type: v.type,
      maxCapacityKg: v.max_load_kg,
      currentOdometer: v.odometer_km,
      acquisitionCost: v.acquisition_cost,
      year: v.year,
      status: 'AVAILABLE',
    });
    await refreshVehicles();
  }, [refreshVehicles]);

  const updateVehicle = useCallback(async (id: string, v: Partial<Vehicle>) => {
    // Map frontend field names to DB field names
    const payload: Record<string, unknown> = {};
    if (v.make !== undefined) payload.name = v.make;
    if (v.model !== undefined) payload.model = v.model;
    if (v.license_plate !== undefined) payload.licensePlate = v.license_plate;
    if (v.type !== undefined) payload.type = v.type;
    if (v.max_load_kg !== undefined) payload.maxCapacityKg = v.max_load_kg;
    if (v.odometer_km !== undefined) payload.currentOdometer = v.odometer_km;
    if (v.acquisition_cost !== undefined) payload.acquisitionCost = v.acquisition_cost;
    if (v.year !== undefined) payload.year = v.year;
    if (v.status !== undefined) {
      const statusMap: Record<VehicleStatus, string> = {
        Available: 'AVAILABLE', 'On Trip': 'ON_TRIP', 'In Shop': 'IN_SHOP', Retired: 'OUT_OF_SERVICE',
      };
      payload.status = statusMap[v.status];
    }
    await api.put(`/api/vehicles/${id}`, payload);
    await refreshVehicles();
  }, [refreshVehicles]);

  const deleteVehicle = useCallback(async (id: string): Promise<string | null> => {
    try {
      await api.delete(`/api/vehicles/${id}`);
      await refreshVehicles();
      return null;
    } catch (e) {
      if (e instanceof ApiError) return e.message;
      return 'Failed to delete vehicle';
    }
  }, [refreshVehicles]);

  // ── Drivers ───────────────────────────────────────────────────────────────
  const addDriver = useCallback(async (d: Omit<Driver, 'id' | 'trips_completed' | 'created_at'>) => {
    const dutyMap: Record<DriverDutyStatus, string> = {
      'On Duty': 'ON_DUTY', 'Off Duty': 'OFF_DUTY', Suspended: 'SUSPENDED', 'Taking a Break': 'OFF_DUTY',
    };
    await api.post('/api/drivers', {
      name: d.name,
      licenseNumber: d.license_number,
      licenseCategory: d.license_category,
      licenseExpiry: new Date(d.license_expiry).toISOString(),
      safetyScore: d.safety_score,
      completionRate: d.completion_rate,
      complaints: d.complaints,
      dutyStatus: dutyMap[d.duty_status] ?? 'OFF_DUTY',
    });
    await refreshDrivers();
  }, [refreshDrivers]);

  const updateDriver = useCallback(async (id: string, d: Partial<Driver>) => {
    const dutyMap: Record<DriverDutyStatus, string> = {
      'On Duty': 'ON_DUTY', 'Off Duty': 'OFF_DUTY', Suspended: 'SUSPENDED', 'Taking a Break': 'OFF_DUTY',
    };
    const payload: Record<string, unknown> = {};
    if (d.name !== undefined) payload.name = d.name;
    if (d.license_number !== undefined) payload.licenseNumber = d.license_number;
    if (d.license_category !== undefined) payload.licenseCategory = d.license_category;
    if (d.license_expiry !== undefined) payload.licenseExpiry = new Date(d.license_expiry).toISOString();
    if (d.safety_score !== undefined) payload.safetyScore = d.safety_score;
    if (d.completion_rate !== undefined) payload.completionRate = d.completion_rate;
    if (d.complaints !== undefined) payload.complaints = d.complaints;
    if (d.duty_status !== undefined) payload.dutyStatus = dutyMap[d.duty_status];
    await api.put(`/api/drivers/${id}`, payload);
    await refreshDrivers();
  }, [refreshDrivers]);

  const deleteDriver = useCallback(async (id: string) => {
    await api.delete(`/api/drivers/${id}`);
    await refreshDrivers();
  }, [refreshDrivers]);

  // ── Trips ─────────────────────────────────────────────────────────────────
  const addTrip = useCallback(async (
    t: Omit<Trip, 'id' | 'created_at' | 'completed_at' | 'final_odometer' | 'status'>
  ) => {
    await api.post('/api/trips', {
      origin: t.origin,
      destination: t.destination,
      cargoWeightKg: t.cargo_weight_kg,
      estimatedFuelCost: t.estimated_fuel_cost,
      revenue: t.revenue ?? null,
      vehicleId: Number(t.vehicle_id),
      driverId: Number(t.driver_id),
    });
    await refreshTrips();
  }, [refreshTrips]);

  const dispatchTrip = useCallback(async (id: string) => {
    await api.put(`/api/trips/${id}/dispatch`, {});
    await Promise.all([refreshTrips(), refreshVehicles(), refreshDrivers()]);
  }, [refreshTrips, refreshVehicles, refreshDrivers]);

  const completeTrip = useCallback(async (id: string, finalOdometer: number) => {
    await api.put(`/api/trips/${id}/complete`, { finalOdometer });
    await Promise.all([refreshTrips(), refreshVehicles(), refreshDrivers()]);
  }, [refreshTrips, refreshVehicles, refreshDrivers]);

  const cancelTrip = useCallback(async (id: string) => {
    await api.put(`/api/trips/${id}/cancel`, {});
    await Promise.all([refreshTrips(), refreshVehicles(), refreshDrivers()]);
  }, [refreshTrips, refreshVehicles, refreshDrivers]);

  // ── Service Logs ──────────────────────────────────────────────────────────
  const addServiceLog = useCallback(async (s: Omit<ServiceLog, 'id' | 'status'>) => {
    await api.post('/api/maintenance', {
      vehicleId: Number(s.vehicle_id),
      issue: s.issue_description,
      cost: s.cost,
      date: new Date(s.date).toISOString(),
    });
    await Promise.all([
      api.get<unknown[]>('/api/maintenance').then(raw =>
        setServiceLogs((raw as Record<string, unknown>[]).map(adaptServiceLog))),
      refreshVehicles(),
    ]);
  }, [refreshVehicles]);

  const closeServiceLog = useCallback(async (id: string) => {
    await api.put(`/api/maintenance/${id}`, { status: 'COMPLETED' });
    await Promise.all([
      api.get<unknown[]>('/api/maintenance').then(raw =>
        setServiceLogs((raw as Record<string, unknown>[]).map(adaptServiceLog))),
      refreshVehicles(),
    ]);
  }, [refreshVehicles]);

  // ── Expense Logs ──────────────────────────────────────────────────────────
  const addExpenseLog = useCallback(async (e: Omit<ExpenseLog, 'id'>) => {
    await api.post('/api/expenses', {
      vehicleId: Number(e.vehicle_id),
      tripId: e.trip_id ? Number(e.trip_id) : undefined,
      driverId: e.driver_id ? Number(e.driver_id) : undefined,
      amount: e.fuel_cost,
      category: e.notes || 'Fuel',
      date: new Date(e.date).toISOString(),
    });
    const raw = await api.get<unknown[]>('/api/expenses');
    setExpenseLogs((raw as Record<string, unknown>[]).map(adaptExpenseLog));
  }, []);

  return (
    <FleetContext.Provider value={{
      user, authLoading, login, register, logout,
      vehicles, addVehicle, updateVehicle, deleteVehicle,
      drivers, addDriver, updateDriver, deleteDriver,
      trips, addTrip, dispatchTrip, completeTrip, cancelTrip,
      serviceLogs, addServiceLog, closeServiceLog,
      expenseLogs, addExpenseLog,
      refreshVehicles, refreshDrivers, refreshTrips,
    }}>
      {children}
    </FleetContext.Provider>
  );
};
