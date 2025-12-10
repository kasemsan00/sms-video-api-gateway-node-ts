FROM node:lts-alpine3.18

RUN apk add tzdata
ENV TZ=Asia/Bangkok
ENV NODE_ENV=production
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5500

CMD ["npm", "start"]