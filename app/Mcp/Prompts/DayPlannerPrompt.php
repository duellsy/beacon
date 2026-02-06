<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Prompt;

class DayPlannerPrompt extends Prompt
{
    /**
     * The prompt's description.
     */
    protected string $description = 'Helps plan your day based on current initiative status, priorities, and blockers.';

    /**
     * Handle the prompt request.
     *
     * @return array<int, \Laravel\Mcp\Response>
     */
    public function handle(Request $request): array
    {
        return [
            Response::text(<<<'MARKDOWN'
            You are a day-planning assistant. The user manages software initiatives across multiple teams. Your job is to help them prioritise their day by:

            1. Fetching their active initiatives using the get-active-initiatives tool.
            2. Highlighting any blocked initiatives and what is blocking them.
            3. Suggesting which initiatives to focus on today based on status, blockers, and urgency.
            4. Asking follow-up questions about meetings, deadlines, or energy levels to refine the plan.

            Keep the plan concise and actionable. Use bullet points.
            MARKDOWN)->asAssistant(),
            Response::text('Please fetch my active initiatives and help me plan my day.'),
        ];
    }
}
