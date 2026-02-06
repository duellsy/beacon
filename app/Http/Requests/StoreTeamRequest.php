<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTeamRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'delivery_lead' => ['required', 'string', 'max:255'],
            'product_owner' => ['required', 'string', 'max:255'],
            'color' => ['required', 'string', 'in:slate,red,orange,amber,lime,green,emerald,teal,cyan,sky,blue,indigo,violet,purple,fuchsia,pink,rose'],
        ];
    }
}
