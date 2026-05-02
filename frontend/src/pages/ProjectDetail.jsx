import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskTable from '../components/TaskTable';
import TaskModal from '../components/TaskModal';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const COLS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [view, setView] = useState('list');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const load = async () => {
    try {
      setError('');
      const [projects, taskRes] = await Promise.all([
        api.get('/projects'),
        api.get(`/tasks?projectId=${id}`),
      ]);
      const found = projects.data.find(pr => pr._id === id);
      if (!found) return navigate('/projects');
      setProject(found);
      setTasks(taskRes.data);
      setAllProjects(projects.data);
    } catch {
      setError('Failed to load project. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const today = new Date().toISOString().slice(0, 10);

  const handleDrop = async (newStatus) => {
    setDragOverCol(null);
    if (!dragId) return;
    const task = tasks.find(t => t._id === dragId);
    if (!task || task.status === newStatus) { setDragId(null); return; }

    // Optimistically update UI immediately
    setTasks(prev => prev.map(t => t._id === dragId ? { ...t, status: newStatus } : t));
    setDragId(null);

    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: task.status } : t));
      setToast({ message: 'Failed to update task status.', type: 'error' });
    }
  };

  const KanbanView = () => (
    <div className="kanban-board">
      {COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        const isOver = dragOverCol === col.id;
        return (
          <div
            key={col.id}
            className="kanban-col"
            onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => handleDrop(col.id)}
            style={{
              outline: isOver ? '2px dashed #6366f1' : '2px dashed transparent',
              background: isOver ? '#6366f108' : undefined,
              transition: 'all .15s',
            }}
          >
            <div className="kanban-col-head">
              <span className="kanban-col-title">{col.label}</span>
              <span className="count-badge">{colTasks.length}</span>
            </div>
            {colTasks.map(task => {
              const isOverdue = task.status !== 'done' && task.dueDate && task.dueDate.slice(0, 10) < today;
              const isDragging = dragId === task._id;
              return (
                <div
                  key={task._id}
                  className="k-card"
                  draggable
                  onDragStart={() => setDragId(task._id)}
                  onDragEnd={() => { setDragId(null); setDragOverCol(null); }}
                  onClick={() => { if (!dragId) { setSelectedTask(task); setShowModal(true); } }}
                  style={{
                    opacity: isDragging ? 0.35 : 1,
                    cursor: 'grab',
                    transform: isDragging ? 'scale(0.97)' : 'scale(1)',
                    transition: 'opacity .15s, transform .15s',
                  }}
                >
                  <div className="k-card-title">
                    {task.title}
                    {isOverdue && <span className="overdue-dot" />}
                  </div>
                  <div className="k-card-meta">
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.assignee && (
                      <div className="avatar" style={{ width: 22, height: 22, fontSize: 9, background: task.assignee.color || '#6366f1' }}>
                        {task.assignee.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                    )}
                  </div>
                  {task.dueDate && (
                    <div style={{ fontSize: 11, color: isOverdue ? 'var(--danger)' : 'var(--muted)', marginTop: 8 }}>
                      Due {task.dueDate.slice(0, 10)}
                    </div>
                  )}
                </div>
              );
            })}
            {colTasks.length === 0 && (
              <div style={{
                border: '1.5px dashed var(--border)',
                borderRadius: 8,
                padding: '20px 0',
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--muted)',
                marginTop: 4,
              }}>
                Drop here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Layout
      title={project?.name || 'Project'}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setShowModal(true); }}>
              + Add task
            </button>
          )}
        </div>
      }
    >
      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Loading project…</div>
      ) : (
        <>
          {project && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.color }} />
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{project.description}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                <span>{tasks.length} tasks</span>
                <span>{tasks.filter(t => t.status === 'done').length} done</span>
                <span>{tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate.slice(0, 10) < today).length} overdue</span>
              </div>
            </div>
          )}

          <div className="tabs">
            <button className={`tab ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
            <button className={`tab ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>Kanban</button>
          </div>

          {view === 'list' ? (
            <TaskTable tasks={tasks} onRowClick={t => { setSelectedTask(t); setShowModal(true); }} />
          ) : (
            <KanbanView />
          )}
        </>
      )}

      {showModal && (
        <TaskModal
          task={selectedTask}
          projects={allProjects}
          onClose={() => { setShowModal(false); setSelectedTask(null); }}
          onSaved={() => { load(); setToast({ message: selectedTask ? 'Task updated!' : 'Task created!', type: 'success' }); }}
          onDeleted={() => { load(); setToast({ message: 'Task deleted', type: 'success' }); }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}