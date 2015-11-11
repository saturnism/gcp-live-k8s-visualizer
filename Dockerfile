FROM akkerman/rpi-nginx

COPY jquery*.js script.js style.css logotext.svg index.html /usr/share/nginx/html/
COPY jsplumb/* /usr/share/nginx/html/jsplumb/
COPY nginx.conf /etc/nginx/