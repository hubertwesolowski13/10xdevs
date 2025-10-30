# Wardrobe Assistant

A mobile + API project that helps users catalog their wardrobe and generate AI‑inspired outfit creations. The monorepo contains:

- `wardrobe-assistant/` — React Native (Expo) mobile app
- `wardrobe-assistant-api/` — NestJS API

---

## Table of Contents
- [1. Project name](#1-project-name)
- [2. Project description](#2-project-description)
- [3. Tech stack](#3-tech-stack)
- [4. Getting started locally](#4-getting-started-locally)
  - [4.1 Prerequisites](#41-prerequisites)
  - [4.2 Clone and install](#42-clone-and-install)
  - [4.3 Run the API (NestJS)](#43-run-the-api-nestjs)
  - [4.4 Run the mobile app (Expo)](#44-run-the-mobile-app-expo)
- [5. Available scripts](#5-available-scripts)
  - [5.1 API scripts](#51-api-scripts)
  - [5.2 Mobile app scripts](#52-mobile-app-scripts)
- [6. Project scope](#6-project-scope)
  - [6.1 In scope (MVP)](#61-in-scope-mvp)
  - [6.2 Out of scope (MVP)](#62-out-of-scope-mvp)
  - [6.3 User stories](#63-user-stories)
  - [6.4 Success metrics](#64-success-metrics)
- [7. Project status](#7-project-status)
- [8. License](#8-license)

---

## 1. Project name
Wardrobe Assistant

## 2. Project description
Wardrobe Assistant is a mobile application (Android/iOS via React Native + Expo) backed by a NestJS API. It allows users to:

- Register and log in
- Add, edit, and delete wardrobe items (categories: headwear [optional], top, bottom, shoes)
- Generate 3 AI‑inspired outfit proposals based on selected style (e.g., casual, elegant, beach, sexy), validating required wardrobe elements (top, bottom, shoes)
- Visualize generated outfits as PNGs and accept or reject them
- Save accepted creations to a personal collection and browse them later
- Manage account/profile settings and delete the account with confirmation

For details, see the Product Requirements Document (PRD): [./.ai/prd.md](./.ai/prd.md)

## 3. Tech stack
Core technologies used in this repository:

- Mobile app: React Native 0.81, React 19, Expo 54, Expo Router, React Navigation, Reanimated, Gesture Handler
- API: NestJS 11 (TypeScript), Express platform, RxJS
- Language & Tooling: TypeScript 5, Jest for testing, ESLint + Prettier

Additional background/analysis: [./.ai/tech-stack.md](./.ai/tech-stack.md)

Note: Future iterations may integrate services like Supabase (as considered in the tech stack analysis). Tailwind is part of the general guidelines, but it is not currently configured in the mobile app dependencies.

## 4. Getting started locally

### 4.1 Prerequisites
- Node.js LTS (recommended)
- npm or yarn
- Expo tooling for running the mobile app (Expo Go on device or emulators/simulators)

### 4.2 Clone and install
```bash
# clone
git clone git@github.com:hubertwesolowski13/10xdevs.git
cd 10xdevs

# install dependencies for each package
cd wardrobe-assistant-api && npm install
cd ../wardrobe-assistant && npm install
```

### 4.3 Run the API (NestJS)
From the `wardrobe-assistant-api/` directory:
```bash
# development (watch mode)
npm run start:dev

# production build and run
npm run build
npm run start:prod

# tests
npm test
npm run test:watch
npm run test:cov
```
The API will start using NestJS defaults (see scripts in `wardrobe-assistant-api/package.json`).

### 4.4 Run the mobile app (Expo)
From the `wardrobe-assistant/` directory:
```bash
# start the Expo dev server (choose a platform from the terminal UI)
npm start

# or target a specific platform
yarn android
# or
yarn ios
# or
yarn web
```
You can also use the equivalent npm scripts (`npm run android`, etc.). Ensure you have the necessary Android/iOS tooling installed or use Expo Go on a physical device.

## 5. Available scripts

### 5.1 API scripts
Defined in `wardrobe-assistant-api/package.json`:
- `build` — `nest build`
- `format` — Format sources with Prettier
- `start` — Start NestJS
- `start:dev` — Start with watch mode
- `start:debug` — Start with debug and watch
- `start:prod` — Run compiled app (`node dist/main`)
- `lint` — ESLint with fixes
- `test` — Run Jest tests
- `test:watch` — Run tests in watch mode
- `test:cov` — Coverage
- `test:debug` — Debug tests with inspector
- `test:e2e` — E2E tests (Jest config in `test/jest-e2e.json`)

### 5.2 Mobile app scripts
Defined in `wardrobe-assistant/package.json`:
- `start` — Start Expo dev server
- `reset-project` — Reset project via script
- `android` — Run on Android
- `ios` — Run on iOS
- `web` — Run on Web
- `lint` — Lint via Expo config

## 6. Project scope

### 6.1 In scope (MVP)
- User accounts with basic validation (email format, password confirmation)
- CRUD for wardrobe items with required categories (headwear optional; top, bottom, shoes required for generation)
- AI‑based outfit generation:
  - Validates presence of required categories
  - Style selection (e.g., casual, elegant, beach, sexy)
  - Generates 3 proposals with PNG visualizations and composition descriptions
- UX/UI:
  - Auth screens with immediate validation
  - Modals for adding wardrobe items and generating outfits
  - Wardrobe browser and accepted creations collection
- Account management: profile editing and account deletion with confirmation

### 6.2 Out of scope (MVP)
- Suggesting missing items to complete outfits
- Sharing outfits/wardrobe with other users
- Uploading custom images to replace generated graphics
- Planning future outfits or laundry reminders
- SSO (Single Sign-On) integration in the first version

### 6.3 User stories
Key user stories (see full details in the PRD):
- US‑001: Registration and login with validation
- US‑002: Add wardrobe items with category selection
- US‑003: Edit and delete wardrobe items
- US‑004: AI‑powered outfit generation (3 proposals, PNG, validation)
- US‑005: Accept and save chosen creation
- US‑006: Browse saved creations
- US‑007: Manage account (edit profile, delete account with confirmation)

### 6.4 Success metrics
- ≥ 70% of generated creations accepted and saved by users
- ≥ 60% of registered users active at least weekly
- Generation flow validates required items and shows clear messages on missing elements
- Responsive performance for adding items and generating outfits

## 7. Project status
- Monorepo initialized with separate mobile and API packages
- API version: `0.0.1` (license: MIT)
- Mobile app version: `1.0.0`
- Current phase: MVP in progress; features under active development

## 8. License
This project is licensed under the MIT License. See the license declaration in `wardrobe-assistant-api/package.json`. If a top‑level `LICENSE` file is added in the future, it will be the single source of truth.
