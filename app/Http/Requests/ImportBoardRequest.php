<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ImportBoardRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'teams' => ['present', 'array'],
            'teams.*.id' => ['required', 'string'],
            'teams.*.name' => ['required', 'string', 'max:255'],
            'teams.*.description' => ['nullable', 'string', 'max:5000'],
            'teams.*.color' => ['nullable', 'string', 'in:slate,red,orange,amber,lime,green,emerald,teal,cyan,sky,blue,indigo,violet,purple,fuchsia,pink,rose'],
            'teams.*.sort_order' => ['nullable', 'integer', 'min:0'],

            'projects' => ['present', 'array'],
            'projects.*.id' => ['required', 'string'],
            'projects.*.name' => ['required', 'string', 'max:255'],

            'initiatives' => ['present', 'array'],
            'initiatives.*.id' => ['required', 'string'],
            'initiatives.*.title' => ['required', 'string', 'max:120'],
            'initiatives.*.description' => ['nullable', 'string', 'max:5000'],
            'initiatives.*.jira_url' => ['nullable', 'url:http,https'],
            'initiatives.*.team_id' => ['nullable', 'string'],
            'initiatives.*.project_id' => ['nullable', 'string'],
            'initiatives.*.status' => ['required', 'in:upcoming,in_progress,done'],
            'initiatives.*.rag_status' => ['nullable', 'in:red,amber,green'],
            'initiatives.*.expected_date' => ['nullable', 'date'],
            'initiatives.*.dependencies' => ['nullable', 'array'],
            'initiatives.*.dependencies.*' => ['string'],
        ];
    }
}
