# Homemade Native Engineering Challenge

A production-quality Expo React Native app for Homemade's recipe substitution flow. The app models a family cooking a hospital-approved recipe, realizing they are missing heavy cream, and using a native text-first assistant to choose a safe substitute while preserving low-fat, low-sodium, and gluten-free guidance.

## Tech Stack

- Expo SDK 57
- React Native 0.86
- TypeScript
- Expo Router
- React Native Reanimated 4.5, which is the Expo SDK 57-compatible successor to the requested Reanimated 3 line
- React Native Gesture Handler
- React Native Skia
- Expo Haptics
- Expo Blur
- React Native SVG
- React Native Safe Area Context
- FlashList
- Zustand

No UI component library is used. The interface is built from native React Native components and small Homemade-specific primitives.

## Run Locally

```bash
npm install
npm run start
```

Then open the app in Expo Go, an iOS simulator, or an Android emulator.

Platform shortcuts:

```bash
npm run ios
npm run android
```

## iOS Simulator Dev Client

Expo Go is preferred when the installed Expo Go version supports the project SDK. If Expo Go is too old or a native module is unavailable, use a development build:

```bash
npx expo install expo-dev-client
npm run start -- --port 8082
npx expo run:ios -d "iPhone 16e" -p 8082
```

For an already-running Metro server on 8082, keep it running and use:

```bash
npx expo run:ios -d "iPhone 16e" -p 8082
```

This project includes a `postinstall` patch for `expo-modules-jsi` Swift runtime references. On the current Xcode toolchain, those weak runtime references must be mutable and marked `nonisolated(unsafe)` for the dev-client build to compile.

Type-check:

```bash
npm run typecheck
```

## What Was Built

- A polished native recipe screen with story, timing, servings, dietary tags, ingredients, and steps.
- A tactile heavy cream swap action with haptic feedback.
- A bottom-sheet assistant using Reanimated springs and Gesture Handler drag-to-close.
- Locally simulated LLM-style substitution guidance.
- A visible before/after ingredient update after selecting a substitute.
- A safety banner explaining that substitutions respect dietary constraints.
- A simulated SMS reminder preview.
- Lightweight partner insights.
- HIPAA-adjacent trust copy.
- A subtle founder-mode engineering note.
- Light-primary design with dark mode support.

## Architecture

```text
app/              Expo Router entry points
components/       Reusable native primitives and recipe UI
features/         Recipe feature composition and data
hooks/            Theme hooks
lib/              Pure substitution helpers
services/         Simulated assistant boundary
store/            Zustand app state
theme/            Design tokens
types/            Shared TypeScript models
utils/            Reserved for small shared helpers
assets/           Static assets
```

The recipe screen is rendered as a sectioned FlashList for predictable performance on lower-end Android devices. Business logic is kept outside presentation components so the local simulation can be replaced cleanly.

## Simulated LLM Substitution

The assistant is deterministic and local. Recipe data lives in `features/recipe/data/homemadeRecipe.ts`, pure substitution helpers live in `lib/substitution.ts`, and the assistant boundary lives in `services/assistantService.ts`.

The configured missing ingredient is `heavy cream`. The demo offers:

- Greek yogurt + splash of milk
- Evaporated skim milk
- Blended silken tofu

Each option includes why it works, dietary fit, taste or texture tradeoff, and a confidence label. Selecting an option updates Zustand state, animates the ingredient row, and shows the safety banner.

## Production Integration Path

- Claude: replace `requestSubstitutions()` with a structured prompt and validated JSON response.
- Twilio: send the SMS preview through a consent-aware nudge loop.
- AWS Lambda/API Gateway: expose substitution and messaging endpoints.
- DynamoDB: store household preferences, pantry signals, and selected substitutions.
- Partner rules: configure approved swaps and nutrition thresholds by healthcare, government, or community partner.
- CI/CD: run type checks, Expo prebuild validation, and device smoke tests on every pull request.

## HIPAA-Adjacent Design Considerations

- This demo does not require HIPAA-protected data.
- Dietary constraints are handled as product preferences rather than diagnoses.
- Partner nutrition rules can be applied without storing PHI.
- Medical nutrition parameters should support human review and partner approval before production use.
- A real deployment would need consent, audit logging, data retention rules, access controls, and partner-specific review workflows.

## Future Roadmap

- Partner rule editor for approved swaps and sodium/fat thresholds.
- Household pantry memory and consent-controlled preference storage.
- SMS reply loop for "I have this, not that" cooking moments.
- Offline-friendly recipe cards for low-connectivity settings.
- Native screen transition polish across recipe, pantry, and assistant history.
- Human review queue for clinically sensitive substitutions.
