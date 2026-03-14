# About this project

This project is a simple to-do application. It allows you to add a to-do, create groups to manage your to-dos with your friends, and manage your account.
It was developed by [Loïc](https://github.com/LoicE5), [Maxime](https://github.com/Mbourdon95) & [Valentin](https://github.com/ValReault) as part of a student project (awarded the highest grade).

## Stack

### Front-End
- TypeScript
- NextJS
- TailwindCSS

### Back-End
- Bun
- ExpressJS
- Sequelize
- Postgres
- Vercel

### Test
- Bun
- Bruno

# How to run the project

> **Prerequisite:** [Bun](https://bun.sh) must be installed. All scripts use `bun` instead of `npm`.

## Install dependencies (only once)

```sh
bun i
```

## Create a .env file for the server (only once)

```sh
cd server && cp .env.example .env
```

Set a `JWT_SECRET` and your Postgres credentials in the `.env` file.

Note: Use `127.0.0.1` instead of `localhost` (if applicable) to avoid connection issues.

## Scripts

All scripts are run from the project root with `bun run <script>`.

| Script | Description |
|---|---|
| `dev` | Start frontend and server in parallel (requires a running Postgres instance) |
| `dev:all` | Start frontend, server, **and** the Docker Compose database in parallel |
| `dev:server:db` | Start only the database via Docker, then the server (waits 3s for DB to be ready) |
| `dev:frontend` | Start only the Next.js frontend in dev mode |
| `dev:server` | Start only the Express server with hot reload via `bun --watch` |
| `build` | Build both frontend and server |
| `build:frontend` | Build only the Next.js frontend |
| `build:server` | Compile and build only the server |
| `lint:frontend` | Run ESLint on the frontend |
| `typecheck:server` | Run TypeScript type checking on the server (no emit) |
| `db` | Start the Postgres database via Docker Compose |

### Common workflows

**With an external Postgres instance already running:**
```sh
bun run dev
```

**With the bundled Docker Compose database:**
```sh
bun run dev:all
```

Then open your browser and head to `http://localhost:3000`.
