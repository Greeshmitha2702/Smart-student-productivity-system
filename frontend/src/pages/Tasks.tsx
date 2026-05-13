import React, { useEffect, useState } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import { createPlan } from '../api/planner';

type TaskPriority = 'low' | 'medium' | 'high';

type Task = {
    userId?: string;
  taskId: string;
  title: string;
  completed?: boolean;
  date?: string; // ISO date
  time?: string;
  productiveHours?: number;
  priority?: TaskPriority;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [productiveHours, setProductiveHours] = useState<number | ''>('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<Task>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');

  const loadTasks = async (filters?: { q?: string }) => {
    setLoading(true);
    try {
      const data = await fetchTasks(filters);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || String(err));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) {
      setMessage(null);
      setError('Task title is required.');
      return;
    }
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const created = await createTask({ title, completed: false, date: date || undefined, time: time || undefined, productiveHours: productiveHours === '' ? 0 : productiveHours as number, priority });
      if (!created) {
        throw new Error('Task was not created by API.');
      }
      setTitle(''); setDate(''); setTime(''); setProductiveHours(''); setPriority('medium');
      await loadTasks();
      setMessage('Task added successfully.');
    } catch (err: any) {
      setMessage(null);
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (task: Task) => {
    setBusy(true);
    try {
      await updateTask({ taskId: task.taskId, completed: !task.completed });
      loadTasks({ q: searchQ });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    setBusy(true);
    try {
      await deleteTask(taskId);
      loadTasks({ q: searchQ });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const handlePromote = async (task: Task) => {
    if (!window.confirm(`Schedule "${task.title}"?`)) return;
    setBusy(true);
    try {
      await createPlan({ activity: task.title, date: task.date, time: task.time, productiveHours: task.productiveHours });
      await deleteTask(task.taskId);
      loadTasks({ q: searchQ });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.taskId);
    setEditingValues({ title: task.title, date: task.date, time: task.time, productiveHours: task.productiveHours, priority: task.priority });
  };

  const saveEdit = async (taskId: string) => {
    setBusy(true);
    try {
      await updateTask({ taskId, title: editingValues.title, date: editingValues.date, time: editingValues.time, productiveHours: editingValues.productiveHours, priority: editingValues.priority as TaskPriority | undefined });
      setEditingId(null);
      setEditingValues({});
      loadTasks({ q: searchQ });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    loadTasks(searchQ ? { q: searchQ } : undefined);
  };

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <h2>Tasks</h2>
      <div style={{ marginBottom: 8, color: '#444' }}>
        Tasks are generic to-dos: quick capture, priority, and completion tracking.
      </div>
      {message && <div style={{ color: '#067647', marginBottom: 8 }}>{message}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input disabled={busy} placeholder="Search tasks..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ flex: 1, padding: 8 }} />
        <button disabled={busy} type="submit">Search</button>
        <button disabled={busy} type="button" onClick={() => { setSearchQ(''); loadTasks(); }}>Clear</button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 120px 80px', gap: 8, marginBottom: 16 }}>
        <input disabled={busy} value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
        <input disabled={busy} type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input disabled={busy} type="time" value={time} onChange={e => setTime(e.target.value)} />
        <input disabled={busy} type="number" min={0} step={0.25} value={productiveHours === '' ? '' : String(productiveHours)} onChange={e => setProductiveHours(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Hours" />
        <select disabled={busy} value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button disabled={busy} type="button" onClick={handleAdd}>Add</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map(task => (
            <li key={task.taskId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid #eee' }}>
              <input disabled={busy} type="checkbox" checked={!!task.completed} onChange={() => handleToggle(task)} />
              {editingId === task.taskId ? (
                <>
                  <input disabled={busy} style={{ flex: 1 }} value={editingValues.title || ''} onChange={e => setEditingValues(v => ({ ...v, title: e.target.value }))} />
                  <input disabled={busy} type="date" value={editingValues.date || ''} onChange={e => setEditingValues(v => ({ ...v, date: e.target.value }))} />
                  <input disabled={busy} type="time" value={editingValues.time || ''} onChange={e => setEditingValues(v => ({ ...v, time: e.target.value }))} />
                  <input disabled={busy} type="number" min={0} step={0.25} value={editingValues.productiveHours === undefined ? '' : String(editingValues.productiveHours)} onChange={e => setEditingValues(v => ({ ...v, productiveHours: e.target.value === '' ? undefined : Number(e.target.value) }))} style={{ width: 80 }} />
                  <select disabled={busy} value={(editingValues.priority as TaskPriority | undefined) || 'medium'} onChange={e => setEditingValues(v => ({ ...v, priority: e.target.value as TaskPriority }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <button disabled={busy} onClick={() => saveEdit(task.taskId)}>Save</button>
                  <button disabled={busy} onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{task.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{task.date || ''} {task.time ? `· ${task.time}` : ''} {task.productiveHours ? `· ${task.productiveHours}h` : ''} {task.priority ? `· ${task.priority} priority` : ''}</div>
                  </div>
                  <button disabled={busy} onClick={() => startEdit(task)}>Edit</button>
                  <button disabled={busy} onClick={() => handleDelete(task.taskId)}>Delete</button>
                  <button disabled={busy} onClick={() => handlePromote(task)}>Schedule</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

