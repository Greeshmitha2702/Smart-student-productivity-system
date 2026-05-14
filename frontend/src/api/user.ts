import { Auth } from 'aws-amplify';

const FALLBACK_USER = 'demo-user';

export async function getCurrentUserId() {
  try {
    const user = await Auth.currentAuthenticatedUser();
    const sub = user?.attributes?.sub;
    const username = user?.username;
    return sub || username || FALLBACK_USER;
  } catch (_err) {
    return FALLBACK_USER;
  }
}
