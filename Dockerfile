FROM node:18.19.0

WORKDIR /app

COPY package*.json ./

RUN yarn
RUN yarn add sharp --ignore-engines
RUN mkdir -p ./uploads

COPY . .

RUN yarn build

CMD ["yarn", "start:debug"]