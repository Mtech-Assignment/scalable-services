# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=build /app /app
ENV PORT=3011
ENV NODE_ENV=production
EXPOSE 3011
CMD ["npm", "start"]
