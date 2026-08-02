# Use Debian-based Node image
FROM node:20-slim

WORKDIR /app

# Install OpenSSL (required by Prisma) and native build dependencies
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files and Prisma schema before npm install (so postinstall "prisma generate" succeeds)
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm install

# Copy remaining source code
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]