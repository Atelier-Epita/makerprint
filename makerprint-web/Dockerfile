FROM node:20.5.1-bullseye-slim
WORKDIR /app

RUN npm install -g serve

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY public public
COPY src src

RUN npm run build

CMD [ "serve", "-s", "build", "-l", "3000" ]