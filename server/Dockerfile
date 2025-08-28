# Базовый образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json для сервера
COPY server/package.json server/package-lock.json 

# Устанавливаем зависимости
RUN cd server && npm install

# Копируем весь проект
COPY . .

# Переходим в папку server
WORKDIR /app/server

# Компилируем TypeScript
RUN npm run build

# Запускаем приложение
CMD ["node", "dist/index.js"]