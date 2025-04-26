FROM node:20.5.1-bullseye-slim AS builder
WORKDIR /app

ENV REACT_APP_API_URL="/api"
# ENV REACT_APP_SOCKET_URL="/socket"

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY public public
COPY src src

RUN npm run build

FROM node:20.5.1-bullseye-slim AS runtime

WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build

EXPOSE 3000

CMD [ "serve", "-s", "build", "-l", "3000" ]
