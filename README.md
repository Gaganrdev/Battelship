# Battelship

A lightweight Battleship-style multiplayer game built with React/React Native.

## Summary

This repository contains a simple Battleship game intended for local development and collaborative contributions. It provides a playable board UI, per-cell components, and a networking layer for multiplayer (socket-based).

## Features

- Local board and cell components for game UI
- Basic socket-based networking (see `src/network/socket.ts`)
- Minimal, easy-to-read TypeScript + React codebase

## Tech / Tools

- TypeScript
- React / React Native (project contains `App.tsx` and `app.json`)
- Node.js / npm or yarn

## Quick Start

Prerequisites:

- Node.js (LTS recommended)
- npm or yarn

Install dependencies:

```bash
npm install
# or
yarn install
```

Start the app in development:

```bash
npm start
# or
yarn start
```

If this is a React Native / Expo project, run the platform-specific commands shown by the dev server (e.g. `npm run ios` / `npm run android` or use Expo).

## Project Structure

- `App.tsx` — app entry
- `index.ts` — web/native bootstrap
- `src/components/Board.tsx` — main board UI
- `src/components/Cell.tsx` — cell UI component
- `src/network/socket.ts` — socket/network helpers
- `src/screens/` — app screens (`HomeScreen`, `GameScreen`)

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Install dependencies and run the app locally
3. Make small, focused commits and push your branch
4. Open a pull request describing your changes

- Follow existing TypeScript and React patterns used in the code.
- If you modify network protocols, document changes in the code and PR description.

## Notes for Collaborators

- Socket implementation lives in `src/network/socket.ts` — check it first when working on multiplayer.
- UI components are small and composable; reuse `Cell` for grid cells.
- If you add scripts, update `package.json` and mention them in this README.

## License

Add a license file if you want this project publicly reusable (MIT recommended for open-source collaboration).

## Contact

If you have questions, open an issue or contact the repo owner.


