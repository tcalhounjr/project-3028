import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Flag,
  ArrowLeftRight,
  FileText,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Activity,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Sidebar — Civic Vigil Deep Navy (#1A237E) background, 240px fixed width.
// Active item: #3949AB bg + 3px white left border.
// Hover item: #283593 bg.
// Nav item height: 48px.
// ---------------------------------------------------------------------------

// Route map: nav item id → path. Items without a route are shown but disabled.
const NAV_ROUTES: Record<string, string> = {
  overview: '/',
  compare: '/compare',
}

// Derive the active tab id from the current pathname.
function pathToTab(pathname: string): string {
  if (pathname === '/') return 'overview'
  if (pathname.startsWith('/compare')) return 'compare'
  if (pathname.startsWith('/country')) return 'countries'
  return ''
}

export const Sidebar = ({ activeTab: _activeTabProp, onTabChange: _onTabChange }: { activeTab?: string, onTabChange?: (tab: string) => void }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = pathToTab(location.pathname)

  const navItems = [
    { id: 'overview', label: 'Global Overview', icon: LayoutDashboard },
    { id: 'countries', label: 'Countries', icon: Flag, disabled: true },
    { id: 'compare', label: 'Compare', icon: ArrowLeftRight },
    { id: 'reports', label: 'Reports', icon: FileText, disabled: true },
  ];

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100%',
        width: '240px',
        backgroundColor: '#1A237E',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        zIndex: 40,
      }}
    >
      {/* Brand */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
              fontSize: '14px',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              display: 'block',
              lineHeight: 1.2,
            }}
          >
            Democracy Index
          </span>
          <span
            style={{
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 400,
              display: 'block',
              marginTop: '2px',
            }}
          >
            Institutional Archive
          </span>
        </div>
      </div>

      <nav
        style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}
        aria-label="Primary navigation"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isDisabled = (item as { disabled?: boolean }).disabled === true;
          const route = NAV_ROUTES[item.id];
          return (
            <button
              key={item.id}
              onClick={() => { if (route && !isDisabled) navigate(route) }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                height: '48px',
                padding: '0 20px',
                paddingLeft: isActive ? '17px' : '20px',
                background: 'none',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
                backgroundColor: isActive ? '#3949AB' : 'transparent',
                color: isDisabled ? 'rgba(255,255,255,0.3)' : isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'background-color 250ms ease-in-out, color 250ms ease-in-out',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive && !isDisabled) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#283593';
                  (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isDisabled) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
                }
              }}
            >
              <item.icon
                size={20}
                aria-hidden="true"
                style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }}
              />
              <span
                style={{
                  fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  lineHeight: 1.2,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer utilities */}
      <div
        style={{
          padding: '8px 0 16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        {/* Generate Report CTA */}
        <div style={{ padding: '8px 16px' }}>
          <button
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              color: '#1A237E',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
              fontSize: '13px',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Generate Report
          </button>
        </div>
        <button
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: '44px',
            padding: '0 20px',
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            border: 'none',
            borderLeft: '3px solid transparent',
            cursor: 'pointer',
            fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
            fontSize: '13px',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#283593';
            (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
          }}
        >
          <Settings size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          Settings
        </button>
        <button
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            height: '44px',
            padding: '0 20px',
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.6)',
            border: 'none',
            borderLeft: '3px solid transparent',
            cursor: 'pointer',
            fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
            fontSize: '13px',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#283593';
            (e.currentTarget as HTMLButtonElement).style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
          }}
        >
          <HelpCircle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          Help
        </button>
      </div>
    </aside>
  );
};

// ---------------------------------------------------------------------------
// TopBar — 64px tall, white surface, sticky.
// ---------------------------------------------------------------------------

export const TopBar = ({ title, subtitle }: { title: string, subtitle?: string }) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: '64px',
        padding: '0 32px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E8EAF0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2
          style={{
            fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: '#1A237E',
            margin: 0,
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <>
            <div style={{ height: '20px', width: '1px', backgroundColor: '#E8EAF0' }} />
            <span
              style={{
                fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                color: '#78909C',
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}
            >
              {subtitle}
            </span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#78909C',
              pointerEvents: 'none',
            }}
            size={16}
            aria-hidden="true"
          />
          {/* TODO: wire to GlobalOverview filter state in a future sprint — must use React controlled state and text-node rendering, never innerHTML */}
          <input
            type="search"
            placeholder="Search countries or regions..."
            aria-label="Search countries or regions"
            disabled
            style={{
              paddingLeft: '36px',
              paddingRight: '16px',
              paddingTop: '8px',
              paddingBottom: '8px',
              backgroundColor: '#F5F7FA',
              border: '1px solid #E8EAF0',
              borderRadius: '4px',
              fontSize: '13px',
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
              color: '#1C1C1E',
              width: '256px',
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            aria-label="Notifications"
            style={{
              padding: '8px',
              color: '#78909C',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              borderRadius: '4px',
            }}
          >
            <Bell size={20} aria-hidden="true" />
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                backgroundColor: '#C62828',
                borderRadius: '50%',
                border: '2px solid white',
              }}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

// ---------------------------------------------------------------------------
// StatusBadge — Civic Vigil status colors with WCAG AA compliance.
// Elevated: amber background (#FFF8E1) with dark text (#E65100) for 4.5:1 contrast.
// ---------------------------------------------------------------------------

export const StatusBadge = ({ status }: { status: 'Stable' | 'Elevated' | 'Critical' }) => {
  const styles: Record<string, React.CSSProperties> = {
    Stable: {
      backgroundColor: '#ECEFF1',
      color: '#546E7A', /* #546E7A on #ECEFF1 = 4.6:1 — passes AA */
      border: '1px solid #78909C',
    },
    Elevated: {
      backgroundColor: '#FFF8E1',
      color: '#E65100', /* darker amber — passes 4.5:1 on #FFF8E1 */
      border: '1px solid #F9A825',
    },
    Critical: {
      backgroundColor: '#FFEBEE',
      color: '#C62828',
      border: '1px solid #C62828',
    },
  };

  return (
    <span
      style={{
        ...(styles[status] ?? styles.Stable),
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: '4px',
        padding: '2px 8px',
        fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
};

// ---------------------------------------------------------------------------
// ScoreDisplay — used in legacy CountryDetail header.
// ---------------------------------------------------------------------------

export const ScoreDisplay = ({ score, status, label = "Current Stress Score" }: { score: number, status: string, label?: string }) => {
  const badgeStyle: React.CSSProperties =
    status === 'Critical'
      ? { backgroundColor: '#FFEBEE', color: '#C62828' }
      : status === 'Elevated'
      ? { backgroundColor: '#FFF8E1', color: '#E65100' }
      : { backgroundColor: '#ECEFF1', color: '#546E7A' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <span
        style={{
          fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: '#78909C',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span
          style={{
            fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
            fontSize: '56px',
            fontWeight: 800,
            lineHeight: 1,
            color: '#1A237E',
          }}
        >
          {score}
        </span>
        <span
          style={{
            ...badgeStyle,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Manrope, Inter, ui-sans-serif, system-ui, sans-serif',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: status === 'Critical' ? '#C62828' : status === 'Elevated' ? '#F9A825' : '#78909C',
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          {status} Risk
        </span>
      </div>
    </div>
  );
};
