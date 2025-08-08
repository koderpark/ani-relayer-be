FROM node:23-alpine

WORKDIR /app
ADD . /app/
RUN npm install
RUN npm run build
EXPOSE 3000

ENTRYPOINT npm run start:prod