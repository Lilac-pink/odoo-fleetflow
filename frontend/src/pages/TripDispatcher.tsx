import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFleet } from '@/contexts/FleetContext';
import { StatusPill } from '@/components/StatusPill';
import { TableToolbar, GroupHeaderRow } from '@/components/TableToolbar';
import { useTableControls } from '@/hooks/useTableControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, slideUp, scalePop } from '@/lib/animations';
import type { Trip } from '@/types/fleet';

const TripDispatcher = () => {
  const { vehicles, drivers, trips, addTrip, dispatchTrip, completeTrip, cancelTrip } = useFleet();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [completeDialog, setCompleteDialog] = useState<string | null>(null);
  const [finalOdo, setFinalOdo] = useState(0);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState(0);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [fuelCost, setFuelCost] = useState(0);
  const [revenue, setRevenue] = useState(0);

  // Auto-open from dashboard ?open=1
  useEffect(() => {
    if (searchParams.get('open') === '1') {
      setVehicleId(''); setDriverId(''); setCargoWeight(0); setOrigin(''); setDestination(''); setFuelCost(0); setRevenue(0);
      setSheetOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const availableDrivers = drivers.filter(d =>
    d.duty_status !== 'Suspended' && d.duty_status !== 'Taking a Break' && new Date(d.license_expiry) > new Date()
  );

  const tc = useTableControls<Trip>({
    data: trips,
    searchFn: (t, q) =>
      t.id.toLowerCase().includes(q) ||
      t.origin.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      (vehicles.find(v => v.id === t.vehicle_id)?.license_plate.toLowerCase().includes(q) ?? false),
    sortFns: {
      revenue: (a, b) => (a.revenue ?? 0) - (b.revenue ?? 0),
      cargo: (a, b) => a.cargo_weight_kg - b.cargo_weight_kg,
      fuel: (a, b) => (a.estimated_fuel_cost ?? 0) - (b.estimated_fuel_cost ?? 0),
    },
    filterFns: {
      status: (t, val) => t.status === val,
      vehicle_type: (t, val) => vehicles.find(v => v.id === t.vehicle_id)?.type === val,
    },
    groupFn: (t, key) =>
      key === 'status' ? t.status :
        key === 'vehicle_type' ? (vehicles.find(v => v.id === t.vehicle_id)?.type ?? 'Unknown') : '',
  });

  const openNew = () => {
    setVehicleId(''); setDriverId(''); setCargoWeight(0); setOrigin(''); setDestination(''); setFuelCost(0); setRevenue(0);
    setSheetOpen(true);
  };

  const handleDispatch = async () => {
    if (!vehicleId || !driverId || !origin || !destination) { toast.error('Please fill all required fields'); return; }
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle && cargoWeight > vehicle.max_load_kg) { toast.error(`Cargo exceeds ${vehicle.max_load_kg} kg max`); return; }
    try {
      await addTrip({ vehicle_id: vehicleId, driver_id: driverId, cargo_weight_kg: cargoWeight, origin, destination, estimated_fuel_cost: fuelCost, revenue });
      toast.success('Trip created as Draft');
      setSheetOpen(false);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleDispatchTrip = async (id: string) => {
    try {
      await dispatchTrip(id);
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 1800);
      toast.success('Trip dispatched!');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const renderRow = (t: Trip, i: number) => {
    const v = vehicles.find(x => x.id === t.vehicle_id);
    return (
      <motion.tr key={t.id} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }} className="border-b transition-colors hover:bg-muted/50">
        <TableCell className="font-medium">{t.id}</TableCell>
        <TableCell>{v ? `${v.make} ${v.model}` : '–'}</TableCell>
        <TableCell>{t.origin}</TableCell>
        <TableCell>{t.destination}</TableCell>
        <TableCell>${(t.revenue ?? 0).toLocaleString()}</TableCell>
        <TableCell>{t.cargo_weight_kg} kg</TableCell>
        <TableCell><StatusPill status={t.status} /></TableCell>
        <TableCell className="text-right space-x-1">
          {t.status === 'Draft' && (
            <Button size="sm" onClick={() => handleDispatchTrip(t.id)}>
              <AnimatePresence mode="wait">
                {successId === t.id
                  ? <motion.span key="check" variants={scalePop} initial="hidden" animate="visible" className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Done</motion.span>
                  : <motion.span key="label">Dispatch</motion.span>}
              </AnimatePresence>
            </Button>
          )}
          {t.status === 'Dispatched' && <Button size="sm" variant="outline" onClick={() => { setFinalOdo(0); setCompleteDialog(t.id); }}>Complete</Button>}
          {(t.status === 'Draft' || t.status === 'Dispatched') && (
            <Button size="sm" variant="ghost" onClick={async () => { try { await cancelTrip(t.id); toast.success('Cancelled'); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } }}>Cancel</Button>
          )}
        </TableCell>
      </motion.tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>Trip Dispatcher</motion.h1>
        <motion.div whileTap={{ scale: 0.95 }}><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New Trip</Button></motion.div>
      </div>

      <Card>
        <CardHeader>
          <TableToolbar
            search={tc.search} onSearchChange={tc.setSearch}
            sort={tc.sort} onToggleSort={tc.toggleSort}
            sortOptions={[{ key: 'revenue', label: 'Revenue' }, { key: 'cargo', label: 'Cargo Weight' }, { key: 'fuel', label: 'Fuel Cost' }]}
            filters={tc.filters} onFilterChange={tc.setFilter}
            filterDefs={[
              { key: 'status', label: 'Status', options: [{ label: 'Draft', value: 'Draft' }, { label: 'Dispatched', value: 'Dispatched' }, { label: 'Completed', value: 'Completed' }, { label: 'Cancelled', value: 'Cancelled' }] },
              { key: 'vehicle_type', label: 'Vehicle Type', options: [{ label: 'Truck', value: 'Truck' }, { label: 'Van', value: 'Van' }, { label: 'Bike', value: 'Bike' }] },
            ]}
            groupBy={tc.groupBy} onGroupByChange={tc.setGroupBy}
            groupByOptions={[{ key: 'status', label: 'Status' }, { key: 'vehicle_type', label: 'Vehicle Type' }]}
            placeholder="Search trips…"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead><TableHead>Vehicle</TableHead><TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead><TableHead>Revenue</TableHead><TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {tc.grouped ? (
                  tc.grouped.length === 0
                    ? <TableRow key="empty"><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No trips found.</TableCell></TableRow>
                    : tc.grouped.map(({ group, items }) => (
                      <>
                        <GroupHeaderRow key={`hdr-${group}`} label={group} count={items.length} colSpan={8} />
                        {items.map((t, i) => renderRow(t, i))}
                      </>
                    ))
                ) : (
                  tc.processed.length === 0
                    ? <TableRow key="empty"><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No trips found.</TableCell></TableRow>
                    : tc.processed.map((t, i) => renderRow(t, i))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>New Trip</SheetTitle></SheetHeader>
          <motion.div variants={slideUp} initial="hidden" animate="visible" className="mt-6 space-y-4">
            <div className="space-y-2"><Label>Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger><SelectValue placeholder="Select available vehicle" /></SelectTrigger>
                <SelectContent>{availableVehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Driver</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger><SelectValue placeholder="Select available driver" /></SelectTrigger>
                <SelectContent>{availableDrivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Cargo Weight (kg)</Label><Input type="number" value={cargoWeight} onChange={e => setCargoWeight(+e.target.value)} /></div>
            <div className="space-y-2"><Label>Origin</Label><Input value={origin} onChange={e => setOrigin(e.target.value)} /></div>
            <div className="space-y-2"><Label>Destination</Label><Input value={destination} onChange={e => setDestination(e.target.value)} /></div>
            <div className="space-y-2"><Label>Estimated Fuel Cost</Label><Input type="number" value={fuelCost} onChange={e => setFuelCost(+e.target.value)} /></div>
            <div className="space-y-2"><Label>Expected Revenue</Label><Input type="number" value={revenue} onChange={e => setRevenue(+e.target.value)} /></div>
            <div className="flex gap-3 pt-4">
              <motion.div className="flex-1" whileTap={{ scale: 0.97 }}><Button className="w-full" onClick={handleDispatch}>Confirm &amp; Create</Button></motion.div>
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Trip</DialogTitle></DialogHeader>
          <div className="space-y-2"><Label>Final Odometer (km)</Label><Input type="number" value={finalOdo} onChange={e => setFinalOdo(+e.target.value)} /></div>
          <DialogFooter>
            <Button onClick={async () => { try { await completeTrip(completeDialog!, finalOdo); toast.success('Trip completed'); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } setCompleteDialog(null); }}>Mark Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripDispatcher;
