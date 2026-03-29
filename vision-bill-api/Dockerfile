# Base stage for dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Build stage
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production
RUN npm install --only=production
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main"]
