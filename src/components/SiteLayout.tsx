import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, BookOpen, Camera, History, Leaf, Menu, Settings, Sprout, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: Leaf, end: true },
  { to: '/classify', label: 'Classify', icon: Camera },
  { to: '/guide', label: 'Waste guide', icon: BookOpen },
  { to: '/history', label: 'History', icon: History },
  { to: '/about', label: 'About', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function SiteLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setMobileOpen(false);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="header-inner">
          <NavLink className="brand" to="/" aria-label="EcoSort AI home" onClick={closeMenu}>
            <span className="brand-mark"><Sprout size={20} aria-hidden="true" /></span>
            <span className="brand-text">EcoSort <span>AI</span></span>
          </NavLink>
          <button className="mobile-menu-button icon-button" type="button" aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
            <span className="visually-hidden">{mobileOpen ? 'Close navigation' : 'Open navigation'}</span>
          </button>
          <nav id="primary-navigation" className={`primary-nav${mobileOpen ? ' is-open' : ''}`} aria-label="Main navigation">
            {NAV_ITEMS.map(({ to, label, icon: Icon, ...rest }) => (
              <NavLink key={to} to={to} end={'end' in rest ? rest.end : false} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`} onClick={closeMenu}>
                <Icon size={16} aria-hidden="true" /> <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="site-main" key={location.pathname}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <p><span className="footer-mark"><Sprout size={15} aria-hidden="true" /></span> EcoSort AI <span className="footer-separator">·</span> Understand your waste. Make better choices.</p>
          <p className="footer-note">On-device classification · No photo uploads</p>
        </div>
      </footer>
    </div>
  );
}
