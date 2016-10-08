<?php

namespace Mattcavanagh\Portfolio\ServiceProvider;

use League\Container\ServiceProvider\AbstractServiceProvider;
use Zend\Diactoros\ServerRequestFactory;

class HttpMessageServiceProvider extends AbstractServiceProvider
{
    /**
     * Pointers to the Container for what this service provider provides
     *
     * @var array
     */
    protected $provides = [
        'Zend\Diactoros\Response',
        'Zend\Diactoros\Response\SapiEmitter',
        'Zend\Diactoros\ServerRequest'
    ];

    /**
     * {@inheritdoc}
     */
    public function register()
    {
        $this->getContainer()->add('Zend\Diactoros\Response');

        $this->getContainer()->share('Zend\Diactoros\Response\SapiEmitter');

        $this->getContainer()->share('Zend\Diactoros\ServerRequest', function () {
            $config = $this->getContainer()->get('config');

            if ($config['environment'] === 'development') {
                $_SERVER['REQUEST_URI'] = str_replace('/mattcavanagh/public', '', $_SERVER['REQUEST_URI']);
            } else {
                $_SERVER['REQUEST_URI'] = '/';
            }

            return ServerRequestFactory::fromGlobals();
        });
    }
}
