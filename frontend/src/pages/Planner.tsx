import React, { useEffect, useState } from 'react';
import { fetchPlans, createPlan, updatePlan, deletePlan } from '../api/planner';

type PlanItem = {
  userId: string;
  planId: string;
  time: string;
  activity: string;
};

export default function Planner() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [time, setTime] = useState('');
  const [activity, setActivity] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editTime, setEditTime] = useState('');
  const [editActivity, setEditActivity] = useState('');

  const loadPlans = async () => {
    const data = await fetchPlans();
    setPlans(data);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const addPlan = async () => {
    if (!time.trim() || !activity.trim()) return;
    await createPlan({ time, activity });
    setTime('');
    setActivity('');
    loadPlans();
  };

  const handleEdit = (plan: PlanItem) => {
    setEditing(plan.planId);
    setEditTime(plan.time);
    setEditActivity(plan.activity);
  };

  const saveEdit = async (plan: PlanItem) => {
    await updatePlan({ ...plan, time: editTime, activity: editActivity });
    setEditing(null);
    setEditTime('');
    setEditActivity('');
    loadPlans();
  };

  const handleDelete = async (planId: string) => {
    await deletePlan(planId);
    loadPlans();
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto' }}>
      <h2>Daily Planner</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={time}
          onChange={e => setTime(e.target.value)}
          placeholder="Time (e.g. 09:00 AM)"
          style={{ flex: 1, padding: 8 }}
        />
        <input
          value={activity}
          onChange={e => setActivity(e.target.value)}
          placeholder="Activity"
          style={{ flex: 2, padding: 8 }}
        />
        <button onClick={addPlan} style={{ padding: '8px 16px' }}>Add</button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {plans.map(plan => (
          <li key={plan.planId} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            {editing === plan.planId ? (
              <>
                <input value={editTime} onChange={e => setEditTime(e.target.value)} style={{ width: 100 }} />
                <input value={editActivity} onChange={e => setEditActivity(e.target.value)} style={{ flex: 1 }} />
                <button onClick={() => saveEdit(plan)}>Save</button>
              </>
            ) : (
              <>
                <span style={{ width: 100 }}>{plan.time}</span>
                <span style={{ flex: 1 }}>{plan.activity}</span>
                <button onClick={() => handleEdit(plan)}>Edit</button>
                <button onClick={() => handleDelete(plan.planId)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
