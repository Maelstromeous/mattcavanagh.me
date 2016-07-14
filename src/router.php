<?php

use League\Container\Container;
use League\Container\ContainerInterface;
use League\Route\RouteCollection;

$router = new RouteCollection(
    isset($container) && $container instanceof ContainerInterface ? $container : new Container
);

$router->get('/', 'Mattcavanagh\Portfolio\Controller\MainController::helloWorld');
$router->get('/test', 'Mattcavanagh\Portfolio\Controller\MainController::testRoute');

return $router;
