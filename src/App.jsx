import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import SlipPreviewModal from './components/SlipPreviewModal';
import DigitalPassModal from './components/DigitalPassModal';
import RsvpModal from './components/RsvpModal';

// Pages
import HomePage from './pages/HomePage';
import DirectoryPage from './pages/DirectoryPage';
import BistaaPage from './pages/BistaaPage';
import RegisterPage from './pages/RegisterPage';
import StatusPage from './pages/StatusPage';
import ActiveMembersPage from './pages/ActiveMembersPage';
import EventsPage from './pages/EventsPage';
import GalleryPage from './pages/GalleryPage';
import AdminPage from './pages/AdminPage';

// Data
import { 
  INITIAL_ALUMNI, 
  INITIAL_BISTAA_APPS, 
  EVENTS, 
  GALLERY_ALBUMS 
} from './data/mockData';

const AVAILABLE_VIEWS = new Set([
  'home', 'directory', 'bistaa', 'register', 'status',
  'active-members', 'events', 'gallery', 'admin'
]);

const VIEW_PATHS = {
  home: '/',
  directory: '/directory',
  'active-members': '/bistaa',
  bistaa: '/bistaa-registration',
  register: '/register',
  status: '/status',
  events: '/events',
  gallery: '/gallery',
  admin: '/admin',
};

const getViewFromLocation = () => {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const pathView = Object.entries(VIEW_PATHS).find(([, route]) => route === path)?.[0];
  if (pathView) return pathView;
  if (path === '/active-members') return 'active-members';
  if (path === '/membership' || path === '/bistaa/register') return 'bistaa';

  // Read old hash URLs once, then replace them with their clean route.
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'bistaa') return 'active-members';
  return AVAILABLE_VIEWS.has(hash) ? hash : 'home';
};

export default function App() {
  // Navigation State
  const [currentView, setCurrentViewState] = useState(getViewFromLocation);
  const setCurrentView = (view) => {
    if (!AVAILABLE_VIEWS.has(view)) return;
    setCurrentViewState(view);
    const nextPath = VIEW_PATHS[view];
    if (window.location.pathname !== nextPath || window.location.hash) {
      window.history.pushState({}, '', nextPath);
    }
  };

  // Master Alumni & Application State (Local Storage backed)
  const [alumniList, setAlumniList] = useState(() => {
    const stored = localStorage.getItem('bgi_alumni_data_v2');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return INITIAL_ALUMNI;
  });

  const [bistaaApps, setBistaaApps] = useState(() => {
    const stored = localStorage.getItem('bgi_bistaa_apps_v2');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    return INITIAL_BISTAA_APPS;
  });

  const [eventsList] = useState(EVENTS);
  const [galleryList] = useState(GALLERY_ALBUMS);

  // Modals & Overlay State
  const [slipPreviewData, setSlipPreviewData] = useState(null);
  const [digitalPassData, setDigitalPassData] = useState(null);
  const [rsvpEventData, setRsvpEventData] = useState(null);

  // Toast Stack
  const [toasts, setToasts] = useState([]);

  // Keep document title and canonical route in sync with the selected page.
  useEffect(() => {
    const titles = {
      home: 'BGI ALUMENTO | Bansal Alumni Association (BISTAA)',
      directory: 'Alumni Directory | BGI ALUMENTO',
      bistaa: 'BISTAA Lifetime Membership (₹300) | BGI ALUMENTO',
      register: 'Standard Alumni Registration | BGI ALUMENTO',
      status: 'Check Registration Status | BGI ALUMENTO',
      'active-members': 'BISTAA Active Lifetime Members | BGI ALUMENTO',
      events: 'Campus Events & Reunions | BGI ALUMENTO',
      gallery: 'Campus Nostalgia Gallery | BGI ALUMENTO',
      admin: 'Admin Verification Console | BGI ALUMENTO'
    };
    document.title = titles[currentView] || 'BGI ALUMENTO';
  }, [currentView]);

  // Support direct links, legacy hash links, and browser back/forward.
  useEffect(() => {
    const canonicalPath = VIEW_PATHS[getViewFromLocation()];
    if (window.location.pathname !== canonicalPath || window.location.hash) {
      window.history.replaceState({}, '', canonicalPath);
    }

    const handlePopState = () => {
      setCurrentViewState(getViewFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist State
  useEffect(() => {
    localStorage.setItem('bgi_alumni_data_v2', JSON.stringify(alumniList));
  }, [alumniList]);

  useEffect(() => {
    localStorage.setItem('bgi_bistaa_apps_v2', JSON.stringify(bistaaApps));
  }, [bistaaApps]);

  // Toast Trigger Helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // Handlers
  const handleAddAlumnus = (newAlumnus) => {
    setAlumniList(prev => [newAlumnus, ...prev]);
  };

  const handleSubmitBistaa = (newApp) => {
    setBistaaApps(prev => [newApp, ...prev]);
  };

  const handleActivateApplication = (appId) => {
    const updatedApps = bistaaApps.map(app => {
      if (app.id === appId) {
        const membershipId = `BISTAA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        return {
          ...app,
          status: 'ACTIVE',
          membership_id: membershipId,
          verified_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          verified_by: 'Prof. R. K. Sharma (Coordinator)'
        };
      }
      return app;
    });

    setBistaaApps(updatedApps);

    // Also update matching alumni user record if present
    const targetApp = updatedApps.find(a => a.id === appId);
    if (targetApp) {
      setAlumniList(prev => prev.map(al => {
        if (al.enroll_no.toUpperCase() === targetApp.enrollment.toUpperCase()) {
          return {
            ...al,
            is_bistaa_member: true,
            bistaa_id: targetApp.membership_id
          };
        }
        return al;
      }));
      showToast(`Activated ${targetApp.name} as BISTAA Lifetime Member!`, 'success');
    }
  };

  const handleRejectApplication = (appId, reason) => {
    setBistaaApps(prev => prev.map(app => {
      if (app.id === appId) {
        return {
          ...app,
          status: 'REJECTED',
          rejection_reason: reason,
          verified_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          verified_by: 'Administrative Desk'
        };
      }
      return app;
    }));
    showToast('Application marked as rejected with reason.', 'error');
  };

  const handleConfirmRsvp = (eventTitle) => {
    showToast(`RSVP Confirmed for "${eventTitle}"! Entry pass generated.`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 1. Header & Navigation */}
      <Navbar currentView={currentView} setView={setCurrentView} />

      {/* 2. Main Page View Content */}
      <main style={{ flex: 1 }}>
        {currentView === 'home' && (
          <HomePage
            alumniList={alumniList}
            eventsList={eventsList}
            setView={setCurrentView}
            onRsvpClick={(ev) => setRsvpEventData(ev)}
          />
        )}

        {currentView === 'directory' && (
          <DirectoryPage
            alumniList={alumniList}
          />
        )}

        {currentView === 'bistaa' && (
          <BistaaPage
            alumniList={alumniList}
            onSubmitBistaa={handleSubmitBistaa}
            setView={setCurrentView}
            showToast={showToast}
          />
        )}

        {currentView === 'register' && (
          <RegisterPage
            onAddAlumnus={handleAddAlumnus}
            setView={setCurrentView}
            showToast={showToast}
          />
        )}

        {currentView === 'status' && (
          <StatusPage
            bistaaApps={bistaaApps}
            onOpenSlip={(data) => setSlipPreviewData(data)}
            onOpenDigitalPass={(app) => setDigitalPassData(app)}
            setView={setCurrentView}
          />
        )}

        {currentView === 'active-members' && (
          <ActiveMembersPage
            alumniList={alumniList}
            onOpenDigitalPass={(app) => setDigitalPassData(app)}
          />
        )}

        {currentView === 'events' && (
          <EventsPage
            eventsList={eventsList}
            onRsvpClick={(ev) => setRsvpEventData(ev)}
            setView={setCurrentView}
          />
        )}

        {currentView === 'gallery' && (
          <GalleryPage
            galleryList={galleryList}
          />
        )}

        {currentView === 'admin' && (
          <AdminPage
            bistaaApps={bistaaApps}
            alumniList={alumniList}
            onActivateApplication={handleActivateApplication}
            onRejectApplication={handleRejectApplication}
            onOpenSlip={(data) => setSlipPreviewData(data)}
            onOpenDigitalPass={(app) => setDigitalPassData(app)}
            showToast={showToast}
          />
        )}
      </main>

      {/* 3. Footer */}
      <Footer setView={setCurrentView} />

      {/* 4. Modals */}
      {slipPreviewData && (
        <SlipPreviewModal
          slipData={slipPreviewData}
          onClose={() => setSlipPreviewData(null)}
          onActivate={handleActivateApplication}
        />
      )}

      {digitalPassData && (
        <DigitalPassModal
          passData={digitalPassData}
          onClose={() => setDigitalPassData(null)}
        />
      )}

      {rsvpEventData && (
        <RsvpModal
          event={rsvpEventData}
          onClose={() => setRsvpEventData(null)}
          onConfirm={handleConfirmRsvp}
        />
      )}

      {/* 5. Toast Stack */}
      <Toast toasts={toasts} />

    </div>
  );
}
