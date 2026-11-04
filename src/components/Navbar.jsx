import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck, UserPlus, Building2 } from 'lucide-react';
import { BGI_BHOPAL_LOGO } from '../brand';

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'directory', label: 'Directory' },
  { id: 'active-members', label: 'BISTAA' },
  { id: 'events', label: 'Events' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'status', label: 'Status' },
];

export default function Navbar({ currentView, setView }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* scroll shadow listener */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* close on Escape */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* lock body scroll when mobile drawer open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (id) => {
    setView(id);
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* ─── STICKY HEADER (100% TAILWIND CSS) ─────────────────────────────── */}
      <header
        className={`site-header sticky top-0 left-0 right-0 z-40 w-full transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200 py-2.5'
            : 'bg-white/98 backdrop-blur-sm shadow-xs border-b border-slate-200/90 py-3'
        }`}
      >
        <div className="site-header-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          
          {/* 1. Left: Brand Identity */}
          <button
            onClick={() => go('home')}
            className="site-brand flex items-center gap-2.5 sm:gap-3 group text-left cursor-pointer select-none shrink-0"
            aria-label="BGI Alumento home"
          >
            {/* Official BGI Bhopal mark */}
            <div className="site-brand-logo-wrap">
              <span aria-hidden="true">BGI</span>
              <img
                className="site-brand-logo"
                src={BGI_BHOPAL_LOGO}
                alt="BGI Bhopal logo"
                decoding="async"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            {/* Brand Titles */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-['Tanker',sans-serif] text-lg sm:text-xl font-extrabold text-[#17365B] tracking-wider uppercase leading-tight group-hover:text-[#0f243d] transition-colors">
                  BGI Alumento
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide leading-tight hidden xs:block">
                BIST Bhopal · Est. 2000
              </span>
            </div>
          </button>

          {/* 2. Center: Desktop Navigation Links (visible on xl >= 1280px) */}
          <nav className="site-nav hidden xl:flex items-center gap-0.5 2xl:gap-1 shrink min-w-0" aria-label="Main Navigation">
            {NAV_LINKS.map(({ id, label, badge }) => {
              const isActive = currentView === id;
              return (
                <button
                  key={id}
                  onClick={() => go(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`site-nav-link relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs 2xl:text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'is-active text-[#17365B] bg-[#17365B]/10 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-[#17365B] hover:bg-slate-100/80'
                  }`}
                >
                  <span>{label}</span>
                  {badge && (
                    <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-[#B8935F]/20 text-[#8e6c38] border border-[#B8935F]/40 leading-none">
                      {badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#B8935F] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. Right: Action Buttons */}
          <div className="site-actions flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Join Network (Shown on wide screens >= 1400px) */}
            <button
              onClick={() => go('register')}
              aria-label="Join the alumni network"
              className={`site-join-network hidden 2xl:inline-flex ${currentView === 'register' ? 'is-active' : ''}`}
            >
              <span>Join Network</span>
            </button>

            {/* BISTAA membership action */}
            <button
              onClick={() => go('bistaa')}
              aria-label="Join BISTAA lifetime membership for ₹300"
              className={`site-join-cta inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs font-bold text-white rounded-lg bg-[#17365B] hover:bg-[#0f243d] border border-[#B8935F]/70 shadow-sm hover:shadow-md hover:border-[#B8935F] active:scale-98 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                currentView === 'bistaa' ? 'ring-2 ring-[#B8935F] ring-offset-1' : ''
              }`}
            >
              <span>Become a member</span>
            </button>

            {/* Institution Sign-in for Admin / HOD / Staff */}
            <button
              onClick={() => go('admin')}
              aria-label="Institution Sign-in"
              className={`site-institution-btn ${currentView === 'admin' ? 'is-active' : ''}`}
            >
              <Building2 size={15} className="site-institution-icon" />
              <span>Institution Sign-in</span>
            </button>

            {/* Mobile & Tablet Hamburger (shown on screens < xl) */}
            <button
              onClick={() => setOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={open}
              aria-controls="mobile-navigation-drawer"
              className="site-menu-toggle xl:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-[#17365B] hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
              <span className="site-menu-label">Menu</span>
            </button>
          </div>

        </div>
      </header>

      {/* ─── MOBILE & TABLET DRAWER (100% TAILWIND CSS) ─────────────── */}
      {open && (
        <div className="site-mobile-menu-overlay fixed inset-0 z-50 overflow-hidden xl:hidden">
          {/* Backdrop */}
          <div
            className="site-mobile-menu-backdrop fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Slide-in Panel */}
          <aside
            id="mobile-navigation-drawer"
            className="site-mobile-drawer site-mobile-menu-panel fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            {/* Header */}
            <div className="site-mobile-menu-header p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <button
                onClick={() => go('home')}
                className="site-mobile-menu-brand flex items-center gap-2.5 text-left"
              >
                <div className="site-mobile-menu-crest">
                  <span aria-hidden="true">BGI</span>
                  <img
                    className="site-brand-logo"
                    src={BGI_BHOPAL_LOGO}
                    alt="BGI Bhopal logo"
                    decoding="async"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="site-mobile-menu-name font-['Tanker',sans-serif] text-base font-black text-[#17365B] uppercase leading-none">
                    BGI Alumento
                  </span>
                  <span className="site-mobile-menu-caption text-[10px] text-slate-500 font-medium">
                    BIST Bhopal · Est. 2000
                  </span>
                </div>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="site-mobile-menu-close w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="site-mobile-menu-body p-4 sm:p-5 flex-1 overflow-y-auto">
              
              {/* Highlighted CTAs */}
              <div className="site-mobile-menu-actions">
                <button
                  onClick={() => go('bistaa')}
                  className="site-mobile-menu-membership w-full text-left p-3.5 rounded-xl bg-[#17365B] text-white border border-[#B8935F]/60 shadow-md flex items-center gap-3 hover:bg-[#0f243d] transition-all cursor-pointer"
                >
                  <div className="site-mobile-menu-membership-icon w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="site-mobile-menu-membership-title site-drawer-cta-title text-sm font-bold tracking-wide">
                      Join BISTAA
                    </span>
                    <span className="site-mobile-menu-membership-note site-drawer-cta-subtitle text-xs text-amber-300 font-medium">
                      Lifetime membership · ₹300 one-time
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => go('register')}
                  className="site-mobile-menu-register site-drawer-register w-full py-2.5 px-4 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <UserPlus size={15} />
                  <span>Standard Registration</span>
                </button>

                <button
                  onClick={() => go('admin')}
                  className={`site-drawer-institution-btn w-full py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-2.5 border transition-all cursor-pointer mt-2.5 ${
                    currentView === 'admin'
                      ? 'bg-[#17365B] text-white border-[#B8935F] shadow-sm'
                      : 'text-[#17365B] bg-[#17365B]/5 hover:bg-[#17365B]/10 border-[#17365B]/20 hover:border-[#17365B]/40'
                  }`}
                >
                  <Building2 size={16} className="text-[#B8935F]" />
                  <span>Institution Sign-in (HOD / Admin)</span>
                </button>
              </div>

              {/* Main Nav Items */}
              <div>
                <p className="site-mobile-menu-section-label site-drawer-section-label text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Explore
                </p>
                <div className="site-mobile-menu-links">
                  {NAV_LINKS.map(({ id, label, badge }) => {
                    const isActive = currentView === id;
                    return (
                      <button
                        key={id}
                        onClick={() => go(id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`site-mobile-menu-link site-drawer-nav-link w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'is-active text-[#17365B] font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{label}</span>
                        {badge ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B8935F]/20 text-[#8e6c38] border border-[#B8935F]/40">
                            {badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </aside>
        </div>
      )}
    </>
  );
}
