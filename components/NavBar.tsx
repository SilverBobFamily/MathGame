'use client';
import { usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';

interface Props {
  username: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isSignedIn: boolean;
}

const NAV_ITEMS = [
  { href: '/game',     label: 'Play',     icon: 'swords'               },
  { href: '/lobby',    label: 'Online',   icon: 'group'                },
  { href: '/games',    label: 'My Games', icon: 'history', auth: true  },
  { href: '/cards',    label: 'Cards',    icon: 'auto_stories'         },
  { href: '/settings', label: 'Settings', icon: 'settings'             },
];

const GOLD = '#c9a84c';
const CINZEL = "'Cinzel', serif";

export default function NavBar({ username, avatarUrl, isAdmin, isSignedIn }: Props) {
  const pathname = usePathname();

  const items = [
    ...NAV_ITEMS.filter(i => !i.auth || isSignedIn),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: 'admin_panel_settings' }] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const TabItem = ({ href, label, icon }: { href: string; label: string; icon: string }) => {
    const active = isActive(href);
    return (
      <a href={href} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        padding: '4px 10px', borderRadius: '8px',
        textDecoration: 'none',
        color: active ? GOLD : '#555',
        minWidth: '44px',
        transition: 'color 0.15s',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: '20px', lineHeight: 1,
          fontVariationSettings: active ? `'FILL' 1, 'wght' 600` : `'FILL' 0, 'wght' 400`,
        }}>
          {icon}
        </span>
        <span style={{
          fontFamily: CINZEL, fontSize: '9px', letterSpacing: '0.07em',
          textTransform: 'uppercase', lineHeight: 1,
        }}>
          {label}
        </span>
      </a>
    );
  };

  const ProfileCorner = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {isSignedIn ? (
        <>
          <a href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: '#1a237e', border: '2px solid #5c6bc0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontSize: '9px', fontFamily: CINZEL, fontWeight: 700 }}>
                    {(username ?? '').slice(0, 2).toUpperCase()}
                  </span>
              }
            </div>
            <span style={{ color: '#666', fontSize: '11px', fontFamily: CINZEL }}>{username}</span>
          </a>
          <SignOutButton />
        </>
      ) : (
        <a href="/login" style={{ color: '#666', fontSize: '11px', fontFamily: CINZEL, textDecoration: 'none' }}>
          Sign in
        </a>
      )}
    </div>
  );

  const TabStrip = () => (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {items.map(item => <TabItem key={item.href} {...item} />)}
    </nav>
  );

  return (
    <>
      <style>{`
        .nav-desktop { display: flex; }
        .nav-mobile-top { display: none; }
        .nav-mobile-bottom { display: none; }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-top { display: flex !important; }
          .nav-mobile-bottom { display: flex !important; }
          body { padding-bottom: 64px; }
        }
      `}</style>

      {/* Desktop nav */}
      <div className="nav-desktop" style={{
        background: '#111', borderBottom: '1px solid #1e1e1e',
        padding: '0 20px', height: '52px',
        alignItems: 'center', gap: '16px',
      }}>
        <a href="/" style={{ textDecoration: 'none', lineHeight: 0, flexShrink: 0 }}>
          <img src="/mathemagic-logo.svg" alt="Mathemagic" style={{ height: '36px' }} />
        </a>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '8px' }}>
          <TabStrip />
        </div>
        <ProfileCorner />
      </div>

      {/* Mobile top bar */}
      <div className="nav-mobile-top" style={{
        background: '#111', borderBottom: '1px solid #1e1e1e',
        padding: '0 16px', height: '44px',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <a href="/" style={{ textDecoration: 'none', lineHeight: 0 }}>
          <img src="/mathemagic-logo.svg" alt="Mathemagic" style={{ height: '28px' }} />
        </a>
        <ProfileCorner />
      </div>

      {/* Mobile bottom tab bar */}
      <div className="nav-mobile-bottom" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#111', borderTop: '1px solid #1e1e1e',
        height: '60px', paddingBottom: 'env(safe-area-inset-bottom)',
        alignItems: 'center', justifyContent: 'space-around',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
      }}>
        <TabStrip />
      </div>
    </>
  );
}
