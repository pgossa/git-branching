FROM nginx:1.28.0-alpine3.21-perl
COPY static /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf