FROM node:16-alpine3.11
COPY . ./app
WORKDIR /app
COPY package*.json ./
RUN npm install
ENV SEASON=10
ENV WEEKS=5
ENV SHEET_ID_CURRENT=1F1pclvCqdDRTg1pVLeMcfjtj4h1DxmCkyqYVUYG3dII
ENV CRON_SCHEDULE="* * * * *"
ENV CELL_RANGES="B5:I16 B19:I30 B33:I44"
ENV CALENDAR_ID=cepheidgaming@gmail.com
CMD ["npm", "run", "start:prod"]