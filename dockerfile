# Etapa de construcción: construye la aplicación Flask y Express
FROM node:18-slim AS build
WORKDIR /app

# Configura Chrome para no requerir sandboxing, lo cual es útil en contenedores de Docker
# RUN sed -i 's/^Exec=\/usr\/bin\/google-chrome-stable/& --no-sandbox --disable-setuid-sandbox--disable-gpu/' /usr/share/applications/google-chrome.desktop

# Instalar sudo (si no está instalado)
RUN apt-get update && apt-get install -y sudo

# Instala las dependencias de Express
#RUN npm cache clean --force
# Instala las dependencias de Express
COPY package.json package-lock.json ./
RUN npm install --unsafe-perm=true --allow-root --force && npm install rimraf@4.4.1 glob@10.4.2 puppeteer@22.13.1 puppeteer-core@22.13.1 && npm install npm@10.8.1
# Configurar el sandbox setuid

# # Configurar el sandbox setuid
# RUN cd $(find / -type d -name "chrome-linux64" 2>/dev/null | head -n 1) \
#     && chown root:root chrome_sandbox \
#     && chmod 4755 chrome_sandbox \
#     && sudo cp -p chrome_sandbox /usr/local/sbin/chrome-devel-sandbox

# # Exportar la variable de entorno
# ENV CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox

# Copia todos los archivos de las aplicaciones Flask y Express
COPY . .


# Segunda etapa de construcción para Flask
FROM python:3.10-slim AS flask
#WORKDIR /

# Instala las dependencias de Python y venv
RUN apt-get update && apt-get install -y python3-pip python3-venv
# Instala las dependencias de Flask
COPY requirements.txt ./
RUN python3 -m venv /venv
RUN . /venv/bin/activate && pip install -r requirements.txt

# Copia todos los archivos de la aplicación Flask
COPY . .

# Configura NGINX
FROM nginx:latest
#WORKDIR /
# Instala Node.js en la etapa de Nginx

RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Unificación de todas las dependencias necesarias

# Unificación de todas las dependencias necesarias
RUN apt-get update && apt-get install -y \
    sudo \
    apt-utils \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    lsb-release \
    x11-xserver-utils \
    wget \
    gnupg \
    acl \
    #chromium \
    apt-transport-https \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configurar Puppeteer para descargar el navegador
ENV PUPPETEER_SKIP_DOWNLOAD=false

#RUN npm install
#RUN npm install --unsafe-perm=true --allow-root --force && npm install puppeteer-core@22.13.1 puppeteer@22.13.1 puppeteer-extra@latest
RUN PUPPETEER_CACHE_DIR='/home/1000/.cache/puppeteer' npx puppeteer browsers install chrome@126.0.6478.182
# # Configurar el sandbox setuid
# RUN cd /root/.cache/puppeteer/chrome/linux-126.0.6478.182/chrome-linux64/ \
#     && chown root:root chrome_sandbox \
#     && chmod 4755 chrome_sandbox \
#     && cp -p chrome_sandbox /usr/local/sbin/chrome-devel-sandbox

# # Establecer la variable de entorno
# ENV CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox

# Copia los archivos construidos en las etapas anteriores
COPY --from=build /app /
COPY --from=flask / /
# Copia la configuración de NGINX
COPY nginx.conf /etc/nginx/nginx.conf
RUN chmod u+rwx /etc/nginx/nginx.conf
RUN mkdir -p /var/cache/nginx/client_temp /var/run/nginx /etc/nginx /logs /root/Documents

COPY /chrome.sh /root/Documents/chrome.sh
RUN chmod +rwx /root/Documents/chrome.sh

# Exponer puertos para Flask y Express
EXPOSE 8080 8000 80

# Copia el script de inicio
COPY start.sh /start.sh
RUN chmod +rwx /start.sh

RUN cp -r /app/* / && cp -r /app/.* / || true && rm -rf /app

# Arguments for the non-root user
ARG USERNAME=1000
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Install necessary dependencies and create the non-root user
# Install sudo and create a non-root user
RUN apt-get update \
    && groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -G audio,video,sudo,adm,cdrom,dip,dialout,plugdev,staff,root --system --no-create-home $USERNAME \
    && echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME
RUN mkdir -p /home/$USERNAME/Downloads /home/$USERNAME/.config/google-chrome /home/$USERNAME/.config/chromium /home/$USERNAME/.cache/puppeteer \
    && chown -R $USERNAME:$USERNAME /home/$USERNAME/Downloads /home/$USERNAME/.config/google-chrome /home/$USERNAME/.config/chromium /home/$USERNAME/.cache/puppeteer \
    && mkdir -p /.wwebjs_auth /.wwebjs_cache /var/cache/nginx/client_temp /var/run/nginx /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /etc/nginx /logs \
    && chown -R $USERNAME:$USERNAME /.wwebjs_auth /.wwebjs_cache /var/cache/nginx /var/run/nginx /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /etc/nginx \
    && touch /run/nginx.pid /logs/traccess.log /RemoteAuth-ramonserrano-_ramonserrano76-gmail_com.zip \
    && chown -R $USERNAME:$USERNAME /run/nginx.pid /logs/traccess.log /__pycache__ /logs/errorNG.log /logs /Databases /modules /src /static /templates /views /RemoteAuth-ramonserrano-_ramonserrano76-gmail_com.zip

RUN chmod 777 /RemoteAuth-ramonserrano-_ramonserrano76-gmail_com.zip 
RUN chown -R $USERNAME:$USERNAME /usr/local/bin
RUN chmod -R 777 /node_modules /usr/local/bin
# Switch to the non-root user
#RUN chown -R $USERNAME /app
USER $USERNAME

# WORKDIR /

# Comando para iniciar NGINX, Flask y Express
CMD ["/start.sh"]