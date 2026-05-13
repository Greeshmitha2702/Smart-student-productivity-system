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

export async function fetchPlans(filters?: { q?: string; startDate?: string; endDate?: string; }) {
  const userId = await getCurrentUserId();
  try {
    const headers = await authHeaders();
    const qs = new URLSearchParams({ userId });
    if (filters?.q) qs.set('q', filters.q);
    if (filters?.startDate) qs.set('startDate', filters.startDate);
    if (filters?.endDate) qs.set('endDate', filters.endDate);
    const response = await API.get('Api', `/planner?${qs.toString()}`, { headers });
    return response.plans || [];
  } catch (err: any) {
    console.error('fetchPlans error', err);
    throw err;
  }
}

export async function createPlan(plan: { activity: string; time?: string; endTime?: string; date?: string; productiveHours?: number; recurrence?: 'none' | 'daily' | 'weekly'; planId?: string; }) {
  const userId = await getCurrentUserId();
  try {
    const headers = await authHeaders();
    const response = await API.post('Api', `/planner?userId=${userId}`, { body: plan, headers });
    return response.plan;
  } catch (err: any) {
    console.error('createPlan error', err);
    throw err;
  }
}

export async function updatePlan(plan: { planId: string; activity?: string; time?: string; endTime?: string; date?: string; productiveHours?: number; recurrence?: 'none' | 'daily' | 'weekly'; completed?: boolean; }) {
  const userId = await getCurrentUserId();
  try {
    const headers = await authHeaders();
    await API.put('Api', `/planner?userId=${userId}`, { body: plan, headers });
  } catch (err: any) {
    console.error('updatePlan error', err);
    throw err;
  }
}

export async function deletePlan(planId: string) {
  const userId = await getCurrentUserId();
  try {
    const headers = await authHeaders();
    await API.del('Api', `/planner?userId=${userId}`, { body: { planId }, headers });
  } catch (err: any) {
    console.error('deletePlan error', err);
    throw err;
  }
}
