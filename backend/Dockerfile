FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache docker-cli
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
EXPOSE 3001
USER node
CMD ["node", "index.js"]
