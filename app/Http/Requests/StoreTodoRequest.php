<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTodoRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:500'],
            'deadline' => ['required', 'date'],
            'source' => ['sometimes', 'string', 'in:manual,rag_status,blocking,deadline_approaching,rag_status_changed,status_changed,deadline_changed,deadline_overdue,deadline_missing,no_rag_set,status_changed_notify_dependents,moved_to_done'],
        ];
    }
}
