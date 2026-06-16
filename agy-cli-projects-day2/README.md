# Pour-Over Portal & Coffee Diary (`agy-cli-projects-day2`)

A premium, responsive dark-themed Single Page Application (SPA) designed to help coffee enthusiasts discover manual brewing resources and log their daily hand-drip coffee extraction experiments.

---

## 1. Project Overview

This project serves two primary functions:
1.  **Resources & News Feed**: Dynamically fetches and parses a curated markdown collection (`pour_over_resources.md`) containing communities, blogs, YouTube tutorials, and competitive trends. Includes real-time client-side search, language filters, and sorting by home applicability.
2.  **Personal Coffee Diary**: A complete client-side extraction log tracking bean names, roasters, devices (V60, Aeropress, Origami, etc.), weight ratios, water temperature, and extraction times. Each log includes a **custom-rendered SVG radar chart** displaying its sweetness, acidity, bitterness, body, and finish profile.

---

## 2. Technology Stack & Architecture

*   **Core Logic**: Vanilla JavaScript (ES6 Modules) for responsive UI bindings and State Management.
*   **Structure**: Semantic, accessible HTML5 (`<header>`, `<main>`, `<section>`, `<article>`, `<dialog>`).
*   **Styling**: Custom Vanilla CSS featuring HSL custom color properties, glassmorphism, glowing orbs, animated skeleton states, and custom range sliders.
*   **Storage**: Client-side `localStorage` (highly private, fast, offline-first). Includes JSON Import/Export backup files.
*   **Dev Server & Bundling**: Vite v8.
*   **Visualizations**: Canvas-free, inline SVGs generated dynamically inside JavaScript for lightweight flavor-profile radar charts.

---

## 3. Directory Structure

```text
agy-cli-projects-day2/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images & SVGs
│   ├── main.js             # Core App logic (Fetchers, Parsers, Diary logs, SVGs)
│   └── style.css           # Styling theme system (Dark HSL, Skeletons, Modals)
├── index.html              # Main HTML entry point & SEO meta definitions
├── package.json            # Node project configuration
├── vite.config.js          # Vite config (includes sibling asset server middleware)
└── README.md               # Project documentation & session log (this file)
```

---

## 4. Getting Started

### Prerequisites
*   Node.js version **>= 18.0.0** (Node v20 or v22 is recommended). 

### Installation
From the project directory:
```bash
npm install
```

### Run Development Server
Start the local server (intercepts and serves sibling directory's markdown files dynamically):
```bash
npm run dev
```

### Build for Production
Compiles the application into highly optimized HTML, CSS, and JS assets in the `dist/` directory:
```bash
npm run build
```

---

## 5. Implementation Journey & Session Log

### Workflow & Phases
*   **Phase 1: Spec & Design**: Drawn out the application's overall data flow using Mermaid diagrams, defining boundary components between the client-side parser, `localStorage`, and the scheduled news agent.
*   **Phase 2: Project Scaffold**: Initialized Vite Vanilla JS template. Configured a custom middleware plugin inside `vite.config.js` to serve resources outside the Vite project root, solving local development file-system access constraints.
*   **Phase 3: Coding Layout & Logic**:
    *   Wrote search input structures, modal dialog sections, and stats layouts.
    *   Wrote the Markdown State Machine Parser to extract language headers, categories, titles, types, and descriptions line-by-line.
    *   Wrote local CRUD diary state methods, including star ratings, automatic dose ratio calculations, and backup export/restore options.
    *   Implemented inline SVG radar chart calculation logic mapping sensory inputs to angles.
*   **Phase 4: UI Refinement & Polish**: Focused strictly on current UI elements to elevate visual style. Customized default browser scrollbars, replaced the plain loader spinner with shimmer loading skeletons, styled range slider components, and optimized responsiveness for mobile.
*   **Phase 5: Verification & Code Review**: Conducted code space checks from four different viewpoints and verified error-free builds.

### Validation Guidelines Followed
*   **Spec Stage**: Created a Mermaid data flow diagram detailing how updates from background agents propagate to the browser client.
*   **Planning Stage**: Used itemized, summarized checklists instead of long-form paragraphs to specify features, styles, and development rationales.
*   **Code Review Stage**: Defined and completed a checklist evaluating the codebase from 4 perspectives: Functional Correctness, Code Cleanliness & Architecture, Performance & Modern Standards, and Accessibility & UX.

### Relevant Skills Used
*   **`modern-web-guidance`**: Searched local guidelines to implement modern overlay controls, dynamic backdrops, native `<dialog>` toggle attributes, and standard `:popover-open` classes.
*   **Environment Troubleshooting**: Resolved a Node version conflict (terminal running default Node v16, throwing `CustomEvent is not defined` under Vite v8) by mapping NVM PATH pointers to Node v22 during build tests and shell guidelines.
