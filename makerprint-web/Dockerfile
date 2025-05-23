FROM node:20.5.1-bullseye-slim AS dev
WORKDIR /app

ENV REACT_APP_API_URL="/api"
ENV REACT_APP_SOCKET_URL="/socket"

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html .
COPY public public
COPY src src
COPY vite.config.ts .
COPY tsconfig*.json .
COPY tailwind.config.ts .
COPY postcss.config.js .

FROM dev as builder
WORKDIR /app
RUN npm run build

FROM node:20.5.1-bullseye-slim AS runtime

WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD [ "serve", "-s", "dist", "-l", "3000" ]
