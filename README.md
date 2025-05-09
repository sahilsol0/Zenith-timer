# Zenith Timer

This is a Next.js application called Zenith Timer, designed to help users manage their time effectively with customizable timer sequences. It's perfect for work, study, exercise, and mindfulness.

## Features

-   **Customizable Timers:** Create and save timer configurations tailored to your needs.
-   **Pre-built Templates:** Start quickly with templates like the "20-20-20 Eye Relief" rule or a "Quick Full Body Workout".
-   **Global Timer Bar:** Keep track of your active timer from any page in the app.
-   **Theme Customization:** Personalize the app's appearance with different color palettes and light/dark modes.
-   **Responsive Design:** Works seamlessly on desktop and mobile devices.
-   **Sound Notifications:** Get audible alerts for timer events (can be toggled).

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sahilsol0/Zenith-timer.git
    cd Zenith-timer
    ```

2.  **Install dependencies:**
    ```bash
    npm ci
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:9002](http://localhost:9002) (or the port specified in your `package.json`) in your browser to see the application.

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

1.  **Push to `main` branch:**
    Whenever you push commits to the `main` branch of your GitHub repository, the GitHub Actions workflow defined in `.github/workflows/deploy.yml` will automatically:
    *   Build the Next.js application for static export.
    *   Deploy the built site to the `gh-pages` branch.

2.  **GitHub Pages Configuration:**
    *   Ensure GitHub Pages is enabled for your repository.
    *   Go to your repository settings: `Settings` > `Pages`.
    *   Under "Build and deployment", set the "Source" to "Deploy from a branch".
    *   Set the "Branch" to `gh-pages` and the folder to `/(root)`. Click "Save".

3.  **Accessing the Deployed Site:**
    Once the workflow completes successfully, your site will be available at:
    [https://sahilsol0.github.io/Zenith-timer/](https://sahilsol0.github.io/Zenith-timer/)

## Project Structure

-   `src/app/`: Contains the main application pages and layouts (using Next.js App Router).
-   `src/components/`: Reusable UI components.
    -   `src/components/ui/`: ShadCN UI components.
    -   `src/components/layout/`: Layout-specific components like Header, Footer, AppShell.
-   `src/contexts/`: React Context providers (e.g., `TimerContext`, `ThemeContext`).
-   `src/hooks/`: Custom React hooks (e.g., `useTimer`, `useMobile`).
-   `src/lib/`: Utility functions, constants, type definitions, and theme configurations.
-   `src/ai/`: Genkit related files (if GenAI features are implemented).
-   `public/`: Static assets.
-   `next.config.ts`: Next.js configuration, including settings for GitHub Pages deployment.
-   `.github/workflows/deploy.yml`: GitHub Actions workflow for CI/CD.

## Customization

-   **Timer Templates:** Modify or add new templates in `src/lib/constants.ts`.
-   **Themes:**
    *   Adjust color palettes in `src/lib/themes.ts`.
    *   Modify base CSS variables in `src/app/globals.css`.
    *   The theme can be changed in the app via the Settings page.

## Technologies Used

-   Next.js (App Router)
-   React
-   TypeScript
-   Tailwind CSS
-   ShadCN UI
-   Lucide React (Icons)
-   Genkit (for potential AI features)
-   GitHub Actions (for CI/CD)
