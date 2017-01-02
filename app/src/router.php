<?php

use League\Container\Container;
use League\Container\ContainerInterface;
use League\Route\RouteCollection;

$router = new RouteCollection(
    isset($container) && $container instanceof ContainerInterface ? $container : new Container
);

$router->get('/', 'Mattcavanagh\Portfolio\Controller\MainController::index');
$router->get('/portfolio', 'Mattcavanagh\Portfolio\Controller\PortfolioController::index');
$router->get('/portfolio/ps2alerts', 'Mattcavanagh\Portfolio\Controller\PortfolioController::ps2alerts');
$router->get('/portfolio/timefortea', 'Mattcavanagh\Portfolio\Controller\PortfolioController::timefortea');
$router->get('/portfolio/nanitesystemscomics', 'Mattcavanagh\Portfolio\Controller\PortfolioController::nanitesystemscomics');
$router->get('/portfolio/planetsidebattles', 'Mattcavanagh\Portfolio\Controller\PortfolioController::planetsidebattles');

return $router;
