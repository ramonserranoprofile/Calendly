1.- para activar env
source "env/Scripts/activate"
2.- luego start al server flask
flask --app=process_form.py run
ó
flask --app=process_form.py run --debug

1.-Para iniciar el server Express : node start
ó
nodemon

# Para iniciar nginx localmente: (El servidor Nginx  escucha en el puerto 8080 y actua como un proxy inverso hacia dos aplicaciones en puertos diferentes (5000 Flask y 4000 Express).
1.- vaya a la capeta donde esta instalado nginx  (en git bash)
cd /c/tools/nginx-1.27.0
2.- ahora para start del server : (en git bash)
./nginx.exe -c D:/calendly/nginx.conf
3.- para detenerlo :  (en git bash)
./nginx.exe -s stop
ó
./nginx.exe -s quit
4.-si no funcionan nada abrir cmd como admin:  (en CMD windows)
taskkill /IM nginx.exe /f


apra POST http://127.0.0.1:4000/api/start/developercloud/ramonserrano76@gmail.com

::DOCKER::

BUILD:
docker build -t ramonserrano76/calendly:v12.0 .

RUN:
docker run -p 4000:4000 ramonserrano76/calendly:v12.0

PUSH TO DOCKER NETWORKS TO USE:
docker push ramonserrano76/calendly:v12.0

PARA VER IMAGENES DISPONIBLES:
docker images

PARA BORRAR UNA IMAGEN POR NOMBRE Y TAG:
docker rmi nombre_imagen:tag

PARA LISTA LOS CONTAINERS:
docker ps -a

PARA DETENER UN CONTAINER:
docker stop ID_contenedor

PARA ELIMINAR UN CONTAINER;
docker rm ID_contenedor

PARA LIMPUAR CACHE , ESPACIO E IMAGENES NO UTILIZADAS:
docker system prune

PARA VER DETALLES ESPECIFICOS DE UNA IMAGEN:
docker inspect nombre_imagen:tag