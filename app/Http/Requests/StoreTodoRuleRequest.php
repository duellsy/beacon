<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTodoRuleRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'trigger_type' => ['required', 'string', 'in:rag_status_changed,status_changed'],
            'trigger_from' => ['nullable', 'string'],
            'trigger_to' => ['required', 'string'],
            'suggested_body' => ['required', 'string', 'max:1000'],
            'suggested_deadline_days' => ['required', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
