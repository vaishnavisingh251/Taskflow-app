import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskTable from '../components/TaskTable';
import TaskModal from '../components/TaskModal';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [t, p] = await Promise.all([api.get('/tasks'), api.get('/projects')]);
      // handle both plain array (old) and paginated { tasks, pagination } (new)
      const taskList = Array.isArray(t.data) ? t.data : (t.data.tasks ?? []);
      setTasks(taskList);
      setProjects(p.data);
    } catch {
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate.slice(0, 10) < today).length;

  return (
    <Layout
      title="Dashboard"
      actions={user?.role === 'admin' && (
        <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setShowModal(true); }}>
          + Add task
        </button>
      )}
    >
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total tasks</div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">across {projects.length} projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{done}</div>
          <div className="stat-sub">{total ? Math.round(done / total * 100) : 0}% completion rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{inProgress}</div>
          <div className="stat-sub">actively being worked</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{overdue}</div>
          <div className="stat-sub">need immediate attention</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Loading…</div>
      ) : (
        <div className="two-col">
          <div>
            <div className="section-head">
              <span className="section-title">Recent Tasks</span>
              <button className="btn btn-sm" onClick={() => navigate('/tasks')}>View all</button>
            </div>
            <TaskTable
              tasks={tasks.slice(0, 8)}
              showProject
              onRowClick={t => { setSelectedTask(t); setShowModal(true); }}
            />
          </div>
          <div>
            <div className="section-head">
              <span className="section-title">Projects</span>
              <button className="btn btn-sm" onClick={() => navigate('/projects')}>View all</button>
            </div>
            {projects.map(p => {
              const ptasks = tasks.filter(t => t.project?._id === p._id || t.project === p._id);
              const pdone = ptasks.filter(t => t.status === 'done').length;
              const pct = ptasks.length ? Math.round(pdone / ptasks.length * 100) : 0;
              return (
                <div key={p._id} className="project-card" style={{ marginBottom: 10 }} onClick={() => navigate(`/projects/${p._id}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                      <span className="project-name" style={{ fontSize: 13 }}>{p.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{pdone}/{ptasks.length} tasks done</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <TaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => { setShowModal(false); setSelectedTask(null); }}
          onSaved={() => { load(); setToast({ message: selectedTask ? 'Task updated!' : 'Task created!', type: 'success' }); }}
          onDeleted={() => { load(); setToast({ message: 'Task deleted', type: 'success' }); }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}