FROM node:14.14.0-alpine3.12

COPY . ./app

WORKDIR /app

RUN npm install

ARG CALENDAR_ID = 'cepheidgaming@gmail.com'

ARG SHEET_ID = '1l5LoaIEPECoR-cMHhsy-gkgEPOLs3WfhrgeJ9byRs0k'

ARG WEEKS = 5

ARG CRON_SCHEDULE = '0,15,30,45 * * * *'

CMD ["node", "update"]
