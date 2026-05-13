import React from 'react';
import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Phone, Megaphone, Plus, LogOut,
  GraduationCap, Shield, BookOpen, Menu, ChevronLeft, ChevronRight
} from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import SingleCall from './pages/SingleCall.jsx';
import CampaignList from './pages/CampaignList.jsx';
import NewCampaign from './pages/NewCampaign.jsx';
import CampaignDetail from './pages/CampaignDetail.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CounsellorDashboard from './pages/CounsellorDashboard.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import HODDashboard from './pages/HODDashboard.jsx';
import CourseStreams from './pages/CourseStreams.jsx';
import { AuthProvider, useAuth } from './components/AuthProvider.jsx';
import './index.css';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'AI Call Log', roles: ['super_admin'] },
  { path: '/superadmin', icon: Shield, label: 'Super Admin', roles: ['super_admin'] },
  { path: '/hod', icon: BookOpen, label: 'HOD', roles: ['hod'] },
  { path: '/counsellor', icon: GraduationCap, label: 'Counsellor', roles: ['councillor'] },
  { path: '/call', icon: Phone, label: 'Single Call', roles: ['super_admin'] },
  { path: '/campaigns', icon: Megaphone, label: 'Campaigns', end: true, roles: ['super_admin'] },
  { path: '/campaigns/new', icon: Plus, label: 'New Campaign', roles: ['super_admin'] },
  { path: '/courses', icon: BookOpen, label: 'Courses / Streams', roles: ['super_admin'] },
];

function homeForRole(role) {
  if (role === 'hod') return '/hod';
  if (role === 'councillor') return '/counsellor';
  return '/superadmin';
}

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ background: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={onConfirm}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ onLogoutRequest, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const location = useLocation();
  const { user, role } = useAuth();
  const [showMenu, setShowMenu] = React.useState(false);
  const visibleNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role));
  
  return (
    <>
      <div className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`} onClick={() => setIsMobileOpen(false)} />
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <button className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div className="sidebar-brand">
          <img src="/logo2.png" alt="Provaani" className="brand-icon" />
          <div className="brand-text-container">
            <h2 className="brand-title">Provaani</h2>
            <span className="brand-sub">Voice AI Call Manager</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {visibleNav.map(({ path, icon: Icon, label, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end || path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div 
              className="user-profile interactive logout-trigger" 
              onClick={onLogoutRequest}
              title="Sign Out"
          >
              <div className="logout-content">
                  <LogOut size={18} />
                  <span>Logout</span>
              </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function MobileHeader({ onMenuToggle }) {
  return (
    <header className="mobile-header">
      <div className="mobile-brand">
        <button className="mobile-menu-btn" onClick={onMenuToggle}>
          <Menu size={24} />
        </button>
        <img src="/logo2.png" alt="Provaani" className="mobile-logo" />
        <div className="mobile-brand-text">
          <h2 className="mobile-title">Provaani</h2>
          <span className="mobile-sub">Voice AI Call Manager</span>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const { session, loading, signOut, role } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  if (loading) {
    return (
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="spinner-lg" />
            <span style={{ color: 'var(--text-dim)' }}>Loading session...</span>
        </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <MobileHeader onMenuToggle={() => setIsMobileOpen(true)} />
      <Sidebar 
        onLogoutRequest={() => setShowLogoutConfirm(true)} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <main className={`main-content ${isCollapsed ? 'expanded' : ''}`}>
        <Routes>
          <Route path="/" element={role === 'super_admin' ? <Dashboard /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="/superadmin" element={role === 'super_admin' ? <SuperAdminDashboard /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="/hod" element={role === 'hod' ? <HODDashboard /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="/counsellor" element={role === 'councillor' ? <CounsellorDashboard /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="/call" element={role === 'super_admin' ? <SingleCall /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="/single-call" element={<Navigate to="/call" replace />} />
          <Route path="/campaigns" element={role === 'super_admin' ? <CampaignList /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="/campaigns/new" element={role === 'super_admin' ? <NewCampaign /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="/campaigns/:id" element={role === 'super_admin' ? <CampaignDetail /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="/courses" element={role === 'super_admin' ? <CourseStreams /> : <Navigate to={homeForRole(role)} replace />} />
          <Route path="*" element={<Navigate to={homeForRole(role)} replace />} />
        </Routes>
      </main>

      <ConfirmationModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={signOut}
        title="Sign Out?"
        message="Are you sure you want to log out of Provaani?"
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
