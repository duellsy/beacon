<?php

namespace App\Mcp\Servers;

use App\Mcp\Prompts\DayPlannerPrompt;
use App\Mcp\Tools\GetActiveInitiativesTool;
use Laravel\Mcp\Server;

class PlanningServer extends Server
{
    /**
     * The MCP server's name.
     */
    protected string $name = 'planning';

    /**
     * The MCP server's version.
     */
    protected string $version = '0.0.1';

    /**
     * The MCP server's instructions for the LLM.
     */
    protected string $instructions = 'Provides initiative data for day planning. Use the get-active-initiatives tool to fetch current initiatives and the day-planner prompt to start a planning session.';

    /**
     * The tools registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Tool>>
     */
    protected array $tools = [
        GetActiveInitiativesTool::class,
    ];

    /**
     * The resources registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Resource>>
     */
    protected array $resources = [
        //
    ];

    /**
     * The prompts registered with this MCP server.
     *
     * @var array<int, class-string<\Laravel\Mcp\Server\Prompt>>
     */
    protected array $prompts = [
        DayPlannerPrompt::class,
    ];
}
