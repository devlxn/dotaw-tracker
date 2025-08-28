# Stage 1: Build client
FROM node:20-alpine as build-client
WORKDIR /client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine as build-server
WORKDIR /server
COPY server/package*.json ./
RUN npm install
COPY server/ .
COPY --from=build-client /client/dist ./public
RUN npm run build # если нужен сбор серверного TS

# Stage 3: Run server
WORKDIR /server
EXPOSE 3000
CMD ["node", "dist/index.js"]
