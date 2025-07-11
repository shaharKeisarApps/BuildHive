# BuildHive Testing Strategy & Guidelines

Effective testing is crucial for ensuring the reliability, stability, and quality of BuildHive. This document outlines the testing strategies, types of tests, tools, and best practices to be followed.

## Guiding Principles

*   **Test Early, Test Often:** Integrate testing throughout the development lifecycle.
*   **Automate What Matters:** Prioritize automation for repetitive and critical tests.
*   **Aim for High Coverage:** Strive for good test coverage, especially for critical business logic and API endpoints.
*   **Tests as Documentation:** Well-written tests can serve as examples of how components are intended to be used.
*   **Maintainability:** Write clear, concise, and maintainable tests.

## Types of Tests

### 1. Unit Tests

*   **Goal:** Verify the functionality of individual, isolated units of code (e.g., functions, methods, classes).
*   **Scope:** Smallest testable part of an application. Dependencies are typically mocked or stubbed.
*   **Tools:**
    *   **Kotlin (Coordinator, Agent):**
        *   [JUnit 5](https://junit.org/junit5/): Standard testing framework for Java/Kotlin.
        *   [MockK](https://mockk.io/): Mocking library for Kotlin.
        *   [AssertJ](https://assertj.github.io/doc/) or [Kluent](https://kluent.io/): Fluent assertion libraries.
    *   **Wasp (SaaS App - Node.js backend, React frontend):**
        *   [Vitest](https://vitest.dev/): Default testing framework for Wasp projects. Suitable for backend (queries, actions) and frontend (React components, hooks) unit tests.
        *   [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/): For testing React components by interacting with them as a user would.
*   **Location:** Typically within the same module/package as the code under test (e.g., `src/test/kotlin` for Kotlin, `src/**/*.test.ts` or `src/**/*.test.tsx` for Wasp/JS/TS).
*   **When to Write:** As you develop new functions/classes or fix bugs. Ideal for Test-Driven Development (TDD).

### 2. Integration Tests

*   **Goal:** Verify the interaction between different components or services of the application.
*   **Scope:** Testing modules together, interactions with databases, message queues, or external APIs.
*   **Tools:**
    *   **Kotlin (Coordinator):**
        *   JUnit 5 with Ktor's `testApplication` for API endpoint testing.
        *   [Testcontainers](https://www.testcontainers.org/): For running real dependencies (like PostgreSQL, Redis) in Docker containers during tests.
    *   **Wasp (SaaS App):**
        *   Vitest can be used for backend integration tests (e.g., testing an action that interacts with the database).
        *   Wasp might provide utilities for testing queries/actions in a more integrated way (check Wasp documentation).
*   **Location:** Often in separate test modules or specific integration test source sets.
*   **When to Write:** After unit tests are in place for individual components, to ensure they work together correctly.

### 3. End-to-End (E2E) Tests

*   **Goal:** Verify the entire application flow from the user's perspective, across all integrated services.
*   **Scope:** Simulates real user scenarios, interacting with the UI and traversing through different application layers.
*   **Tools:**
    *   [Playwright](https://playwright.dev/): Recommended for testing the Wasp web application. Can also be used for testing the CI plugin's interaction if it involves web UIs or browser automation.
    *   Custom scripts (Bash, Python) for testing CLI interactions (e.g., Agent CLI with Coordinator).
*   **Location:** Typically in a separate test project or directory (e.g., `e2e-tests/`). The existing `e2e-tests/` directory seems set up for Playwright.
*   **When to Write:** For critical user flows and features to ensure the whole system functions as expected. These are generally slower and more brittle, so focus on key scenarios.

## Testing Strategy by Component

### Wasp Application (`app/`)

*   **Frontend (React):**
    *   Unit tests for complex components and hooks using Vitest and React Testing Library.
    *   Snapshot tests for UI components where appropriate (use with caution, can be brittle).
*   **Backend (Queries, Actions, Jobs):**
    *   Unit tests for business logic within queries/actions using Vitest, mocking external dependencies (like database or third-party APIs) where necessary.
    *   Integration tests for queries/actions that interact with the Prisma client and a test database.
*   **E2E Tests:**
    *   Use Playwright (as set up in `e2e-tests/`) to test user flows like authentication, page navigation, form submissions, and viewing data on admin dashboards.

### Ktor Coordinator (`coordinator/`)

*   **API Endpoints:** Integration tests using Ktor's `testApplication` to send HTTP requests and verify responses.
*   **Service Layer:** Unit tests for business logic in services, mocking database or queue interactions (MockK).
*   **Database Interactions:** Integration tests using Testcontainers to spin up a real PostgreSQL instance.
*   **Queue Interactions:** Integration tests using Testcontainers for Redis/RabbitMQ.

### Kotlin Native Agent (`agent/`)

*   **CLI Commands/Logic:** Unit tests for core functions and logic.
*   **API Client:** Unit tests for the client that communicates with the Coordinator, mocking HTTP responses.
*   **Task Execution:**
    *   Unit tests for parsing job definitions and preparing for execution.
    *   Integration tests for Docker interaction (if feasible, or mock Docker CLI/API calls).
*   **E2E (Manual/Scripted):** Testing the agent's full lifecycle: registration, heartbeat, job fetching, dummy execution, status updates against a running Coordinator.

### CI Plugin (`ci-plugin/`)

*   **Action Logic (Scripts):** Unit tests for shell scripts or JavaScript code if used.
*   **Integration with BuildHive Coordinator:** E2E tests where a sample GitHub Actions workflow uses the plugin to submit a job to a test instance of the BuildHive Coordinator and verifies the outcome.
*   **Packaging/Artifact Logic:** Tests to ensure correct packaging of context and handling of artifacts.

## Test Execution

*   **Locally:** Developers should run relevant tests locally before pushing code.
    *   Wasp: `npm test` or `yarn test` in the `app/` directory.
    *   Kotlin: `./gradlew test` or `./gradlew :<module-name>:test` in the `coordinator/` or `agent/` directories.
    *   E2E: `npx playwright test` in the `e2e-tests/` directory.
*   **CI Pipeline:** All tests (unit, integration, E2E) should be automated and run in the CI pipeline for every pull request and merge to the main branch.

## Test Coverage

*   While aiming for a specific percentage isn't always the best metric, strive for comprehensive coverage of:
    *   Critical business logic.
    *   API endpoints and their various response codes/scenarios.
    *   Authentication and authorization paths.
    *   Core user flows.
*   Use coverage tools (e.g., JaCoCo for Kotlin, Vitest's built-in coverage for JS/TS) to identify untested parts of the codebase.

## Best Practices

*   **Write Clear and Descriptive Test Names:** Test names should clearly state what they are testing and the expected outcome.
*   **Arrange, Act, Assert (AAA):** Structure your tests clearly.
    *   **Arrange:** Set up the test conditions and inputs.
    *   **Act:** Execute the code under test.
    *   **Assert:** Verify the outcome is as expected.
*   **Keep Tests Independent:** Tests should not depend on each other or the order of execution. Each test should set up its own state and clean up if necessary.
*   **Test One Thing at a Time:** Each test case should ideally verify a single piece of behavior or functionality.
*   **Mock Dependencies Appropriately:** Mock external services, system time, or other volatile dependencies in unit tests. Use real dependencies for integration tests where appropriate (e.g., with Testcontainers).
*   **Avoid Testing Implementation Details:** Focus on testing the public API/behavior of your units/components, not their internal workings. This makes tests less brittle to refactoring.
*   **Regularly Review and Refactor Tests:** Just like production code, tests should be maintained and improved over time. Remove obsolete tests.

This document serves as a starting point and should be adapted as the BuildHive project evolves.Tool output for `create_file_with_block`:
