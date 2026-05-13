import { fetchTasks } from './tasks';

export async function fetchAnalytics() {
  // Reuse tasks fetch to get real data for analytics
  try {
    const tasks = await fetchTasks();
    return { tasks };
  } catch (err) {
    throw err;
  }
}
