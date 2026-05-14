import { PreSignUpTriggerEvent } from 'aws-lambda';

export const handler = async (event: PreSignUpTriggerEvent) => {
  const userEmail = event.request.userAttributes.email;

  // Read toggles from environment variables. Defaults keep previous behavior.
  const autoConfirmEnv = (process.env.AUTO_CONFIRM || 'true').toLowerCase();
  const autoVerifyEnv = (process.env.AUTO_VERIFY || 'true').toLowerCase();

  const autoConfirm = autoConfirmEnv === 'true' || autoConfirmEnv === '1';
  const autoVerify = autoVerifyEnv === 'true' || autoVerifyEnv === '1';

  // Apply Cognito auto-confirm / auto-verify according to env toggles
  event.response.autoConfirmUser = !!autoConfirm;
  event.response.autoVerifyEmail = !!autoVerify;

  return event;
};