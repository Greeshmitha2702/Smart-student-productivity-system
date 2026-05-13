
import React, { useEffect, useState } from 'react';
import { fetchAnalytics } from '../api/analytics';

type Stats = {
  completedTasks: number;
  plannedActivities: number;
  productiveHours: number;
  streak: number;
};

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics()
      .then((data) => {
        // Example: data.tasks = [{ completed: true, ... }, ...]
        const tasks = data.tasks || [];
        const completedTasks = tasks.filter((t: any) => t.completed).length;
        // For demo, plannedActivities = total tasks, productiveHours = completedTasks * 0.5, streak = random
        setStats({
          completedTasks,
          plannedActivities: tasks.length,
          productiveHours: Math.round(completedTasks * 0.5),
          streak: Math.floor(Math.random() * 10) + 1,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('fetchAnalytics error', err);
        setError(err?.message || JSON.stringify(err) || 'Failed to load analytics');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', textAlign: 'center' }}>
      <h2>Analytics Dashboard</h2>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {stats && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, margin: '2rem 0' }}>
            <StatCard label="Completed Tasks" value={stats.completedTasks} />
            <StatCard label="Planned Activities" value={stats.plannedActivities} />
            <StatCard label="Productive Hours" value={stats.productiveHours} />
            <StatCard label="Streak (days)" value={stats.streak} />
          </div>
          <h3>Productivity Trend</h3>
          <div style={{ margin: '2rem auto', width: 400, height: 200, background: '#f5f6fa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 24 }}>
            {/* Placeholder for chart */}
            <span role="img" aria-label="chart">📈</span> <span style={{ marginLeft: 12 }}>Chart coming soon</span>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e1e1e1',
      borderRadius: 8,
      padding: '1rem 2rem',
      minWidth: 120,
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#0053ba' }}>{value}</div>
      <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>{label}</div>
    </div>
  );
}
