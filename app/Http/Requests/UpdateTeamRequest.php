<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTeamRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'color' => ['required', 'string', 'in:slate,red,orange,amber,lime,green,emerald,teal,cyan,sky,blue,indigo,violet,purple,fuchsia,pink,rose'],
            'members' => ['nullable', 'array'],
            'members.*.id' => ['nullable', 'uuid'],
            'members.*.name' => ['required', 'string', 'max:255'],
            'members.*.role' => ['nullable', 'string', 'max:255'],
        ];
    }
}
