<?php

namespace Mattcavanagh\Portfolio\Controller;

use Mattcavanagh\Portfolio\Contract\ConfigAwareInterface;
use Mattcavanagh\Portfolio\Contract\ConfigAwareTrait;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class MainController implements ConfigAwareInterface
{
    use ConfigAwareTrait;

    /**
     * Hello world!
     *
     * @param  Psr\Http\Message\ServerRequestInterface $request
     * @param  Psr\Http\Message\ResponseInterface      $response
     *
     * @return Psr\Http\Message\ResponseInterface
     */
    public function helloWorld(ServerRequestInterface $request, ResponseInterface $response)
    {
        $config = $this->getConfig();

        $response->getBody()->write(
            $config['base_url']
        );
    }

    /**
     * Route that ensures .htaccess and overall routing is working
     *
     * @param  Psr\Http\Message\ServerRequestInterface $request
     * @param  Psr\Http\Message\ResponseInterface      $response
     *
     * @return Psr\Http\Message\ResponseInterface
     */
    public function testRoute(ServerRequestInterface $request, ResponseInterface $response)
    {
        $response->getBody()->write(
            'It\'s working!'
        );
    }
}
