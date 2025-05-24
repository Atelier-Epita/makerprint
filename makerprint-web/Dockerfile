# Étape 1 : Build de l'application
FROM node:20.5.1-bullseye-slim AS dev

WORKDIR /app

ENV VITE_API_URL="/api"
ENV VITE_SOCKET_URL="/socket"

# Copier les fichiers de dépendances

COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du projet
COPY . .

FROM dev AS builder
WORKDIR /app
RUN npm run dev

# Étape 2 : Serveur web pour la production
FROM node:20.5.1-bullseye-slim AS runtime

WORKDIR /app

# Installer 'serve' globalement pour servir le contenu statique
RUN npm install -g serve

# Copier uniquement les fichiers construits
COPY --from=builder /app/dist ./dist

# Exposer le port 3000
EXPOSE 3000

# Lancer l'application
CMD ["serve", "-s", "dist", "-l", "3000"]
