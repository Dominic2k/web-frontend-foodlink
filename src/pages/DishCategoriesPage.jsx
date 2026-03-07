import { useState, useEffect, useCallback } from 'react';
import {
  FiSearch,
  FiList,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiEdit2,
  FiSlash,
} from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';

export default function DishCategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeactivateItem, setConfirmDeactivateItem] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDishCategories({
        search,
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      const d = res.data?.data || {};
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch dish categories:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      isActive: item.isActive ?? true,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description?.trim() || '',
        isActive: form.isActive,
      };

      if (editing) {
        await adminAPI.updateDishCategory(editing.id, payload);
        showToast('Updated successfully', 'success');
      } else {
        await adminAPI.createDishCategory(payload);
        showToast('Created successfully', 'success');
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivateItem?.isActive) return;
    try {
      await adminAPI.deactivateDishCategory(confirmDeactivateItem.id);
      showToast('Deactivated successfully', 'success');
      setConfirmDeactivateItem(null);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Deactivate failed';
      showToast(msg, 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-base) ease' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dish Categories</h1>
          <p className="page-subtitle">Total {totalElements} categories</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Create Dish Category
        </button>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div className="input-with-icon" style={{ maxWidth: 360 }}>
          <FiSearch className="input-icon" />
          <input
            className="input"
            placeholder="Search by category name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="page-loading">
            <div className="spinner spinner-lg"></div>
            <span>Loading...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <FiList />
            <p>No dish categories found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>STT</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ color: 'var(--color-text-muted)' }}>{page * 10 + idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{item.description || '-'}</td>
                      <td>
                        <span className={`badge ${item.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(item)} title="Update">
                            <FiEdit2 />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => setConfirmDeactivateItem(item)}
                            disabled={!item.isActive}
                            title="Deactivate"
                          >
                            <FiSlash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">Page {page + 1} / {totalPages}</span>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <FiChevronLeft />
                  </button>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Update Dish Category' : 'Create Dish Category'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Category Name *
                </label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Enter description"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" style={{ fontSize: '0.875rem' }}>Active</label>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                style={{ marginTop: 8 }}
              >
                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : (editing ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeactivateItem && (
        <div className="modal-overlay" onClick={() => setConfirmDeactivateItem(null)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deactivate Dish Category</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setConfirmDeactivateItem(null)}>x</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to deactivate category "{confirmDeactivateItem.name}"?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setConfirmDeactivateItem(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeactivate}>
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
