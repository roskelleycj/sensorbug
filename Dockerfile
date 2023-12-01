FROM node:20.5.1-bookworm-slim AS build
COPY package.json app/package.json
COPY index.js app/index.js
RUN ls app
