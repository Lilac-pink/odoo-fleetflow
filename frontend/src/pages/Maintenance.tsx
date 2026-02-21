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
import { Plus, Search, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, slideUp, scalePop } from '@/lib/animations';

const Maintenance = () => {
  const { vehicles, serviceLogs, addServiceLog, closeServiceLog } = useFleet();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [issue, setIssue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState(0);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const filtered = serviceLogs.filter(s => {
    const q = search.toLowerCase();
    const v = vehicles.find(x => x.id === s.vehicle_id);
    return !q || s.issue_description.toLowerCase().includes(q) || v?.license_plate.toLowerCase().includes(q);
  });

  const save = async () => {
    if (!vehicleId || !issue) { toast.error('Please fill required fields'); return; }
    try {
      await addServiceLog({ vehicle_id: vehicleId, issue_description: issue, date, cost });
      toast.success('Service log created – vehicle moved to "In Shop"');
      setSheetOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create service log');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await closeServiceLog(id);
      setResolvedId(id);
      setTimeout(() => setResolvedId(null), 1600);
      toast.success('Service resolved – vehicle available');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          Maintenance &amp; Service Logs
        </motion.h1>
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button onClick={() => { setVehicleId(''); setIssue(''); setCost(0); setDate(new Date().toISOString().slice(0, 10)); setSheetOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />New Service
          </Button>
        </motion.div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Log ID</TableHead><TableHead>Vehicle</TableHead><TableHead>Issue / Service</TableHead>
                <TableHead>Date</TableHead><TableHead>Cost</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <TableRow key="empty"><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No service logs found.</TableCell></TableRow>
                ) : filtered.map((s, i) => {
                  const v = vehicles.find(x => x.id === s.vehicle_id);
                  return (
                    <motion.tr
                      key={s.id}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{s.id}</TableCell>
                      <TableCell>{v ? `${v.make} ${v.model}` : '–'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{s.issue_description}</TableCell>
                      <TableCell>{s.date}</TableCell>
                      <TableCell>${s.cost.toLocaleString()}</TableCell>
                      <TableCell><StatusPill status={s.status} /></TableCell>
                      <TableCell className="text-right">
                        {s.status === 'Open' && (
                          <Button size="sm" variant="outline" onClick={() => handleResolve(s.id)} className="relative overflow-hidden">
                            <AnimatePresence mode="wait">
                              {resolvedId === s.id ? (
                                <motion.span key="check" variants={scalePop} initial="hidden" animate="visible" className="flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4 text-success" /> Resolved
                                </motion.span>
                              ) : (
                                <motion.span key="label" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>Resolve</motion.span>
                              )}
                            </AnimatePresence>
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>New Service Log</SheetTitle></SheetHeader>
          <motion.div variants={slideUp} initial="hidden" animate="visible" className="mt-6 space-y-4">
            <div className="space-y-2"><Label>Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Issue / Service Type</Label><Input value={issue} onChange={e => setIssue(e.target.value)} /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Cost</Label><Input type="number" value={cost} onChange={e => setCost(+e.target.value)} /></div>
            <div className="flex gap-3 pt-4">
              <motion.div className="flex-1" whileTap={{ scale: 0.97 }}><Button className="w-full" onClick={save}>Create</Button></motion.div>
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Maintenance;
