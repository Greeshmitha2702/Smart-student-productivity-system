
import React, { useEffect, useState } from 'react';
import { fetchAnalytics } from '../api/analytics';

type Stats = {
  completedTasks: number;
  plannedActivities: number;
  productiveHours: number;
  streak: number;
};

type TrendPoint = {
  day: string;
  hours: number;
};

export default function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics()
      .then((data) => {
        const stats = data.stats || null;
        if (stats) setStats(stats as Stats);
        setTrend((data.trend || []) as TrendPoint[]);
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
          <div style={{ margin: '1rem auto', width: '100%', maxWidth: 760, border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
            {trend.length === 0 ? (
              <div style={{ color: '#777' }}>No activity trend yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${trend.length}, minmax(28px, 1fr))`, alignItems: 'end', gap: 6, height: 180 }}>
                {trend.map((p) => (
                  <div key={p.day} title={`${p.day}: ${p.hours}h`} style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
                    <div style={{ width: '100%', background: '#3b82f6', borderRadius: 4, minHeight: 4, height: `${Math.max(4, p.hours * 22)}px` }} />
                    <div style={{ fontSize: 10, color: '#666' }}>{p.day.slice(5)}</div>
                  </div>
                ))}
              </div>
            )}
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
