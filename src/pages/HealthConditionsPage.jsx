import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import { FiActivity, FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
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
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const normalizeImageUrl = (value) => {
    if (!value) return '';
    const raw =
      typeof value === 'string'
        ? value
        : value.url || value.path || value.imageUrl || '';
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    return `${base}/${raw.replace(/^\/+/, '')}`;
  };

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
      const list = (d.content || []).map(item => ({
        ...item,
        imageUrl: normalizeImageUrl(item.imageUrl || item.image),
      }));
      setItems(list);
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
      imageUrl: normalizeImageUrl(item.imageUrl || item.image)
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
    try {
      await adminAPI.deleteHealthCondition(id);
      showToast('Deleted successfully', 'success');
      setShowDeleteConfirm(null);
      fetchData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete health condition'), 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await adminAPI.uploadHealthConditionImage(file);
      const url = normalizeImageUrl(res.data?.data);
      setForm(f => ({ ...f, imageUrl: url }));
      showToast('Image uploaded successfully', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to upload image'), 'error');
    } finally {
      setUploadingImg(false);
      e.target.value = null; // reset input
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
                    <th style={{ width: 72 }}>Image</th>
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
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt={c.name}
                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border-light)' }}
                          />
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <span className="badge badge-primary">{c.code || '-'}</span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: 300 }} className="text-truncate">
                        {c.description || '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(c)}>
                            <FiEdit2 />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => setShowDeleteConfirm(c.id)}
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
              <button className="btn btn-ghost btn-icon" aria-label="Close" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
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

              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
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
                <div style={{ marginBottom: 4 }}>
                  <input type="file" id="healthConditionImageUpload" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                  <button type="button" className="btn btn-outline" style={{ height: 38 }} onClick={(e) => { e.preventDefault(); document.getElementById('healthConditionImageUpload').click(); }} disabled={uploadingImg}>
                    {uploadingImg ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
              </div>
              {form.imageUrl && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img
                    src={form.imageUrl}
                    alt="Health condition preview"
                    style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--color-border-light)' }}
                  />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                    Preview from uploaded image
                  </span>
                </div>
              )}

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="btn btn-ghost btn-icon" aria-label="Close" onClick={() => setShowDeleteConfirm(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(229, 72, 77, 0.12)',
                color: 'var(--color-danger)',
                fontSize: '2.3rem'
              }}>
                <FiTrash2 />
              </div>
              <p style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
                Are you sure you want to delete this health condition? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
