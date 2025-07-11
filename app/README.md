# BuildHive SaaS Application (Wasp-based)

This directory contains the main SaaS application for BuildHive, built using the [Wasp](https://wasp.sh/) framework and based on the [OpenSaaS.sh](https://opensaas.sh/) template. This application provides the user interface, authentication, user management, and dashboards for BuildHive.

For an overview of the entire BuildHive project, including other components like the Kotlin-based Coordinator and Agent, please see the [main project README.md](../README.md).

## Key Features Leveraged from Wasp/OpenSaaS

*   **Full-stack Development**: React frontend, Node.js backend, all within Wasp's declarative framework.
*   **Authentication**: Pre-built email/password and social OAuth (e.g., GitHub) integration.
*   **Database**: PostgreSQL with Prisma ORM, managed by Wasp.
*   **Styling**: TailwindCSS with components from the OpenSaaS template.
*   **Deployment**: Simplified deployment options via Wasp CLI.

## Development Workflow

### Prerequisites

*   Node.js and npm (or yarn)
*   [Wasp CLI installed](https://wasp.sh/docs/quick-start#1-install-wasp)

### Running Locally

1.  **Navigate to the app directory:**
    ```bash
    cd app
    # If you are in the project root
    ```

2.  **Set up Environment Variables:**
    *   Create `.env.client` from `.env.client.example`:
        ```bash
        cp .env.client.example .env.client
        ```
        Fill in any client-specific API keys or configurations. For local development, defaults might be sufficient.
    *   Create `.env.server` from `.env.server.example`:
        ```bash
        cp .env.server.example .env.server
        ```
        **Crucial:** Configure your development database URL (e.g., `DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"`).
        Update other server-side settings like email provider details, payment gateway keys (if applicable for future features), etc.

3.  **Install Project Dependencies:**
    Wasp handles its core dependencies. If you've added specific frontend or backend NPM packages directly, ensure they are installed:
    ```bash
    npm install
    # or yarn install
    ```
    *(Typically, Wasp manages this when you run `wasp start` for the first time after adding new dependencies to `main.wasp` or `package.json`)*

4.  **Start the Development Database:**
    In a dedicated terminal, run:
    ```bash
    wasp start db
    ```
    Leave this running. This command starts a PostgreSQL database instance in a Docker container, as configured by Wasp.

5.  **Run Database Migrations:**
    If this is your first time setting up the project, or if you have made changes to the `schema.prisma` file (which defines your database schema), run:
    ```bash
    wasp db migrate-dev
    ```
    This will apply any pending database schema changes. You'll be prompted to name your migration.

6.  **Start the Wasp Development Server:**
    In another dedicated terminal, run:
    ```bash
    wasp start
    ```
    This will compile your project, start the frontend and backend servers, and watch for file changes.
    The application will typically be available at `http://localhost:3000`.

### Common Development Tasks

*   **Defining Entities (Database Models):** Edit `schema.prisma`. After changes, run `wasp db migrate-dev`.
*   **Creating Pages:** Define `route` and `page` in `main.wasp`. Create the corresponding React component in `src/`.
*   **Backend Logic (Queries & Actions):**
    *   Define `query` or `action` in `main.wasp`.
    *   Implement the corresponding JavaScript/TypeScript function in `src/server/` (for queries/actions) or `src/` (for operations used by both client/server, though server-only is more common for direct DB access).
*   **Frontend Components:** Create React components in `src/` (e.g., `src/client/components/`).
*   **Styling:** Use TailwindCSS classes directly in your components. Global styles can be adjusted in `src/client/Main.css`.

## Project Structure within `app/`

*   `main.wasp`: The core Wasp configuration file. Defines routes, pages, entities, queries, actions, jobs, etc.
*   `schema.prisma`: Prisma schema file for defining database models.
*   `package.json`: Node.js project file, lists dependencies.
*   `src/`:
    *   `client/`: Frontend code (React pages, components).
        *   `App.tsx`: Main React app component.
        *   `Main.css`: Global CSS styles.
    *   `server/`: Backend code (Node.js queries, actions, jobs).
    *   `shared/`: Code that can be shared between frontend and backend.
    *   Other directories for specific features (e.g., `auth/`, `admin/`, `payment/`).
*   `public/`: Static assets (images, fonts, favicon).
*   `.env.client`, `.env.server`: Environment variable files (ignored by Git).
*   `.env.client.example`, `.env.server.example`: Example environment variable files.

## Testing

Refer to the main project's `TESTING.md` (once created) for overall testing strategies. For Wasp-specific testing:
*   **Unit Tests**: Use Vitest (configured by Wasp) for testing queries, actions, and utility functions.
*   **Integration Tests**: Can be written to test interactions between different parts of the Wasp application.
*   **End-to-End Tests**: Playwright is recommended for testing UI flows.

To run tests (ensure Vitest is set up in `package.json` scripts):
```bash
npm test
# or yarn test
```

For more detailed guidance on Wasp development, refer to the [official Wasp documentation](https://wasp.sh/docs).
