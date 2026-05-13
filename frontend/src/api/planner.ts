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

export async function fetchPlans() {
  const userId = FALLBACK_USER;
  try {
    const headers = await authHeaders();
    const response = await API.get('Api', `/planner?userId=${userId}`, { headers });
    return response.plans || [];
  } catch (err: any) {
    console.error('fetchPlans error', err);
    throw err;
  }
}

export async function createPlan(plan: { time: string; activity: string; }) {
  const userId = FALLBACK_USER;
  try {
    console.log('createPlan: Getting auth headers...');
    const headers = await authHeaders();
    console.log('createPlan: Auth headers ready, making POST request...', { headers });
    const response = await API.post('Api', `/planner?userId=${userId}`, { body: plan, headers });
    console.log('createPlan: Response received', response);
    return response.plan;
  } catch (err: any) {
    console.error('createPlan error', err);
    console.error('createPlan error details:', { message: err.message, code: err.code, response: err.response });
    throw err;
  }
}

export async function updatePlan(plan: { time: string; activity: string; userId: string; planId: string; }) {
  const userId = FALLBACK_USER;
  try {
    const headers = await authHeaders();
    await API.put('Api', `/planner?userId=${userId}`, { body: plan, headers });
  } catch (err: any) {
    console.error('updatePlan error', err);
    throw err;
  }
}

export async function deletePlan(planId: string) {
  const userId = FALLBACK_USER;
  try {
    const headers = await authHeaders();
    await API.del('Api', `/planner?userId=${userId}`, { body: { planId }, headers });
  } catch (err: any) {
    console.error('deletePlan error', err);
    throw err;
  }
}
