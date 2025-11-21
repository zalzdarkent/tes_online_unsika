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
        'prodi',
        'fakultas',
        'universitas',
        'npm'
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

    /**
     * Relasi ke jadwal yang diikuti peserta
     */
    public function jadwalPeserta()
    {
        return $this->hasMany(JadwalPeserta::class, 'id_peserta');
    }

    /**
     * Relasi ke jadwal yang di-approve oleh user
     */
    public function jadwalApproved()
    {
        return $this->hasMany(JadwalPeserta::class, 'approved_by');
    }

    /**
     * Get all question banks owned by the user
     */
    public function questionBanks()
    {
        return $this->hasMany(QuestionBank::class);
    }

    /**
     * Get all permission requests sent by user
     */
    public function sentPermissionRequests()
    {
        return $this->hasMany(QuestionBankPermission::class, 'requester_id');
    }

    /**
     * Get all permission requests received by user
     */
    public function receivedPermissionRequests()
    {
        return $this->hasMany(QuestionBankPermission::class, 'owner_id');
    }

    /**
     * Check apakah profil lengkap untuk mengikuti tes
     */
    public function isProfileComplete(): bool
    {
        return !empty($this->nama) &&
               !empty($this->email) &&
               !empty($this->alamat) &&
               !empty($this->no_hp) &&
               !empty($this->prodi) &&
               !empty($this->fakultas) &&
               !empty($this->universitas) &&
               !empty($this->npm);
    }

    /**
     * Get missing profile fields
     */
    public function getMissingProfileFields(): array
    {
        $required = [
            'nama' => 'Nama Lengkap',
            'email' => 'Email',
            'alamat' => 'Alamat',
            'no_hp' => 'Nomor HP',
            'prodi' => 'Program Studi',
            'fakultas' => 'Fakultas',
            'universitas' => 'Universitas',
            'npm' => 'NPM'
        ];

        $missing = [];
        foreach ($required as $field => $label) {
            if (empty($this->$field)) {
                $missing[] = $label;
            }
        }

        return $missing;
    }
}
