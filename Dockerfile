FROM node:16-alpine3.11
COPY . ./app
WORKDIR /app
RUN npm install
CMD ["npm", "run", "start:prod"]