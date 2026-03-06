FROM node:22-alpine
WORKDIR /app
COPY package*.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/package*.json ./apps/web/
RUN npm install
COPY apps/web ./apps/web
RUN npm run build --workspace=apps/web
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "apps/web/dist", "-p", "3000"]
