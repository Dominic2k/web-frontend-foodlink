import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {
  FiGrid,
  FiUsers,
  FiActivity,
  FiLogOut,
  FiMenu,
  FiX,
  FiPackage,
  FiBook,
  FiShoppingBag,
} from 'react-icons/fi';
import './AdminLayout.css';

const navItems = [
  { to: '/', icon: FiGrid, label: 'Dashboard' },
  { to: '/users', icon: FiUsers, label: 'Users' },
  { to: '/ingredients', icon: FiPackage, label: 'Ingredients' },
  { to: '/recipes', icon: FiBook, label: 'Recipes' },
  { to: '/orders', icon: FiShoppingBag, label: 'Orders' },
  { to: '/health-conditions', icon: FiActivity, label: 'Health Conditions' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🍽️</span>
          <span className="sidebar-brand-text">FoodLink</span>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="sidebar-link-icon" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar avatar-sm">
              {user?.username?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.username || 'Admin'}</span>
              <span className="sidebar-user-role">Administrator</span>
            </div>
          </div>
          <button className="btn btn-ghost sidebar-logout" onClick={handleLogout}>
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          <div className="topbar-title">
            {/* dynamic per page if needed */}
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
