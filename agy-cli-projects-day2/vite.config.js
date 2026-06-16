import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    fs: {
      allow: ['..']
    }
  },
  plugins: [
    {
      name: 'serve-sibling-resources',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Check if request is for the pour-over resources markdown file
          if (req.url.startsWith('/my-first-project-kaggle-day1/pour_over_resources.md')) {
            const filePath = path.resolve(__dirname, '../my-first-project-kaggle-day1/pour_over_resources.md');
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
              res.end(fs.readFileSync(filePath));
              return;
            }
          }
          next();
        });
      }
    }
  ]
});
