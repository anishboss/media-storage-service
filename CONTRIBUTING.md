# Contributing to Media Storage Service

Thank you for your interest in contributing to **`@dianomax/media-storage-service`**! We welcome contributions, bug fixes, feature requests, and documentation improvements.

---

## 🌿 Branching Strategy

We follow a two-branch Git workflow:

```
[ Feature / Bugfix Branch ]
           │
           ▼ (Pull Request)
    [ development ] ─── (Stage & Integration Tests)
           │
           ▼ (Pull Request)
        [ main ] ────── (Production & NPM Deployment)
```

- **`development`**: The default working branch for active development, new features, and bug fixes. **All Pull Requests must target `development`**.
- **`main`**: The production branch. Changes are merged from `development` via tested PRs. Version tags on `main` trigger automated NPM deployments.

---

## 🛠️ Development Setup

### 1. Prerequisites

- **Node.js**: `v18.x`, `v20.x`, or `v22.x`
- **NPM**: `v9.x` or higher
- **Local MinIO Instance**:
  - Running locally on `http://127.0.0.1:9000`
  - Default credentials: `minioadmin` / `minioadmin`

### 2. Fork & Clone

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/media-storage-service.git
cd media-storage-service

# Checkout the development branch
git checkout development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `.env` matches your local MinIO instance:

```env
PORT=4000
STORAGE_PROVIDER=s3
STORAGE_BUCKET=media-store
STORAGE_ENDPOINT=http://127.0.0.1:9000
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_FORCE_PATH_STYLE=true
```

### 5. Start Development Server

```bash
npm run dev
```

Open **`http://localhost:4000`** in your browser to test uploads, media streaming, and downloads via the web test console.

---

## 🧪 Code Quality & Verification

Before submitting a Pull Request, verify that all linting, formatting, and type-checking checks pass:

```bash
# 1. Check code formatting with Prettier
npm run format:check

# 2. Automatically fix formatting issues
npm run format

# 3. Check code quality with ESLint
npm run lint

# 4. Compile TypeScript & generate declaration files (.d.ts)
npm run build
```

---

## 🚀 Creating a Pull Request

1. **Create a branch off `development`**:

   ```bash
   git checkout development
   git pull origin development
   git checkout -b feat/your-feature-name
   # or: git checkout -b fix/issue-description
   ```

2. **Make your changes**:
   - Adhere to existing code conventions and Port & Adapter architecture.
   - Write clean, self-documenting TypeScript code.
   - Update or add documentation in `features/` if introducing architectural features.

3. **Verify checks**:

   ```bash
   npm run format
   npm run lint
   npm run build
   ```

4. **Commit with Conventional Commit messages**:
   - `feat: add support for WebP image compression`
   - `fix: handle edge case in range stream chunking`
   - `docs: update S3 migration checklist`

5. **Push and Open a Pull Request**:
   ```bash
   git push -u origin feat/your-feature-name
   ```
   Open a PR targeting the **`development`** branch on GitHub.

---

## 📦 Release Process (For Maintainers)

Releases are deployed automatically via GitHub Actions:

```bash
# Checkout main and ensure it's up to date with development
git checkout main
git pull origin main
git merge development
git push origin main

# Automated release (creates tag and pushes to trigger NPM publish workflow)
npm run release:patch   # For bug fixes (1.0.2 -> 1.0.3)
npm run release:minor   # For new features (1.0.2 -> 1.1.0)
npm run release:major   # For breaking changes (1.0.2 -> 2.0.0)
```

---

## 💬 Getting Help

If you run into issues or have questions, feel free to open an issue at:
👉 **[github.com/anishboss/media-storage-service/issues](https://github.com/anishboss/media-storage-service/issues)**
