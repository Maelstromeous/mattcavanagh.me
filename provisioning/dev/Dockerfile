# Dev base image built locally
FROM mattcavanagh:base

USER root

# Inject configs
COPY files/nginx /etc/nginx/conf.d
COPY files/php /usr/local/etc/php/conf.d
COPY files/php-fpm /usr/local/etc/php-fpm.d

USER www-data