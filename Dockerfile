FROM node:20-alpine

# Production environment set karein
ENV NODE_ENV=production

WORKDIR /app

# Pehle dependencies copy karein (caching ke liye behtar hai)
COPY package*.json ./
RUN npm install --only=production

# Baqi code copy karein
COPY . .

# Port match karein (Azure WEBSITES_PORT variable ke mutabiq)
EXPOSE 8080

CMD ["node", "server.js"]
