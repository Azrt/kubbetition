# -- Build stage --
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn --frozen-lockfile
RUN yarn add sharp --ignore-engines

COPY . .
RUN yarn build

# -- Production stage --
FROM node:20-alpine

WORKDIR /app

COPY package*.json yarn.lock ./
RUN yarn --frozen-lockfile --production && yarn add sharp --ignore-engines && yarn cache clean

COPY --from=builder /app/dist ./dist

RUN mkdir -p ./uploads && chown -R node:node /app

USER node

EXPOSE 3000

# Run migrations then start the app (migrations run first so DB is ready before accepting traffic)
CMD ["sh", "-c", "node node_modules/typeorm/cli.js migration:run -d dist/data-source.js && exec node dist/main"]
