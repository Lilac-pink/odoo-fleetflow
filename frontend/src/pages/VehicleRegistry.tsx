import { useState } from 'react';
import { useFleet } from '@/contexts/FleetContext';
import { StatusPill } from '@/components/StatusPill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import type { Vehicle, VehicleType, VehicleStatus } from '@/types/fleet';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { slideLeft, staggerContainer, shake, fadeScale } from '@/lib/animations';

const empty = { license_plate: '', make: '', model: '', year: new Date().getFullYear(), type: 'Truck' as VehicleType, max_load_kg: 0, odometer_km: 0, status: 'Available' as VehicleStatus, acquisition_cost: 0 };

const VehicleRegistry = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useFleet();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTrigger, setDeleteTrigger] = useState(0);

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    return !q || v.license_plate.toLowerCase().includes(q) || v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const err = await deleteVehicle(deleteId);
    if (err) { setDeleteTrigger(n => n + 1); toast.error(err); }
    else toast.success('Vehicle deleted');
    setDeleteId(null);
  };

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search vehicles…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Plate</TableHead><TableHead>Make/Model</TableHead>
                <TableHead>Year</TableHead><TableHead>Type</TableHead><TableHead>Max Load</TableHead>
                <TableHead>Odometer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <TableRow key="empty">
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No vehicles found. Add your first vehicle.</TableCell>
                  </TableRow>
                ) : filtered.map((v, i) => (
                  <motion.tr
                    key={v.id}
                    variants={slideLeft}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{v.id}</TableCell>
                    <TableCell>{v.license_plate}</TableCell>
                    <TableCell>{v.make} {v.model}</TableCell>
                    <TableCell>{v.year}</TableCell>
                    <TableCell>{v.type}</TableCell>
                    <TableCell>{v.max_load_kg.toLocaleString()} kg</TableCell>
                    <TableCell>{v.odometer_km.toLocaleString()} km</TableCell>
                    <TableCell><StatusPill status={v.status} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(v)}><Pencil className="h-4 w-4" /></Button>
                      {(v.status === 'Available' || v.status === 'On Trip') && (
                        <Button variant="ghost" size="sm" onClick={async () => { try { await updateVehicle(v.id, { status: 'Retired' }); toast.success('Vehicle retired'); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } }}>Retire</Button>
                      )}
                      {v.status === 'Retired' && (
                        <Button variant="ghost" size="sm" onClick={async () => { try { await updateVehicle(v.id, { status: 'Available' }); toast.success('Vehicle reactivated'); } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); } }}>Reactivate</Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Sheet */}
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

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Vehicle?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <motion.div key={deleteTrigger} animate={deleteTrigger > 0 ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </motion.div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleRegistry;
