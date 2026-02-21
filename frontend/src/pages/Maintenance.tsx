import { useState } from 'react';
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
import { Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, slideUp, scalePop } from '@/lib/animations';
import type { ServiceLog } from '@/types/fleet';

const Maintenance = () => {
  const { vehicles, serviceLogs, addServiceLog, closeServiceLog } = useFleet();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [issue, setIssue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState(0);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const tc = useTableControls<ServiceLog>({
    data: serviceLogs,
    searchFn: (s, q) => {
      const v = vehicles.find(x => x.id === s.vehicle_id);
      return s.issue_description.toLowerCase().includes(q) || (v?.license_plate.toLowerCase().includes(q) ?? false);
    },
    sortFns: {
      date: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      cost: (a, b) => a.cost - b.cost,
    },
    filterFns: {
      status: (s, val) => s.status === val,
      vehicle: (s, val) => s.vehicle_id === val,
    },
    groupFn: (s, key) =>
      key === 'status' ? s.status :
        key === 'vehicle' ? (vehicles.find(v => v.id === s.vehicle_id)?.license_plate ?? 'Unknown') : '',
  });

  const save = async () => {
    if (!vehicleId || !issue) { toast.error('Please fill required fields'); return; }
    try {
      await addServiceLog({ vehicle_id: vehicleId, issue_description: issue, date, cost });
      toast.success('Service log created – vehicle moved to "In Shop"');
      setSheetOpen(false);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const handleResolve = async (id: string) => {
    try {
      await closeServiceLog(id);
      setResolvedId(id);
      setTimeout(() => setResolvedId(null), 1600);
      toast.success('Service resolved – vehicle available');
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  const renderRow = (s: ServiceLog, i: number) => {
    const v = vehicles.find(x => x.id === s.vehicle_id);
    return (
      <motion.tr key={s.id} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }} className="border-b transition-colors hover:bg-muted/50">
        <TableCell className="font-medium">{v?.license_plate ?? '–'}</TableCell>
        <TableCell>{v ? `${v.make} ${v.model}` : '–'}</TableCell>
        <TableCell className="max-w-[200px] truncate">{s.issue_description}</TableCell>
        <TableCell>${s.cost.toLocaleString()}</TableCell>
        <TableCell>{s.date}</TableCell>
        <TableCell><StatusPill status={s.status} /></TableCell>
        <TableCell className="text-right">
          {s.status === 'Open' && (
            <Button size="sm" variant="outline" onClick={() => handleResolve(s.id)}>
              <AnimatePresence mode="wait">
                {resolvedId === s.id
                  ? <motion.span key="done" variants={scalePop} initial="hidden" animate="visible" className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" /> Resolved</motion.span>
                  : <motion.span key="btn">Resolve</motion.span>}
              </AnimatePresence>
            </Button>
          )}
        </TableCell>
      </motion.tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>Maintenance &amp; Service Logs</motion.h1>
        <motion.div whileTap={{ scale: 0.95 }}><Button onClick={() => { setVehicleId(''); setIssue(''); setDate(new Date().toISOString().slice(0, 10)); setCost(0); setSheetOpen(true); }}><Plus className="mr-2 h-4 w-4" />New Log</Button></motion.div>
      </div>

      <Card>
        <CardHeader>
          <TableToolbar
            search={tc.search} onSearchChange={tc.setSearch}
            sort={tc.sort} onToggleSort={tc.toggleSort}
            sortOptions={[{ key: 'date', label: 'Date' }, { key: 'cost', label: 'Cost' }]}
            filters={tc.filters} onFilterChange={tc.setFilter}
            filterDefs={[
              { key: 'status', label: 'Status', options: [{ label: 'Open', value: 'Open' }, { label: 'Resolved', value: 'Resolved' }] },
              { key: 'vehicle', label: 'Vehicle', options: vehicles.map(v => ({ label: `${v.make} ${v.model} (${v.license_plate})`, value: v.id })) },
            ]}
            groupBy={tc.groupBy} onGroupByChange={tc.setGroupBy}
            groupByOptions={[{ key: 'status', label: 'Status' }, { key: 'vehicle', label: 'Vehicle' }]}
            placeholder="Search logs…"
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead><TableHead>Vehicle</TableHead><TableHead>Issue</TableHead>
                <TableHead>Cost</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {tc.grouped ? (
                  tc.grouped.length === 0
                    ? <TableRow key="empty"><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No logs found.</TableCell></TableRow>
                    : tc.grouped.map(({ group, items }) => (
                      <>
                        <GroupHeaderRow key={`hdr-${group}`} label={group} count={items.length} colSpan={7} />
                        {items.map((s, i) => renderRow(s, i))}
                      </>
                    ))
                ) : (
                  tc.processed.length === 0
                    ? <TableRow key="empty"><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No logs found.</TableCell></TableRow>
                    : tc.processed.map((s, i) => renderRow(s, i))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader><SheetTitle>New Service Log</SheetTitle></SheetHeader>
          <motion.div variants={slideUp} initial="hidden" animate="visible" className="mt-6 space-y-4">
            <div className="space-y-2"><Label>Vehicle *</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.license_plate})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Issue Description *</Label><Input value={issue} onChange={e => setIssue(e.target.value)} /></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Estimated Cost</Label><Input type="number" value={cost} onChange={e => setCost(+e.target.value)} /></div>
            <div className="flex gap-3 pt-4">
              <motion.div className="flex-1" whileTap={{ scale: 0.97 }}><Button className="w-full" onClick={save}>Create Log</Button></motion.div>
              <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Maintenance;
