import React, { useEffect, useState } from 'react';
import { fetchPlans, createPlan, updatePlan, deletePlan } from '../api/planner';
import { createTask } from '../api/tasks';

type PlanRecurrence = 'none' | 'daily' | 'weekly';

type PlanItem = {
  userId?: string;
  planId: string;
  time?: string; // hh:mm or ISO
  endTime?: string;
  activity: string;
  date?: string; // ISO date
  productiveHours?: number;
  recurrence?: PlanRecurrence;
  completed?: boolean;
  reminderMinutes?: number;
};

export default function Planner() {
  const browserTimezoneOffsetMinutes = new Date().getTimezoneOffset();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activity, setActivity] = useState('');
  const [date, setDate] = useState('');
  const [productiveHours, setProductiveHours] = useState<number | ''>('');
  const [recurrence, setRecurrence] = useState<PlanRecurrence>('none');
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Partial<PlanItem>>({});
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPlans = async (filters?: { q?: string }) => {
    setLoading(true);
    try {
      const data = await fetchPlans(filters);
      setPlans(data);
    } catch (err: any) {
      setError(err.message || String(err));
    }
    setLoading(false);
  };

  useEffect(() => { loadPlans(); }, []);

  const addPlan = async () => {
    if (!activity.trim()) {
      setMessage(null);
      setError('Activity is required.');
      return;
    }
    if (!date || !time) {
      setMessage(null);
      setError('Planner requires date and start time for scheduled sessions.');
      return;
    }
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const created = await createPlan({ activity, time: time || undefined, endTime: endTime || undefined, date: date || undefined, productiveHours: productiveHours === '' ? 0 : productiveHours as number, recurrence, reminderMinutes: reminderMinutes === '' ? undefined : Number(reminderMinutes), timezoneOffsetMinutes: browserTimezoneOffsetMinutes });
      if (!created) {
        throw new Error('Plan was not created by API.');
      }
      setTime(''); setEndTime(''); setActivity(''); setDate(''); setProductiveHours(''); setRecurrence('none'); setReminderMinutes('');
      await loadPlans();
      setMessage('Plan added successfully.');
    } catch (err: any) {
      setMessage(null);
      setError(err.message || String(err));
    }
    finally { setBusy(false); }
  };

  const startEdit = (plan: PlanItem) => {
    setEditing(plan.planId);
    setEditingValues({ activity: plan.activity, time: plan.time, endTime: plan.endTime, date: plan.date, productiveHours: plan.productiveHours, recurrence: plan.recurrence, // include existing reminder
      // @ts-ignore
      reminderMinutes: (plan as any).reminderMinutes });
  };

  const saveEdit = async (planId: string) => {
    setBusy(true);
    try {
      await updatePlan({ planId, activity: editingValues.activity, time: editingValues.time, endTime: editingValues.endTime, date: editingValues.date, productiveHours: editingValues.productiveHours, recurrence: editingValues.recurrence as PlanRecurrence | undefined, // include reminder if present
        // @ts-ignore
        reminderMinutes: editingValues.reminderMinutes === undefined ? undefined : Number(editingValues.reminderMinutes), timezoneOffsetMinutes: browserTimezoneOffsetMinutes });
      setEditing(null); setEditingValues({}); loadPlans();
    } catch (err: any) { setError(err.message || String(err)); }
    finally { setBusy(false); }
  };

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Delete this scheduled activity?')) return;
    setBusy(true);
    try { await deletePlan(planId); loadPlans(); } catch (err: any) { setError(err.message || String(err)); }
    finally { setBusy(false); }
  };

  const handleDemote = async (plan: PlanItem) => {
    if (!window.confirm(`Unschedule "${plan.activity}"?`)) return;
    setBusy(true);
    try {
      await createTask({ title: plan.activity, date: plan.date, time: plan.time, productiveHours: plan.productiveHours, timezoneOffsetMinutes: (plan as any).timezoneOffsetMinutes ?? browserTimezoneOffsetMinutes });
      await deletePlan(plan.planId);
      loadPlans();
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleComplete = async (plan: PlanItem) => {
    setBusy(true);
    try {
      await updatePlan({ planId: plan.planId, completed: !plan.completed });
      await loadPlans({ q: searchQ });
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    loadPlans(searchQ ? { q: searchQ } : undefined);
  };

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto' }}>
      <h2>Planner</h2>
      <div style={{ marginBottom: 8, color: '#444' }}>
        Planner is schedule-focused: create calendar-like sessions with date, start/end time, and recurrence. Use Tasks for generic to-dos.
      </div>
      {message && <div style={{ color: '#067647', marginBottom: 8 }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input disabled={busy} placeholder="Search planner..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ flex: 1, padding: 8 }} />
        <button disabled={busy} type="submit">Search</button>
        <button disabled={busy} type="button" onClick={() => { setSearchQ(''); loadPlans(); }}>Clear</button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 100px 120px 120px 80px', gap: 8, marginBottom: 16 }}>
        <input disabled={busy} value={activity} onChange={e => setActivity(e.target.value)} placeholder="Activity" />
        <input disabled={busy} type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input disabled={busy} type="time" value={time} onChange={e => setTime(e.target.value)} />
        <input disabled={busy} type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
        <input disabled={busy} type="number" min={0} step={0.25} value={productiveHours === '' ? '' : String(productiveHours)} onChange={e => setProductiveHours(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Hours" />
        <input disabled={busy} type="number" min={0} step={1} value={reminderMinutes === '' ? '' : String(reminderMinutes)} onChange={e => setReminderMinutes(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Remind (min)" />
        <select disabled={busy} value={recurrence} onChange={e => setRecurrence(e.target.value as PlanRecurrence)}>
          <option value="none">No repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <button disabled={busy} type="button" onClick={addPlan}>Add</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {plans.map(plan => (
            <li key={plan.planId} style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid #eee', alignItems: 'center' }}>
              {editing === plan.planId ? (
                <>
                  <input disabled={busy} type="checkbox" checked={!!plan.completed} onChange={() => toggleComplete(plan)} style={{ marginRight: 8 }} />
                  <input disabled={busy} style={{ flex: 1 }} value={editingValues.activity || ''} onChange={e => setEditingValues(v => ({ ...v, activity: e.target.value }))} placeholder="Plan name" />
                  <input disabled={busy} type="date" value={editingValues.date || ''} onChange={e => setEditingValues(v => ({ ...v, date: e.target.value }))} />
                  <input disabled={busy} type="time" value={editingValues.time || ''} onChange={e => setEditingValues(v => ({ ...v, time: e.target.value }))} />
                  <input disabled={busy} type="time" value={editingValues.endTime || ''} onChange={e => setEditingValues(v => ({ ...v, endTime: e.target.value }))} />
                  <input disabled={busy} type="number" min={0} step={0.25} value={editingValues.productiveHours === undefined ? '' : String(editingValues.productiveHours)} onChange={e => setEditingValues(v => ({ ...v, productiveHours: e.target.value === '' ? undefined : Number(e.target.value) }))} style={{ width: 80 }} />
                  <input disabled={busy} type="number" min={0} step={1} value={editingValues.reminderMinutes === undefined ? '' : String(editingValues.reminderMinutes)} onChange={e => setEditingValues(v => ({ ...v, reminderMinutes: e.target.value === '' ? undefined : Number(e.target.value) }))} style={{ width: 100 }} placeholder="Remind (min)" />
                  <select disabled={busy} value={(editingValues.recurrence as PlanRecurrence | undefined) || 'none'} onChange={e => setEditingValues(v => ({ ...v, recurrence: e.target.value as PlanRecurrence }))}>
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <button disabled={busy} onClick={() => saveEdit(plan.planId)}>Save</button>
                  <button disabled={busy} onClick={() => setEditing(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <input disabled={busy} type="checkbox" checked={!!plan.completed} onChange={() => toggleComplete(plan)} style={{ marginRight: 8 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{plan.activity}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{plan.date || ''} {plan.time ? `· ${plan.time}` : ''} {plan.endTime ? `-${plan.endTime}` : ''} {plan.productiveHours ? `· ${plan.productiveHours}h` : ''} {plan.recurrence && plan.recurrence !== 'none' ? `· ${plan.recurrence}` : ''}</div>
                  </div>
                  <button disabled={busy} onClick={() => startEdit(plan)}>Edit</button>
                  <button disabled={busy} onClick={() => handleDelete(plan.planId)}>Delete</button>
                  <button disabled={busy} onClick={() => handleDemote(plan)}>Unschedule</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
