FROM node:16-alpine

# tini
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /usr/src/app
COPY . .
RUN npm install --only=prod
EXPOSE 3000
CMD ["npm", "start"]