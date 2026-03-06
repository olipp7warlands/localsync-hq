FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build
EXPOSE 3001
CMD ["node", "dist/index.js"]
