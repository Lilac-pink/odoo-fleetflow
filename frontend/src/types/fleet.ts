export type UserRole = 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';
export type VehicleType = 'Truck' | 'Van' | 'Bike';
export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
export type DriverDutyStatus = 'On Duty' | 'Off Duty' | 'Suspended' | 'Taking a Break';
export type ServiceLogStatus = 'Open' | 'Closed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  year: number;
  type: VehicleType;
  max_load_kg: number;
  odometer_km: number;
  status: VehicleStatus;
  acquisition_cost: number;
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: VehicleType;
  license_expiry: string;
  trips_completed: number;
  safety_score: number;
  duty_status: DriverDutyStatus;
  created_at: string;
}

export interface Trip {
  id: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight_kg: number;
  origin: string;
  destination: string;
  estimated_fuel_cost: number;
  revenue?: number;
  final_odometer: number | null;
  status: TripStatus;
  created_at: string;
  completed_at: string | null;
}

export interface ServiceLog {
  id: string;
  vehicle_id: string;
  issue_description: string;
  date: string;
  cost: number;
  status: ServiceLogStatus;
}

export interface ExpenseLog {
  id: string;
  trip_id: string;
  vehicle_id: string;
  driver_id: string;
  distance_km: number;
  fuel_liters: number;
  fuel_cost: number;
  revenue: number;
  notes: string;
  date: string;
}
