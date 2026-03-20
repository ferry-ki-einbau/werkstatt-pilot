import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  werkstattName: z.string().min(2, 'Werkstattname muss mindestens 2 Zeichen haben'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.fullName, data.werkstattName);
    setLoading(false);
    if (error) {
      toast.error('Registrierung fehlgeschlagen: ' + error);
      return;
    }
    toast.success('Werkstatt erfolgreich registriert! Bitte E-Mail bestätigen.');
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <Wrench className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Werkstatt registrieren
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Jetzt kostenlos starten
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl border p-6 shadow-xl"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Ihr Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Max Mustermann"
                autoComplete="name"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="werkstattName">Werkstatt-Name</Label>
              <Input
                id="werkstattName"
                type="text"
                placeholder="KFZ-Mustermann GmbH"
                error={errors.werkstattName?.message}
                {...register('werkstattName')}
              />
            </div>

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <Label htmlFor="password">Passwort</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mindestens 8 Zeichen"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 p-1"
                  style={{ color: 'var(--muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Passwort wiederholen"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Button type="submit" className="w-full mt-2" loading={loading}>
              Werkstatt registrieren
            </Button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--muted)' }}>
          Bereits registriert?{' '}
          <Link
            to="/login"
            className="font-medium hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
