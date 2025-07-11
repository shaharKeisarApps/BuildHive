# BuildHive Development Plan (MVP)

This document breaks down the MVP features outlined in the main `README.md` into smaller, actionable tasks. The goal is to facilitate a structured development process, ensuring each part is well-defined and testable.

## Guiding Principles

*   **Small, Incremental Changes:** Each task should represent a manageable unit of work.
*   **Test Coverage:** All new functionality must be accompanied by relevant tests (unit, integration, E2E).
*   **Clear Acceptance Criteria:** Each task should have clear conditions that define its completion.
*   **AI-Bot Friendly:** Tasks are described with enough detail to be picked up by an AI development bot.

---

## Phase 1: Coordinator & Agent Core

**Overall Goal:** Establish the basic communication and job handling between the Ktor Coordinator service and a Kotlin Native Agent. The Wasp application (scaffolded) will serve as the future user interface and management layer but is not the primary focus for backend logic in this phase.

### 1.1. Scaffold OpenSaaS Template
*   **Status:** [x] Done (as per `README.md`)
*   **Details:** The Wasp application under `app/` is the result of this.
*   **Key Files:** `app/main.wasp`, `app/schema.prisma`, `app/src/`
*   **Acceptance Criteria:**
    *   Basic Wasp application runs.
    *   Default OpenSaaS pages are accessible.
*   **Testing:** Manual verification of the running app.

### 1.2. Ktor Coordinator Service: Basic Setup & API Endpoints
*   **Goal:** Implement the initial Ktor server with essential API endpoints for agent registration and job status updates.
*   **Key Files/Modules (Coordinator - `coordinator/`):**
    *   `build.gradle.kts` (dependencies for Ktor, serialization, database)
    *   `src/main/kotlin/Application.kt` (Ktor server setup, plugins)
    *   `src/main/kotlin/Routing.kt` (API route definitions)
    *   `src/main/kotlin/model/Agent.kt`, `src/main/kotlin/model/Job.kt` (data classes)
*   **Tasks:**
    1.  **Project Setup:**
        *   Initialize Ktor project in `coordinator/`.
        *   Add dependencies: Ktor (core, netty, content-negotiation, serialization-kotlinx-json), Logback.
    2.  **API Endpoints (Initial):**
        *   `POST /api/v1/agent/register`: Allows an agent to register with the coordinator. (Request: Agent info; Response: Agent ID, configuration)
        *   `POST /api/v1/agent/heartbeat`: Agent sends periodic heartbeats. (Request: Agent ID; Response: Acknowledgement, pending commands)
        *   `GET /api/v1/jobs/next`: Agent requests the next available job. (Request: Agent ID, capabilities; Response: Job details or no-job)
        *   `PUT /api/v1/jobs/{jobId}/status`: Agent updates the status of a job (e.g., running, completed, failed). (Request: Agent ID, Job ID, status, logs_url, artifacts_url; Response: Acknowledgement)
    3.  **Data Models (Initial):** Define simple Kotlin data classes for `Agent` and `Job` (in-memory for now, DB integration later).
*   **Acceptance Criteria:**
    *   Ktor server runs and listens on a configured port.
    *   Endpoints are reachable via cURL or Postman.
    *   Basic request/response validation (e.g., required fields).
*   **Testing:**
    *   Unit tests for routing logic (if complex).
    *   Integration tests for API endpoints (e.g., using Ktor's test engine).

### 1.3. Agent CLI: Basic Setup & Communication
*   **Goal:** Create a minimal Kotlin Native CLI agent that can register with the coordinator and send heartbeats.
*   **Key Files/Modules (Agent - `agent/`):**
    *   `build.gradle.kts` (dependencies for Kotlin Native, Ktor client, serialization)
    *   `src/nativeMain/kotlin/Main.kt` (CLI entry point)
    *   `src/commonMain/kotlin/Api.kt` (shared Ktor client logic, if using KMP for client) or `src/nativeMain/kotlin/ApiClient.kt`
*   **Tasks:**
    1.  **Project Setup:**
        *   Initialize Kotlin Native (or KMP with native target) project in `agent/`.
        *   Add dependencies: Ktor client (cio or curl), kotlinx.coroutines, kotlinx.serialization.
    2.  **Agent Registration:** Implement logic to call `POST /api/v1/agent/register` on startup. Store received Agent ID.
    3.  **Heartbeat:** Implement a loop to periodically call `POST /api/v1/agent/heartbeat`.
    4.  **Configuration:** Basic config loading (e.g., coordinator URL from file or env var).
*   **Acceptance Criteria:**
    *   Agent CLI compiles and runs.
    *   Agent successfully registers with the coordinator (verified by coordinator logs/state).
    *   Agent sends periodic heartbeats (verified by coordinator logs/state).
*   **Testing:**
    *   Unit tests for API client functions.
    *   Manual E2E test: Run coordinator, run agent, observe successful registration and heartbeats.

### 1.4. PostgreSQL Integration for Coordinator
*   **Goal:** Store agent and job information in a PostgreSQL database instead of in-memory.
*   **Key Files/Modules (Coordinator - `coordinator/`):**
    *   `build.gradle.kts` (add Exposed or other DB library dependencies)
    *   `src/main/kotlin/db/DatabaseFactory.kt` (DB connection setup)
    *   `src/main/kotlin/db/Schema.kt` (table definitions)
    *   `src/main/kotlin/services/AgentService.kt`, `src/main/kotlin/services/JobService.kt` (database interaction logic)
*   **Tasks:**
    1.  **Add DB Dependency:** Choose a DB library (e.g., Exposed, Ktorm, jOOQ) and add it.
    2.  **Schema Definition:** Define tables for `Agents` (id, hostname, status, last_heartbeat) and `Jobs` (id, status, definition, agent_id, created_at, updated_at).
    3.  **Database Factory:** Implement HikariCP for connection pooling and connect to PostgreSQL.
    4.  **Service Layer:** Refactor API endpoint handlers to use service classes that interact with the database.
    5.  **Migrations:** Plan for schema migrations (e.g., Flyway, Liquibase, or manual scripts for now).
*   **Acceptance Criteria:**
    *   Coordinator persists agent registrations and job data in PostgreSQL.
    *   Data is correctly retrieved and updated via API calls.
*   **Testing:**
    *   Unit tests for service layer functions (mocking DB interactions or using an in-memory H2 for tests).
    *   Integration tests with a real PostgreSQL instance.

### 1.5. Redis/RabbitMQ Integration for Job Queue
*   **Goal:** Use Redis (for simplicity) or RabbitMQ (for robustness) as a job queue.
*   **Key Files/Modules (Coordinator - `coordinator/`):**
    *   `build.gradle.kts` (add Redis client - Jedis/Lettuce, or RabbitMQ client)
    *   `src/main/kotlin/queue/JobQueueService.kt`
*   **Tasks:**
    1.  **Add Client Dependency:** Choose and add the client library.
    2.  **Queue Service:**
        *   Implement `enqueueJob(jobDetails)`: Pushes a new job to the queue.
        *   Implement `dequeueJob(agentCapabilities)`: Fetches a job from the queue (this will be called by the `/api/v1/jobs/next` endpoint handler).
    3.  **API Integration:**
        *   A new (internal or admin) endpoint `POST /api/v1/jobs` to submit new jobs to the queue.
        *   The `/api/v1/jobs/next` endpoint now attempts to dequeue from this service.
*   **Acceptance Criteria:**
    *   Jobs submitted via `POST /api/v1/jobs` are added to the queue.
    *   Agents calling `/api/v1/jobs/next` receive jobs from the queue.
*   **Testing:**
    *   Unit tests for `JobQueueService` (mocking Redis/RabbitMQ client).
    *   Integration tests with a real Redis/RabbitMQ instance.

### 1.6. Agent CLI: Task Execution (Placeholder)
*   **Goal:** Agent requests a job and "executes" it (e.g., prints job details and waits for a dummy duration).
*   **Key Files/Modules (Agent - `agent/`):**
    *   `src/nativeMain/kotlin/Main.kt`
    *   `src/nativeMain/kotlin/TaskRunner.kt`
*   **Tasks:**
    1.  **Job Polling:** Agent periodically calls `GET /api/v1/jobs/next`.
    2.  **Task Execution Logic:** If a job is received:
        *   Print job details.
        *   Update job status to `RUNNING` via `PUT /api/v1/jobs/{jobId}/status`.
        *   Simulate work (e.g., `delay(jobDuration)`).
        *   Update job status to `COMPLETED` via `PUT /api/v1/jobs/{jobId}/status`.
        *   If error, update to `FAILED`.
*   **Acceptance Criteria:**
    *   Agent fetches a job from the coordinator.
    *   Agent reports `RUNNING` and then `COMPLETED`/`FAILED` status back to the coordinator.
    *   Coordinator's database reflects these status changes.
*   **Testing:**
    *   Manual E2E: Submit a job to coordinator, run agent, observe job fetching and status updates.

---

## Phase 2: CI Integration

**Overall Goal:** Allow a GitHub Actions workflow to submit a job to BuildHive and receive results.

### 2.1. GitHub Actions Plugin: Send Job to BuildHive
*   **Goal:** Create a basic GitHub Action that can package a context and submit it as a job to BuildHive.
*   **Key Files/Modules (`ci-plugin/`):**
    *   `action.yml` (GitHub Action metadata)
    *   Entrypoint script (e.g., `main.sh` or `main.js` if using Node.js action)
    *   Helper scripts/CLI wrapper.
*   **Tasks:**
    1.  **Action Definition (`action.yml`):** Define inputs (e.g., `buildhive_coordinator_url`, `job_definition_file`, `api_key`).
    2.  **Job Submission Logic:**
        *   Script to read job definition.
        *   Call the (yet to be defined) BuildHive coordinator endpoint for submitting jobs from CI (e.g., `POST /api/v1/ci/jobs`). This endpoint will handle authentication (API key) and add the job to the queue.
    3.  **Authentication:** The action needs an API key to authenticate with the BuildHive coordinator.
*   **Acceptance Criteria:**
    *   A GitHub Actions workflow can use this action.
    *   The action successfully submits a job request to the coordinator.
    *   The job appears in the BuildHive job queue.
*   **Testing:**
    *   Create a test repository with a workflow using the action.
    *   Mock the BuildHive coordinator or use a dev instance.

### 2.2. Job Packaging (Initial: Zip or simple context)
*   **Goal:** Define how job context (source code, scripts) is packaged and made available to the agent.
*   **Key Files/Modules (Coordinator, Agent, CI Plugin):**
    *   Coordinator: Logic to store/reference job package URL.
    *   Agent: Logic to download and unpack job package.
    *   CI Plugin: Logic to create and upload the package (e.g., to S3 or another temporary storage).
*   **Tasks:**
    1.  **Packaging Strategy:** Decide on initial packaging (e.g., zip file).
    2.  **Storage:** Decide on temporary storage for the package (e.g., S3 presigned URL, coordinator stores temporarily). For MVP, coordinator could receive a tarball/zip directly (small jobs) or a URL.
    3.  **CI Plugin:** Update plugin to create a zip of the current workspace (or specified directory) and upload it or include its URL in the job submission.
    4.  **Coordinator:** Update `POST /api/v1/ci/jobs` to accept package URL or payload. Store this with the job.
    5.  **Agent:** Update `TaskRunner.kt` to download the package (if URL) and extract it before "execution".
*   **Acceptance Criteria:**
    *   CI plugin packages relevant files.
    *   Coordinator stores reference to the package.
    *   Agent can download and extract the package.
*   **Testing:**
    *   E2E test: GitHub Action packages files, agent downloads and extracts them.

### 2.3. Artifact and Log Return to CI Step (Basic)
*   **Goal:** Agent uploads artifacts and logs; CI plugin polls for job completion and retrieves them.
*   **Key Files/Modules (Coordinator, Agent, CI Plugin):**
    *   Agent: Logic to upload logs/artifacts (e.g., to S3, then notify coordinator).
    *   Coordinator: Endpoints for agent to report artifact/log URLs. Endpoint for CI plugin to poll job status and get these URLs.
    *   CI Plugin: Logic to poll for job completion and download artifacts/logs.
*   **Tasks:**
    1.  **Storage for Artifacts/Logs:** Decide on storage (e.g., S3).
    2.  **Agent Upload:** Agent uploads specified output files/logs to storage and reports URLs to coordinator via `PUT /api/v1/jobs/{jobId}/status` or a dedicated endpoint.
    3.  **Coordinator Polling Endpoint:** `GET /api/v1/ci/jobs/{jobId}/status` for CI plugin to poll. Returns job status, log URLs, artifact URLs.
    4.  **CI Plugin Polling:** Action polls the coordinator until job is `COMPLETED` or `FAILED`.
    5.  **CI Plugin Download:** Action downloads logs/artifacts from reported URLs.
*   **Acceptance Criteria:**
    *   Agent uploads a dummy log and artifact.
    *   CI plugin polls, detects completion, and downloads the log/artifact.
*   **Testing:**
    *   E2E test: Full flow from GitHub Action job submission to artifact retrieval.

---

## Phase 3: Security & Isolation

**Overall Goal:** Enhance security of agent communication and job execution.

### 3.1. Docker Sandboxing on Agent
*   **Goal:** Agent executes jobs within a Docker container for isolation.
*   **Key Files/Modules (Agent - `agent/`):**
    *   `TaskRunner.kt`
    *   Docker interaction logic.
*   **Tasks:**
    1.  **Docker Interaction:** Add library or use CLI commands to interact with Docker daemon (e.g., start container, copy files, exec commands, get logs).
    2.  **Job Definition Update:** Job definition needs to specify Docker image, commands to run inside.
    3.  **TaskRunner Refactor:**
        *   Download job package.
        *   Pull specified Docker image.
        *   Start container, mounting job package directory.
        *   Execute job commands inside container.
        *   Stream logs from container.
        *   Copy artifacts from container.
*   **Acceptance Criteria:**
    *   Agent executes a simple job (e.g., `echo "hello"`) inside a specified Docker container.
    *   Logs from the container are captured.
    *   Artifacts created in the container are retrieved.
*   **Testing:**
    *   Agent successfully runs a Dockerized task.
    *   Verify isolation (job cannot access arbitrary host files).

### 3.2. Agent-Level Permission System (Basic)
*   **Goal:** (Future MVP consideration, might be simplified) Coordinator can define what types of jobs an agent can run (e.g., based on tags, resources).
*   **Tasks:** This is likely deferred beyond initial MVP or simplified to agent self-declared capabilities. For now, agents run any job they pick up.

### 3.3. JWT or API Key Auth for Agents & CI Plugin
*   **Goal:** Secure communication between Agent/CI Plugin and Coordinator.
*   **Key Files/Modules (Coordinator, Agent, CI Plugin):**
    *   Coordinator: Ktor Auth plugin setup.
    *   Agent: Logic to acquire and send token/key.
    *   CI Plugin: Logic to use API key.
*   **Tasks:**
    1.  **Coordinator Auth Setup (API Key for CI):**
        *   Implement API key authentication for `POST /api/v1/ci/jobs`.
        *   Store API keys securely (e.g., hashed in DB, associated with users/teams later).
    2.  **Coordinator Auth Setup (JWT for Agents):**
        *   `POST /api/v1/agent/register` returns a JWT upon successful registration.
        *   Protect other agent-facing endpoints (`/heartbeat`, `/jobs/next`, `/jobs/{jobId}/status`) with JWT auth.
    3.  **Agent Token Handling:**
        *   Store JWT received during registration.
        *   Include JWT in headers for subsequent requests.
        *   Handle token expiry/refresh (simplified for MVP - e.g., re-register).
    4.  **CI Plugin API Key:** Action uses a secret API key provided in the GitHub workflow.
*   **Acceptance Criteria:**
    *   Coordinator endpoints are protected.
    *   Unauthenticated requests are rejected.
    *   Agent and CI Plugin can successfully authenticate and communicate.
*   **Testing:**
    *   Integration tests for auth mechanisms.
    *   Manual tests with valid/invalid tokens/keys.

---

## Phase 4: Basic Monitoring (Wasp UI)

**Overall Goal:** Provide a simple web interface to view agent and job status.

### 4.1. Wasp UI: Agent Status Page
*   **Goal:** Display a list of registered agents and their status using the Wasp app.
*   **Key Files/Modules (`app/`):**
    *   `main.wasp`: Define page, route, queries.
    *   `schema.prisma`: Ensure Agent model is suitable for display.
    *   `src/server/queries.ts` (or similar): Query to fetch agents from DB (via Coordinator API or direct DB if shared).
        *   *Decision: For MVP, Wasp app might need its own view of data, or Coordinator API needs to expose more GET endpoints for UI.*
        *   *Alternative: Wasp app queries Coordinator's PostgreSQL DB directly (read-only).*
    *   `src/client/pages/AdminDashboardPage.tsx` (or new page): React component to display agents.
*   **Tasks:**
    1.  **Data Access Strategy:**
        *   Option A: Coordinator exposes `GET /api/v1/admin/agents` (requires auth). Wasp backend calls this.
        *   Option B: Wasp app has read-only access to relevant tables in Coordinator's DB.
        *   Choose A for better encapsulation.
    2.  **Coordinator API:** Implement `GET /api/v1/admin/agents` and `GET /api/v1/admin/agents/{agentId}`. Secure with admin auth.
    3.  **Wasp Query:** Create a Wasp query that calls the new Coordinator admin API.
    4.  **Wasp Page:** Create a page to display agents (ID, status, last heartbeat, jobs processed count).
*   **Acceptance Criteria:**
    *   Wasp UI page lists registered agents and their current status.
    *   Information is refreshed periodically or on demand.
*   **Testing:**
    *   Wasp UI tests (if framework exists).
    *   Manual verification.

### 4.2. Wasp UI: Job Status Page
*   **Goal:** Display a list of jobs and their status.
*   **Key Files/Modules (`app/`):**
    *   Similar to Agent Status Page: Wasp page, query.
    *   Coordinator API: `GET /api/v1/admin/jobs`, `GET /api/v1/admin/jobs/{jobId}`.
*   **Tasks:**
    1.  **Coordinator API:** Implement admin endpoints for jobs.
    2.  **Wasp Query:** Create Wasp query to fetch jobs.
    3.  **Wasp Page:** Create page to display jobs (ID, status, submitted time, agent assigned, links to logs/artifacts if available).
*   **Acceptance Criteria:**
    *   Wasp UI page lists jobs and their current status.
*   **Testing:** Manual verification.

### 4.3. Basic Logs and Artifact Management (Links in UI)
*   **Goal:** Link to logs/artifacts from the Job Status page if URLs are available.
*   **Key Files/Modules (`app/`):**
    *   Wasp Job Status Page component.
*   **Tasks:**
    1.  **Data Model:** Ensure Job model in Wasp (or data from Coordinator API) includes `logs_url` and `artifacts_url`.
    2.  **UI Update:** Display these as clickable links on the job details view.
*   **Acceptance Criteria:**
    *   Links to logs/artifacts are shown and are correct.
*   **Testing:** Manual verification.

---

This plan will be updated as development progresses and new details emerge.Tool output for `create_file_with_block`:
