import { useMemo, useState } from 'react';
import { useFleet } from '@/contexts/FleetContext';
import { TableToolbar, GroupHeaderRow } from '@/components/TableToolbar';
import { useTableControls } from '@/hooks/useTableControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { ExpenseLog } from '@/types/fleet';

const ExpenseFuel = () => {
  const { vehicles, drivers, trips, expenseLogs, addExpenseLog, serviceLogs } = useFleet();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tripId, setTripId] = useState('');
  const [distance, setDistance] = useState(0);
  const [fuelCost, setFuelCost] = useState(0);
  const [fuelLiters, setFuelLiters] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const completedTrips = trips.filter(t => t.status === 'Completed');
  const selectedTrip = trips.find(t => t.id === tripId);

  const tc = useTableControls<ExpenseLog>({
    data: expenseLogs,
    searchFn: (e, q) => {
      const d = drivers.find(x => x.id === e.driver_id);
      return e.trip_id.toLowerCase().includes(q) || (d?.name.toLowerCase().includes(q) ?? false);
    },
    sortFns: {
      date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      fuel_cost: (a, b) => a.fuel_cost - b.fuel_cost,
      distance: (a, b) => a.distance_km - b.distance_km,
    },
    filterFns: {
      vehicle: (e, val) => e.vehicle_id === val,
    },
    groupFn: (e, key) =>
      key === 'vehicle' ? (vehicles.find(v => v.id === e.vehicle_id) ? `${vehicles.find(v => v.id === e.vehicle_id)!.make} ${vehicles.find(v => v.id === e.vehicle_id)!.model}` : 'Unknown') : '',
  });

  const vehicleSummary = useMemo(() => {
    return vehicles.map(v => {
      const totalFuel = expenseLogs.filter(e => e.vehicle_id === v.id).reduce((s, e) => s + e.fuel_cost, 0);
      const totalMaint = serviceLogs.filter(s => s.vehicle_id === v.id).reduce((s, l) => s + l.cost, 0);
      return { ...v, totalFuel, totalMaint, totalOps: totalFuel + totalMaint };
    }).filter(v => v.totalOps > 0);
  }, [vehicles, expenseLogs, serviceLogs]);

  const save = () => {
    if (!tripId) { toast.error('Select a trip'); return; }
    const trip = trips.find(t => t.id === tripId)!;
    addExpenseLog({ trip_id: tripId, vehicle_id: trip.vehicle_id, driver_id: trip.driver_id, distance_km: distance, fuel_liters: fuelLiters, fuel_cost: fuelCost, revenue, notes, date });
    toast.success('Expense added');
    setSheetOpen(false);
  };

  const renderRow = (e: ExpenseLog, i: number) => {
    const d = drivers.find(x => x.id === e.driver_id);
    return (
      <TableRow key={e.id}>
        <TableCell className="font-medium">{e.trip_id}</TableCell>
        <TableCell>{d?.name ?? '–'}</TableCell>
        <TableCell>{e.distance_km} km</TableCell>
        <TableCell>${e.fuel_cost.toLocaleString()}</TableCell>
        <TableCell>{e.fuel_liters} L</TableCell>
        <TableCell className="max-w-[200px] truncate">{e.notes}</TableCell>
        <TableCell>{e.date}</TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expense &amp; Fuel Logging</h1>
        <Button onClick={() => { setTripId(''); setDistance(0); setFuelCost(0); setFuelLiters(0); setRevenue(0); setNotes(''); setSheetOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <TableToolbar
            search={tc.search} onSearchChange={tc.setSearch}
            sort={tc.sort} onToggleSort={tc.toggleSort}
            sortOptions={[{ key: 'date', label: 'Date' }, { key: 'fuel_cost', label: 'Fuel Cost' }, { key: 'distance', label: 'Distance' }]}
            filters={tc.filters} onFilterChange={tc.setFilter}
            filterDefs={[
              { key: 'vehicle', label: 'Vehicle', options: vehicles.map(v => ({ label: `${v.make} ${v.model}`, value: v.id })) },
            ]}
            groupBy={tc.groupBy} onGroupByChange={tc.setGroupBy}
            groupByOptions={[{ key: 'vehicle', label: 'Vehicle' }]}
            placeholder="Search expenses…"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead><TableHead>Driver</TableHead><TableHead>Distance</TableHead>
                <TableHead>Fuel Cost</TableHead><TableHead>Liters</TableHead><TableHead>Notes</TableHead><TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tc.grouped ? (
                tc.grouped.length === 0
                  ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No expenses found.</TableCell></TableRow>
                  : tc.grouped.map(({ group, items }) => (
                    <>
                      <GroupHeaderRow key={`hdr-${group}`} label={group} count={items.length} colSpan={7} />
                      {items.map((e, i) => renderRow(e, i))}
                    </>
                  ))
              ) : (
                tc.processed.length === 0
                  ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No expenses found.</TableCell></TableRow>
                  : tc.processed.map((e, i) => renderRow(e, i))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {vehicleSummary.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Vehicle Cost Summary</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Vehicle</TableHead><TableHead>Total Fuel</TableHead><TableHead>Total Maintenance</TableHead><TableHead>Total Operational</TableHead></TableRow></TableHeader>
              <TableBody>
                {vehicleSummary.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>{v.make} {v.model}</TableCell>
                    <TableCell>${v.totalFuel.toLocaleString()}</TableCell>
                    <TableCell>${v.totalMaint.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">${v.totalOps.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Add Expense</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2"><Label>Trip</Label>
              <Select value={tripId} onValueChange={setTripId}>
                <SelectTrigger><SelectValue placeholder="Select completed trip" /></SelectTrigger>
                <SelectContent>{completedTrips.map(t => <SelectItem key={t.id} value={t.id}>{t.id} – {t.origin} → {t.destination}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedTrip && <p className="text-sm text-muted-foreground">Driver: {drivers.find(d => d.id === selectedTrip.driver_id)?.name}</p>}
            <div className="space-y-2"><Label>Distance (km)</Label><Input type="number" value={distance} onChange={e => setDistance(+e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fuel (liters)</Label><Input type="number" value={fuelLiters} onChange={e => setFuelLiters(+e.target.value)} /></div>
              <div className="space-y-2"><Label>Fuel Cost</Label><Input type="number" value={fuelCost} onChange={e => setFuelCost(+e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Revenue (optional)</Label><Input type="number" value={revenue} onChange={e => setRevenue(+e.target.value)} /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={save}>Create</Button>
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ExpenseFuel;
