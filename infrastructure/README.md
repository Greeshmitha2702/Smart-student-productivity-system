Infrastructure notes

- Copy `infrastructure/.env.example` to `infrastructure/.env` if you need local overrides.
- Keep `infrastructure/.env` out of version control; it is listed in `.gitignore`.
- Use `npx cdk bootstrap` and `npx cdk deploy --all` to deploy stacks. Use CI secrets for credentials.
