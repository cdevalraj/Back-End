FROM node:19.2-alpine3.15
EXPOSE 3001
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
ENV PORT=3001
CMD ["npm","start"]