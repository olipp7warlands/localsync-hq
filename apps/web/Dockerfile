FROM node:22-alpine
WORKDIR /app
COPY package*.json turbo.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ ./packages/
RUN npm ci
COPY apps/web ./apps/web
RUN npm run build --workspace=apps/web
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "apps/web/dist", "-p", "3000"]
