import { useEffect, useState } from 'react';
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Vehicle, VehicleType, VehicleStatus } from '@/types/fleet';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { slideLeft, shake, fadeScale } from '@/lib/animations';

const empty = {
  license_plate: '', make: '', model: '', year: new Date().getFullYear(),
  type: 'Truck' as VehicleType, max_load_kg: 0, odometer_km: 0,
  status: 'Available' as VehicleStatus, acquisition_cost: 0,
};

const VehicleRegistry = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useFleet();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTrigger, setDeleteTrigger] = useState(0);

  // Auto-open sheet when navigated from dashboard with ?open=1
  useEffect(() => {
    if (searchParams.get('open') === '1') {
      setEditing(null); setForm(empty); setSheetOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const tc = useTableControls({
    data: vehicles,
    searchFn: (v, q) =>
      v.license_plate.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q),
    sortFns: {
      make: (a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`),
      year: (a, b) => a.year - b.year,
      odometer: (a, b) => a.odometer_km - b.odometer_km,
      acquisition: (a, b) => a.acquisition_cost - b.acquisition_cost,
      max_load: (a, b) => a.max_load_kg - b.max_load_kg,
    },
    filterFns: {
      type: (v, val) => v.type === val,
      status: (v, val) => v.status === val,
    },
    groupFn: (v, key) =>
      key === 'type' ? v.type :
        key === 'status' ? v.status : '',
  });

  const openNew = () => { setEditing(null); setForm(empty); setSheetOpen(true); };
  const openEdit = (v: Vehicle) => { setEditing(v); setForm(v); setSheetOpen(true); };

  const save = async () => {
    if (!form.license_plate) { toast.error('License plate is required'); return; }
    const dup = vehicles.find(v => v.license_plate === form.license_plate && v.id !== editing?.id);
    if (dup) { toast.error('License plate must be unique'); return; }
    try {
      if (editing) { await updateVehicle(editing.id, form); toast.success('Vehicle updated'); }
      else { await addVehicle(form); toast.success('Vehicle added'); }
      setSheetOpen(false);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Save failed'); }
  };

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const renderRow = (v: Vehicle, i: number) => (
    <motion.tr
      key={v.id}
      variants={slideLeft}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: i * 0.04 }}
      className="border-b transition-colors hover:bg-muted/50"
    >
      <TableCell className="font-medium">{v.license_plate}</TableCell>
      <TableCell>{v.make} {v.model}</TableCell>
      <TableCell>{v.year}</TableCell>
      <TableCell>{v.type}</TableCell>
      <TableCell>{v.max_load_kg.toLocaleString()} kg</TableCell>
      <TableCell>{v.odometer_km.toLocaleString()} km</TableCell>
      <TableCell>${v.acquisition_cost.toLocaleString()}</TableCell>
      <TableCell><StatusPill status={v.status} /></TableCell>
      <TableCell className="text-right space-x-1">
        <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
        {(v.status === 'Available' || v.status === 'On Trip') && (
          <Button variant="ghost" size="sm" onClick={async () => {
            try { await updateVehicle(v.id, { status: 'Retired' }); toast.success('Vehicle retired'); }
            catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
          }}>Retire</Button>
        )}
        {v.status === 'Retired' && (
          <Button variant="ghost" size="sm" onClick={async () => {
            try { await updateVehicle(v.id, { status: 'Available' }); toast.success('Reactivated'); }
            catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
          }}>Reactivate</Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => setDeleteId(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </TableCell>
    </motion.tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          Vehicle Registry
        </motion.h1>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />New Vehicle</Button>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <TableToolbar
            search={tc.search} onSearchChange={tc.setSearch}
            sort={tc.sort} onToggleSort={tc.toggleSort}
            sortOptions={[
              { key: 'make', label: 'Make / Model' },
              { key: 'year', label: 'Year' },
              { key: 'odometer', label: 'Odometer' },
              { key: 'acquisition', label: 'Acquisition Cost' },
              { key: 'max_load', label: 'Max Load' },
            ]}
            filters={tc.filters} onFilterChange={tc.setFilter}
            filterDefs={[
              { key: 'type', label: 'Type', options: [{ label: 'Truck', value: 'Truck' }, { label: 'Van', value: 'Van' }, { label: 'Bike', value: 'Bike' }] },
              { key: 'status', label: 'Status', options: [{ label: 'Available', value: 'Available' }, { label: 'On Trip', value: 'On Trip' }, { label: 'In Shop', value: 'In Shop' }, { label: 'Retired', value: 'Retired' }] },
            ]}
            groupBy={tc.groupBy} onGroupByChange={tc.setGroupBy}
            groupByOptions={[{ key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }]}
            placeholder="Search vehicles…"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead><TableHead>Make/Model</TableHead><TableHead>Year</TableHead>
                <TableHead>Type</TableHead><TableHead>Max Load</TableHead><TableHead>Odometer</TableHead>
                <TableHead>Acq. Cost</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {tc.grouped ? (
                  tc.grouped.length === 0
                    ? <TableRow key="empty"><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No vehicles found.</TableCell></TableRow>
                    : tc.grouped.map(({ group, items }) => (
                      <>
                        <GroupHeaderRow key={`hdr-${group}`} label={group} count={items.length} colSpan={9} />
                        {items.map((v, i) => renderRow(v, i))}
                      </>
                    ))
                ) : (
                  tc.processed.length === 0
                    ? <TableRow key="empty"><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No vehicles found.</TableCell></TableRow>
                    : tc.processed.map((v, i) => renderRow(v, i))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>{editing ? 'Edit Vehicle' : 'New Vehicle'}</SheetTitle></SheetHeader>
          <motion.div variants={fadeScale} initial="hidden" animate="visible" className="mt-6 space-y-4">
            <div className="space-y-2"><Label>License Plate *</Label><Input value={form.license_plate} onChange={e => set('license_plate', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Make</Label><Input value={form.make} onChange={e => set('make', e.target.value)} /></div>
              <div className="space-y-2"><Label>Model</Label><Input value={form.model} onChange={e => set('model', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Year</Label><Input type="number" value={form.year} onChange={e => set('year', +e.target.value)} /></div>
              <div className="space-y-2"><Label>Type</Label>
                <Select value={form.type} onValueChange={v => set('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Truck">Truck</SelectItem><SelectItem value="Van">Van</SelectItem><SelectItem value="Bike">Bike</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Max Load (kg)</Label><Input type="number" value={form.max_load_kg} onChange={e => set('max_load_kg', +e.target.value)} /></div>
              <div className="space-y-2"><Label>Odometer (km)</Label><Input type="number" value={form.odometer_km} onChange={e => set('odometer_km', +e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Acquisition Cost</Label><Input type="number" value={form.acquisition_cost} onChange={e => set('acquisition_cost', +e.target.value)} /></div>
            <div className="flex gap-3 pt-4">
              <motion.div className="flex-1" whileTap={{ scale: 0.97 }}><Button className="w-full" onClick={save}>Save</Button></motion.div>
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Vehicle?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <motion.div key={deleteTrigger} animate={deleteTrigger > 0 ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
              <AlertDialogAction onClick={async () => {
                const err = await deleteVehicle(deleteId!);
                if (err) { setDeleteTrigger(n => n + 1); toast.error(err); }
                else { toast.success('Vehicle deleted'); setDeleteId(null); }
              }} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </motion.div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleRegistry;
