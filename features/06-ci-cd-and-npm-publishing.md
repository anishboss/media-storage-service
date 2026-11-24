# Feature 06: Two-Branch Strategy (Main/Prod & Development/Stage) & CI/CD Workflows

## Overview

This repository uses a structured two-branch Git workflow paired with GitHub Actions:

```
                  ┌──────────────────────────────────────────────┐
                  │           development branch                 │
Feature Branches ─►           (Stage Environment)                │
                  └──────────────────────┬───────────────────────┘
                                         │ Tested & Verified
                                         ▼ Pull Request
                  ┌──────────────────────────────────────────────┐
                  │              main branch                     │
                  │        (Production Environment)              │
                  └──────────────────────┬───────────────────────┘
                                         │ Release / Tag (v*.*.*)
                                         ▼
                               [ NPM Production Release ]
```

---

## 1. Branch Strategy

| Branch            | Environment    | Purpose                                                                   | CI/CD Action                                                                                       |
| ----------------- | -------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **`development`** | **Stage**      | Active integration, staging tests, beta features.                         | Runs matrix CI; optionally deploys staging / beta package under `@beta` tag.                       |
| **`main`**        | **Production** | Stable releases. Only merged from `development` via tested Pull Requests. | Runs matrix CI; publishes production package under `@latest` tag when a tag or release is created. |

---

## 2. GitHub Actions Workflows

### A. CI Workflow (`.github/workflows/ci.yml`)

- **Triggers**:
  - Every `push` to `main` OR `development`.
  - Every `pull_request` targeting `main` OR `development`.
- **Testing Matrix**: Node.js **18.x**, **20.x**, and **22.x**.
- **Steps**: Format check (`npm run format:check`), ESLint (`npm run lint`), TypeScript build (`npm run build`).

### B. Stage Deployment (`.github/workflows/stage-deploy.yml`)

- **Triggers**: Every `push` to `development`.
- **Steps**: Builds and verifies staging readiness. Supports manual dispatch to publish a pre-release (`--tag beta`) if desired.

### C. Production Deployment (`.github/workflows/publish-production.yml`)

- **Triggers**:
  - Pushing a version tag (`v1.0.1`, `v1.1.0`, etc.) to `main`.
  - Publishing a release in GitHub.
  - Manual dispatch with custom NPM tag.
- **Steps**: Verifies code quality, compiles production `.d.ts` bundles, and publishes to NPM with `--access public --provenance`.

---

## 3. Setup: Adding your NPM Token to GitHub

1. Log in to [npmjs.com](https://www.npmjs.com).
2. Go to **Access Tokens** ➔ **Generate New Token** ➔ Select **Automation**.
3. In your GitHub repository:
   - Go to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
   - Click **New repository secret**.
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM automation token.

---

## 4. How to Deploy a Production Release

When features in `development` are ready for production:

1. Create a Pull Request from `development` into `main`.
2. Once merged into `main`, checkout `main` and run:
   ```bash
   # Bug fix (e.g. 1.0.0 -> 1.0.1)
   npm run release:patch

   # New backward-compatible feature (e.g. 1.0.0 -> 1.1.0)
   npm run release:minor

   # Breaking change (e.g. 1.0.0 -> 2.0.0)
   npm run release:major
   ```
3. The script automatically tags the commit and pushes to GitHub, triggering `publish-production.yml` to deploy to NPM!
