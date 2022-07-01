FROM node:16-alpine3.11

ENV SEASON=10
ENV WEEKS=5
# ENV PLAYOFF_WEEKS=2
ENV SHEET_ID_CURRENT=1VXOG7F6Tl8EPEnzCrffTmxdfMt8DZ0F2v9FZrJS8imA
ENV CRON_SCHEDULE="*/5 * * * *"
ENV CELL_RANGES="B5:I18 B21:I34 B37:I50"
ENV CALENDAR_ID=cepheidgaming@gmail.com
ENV TOKEN_PATH=./credentials/token.json
ENV CREDENTIALS_PATH=./credentials/credentials.json 

COPY . ./app
WORKDIR /app
COPY package*.json ./
RUN npm install
CMD ["npm", "run", "start:prod"]