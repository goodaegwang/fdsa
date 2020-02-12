FROM node:10-alpine

WORKDIR /nubison_api_server

ENV TZ=Asia/Seoul

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY . .

RUN npm ci

EXPOSE 9000

CMD [ "npm", "run", "dist" ]
