import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function TaskModal({ task, projects, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEdit = !!task;

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project: task?.project?._id || task?.project || (projects[0]?._id || ''),
    assignee: task?.assignee?._id || task?.assignee || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return setError('Title is required.');
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/tasks/${task._id}`, form);
        onSaved(data);
      } else {
        const { data } = await api.post('/tasks', form);
        onSaved(data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDeleted(task._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{isEdit ? 'Edit Task' : 'New Task'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Task title *</label>
            <input
              className="form-input"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              disabled={!isAdmin && isEdit}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Add more details..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              disabled={!isAdmin && isEdit}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Project *</label>
              <select className="form-input" value={form.project} onChange={e => set('project', e.target.value)} disabled={!isAdmin}>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-input" value={form.assignee} onChange={e => set('assignee', e.target.value)} disabled={!isAdmin}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => set('priority', e.target.value)} disabled={!isAdmin}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due date</label>
            <input className="form-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} disabled={!isAdmin} />
          </div>
          {!isAdmin && <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', padding: '8px 12px', borderRadius: 'var(--r-sm)' }}>Members can only update task status.</div>}
        </div>
        <div className="modal-foot">
          {isEdit && isAdmin && <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={handleDelete}>Delete</button>}
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  );
}

