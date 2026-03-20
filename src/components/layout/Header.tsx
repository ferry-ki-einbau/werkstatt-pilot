import { LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    toast.success('Erfolgreich abgemeldet.');
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-14 border-b"
      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
    >
      <h1 className="text-base md:text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" title="Benachrichtigungen">
          <Bell className="w-4 h-4" style={{ color: 'var(--muted)' }} />
        </Button>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {profile?.full_name ?? 'Benutzer'}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Abmelden"
        >
          <LogOut className="w-4 h-4" style={{ color: 'var(--muted)' }} />
        </Button>
      </div>
    </header>
  );
}
