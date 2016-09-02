<?php

namespace Mattcavanagh\Portfolio\Controller;

use Mattcavanagh\Portfolio\Contract\TemplateAwareInterface;
use Mattcavanagh\Portfolio\Contract\TemplateAwareTrait;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class PortfolioController implements TemplateAwareInterface
{
    use TemplateAwareTrait;

    public function index(ServerRequestInterface $request, ResponseInterface $response)
    {
        $response->getBody()->write(
            $this->getTemplateDriver()->render('portfolio/index.twig')
        );
    }

    /**
     * PS2Alerts portfolio.
     *
     * @param  Psr\Http\Message\ServerRequestInterface $request
     * @param  Psr\Http\Message\ResponseInterface      $response
     *
     * @return Psr\Http\Message\ResponseInterface
     */
    public function ps2alerts(ServerRequestInterface $request, ResponseInterface $response)
    {
        $response->getBody()->write(
            $this->getTemplateDriver()->render('portfolio/ps2alerts.twig')
        );
    }
}
