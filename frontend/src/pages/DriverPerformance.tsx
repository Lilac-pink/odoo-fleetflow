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
import { Plus, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';
import type { Driver, VehicleType, DriverDutyStatus } from '@/types/fleet';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, slideUp, shake } from '@/lib/animations';

const emptyForm = { name: '', license_number: '', license_category: 'Truck' as VehicleType, license_expiry: '', safety_score: 5, duty_status: 'Off Duty' as DriverDutyStatus };

const DriverPerformance = () => {
  const { drivers, addDriver, updateDriver, deleteDriver, trips } = useFleet();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTrigger, setDeleteTrigger] = useState(0);

  const totalTrips = drivers.reduce((s, d) => s + d.trips_completed, 0);

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.license_number.toLowerCase().includes(q);
  });

  const openNew = () => { setEditing(null); setForm(emptyForm); setSheetOpen(true); };
  const openEdit = (d: Driver) => {
    setEditing(d);
    setForm({ name: d.name, license_number: d.license_number, license_category: d.license_category, license_expiry: d.license_expiry, safety_score: d.safety_score, duty_status: d.duty_status });
    setSheetOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.license_number || !form.license_expiry) { toast.error('Fill all required fields'); return; }
    try {
      if (editing) { await updateDriver(editing.id, form); toast.success('Driver updated'); }
      else { await addDriver(form); toast.success('Driver added'); }
      setSheetOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const isExpired = (d: string) => new Date(d) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          Driver Performance &amp; Safety
        </motion.h1>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Add Driver</Button>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search drivers…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>License No.</TableHead><TableHead>Expiry</TableHead>
                <TableHead>Trips</TableHead><TableHead>Rate</TableHead><TableHead>Safety</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <TableRow key="empty"><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No drivers found.</TableCell></TableRow>
                ) : filtered.map((d, i) => (
                  <motion.tr
                    key={d.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.license_number}</TableCell>
                    <TableCell>
                      <span className={isExpired(d.license_expiry) ? 'text-destructive font-semibold' : ''}>{d.license_expiry}</span>
                      {isExpired(d.license_expiry) && <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-destructive" />}
                    </TableCell>
                    <TableCell>{d.trips_completed}</TableCell>
                    <TableCell>{totalTrips ? `${Math.round((d.trips_completed / totalTrips) * 100)}%` : '0%'}</TableCell>
                    <TableCell>
                      <motion.span
                        className={`font-semibold ${d.safety_score >= 7 ? 'text-success' : d.safety_score >= 4 ? 'text-warning' : 'text-destructive'}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 + 0.2, type: 'spring', stiffness: 300 }}
                      >
                        {d.safety_score}/10
                      </motion.span>
                    </TableCell>
                    <TableCell><StatusPill status={d.duty_status} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>{editing ? 'Edit Driver' : 'Add Driver'}</SheetTitle></SheetHeader>
          <motion.div variants={slideUp} initial="hidden" animate="visible" className="mt-6 space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="space-y-2"><Label>License Number *</Label><Input value={form.license_number} onChange={e => set('license_number', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.license_category} onValueChange={v => set('license_category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Truck">Truck</SelectItem><SelectItem value="Van">Van</SelectItem><SelectItem value="Bike">Bike</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Expiry Date *</Label><Input type="date" value={form.license_expiry} onChange={e => set('license_expiry', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Safety Score (0-10)</Label><Input type="number" min={0} max={10} step={0.1} value={form.safety_score} onChange={e => set('safety_score', +e.target.value)} /></div>
              <div className="space-y-2"><Label>Duty Status</Label>
                <Select value={form.duty_status} onValueChange={v => set('duty_status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On Duty">On Duty</SelectItem>
                    <SelectItem value="Off Duty">Off Duty</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Taking a Break">Taking a Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <motion.div className="flex-1" whileTap={{ scale: 0.97 }}><Button className="w-full" onClick={save}>Save</Button></motion.div>
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Driver?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <motion.div
              key={deleteTrigger}
              variants={shake}
              animate={deleteTrigger > 0 ? 'animate' : 'initial'}
            >
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={async () => {
                  try { await deleteDriver(deleteId!); toast.success('Driver deleted'); }
                  catch (e: unknown) { setDeleteTrigger(n => n + 1); toast.error(e instanceof Error ? e.message : 'Delete failed'); }
                  setDeleteId(null);
                }}
              >Delete</AlertDialogAction>
            </motion.div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DriverPerformance;
