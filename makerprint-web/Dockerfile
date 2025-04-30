FROM node:20.5.1-bullseye-slim AS dev
WORKDIR /app

ENV REACT_APP_API_URL="/api"
ENV REACT_APP_SOCKET_URL="/socket"

COPY package.json package-lock.json ./
RUN npm ci

COPY public public
COPY src src

FROM dev as builder
WORKDIR /app
RUN npm run build

FROM node:20.5.1-bullseye-slim AS runtime

WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD [ "serve", "-s", "build", "-l", "3000" ]
