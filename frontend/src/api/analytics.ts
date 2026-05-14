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

export async function fetchAnalytics() {
  try {
    const userId = await getCurrentUserId();
    const headers = await authHeaders();
    const qs = new URLSearchParams({ userId });
    return await API.get('Api', `/analytics?${qs.toString()}`, { headers });
  } catch (err) {
    throw err;
  }
}

export async function recordDailyLogin() {
  try {
    const userId = await getCurrentUserId();
    const headers = await authHeaders();
    await API.post('Api', `/analytics?userId=${encodeURIComponent(userId)}`, {
      headers,
      body: { action: 'recordLogin' }
    });
  } catch (_err) {
    // Non-blocking on purpose: auth UX should not fail if this telemetry call fails.
  }
}
