FROM node:24 AS client-build

WORKDIR /app

COPY xordle-vite/package.json xordle-vite/ 
RUN npm install --prefix xordle-vite

COPY xordle-vite/. xordle-vite/
RUN npm run build --prefix xordle-vite

FROM node:24 AS server-build

COPY xordle-express/package.json xordle-express/
RUN npm install --prefix xordle-express

COPY xordle-express/. xordle-express/
COPY --from=client-build /app/xordle-vite/dist xordle-vite/dist

RUN npm run build --prefix xordle-express

EXPOSE 3300
CMD ["npm", "run", "prod", "--prefix", "xordle-express"]
