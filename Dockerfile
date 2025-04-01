FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Set environment variables
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Command to run the application
CMD ["node", "app.js"]
