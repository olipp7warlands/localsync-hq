FROM node:22-alpine
WORKDIR /app
COPY package*.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/package*.json ./apps/api/
RUN npm install
COPY apps/api ./apps/api
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=apps/api
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
