import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiTrendingUp,
  FiHeart,
  FiActivity,
  FiPackage,
  FiBook,
  FiShoppingBag,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiZap,
  FiSmartphone,
} from 'react-icons/fi';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import './DashboardPage.css';

const ACTION_ICONS = {
  CREATE: FiPlus,
  UPDATE: FiEdit,
  DELETE: FiTrash2,
  STATUS_CHANGE: FiRefreshCw,
  VIEW: FiActivity,
};

const ACTION_COLORS = {
  CREATE: '#2e7d32',
  UPDATE: '#1565c0',
  DELETE: '#c62828',
  STATUS_CHANGE: '#e65100',
  VIEW: '#6a1b9a',
};

const ENTITY_ICONS = {
  User: FiUsers,
  Ingredient: FiPackage,
  Recipe: FiBook,
  Order: FiShoppingBag,
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchActivityLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const res = await adminAPI.getActivityLogs();
      setActivityLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
        <span>Loading data...</span>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      gradient: 'linear-gradient(135deg, #f4511e, #e64a19)',
    },
    {
      label: 'Active',
      value: stats?.activeUsers || 0,
      icon: FiUserCheck,
      gradient: 'linear-gradient(135deg, #2e7d32, #1b5e20)',
    },
    {
      label: 'Blocked',
      value: stats?.blockedUsers || 0,
      icon: FiUserX,
      gradient: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
    },
    {
      label: 'New This Month',
      value: stats?.newUsersThisMonth || 0,
      icon: FiTrendingUp,
      gradient: 'linear-gradient(135deg, #ff9800, #e65100)',
    },
    {
      label: 'Ingredients',
      value: stats?.totalIngredients || 0,
      icon: FiPackage,
      gradient: 'linear-gradient(135deg, #ff7043, #f4511e)',
    },
    {
      label: 'Recipes',
      value: stats?.totalRecipes || 0,
      sub: `${stats?.publishedRecipes || 0} published`,
      icon: FiBook,
      gradient: 'linear-gradient(135deg, #e65100, #bf360c)',
    },
    {
      label: 'Orders',
      value: stats?.totalOrders || 0,
      sub: `${stats?.pendingOrders || 0} pending`,
      icon: FiShoppingBag,
      gradient: 'linear-gradient(135deg, #ff5722, #d84315)',
    },
    {
      label: "Today's Actions",
      value: stats?.todayActivities || 0,
      icon: FiZap,
      gradient: 'linear-gradient(135deg, #7c4dff, #651fff)',
    },
    {
      label: 'Family Members',
      value: stats?.totalFamilyMembers || 0,
      icon: FiHeart,
      gradient: 'linear-gradient(135deg, #ffb74d, #ff9800)',
    },
    {
      label: 'Health Conditions',
      value: stats?.totalHealthConditions || 0,
      icon: FiActivity,
      gradient: 'linear-gradient(135deg, #ff8a65, #ff5722)',
    },
    {
      label: 'App Visits',
      value: stats?.totalAppVisits || 0,
      sub: `${stats?.todayAppVisits || 0} today`,
      icon: FiSmartphone,
      gradient: 'linear-gradient(135deg, #26c6da, #00838f)',
    },
  ];

  // Pie chart — User status
  const pieData = [
    { name: 'Active', value: stats?.activeUsers || 0, color: '#2e7d32' },
    { name: 'Blocked', value: stats?.blockedUsers || 0, color: '#d32f2f' },
  ];

  // Area chart — User registration trend (mock last 6 months)
  const totalUsers = stats?.totalUsers || 0;
  const newThisMonth = stats?.newUsersThisMonth || 0;
  const trendData = [
    { month: 'Sep', users: Math.max(1, Math.floor(totalUsers * 0.4)) },
    { month: 'Oct', users: Math.max(1, Math.floor(totalUsers * 0.55)) },
    { month: 'Nov', users: Math.max(1, Math.floor(totalUsers * 0.65)) },
    { month: 'Dec', users: Math.max(1, Math.floor(totalUsers * 0.78)) },
    { month: 'Jan', users: Math.max(1, totalUsers - newThisMonth) },
    { month: 'Feb', users: Math.max(1, totalUsers) },
  ];

  // Order status donut
  const pendingOrders = stats?.pendingOrders || 0;
  const confirmedOrders = stats?.confirmedOrders || 0;
  const completedOrders = stats?.completedOrders || 0;
  const canceledOrders = stats?.canceledOrders || 0;
  const orderDonutData = [
    { name: 'Pending', value: pendingOrders, color: '#ff9800' },
    { name: 'Confirmed', value: confirmedOrders, color: '#2196f3' },
    { name: 'Completed', value: completedOrders, color: '#2e7d32' },
    { name: 'Canceled', value: canceledOrders, color: '#d32f2f' },
  ];

  const renderNote = (items) => (
    <div
      style={{
        marginBottom: 12,
        fontSize: '0.8125rem',
        color: 'var(--color-text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'flex-start',
      }}
    >
      {items.map((it) => (
        <span key={it.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: it.color, display: 'inline-block' }} />
          <span>{it.name}: {it.value}</span>
        </span>
      ))}
    </div>
  );

  // Daily activity chart data
  const dailyActivityData = (stats?.dailyActivities || []).map(d => ({
    date: d.date,
    actions: d.count,
  }));

  const tooltipStyle = {
    background: '#3e2723',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '0.8125rem',
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDateGroup = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const logDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (logDate.getTime() === today.getTime()) return 'Today';
    if (logDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">FoodLink System Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card card">
            <div className="stat-card-icon" style={{ background: card.gradient }}>
              <card.icon />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">{card.value.toLocaleString()}</span>
              <span className="stat-card-label">{card.label}</span>
              {card.sub && <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{card.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* 1: User Registration Trend — Area Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>📈 User Registration Trend</h3>
          </div>
          <div className="card-body chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f4511e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f4511e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e0e0e0' }} />
                <YAxis tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e0e0e0' }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#f4511e"
                  strokeWidth={3}
                  fill="url(#areaGradient)"
                  name="Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2: User Status — Pie Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>👥 User Status</h3>
          </div>
          <div className="card-body chart-body">
            {renderNote(pieData)}
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '0.8125rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3: Daily Activity — Area Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>⚡ Admin Activity (Last 7 Days)</h3>
          </div>
          <div className="card-body chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyActivityData}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c4dff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c4dff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e0e0e0' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e0e0e0' }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area
                  type="monotone"
                  dataKey="actions"
                  stroke="#7c4dff"
                  strokeWidth={3}
                  fill="url(#activityGradient)"
                  name="Actions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4: Order Status — Donut Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>🛒 Order Status</h3>
          </div>
          <div className="card-body chart-body">
            {renderNote(orderDonutData)}
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={orderDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {orderDonutData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '0.8125rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5: App Visits Trend — Area Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>📱 App Visits (Last 7 Days)</h3>
          </div>
          <div className="card-body chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={(stats?.dailyAppVisits || []).map(d => ({ date: d.date, visits: d.count }))}>
                <defs>
                  <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#26c6da" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#26c6da" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e0e0e0' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e0e0e0' }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#26c6da"
                  strokeWidth={3}
                  fill="url(#visitGradient)"
                  name="Visits"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6: Top Purchased Recipes */}
        <div className="card chart-card">
          <div className="card-header">
            <h3>⭐ Top Purchased Dishes</h3>
          </div>
          <div className="card-body chart-body" style={{ padding: '0 10px 10px 10px', overflowY: 'auto' }}>
            {(stats?.topPurchasedRecipes || []).length === 0 ? (
              <div className="activity-empty">
                <FiBook style={{ fontSize: '1.5rem', opacity: 0.4 }} />
                <span>No purchases recorded yet.</span>
              </div>
            ) : (
              <div className="top-recipe-items">
                {(stats?.topPurchasedRecipes || []).map((recipe, idx) => (
                  <div key={recipe.id} className="top-recipe-item">
                    <span className="top-recipe-rank">#{idx + 1}</span>
                    {recipe.imageUrl ? (
                       <img src={recipe.imageUrl} alt={recipe.name} className="top-recipe-img" />
                    ) : (
                       <div className="top-recipe-icon-placeholder"><FiBook /></div>
                    )}
                    <div className="top-recipe-info">
                      <span className="top-recipe-name">{recipe.name}</span>
                      <span className="top-recipe-count">{recipe.purchaseCount} sold</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 7: Recent Activity Log — spans full width */}
        <div className="card chart-card chart-card-wide">
          <div className="card-header">
            <h3>📋 Recent Activity</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Last {activityLogs.length} actions
            </span>
          </div>
          <div className="card-body" style={{ padding: '0' }}>
            {logsLoading ? (
              <div className="page-loading" style={{ padding: '40px 0' }}>
                <div className="spinner"></div>
                <span>Loading...</span>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="activity-empty">
                <FiActivity style={{ fontSize: '1.5rem', opacity: 0.4 }} />
                <span>No activity recorded yet. Admin actions will appear here.</span>
              </div>
            ) : (
              <div className="activity-log">
                {(() => {
                  const grouped = {};
                  activityLogs.forEach((log) => {
                    const dateKey = getDateGroup(log.createdAt);
                    if (!grouped[dateKey]) grouped[dateKey] = [];
                    grouped[dateKey].push(log);
                  });
                  return Object.entries(grouped).map(([dateLabel, logs]) => (
                    <div key={dateLabel}>
                      <div className="activity-date-divider">
                        <span>{dateLabel}</span>
                      </div>
                      {logs.map((log) => {
                        const ActionIcon = ACTION_ICONS[log.action] || FiActivity;
                        const EntityIcon = ENTITY_ICONS[log.entityType] || FiActivity;
                        const actionColor = ACTION_COLORS[log.action] || '#616161';
                        return (
                          <div key={log.id} className="activity-item">
                            <div className="activity-icon" style={{ background: actionColor + '18', color: actionColor }}>
                              <ActionIcon />
                            </div>
                            <div className="activity-body">
                              <div className="activity-desc">
                                <span className="activity-action-badge" style={{ background: actionColor + '18', color: actionColor }}>
                                  {log.action.replace('_', ' ')}
                                </span>
                                <span className="activity-entity-badge">
                                  <EntityIcon style={{ fontSize: '0.7rem' }} />
                                  {log.entityType}
                                </span>
                                <span className="activity-text">{log.description}</span>
                              </div>
                              <div className="activity-meta">
                                <span className="activity-user">{log.performedBy}</span>
                                <span className="activity-time">{formatTimeAgo(log.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
