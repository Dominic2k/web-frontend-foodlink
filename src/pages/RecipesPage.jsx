import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiEye } from 'react-icons/fi';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];
const STATUS_BADGE = { draft: 'badge-warning', published: 'badge-success', archived: 'badge-info' };
const STATUS_LABEL = { draft: 'Draft', published: 'Published', archived: 'Archived' };

export default function RecipesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', instructions: '', prepTimeMin: '', cookTimeMin: '',
    baseServings: '1', imageUrl: '', status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRecipes({ search, status: statusFilter || undefined, page, size: 10, sortBy: 'createdAt', sortDir: 'desc' });
      const d = res.data.data;
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [search, statusFilter]);

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', instructions: '', prepTimeMin: '', cookTimeMin: '', baseServings: '1', imageUrl: '', status: 'draft' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '', description: item.description || '', instructions: item.instructions || '',
      prepTimeMin: item.prepTimeMin ?? '', cookTimeMin: item.cookTimeMin ?? '',
      baseServings: item.baseServings ?? '1', imageUrl: item.imageUrl || '', status: item.status || 'draft',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      prepTimeMin: form.prepTimeMin !== '' ? Number(form.prepTimeMin) : null,
      cookTimeMin: form.cookTimeMin !== '' ? Number(form.cookTimeMin) : null,
      baseServings: form.baseServings !== '' ? Number(form.baseServings) : 1,
    };
    try {
      if (editing) {
        await adminAPI.updateRecipe(editing.id, payload);
        showToast('Updated successfully', 'success');
      } else {
        await adminAPI.createRecipe(payload);
        showToast('Created successfully', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (e) { showToast('Action failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    try { await adminAPI.deleteRecipe(id); showToast('Deleted', 'success'); fetchData(); }
    catch (e) { showToast('Delete failed', 'error'); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await adminAPI.updateRecipeStatus(id, newStatus); showToast('Status updated successfully', 'success'); fetchData(); }
    catch (e) { showToast('Failed', 'error'); }
  };

  const viewDetail = async (id) => {
    try {
      const res = await adminAPI.getRecipeById(id);
      setDetailItem(res.data.data);
    } catch (e) { console.error(e); }
  };

  const inp = (label, key, type = 'text') => (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</label>
      <input className="input" type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn var(--transition-base) ease' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Recipe Management</h1>
          <p className="page-subtitle">Total {totalElements} recipes</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add New</button>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="input-with-icon" style={{ maxWidth: 300, flex: 1 }}>
          <FiSearch className="input-icon" />
          <input className="input" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_OPTIONS.map(s => (
            <button key={s.value} className={`btn btn-sm ${statusFilter === s.value ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setStatusFilter(s.value)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="page-loading"><div className="spinner spinner-lg"></div><span>Loading...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><FiSearch style={{ fontSize: '2rem' }} /><p>No recipes found</p></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr>
                  <th>Name</th><th>Time</th><th>Servings</th><th>Status</th><th>Created By</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr></thead>
                <tbody>
                  {items.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                        {r.prepTimeMin ? `${r.prepTimeMin}' prep` : ''}{r.prepTimeMin && r.cookTimeMin ? ' + ' : ''}{r.cookTimeMin ? `${r.cookTimeMin}' cook` : ''}
                        {!r.prepTimeMin && !r.cookTimeMin && '—'}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{r.baseServings || '—'}</td>
                      <td>
                        <select className="input" style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', minWidth: 100 }}
                          value={r.status} onChange={e => handleStatusChange(r.id, e.target.value)}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{r.createdByEmail || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => viewDetail(r.id)}><FiEye /></button>
                          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(r)}><FiEdit2 /></button>
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(r.id)}><FiTrash2 /></button>
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
                  <button className="pagination-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><FiChevronLeft /></button>
                  <button className="pagination-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><FiChevronRight /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Recipe' : 'Add New Recipe'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {inp('Recipe Name *', 'name')}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Instructions</label>
                <textarea className="input" rows={4} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {inp('Prep Time (min)', 'prepTimeMin', 'number')}
                {inp('Cook Time (min)', 'cookTimeMin', 'number')}
                {inp('Servings', 'baseServings', 'number')}
              </div>
              {inp('Image URL', 'imageUrl')}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : (editing ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{detailItem.name}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDetailItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <span className={`badge ${STATUS_BADGE[detailItem.status] || 'badge-info'}`}>{STATUS_LABEL[detailItem.status] || detailItem.status}</span>
              </div>
              {detailItem.description && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>{detailItem.description}</p>}
              {detailItem.instructions && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Instructions</h4>
                  <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{detailItem.instructions}</p>
                </div>
              )}
              {detailItem.ingredients && detailItem.ingredients.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Ingredients</h4>
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Quantity</th><th>Unit</th></tr></thead>
                    <tbody>
                      {detailItem.ingredients.map((ri, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>{ri.ingredientName}</td>
                          <td>{ri.quantity}</td>
                          <td>{ri.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
