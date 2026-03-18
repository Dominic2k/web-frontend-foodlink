import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiEye, FiX } from 'react-icons/fi';
import { getErrorMessage } from '../utils/errorMessage';
import './ManagementToolbar.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];
const STATUS_BADGE = { draft: 'badge-warning', published: 'badge-success', archived: 'badge-info' };
const STATUS_LABEL = { draft: 'Draft', published: 'Published', archived: 'Archived' };

const EMPTY_INGREDIENT_ROW = { ingredientId: '', ingredientName: '', quantity: '', unit: '', isOptional: false, inputMode: 'select' };

export default function RecipesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', instructions: '', prepTimeMin: '', cookTimeMin: '',
    baseServings: '1', imageUrl: '', status: 'draft', ingredients: [],
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // stores recipe ID to delete
  const [allIngredients, setAllIngredients] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [showFullInstructions, setShowFullInstructions] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRecipes({
        search,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      const d = res.data.data;
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, statusFilter, categoryFilter, page]);

  useEffect(() => { fetchData(); fetchAllCategories(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [search, statusFilter, categoryFilter]);

  const fetchAllIngredients = async () => {
    try {
      const res = await adminAPI.getAllIngredients();
      setAllIngredients(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAllCategories = async () => {
    try {
      const res = await adminAPI.getAllDishCategories();
      setAllCategories(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', instructions: '', prepTimeMin: '', cookTimeMin: '', baseServings: '1', imageUrl: '', status: 'draft', ingredients: [], categoryIds: [] });
    fetchAllIngredients();
    fetchAllCategories();
    setShowModal(true);
  };

  const openEdit = async (item) => {
    setEditing(item);
    await fetchAllIngredients();
    await fetchAllCategories();
    // fetch full detail to get ingredients
    try {
      const res = await adminAPI.getRecipeById(item.id);
      const detail = res.data.data;
      const ingredients = (detail.ingredients || []).map(ri => ({
        ingredientId: ri.ingredientId || '',
        ingredientName: ri.ingredientName || '',
        quantity: ri.quantity ?? '',
        unit: ri.unit || '',
        isOptional: ri.isOptional || false,
        inputMode: ri.ingredientId ? 'select' : 'text',
      }));
      setForm({
        name: detail.name || '', description: detail.description || '', instructions: detail.instructions || '',
        prepTimeMin: detail.prepTimeMin ?? '', cookTimeMin: detail.cookTimeMin ?? '',
        baseServings: detail.baseServings ?? '1', imageUrl: detail.imageUrl || '', status: detail.status || 'draft',
        ingredients,
        categoryIds: (detail.categories || []).map(c => c.id),
      });
    } catch (e) {
      // fallback to basic info
      setForm({
        name: item.name || '', description: item.description || '', instructions: item.instructions || '',
        prepTimeMin: item.prepTimeMin ?? '', cookTimeMin: item.cookTimeMin ?? '',
        baseServings: item.baseServings ?? '1', imageUrl: item.imageUrl || '', status: item.status || 'draft',
        ingredients: [],
        categoryIds: (item.categories || []).map(c => c.id),
      });
    }
    setShowModal(true);
  };

  // --- Ingredient row helpers ---
  const addIngredientRow = () => {
    setForm(f => ({ ...f, ingredients: [...f.ingredients, { ...EMPTY_INGREDIENT_ROW }] }));
  };

  const removeIngredientRow = (idx) => {
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, i) => i !== idx) }));
  };

  const updateIngredientRow = (idx, field, value) => {
    setForm(f => {
      const list = [...f.ingredients];
      list[idx] = { ...list[idx], [field]: value };
      // When switching input mode, clear the other field
      if (field === 'inputMode') {
        if (value === 'select') list[idx].ingredientName = '';
        else list[idx].ingredientId = '';
      }
      // When selecting an ingredient, auto-fill unit from ingredient's defaultUnit
      if (field === 'ingredientId' && value) {
        const found = allIngredients.find(ing => ing.id === value);
        if (found && found.defaultUnit && !list[idx].unit) {
          list[idx].unit = found.defaultUnit;
        }
      }
      return { ...f, ingredients: list };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const ingredientsPayload = form.ingredients
      .filter(r => (r.ingredientId || r.ingredientName.trim()) && r.quantity)
      .map(r => ({
        ingredientId: r.ingredientId || null,
        ingredientName: r.ingredientName.trim() || null,
        quantity: Number(r.quantity),
        unit: r.unit || '',
        isOptional: r.isOptional || false,
      }));
    const payload = {
      name: form.name,
      description: form.description,
      instructions: form.instructions,
      prepTimeMin: form.prepTimeMin !== '' ? Number(form.prepTimeMin) : null,
      cookTimeMin: form.cookTimeMin !== '' ? Number(form.cookTimeMin) : null,
      baseServings: form.baseServings !== '' ? Number(form.baseServings) : 1,
      imageUrl: form.imageUrl,
      status: form.status,
      ingredients: ingredientsPayload,
      categoryIds: form.categoryIds || [],
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
    } catch (e) {
      showToast(
        getErrorMessage(e, editing ? 'Failed to update recipe' : 'Failed to create recipe'),
        'error'
      );
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteRecipe(id);
      showToast('Deleted successfully', 'success');
      setShowDeleteConfirm(null);
      fetchData();
    } catch (e) {
      showToast(getErrorMessage(e, 'Failed to delete recipe'), 'error');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try { await adminAPI.updateRecipeStatus(id, newStatus); showToast('Status updated successfully', 'success'); fetchData(); }
    catch (e) { showToast(getErrorMessage(e, 'Failed to update recipe status'), 'error'); }
  };

  const viewDetail = async (id) => {
    try {
      const res = await adminAPI.getRecipeById(id);
      setDetailItem(res.data.data);
      setShowFullInstructions(false);
    } catch (e) {
      console.error(e);
      showToast(getErrorMessage(e, 'Failed to load recipe details'), 'error');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await adminAPI.uploadRecipeImage(file);
      const url = res.data.data;
      setForm(f => ({ ...f, imageUrl: url }));
      showToast('Image uploaded successfully', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to upload image'), 'error');
    } finally {
      setUploadingImg(false);
      e.target.value = null; // reset input
    }
  };

  const inp = (label, key, type = 'text') => (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</label>
      <input className="input" type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
    </div>
  );

  const formatMoney = (value) => {
    if (value == null || value === '') return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-base) ease' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Recipe Management</h1>
          <p className="page-subtitle">Total {totalElements} recipes</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add New</button>
      </div>

      <div className="card management-toolbar">
        <div className="input-with-icon toolbar-search" style={{ maxWidth: 360, flex: '1 1 360px' }}>
          <FiSearch className="input-icon" />
          <input className="input" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="toolbar-field">
          <select className="input toolbar-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="toolbar-field">
          <select className="input toolbar-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All categories</option>
          {allCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        </div>
        <div className="toolbar-actions">
        <button className="btn btn-outline" onClick={() => {
          setSearch(''); setStatusFilter(''); setCategoryFilter(''); setPage(0);
        }}>
          Reset Filters
        </button>
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
                  <th>Name</th><th>Categories</th><th>Time</th><th>Servings</th><th>Giá/khẩu phần</th><th>Ingredients</th><th>Status</th><th>Created By</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr></thead>
                <tbody>
                  {items.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>
                        {r.categories && r.categories.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {r.categories.map(c => (
                              <span key={c.id} className="badge badge-info" style={{ fontSize: '0.7rem' }}>{c.name}</span>
                            ))}
                          </div>
                        ) : <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                        {r.prepTimeMin ? `${r.prepTimeMin}' prep` : ''}{r.prepTimeMin && r.cookTimeMin ? ' + ' : ''}{r.cookTimeMin ? `${r.cookTimeMin}' cook` : ''}
                        {!r.prepTimeMin && !r.cookTimeMin && '—'}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{r.baseServings || '—'}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{formatMoney(r.pricePerServing)}</td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                          {r.ingredients ? r.ingredients.length : 0} items
                        </span>
                      </td>
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
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--color-danger)' }} onClick={() => setShowDeleteConfirm(r.id)}><FiTrash2 /></button>
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
          <div className="modal-content" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Recipe' : 'Add New Recipe'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
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
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>{inp('Image URL', 'imageUrl')}</div>
                <div style={{ marginBottom: 4 }}>
                  <input type="file" id="recipeImageUpload" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                  <button type="button" className="btn btn-outline" style={{ height: 38 }} onClick={(e) => { e.preventDefault(); document.getElementById('recipeImageUpload').click(); }} disabled={uploadingImg}>
                    {uploadingImg ? 'Uploading...' : 'Upload Image'}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* ===== Categories Section ===== */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Categories</label>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 8,
                  border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                  padding: '10px 12px', maxHeight: 120, overflowY: 'auto',
                  background: 'var(--color-bg-secondary, rgba(0,0,0,0.02))'
                }}>
                  {allCategories.length === 0 ? (
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>No categories available</span>
                  ) : allCategories.map(cat => (
                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8125rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={(form.categoryIds || []).includes(cat.id)}
                        onChange={e => {
                          const ids = form.categoryIds || [];
                          setForm(f => ({ ...f, categoryIds: e.target.checked ? [...ids, cat.id] : ids.filter(id => id !== cat.id) }));
                        }} />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* ===== Ingredients Section ===== */}
              <div style={{
                marginTop: 8, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                padding: 16, background: 'var(--color-bg-secondary, rgba(0,0,0,0.02))'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>
                    Ingredients ({form.ingredients.length})
                  </h4>
                  <button type="button" className="btn btn-sm btn-outline" onClick={addIngredientRow}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiPlus size={14} /> Add Ingredient
                  </button>
                </div>

                {form.ingredients.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', textAlign: 'center', padding: '12px 0' }}>
                    No ingredients added yet. Click "Add Ingredient" to start.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {form.ingredients.map((row, idx) => (
                      <div key={idx} style={{
                        display: 'flex', gap: 8, alignItems: 'flex-end',
                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                        background: 'var(--color-bg, white)', border: '1px solid var(--color-border)',
                      }}>
                        {/* Ingredient selector */}
                        <div style={{ flex: 2, minWidth: 0 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                            Ingredient
                            <button type="button"
                              onClick={() => updateIngredientRow(idx, 'inputMode', row.inputMode === 'select' ? 'text' : 'select')}
                              style={{
                                background: 'none', border: 'none', color: 'var(--color-primary)',
                                fontSize: '0.7rem', cursor: 'pointer', marginLeft: 6, textDecoration: 'underline'
                              }}>
                              {row.inputMode === 'select' ? '+ New' : '← Select'}
                            </button>
                          </label>
                          {row.inputMode === 'select' ? (
                            <select className="input" style={{ fontSize: '0.8125rem' }}
                              value={row.ingredientId}
                              onChange={e => updateIngredientRow(idx, 'ingredientId', e.target.value)}>
                              <option value="">-- Select --</option>
                              {allIngredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input className="input" placeholder="Enter new ingredient name"
                              style={{ fontSize: '0.8125rem' }}
                              value={row.ingredientName}
                              onChange={e => updateIngredientRow(idx, 'ingredientName', e.target.value)} />
                          )}
                        </div>
                        {/* Quantity */}
                        <div style={{ width: 80 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Qty</label>
                          <input className="input" type="number" style={{ fontSize: '0.8125rem' }}
                            value={row.quantity}
                            onChange={e => updateIngredientRow(idx, 'quantity', e.target.value)} />
                        </div>
                        {/* Unit */}
                        <div style={{ width: 90 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Unit</label>
                          <input className="input" placeholder="e.g. gram" style={{ fontSize: '0.8125rem' }}
                            value={row.unit}
                            onChange={e => updateIngredientRow(idx, 'unit', e.target.value)} />
                        </div>
                        {/* Optional checkbox */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 8 }}>
                          <input type="checkbox" id={`opt-${idx}`} checked={row.isOptional}
                            onChange={e => updateIngredientRow(idx, 'isOptional', e.target.checked)} />
                          <label htmlFor={`opt-${idx}`} style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Optional</label>
                        </div>
                        {/* Remove button */}
                        <button type="button" className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--color-danger)', padding: 4, marginBottom: 4 }}
                          onClick={() => removeIngredientRow(idx)}>
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
              {detailItem.imageUrl && (
                <div style={{ marginBottom: 16, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <img src={detailItem.imageUrl} alt={detailItem.name} style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                </div>
              )}
              {detailItem.description && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>{detailItem.description}</p>}

              {/* Categories */}
              {detailItem.categories && detailItem.categories.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Categories</h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {detailItem.categories.map(c => (
                      <span key={c.id} className="badge badge-info">{c.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                {detailItem.prepTimeMin && (
                  <div style={{ fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600 }}>Prep:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{detailItem.prepTimeMin} min</span>
                  </div>
                )}
                {detailItem.cookTimeMin && (
                  <div style={{ fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600 }}>Cook:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{detailItem.cookTimeMin} min</span>
                  </div>
                )}
                {detailItem.baseServings && (
                  <div style={{ fontSize: '0.8125rem' }}>
                    <span style={{ fontWeight: 600 }}>Servings:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{detailItem.baseServings}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600 }}>Total ingredient cost:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{formatMoney(detailItem.totalIngredientPrice)}</span>
                </div>
                <div style={{ fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600 }}>Price per serving:</span> <span style={{ color: 'var(--color-text-secondary)' }}>{formatMoney(detailItem.pricePerServing)}</span>
                </div>
              </div>

              {detailItem.instructions && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Instructions</h4>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary)',
                    maxHeight: showFullInstructions ? 'none' : '120px',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'max-height 0.3s ease'
                  }}>
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{detailItem.instructions}</p>
                    {!showFullInstructions && detailItem.instructions.length > 200 && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
                        background: 'linear-gradient(transparent, var(--color-bg, white))',
                        pointerEvents: 'none'
                      }}></div>
                    )}
                  </div>
                  {detailItem.instructions.length > 200 && (
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '4px 0', height: 'auto', marginTop: 4, color: 'var(--color-primary)' }}
                      onClick={() => setShowFullInstructions(!showFullInstructions)}
                    >
                      {showFullInstructions ? 'Show less' : 'Read full instructions'}
                    </button>
                  )}
                </div>
              )}

              {/* Ingredients in detail */}
              <div>
                <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                  Ingredients {detailItem.ingredients ? `(${detailItem.ingredients.length})` : '(0)'}
                </h4>
                {detailItem.ingredients && detailItem.ingredients.length > 0 ? (
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Quantity</th><th>Unit</th><th>Optional</th></tr></thead>
                    <tbody>
                      {detailItem.ingredients.map((ri, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>{ri.ingredientName}</td>
                          <td>{ri.quantity}</td>
                          <td>{ri.unit}</td>
                          <td>{ri.isOptional ? <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Optional</span> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>No ingredients added.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--color-danger)', fontSize: '3rem', marginBottom: 16 }}>
                <FiTrash2 />
              </div>
              <p style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
                Are you sure you want to delete this recipe? This action cannot be undone.
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
