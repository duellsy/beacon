<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateInitiativeRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:5000'],
            'jira_url' => ['nullable', 'url:http,https'],
            'team_id' => ['nullable', 'exists:teams,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'status' => ['required', 'in:upcoming,in_progress,done'],
            'engineer_owner' => ['nullable', 'string', 'max:255'],
            'expected_date' => ['nullable', 'date'],
        ];
    }
}
