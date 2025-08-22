# Workflows

This document outlines the recommended CI/CD workflows for the project.

## GitHub Actions

- **Build:** Runs `pnpm build` on every commit.
- **Lint & Typecheck:** Executes `pnpm lint` and `pnpm tsc --noEmit` to ensure code quality.
- **Test:** Runs automated tests using `pnpm test`.
- **Dependency Graph:** Execute `pnpm dep:graph` after module changes.

## Netlify Deployment

- **Automatic Deploys:** Triggered on push to the `main` branch.
- **Setup:** Ensure environment variables are configured as per SETUP.md.
- **Monitoring:** Check deployment logs on Netlify for preview issues.

## Branching and PR Strategy

- Use feature branches (e.g., `feature/<name>`).
- Open draft PRs after successful build, lint, and test runs.
- Update `docs/CHANGELOG.md` with every merge to record changes.
- Prefer squash-merge to maintain a clean history.

## Additional Recommendations

- Regularly audit dependencies and security vulnerabilities.
- Utilize automated tools to update the changelog and dependency map.
