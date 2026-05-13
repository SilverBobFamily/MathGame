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
        border: '1px solid #444',
        borderRadius: 6,
        color: '#aaa',
        cursor: 'pointer',
        fontSize: '0.95em',
        fontFamily: "'DM Sans', sans-serif",
        padding: '4px 12px',
      }}
    >
      Sign out
    </button>
  );
}
