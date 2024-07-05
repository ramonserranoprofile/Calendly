# Etapa de construcción: construye la aplicación Flask y Express
FROM node:18.20.3 AS build
WORKDIR /

# Instala las dependencias de Express
COPY package.json package-lock.json ./
RUN npm install

# Instala las dependencias de Flask
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copia todos los archivos de las aplicaciones Flask y Express
COPY . .

# Etapa de producción: sirve las aplicaciones con NGINX como proxy reverso
FROM nginx:latest
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build / /usr/share/nginx/html/
EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]