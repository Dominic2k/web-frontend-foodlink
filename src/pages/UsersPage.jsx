import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import { FiSearch, FiEye, FiShield, FiShieldOff, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import UserDetailModal from '../components/UserDetailModal';
import './UsersPage.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({
        search,
        page,
        size: pageSize,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      const data = res.data.data;
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    setActionLoading(user.id);
    try {
      await adminAPI.updateUserStatus(user.id, newStatus);
      showToast(
        newStatus === 'blocked'
          ? `Blocked ${user.fullName}`
          : `Unblocked ${user.fullName}`,
        'success'
      );
      fetchUsers();
    } catch (err) {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Total {totalElements} users
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="users-toolbar card">
        <div className="input-with-icon" style={{ maxWidth: 360 }}>
          <FiSearch className="input-icon" />
          <input
            className="input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card users-table-card">
        {loading ? (
          <div className="page-loading">
            <div className="spinner spinner-lg"></div>
            <span>Loading...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <FiSearch style={{ fontSize: '2rem' }} />
            <p>No users found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" id="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="avatar" />
                          ) : (
                            <div className="avatar">{getInitials(u.fullName)}</div>
                          )}
                          <div>
                            <div className="user-cell-name">{u.fullName}</div>
                            {u.isAdmin && (
                              <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                                ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-secondary">{u.email}</td>
                      <td className="text-secondary">{u.phone || '—'}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.status === 'active' ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {u.status === 'active' ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="text-secondary">{formatDate(u.createdAt)}</td>
                      <td>
                        <div className="user-actions">
                          <button
                            className="btn btn-ghost btn-icon"
                            title="View details"
                            onClick={() => setSelectedUser(u)}
                          >
                            <FiEye />
                          </button>
                          {!u.isAdmin && (
                            <button
                              className={`btn btn-sm ${
                                u.status === 'active' ? 'btn-danger' : 'btn-primary'
                              }`}
                              onClick={() => handleToggleStatus(u)}
                              disabled={actionLoading === u.id}
                              title={u.status === 'active' ? 'Block' : 'Unblock'}
                            >
                              {actionLoading === u.id ? (
                                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                              ) : u.status === 'active' ? (
                                <>
                                  <FiShieldOff /> Block
                                </>
                              ) : (
                                <>
                                  <FiShield /> Unblock
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  Page {page + 1} / {totalPages}
                </span>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <FiChevronLeft />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    className="pagination-btn"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
