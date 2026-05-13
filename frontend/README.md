Frontend notes

- Copy `frontend/.env.example` to `frontend/.env.local` and fill values before running locally.
- `frontend/src/aws-exports.js` is ignored — copy `frontend/src/aws-exports.example.js` to `frontend/src/aws-exports.js` and populate values if using Amplify-generated config.
- Do not commit `frontend/.env.local` or `frontend/src/aws-exports.js` with secrets.
