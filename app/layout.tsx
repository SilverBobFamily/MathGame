import type { Metadata } from 'next';
import './globals.css';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Mathemagic',
  description: 'A collectible card game where the math is the magic.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data } = await supabase
      .from('players')
      .select('username, avatar_url, is_admin')
      .eq('id', user.id)
      .single();
    username = data?.username ?? null;
    avatarUrl = (data as { avatar_url?: string | null } | null)?.avatar_url ?? null;
    isAdmin = (data as { is_admin?: boolean } | null)?.is_admin ?? false;
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Space+Grotesk:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#0d0d1a', color: '#eee', fontFamily: "'Crimson Text', serif", minHeight: '100vh' }}>
        <NavBar
          username={username}
          avatarUrl={avatarUrl}
          isAdmin={isAdmin}
          isSignedIn={!!user}
        />
        <div style={{ fontSize: '0.67em' }}>{children}</div>
      </body>
    </html>
  );
}
