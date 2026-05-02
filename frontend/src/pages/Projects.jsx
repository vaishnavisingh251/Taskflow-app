import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: COLORS[0] });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [p, t] = await Promise.all([api.get('/projects'), api.get('/tasks')]);
      setProjects(p.data);
      setTasks(t.data);
    } catch {
      setError('Failed to load projects. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.name.trim()) return setFormError('Project name is required.');
    setFormError('');
    setSaving(true);
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '', color: COLORS[0] });
      load();
      setToast({ message: 'Project created!', type: 'success' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating project. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, p) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${p.name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${p._id}`);
      load();
      setToast({ message: 'Project deleted.', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete project.', type: 'error' });
    }
  };

  return (
    <Layout
      title="Projects"
      actions={user?.role === 'admin' && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New project</button>}
    >
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◫</div>
          <p>No projects yet</p>
          <span>Create your first project to get started</span>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => {
            const ptasks = tasks.filter(t => t.project?._id === p._id || t.project === p._id);
            const pdone = ptasks.filter(t => t.status === 'done').length;
            const pct = ptasks.length ? Math.round(pdone / ptasks.length * 100) : 0;
            return (
              <div
                key={p._id}
                className="project-card"
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p._id}`)}
              >
                <div className="project-color-bar" style={{ background: p.color }} />
                <div className="project-name">{p.name}</div>
                <div className="project-desc">{p.description || 'No description'}</div>
                <div className="progress-label">
                  <span>{pct}% complete</span>
                  <span>{pdone}/{ptasks.length} tasks</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                </div>
                {p.members?.length > 0 && (
                  <div className="members-stack">
                    {p.members.slice(0, 5).map(m => (
                      <div key={m._id} className="mini-avatar" style={{ background: m.color || '#6366f1' }}>
                        {m.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                    ))}
                    {p.members.length > 5 && (
                      <div className="mini-avatar" style={{ background: 'var(--muted)' }}>
                        +{p.members.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {user?.role === 'admin' && (
                  <button
                    onClick={(e) => handleDelete(e, p)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'none',
                      border: '1px solid #f0525455',
                      color: '#ef4444',
                      borderRadius: 6,
                      padding: '3px 9px',
                      fontSize: 11,
                      cursor: 'pointer',
                      lineHeight: 1.6,
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3>New Project</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {formError && <div className="error-box" style={{ marginBottom: 12 }}>{formError}</div>}
              <div className="form-group">
                <label className="form-label">Project name *</label>
                <input className="form-input" placeholder="e.g. Customer Portal" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" placeholder="What is this project about?" value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <div
                      key={c}
                      onClick={() => set('color', c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                        border: form.color === c ? '3px solid var(--text)' : '3px solid transparent',
                        transition: 'border .12s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}