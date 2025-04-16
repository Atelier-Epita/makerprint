FROM node:20.5.1-bullseye-slim
WORKDIR /app


ENV REACT_APP_API_URL="/api"
# ENV REACT_APP_SOCKET_URL="/socket"

RUN npm install -g serve

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY public public
COPY src src

RUN npm run build

CMD [ "serve", "-s", "build", "-l", "3000" ]