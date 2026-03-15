import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';
import Toast from '../components/Toast';
import {
  FiSearch,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiX,
} from 'react-icons/fi';
import { getErrorMessage } from '../utils/errorMessage';
import './ManagementToolbar.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
];

const STATUS_BADGE = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  canceled: 'badge-danger',
};

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  canceled: 'Canceled',
};

export default function OrdersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [detailItem, setDetailItem] = useState(null);
  const [recipeDetail, setRecipeDetail] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getOrders({
        status: statusFilter || undefined,
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      });
      const data = res.data.data;
      setItems(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminAPI.updateOrderStatus(id, newStatus);
      showToast('Status updated successfully', 'success');
      fetchData();
      if (detailItem && detailItem.id === id) {
        setDetailItem((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to update order status'), 'error');
    }
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
        setDetailItem((prev) => ({ ...prev, status: 'canceled' }));
      }
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to cancel order'), 'error');
    }
  };

  const viewDetail = async (id) => {
    try {
      const res = await adminAPI.getOrderById(id);
      setDetailItem(res.data.data);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to load order details'), 'error');
    }
  };

  const viewRecipeDetail = async (recipeId) => {
    if (!recipeId) return;
    try {
      const res = await adminAPI.getRecipeById(recipeId);
      setRecipeDetail(res.data.data);
    } catch (error) {
      showToast(getErrorMessage(error, 'Failed to load recipe details'), 'error');
    }
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  const formatMoney = (value) => {
    if (value == null || value === '') return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatQuantity = (value) => {
    if (value == null || value === '') return '—';
    return Number(value).toLocaleString('en-US', { maximumFractionDigits: 3 });
  };

  return (
    <div style={{ animation: 'fadeIn var(--transition-base) ease' }}>
      <div className="page-header">
        <h1 className="page-title">Order Management</h1>
        <p className="page-subtitle">Total {totalElements} orders</p>
      </div>

      <div className="card management-toolbar">
        <div className="toolbar-field">
          <select
            className="input toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
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
          <div className="page-loading">
            <div className="spinner spinner-lg"></div>
            <span>Loading...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <FiSearch style={{ fontSize: '2rem' }} />
            <p>No orders found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((order) => (
                    <tr key={order.id}>
                      <td
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {order.id?.substring(0, 8)}...
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {order.userFullName || '—'}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {order.userEmail}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                        {formatMoney(order.totalAmount)}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>
                        {order.paymentMethod || '—'}
                      </td>
                      <td>
                        <select
                          className="input"
                          style={{
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            width: 'auto',
                            minWidth: 110,
                          }}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="canceled">Canceled</option>
                        </select>
                      </td>
                      <td
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {formatDate(order.createdAt)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => viewDetail(order.id)}
                          >
                            <FiEye />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={order.status === 'canceled'}
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
                <span className="pagination-info">
                  Page {page + 1} / {totalPages}
                </span>
                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    disabled={page === 0}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    className="pagination-btn"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detailItem && (
        <div className="modal-overlay" onClick={() => setDetailItem(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 860 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Order Details</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDetailItem(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 20,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    Order ID
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600 }}>
                    {detailItem.id}
                  </div>
                </div>
                <span className={`badge ${STATUS_BADGE[detailItem.status] || 'badge-info'}`}>
                  {STATUS_LABEL[detailItem.status] || detailItem.status}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <section
                  style={{
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12 }}>
                    Order Summary
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      ['Status', STATUS_LABEL[detailItem.status] || detailItem.status],
                      ['Payment', detailItem.paymentMethod],
                      ['Total', formatMoney(detailItem.totalAmount)],
                      ['Created', formatDate(detailItem.createdAt)],
                      ['Updated', formatDate(detailItem.updatedAt)],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          display: 'flex',
                          borderBottom: '1px solid var(--color-border-light)',
                          paddingBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 96,
                            flexShrink: 0,
                            fontSize: '0.8125rem',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {label}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {value || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  style={{
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 12 }}>
                    Customer & Delivery
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      ['Customer', detailItem.userFullName],
                      ['Email', detailItem.userEmail],
                      ['Phone', detailItem.deliveryPhone],
                      ['Address', detailItem.deliveryAddressText],
                      ['Note', detailItem.note],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          display: 'flex',
                          borderBottom: '1px solid var(--color-border-light)',
                          paddingBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 96,
                            flexShrink: 0,
                            fontSize: '0.8125rem',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            wordBreak: 'break-word',
                          }}
                        >
                          {value || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {detailItem.items && detailItem.items.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>
                    Ordered Recipes
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {detailItem.items.map((recipe, index) => (
                      <div
                        key={recipe.id || index}
                        style={{
                          padding: 14,
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 10,
                          border: '1px solid var(--color-border-light)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 8,
                            flexWrap: 'wrap',
                            gap: 10,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 700,
                                color: 'var(--color-primary)',
                                fontSize: '0.95rem',
                                marginBottom: 4,
                              }}
                            >
                              {recipe.recipeName || 'Unknown recipe'}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: 8,
                                flexWrap: 'wrap',
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              <span className="badge badge-info">
                                Servings: {recipe.servings ?? '—'}
                              </span>
                              <span className="badge badge-primary">
                                Recipe ID: {recipe.recipeId || '—'}
                              </span>
                            </div>
                          </div>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => viewRecipeDetail(recipe.recipeId)}
                            disabled={!recipe.recipeId}
                          >
                            <FiExternalLink />
                            <span>View Base Recipe</span>
                          </button>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.8125rem',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.5,
                          }}
                        >
                          Recipe rows are shown as references only. Ingredient changes are listed
                          separately below because the ordered version may differ from the base
                          recipe.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailItem.items && detailItem.items.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>
                    Ingredient Snapshots
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {detailItem.items.map((recipe, index) => (
                      <div
                        key={`${recipe.id || index}-ingredients`}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          border: '1px solid var(--color-border-light)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 8,
                            marginBottom: 10,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{recipe.recipeName || 'Unknown recipe'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {recipe.ingredients?.length || 0} ingredient snapshot
                            {recipe.ingredients?.length === 1 ? '' : 's'}
                          </div>
                        </div>

                        {recipe.ingredients && recipe.ingredients.length > 0 ? (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ fontSize: '0.78rem' }}>
                              <thead>
                                <tr>
                                  <th>Ingredient</th>
                                  <th>Quantity</th>
                                  <th>Base Unit</th>
                                  <th>Recorded Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                {recipe.ingredients.map((ingredient, ingredientIndex) => (
                                  <tr
                                    key={`${
                                      ingredient.ingredientId || ingredient.ingredientName
                                    }-${ingredientIndex}`}
                                  >
                                    <td style={{ fontWeight: 600 }}>
                                      {ingredient.ingredientName || '—'}
                                    </td>
                                    <td>{formatQuantity(ingredient.quantityBase)}</td>
                                    <td>{ingredient.baseUnit || '—'}</td>
                                    <td>{formatMoney(ingredient.lineTotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.8125rem',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            No ingredient snapshot recorded for this item.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {recipeDetail && (
        <div className="modal-overlay" onClick={() => setRecipeDetail(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{recipeDetail.name || 'Recipe Details'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setRecipeDetail(null)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <span className="badge badge-info">Reference Recipe</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[
                  ['Recipe ID', recipeDetail.id],
                  ['Name', recipeDetail.name],
                  ['Base Servings', recipeDetail.baseServings],
                  ['Price / Serving', formatMoney(recipeDetail.pricePerServing)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      borderBottom: '1px solid var(--color-border-light)',
                      paddingBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 120,
                        flexShrink: 0,
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        wordBreak: 'break-word',
                      }}
                    >
                      {value || '—'}
                    </span>
                  </div>
                ))}
              </div>

              {recipeDetail.description && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6 }}>
                    Description
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.875rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {recipeDetail.description}
                  </p>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, marginBottom: 8 }}>
                  Base Ingredients {recipeDetail.ingredients ? `(${recipeDetail.ingredients.length})` : '(0)'}
                </h4>
                {recipeDetail.ingredients && recipeDetail.ingredients.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipeDetail.ingredients.map((ingredient, index) => (
                        <tr
                          key={`${ingredient.ingredientId || ingredient.ingredientName}-${index}`}
                        >
                          <td style={{ fontWeight: 600 }}>{ingredient.ingredientName || '—'}</td>
                          <td>{ingredient.quantity ?? '—'}</td>
                          <td>{ingredient.unit || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    No recipe ingredients found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
