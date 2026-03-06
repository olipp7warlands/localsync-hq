FROM node:22-alpine
WORKDIR /app
COPY package*.json turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/ ./packages/
RUN npm ci
COPY apps/api ./apps/api
RUN npm run build --workspace=apps/api
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/index.js"]
