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

| Layer            | Technology                                       |
|------------------|--------------------------------------------------|
| SaaS Platform    | [OpenSaaS.sh](https://opensaas.sh/)              |
| Coordinator API  | Kotlin (Ktor), Redis/RabbitMQ, PostgreSQL        |
| Agent CLI        | Kotlin Native (Mac/Linux)                        |
| CI Integration   | GitHub Actions plugin, CLI wrapper               |
| Job Isolation    | Docker (sandboxed build environment)             |
| Web UI (future)  | Next.js (from OpenSaaS template)                 |
| Auth             | Supabase/Auth.js or Auth0                        |

---

## 📂 Project Structure

