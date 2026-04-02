FROM node:24 as client-build

WORKDIR /app

COPY xordle-vite/package.json xordle-vite/ 
RUN npm install --prefix xordle-vite

COPY xordle-vite/. xordle-vite/
RUN npm run build --prefix xordle-vite

FROM node:24 as server-build

COPY xordle-express/package.json xordle-express/
RUN npm install --prefix xordle-express

COPY xordle-express/. xordle-express/

EXPOSE 3300 5678
CMD ["npm", "run", "Start", "--prefix", "xordle-express"]
