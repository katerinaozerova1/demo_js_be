# demo_js_be
Sample Express app used to demonstrate **SeaLights** Node.js onboarding in GitHub Actions. The workflow is already expected to live at `.github/workflows/` (for example `sealights-nodejs-onboarding.yml`).
---
## Step 1 — Repository and local setup
## 1. What this onboarding is (and is not)
**Is:** Onboard the **SeaLights Node.js agent** (`slnodejs`) so each manual CI run **creates a build**, **scans** the app, **runs a test session**, **starts the instrumented app** on the GitHub Actions runner, **drives HTTP smoke tests** against it, then **ends the session** so **results and coverage** show in the **SeaLights UI**.
**Is not:** There is **no deployment** to a server, cluster, or cloud. The app runs **only on the CI VM** (`localhost:3000`). That is enough for SeaLights to collect **runtime coverage** for this build/session; you do **not** need a separate “deploy” step for that.
---
## 2. Prerequisites (one-time)
### SeaLights
- An **application** registered in SeaLights (here: **`demo_js_be`**).
- A valid **agent API token**; store it as **`SL_TOKEN`** in the repository **Settings → Secrets and variables → Actions**.
---
## 3. Repository and local setup
1. **Clone** this repository and open it in your editor.
2. **Install dependencies** (Node 18.x is what the workflow uses; match it locally if you want parity):
   ```bash
   npm install
   ```
3. **Run the app locally** (optional sanity check):
   ```bash
   node index.js
   ```
   The server listens on **port 3000** (see `index.js` / `app.listen`).
4. **Workflow file**  
   You should already have the SeaLights GitHub Actions workflow committed under **`.github/workflows/`**. This README does not duplicate that file; it describes what you must configure in SeaLights and how the end-to-end run works.
---
## Step 4 (partial) — SeaLights only
Complete these in **SeaLights** and **GitHub** before relying on the workflow for demos.
| Item | What to do |
|------|------------|
| **Application in SeaLights** | Register or use an app whose name matches the workflow (e.g. `demo_js_be` in the `slnodejs config --appname` step). |
| **Agent API token** | Create or copy an **agent** token in SeaLights that is allowed to upload builds and test sessions for that app. |
| **GitHub secret** | In the repo, go to **Settings → Secrets and variables → Actions** and add a secret named **`SL_TOKEN`** (or the name your workflow uses) with that token. |
| **Branch naming** | The workflow should pass the real branch to SeaLights (e.g. `${{ github.ref_name }}` for `main`). The app in SeaLights receives builds under that branch label. |
| **Node agent** | The workflow installs the **SeaLights Node.js agent** via **`slnodejs`** (`npm install slnodejs` / `npx slnodejs`). You do not install a separate “deployment” for coverage; the agent runs in CI next to your code. |
No other SeaLights products are required for this minimal backend demo, as long as the token and app name align with the workflow.
---
## Summary of sealights-nodejs-onboarding.yml — Full flow (one end-to-end explanation)
You start the workflow from the **Actions** tab (**workflow_dispatch**), and the job performs the full pipeline below.
### Trigger
1. In GitHub: **Actions** → select the SeaLights onboarding workflow → **Run workflow** → run on the intended branch (usually `main`).
### What runs, in order
1. **Checkout** — The runner checks out the repository (with permissions to **push** if your workflow commits changes).
2. **Node and dependencies** — Node and npm are pinned to the versions in the workflow; `npm install` (and any explicit `slnodejs` install) prepare the app and the SeaLights CLI.
3. **Build stamp in source (Code Changes demo)**  
   A script **injects or updates** a per-run constant `__SL_DEMO_STAMP` in `index.js` and wires it into real code paths (for example the response body and middleware logging), **not** as comment-only text. That gives SeaLights a real **code change** each run.
4. **Commit and push (optional in your design)**  
   If your workflow includes it, the bot commits and pushes the stamped `index.js` so the branch in Git matches what you are about to build and test.
5. **`slnodejs config`** — Declares a **new build** in SeaLights: **app name**, **branch**, and **build id** (e.g. timestamp), using `SL_TOKEN`.
6. **`slnodejs scan`** — Scans the workspace, writes the **build session id** to a file (e.g. `buildSessionId`), and prepares **instrumented** code for the agent. There is still **no external deployment**; everything stays on the runner.
7. **Smoke test file (if generated in CI)** — The workflow may create a small test file (e.g. `smoke.test.mjs`) that will HTTP-call the app and assert the response includes the same stamp as in `index.js`.
8. **`slnodejs start`** — Starts a **test session** in SeaLights for a named test stage (e.g. `Manual Tests`) tied to that build session.
9. **`slnodejs run` with your entry file** — Starts the **instrumented** application in the background (e.g. `npx slnodejs run … -- index.js`). A **health check** waits until `GET /` returns the expected “Hello” text **and** the run stamp, so you know the **stamped, instrumented** app is the one serving traffic.
10. **Tests** — Additional requests and `node --test` (or your test runner) drive traffic to `localhost` while the session is open, so coverage can be collected.
11. **`slnodejs end`** — Closes the test session and flushes final results (often set to run **`if: always()`** so it runs even if a test fails).
12. **Stop the app** — The background process is stopped so the job cleans up.
### Where to look in SeaLights after a green run
- The **build** for `demo_js_be` on the **correct branch** and the **new build id**.
- **Code Changes** — Should reflect the `__SL_DEMO_STAMP`-style edit in real code, not only comments.
- **Coverage and test session** for the **Manual Tests** (or your named) stage, linked to that build session.
---
## Troubleshooting (short)
| Symptom | What to check |
|--------|----------------|
| No coverage | Same job must **scan** and then **`slnodejs run`** the instrumented app; `buildSessionId` must be shared. If the app is **CommonJS** only, avoid `scan` flags meant for ESM only (e.g. `--es6Modules` when the code uses `require` only). |
| Code change missing in UI | Use **executable** code changes, not only `//` comments. |
| Push fails | Branch protection may block bot pushes; adjust rules or use a token with rights to push. |
| Port / health check fails | Confirm the app’s listen **port** matches the workflow (here **3000**) and that the stamped response is what the health check expects. |
---
