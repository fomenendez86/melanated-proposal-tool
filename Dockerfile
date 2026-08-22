FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL=/app/data/proposals.db
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package.json package-lock.json ./
RUN npm ci && npx playwright install --with-deps chromium && npm cache clean --force

COPY . .
RUN npm run build

EXPOSE 3000
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["npm", "run", "start:production"]
