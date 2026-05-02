import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Team() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const load = () => {
    Promise.all([api.get('/users'), api.get('/tasks')])
      .then(([u, t]) => { setUsers(u.data); setTasks(t.data); })
      .catch(() => setError('Failed to load team data. Please refresh.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (u) => {
    const newRole = u.role === 'admin' ? 'member' : 'admin';
    if (!window.confirm(`Change ${u.name} from ${u.role} to ${newRole}?`)) return;
    try {
      await api.put(`/users/${u._id}/role`, { role: newRole });
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, role: newRole } : x));
      setToast({ message: `${u.name} is now ${newRole}.`, type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update role.', type: 'error' });
    }
  };

  return (
    <Layout title="Team">
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Loading team…</div>
      ) : (
        <>
          <div className="grid-2">
            {users.map(u => {
              const assigned = tasks.filter(t => t.assignee?._id === u._id || t.assignee === u._id);
              const done = assigned.filter(t => t.status === 'done').length;
              const inProg = assigned.filter(t => t.status === 'in-progress').length;
              const pct = assigned.length ? Math.round(done / assigned.length * 100) : 0;
              const initials = u.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const isMe = currentUser?.id === u._id;
              const canChangeRole = currentUser?.role === 'admin' && !isMe;

              return (
                <div key={u._id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div className="avatar avatar-lg" style={{ background: u.color || '#6366f1' }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        {isMe && (
                          <span style={{
                            fontSize: 10, padding: '1px 6px', borderRadius: 4,
                            background: 'var(--surface2)', color: 'var(--muted)'
                          }}>you</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className={`role-tag role-${u.role}`}>{u.role}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                      </div>
                    </div>

                    {canChangeRole && (
                      <button
                        onClick={() => handleRoleChange(u)}
                        style={{
                          flexShrink: 0,
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Make {u.role === 'admin' ? 'member' : 'admin'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                    {[['Assigned', assigned.length, 'var(--text)'], ['Done', done, 'var(--success)'], ['In Progress', inProg, 'var(--accent)']].map(([label, val, color]) => (
                      <div key={label} style={{ textAlign: 'center', background: 'var(--surface2)', borderRadius: 8, padding: '10px 6px' }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color, fontFamily: 'DM Mono, monospace' }}>{val}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>Completion rate</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{pct}%</div>
                </div>
              );
            })}
          </div>

          {users.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">◉</div>
              <p>No team members yet</p>
              <span>Ask your team to sign up</span>
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}