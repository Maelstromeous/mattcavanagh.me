<?php

include __DIR__ . '/../vendor/autoload.php';

$container = include __DIR__ . '/../src/container.php';

$router = include __DIR__ . '/../src/router.php';

$response = $router->dispatch(
    $container->get('Zend\Diactoros\ServerRequest'),
    $container->get('Zend\Diactoros\Response')
);

$container->get('Zend\Diactoros\Response\SapiEmitter')->emit($response);
