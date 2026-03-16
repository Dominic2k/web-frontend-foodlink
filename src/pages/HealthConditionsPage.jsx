import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import { FiActivity, FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getErrorMessage } from '../utils/errorMessage';

export default function HealthConditionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    dietaryAdvice: '',
    exerciseAdvice: '',
    imageUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getHealthConditions({
        search,
        page,
        size: 10,
        sortBy: 'name',
        sortDir: 'asc',
      });
      const d = res.data.data;
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements || 0);
    } catch (err) {
      console.error('Failed to fetch conditions:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [search]);

  const showToast = (msg, type) => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: '',
      name: '',
      description: '',
      dietaryAdvice: '',
      exerciseAdvice: '',
      imageUrl: ''
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      code: item.code || '',
      name: item.name || '',
      description: item.description || '',
      dietaryAdvice: item.dietaryAdvice || '',
      exerciseAdvice: item.exerciseAdvice || '',
      imageUrl: item.imageUrl || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await adminAPI.updateHealthCondition(editing.id, form);
        showToast('Updated successfully', 'success');
      } else {
        await adminAPI.createHealthCondition(form);
        showToast('Created successfully', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      showToast(
        getErrorMessage(err, editing ? 'Failed to update health condition' : 'Failed to create health condition'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this health condition?')) return;
    try {
      await adminAPI.deleteHealthCondition(id);
      showToast('Deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete health condition'), 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-base) ease' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Health Conditions</h1>
          <p className="page-subtitle">Total {totalElements} health conditions</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add New</button>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div className="input-with-icon" style={{ maxWidth: 360 }}>
          <FiSearch className="input-icon" />
          <input
            className="input"
            placeholder="Search by name or code..."
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
            <FiActivity style={{ fontSize: '2rem' }} />
            <p>No health conditions found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>Code</th>
                    <th>Condition Name</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c, idx) => (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--color-text-muted)' }}>{page * 10 + idx + 1}</td>
                      <td>
                        <span className="badge badge-primary">{c.code || '—'}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: 300 }} className="text-truncate">
                        {c.description || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(c)}>
                            <FiEdit2 />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDelete(c.id)}
                          >
                            <FiTrash2 />
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
                  <button className="pagination-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <FiChevronLeft />
                  </button>
                  <button className="pagination-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Health Condition' : 'Add Health Condition'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    Code *
                  </label>
                  <input
                    className="input"
                    value={form.code}
                    onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. DIABETES"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    Name *
                  </label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Diabetes Mellitus"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Description
                </label>
                <textarea
                  className="input"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="General description of the condition..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Dietary Advice
                </label>
                <textarea
                  className="input"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  value={form.dietaryAdvice}
                  onChange={(e) => setForm(f => ({ ...f, dietaryAdvice: e.target.value }))}
                  placeholder="Foods to eat, foods to avoid..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Exercise & Lifestyle Advice
                </label>
                <textarea
                  className="input"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  value={form.exerciseAdvice}
                  onChange={(e) => setForm(f => ({ ...f, exerciseAdvice: e.target.value }))}
                  placeholder="Physical activities and habits..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Image URL
                </label>
                <input
                  className="input"
                  value={form.imageUrl}
                  onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.code.trim() || !form.name.trim()}
                style={{ marginTop: 8 }}
              >
                {saving ? (
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                ) : (
                  editing ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
