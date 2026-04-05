// PURPOSE: Vite configuration file — configures the frontend build tool and dev server.
// IMPACT: Controls how the React app is bundled, served in development, and built for production.
//         Without this file, Vite uses defaults (no React support, no Tailwind, default port).
// ALTERNATIVE: Use webpack.config.js (Webpack), or next.config.js (Next.js) for different build tools.

// PURPOSE: Imports defineConfig — a helper function providing TypeScript-like IntelliSense for Vite config.
// IMPACT: Wraps the config object for better IDE autocompletion. Functionally identical to exporting a plain object.
// ALTERNATIVE: export default { ... } without defineConfig (works, but no IDE autocompletion for Vite options).
import { defineConfig } from 'vite'

// PURPOSE: Imports the React plugin for Vite — enables JSX transformation and React Fast Refresh.
// IMPACT: Without this, Vite doesn't know how to handle .jsx files or JSX syntax.
//         Enables React Fast Refresh (HMR that preserves component state during development).
// ALTERNATIVE: @vitejs/plugin-react-swc — uses SWC instead of Babel (faster compilation, fewer features).
import react from '@vitejs/plugin-react'

// PURPOSE: Imports the Tailwind CSS plugin for Vite 4+ — integrates Tailwind's JIT compiler into Vite.
// IMPACT: Processes Tailwind CSS directives (@tailwind, @apply) and generates utility classes on demand.
//         NOTE: The project uses vanilla CSS (index.css) with custom classes, not Tailwind utilities.
//         This plugin is loaded but may not be actively used for styling.
// ALTERNATIVE: postcss with tailwindcss plugin (traditional approach), or remove if not using Tailwind.
import tailwindcss from '@tailwindcss/vite'

// PURPOSE: Exports the Vite configuration object.
export default defineConfig({
  // PURPOSE: Registers Vite plugins — extensions that enhance Vite's capabilities.
  // IMPACT: Plugins process files during development (HMR) and production builds.
  plugins: [
    // PURPOSE: Enables React support — JSX compilation, Fast Refresh, and development optimizations.
    // IMPACT: Transforms JSX to React.createElement calls using Babel under the hood.
    //         Provides HMR that preserves component state (change a component → see the update without full reload).
    // ALTERNATIVE: @vitejs/plugin-react-swc for SWC-based compilation (2-10x faster than Babel).
    react(),

    // PURPOSE: Enables Tailwind CSS JIT (Just-In-Time) compilation integrated into Vite's build pipeline.
    // IMPACT: Scans source files for Tailwind class usage and generates only the CSS that's needed.
    //         NOTE: The project primarily uses custom CSS in index.css, not Tailwind utility classes.
    // ALTERNATIVE: Remove this plugin if not using Tailwind CSS classes (reduces build complexity).
    tailwindcss(),
  ],

  // PURPOSE: Defines global constants available at compile time (replaced during build).
  // IMPACT: global: 'window' replaces the Node.js 'global' object with the browser's 'window' object.
  //         Required by libraries like sockjs-client that reference 'global' (a Node.js concept).
  //         Without this, the browser throws: "global is not defined" at runtime.
  // ALTERNATIVE: Install and import a global polyfill, or use globalThis (modern alternative).
  define: {
    global: 'window', // Polyfills Node.js 'global' for browser compatibility.
  },

  // PURPOSE: Sets the base URL path for all generated asset URLs.
  // IMPACT: '/' means assets are served from the root: /assets/index.js, /logo.png.
  //         Change to '/chess/' if deploying to a subdirectory like https://example.com/chess/.
  // ALTERNATIVE: './' for relative paths (works with any deployment path but breaks client-side routing).
  base: '/',

  // PURPOSE: Configures the production build output.
  build: {
    // PURPOSE: Sets the output directory for the production build.
    // IMPACT: Running 'vite build' outputs the bundled files to the 'dist/' directory.
    //         This directory is uploaded to Vercel/Netlify for hosting.
    // ALTERNATIVE: 'build/' (Create React App convention), or 'out/' (Next.js convention).
    outDir: 'dist',

    // PURPOSE: Empties the output directory before each build.
    // IMPACT: Prevents stale files from previous builds from persisting in the dist/ folder.
    //         Set to false to preserve existing files (useful for incremental builds).
    emptyOutDir: true,
  },

  // PURPOSE: Configures the Vite development server.
  server: {
    // PURPOSE: Sets the dev server port to 3000.
    // IMPACT: The frontend is accessible at http://localhost:3000 during development.
    //         This must match the CORS origins configured in the backend (SecurityConfig and WebSocketConfig).
    // ALTERNATIVE: Port 5173 (Vite's default), or port 8080 with a reverse proxy to the backend.
    port: 3000,

    // PURPOSE: Automatically opens the browser when the dev server starts.
    // IMPACT: Running 'npm run dev' opens http://localhost:3000 in your default browser automatically.
    // ALTERNATIVE: Set to false to prevent auto-open (useful when working with multiple terminals).
    open: true
  }
})
