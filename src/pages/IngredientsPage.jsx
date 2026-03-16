import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
} from 'react-icons/fi';
import { getErrorMessage } from '../utils/errorMessage';
import './ManagementToolbar.css';

const EXP_STATUS_BADGE = {
  valid: { cls: 'badge-success', label: 'Valid' },
  expiringSoon: { cls: 'badge-warning', label: 'Expiring soon' },
  expired: { cls: 'badge-danger', label: 'Expired' },
};

export default function IngredientsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: '',
    baseUnit: '',
    pricePerBaseUnit: '',
    stockQuantityBase: 0,
    imageUrl: '',
    expirationDate: '',
    receivedDate: '',
    isActive: true,
    caloriesPer100: '',
    proteinGPer100: '',
    carbGPer100: '',
    fatGPer100: '',
  });
  const [saving, setSaving] = useState(false);

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingItem, setReceivingItem] = useState(null);
  const [receiveForm, setReceiveForm] = useState({ quantityBase: '', receivedDate: '' });
  const [receiving, setReceiving] = useState(false);

  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getIngredients({
        search,
        status: statusFilter || undefined,
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      const d = res.data.data;
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    setPage(0);
  }, [search, statusFilter]);

  const showToast = (msg, type) => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      category: '',
      baseUnit: 'g',
      pricePerBaseUnit: '',
      stockQuantityBase: 0,
      imageUrl: '',
      expirationDate: '',
      receivedDate: '',
      isActive: true,
      caloriesPer100: '',
      proteinGPer100: '',
      carbGPer100: '',
      fatGPer100: '',
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      category: item.category || '',
      baseUnit: item.baseUnit || 'g',
      pricePerBaseUnit: item.pricePerBaseUnit ?? '',
      stockQuantityBase: item.stockQuantityBase ?? 0,
      imageUrl: item.imageUrl || '',
      expirationDate: item.expirationDate ?? '',
      receivedDate: item.receivedDate ?? '',
      isActive: item.isActive ?? true,
      caloriesPer100: item.caloriesPer100 ?? '',
      proteinGPer100: item.proteinGPer100 ?? '',
      carbGPer100: item.carbGPer100 ?? '',
      fatGPer100: item.fatGPer100 ?? '',
    });
    setShowModal(true);
  };

  const openReceive = (item) => {
    setReceivingItem(item);
    setReceiveForm({ quantityBase: '', receivedDate: '' });
    setShowReceiveModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.pricePerBaseUnit === '' || form.baseUnit.trim() === '') return;

    setSaving(true);
    const payload = {
      ...form,
      pricePerBaseUnit: form.pricePerBaseUnit !== '' ? Number(form.pricePerBaseUnit) : null,
      stockQuantityBase: form.stockQuantityBase !== '' ? Number(form.stockQuantityBase) : null,
      expirationDate: form.expirationDate ? form.expirationDate : null,
      receivedDate: form.receivedDate ? form.receivedDate : null,
      caloriesPer100: form.caloriesPer100 !== '' ? Number(form.caloriesPer100) : null,
      proteinGPer100: form.proteinGPer100 !== '' ? Number(form.proteinGPer100) : null,
      carbGPer100: form.carbGPer100 !== '' ? Number(form.carbGPer100) : null,
      fatGPer100: form.fatGPer100 !== '' ? Number(form.fatGPer100) : null,
    };

    try {
      if (editing) {
        await adminAPI.updateIngredient(editing.id, payload);
        showToast('Updated successfully', 'success');
      } else {
        await adminAPI.createIngredient(payload);
        showToast('Created successfully', 'success');
      }
      setShowModal(false);
      fetchData();
    } catch (e) {
      showToast(
        getErrorMessage(e, editing ? 'Failed to update ingredient' : 'Failed to create ingredient'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReceive = async () => {
    if (!receivingItem) return;
    if (receiveForm.quantityBase === '' || Number(receiveForm.quantityBase) <= 0) return;

    setReceiving(true);
    const payload = {
      quantityBase: Number(receiveForm.quantityBase),
      receivedDate: receiveForm.receivedDate ? receiveForm.receivedDate : null,
    };

    try {
      await adminAPI.receiveIngredientStock(receivingItem.id, payload);
      showToast('Stock received successfully', 'success');
      setShowReceiveModal(false);
      setReceivingItem(null);
      fetchData();
    } catch (e) {
      showToast(getErrorMessage(e, 'Failed to receive stock'), 'error');
    } finally {
      setReceiving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) return;
    try {
      await adminAPI.deleteIngredient(id);
      showToast('Deleted successfully', 'success');
      fetchData();
    } catch (e) {
      showToast(getErrorMessage(e, 'Failed to delete ingredient'), 'error');
    }
  };

  const inp = (label, key, type = 'text') => (
    <div style={{ flex: 1 }}>
      <label
        style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        className="input"
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  const formatMoney = (value) => {
    if (value == null || value === '') return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const expBadge = (status) => {
    if (!status) return <span className="badge badge-info">Chưa có HSD</span>;
    const m = EXP_STATUS_BADGE[status];
    if (!m) return <span className="badge badge-info">{status}</span>;
    return <span className={`badge ${m.cls}`}>{m.label}</span>;
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-base) ease' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Ingredient Management</h1>
          <p className="page-subtitle">Total {totalElements} ingredients</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> Add New
        </button>
      </div>

      <div className="card management-toolbar">
        <div className="input-with-icon toolbar-search" style={{ maxWidth: 360, flex: '1 1 360px' }}>
          <FiSearch className="input-icon" />
          <input
            className="input"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-field">
          <select className="input toolbar-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button
            className="btn btn-outline"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPage(0);
            }}
          >
            Reset Filters
          </button>
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
            <FiSearch style={{ fontSize: '2rem' }} />
            <p>No ingredients found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', position: 'relative', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
              <table className="data-table" style={{ minWidth: 1400 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Base Unit</th>
                    <th>Price/Unit</th>
                    <th>Stock</th>
                    <th>Received</th>
                    <th>Expiration</th>
                    <th>Exp. Status</th>
                    <th>Cal/100</th>
                    <th>Protein</th>
                    <th>Carb</th>
                    <th>Fat</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', position: 'sticky', right: 0, background: 'var(--color-bg)', zIndex: 2 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 600 }}>{i.name}</td>
                      <td>
                        <span className="badge badge-info">{i.category || '-'}</span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{i.baseUnit || '-'}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{formatMoney(i.pricePerBaseUnit)}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{i.stockQuantityBase}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{i.receivedDate || '-'}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{i.expirationDate || '-'}</td>
                      <td>{expBadge(i.expirationStatus)}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{i.caloriesPer100 ?? '-'}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{i.proteinGPer100 ?? '-'}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{i.carbGPer100 ?? '-'}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{i.fatGPer100 ?? '-'}</td>
                      <td>
                        <span className={`badge ${i.isActive ? 'badge-success' : 'badge-danger'}`}>{i.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ position: 'sticky', right: 0, background: 'var(--color-surface)', zIndex: 3, borderLeft: '1px solid var(--color-border-light)', boxShadow: '-6px 0 12px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--color-text)' }} title="Receive stock" onClick={() => openReceive(i)}>
                            <FiPackage />
                          </button>
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--color-text)' }} title="Edit" onClick={() => openEdit(i)}>
                            <FiEdit2 />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Delete"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDelete(i.id)}
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
                <span className="pagination-info">
                  Page {page + 1} / {totalPages}
                </span>
                <div className="pagination-controls">
                  <button className="pagination-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    <FiChevronLeft />
                  </button>
                  <button className="pagination-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
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
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Ingredient' : 'Add New Ingredient'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                âœ•
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {inp('Ingredient Name *', 'name')}
              <div style={{ display: 'flex', gap: 12 }}>{inp('Category', 'category')}{inp('Base Unit *', 'baseUnit')}</div>
              <div style={{ display: 'flex', gap: 12 }}>{inp('Price per Base Unit *', 'pricePerBaseUnit', 'number')}{inp('Stock Quantity', 'stockQuantityBase', 'number')}</div>
              <div style={{ display: 'flex', gap: 12 }}>{inp('Received Date', 'receivedDate', 'date')}{inp('Expiration Date', 'expirationDate', 'date')}</div>
              {inp('Image URL', 'imageUrl')}

              <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 14 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 10, color: 'var(--color-text-secondary)' }}>
                  Nutrition Info (per 100g)
                </p>
                <div style={{ display: 'flex', gap: 12 }}>{inp('Calories', 'caloriesPer100', 'number')}{inp('Protein (g)', 'proteinGPer100', 'number')}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>{inp('Carb (g)', 'carbGPer100', 'number')}{inp('Fat (g)', 'fatGPer100', 'number')}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
                <label htmlFor="isActive" style={{ fontSize: '0.875rem' }}>
                  Active
                </label>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
                {saving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowReceiveModal(false);
            setReceivingItem(null);
          }}
        >
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Receive Stock</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => {
                  setShowReceiveModal(false);
                  setReceivingItem(null);
                }}
              >
                âœ•
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Ingredient: <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{receivingItem?.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    Quantity ({receivingItem?.baseUnit || 'base'}) *
                  </label>
                  <input
                    className="input"
                    type="number"
                    value={receiveForm.quantityBase}
                    onChange={(e) => setReceiveForm((f) => ({ ...f, quantityBase: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    Received Date
                  </label>
                  <input
                    className="input"
                    type="date"
                    value={receiveForm.receivedDate}
                    onChange={(e) => setReceiveForm((f) => ({ ...f, receivedDate: e.target.value }))}
                  />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleReceive} disabled={receiving} style={{ marginTop: 8 }}>
                {receiving ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> : 'Receive'}
              </button>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Note: System will reject receiving stock if the ingredient is already expired.
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}




