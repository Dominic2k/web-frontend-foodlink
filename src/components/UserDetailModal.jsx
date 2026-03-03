import { useState, useEffect } from 'react';
import { FiX, FiMail, FiPhone, FiMapPin, FiCalendar, FiShield, FiHeart, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import './UserDetailModal.css';

export default function UserDetailModal({ user, onClose }) {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showFamily, setShowFamily] = useState(true);
  const [familyError, setFamilyError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchFamilyMembers();
    }
  }, [user?.id]);

  const fetchFamilyMembers = async () => {
    setLoadingMembers(true);
    setFamilyError(null);
    try {
      const res = await adminAPI.getUserFamilyMembers(user.id);
      setFamilyMembers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch family members:', err);
      const status = err.response?.status;
      if (status === 404) {
        setFamilyError('API not ready — please rebuild backend with the new endpoint.');
      } else {
        setFamilyError(`Failed to load family members (${status || 'network'})`);
      }
    } finally {
      setLoadingMembers(false);
    }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBirthDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US');
  };

  const relationshipLabels = {
    self: 'Self',
    spouse: 'Spouse',
    child: 'Child',
    parent: 'Parent',
    sibling: 'Sibling',
    other: 'Other',
  };

  const genderLabels = {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Details</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Profile header */}
          <div className="user-detail-header">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="avatar avatar-lg" />
            ) : (
              <div className="avatar avatar-lg">{getInitials(user.fullName)}</div>
            )}
            <div>
              <h4 className="user-detail-name">{user.fullName}</h4>
              <div className="user-detail-badges">
                <span
                  className={`badge ${
                    user.status === 'active' ? 'badge-success' : 'badge-danger'
                  }`}
                >
                  {user.status === 'active' ? 'Active' : 'Blocked'}
                </span>
                {user.isAdmin && (
                  <span className="badge badge-primary">ADMIN</span>
                )}
              </div>
            </div>
          </div>

          {/* Info rows */}
          <div className="user-detail-info">
            <div className="detail-row">
              <FiMail className="detail-row-icon" />
              <div>
                <span className="detail-row-label">Email</span>
                <span className="detail-row-value">{user.email}</span>
              </div>
            </div>
            <div className="detail-row">
              <FiPhone className="detail-row-icon" />
              <div>
                <span className="detail-row-label">Phone</span>
                <span className="detail-row-value">{user.phone || '—'}</span>
              </div>
            </div>
            <div className="detail-row">
              <FiMapPin className="detail-row-icon" />
              <div>
                <span className="detail-row-label">Address</span>
                <span className="detail-row-value">{user.address || '—'}</span>
              </div>
            </div>
            <div className="detail-row">
              <FiCalendar className="detail-row-icon" />
              <div>
                <span className="detail-row-label">Created</span>
                <span className="detail-row-value">{formatDate(user.createdAt)}</span>
              </div>
            </div>
            <div className="detail-row">
              <FiCalendar className="detail-row-icon" />
              <div>
                <span className="detail-row-label">Last Updated</span>
                <span className="detail-row-value">{formatDate(user.updatedAt)}</span>
              </div>
            </div>
            <div className="detail-row">
              <FiShield className="detail-row-icon" />
              <div>
                <span className="detail-row-label">ID</span>
                <span className="detail-row-value detail-row-id">{user.id}</span>
              </div>
            </div>
          </div>

          {/* Family Members Section */}
          <div className="family-section">
            <button
              className="family-section-toggle"
              onClick={() => setShowFamily(!showFamily)}
            >
              <div className="family-section-title">
                <FiHeart className="family-section-icon" />
                <span>Family Members</span>
                <span className="family-count-badge">{familyMembers.length}</span>
              </div>
              {showFamily ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {showFamily && (
              <div className="family-section-content">
                {loadingMembers ? (
                  <div className="family-loading">
                    <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                    <span>Loading...</span>
                  </div>
                ) : familyError ? (
                  <div className="family-error">
                    <span>⚠️ {familyError}</span>
                  </div>
                ) : familyMembers.length === 0 ? (
                  <div className="family-empty">
                    <FiHeart style={{ opacity: 0.4 }} />
                    <span>No family members found</span>
                  </div>
                ) : (
                  <div className="family-list">
                    {familyMembers.map((m) => (
                      <div key={m.id} className="family-member-card">
                        <div className="family-member-header">
                          <div className="family-member-avatar">
                            {m.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="family-member-main">
                            <span className="family-member-name">{m.displayName}</span>
                            <span className="family-member-rel">
                              {relationshipLabels[m.relationship] || m.relationship}
                            </span>
                          </div>
                        </div>
                        <div className="family-member-details">
                          {m.gender && (
                            <span className="family-detail-tag">
                              {genderLabels[m.gender] || m.gender}
                            </span>
                          )}
                          {m.birthDate && (
                            <span className="family-detail-tag">
                              🎂 {formatBirthDate(m.birthDate)}
                            </span>
                          )}
                          {m.heightCm && (
                            <span className="family-detail-tag">
                              📏 {m.heightCm} cm
                            </span>
                          )}
                          {m.weightKg && (
                            <span className="family-detail-tag">
                              ⚖️ {m.weightKg} kg
                            </span>
                          )}
                          {m.activityLevel && (
                            <span className="family-detail-tag">
                              🏃 {m.activityLevel}
                            </span>
                          )}
                        </div>
                        {m.healthConditions && m.healthConditions.length > 0 && (
                          <div className="family-member-conditions">
                            {m.healthConditions.map((c) => (
                              <span key={c.id} className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
