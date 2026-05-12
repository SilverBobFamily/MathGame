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
  { href: '/decks',    label: 'Decks',    icon: 'style',   auth: true  },
  { href: '/packs',    label: 'Packs',    icon: 'card_giftcard', auth: true },
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

  const TabItem = ({ href, label, icon, desktop }: { href: string; label: string; icon: string; desktop?: boolean }) => {
    const active = isActive(href);
    const iconSize = desktop ? '36px' : '24px';
    const labelSize = desktop ? '16px' : '11px';
    const pad = desktop ? '6px 15px' : '4px 10px';
    const minW = desktop ? '66px' : '44px';
    return (
      <a href={href} style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
        padding: pad, borderRadius: '10px',
        textDecoration: 'none',
        color: active ? GOLD : '#555',
        minWidth: minW,
        transition: 'color 0.15s',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: iconSize, lineHeight: 1,
          fontVariationSettings: active ? `'FILL' 1, 'wght' 600` : `'FILL' 0, 'wght' 400`,
        }}>
          {icon}
        </span>
        <span style={{
          fontFamily: CINZEL, fontSize: labelSize, letterSpacing: '0.06em',
          textTransform: 'uppercase', lineHeight: 1,
        }}>
          {label}
        </span>
      </a>
    );
  };

  const ProfileCorner = ({ desktop }: { desktop?: boolean }) => {
    const avatarSize = desktop ? '39px' : '26px';
    const initialsSize = desktop ? '13px' : '9px';
    const usernameSize = desktop ? '19px' : '13px';
    const gap = desktop ? '15px' : '10px';
    const innerGap = desktop ? '10px' : '7px';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap }}>
        {isSignedIn ? (
          <>
            <a href="/profile" style={{ display: 'flex', alignItems: 'center', gap: innerGap, textDecoration: 'none' }}>
              <div style={{
                width: avatarSize, height: avatarSize, borderRadius: '50%',
                background: '#1a237e', border: '2px solid #5c6bc0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: initialsSize, fontFamily: CINZEL, fontWeight: 700 }}>
                      {(username ?? '').slice(0, 2).toUpperCase()}
                    </span>
                }
              </div>
              <span style={{ color: '#666', fontSize: usernameSize, fontFamily: CINZEL }}>{username}</span>
            </a>
            <SignOutButton />
          </>
        ) : (
          <a href="/login" style={{ color: '#666', fontSize: usernameSize, fontFamily: CINZEL, textDecoration: 'none' }}>
            Sign in
          </a>
        )}
      </div>
    );
  };

  const TabStrip = ({ desktop }: { desktop?: boolean }) => (
    <nav style={{ display: 'flex', alignItems: 'center', gap: desktop ? '4px' : '2px' }}>
      {items.map(item => <TabItem key={item.href} {...item} desktop={desktop} />)}
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

      {/* Desktop nav — 1.5× all dimensions */}
      <div className="nav-desktop" style={{
        background: 'var(--theme-bg-nav)', borderBottom: '1px solid var(--theme-border)',
        padding: '0 36px', height: '102px',
        alignItems: 'center', gap: '30px',
      }}>
        <a href="/" style={{ textDecoration: 'none', lineHeight: 0, flexShrink: 0 }}>
          <img src="/mathemagic-logo.svg" alt="Mathemagic" style={{ height: '72px' }} />
        </a>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '18px' }}>
          <TabStrip desktop />
        </div>
        <ProfileCorner desktop />
      </div>

      {/* Mobile top bar */}
      <div className="nav-mobile-top" style={{
        background: 'var(--theme-bg-nav)', borderBottom: '1px solid var(--theme-border)',
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
        background: 'var(--theme-bg-nav)', borderTop: '1px solid var(--theme-border)',
        height: '60px', paddingBottom: 'env(safe-area-inset-bottom)',
        alignItems: 'center', justifyContent: 'space-around',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.5)',
      }}>
        <TabStrip />
      </div>

    </>
  );
}
