# Feature 06: CI/CD Workflows & Automated NPM Version Deployment

## Overview

This project uses **GitHub Actions** for automated continuous integration, matrix testing, and automated package version deployment to the NPM Registry with provenance.

---

## 1. CI Workflow (`.github/workflows/ci.yml`)

- **Triggers**:
  - Every `push` to the `main` branch.
  - Every `pull_request` targeting `main`.
- **Testing Matrix**:
  - Runs concurrently on Node.js **18.x**, **20.x**, and **22.x**.
- **Steps**:
  1. `npm ci` (clean dependency installation from lockfile)
  2. `npm run format:check` (validates code style with Prettier)
  3. `npm run lint` (runs ESLint with TypeScript rules)
  4. `npm run build` (verifies TypeScript compilation and `.d.ts` generation)

---

## 2. Automated Publishing Workflow (`.github/workflows/publish.yml`)

- **Triggers**:
  - **Git Version Tag**: Pushing any tag matching `v*` (e.g. `v1.0.1`).
  - **GitHub Release**: Publishing a release in GitHub.
  - **Manual Trigger**: Via the **Actions** tab in GitHub (`workflow_dispatch`).
- **Publishing Steps**:
  1. Validates linting and formatting.
  2. Builds the TypeScript library and type declarations.
  3. Publishes to NPM using `--access public` and `--provenance`.

---

## 3. Setup: Adding your NPM Token to GitHub

To allow GitHub Actions to publish your package to NPM:

1. Log in to [npmjs.com](https://www.npmjs.com).
2. Go to **Access Tokens** ➔ **Generate New Token** ➔ Select **Automation** (or Granular Access Token with Read and Write permissions for packages).
3. Copy the token.
4. In your GitHub repository:
   - Go to **Settings** ➔ **Secrets and variables** ➔ **Actions**.
   - Click **New repository secret**.
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM automation token.

---

## 4. How to Deploy a New Version

You can trigger a deployment directly from your terminal using the helper scripts:

### Patch Release (Bug fixes: 1.0.0 ➔ 1.0.1)

```bash
npm run release:patch
```

### Minor Release (New features: 1.0.0 ➔ 1.1.0)

```bash
npm run release:minor
```

### Major Release (Breaking changes: 1.0.0 ➔ 2.0.0)

```bash
npm run release:major
```

Each script will automatically:

1. Bump the version in `package.json` and `package-lock.json`.
2. Create a git commit and a version tag (e.g. `v1.0.1`).
3. Push the commit and tag to GitHub (`git push --follow-tags`).
4. GitHub Actions triggers `.github/workflows/publish.yml` and publishes to NPM!
