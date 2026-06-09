# Repository Guidelines

## Conceitos básicos do projeto
Este é um projeto para gerenciamento de palestras, onde usuários autenticados com perfil de Palestrante, poderão cadastrar videos de palestras e assistir vídeos de outros palestrantes.
Usuários com perfil Usuário, poderão assistir os vídeos dos palestrantes.

### Frontend
O frontend é construído em Angular

### Backend
O backend é construído em NestJs

### Banco de dados
O banco de dados é em Mysql e está sendo executado pelo Docker

## Project Structure & Module Organization

This repository has two independent TypeScript applications:

- `frontend/`: Angular app. Source lives in `frontend/src/`, app code in `frontend/src/app/`, global styles in `frontend/src/styles.scss`, and static assets in `frontend/public/`.
- `backend/`: NestJS API. Source lives in `backend/src/`; e2e tests and Jest e2e configuration live in `backend/test/`.

Each package has its own `package.json`, lockfile, TypeScript config, and commands. Run commands from the relevant package directory.

## Build, Test, and Development Commands

Frontend:

- `cd frontend && npm start`: start the Angular dev server.
- `cd frontend && npm run build`: create a production build.
- `cd frontend && npm run watch`: rebuild continuously for development.
- `cd frontend && npm test`: run Angular unit tests.

Backend:

- `cd backend && npm run start:dev`: start NestJS in watch mode.
- `cd backend && npm run build`: compile the API to `dist/`.
- `cd backend && npm run lint`: run ESLint with fixes.
- `cd backend && npm run format`: format TypeScript files with Prettier.
- `cd backend && npm test`: run unit tests.
- `cd backend && npm run test:e2e`: run e2e tests from `backend/test/`.
- `cd backend && npm run test:cov`: generate Jest coverage.

## Coding Style & Naming Conventions

Use TypeScript throughout. Follow existing Angular and NestJS conventions: Angular component files use `*.ts`, `*.html`, and `*.scss`; NestJS classes use names such as `AppController`, `AppService`, and `AppModule`. Keep tests beside source as `*.spec.ts` unless they are e2e tests under `backend/test/`.

Use 2-space indentation and single quotes, matching the current code. Backend formatting and linting are enforced by Prettier and ESLint.

## Testing Guidelines

Frontend tests use Angular's test builder. Backend unit tests use Jest with `ts-jest`; e2e tests use Jest plus Supertest. Add or update tests when changing behavior, especially controllers, services, routes, and UI rendering. Use `describe` for the unit and `it` for expected behavior.

## Commit & Pull Request Guidelines

This repository currently has no commit history, so use concise imperative commit messages such as `Add backend health endpoint` or `Fix frontend route config`. Keep commits focused.

Pull requests should include a short description, test commands run, linked issue or task when applicable, and screenshots for visible frontend changes.

## Security & Configuration Tips

Do not commit secrets, local environment files, or generated dependency directories such as `node_modules/`. Keep package-lock files committed when dependencies change.
