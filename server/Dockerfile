FROM node:20

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 3000 (inside container)
# When running: docker run -p 3001:3000 (maps host 3001 to container 3000)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
