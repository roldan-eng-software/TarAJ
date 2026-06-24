FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

EXPOSE 3001

VOLUME /app/auth_info

CMD ["node", "dist/index.js"]
