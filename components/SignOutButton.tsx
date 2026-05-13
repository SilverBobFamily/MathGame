'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SignOutButton() {
  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: 'none',
        border: '1px solid #333',
        borderRadius: 6,
        color: '#666',
        cursor: 'pointer',
        fontSize: '0.72em',
        fontFamily: "'Raleway', sans-serif",
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '4px 10px',
      }}
    >
      Sign out
    </button>
  );
}
