# Dev base image built locally
FROM timefortea:base

USER root

RUN curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -

RUN apt-get update && apt-get install -y nodejs htop mariadb-client iputils-ping nano \
&& rm -rf /var/lib/apt/lists/*

# Install grunt so we can process the LESS files automatically
RUN mkdir -p /var/www/.npm && chown www-data: /var/www/.npm
RUN npm install -g grunt-cli

# Install xdebug
RUN yes | pecl install xdebug \
&& echo "zend_extension=$(find /usr/local/lib/php/extensions/ -name xdebug.so)" > /usr/local/etc/php/conf.d/xdebug.ini \
&& echo "xdebug.remote_enable=on" >> /usr/local/etc/php/conf.d/xdebug.ini \
&& echo "xdebug.remote_port=9001" >> /usr/local/etc/php/conf.d/xdebug.ini \
&& echo "xdebug.remote_autostart=off" >> /usr/local/etc/php/conf.d/xdebug.ini

# Inject configs
COPY files/nginx /etc/nginx/conf.d
COPY files/php /usr/local/etc/php/conf.d
COPY files/php-fpm /usr/local/etc/php-fpm.d
COPY files/runit /etc/service

USER www-data