export default function TaskTable({ tasks, onRowClick, showProject = false }) {
  const today = new Date().toISOString().slice(0, 10);

  const statusBadge = (task) => {
    if (task.status !== 'done' && task.dueDate && task.dueDate.slice(0, 10) < today)
      return <span className="badge badge-overdue">Overdue</span>;
    const map = { todo: 'badge-todo', 'in-progress': 'badge-in-progress', done: 'badge-done' };
    const label = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
    return <span className={`badge ${map[task.status]}`}>{label[task.status]}</span>;
  };

  if (!tasks.length) return (
    <div className="empty-state">
      <div className="empty-icon">✓</div>
      <p>No tasks yet</p>
      <span>Create a task to get started</span>
    </div>
  );

  return (
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              {showProject && <th>Project</th>}
              <th>Assignee</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => {
              const isOverdue = task.status !== 'done' && task.dueDate && task.dueDate.slice(0, 10) < today;
              return (
                <tr key={task._id} onClick={() => onRowClick?.(task)}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{task.description}</div>}
                  </td>
                  {showProject && (
                    <td>
                      {task.project && (
                        <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 5, background: task.project.color + '22', color: task.project.color }}>
                          {task.project.name}
                        </span>
                      )}
                    </td>
                  )}
                  <td>
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div className="avatar" style={{ width: 24, height: 24, fontSize: 9, background: task.assignee.color || '#6366f1' }}>
                          {task.assignee.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontSize: 12 }}>{task.assignee.name?.split(' ')[0]}</span>
                      </div>
                    ) : <span style={{ color: 'var(--subtle)', fontSize: 12 }}>Unassigned</span>}
                  </td>
                  <td>{statusBadge(task)}</td>
                  <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                  <td style={{ fontSize: 12, color: isOverdue ? 'var(--danger)' : 'var(--muted)', fontWeight: isOverdue ? 500 : 400 }}>
                    {task.dueDate ? task.dueDate.slice(0, 10) : '—'}
                    {isOverdue && <span className="overdue-dot" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
