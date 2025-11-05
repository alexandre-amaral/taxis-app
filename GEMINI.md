# GEMINI.md

## Project Overview

This project is a web application that acts as a personal intelligence analyst. It allows users to create a personalized feed of articles from various sources, and then uses the Gemini API to provide in-depth analysis of those articles.

The application is built with a modern frontend stack:

*   **Framework:** React with TypeScript
*   **Build Tool:** Vite
*   **Authentication:** Firebase (Email/Password and Google Sign-In)
*   **Database:** Firestore (for user preferences)
*   **AI:** Google Generative AI (Gemini) for article analysis
*   **Styling:** The project appears to use a utility-first CSS framework like Tailwind CSS.

The core workflow for a user is:
1.  Sign up or log in.
2.  Complete an onboarding process to select their interests and keywords.
3.  View a personalized feed of articles fetched from their chosen RSS sources.
4.  Request an AI-powered analysis for any article, which provides a summary, relevance scores, fact-checking, and different perspectives.

## Building and Running

To run the application locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_gemini_api_key
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Other Scripts

*   **Build for Production:**
    ```bash
    npm run build
    ```
*   **Preview the Production Build:**
    ```bash
    npm run preview
    ```

## Development Conventions

*   **Component-Based Architecture:** The UI is built with React components, organized into directories by feature (`auth`, `core`, `onboarding`).
*   **TypeScript:** The entire codebase is written in TypeScript, with types defined in `types.ts`.
*   **Services:** External API interactions (like with the Gemini API) are handled in the `services` directory.
*   **Constants:** Application-wide constants, such as content sources and categories, are defined in `constants.ts`.
*   **Environment Variables:** The Vite configuration in `vite.config.ts` is set up to handle environment variables, making the Gemini API key available to the application.
*   **Path Aliases:** The project uses the `@` alias to refer to the root directory (`.`).
