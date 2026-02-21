import { useEffect, useState, useCallback } from 'react';
import { useFleet } from '@/contexts/FleetContext';
import { KPICard } from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Gauge, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, fadeUp } from '@/lib/animations';

// ── Types from the analytics API ──────────────────────────────────────────────
interface Metrics {
  totalFuelCost: number;
  totalMaintenanceCost: number;
  fleetRoiPercent: string;
  averageUtilizationRate: number;
  costPerKm: string;
}

interface FuelEfficiencyPoint {
  month: string;
  kmPerLiter: string | number;
  totalLiters: number;
  totalDistance: number;
}

interface VehicleRoi {
  vehicleId: number;
  licensePlate: string;
  model: string;
  acquisitionCost: number;
  totalRevenue: number;
  totalCosts: number;
  roiPercent: string;
}

const Analytics = () => {
  const { serviceLogs } = useFleet();

  /** Safely format an ROI percent value that may arrive as a string like "-0.00" */
  const formatROI = (val: string | number | undefined | null): string => {
    const n = Number(val ?? 0);
    if (!isFinite(n)) return '0.00';
    // Collapse -0 to 0
    const clean = Object.is(n, -0) ? 0 : n;
    return clean.toFixed(2);
  };

  // API-sourced state
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [fuelTrend, setFuelTrend] = useState<FuelEfficiencyPoint[]>([]);
  const [vehicleRoi, setVehicleRoi] = useState<VehicleRoi[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportState, setExportState] = useState<'idle' | 'exporting' | 'done'>('idle');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [m, ft, vr] = await Promise.all([
        api.get<Metrics>('/api/analytics/metrics'),
        api.get<FuelEfficiencyPoint[]>('/api/analytics/fuel-efficiency'),
        api.get<VehicleRoi[]>('/api/analytics/vehicle-roi'),
      ]);
      setMetrics(m);
      setFuelTrend(ft);
      setVehicleRoi(vr);
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Total maintenance cost still comes from the context (same source as Maintenance page)
  const totalMaint = serviceLogs.reduce((s, l) => s + l.cost, 0);

  // Costliest vehicles bar chart — derived from vehicleRoi
  const costliestVehicles = [...vehicleRoi]
    .sort((a, b) => b.totalCosts - a.totalCosts)
    .slice(0, 5)
    .map(v => ({ name: v.model || v.licensePlate, cost: v.totalCosts }));

  const exportCSV = async () => {
    setExportState('exporting');
    const rows = [['Vehicle', 'License Plate', 'Revenue', 'Total Costs', 'Acquisition', 'ROI %']];
    vehicleRoi.forEach(v => rows.push([
      v.model, v.licensePlate, String(v.totalRevenue),
      String(v.totalCosts), String(v.acquisitionCost), String(v.roiPercent),
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fleet-report.csv'; a.click();
    URL.revokeObjectURL(url);
    setExportState('done');
    setTimeout(() => setExportState('idle'), 2000);
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = vehicleRoi.map(v =>
      `<tr><td>${v.model}</td><td>${v.licensePlate}</td><td>$${v.totalRevenue}</td><td>$${v.totalCosts}</td><td>$${v.acquisitionCost}</td><td>${v.roiPercent}%</td></tr>`
    ).join('');
    printWindow.document.write(`<html><head><title>FleetFlow Report</title><style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#2563EB;color:#fff}h1{color:#1E293B}</style></head><body><h1>FleetFlow Financial Report</h1><p>Total Fuel: $${metrics?.totalFuelCost ?? 0} | Total Maintenance: $${metrics?.totalMaintenanceCost ?? 0} | Fleet ROI: ${metrics?.fleetRoiPercent ?? 0}%</p><table><tr><th>Vehicle</th><th>Plate</th><th>Revenue</th><th>Costs</th><th>Acquisition</th><th>ROI</th></tr>${rows}</table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 className="text-2xl font-bold" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          Analytics &amp; Reports
        </motion.h1>
        <div className="flex gap-2">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={exportCSV} disabled={exportState !== 'idle'}>
              <AnimatePresence mode="wait">
                {exportState === 'exporting' && <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Exporting…</motion.span>}
                {exportState === 'done' && <motion.span key="done" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Done!</motion.span>}
                {exportState === 'idle' && <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Download className="h-4 w-4" /> Export CSV</motion.span>}
              </AnimatePresence>
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={exportPDF}><Download className="mr-2 h-4 w-4" />Export PDF</Button>
          </motion.div>
        </div>
      </div>

      <motion.div className="grid gap-4 sm:grid-cols-3" variants={staggerContainer} initial="hidden" animate="visible">
        <KPICard title="Total Fuel Spend" value={`$${(metrics?.totalFuelCost ?? 0).toLocaleString()}`} icon={DollarSign} accent={1} />
        <KPICard title="Fleet ROI" value={`${formatROI(metrics?.fleetRoiPercent)}%`} icon={TrendingUp} accent={2} />
        <KPICard title="Utilization Rate" value={`${metrics?.averageUtilizationRate ?? 0}%`} icon={Gauge} accent={3} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fuel Efficiency Trend */}
        <Card>
          <CardHeader><CardTitle>Fuel Efficiency Trend (km/L)</CardTitle></CardHeader>
          <CardContent>
            {fuelTrend.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No fuel log data yet. Add fuel logs via the backend to see the trend.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={fuelTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number | string) => [`${Number(v).toFixed(1)} km/L`, 'Efficiency']} />
                  <Line type="monotone" dataKey="kmPerLiter" stroke="#065A82" strokeWidth={2.5} dot={{ r: 4, fill: '#065A82' }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 5 Costliest Vehicles */}
        <Card>
          <CardHeader><CardTitle>Top 5 Costliest Vehicles</CardTitle></CardHeader>
          <CardContent>
            {costliestVehicles.every(v => v.cost === 0) ? (
              <p className="text-muted-foreground text-center py-8">No cost data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costliestVehicles}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Total Costs']} />
                  <Bar dataKey="cost" fill="#1C7293" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle ROI Table */}
      <Card>
        <CardHeader><CardTitle>Vehicle ROI</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Total Costs</TableHead>
                <TableHead>Acquisition</TableHead>
                <TableHead>ROI %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicleRoi.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No vehicles with acquisition cost data yet.
                  </TableCell>
                </TableRow>
              ) : vehicleRoi.map(v => (
                <TableRow key={v.vehicleId}>
                  <TableCell className="font-medium">{v.model}</TableCell>
                  <TableCell>{v.licensePlate}</TableCell>
                  <TableCell>${v.totalRevenue.toLocaleString()}</TableCell>
                  <TableCell>${v.totalCosts.toLocaleString()}</TableCell>
                  <TableCell>${v.acquisitionCost.toLocaleString()}</TableCell>
                  <TableCell className={Number(v.roiPercent) >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
                    {formatROI(v.roiPercent)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
