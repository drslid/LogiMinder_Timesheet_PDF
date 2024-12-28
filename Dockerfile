# 1) Utiliser une image Node officielle
FROM node:16

# 2) Créer un répertoire de travail
WORKDIR /app

# 3) Copier package.json et package-lock.json
COPY package*.json ./

# 4) Installer les dépendances
RUN npm install

# 5) Copier le reste du code
COPY . .

# 6) Exposer le port 3000 (ou celui que tu utilises)
EXPOSE 3000

# 7) Commande de démarrage
CMD ["node", "server.js"]
