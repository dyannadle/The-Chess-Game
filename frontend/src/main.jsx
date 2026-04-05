// PURPOSE: React application entry point — bootstraps the entire frontend.
// IMPACT: This is the FIRST JavaScript that runs. It mounts the React component tree into the DOM.
//         Without this file, nothing renders — the page would be a blank white screen.
// ALTERNATIVE: Use Next.js's _app.js for server-side rendering entry point.

// PURPOSE: Imports the React library — required for JSX syntax transformation.
// IMPACT: JSX like <App /> is compiled to React.createElement(App, null) calls by Vite/Babel.
// ALTERNATIVE: import { createElement } from 'react' — use createElement() directly without JSX (verbose).
import React from 'react'

// PURPOSE: Imports ReactDOM — the package that bridges React components with the browser's DOM.
// IMPACT: Provides createRoot() for React 18's concurrent rendering mode.
// ALTERNATIVE: ReactDOM.render() (legacy React 17 API — synchronous, no concurrent features).
import ReactDOM from 'react-dom/client'

// PURPOSE: Imports HelmetProvider from react-helmet-async — wraps the app to enable dynamic <head> management.
// IMPACT: Allows components to set page titles, meta tags, etc. using <Helmet> (currently not used in components).
//         The "async" variant is required for SSR compatibility and avoids stale data in concurrent mode.
// ALTERNATIVE: react-helmet (original, but doesn't support React 18 concurrent mode properly).
//              Document.title = '...' for simple title changes without a library.
import { HelmetProvider } from 'react-helmet-async'

// PURPOSE: Imports the root App component — the main application shell containing all pages and routing.
// IMPACT: App.jsx renders the sidebar, auth screen, game board, history, training, and setup modal.
import App from './App.jsx'

// PURPOSE: Imports the global CSS stylesheet — defines all visual styles for the application.
// IMPACT: Loaded as a side-effect import — Vite injects these styles into the document's <head> as <style> tags.
//         Contains: color scheme, layout, buttons, chat, auth, chess board, animations, etc.
// ALTERNATIVE: CSS Modules for component-scoped styles, or styled-components for CSS-in-JS.
import './index.css'

// PURPOSE: try-catch wraps the mount operation to gracefully handle critical startup failures.
// IMPACT: If React fails to mount (e.g., missing #root element, incompatible browser), the error is logged
//         to the console instead of crashing silently.
// ALTERNATIVE: Use an Error Boundary component (but those can't catch errors during initial render/mount).
try {
  // PURPOSE: Creates a React 18 concurrent root at the #root DOM element (defined in index.html).
  // IMPACT: document.getElementById('root') finds the <div id="root"> in index.html.
  //         createRoot() enables React 18 features: concurrent rendering, automatic batching, transitions.
  //         .render() triggers the initial render of the component tree.
  // ALTERNATIVE: ReactDOM.render(<App />, document.getElementById('root')) — React 17 synchronous API.
  ReactDOM.createRoot(document.getElementById('root')).render(
    // PURPOSE: React.StrictMode enables additional development-time checks and warnings.
    // IMPACT: In development: double-renders components to detect side effects, warns about deprecated APIs.
    //         In production: StrictMode has NO effect — it's completely stripped out.
    //         Double-rendering may cause useEffect to fire twice (expected — tests for cleanup correctness).
    // ALTERNATIVE: Remove StrictMode for simpler dev behavior (but lose the safety checks).
    <React.StrictMode>
      {/* PURPOSE: HelmetProvider wraps the app to enable react-helmet-async's context. */}
      {/* IMPACT: Any descendant component can use <Helmet> to dynamically set <title>, <meta>, etc. */}
      {/* ALTERNATIVE: Remove if not using react-helmet features (currently not used in any component). */}
      <HelmetProvider>
        {/* PURPOSE: Renders the main App component — the root of the entire UI. */}
        {/* IMPACT: App contains authentication, navigation, game board, history, training — everything. */}
        <App />
      </HelmetProvider>
    </React.StrictMode>
  )
// PURPOSE: Catches any error during React initialization and logs it.
} catch (error) {
  // PURPOSE: Logs the fatal error to the browser console.
  // IMPACT: Developers can open DevTools (F12) and see what went wrong during mount.
  //         Without this, some errors would be swallowed silently.
  // ALTERNATIVE: Display a user-friendly error page (e.g., "Something went wrong. Please refresh.").
  console.error("Critical: Failed to mount React application", error);
}
