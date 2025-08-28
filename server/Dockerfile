FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /server

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь проект
COPY . .

# Компилируем TypeScript
RUN npm run build

# Указываем порт (для документации, не обязателен)
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]