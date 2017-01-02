FROM ubuntu:16.04

RUN apt-get update && apt-get install -y git curl unzip
RUN curl -sS https://getcomposer.org/installer | \
    php -- --install-dir=/usr/local/bin --filename=composer

VOLUME ["/srv"]
WORKDIR /srv
