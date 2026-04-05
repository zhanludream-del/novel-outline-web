FROM mcr.microsoft.com/playwright:v1.54.1-jammy

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV PLAYWRIGHT_HEADLESS=true
ENV PORT=8789

EXPOSE 8789

CMD ["npm", "start"]
