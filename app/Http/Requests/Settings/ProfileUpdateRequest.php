<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:255'],
            'nama' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore(Auth::user()->id),
            ],
            'no_hp' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string', 'max:500'],
            'foto' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:4590'],
            'prodi' => ['nullable', 'string', 'max:100'],
            'fakultas' => ['nullable', 'string', 'max:100'],
            'universitas' => ['nullable', 'string', 'max:100'],
            'npm' => ['nullable', 'string', 'regex:/^[0-9]{13}$/', 'size:13'],
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'npm.regex' => 'NPM/NIM hanya boleh berisi angka dan harus tepat 13 digit.',
            'npm.size' => 'NPM/NIM harus tepat 13 digit.',
        ];
    }
}
