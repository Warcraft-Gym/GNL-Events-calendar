FROM node:16-alpine3.11

ENV SEASON=9
ENV WEEKS=5
ENV SHEET_ID_CURRENT=1F1pclvCqdDRTg1pVLeMcfjtj4h1DxmCkyqYVUYG3dII
ENV CRON_SCHEDULE="* * * * *"
ENV CELL_RANGES="B5:I17 B20:I32 B35:I47"
ENV CALENDAR_ID=cepheidgaming@gmail.com
ENV TOKEN_PATH=./credentials/token.json
ENV CREDENTIALS_PATH=./credentials/credentials.json 

COPY . ./app
WORKDIR /app
COPY package*.json ./
RUN npm install
CMD ["npm", "run", "start:prod"]