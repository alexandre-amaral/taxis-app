# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Taxis is an intelligent content aggregation platform that transforms digital content into a structured, verified daily briefing. The app uses AI to analyze, summarize, and verify news from RSS feeds based on user preferences.

**Tech Stack:** React 19, TypeScript, Vite, Firebase (Auth + Firestore), Google Gemini AI

**View in AI Studio:** https://ai.studio/apps/drive/1NUsdwOjJSKYGkojBXyKVyr18Der9StmV

## Development Commands

**Install dependencies:**
```bash
npm install
```

**Run development server:**
```bash
npm run dev
```
Server runs on http://localhost:3000

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## Environment Setup

Create `.env.local` with:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

The Gemini API key is accessed via `process.env.API_KEY` (configured in vite.config.ts).

## Architecture Overview

### Authentication Flow (App.tsx)

The app uses a **passwordless login system with 6-digit OTP codes** plus optional 2FA via SMS.

**Auth States** (defined in types.ts):
- `LOADING`: Initial state while checking auth
- `SIGNED_OUT`: User needs to sign in/up
- `ONBOARDING`: Authenticated user without preferences
- `SIGNED_IN`: Fully authenticated user with preferences

**Login Flow**:
1. User enters email → System generates 6-digit code
2. Code stored in Firestore (`authCodes` collection) with 5-minute expiry
3. Code sent via email (console.log in dev, email service in prod)
4. User enters code → System validates from Firestore
5. Anonymous auth created → User profile created in Firestore
6. Onboarding wizard → Feed access

**2FA Flow** (Optional):
- After login, user can enable 2FA via phone (SMS)
- Uses Firebase Multi-Factor Authentication with Phone provider
- Requires phone number verification with 6-digit code
- On subsequent logins, requires both email OTP and SMS code

**Files**:
- `App.tsx`: Auth state machine, OTP generation/verification
- `services/authCodeService.ts`: OTP generation, storage, validation, email sending
- `components/auth/AuthScreen.tsx`: Login UI with code input
- `components/auth/MfaScreen.tsx`: 2FA enrollment
- `components/auth/MfaVerificationScreen.tsx`: 2FA verification during login

See `AUTH_SETUP.md` for complete setup instructions.

### User Preferences System & Onboarding Flow

Users complete a 4-step onboarding wizard to configure their preferences:

**Step 1: Select Categories**
- Users select which top-level categories they want to follow (Technology, News, Politics, Finance, Science)
- Categories are toggled on/off via large clickable cards with visual feedback

**Step 2: Select Subcategories & Set Weights**
- For each selected category, users:
  1. Set an overall category weight (1-5)
  2. Select specific subcategories via checkboxes
  3. Set individual weights for each selected subcategory (1-5)
- **Subcategory Structure:**
  - Technology: AI & ML, Cybersecurity, Software Dev, Hardware, Startups, Cloud
  - News: World, Local, Breaking, Investigative, Human Interest, Environment
  - Politics: Domestic Policy, Intl Relations, Elections, Legislation, Geopolitics, Analysis, Foreign Affairs, Brazilian Politics
  - Finance: Stock Market, Crypto, Economics, Personal Finance, Corporate, Real Estate
  - Science: Space, Biology/Medicine, Physics/Chemistry, Research, Climate, Innovation
- **Validation:** Users must select at least one subcategory for each selected category to progress

**Step 3: Select Sources**
- Users choose specific RSS feeds from CONTENT_SOURCES constant grouped by category

**Step 4: Add Keywords**
- Comma-separated keywords for custom tracking (people, companies, topics)

**Data Structure:**
```typescript
categoryInterests[category] = {
  weight: number,              // Overall category priority (1-5)
  subcategories: {
    [subcategory]: { weight: number }  // Subcategory priority (1-5)
  }
}
```

These preferences are stored in Firestore at `users/{uid}` and drive feed personalization and AI analysis.

**Legacy Support:** Old `interests` object (flat category->weight map) is maintained for backwards compatibility.

### Content Aggregation (services/geminiService.ts)

**Feed Fetching:**
- `fetchFeeds()` uses CORS proxy (https://api.allorigins.win/raw) to fetch RSS feeds
- Parses XML using DOMParser
- Handles both RSS and Atom formats (item/entry, description/summary/content)
- Returns unified Article objects sorted by date

**AI Analysis:**
- `analyzeArticleContent()` uses Gemini 2.5 Flash with structured output (JSON schema)
- Returns: summary, generalRelevance (1-10), personalRelevance (calculated locally), factCheck (claims + verdicts), perspectives (multiple viewpoints)
- Personal relevance = base(3) + category weight + keyword match bonus (capped at 10)
- Uses low temperature (0.2) for consistent, factual analysis

### Component Structure

```
App.tsx (root state management)
├── AuthScreen (sign in/up with Google or email/password)
├── OnboardingWizard (3-step preference collection)
│   ├── InterestStep (category weight sliders)
│   ├── SourceStep (source selection by category)
│   └── KeywordStep (comma-separated keyword input)
└── Layout (signed-in app shell)
    └── Feed (article display + analysis)
        ├── ArticleCard (summary view with analyze button)
        └── ArticleDetailModal (full AI analysis display)
```

### Firebase Integration

Uses Firebase compat SDK (firebase/compat):
- **Auth:** Email/password + Google Sign-In
- **Firestore:** User documents at `users/{uid}` containing id, email, name, preferences

Pattern: `auth.onAuthStateChanged` listener syncs Firebase auth state → Firestore user doc → React state

### Data Types (types.ts)

Key interfaces:
- `User`: Firebase user with preferences
- `UserPreferences`: interests object, sources array, keywords array
- `Article`: RSS item with optional aiAnalysis
- `AIAnalysis`: Gemini response structure
- `ContentSource`: RSS feed definition (id, name, url, type, category)

### Content Sources (constants.ts)

Pre-configured RSS feeds organized by category:
- Technology: Hacker News, TechCrunch, The Verge, Ars Technica, Brazilian tech sources
- News: BBC, Reuters, AP, Brazilian news sources
- Politics: Politico, The Hill, Foreign Policy, Brazilian political sources
- Finance: Yahoo Finance, CoinDesk, InfoMoney
- Science: MIT Tech Review, ScienceDaily

Each source includes id, name, url (RSS feed), type ('rss'), category.

## TypeScript Configuration

- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx (React 19 automatic runtime)
- Path alias: `@/*` maps to project root
- Skip lib check enabled for faster builds

## Firebase Configuration Note

Firebase config with public API keys is exposed in firebaseConfig.ts. This is standard for Firebase client apps (API keys identify the project, security is enforced by Firebase Security Rules).

## Design System

The app uses a **cyberpunk-inspired aqua/teal glow aesthetic**:

### Color Palette
- **Primary:** `#00ffff` (cyan/aqua)
- **Success/Verified:** `#00ff88` (mint green)
- **Warning:** `#ffaa00` (amber)
- **Error:** `#ff5555` (red)
- **Background:** Gray-900, Gray-800, Gray-700
- **Text:** White, Gray-300, Gray-400

### Glow Effects (Subtle)
All interactive elements use subtle glow effects via `boxShadow`:
- **Buttons:** `0 0 12px rgba(0, 255, 255, 0.3)` base, `0 0 18px rgba(0, 255, 255, 0.4)` on hover
- **Cards:** `0 0 10px rgba(0, 255, 255, 0.03)` base, `0 0 15px rgba(0, 255, 255, 0.08)` on hover
- **Borders:** `1px solid rgba(0, 255, 255, 0.15-0.25)` with opacity variations
- **Inputs:** `0 0 6px rgba(0, 255, 255, 0.04)` base, `0 0 10px rgba(0, 255, 255, 0.12)` on focus
- **Modals:** `0 0 30px rgba(0, 255, 255, 0.12)` for emphasis
- Glow effects are intentionally subtle to avoid visual fatigue

### Component Styling Pattern
Components use inline styles for glow effects combined with Tailwind classes for layout:
```tsx
style={{
  backgroundColor: '#00ffff',
  boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
}}
```

Interactive states use `onMouseEnter`/`onMouseLeave` for glow intensity changes.
