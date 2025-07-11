# 🐝 BuildHive — Distributed CI Powered by Your Team

**BuildHive** is a developer-first SaaS platform that intelligently offloads heavy CI workloads — like Android or iOS builds — from cloud runners to your team’s own high-performance developer machines (e.g., MacBook Pros), when they’re idle.

BuildHive helps you **reduce CI costs**, **speed up builds**, and **utilize team resources more efficiently** — all with security and control.

---

## 🚀 Key Features

- ⚡ Offload CI jobs (e.g., Android builds) to local team machines
- 🔁 Auto-detection of high CI load and seamless fallback
- 🧠 Smart coordination and agent selection
- 🔐 Secure, sandboxed local task execution (Docker-based)
- 🛠️ Lightweight agent runs on developer machines
- 🤝 GitHub Actions integration (MVP target)
- 💻 Kotlin Multiplatform architecture for shared logic

---

## 🧱 Tech Stack

| Layer            | Technology                                       | Notes                                                                 |
|------------------|--------------------------------------------------|-----------------------------------------------------------------------|
| SaaS Platform    | [OpenSaaS.sh](https://opensaas.sh/) (Wasp-based) | Provides frontend, auth, DB, jobs, and deployment foundation.       |
| Coordinator API  | Kotlin (Ktor), Redis/RabbitMQ, PostgreSQL        | Core backend for managing agents and build jobs.                      |
| Agent CLI        | Kotlin Native (Mac/Linux)                        | Runs on developer machines to execute CI tasks.                       |
| CI Integration   | GitHub Actions plugin, CLI wrapper               | Allows GitHub Actions to offload jobs to BuildHive.                   |
| Job Isolation    | Docker (sandboxed build environment)             | Ensures secure execution of jobs on agent machines.                   |
| Web UI           | React (via Wasp/OpenSaaS)                        | For dashboard, monitoring, and administration.                        |
| Auth             | Wasp built-in (Email/Pass, Social OAuth)         | Leverages OpenSaaS template's authentication features.                |
| Database         | PostgreSQL (via Wasp/OpenSaaS)                   |                                                                       |

---

## ✨ Leveraging OpenSaaS & Wasp

BuildHive utilizes the [OpenSaaS.sh](https://opensaas.sh/) template, which is built on the [Wasp](https://wasp.sh/) full-stack framework. This provides several advantages:

- **Rapid UI Development**: Quickly build the web dashboard and admin interfaces using React, TailwindCSS, and pre-built components from the OpenSaaS template.
- **Simplified Authentication**: Integrated email/password and social OAuth (e.g., GitHub) out-of-the-box.
- **Database & Migrations**: Prisma ORM for PostgreSQL, with Wasp managing schema migrations.
- **Background Jobs**: Wasp's job scheduling capabilities can be used for tasks like queue monitoring or cleanup. (Note: Core job queuing for CI tasks will use Redis/RabbitMQ with Ktor).
- **Type Safety**: End-to-end type safety between frontend and backend.
- **Deployment**: Simplified deployment options via Wasp CLI (e.g., Fly.io, Railway).

---

## 📂 Project Structure

```
buildhive/
├── app/                   → Wasp-based SaaS application (UI, auth, core user-facing platform)
│   ├── main.wasp          → Wasp configuration file
│   ├── src/               → Frontend and backend code (React, Node.js)
│   ├── public/            → Static assets
│   └── schema.prisma      → Database schema
├── coordinator/           → Ktor backend service (API for agents, job queue management)
├── agent/                 → Kotlin Native CLI (runs on developer machines)
├── ci-plugin/             → GitHub Action + CLI integration
├── shared-kmp/            → Shared Kotlin Multiplatform code (logic between coordinator & agent)
└── docs/                  → Diagrams, specs, and API definitions
```

---

## ✅ MVP Checklist

### Phase 1: Coordinator & Agent
- [x] Scaffold OpenSaaS template
- [ ] Ktor coordinator service (REST API, queue, DB)
- [ ] Agent CLI (auth, heartbeat, task execution)
- [ ] Redis/RabbitMQ integration for job queue
- [ ] PostgreSQL schema for jobs and agents

### Phase 2: CI Integration
- [ ] GitHub Actions plugin (send job to BuildHive)
- [ ] Job packaging (zip or Docker context)
- [ ] Artifact + log return to CI step

### Phase 3: Security & Isolation
- [ ] Docker sandboxing on agent
- [ ] Agent-level permission system
- [ ] JWT or API key auth for agents

### Phase 4: Basic Monitoring
- [ ] CLI dashboard or basic Web UI (agent/job status)
- [ ] Logs and artifact management

---

## 💡 Why BuildHive?

| Problem                                | BuildHive Solution                           |
|----------------------------------------|-----------------------------------------------|
| Long CI build times                    | Offloads to idle developer machines           |
| Expensive hosted runners               | Reduces reliance on cloud infrastructure      |
| Underutilized MacBooks on the team     | Puts idle power to work securely              |
| Teams blocked waiting on builds        | Parallelizes pipeline tasks dynamically       |

---

## 🧩 Getting Started

BuildHive consists of multiple components. The primary user-facing application is built with Wasp.

### Running the Wasp (SaaS) Application:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/buildhive.git
    cd buildhive/app
    ```
    *(Note: If you've already cloned, just `cd buildhive/app`)*

2.  **Set up environment variables:**
    *   Copy `.env.client.example` to `.env.client` and fill in client-side variables.
    *   Copy `.env.server.example` to `.env.server` and fill in server-side variables (ensure database URLs, API keys, etc., are correctly set up for development).

3.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install, if you prefer
    ```
    *(Wasp typically manages its own dependencies, but ensure your project's root `package.json` in `app/` is processed)*

4.  **Start the Wasp development server:**
    *   In one terminal, start the database:
        ```bash
        wasp start db
        ```
    *   In another terminal, start the Wasp app:
        ```bash
        wasp start
        ```

5.  **Database Migrations:**
    *   If this is the first time starting the app, or if you've made changes to `schema.prisma`:
        ```bash
        wasp db migrate-dev
        ```

The application should now be running, typically at `http://localhost:3000`.

### Other Components:

*   **Coordinator Service (`coordinator/`):** Refer to `coordinator/README.md` for setup and running instructions. This will typically involve setting up a Kotlin/Ktor environment, PostgreSQL, and Redis/RabbitMQ.
*   **Agent CLI (`agent/`):** Refer to `agent/README.md` for setup and build instructions for the Kotlin Native agent.
*   **CI Plugin (`ci-plugin/`):** Details for using and testing the GitHub Actions plugin will be in its respective directory.

---

## 📈 Future Features

* Historical load analysis and build prediction
* Multi-agent fallback and load splitting
* Multi-CI support (GitLab, CircleCI, Bitrise)
* Web dashboard with admin controls
* Team reward tracking system (credits per agent usage)

---

## 🧠 Philosophy

BuildHive is built on the belief that **developer machines are incredibly powerful — and usually underused**. With the right orchestration and security, we can harness that power to improve builds, save money, and move faster.

---

## 📜 License

To be determined (e.g., Apache 2.0 or private SaaS license)

---

## 🐝 Made with ❤️ for developer teams that move fast and think smart.

```

---

Would you like:
- A matching `CONTRIBUTING.md` or `SECURITY.md`?
- Installation/setup docs for the agent and coordinator?
- A logo image for the top of the README?

Let me know how you'd like to expand it!
```
