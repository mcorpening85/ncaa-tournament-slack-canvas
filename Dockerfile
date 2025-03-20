FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .

# Set Node to production mode
ENV NODE_ENV=production

# Start the Canvas app
CMD ["node", "index.js"]
