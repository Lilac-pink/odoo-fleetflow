import { useState } from 'react';
import { useFleet } from '@/contexts/FleetContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Truck, Loader2 } from 'lucide-react';
import type { UserRole } from '@/types/fleet';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeScale, shake } from '@/lib/animations';

const Login = () => {
  const { login, register } = useFleet();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Fleet Manager');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setLoginError('Please fill all fields'); return; }
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) { setRegError('Please fill all fields'); return; }
    setRegError('');
    setRegLoading(true);
    try {
      await register(regName, regEmail, regPassword, regRole);
      toast.success('Account created! Welcome to FleetFlow.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setRegError(msg);
      toast.error(msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        className="w-full max-w-md"
        variants={fadeScale}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <motion.div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#065A82]"
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Truck className="h-7 w-7 text-white" />
          </motion.div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-[#065A82]">Fleet</span>Flow
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Fleet management made simple</p>
        </div>

        <Card className="shadow-lg">
          <Tabs defaultValue="login">
            <CardHeader className="pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
                <TabsTrigger value="register" className="flex-1">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* ── Login Tab ── */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <AnimatePresence>
                    {loginError && (
                      <motion.p
                        key="login-error"
                        variants={shake}
                        initial="initial"
                        animate="animate"
                        className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      >
                        {loginError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="transition-all duration-200 focus-within:ring-2 focus-within:ring-[#1C7293]/40 rounded-md">
                      <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loginLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="transition-all duration-200 focus-within:ring-2 focus-within:ring-[#1C7293]/40 rounded-md">
                      <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loginLoading} />
                    </div>
                  </div>

                  {/* Demo role hint */}
                  <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Demo accounts</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <span>admin@fleetflow.local</span><span className="text-[#065A82] font-medium">Fleet Manager</span>
                      <span>dispatcher@fleetflow.local</span><span className="text-[#065A82] font-medium">Dispatcher</span>
                      <span>safety@fleetflow.local</span><span className="text-[#065A82] font-medium">Safety Officer</span>
                    </div>
                    <p className="mt-1">Password: <code className="font-mono">password123</code></p>
                  </div>

                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button type="submit" className="w-full bg-[#065A82] hover:bg-[#1B3B6F] active:scale-95 transition-all" disabled={loginLoading}>
                      {loginLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : 'Login'}
                    </Button>
                  </motion.div>
                </CardContent>
              </form>
            </TabsContent>

            {/* ── Register Tab ── */}
            <TabsContent value="register">
              <form onSubmit={handleRegister}>
                <CardContent className="space-y-4">
                  <AnimatePresence>
                    {regError && (
                      <motion.p
                        key="reg-error"
                        variants={shake}
                        initial="initial"
                        animate="animate"
                        className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      >
                        {regError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <div className="focus-within:ring-2 focus-within:ring-[#1C7293]/40 rounded-md transition-all duration-200">
                      <Input placeholder="John Doe" value={regName} onChange={e => setRegName(e.target.value)} disabled={regLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="focus-within:ring-2 focus-within:ring-[#1C7293]/40 rounded-md transition-all duration-200">
                      <Input type="email" placeholder="you@company.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} disabled={regLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="focus-within:ring-2 focus-within:ring-[#1C7293]/40 rounded-md transition-all duration-200">
                      <Input type="password" placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} disabled={regLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={regRole} onValueChange={v => setRegRole(v as UserRole)} disabled={regLoading}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fleet Manager">Fleet Manager</SelectItem>
                        <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                        <SelectItem value="Safety Officer">Safety Officer</SelectItem>
                        <SelectItem value="Financial Analyst">Financial Analyst</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button type="submit" className="w-full bg-[#065A82] hover:bg-[#1B3B6F] active:scale-95 transition-all" disabled={regLoading}>
                      {regLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…</> : 'Create Account'}
                    </Button>
                  </motion.div>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
