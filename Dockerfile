FROM node:20.5.1-bookworm-slim AS build
COPY package.json app/package.json
COPY index.js app/index.js
WORKDIR app
RUN npm install

FROM node:20.5.1-bookworm-slim
COPY --from=build app /usr/src/app
WORKDIR /usr/src/app
CMD ["index.js"]
