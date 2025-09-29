FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]