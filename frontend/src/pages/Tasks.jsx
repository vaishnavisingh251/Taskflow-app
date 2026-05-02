import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import TaskTable from '../components/TaskTable';
import TaskModal from '../components/TaskModal';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
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
      setError('Failed to load tasks. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = tasks.filter(t => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'overdue' ? (t.status !== 'done' && t.dueDate && t.dueDate.slice(0, 10) < today) :
      t.status === filter;
    const matchesSearch = !search.trim() ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignee?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <Layout
      title="All Tasks"
      actions={user?.role === 'admin' && (
        <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setShowModal(true); }}>
          + Add task
        </button>
      )}
    >
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="form-input"
          placeholder="Search tasks, projects, assignees…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280, marginBottom: 0 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[['all', 'All'], ['todo', 'To Do'], ['in-progress', 'In Progress'], ['done', 'Done'], ['overdue', 'Overdue']].map(([val, label]) => (
            <button
              key={val}
              className={`btn btn-sm ${filter === val ? 'btn-primary' : ''}`}
              onClick={() => setFilter(val)}
            >
              {label}
              <span style={{ marginLeft: 4, opacity: .7 }}>
                {val === 'all' ? tasks.length
                 : val === 'overdue' ? tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate.slice(0, 10) < today).length
                 : tasks.filter(t => t.status === val).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Loading tasks…</div>
      ) : (
        <TaskTable
          tasks={filtered}
          showProject
          onRowClick={t => { setSelectedTask(t); setShowModal(true); }}
        />
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