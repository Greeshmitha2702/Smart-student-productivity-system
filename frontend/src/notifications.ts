import { fetchTasks } from './api/tasks';
import { fetchPlans } from './api/planner';

type NotifiedKey = string;

const SENT_KEY = 'prod_notified_keys_v1';

function loadSent(): Set<NotifiedKey> {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveSent(set: Set<NotifiedKey>) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const p = await Notification.requestPermission();
  return p === 'granted';
}

function makeKey(type: 'task' | 'plan', id: string, whenKey: string) {
  return `${type}:${id}:${whenKey}`;
}

function parseISODateTime(date: string | undefined | null, time?: string | null) {
  if (!date) return null;
  // if time provided (HH:MM), combine
  if (time) {
    const iso = `${date}T${time}:00`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(date);
  if (!isNaN(d.getTime())) return d;
  return null;
}

export async function startNotificationService(pollMinutes = 1, defaultReminderMinutes = 15) {
  const ok = await requestPermission();
  if (!ok) return;
  const sent = loadSent();

  async function checkNow() {
    try {
      const [tasks, plans] = await Promise.all([fetchTasks(), fetchPlans()]);
      const now = Date.now();
      const all = (tasks || []).map((t: any) => ({ type: 'task' as const, id: t.taskId, title: t.title, date: t.date, time: t.time, reminder: t.reminderMinutes }))
        .concat((plans || []).map((p: any) => ({ type: 'plan' as const, id: p.planId, title: p.activity || p.title, date: p.date, time: p.time, reminder: p.reminderMinutes })));

      all.forEach((item: { date: string | null | undefined; time: string | null | undefined; reminder: any; type: string; id: string; title: any; }) => {
        if (!item.date) return;
        const when = parseISODateTime(item.date, item.time) || null;
        if (!when) return;
        const reminder = Number(item.reminder || defaultReminderMinutes);
        const whenMs = when.getTime();
        const notifyAt = whenMs - reminder * 60 * 1000;
        const key = makeKey(item.type as 'task' | 'plan', item.id, String(notifyAt));
        if (sent.has(key)) return;
        // only notify if within next poll window (e.g., next 60s) or missed within small threshold
        if (notifyAt <= now && notifyAt + pollMinutes * 60 * 1000 >= now) {
          const title = `${item.type === 'task' ? 'Task' : 'Plan'} approaching: ${item.title}`;
          const body = `Scheduled at ${when.toLocaleString()}. Reminder ${reminder}m before.`;
          try {
            new Notification(title, { body });
            sent.add(key);
            saveSent(sent);
          } catch (e) {
            // ignore
          }
        }
      });
    } catch (e) {
      // ignore transient errors
    }
  }

  // run immediately, then poll
  checkNow();
  const id = setInterval(checkNow, pollMinutes * 60 * 1000);
  return () => clearInterval(id);
}

export default { startNotificationService };
