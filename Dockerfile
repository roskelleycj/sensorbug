FROM node:20.5.1-bookworm-slim AS build
RUN npm install

FROM node:20.5.1-bookworm-slim
COPY --from=build / /usr/src/app
WORKDIR /usr/src/app
CMD ["index.js"]
