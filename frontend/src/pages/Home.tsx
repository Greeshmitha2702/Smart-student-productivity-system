import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { fetchTasks } from '../api/tasks';
import { fetchPlans } from '../api/planner';

const quotes = [
  'Small progress today beats perfect plans tomorrow.',
  'Focus on the next hour, not the whole semester.',
  'Discipline turns goals into finished work.',
  'Start simple, stay consistent, finish strong.',
  'Your future GPA is built by today\'s choices.'
];

export default function Home() {
  const [summary, setSummary] = useState({
    totalTasks: 0,
    totalPlans: 0,
    todayTasks: 0,
    todayPlans: 0,
    todayHours: 0,
    completedTasks: 0,
    completedPlans: 0,
    totalProductiveHours: 0,
    completedProductiveHours: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysQuote = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return quotes[dayOfYear % quotes.length];
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tasks, plans] = await Promise.all([fetchTasks(), fetchPlans()]);
        const totalTasks = (tasks || []).length;
        const totalPlans = (plans || []).length;
        const todayTasks = (tasks || []).filter((t: any) => (t.date || '').slice(0, 10) === todayKey && !t.completed).length;
        const todayPlans = (plans || []).filter((p: any) => (p.date || '').slice(0, 10) === todayKey && !p.completed).length;
        const todayHours = [...(tasks || []), ...(plans || [])]
          .filter((i: any) => (i.date || '').slice(0, 10) === todayKey)
          .reduce((s: number, i: any) => s + (Number(i.productiveHours) || 0), 0);
        const completedTasks = (tasks || []).filter((i: any) => !!i.completed).length;
        const completedPlans = (plans || []).filter((i: any) => !!i.completed).length;
        const totalProductiveHours = [...(tasks || []), ...(plans || [])].reduce((s: number, i: any) => s + (Number(i.productiveHours) || 0), 0);
        const completedProductiveHours = [...(tasks || []), ...(plans || [])].filter((i: any) => !!i.completed).reduce((s: number, i: any) => s + (Number(i.productiveHours) || 0), 0);

        setSummary({
          totalTasks,
          totalPlans,
          todayTasks,
          todayPlans,
          todayHours: Math.round(todayHours * 100) / 100,
          completedTasks,
          completedPlans,
          totalProductiveHours: Math.round(totalProductiveHours * 100) / 100,
          completedProductiveHours: Math.round(completedProductiveHours * 100) / 100
        });
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [todayKey]);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ background: 'linear-gradient(135deg, #e9f2ff, #f6fbff)', border: '1px solid #d9e7ff', borderRadius: 16, padding: '1.5rem' }}>
        <h1 style={{ marginTop: 0 }}>Welcome to Smart Student Productivity System</h1>
        <p style={{ marginBottom: 0, fontSize: 18 }}>
          {todaysQuote}
        </p>
      </div>

      <div style={{ marginTop: 20, marginBottom: 10, color: '#444' }}>Today at a glance</div>
      {loading && <div>Loading summary...</div>}
      {error && <div style={{ color: '#b42318' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12 }}>
          <Section title="Total">
            <Card title="Total Tasks" value={summary.totalTasks} />
            <Card title="Total Plans" value={summary.totalPlans} />
          </Section>

          <Section title="Due Works">
            <Card title="Tasks Due" value={summary.todayTasks} />
            <Card title="Plans Due" value={summary.todayPlans} />
          </Section>

          <Section title="Completed">
            <Card title="Completed Tasks" value={summary.completedTasks} />
            <Card title="Completed Plans" value={summary.completedPlans} />
          </Section>

          <Section title="Productivity">
            <Card title="Today's Productive Hours" value={summary.todayHours} />
            <Card title="Total Productive Hours" value={summary.totalProductiveHours} />
            <Card title="Completed Productive Hours" value={summary.completedProductiveHours} />
          </Section>
        </div>
      )}

      <div style={{ marginTop: 20, color: '#555' }}>
        Use <b>Tasks</b> for generic to-dos with priority. Use <b>Planner</b> for date/time-based study sessions with recurrence.
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, background: '#fff', minWidth: 160 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open style={{ border: '1px solid #dbe3ef', borderRadius: 14, background: '#f8fbff', padding: '0.25rem 0.75rem 0.75rem' }}>
      <summary style={{ cursor: 'pointer', listStyle: 'none', fontWeight: 700, color: '#0f172a', padding: '0.5rem 0.25rem' }}>
        {title}
      </summary>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, paddingTop: 8 }}>
        {children}
      </div>
    </details>
  );
}
