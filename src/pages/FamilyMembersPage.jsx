import { useState, useEffect } from 'react';
import { FiHeart, FiSearch } from 'react-icons/fi';
import api from '../services/api';
import './FamilyMembersPage.css';

export default function FamilyMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      // Using the existing family endpoint
      const res = await api.get('/family');
      setMembers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch family members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = members.filter(
    (m) =>
      !search ||
      m.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      m.relationship?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US');
  };

  return (
    <div className="family-page" style={{ animation: 'fadeIn var(--transition-base) ease' }}>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div className="input-with-icon" style={{ maxWidth: 360 }}>
          <FiSearch className="input-icon" />
          <input
            className="input"
            placeholder="Search..."
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
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FiHeart style={{ fontSize: '2rem' }} />
            <p>No family members found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship</th>
                  <th>Gender</th>
                  <th>Birth Date</th>
                  <th>Height</th>
                  <th>Weight</th>
                  <th>Activity Level</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.displayName}</td>
                    <td>
                      <span className="badge badge-info">{m.relationship}</span>
                    </td>
                    <td className="text-secondary">{m.gender || '—'}</td>
                    <td className="text-secondary">{formatDate(m.birthDate)}</td>
                    <td className="text-secondary">
                      {m.heightCm ? `${m.heightCm} cm` : '—'}
                    </td>
                    <td className="text-secondary">
                      {m.weightKg ? `${m.weightKg} kg` : '—'}
                    </td>
                    <td className="text-secondary">{m.activityLevel || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
