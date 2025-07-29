<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'nama',
        'email',
        'password',
        'role',
        'foto',
        'alamat',
        'no_hp',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get all categories owned by the user
     */
    public function kategoriTes()
    {
        return $this->hasMany(KategoriTes::class);
    }

    /**
     * Get all jadwal owned by the user
     */
    public function jadwals()
    {
        return $this->hasMany(Jadwal::class);
    }

    public function jawaban()
    {
        return $this->hasMany(Jawaban::class, 'id_user');
    }

    public function hasilTestPeserta()
    {
        return $this->hasMany(HasilTestPeserta::class, 'id_user');
    }
}
