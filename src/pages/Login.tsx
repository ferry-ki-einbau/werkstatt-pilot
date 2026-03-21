import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Eye, EyeOff, Zap, Bell, CheckCircle2, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
});
type LoginForm = z.infer<typeof loginSchema>;

const features = [
  { icon: Zap,           text: 'Kanban-Board für alle Aufträge' },
  { icon: Bell,          text: 'Automatische SMS bei Status-Wechsel' },
  { icon: CheckCircle2,  text: 'TÜV-Erinnerungen per E-Mail' },
  { icon: Star,          text: 'Google-Bewertungen auf Autopilot' },
];

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      toast.error('Anmeldung fehlgeschlagen: ' + error);
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)' }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-center w-[520px] shrink-0 px-16 py-20"
        style={{
          background: 'linear-gradient(160deg, #1c1400 0%, #111008 50%, #0f0f11 100%)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-16">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Wrench className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Werkstatt-Pilot
          </span>
        </div>

        {/* Headline */}
        <div className="mb-12">
          <p
            className="text-xs font-semibold tracking-[0.15em] uppercase mb-5"
            style={{ color: 'var(--primary)' }}
          >
            Für KFZ-Werkstätten
          </p>
          <h2
            className="text-[2.6rem] font-bold leading-[1.15] tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Weniger<br />Telefonate.<br />
            <span style={{ color: 'var(--primary)' }}>Mehr zufriedene</span><br />
            Kunden.
          </h2>
        </div>

        {/* Feature list */}
        <ul className="space-y-5">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-4">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}
              >
                <Icon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </div>
              <span className="text-sm leading-snug" style={{ color: '#a0a0a8' }}>
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-12 lg:hidden">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Wrench className="w-5 h-5 text-black" />
          </div>
          <span className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
            Werkstatt-Pilot
          </span>
        </div>

        <div className="w-full max-w-[380px]">

          {/* Heading */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Willkommen zurück
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#6b6b78' }}>
              Melden Sie sich in Ihrem Konto an
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@werkstatt.de"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  className="pr-11"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: '#6b6b78' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              style={{ minHeight: '50px', fontSize: '15px' }}
              disabled={loading}
            >
              {loading ? 'Wird angemeldet…' : 'Anmelden'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
            <span className="text-xs" style={{ color: '#6b6b78' }}>oder</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          </div>

          {/* Demo button */}
          <button
            type="button"
            onClick={() => navigate('/demo')}
            className="w-full rounded-xl text-sm font-medium transition-all"
            style={{
              minHeight: '50px',
              border: '1px solid rgba(245,158,11,0.35)',
              color: 'var(--primary)',
              backgroundColor: 'rgba(245,158,11,0.05)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(245,158,11,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(245,158,11,0.05)';
            }}
          >
            Demo ansehen — ohne Account
          </button>

          {/* Register link */}
          <p className="text-center text-sm mt-8" style={{ color: '#6b6b78' }}>
            Noch kein Konto?{' '}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: 'var(--primary)' }}
            >
              Werkstatt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
