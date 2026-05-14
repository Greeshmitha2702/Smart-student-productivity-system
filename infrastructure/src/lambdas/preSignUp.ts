import { PreSignUpTriggerEvent } from 'aws-lambda';
import { SES } from 'aws-sdk';

const ses = new SES({ region: 'us-east-1' });

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

  // Verify email with SES for sending reminders (sandbox requirement)
  if (userEmail) {
    try {
      await ses.verifyEmailIdentity({ EmailAddress: userEmail }).promise();
      console.log(`SES verification initiated for ${userEmail}`);
    } catch (err) {
      console.error(`Failed to verify email with SES: ${userEmail}`, err);
      // Don't fail the sign-up if SES verification fails
    }
  }

  return event;
};