import { useState, useMemo } from 'react';
import { useFleet } from '@/contexts/FleetContext';
import { KPICard } from '@/components/KPICard';
import { StatusPill } from '@/components/StatusPill';
import { Truck, Wrench, Gauge, Package, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/animations';

const Dashboard = () => {
  const { vehicles, drivers, trips } = useFleet();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const activeFleet = vehicles.filter(v => v.status === 'On Trip').length;
  const maintenanceAlerts = vehicles.filter(v => v.status === 'In Shop').length;
  const totalVehicles = vehicles.length;
  const utilizationRate = totalVehicles ? Math.round((activeFleet / totalVehicles) * 100) : 0;
  const pendingCargo = trips.filter(t => t.status === 'Draft').length;

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const vehicle = vehicles.find(v => v.id === t.vehicle_id);
      const driver = drivers.find(d => d.id === t.driver_id);
      if (typeFilter !== 'all' && vehicle?.type !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.id.toLowerCase().includes(q) ||
          vehicle?.license_plate.toLowerCase().includes(q) ||
          driver?.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [trips, vehicles, drivers, typeFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      <motion.h1
        className="text-2xl font-bold"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Command Center
      </motion.h1>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <KPICard title="Active Fleet" value={activeFleet} icon={Truck} accent={1} />
        <KPICard title="Maintenance Alerts" value={maintenanceAlerts} icon={Wrench} accent={2} />
        <KPICard title="Utilization Rate" value={`${utilizationRate}%`} icon={Gauge} accent={3} />
        <KPICard title="Pending Cargo" value={pendingCargo} icon={Package} accent={4} />
      </motion.div>

      <Card>
        <CardHeader><CardTitle>Trips Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search trips…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Vehicle Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Truck">Truck</SelectItem>
                <SelectItem value="Van">Van</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Dispatched">Dispatched</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No trips found.</TableCell>
                    </TableRow>
                  ) : filteredTrips.map((t, i) => {
                    const v = vehicles.find(x => x.id === t.vehicle_id);
                    const d = drivers.find(x => x.id === t.driver_id);
                    return (
                      <motion.tr
                        key={t.id}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{t.id}</TableCell>
                        <TableCell>{v ? `${v.make} ${v.model}` : '–'}</TableCell>
                        <TableCell>{d?.name ?? '–'}</TableCell>
                        <TableCell><StatusPill status={t.status} /></TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
