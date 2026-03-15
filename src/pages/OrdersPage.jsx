import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import { FiSearch, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getErrorMessage } from '../utils/errorMessage';
import './ManagementToolbar.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
];
const STATUS_BADGE = { pending: 'badge-warning', confirmed: 'badge-info', completed: 'badge-success', canceled: 'badge-danger' };
const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', canceled: 'Canceled' };

export default function OrdersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [detailItem, setDetailItem] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getOrders({ status: statusFilter || undefined, page, size: 10, sortBy: 'createdAt', sortDir: 'desc' });
      const d = res.data.data;
      setItems(d.content || []);
      setTotalPages(d.totalPages || 0);
      setTotalElements(d.totalElements || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [statusFilter]);

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(id, newStatus);
      showToast('Status updated successfully', 'success');
      fetchData();
      if (detailItem && detailItem.id === id) {
        setDetailItem(prev => ({ ...prev, status: newStatus }));
      }
    } catch (e) { showToast(getErrorMessage(e, 'Failed to update order status'), 'error'); }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    try {
      await adminAPI.cancelOrder(id);
      showToast('Order canceled successfully', 'success');
      fetchData();
      if (detailItem && detailItem.id === id) {
        setDetailItem(prev => ({ ...prev, status: 'canceled' }));
      }
    } catch (e) {
      showToast(getErrorMessage(e, 'Failed to cancel order'), 'error');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await adminAPI.getOrderById(id);
      setDetailItem(res.data.data);
    } catch (e) { console.error(e); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatMoney = (v) => {
    if (v == null || v === '') return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-base) ease' }}>
      <div className="page-header">
        <h1 className="page-title">Order Management</h1>
        <p className="page-subtitle">Total {totalElements} orders</p>
      </div>

      <div className="card management-toolbar">
        <div className="toolbar-field">
          <select className="input toolbar-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-actions">
          <button className="btn btn-outline" onClick={() => setStatusFilter('')}>
            Reset Filter
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="page-loading"><div className="spinner spinner-lg"></div><span>Loading...</span></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><FiSearch style={{ fontSize: '2rem' }} /><p>No orders found</p></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr>
                  <th>Order ID</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Created</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr></thead>
                <tbody>
                  {items.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{o.id?.substring(0, 8)}...</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{o.userFullName || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{o.userEmail}</div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formatMoney(o.totalAmount)}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{o.paymentMethod || '—'}</td>
                      <td>
                        <select className="input" style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto', minWidth: 110 }}
                          value={o.status} onChange={e => handleStatusChange(o.id, e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{formatDate(o.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button className="btn btn-ghost btn-icon" onClick={() => viewDetail(o.id)}>
                            <FiEye />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelOrder(o.id)}
                            disabled={o.status === 'canceled'}
                          >
                            Cancel
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
                  <button className="pagination-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}><FiChevronLeft /></button>
                  <button className="pagination-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><FiChevronRight /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="modal-content" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Details</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDetailItem(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className={`badge ${STATUS_BADGE[detailItem.status]}`}>{STATUS_LABEL[detailItem.status]}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                  ['Customer', detailItem.userFullName],
                  ['Email', detailItem.userEmail],
                  ['Delivery Phone', detailItem.deliveryPhone],
                  ['Address', detailItem.deliveryAddressText],
                  ['Note', detailItem.note],
                  ['Payment', detailItem.paymentMethod],
                  ['Total', formatMoney(detailItem.totalAmount)],
                  ['Created', formatDate(detailItem.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', borderBottom: '1px solid var(--color-border-light)', paddingBottom: 8 }}>
                    <span style={{ width: 130, flexShrink: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
              {detailItem.items && detailItem.items.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 12, borderBottom: '2px solid var(--color-border-light)', paddingBottom: 4 }}>Order Items (Recipes)</h4>
                  {detailItem.items.map((recipe, rIdx) => (
                    <div key={rIdx} style={{ marginBottom: 16, padding: 12, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px solid var(--color-border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 4 }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.875rem' }}>{recipe.recipeName}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          Servings: {recipe.servings} | Subtotal: {formatMoney(recipe.lineTotal)}
                        </span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ fontSize: '0.75rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'transparent' }}>
                              <th style={{ padding: '4px 8px' }}>Ingredient</th>
                              <th style={{ padding: '4px 8px' }}>Qty (Base)</th>
                              <th style={{ padding: '4px 8px' }}>Unit</th>
                              <th style={{ padding: '4px 8px' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recipe.ingredients && recipe.ingredients.map((ing, iIdx) => (
                              <tr key={iIdx}>
                                <td style={{ padding: '4px 8px', fontWeight: 500 }}>{ing.ingredientName}</td>
                                <td style={{ padding: '4px 8px' }}>{ing.quantityBase}</td>
                                <td style={{ padding: '4px 8px' }}>{ing.baseUnit}</td>
                                <td style={{ padding: '4px 8px', fontWeight: 600 }}>{formatMoney(ing.lineTotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
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
