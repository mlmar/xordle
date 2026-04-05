# Stage 1: Build the Vite client
FROM node:24 AS client-build

WORKDIR /app

COPY xordle-common/. xordle-common/
COPY xordle-vite/package.json xordle-vite/
RUN npm install --prefix xordle-vite

COPY xordle-vite/. xordle-vite/
RUN npm run build --prefix xordle-vite

# Stage 2: Build the Express server
FROM node:24 AS server-build

WORKDIR /app

COPY xordle-common/. xordle-common/
COPY xordle-express/package.json xordle-express/
RUN npm install --prefix xordle-express

COPY xordle-express/. xordle-express/
RUN npm run build --prefix xordle-express

# Stage 3: Production image
FROM node:24-slim AS production

WORKDIR /app

COPY xordle-common/. xordle-common/
COPY --from=server-build /app/xordle-express/node_modules xordle-express/node_modules
COPY --from=server-build /app/xordle-express/dist xordle-express/dist
COPY --from=server-build /app/xordle-express/package.json xordle-express/package.json
COPY --from=client-build /app/xordle-vite/dist xordle-express/xordle-vite/dist

EXPOSE 3300
CMD ["npm", "run", "prod", "--prefix", "xordle-express"]
