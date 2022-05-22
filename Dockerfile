FROM node:16-slim
WORKDIR /usr/src/app
COPY . .
RUN npm install --only=prod
CMD ["node", "index.js"]