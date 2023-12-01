FROM node:20.5.1-bookworm-slim AS build
COPY package.json app/package.json
COPY index.js app/index.js
RUN apt-get install -y python3
WORKDIR app
RUN npm install --production --silent

FROM node:20.5.1-bookworm-slim
COPY --from=build app /usr/src/app
WORKDIR /usr/src/app
CMD ["index.js"]
