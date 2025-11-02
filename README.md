
# Wardrobe Assistant — Mobile App for AI‑Generated Outfit Creations

[![Node.js 24.x](https://img.shields.io/badge/Node-24.11.0-339933?logo=node.js&logoColor=white)](./.nvmrc)
[![pnpm 9](https://img.shields.io/badge/pnpm-9.12.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Expo](https://img.shields.io/badge/Expo-~54.0-blue?logo=expo&logoColor=white)](https://docs.expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)

A React Native (Expo) mobile application that helps users manage their wardrobe and generate inspiring outfit creations using AI. Users can add and organize wardrobe items, pick a style, receive three AI‑generated outfit proposals with PNG visuals, accept or reject proposals, and save accepted creations to their personal collection.

## Table of Contents
- [1. Project name](#1-project-name)
- [2. Project description](#2-project-description)
- [3. Tech stack](#3-tech-stack)
- [4. Getting started locally](#4-getting-started-locally)
- [5. Available scripts](#5-available-scripts)
- [6. Project scope](#6-project-scope)
- [7. Project status](#7-project-status)
- [8. License](#8-license)

## 1. Project name
Wardrobe Assistant

## 2. Project description
Wardrobe Assistant is a mobile app that makes it easy to catalog your wardrobe and compose cohesive outfits. Using AI, the app proposes three outfit options tailored to a chosen style (e.g., casual, elegant, beach, sexy), and visualizes them as PNG images. You can accept or reject proposals and build a collection of your favorite creations.

Primary user problems addressed:
- Difficulty composing color‑cohesive, stylistically consistent outfits from existing clothing.
- Repetition and decision fatigue when selecting daily outfits.

Key capabilities:
- Account system with basic validation (email format, password confirmation).
- Wardrobe CRUD with categories: headwear (optional), top, bottom, shoes.
- AI‑powered outfit generation: ensures required categories exist, returns 3 PNG visuals per chosen style.
- Save accepted creations and browse your collection.
- Account management: edit profile or delete account with confirmation.

For the detailed PRD, see: ./.ai/prd.md

## 3. Tech stack
Current mobile app:
- Expo ~54, React 19.1.0, React Native 0.81.5
- TypeScript ~5.9
- expo-router, React Navigation
- Tooling: ESLint 9, Prettier 3, Husky

Planned/platform components (per tech stack document):
- UI: gluestack‑ui, Tailwind CSS
- Backend: Supabase (Postgres, REST, SDKs, built‑in auth)
- AI: OpenRouter (access to multiple model providers; budgeting controls)
- CI/CD: GitHub Actions
- Hosting: DigitalOcean via Docker image

For the tech stack rationale, see: ./.ai/tech-stack.md

## 4. Getting started locally
Prerequisites:
- Node.js 24.11.0 (see .nvmrc)
- pnpm 9.12.0 (declared in package.json via packageManager)
- Android Studio and/or Xcode for device simulators (optional but recommended)

Setup:
1) Install Node 24.11.0 and set it as current (using nvm):
```bash
nvm use
```
2) Install pnpm if you don’t have it:
```bash
npm i -g pnpm@9.12.0
```
3) Install dependencies:
```bash
pnpm install
```
4) Start the app (choose one target):
```bash
pnpm start        # Expo Dev Tools
pnpm android      # Launch on Android
pnpm ios          # Launch on iOS
pnpm web          # Launch on web
```

Notes:
- On first run, Expo may prompt to install the Expo Go app on your device or to start a simulator.
- No environment variables are required for basic UI development at this stage. Supabase and AI (OpenRouter) configuration will be introduced in subsequent iterations.

## 5. Available scripts
Defined in package.json:
- start: `expo start` — starts the Expo development server.
- android: `expo start --android` — opens or deploys to an Android emulator/device.
- ios: `expo start --ios` — opens or deploys to an iOS simulator/device.
- web: `expo start --web` — runs the app in a web browser using React Native Web.
- lint: `expo lint` — runs ESLint checks.
- lint:fix: `expo lint --fix` — attempts to automatically fix lint issues.
- format: `prettier --write` — formats codebase with Prettier using .prettierrc.
- format:check: `prettier --check` — checks formatting without writing changes.
- reset-project: `node ./scripts/reset-project.js` — utility script to clean/reset local project state.

Package manager and engines:
- Package manager: pnpm@9.12.0
- Node version: 24.11.0 (see .nvmrc)

## 6. Project scope
In scope (MVP):
- Authentication: registration and login with basic validation; password reset flow in login form.
- Wardrobe management: add, view, edit, delete items; each item must have one category (headwear optional, top, bottom, shoes).
- AI outfit generation:
  - Validates presence of required categories (top, bottom, shoes).
  - User selects a style (casual, elegant, beach, sexy).
  - Returns 3 outfit proposals with PNG visuals and composition descriptions.
  - Accept or reject each proposal; accepted proposals are saved to the user’s collection.
- Collections: browse saved creations with visuals and style metadata.
- Account management: edit profile; delete account with confirmation.

Out of scope (MVP):
- Suggesting wardrobe additions when items are missing.
- Sharing outfits or wardrobes with other users.
- Uploading photos to replace AI visuals or augment creations.
- Planning future outfits or sending reminders (e.g., laundry).
- SSO integration (standard login used initially).

## 7. Project status
- Status: MVP in progress for the mobile app. Backend (Supabase) and AI integration (OpenRouter) will be added in subsequent milestones.
- Success metrics (targets from PRD):
  - ≥ 70% of generated creations accepted and saved by users.
  - ≥ 60% of registered users use the app at least weekly.
  - Generation flow validates required items and provides clear feedback when missing.
  - Core flows (add items, generate outfits) remain fast and fluid.

References:
- Product Requirements Document (PRD): ./.ai/prd.md
- Tech Stack notes: ./.ai/tech-stack.md

## 8. License
License: To be determined. If you intend to open‑source, add a LICENSE file (e.g., MIT). If the project remains private, specify the appropriate proprietary license.
