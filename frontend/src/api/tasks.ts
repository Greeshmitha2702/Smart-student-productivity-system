import { API, Auth } from 'aws-amplify';
import { getCurrentUserId } from './user';

async function authHeaders() {
  try {
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();
    return { Authorization: `Bearer ${idToken}` };
  } catch (_err) {
    return {};
  }
}

export async function fetchTasks(filters?: { q?: string; startDate?: string; endDate?: string; }) {
  const userId = await getCurrentUserId();
  try {
    const headers = await authHeaders();
    const qs = new URLSearchParams({ userId });
    if (filters?.q) qs.set('q', filters.q);
    if (filters?.startDate) qs.set('startDate', filters.startDate);
    if (filters?.endDate) qs.set('endDate', filters.endDate);
    const response = await API.get('Api', `/tasks?${qs.toString()}`, { headers });
    return response.tasks || [];
  } catch (err: any) {
    console.error('fetchTasks error', err);
    throw err;
  }
}
export async function createTask(task: { title: string; completed?: boolean; date?: string; time?: string; productiveHours?: number; priority?: 'low' | 'medium' | 'high'; taskId?: string; }) {
  const userId = await getCurrentUserId();
  try {
    const headers = await authHeaders();
    const response = await API.post('Api', `/tasks?userId=${userId}`, { body: task, headers });
    if (response?.task) return response.task;
    if (Array.isArray(response?.tasks) && response.tasks.length > 0) {
      return response.tasks[response.tasks.length - 1];
    }
    throw new Error(`Unexpected createTask response: ${JSON.stringify(response)}`);
  } catch (err: any) {
    console.error('createTask error', err);
    throw err;
  }
}

export async function updateTask(task: { taskId: string; title?: string; completed?: boolean; date?: string; time?: string; productiveHours?: number; priority?: 'low' | 'medium' | 'high'; }) {
  const userId = await getCurrentUserId();
  try {
    const headers = await authHeaders();
    await API.put('Api', `/tasks?userId=${userId}`, { body: task, headers });
  } catch (err: any) {
    console.error('updateTask error', err);
    throw err;
  }
}

export async function deleteTask(taskId: string) {
  const userId = await getCurrentUserId();
  try {
    const headers = await authHeaders();
    await API.del('Api', `/tasks?userId=${userId}`, { body: { taskId }, headers });
  } catch (err: any) {
    console.error('deleteTask error', err);
    throw err;
  }
}

