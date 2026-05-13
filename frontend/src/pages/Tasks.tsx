import React, { useEffect, useState } from 'react';
import { fetchTasks, createTask, updateTask, deleteTask } from '../api/tasks';

type Task = {
  userId: string;
  taskId: string;
  title: string;
  completed: boolean;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchTasks();
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
    if (!input.trim()) return;
    const newTask = { title: input, completed: false };
    try {
      await createTask(newTask);
      setInput('');
      loadTasks();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleToggle = async (task: Task) => {
    try {
      await updateTask({ ...task, completed: !task.completed });
      loadTasks();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      loadTasks();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  const handleEdit = (task: Task) => {
    setEditing(task.taskId);
    setEditValue(task.title);
  };

  const handleEditSave = async (task: Task) => {
    try {
      await updateTask({ ...task, title: editValue });
      setEditing(null);
      setEditValue('');
      loadTasks();
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto' }}>
      <h2>Tasks</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a new task"
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={handleAdd} style={{ padding: '8px 16px' }}>Add</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tasks.map(task => (
            <li key={task.taskId} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggle(task)}
                style={{ marginRight: 8 }}
              />
              {editing === task.taskId ? (
                <>
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <button onClick={() => handleEditSave(task)} style={{ marginRight: 8 }}>Save</button>
                  <button onClick={() => setEditing(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</span>
                  <button onClick={() => handleEdit(task)} style={{ marginLeft: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(task.taskId)} style={{ marginLeft: 8 }}>Delete</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

