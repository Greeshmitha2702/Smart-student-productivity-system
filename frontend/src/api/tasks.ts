import { API, Auth } from 'aws-amplify';

const FALLBACK_USER = 'demo-user';

async function authHeaders() {
  try {
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();
    return { Authorization: `Bearer ${idToken}` };
  } catch (_err) {
    return {};
  }
}

export async function fetchTasks() {
  const userId = FALLBACK_USER;
  try {
    const headers = await authHeaders();
    const response = await API.get('Api', `/tasks?userId=${userId}`, { headers });
    return response.tasks || [];
  } catch (err: any) {
    console.error('fetchTasks error', err);
    throw err;
  }
}

export async function createTask(task: { title: string; completed: boolean; }) {
  const userId = FALLBACK_USER;
  try {
    const headers = await authHeaders();
    const response = await API.post('Api', `/tasks?userId=${userId}`, { body: task, headers });
    return response.task;
  } catch (err: any) {
    console.error('createTask error', err);
    throw err;
  }
}

export async function updateTask(task: { completed: boolean; userId: string; taskId: string; title: string; }) {
  const userId = FALLBACK_USER;
  try {
    const headers = await authHeaders();
    await API.put('Api', `/tasks?userId=${userId}`, { body: task, headers });
  } catch (err: any) {
    console.error('updateTask error', err);
    throw err;
  }
}

export async function deleteTask(taskId: string) {
  const userId = FALLBACK_USER;
  try {
    const headers = await authHeaders();
    await API.del('Api', `/tasks?userId=${userId}`, { body: { taskId }, headers });
  } catch (err: any) {
    console.error('deleteTask error', err);
    throw err;
  }
}
