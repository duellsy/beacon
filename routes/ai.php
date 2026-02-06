<?php

use App\Mcp\Servers\PlanningServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::local('planning', PlanningServer::class);
