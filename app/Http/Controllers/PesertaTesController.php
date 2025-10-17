<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Jadwal;
use App\Models\HasilTestPeserta;
use App\Models\Jawaban;
use App\Models\Soal;
use App\Models\JadwalPeserta;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PesertaTesController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Auto-update expired jadwal status setiap kali ada request
        Jadwal::updateExpiredJadwalStatus();

        $userId = Auth::id();
        $now = now();

        // Debug: Hitung total jadwal di database
        $totalJadwalInDB = Jadwal::count();

        // Debug: Hitung jadwal berdasarkan kondisi terpisah
        $jadwalStatusBuka = Jadwal::get()->filter(function ($item) use ($now) {
            $tanggalBerakhir = $item->tanggal_berakhir instanceof \Carbon\Carbon
                ? $item->tanggal_berakhir
                : \Carbon\Carbon::parse($item->tanggal_berakhir);
            return !$now->gt($tanggalBerakhir); // Status Buka jika belum melewati tanggal berakhir
        })->count();

        $jadwalBelumDikerjakan = Jadwal::whereDoesntHave('jawaban', function ($query) use ($userId) {
            $query->where('id_user', $userId);
        })->count();

        $jadwal = Jadwal::with(['jadwalSebelumnya', 'pesertaTerdaftar'])
            // TIDAK ada filter user_id karena peserta harus bisa lihat semua jadwal tes
            // HAPUS filter tanggal mulai - tampilkan semua jadwal
            // ->where('tanggal_mulai', '<=', $now) // DIHAPUS
            // ->where('tanggal_berakhir', '>=', $now) // DIHAPUS - akan difilter di map()

            // Filter untuk jadwal yang bisa diakses:
            // 1. Belum pernah dikerjakan ATAU
            // 2. Sudah mulai tapi belum submit ATAU
            // 3. Terputus dan bisa dilanjutkan
            ->where(function ($query) use ($userId) {
                $query->whereDoesntHave('jawaban', function ($q) use ($userId) {
                    $q->where('id_user', $userId);
                })
                ->orWhereHas('hasil', function ($q) use ($userId) {
                    $q->where('id_user', $userId)
                      ->where(function($subQuery) {
                          $subQuery->where('is_submitted_test', false)
                                   ->orWhere(function($terputusQuery) {
                                       $terputusQuery->where('status_tes', 'terputus')
                                                    ->where('boleh_dilanjutkan', true);
                                   });
                      });
                });
            })
            ->get()
            ->map(function ($item) use ($userId, $now) {
                // Hitung status seperti di JadwalController
                $tanggalBerakhir = $item->tanggal_berakhir instanceof \Carbon\Carbon
                    ? $item->tanggal_berakhir
                    : \Carbon\Carbon::parse($item->tanggal_berakhir);
                $status = ($now->gt($tanggalBerakhir)) ? 'Tutup' : 'Buka';

                // Hanya tampilkan yang statusnya Buka
                if ($status !== 'Buka') {
                    return null;
                }

                $item->status = $status;
                $item->sudah_kerjakan_jadwal_sebelumnya = true;
                if ($item->jadwalSebelumnya) {
                    $item->sudah_kerjakan_jadwal_sebelumnya = \App\Models\Jawaban::where('id_user', $userId)
                        ->where('id_jadwal', $item->jadwalSebelumnya->id)
                        ->exists();
                }

                // Tambahkan informasi pendaftaran peserta
                $registration = JadwalPeserta::where('id_jadwal', $item->id)
                    ->where('id_peserta', $userId)
                    ->first();

                $item->status_pendaftaran = $registration ? $registration->status : null;
                $item->sudah_daftar = $registration !== null;
                $item->bisa_mulai_tes = $registration && $registration->status === 'disetujui';

                // Tambahan: Cek apakah waktu mulai tes sudah tiba
                $item->dapat_mulai_tes_sekarang = false;
                $item->menit_menuju_mulai_tes = null;

                if ($item->bisa_mulai_tes) {
                    // Jika ada waktu_mulai_tes yang diset, gunakan itu
                    // Jika tidak, gunakan tanggal_mulai
                    $waktuMulaiTes = $item->waktu_mulai_tes
                        ? Carbon::parse($item->waktu_mulai_tes)
                        : Carbon::parse($item->tanggal_mulai);

                    if ($now->gte($waktuMulaiTes)) {
                        $item->dapat_mulai_tes_sekarang = true;
                    } else {
                        $item->dapat_mulai_tes_sekarang = false;
                        $item->menit_menuju_mulai_tes = $now->diffInMinutes($waktuMulaiTes);
                    }
                }

                // Tambahkan informasi hasil tes jika ada
                $hasilTest = \App\Models\HasilTestPeserta::where('id_jadwal', $item->id)
                    ->where('id_user', $userId)
                    ->first();

                // Jika ada hasil test, hitung sisa waktu real-time
                if ($hasilTest) {
                    $hasilTest->sisa_waktu_detik_realtime = $hasilTest->getSisaWaktuRealTime();
                }

                $item->hasil_test = $hasilTest;

                return $item;
            })
            ->filter() // Hapus item yang null (status Tutup)
            ->values(); // Reset array keys setelah filter

        // Check apakah profil user lengkap
        $user = Auth::user();
        $isProfileComplete = $user->isProfileComplete();
        $missingProfileFields = $isProfileComplete ? [] : $user->getMissingProfileFields();

        return Inertia::render('peserta/daftar-tes/index', [
            'jadwal' => $jadwal,
            'isProfileComplete' => $isProfileComplete,
            'missingProfileFields' => $missingProfileFields,
            'debug' => [
                'total_jadwal_in_db' => $totalJadwalInDB,
                'jadwal_status_buka' => $jadwalStatusBuka,
                'jadwal_belum_dikerjakan' => $jadwalBelumDikerjakan,
                'total_jadwal_found' => $jadwal->count(),
                'current_time' => $now->format('Y-m-d H:i:s'),
                'user_id' => $userId,
                'note' => 'Filter: Hanya tampilkan jadwal dengan status BUKA (tanggal_berakhir >= sekarang)',
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
    // todo: cek lg business logicnya ada yg ketinggalan ga
    // track start time
    public function startTest(Request $request)
    {
        $request->validate([
            'id_jadwal' => 'required|exists:jadwal,id',
        ]);

        try {
            $user = Auth::user();
            $jadwalId = $request->id_jadwal;

            // Ambil jadwal dan soal
            $jadwal = Jadwal::with('soal')->findOrFail($jadwalId);

            // Check access control untuk jadwal ini
            if ($jadwal->access_mode === 'offline') {
                // Get client IP address with better detection
                $clientIP = 'unknown';
                $ipSources = [
                    'HTTP_CF_CONNECTING_IP',     // Cloudflare
                    'HTTP_CLIENT_IP',            // Proxy
                    'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
                    'HTTP_X_FORWARDED',          // Proxy
                    'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
                    'HTTP_FORWARDED_FOR',        // Proxy
                    'HTTP_FORWARDED',            // Proxy
                    'REMOTE_ADDR'                // Standard
                ];

                foreach ($ipSources as $source) {
                    if (!empty($_SERVER[$source])) {
                        $clientIP = $_SERVER[$source];
                        break;
                    }
                }

                // Handle comma-separated IPs (from proxies) - take the first one
                if (strpos($clientIP, ',') !== false) {
                    $ips = explode(',', $clientIP);
                    $clientIP = trim($ips[0]);
                }

                // Remove port if present
                if (strpos($clientIP, ':') !== false && substr_count($clientIP, ':') == 1) {
                    $clientIP = explode(':', $clientIP)[0];
                }

                $allowedIPs = array(
                    '::1','127.0.0.1',
                    '103.121.197.1','36.50.94.1','103.121.197.2','36.50.94.2','103.121.197.3','36.50.94.3',
                    '103.121.197.4','36.50.94.4','103.121.197.5','36.50.94.5','103.121.197.6','36.50.94.6',
                    '103.121.197.7','36.50.94.7','103.121.197.8','36.50.94.8','103.121.197.9','36.50.94.9',
                    '103.121.197.10','36.50.94.10','103.121.197.11','36.50.94.11','103.121.197.12','36.50.94.12',
                    '103.121.197.13','36.50.94.13','103.121.197.14','36.50.94.14','103.121.197.15','36.50.94.15',
                    '103.121.197.16','36.50.94.16','103.121.197.17','36.50.94.17','103.121.197.18','36.50.94.18',
                    '103.121.197.19','36.50.94.19','103.121.197.20','36.50.94.20','103.121.197.21','36.50.94.21',
                    '103.121.197.22','36.50.94.22','103.121.197.23','36.50.94.23','103.121.197.24','36.50.94.24',
                    '103.121.197.25','36.50.94.25','103.121.197.26','36.50.94.26','103.121.197.27','36.50.94.27',
                    '103.121.197.28','36.50.94.28','103.121.197.29','36.50.94.29','103.121.197.30','36.50.94.30',
                    '103.121.197.31','36.50.94.31','103.121.197.32','36.50.94.32','103.121.197.33','36.50.94.33',
                    '103.121.197.34','36.50.94.34','103.121.197.35','36.50.94.35','103.121.197.36','36.50.94.36',
                    '103.121.197.37','36.50.94.37','103.121.197.38','36.50.94.38','103.121.197.39','36.50.94.39',
                    '103.121.197.40','36.50.94.40','103.121.197.41','36.50.94.41','103.121.197.42','36.50.94.42',
                    '103.121.197.43','36.50.94.43','103.121.197.44','36.50.94.44','103.121.197.45','36.50.94.45',
                    '103.121.197.46','36.50.94.46','103.121.197.47','36.50.94.47','103.121.197.48','36.50.94.48',
                    '103.121.197.49','36.50.94.49','103.121.197.50','36.50.94.50','103.121.197.51','36.50.94.51',
                    '103.121.197.52','36.50.94.52','103.121.197.53','36.50.94.53','103.121.197.54','36.50.94.54',
                    '103.121.197.55','36.50.94.55','103.121.197.56','36.50.94.56','103.121.197.57','36.50.94.57',
                    '103.121.197.58','36.50.94.58','103.121.197.59','36.50.94.59','103.121.197.60','36.50.94.60',
                    '103.121.197.61','36.50.94.61','103.121.197.62','36.50.94.62','103.121.197.63','36.50.94.63',
                    '103.121.197.64','36.50.94.64','103.121.197.65','36.50.94.65','103.121.197.66','36.50.94.66',
                    '103.121.197.67','36.50.94.67','103.121.197.68','36.50.94.68','103.121.197.69','36.50.94.69',
                    '103.121.197.70','36.50.94.70','103.121.197.71','36.50.94.71','103.121.197.72','36.50.94.72',
                    '103.121.197.73','36.50.94.73','103.121.197.74','36.50.94.74','103.121.197.75','36.50.94.75',
                    '103.121.197.76','36.50.94.76','103.121.197.77','36.50.94.77','103.121.197.78','36.50.94.78',
                    '103.121.197.79','36.50.94.79','103.121.197.80','36.50.94.80','103.121.197.81','36.50.94.81',
                    '103.121.197.82','36.50.94.82','103.121.197.83','36.50.94.83','103.121.197.84','36.50.94.84',
                    '103.121.197.85','36.50.94.85','103.121.197.86','36.50.94.86','103.121.197.87','36.50.94.87',
                    '103.121.197.88','36.50.94.88','103.121.197.89','36.50.94.89','103.121.197.90','36.50.94.90',
                    '103.121.197.91','36.50.94.91','103.121.197.92','36.50.94.92','103.121.197.93','36.50.94.93',
                    '103.121.197.94','36.50.94.94','103.121.197.95','36.50.94.95','103.121.197.96','36.50.94.96',
                    '103.121.197.97','36.50.94.97','103.121.197.98','36.50.94.98','103.121.197.99','36.50.94.99',
                    '103.121.197.100','36.50.94.100','103.121.197.101','36.50.94.101','103.121.197.102','36.50.94.102',
                    '103.121.197.103','36.50.94.103','103.121.197.104','36.50.94.104','103.121.197.105','36.50.94.105',
                    '103.121.197.106','36.50.94.106','103.121.197.107','36.50.94.107','103.121.197.108','36.50.94.108',
                    '103.121.197.109','36.50.94.109','103.121.197.110','36.50.94.110','103.121.197.111','36.50.94.111',
                    '103.121.197.112','36.50.94.112','103.121.197.113','36.50.94.113','103.121.197.114','36.50.94.114',
                    '103.121.197.115','36.50.94.115','103.121.197.116','36.50.94.116','103.121.197.117','36.50.94.117',
                    '103.121.197.118','36.50.94.118','103.121.197.119','36.50.94.119','103.121.197.120','36.50.94.120',
                    '103.121.197.121','36.50.94.121','103.121.197.122','36.50.94.122','103.121.197.123','36.50.94.123',
                    '103.121.197.124','36.50.94.124','103.121.197.125','36.50.94.125','103.121.197.126','36.50.94.126',
                    '103.121.197.127','36.50.94.127','103.121.197.128','36.50.94.128','103.121.197.129','36.50.94.129',
                    '103.121.197.130','36.50.94.130','103.121.197.131','36.50.94.131','103.121.197.132','36.50.94.132',
                    '103.121.197.133','36.50.94.133','103.121.197.134','36.50.94.134','103.121.197.135','36.50.94.135',
                    '103.121.197.136','36.50.94.136','103.121.197.137','36.50.94.137','103.121.197.138','36.50.94.138',
                    '103.121.197.139','36.50.94.139','103.121.197.140','36.50.94.140','103.121.197.141','36.50.94.141',
                    '103.121.197.142','36.50.94.142','103.121.197.143','36.50.94.143','103.121.197.144','36.50.94.144',
                    '103.121.197.145','36.50.94.145','103.121.197.146','36.50.94.146','103.121.197.147','36.50.94.147',
                    '103.121.197.148','36.50.94.148','103.121.197.149','36.50.94.149','103.121.197.150','36.50.94.150',
                    '103.121.197.151','36.50.94.151','103.121.197.152','36.50.94.152','103.121.197.153','36.50.94.153',
                    '103.121.197.154','36.50.94.154','103.121.197.155','36.50.94.155','103.121.197.156','36.50.94.156',
                    '103.121.197.157','36.50.94.157','103.121.197.158','36.50.94.158','103.121.197.159','36.50.94.159',
                    '103.121.197.160','36.50.94.160','103.121.197.161','36.50.94.161','103.121.197.162','36.50.94.162',
                    '103.121.197.163','36.50.94.163','103.121.197.164','36.50.94.164','103.121.197.165','36.50.94.165',
                    '103.121.197.166','36.50.94.166','103.121.197.167','36.50.94.167','103.121.197.168','36.50.94.168',
                    '103.121.197.169','36.50.94.169','103.121.197.170','36.50.94.170','103.121.197.171','36.50.94.171',
                    '103.121.197.172','36.50.94.172','103.121.197.173','36.50.94.173','103.121.197.174','36.50.94.174',
                    '103.121.197.175','36.50.94.175','103.121.197.176','36.50.94.176','103.121.197.177','36.50.94.177',
                    '103.121.197.178','36.50.94.178','103.121.197.179','36.50.94.179','103.121.197.180','36.50.94.180',
                    '103.121.197.181','36.50.94.181','103.121.197.182','36.50.94.182','103.121.197.183','36.50.94.183',
                    '103.121.197.184','36.50.94.184','103.121.197.185','36.50.94.185','103.121.197.186','36.50.94.186',
                    '103.121.197.187','36.50.94.187','103.121.197.188','36.50.94.188','103.121.197.189','36.50.94.189',
                    '103.121.197.190','36.50.94.190','103.121.197.191','36.50.94.191','103.121.197.192','36.50.94.192',
                    '103.121.197.193','36.50.94.193','103.121.197.194','36.50.94.194','103.121.197.195','36.50.94.195',
                    '103.121.197.196','36.50.94.196','103.121.197.197','36.50.94.197','103.121.197.198','36.50.94.198',
                    '103.121.197.199','36.50.94.199','103.121.197.200','36.50.94.200','103.121.197.201','36.50.94.201',
                    '103.121.197.202','36.50.94.202','103.121.197.203','36.50.94.203','103.121.197.204','36.50.94.204',
                    '103.121.197.205','36.50.94.205','103.121.197.206','36.50.94.206','103.121.197.207','36.50.94.207',
                    '103.121.197.208','36.50.94.208','103.121.197.209','36.50.94.209','103.121.197.210','36.50.94.210',
                    '103.121.197.211','36.50.94.211','103.121.197.212','36.50.94.212','103.121.197.213','36.50.94.213',
                    '103.121.197.214','36.50.94.214','103.121.197.215','36.50.94.215','103.121.197.216','36.50.94.216',
                    '103.121.197.217','36.50.94.217','103.121.197.218','36.50.94.218','103.121.197.219','36.50.94.219',
                    '103.121.197.220','36.50.94.220','103.121.197.221','36.50.94.221','103.121.197.222','36.50.94.222',
                    '103.121.197.223','36.50.94.223','103.121.197.224','36.50.94.224','103.121.197.225','36.50.94.225',
                    '103.121.197.226','36.50.94.226','103.121.197.227','36.50.94.227','103.121.197.228','36.50.94.228',
                    '103.121.197.229','36.50.94.229','103.121.197.230','36.50.94.230','103.121.197.231','36.50.94.231',
                    '103.121.197.232','36.50.94.232','103.121.197.233','36.50.94.233','103.121.197.234','36.50.94.234',
                    '103.121.197.235','36.50.94.235','103.121.197.236','36.50.94.236','103.121.197.237','36.50.94.237',
                    '103.121.197.238','36.50.94.238','103.121.197.239','36.50.94.239','103.121.197.240','36.50.94.240',
                    '103.121.197.241','36.50.94.241','103.121.197.242','36.50.94.242','103.121.197.243','36.50.94.243',
                    '103.121.197.244','36.50.94.244','103.121.197.245','36.50.94.245','103.121.197.246','36.50.94.246',
                    '103.121.197.247','36.50.94.247','103.121.197.248','36.50.94.248','103.121.197.249','36.50.94.249',
                    '103.121.197.250','36.50.94.250','103.121.197.251','36.50.94.251','103.121.197.252','36.50.94.252',
                    '103.121.197.253','36.50.94.253','103.121.197.254','36.50.94.254'
                );

                // Check IP access for offline mode
                if (!in_array($clientIP, $allowedIPs)) {
                    return response()->json([
                        'error' => 'OFFLINE_MODE_RESTRICTED',
                        'details' => [
                            'client_ip' => $clientIP,
                            'test_name' => $jadwal->nama_jadwal,
                            'access_mode' => 'offline'
                        ],
                        'message' => 'Tes ini dikonfigurasi untuk mode offline dan hanya dapat diakses dari jaringan kampus universitas. IP Address Anda (' . $clientIP . ') tidak terdaftar dalam jaringan yang diizinkan.'
                    ], 403);
                }
            }

            // Cek apakah belum ada soal
            if ($jadwal->soal->isEmpty()) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini belum memiliki soal. Silakan hubungi penyelenggara.',
                ])->withInput();
            }

            // Cek apakah tes belum dimulai
            if (now()->lt(\Carbon\Carbon::parse($jadwal->tanggal_mulai))) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini belum dimulai.'
                ]);
            }

            // Cek apakah tes sudah ditutup
            if (now()->gt(\Carbon\Carbon::parse($jadwal->tanggal_berakhir))) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini sudah ditutup dan tidak dapat lagi dijawab.'
                ])->withInput();
            }

            // cek apakah user sudah pernah mengerjakan
            $hasil = \App\Models\HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->first();

            if ($hasil && $hasil->is_submitted_test) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini sudah selesai dan tidak dapat diakses kembali.'
                ]);
            }

            // Jika tes terputus dan belum diizinkan lanjut, redirect dengan pesan
            if ($hasil && $hasil->status_tes === 'terputus' && !$hasil->boleh_dilanjutkan) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes Anda terputus. Silakan hubungi pengawas untuk mengizinkan melanjutkan tes.'
                ]);
            }

            $hasil = HasilTestPeserta::firstOrCreate(
                [
                    'id_user' => $user->id,
                    'id_jadwal' => $jadwalId,
                ],
                [
                    'start_time' => now(),
                    'total_skor' => null,
                    'total_nilai' => null,
                ]
            );

            // Update status tes menjadi sedang mengerjakan dan set waktu mulai
            $hasil->update([
                'status_tes' => 'sedang_mengerjakan',
                'waktu_mulai_tes' => now(),
                'waktu_terakhir_aktif' => now(),
                'sisa_waktu_detik' => $jadwal->durasi * 60, // convert menit ke detik
            ]);

            return redirect()->route('peserta.soal', ['id' => $jadwalId]);
        } catch (\Exception $e) {
            return redirect()->route('peserta.daftar-tes')->withErrors([
                'error' => 'Terjadi kesalahan saat memulai tes. Silakan coba lagi.'
            ])->withInput();
        }
    }

    // get soal ujian
    public function soal($id)
    {
        try {
            $user = Auth::user();

            $jadwal = Jadwal::with('soal')->findOrFail($id);


            $hasil = HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwal->id)
                ->first();

            if (!$hasil) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini belum dimulai atau belum dijadwalkan untuk Anda.'
                ]);
            };

            if ($hasil->is_submitted_test) {
                // Jika tes terputus dan diizinkan dilanjutkan, reset is_submitted_test
                if ($hasil->status_tes === 'terputus' && $hasil->boleh_dilanjutkan) {
                    $hasil->update([
                        'is_submitted_test' => false,
                        'status_tes' => 'sedang_mengerjakan',
                        'waktu_terakhir_aktif' => now(),
                        'boleh_dilanjutkan' => false, // reset flag izin
                    ]);
                } else {
                    return redirect()->route('peserta.daftar-tes')->withErrors([
                        'error' => 'Tes ini sudah pernah dikerjakan dan tidak dapat diakses kembali.'
                    ]);
                }
            }

            // acak soal
            $soalQuery = $jadwal->soal();

            if ($jadwal->is_shuffled) {
                $soalQuery->inRandomOrder();
            }

            $soalData = $soalQuery->get();

            // prefill
            $jawaban = \App\Models\Jawaban::where('id_user', $user->id)
                ->where('id_jadwal', $jadwal->id)
                ->pluck('jawaban', 'id_soal');


            // hitung durasi berdasarkan sisa waktu real-time
            $startTime = Carbon::parse($hasil->start_time);
            $jadwalSelesai = Carbon::parse($jadwal->tanggal_berakhir);

            // Gunakan sisa waktu real-time (dengan logic pause/resume)
            $sisaWaktuDetik = $hasil->getSisaWaktuRealTime();

            Log::info('Perhitungan end_time:', [
                'sisa_waktu_real_time' => $sisaWaktuDetik,
                'status_tes' => $hasil->status_tes,
                'waktu_sekarang' => now()->format('Y-m-d H:i:s')
            ]);

            if ($sisaWaktuDetik > 0) {
                $endTime = now()->addSeconds($sisaWaktuDetik);
            } else {
                // Jika tidak ada sisa waktu, gunakan durasi penuh (first time)
                $durasi = $jadwal->durasi;
                $endTime = $startTime->copy()->addMinutes($durasi);
            }

            if ($endTime->gt($jadwalSelesai)) {
                $endTime = $jadwalSelesai->copy();
            }            if (now()->gt($endTime)) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Waktu tes sudah habis dan tidak dapat diakses kembali.'
                ]);
            }

            $endTimeTimestamp = $endTime->timestamp;

            // $activeSessionsCount = DB::table('sessions')
            //     ->where('user_id', $user->id)
            //     ->count();

            // if ($activeSessionsCount > 1) {
            //     return redirect()->route('peserta.daftar-tes')->withErrors([
            //         'error' => 'Anda sudah login di device lain. Silakan logout dari device lain untuk melanjutkan ujian.'
            //     ]);
            // }

            return Inertia::render('peserta/soal/index', [
                'jadwal' => $jadwal,
                'soal' => $soalData->map(function ($s) use ($user, $jadwal) {
                    $soalData = [
                        'id' => $s->id,
                        'id_jadwal' => $s->id_jadwal,
                        'jenis_soal' => $s->jenis_soal,
                        'tipe_jawaban' => $s->tipe_jawaban,
                        'pertanyaan' => $s->pertanyaan,
                        'media' => $s->media,
                        'skala_min' => $s->skala_min,
                        'skala_maks' => $s->skala_maks,
                        'skala_label_min' => $s->skala_label_min,
                        'skala_label_maks' => $s->skala_label_maks,
                        'equation' => $s->equation,
                    ];

                    // Jika shuffle jawaban diaktifkan, maka jawaban di-shuffle
                    if ($jadwal->is_answer_shuffled && in_array($s->jenis_soal, ['pilihan_ganda', 'multi_choice'])) {
                        $shuffledAnswers = $s->getShuffledAnswers($user->id);
                        $soalData = array_merge($soalData, $shuffledAnswers);
                    } else {
                        // Gunakan opsi asli
                        $soalData['opsi_a'] = $s->opsi_a;
                        $soalData['opsi_b'] = $s->opsi_b;
                        $soalData['opsi_c'] = $s->opsi_c;
                        $soalData['opsi_d'] = $s->opsi_d;
                    }

                    // Selalu tambahkan jawaban_benar dalam bentuk value asli (bukan opsi yang di-shuffle)
                    $soalData['jawaban_benar'] = $s->getJawabanBenarValue();
                    // Juga tambahkan opsi asli untuk debugging
                    $soalData['jawaban_benar_opsi'] = $s->jawaban_benar;

                    return $soalData;
                }),
                'end_time_timestamp' => $endTimeTimestamp,
                'jawaban_tersimpan' => $jawaban,
                'user' => [
                    'id' => Auth::user()->id,
                    'username' => Auth::user()->username,
                    'nama' => Auth::user()->nama,
                    'email' => Auth::user()->email,
                ],
            ]);
        } catch (\Exception $e) {
            return redirect()->route('peserta.daftar-tes')->withErrors([
                'error' => 'Terjadi kesalahan saat membuka halaman tes. Silakan coba lagi nanti.'
            ]);
        }
    }

    public function saveAnswer(Request $request)
    {
        $request->validate([
            'jadwal_id' => 'required|exists:jadwal,id',
            'id_soal' => 'required|exists:soal,id',
            'jawaban' => 'nullable|string',
        ]);

        try {
            $user = Auth::user();

            $existing = Jawaban::where([
                'id_user' => $user->id,
                'id_jadwal' => $request->jadwal_id,
                'id_soal' => $request->id_soal,
            ])->first();

            $jawabanBaru = is_array($request->jawaban)
                ? implode(',', $request->jawaban)
                : $request->jawaban;

            if ($existing && $existing->jawaban === $jawabanBaru) return;

            \App\Models\Jawaban::updateOrCreate(
                [
                    'id_user' => $user->id,
                    'id_jadwal' => $request->jadwal_id,
                    'id_soal' => $request->id_soal,
                ],
                [
                    'jawaban' => $request->jawaban ?? null,
                ]
            );

            return back();
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Gagal menyimpan jawaban.'
            ])->withInput();
        }
    }

    public function submit(Request $request)
    {
        $request->validate([
            'jadwal_id' => 'required|exists:jadwal,id',
            'reason' => 'nullable|string|in:tab_switch,time_up,manual,screenshot_violation',
        ]);

        $user = Auth::user();
        $jadwalId = $request->jadwal_id;
        $reason = $request->reason ?? 'manual';

        try {
            // Gunakan database transaction untuk memastikan atomicity
            DB::beginTransaction();

            $hasil = HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->lockForUpdate() // Prevent race condition
                ->first();

            if (!$hasil) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'Data tes tidak ditemukan.'
                ], 404);
            }

            // Cek apakah sudah pernah submit sebelumnya
            if ($hasil->is_submitted_test) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'error' => 'Tes ini sudah pernah dikumpulkan sebelumnya.',
                    'already_submitted' => true
                ], 409); // Conflict status
            }

            $soalIds = Soal::where('id_jadwal', $jadwalId)->pluck('id');

            $existingJawabanIds = Jawaban::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->pluck('id_soal');

            $missingSoalIds = $soalIds->diff($existingJawabanIds);

            // Insert jawaban null untuk soal yang belum dijawab
            foreach ($missingSoalIds as $idSoal) {
                Jawaban::create([
                    'id_user'   => $user->id,
                    'id_jadwal' => $jadwalId,
                    'id_soal'   => $idSoal,
                    'jawaban'   => null,
                ]);
            }

            // Tentukan status dan alasan berdasarkan reason
            $statusTes = 'selesai';
            $alasanTerputus = null;
            $sisaWaktu = null;

            switch ($reason) {
                case 'tab_switch':
                    $statusTes = 'terputus';
                    $alasanTerputus = 'Terdeteksi pindah tab atau window';
                    break;

                case 'screenshot_violation':
                    $statusTes = 'terputus';
                    $alasanTerputus = 'Pelanggaran screenshot berulang';
                    break;

                case 'time_up':
                    $statusTes = 'selesai';
                    $alasanTerputus = 'Waktu habis';
                    $sisaWaktu = 0;
                    break;

                default: // manual
                    $statusTes = 'selesai';
                    break;
            }

            // Hitung sisa waktu untuk tes terputus
            if ($statusTes === 'terputus' && $hasil->waktu_mulai_tes) {
                $jadwal = Jadwal::find($jadwalId);
                $waktuMulai = Carbon::parse($hasil->waktu_mulai_tes);
                $waktuSekarang = now();
                $waktuTerpakai = $waktuMulai->diffInSeconds($waktuSekarang);
                $totalWaktu = $jadwal->durasi * 60; // convert menit ke detik

                $sisaWaktu = max(0, $totalWaktu - $waktuTerpakai);

                // Log untuk debugging
                Log::info('Submit tes - perhitungan sisa waktu:', [
                    'user_id' => $user->id,
                    'jadwal_id' => $jadwalId,
                    'reason' => $reason,
                    'waktu_mulai' => $waktuMulai->toDateTimeString(),
                    'waktu_sekarang' => $waktuSekarang->toDateTimeString(),
                    'waktu_terpakai_detik' => $waktuTerpakai,
                    'total_waktu_detik' => $totalWaktu,
                    'sisa_waktu_detik' => $sisaWaktu
                ]);
            }

            // Update status submit dan status tes
            $updateData = [
                'is_submitted_test' => true,
                'status_tes' => $statusTes,
                'waktu_terakhir_aktif' => now(),
                'waktu_submit' => now(), // Track waktu submit
            ];

            if ($alasanTerputus) {
                $updateData['alasan_terputus'] = $alasanTerputus;
            }

            if ($sisaWaktu !== null) {
                $updateData['sisa_waktu_detik'] = $sisaWaktu;
            }

            $hasil->update($updateData);

            // Commit transaction
            DB::commit();

            // Log successful submit
            Log::info('Submit tes berhasil:', [
                'user_id' => $user->id,
                'jadwal_id' => $jadwalId,
                'reason' => $reason,
                'status_tes' => $statusTes,
                'alasan_terputus' => $alasanTerputus
            ]);

            // Return success response
            return response()->json([
                'success' => true,
                'message' => $statusTes === 'selesai'
                    ? 'Jawaban berhasil dikumpulkan dan tes selesai'
                    : 'Jawaban berhasil dikumpulkan namun tes terputus',
                'status' => $statusTes,
                'reason' => $alasanTerputus,
                'submit_time' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            // Log error
            Log::error('Submit tes gagal:', [
                'user_id' => $user->id,
                'jadwal_id' => $jadwalId,
                'reason' => $reason,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Terjadi kesalahan saat menyimpan jawaban. Silakan coba lagi.',
                'details' => app()->environment('local') ? $e->getMessage() : null
            ], 500);
        }
    }

    public function riwayat()
    {
        try {
            $userId = Auth::id();

            $riwayat = \App\Models\HasilTestPeserta::where('id_user', $userId)
                ->where('is_submitted_test', true)
                ->with('jadwal')
                ->orderBy('created_at', 'desc')
                ->get();

            return Inertia::render('peserta/riwayat/index', [
                'riwayat' => $riwayat,
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Gagal memuat riwayat. Silakan coba lagi nanti.'
            ]);
        }
    }

    /**
     * Method untuk melanjutkan tes yang terputus (jika diizinkan)
     */
    public function lanjutkanTes(Request $request)
    {
        $request->validate([
            'id_jadwal' => 'required|exists:jadwal,id',
        ]);

        try {
            $user = Auth::user();
            $jadwalId = $request->id_jadwal;

            // Ambil jadwal untuk cek access mode
            $jadwal = Jadwal::findOrFail($jadwalId);

            // Check access control untuk jadwal ini
            if ($jadwal->access_mode === 'offline') {
                // Get client IP address with better detection
                $clientIP = 'unknown';
                $ipSources = [
                    'HTTP_CF_CONNECTING_IP',     // Cloudflare
                    'HTTP_CLIENT_IP',            // Proxy
                    'HTTP_X_FORWARDED_FOR',      // Load balancer/proxy
                    'HTTP_X_FORWARDED',          // Proxy
                    'HTTP_X_CLUSTER_CLIENT_IP',  // Cluster
                    'HTTP_FORWARDED_FOR',        // Proxy
                    'HTTP_FORWARDED',            // Proxy
                    'REMOTE_ADDR'                // Standard
                ];

                foreach ($ipSources as $source) {
                    if (!empty($_SERVER[$source])) {
                        $clientIP = $_SERVER[$source];
                        break;
                    }
                }

                // Handle comma-separated IPs (from proxies) - take the first one
                if (strpos($clientIP, ',') !== false) {
                    $ips = explode(',', $clientIP);
                    $clientIP = trim($ips[0]);
                }

                // Remove port if present
                if (strpos($clientIP, ':') !== false && substr_count($clientIP, ':') == 1) {
                    $clientIP = explode(':', $clientIP)[0];
                }

                $allowedIPs = array(
                    '::1','127.0.0.1',
                    '103.121.197.1','36.50.94.1','103.121.197.2','36.50.94.2','103.121.197.3','36.50.94.3',
                    '103.121.197.4','36.50.94.4','103.121.197.5','36.50.94.5','103.121.197.6','36.50.94.6',
                    '103.121.197.7','36.50.94.7','103.121.197.8','36.50.94.8','103.121.197.9','36.50.94.9',
                    '103.121.197.10','36.50.94.10','103.121.197.11','36.50.94.11','103.121.197.12','36.50.94.12',
                    '103.121.197.13','36.50.94.13','103.121.197.14','36.50.94.14','103.121.197.15','36.50.94.15',
                    '103.121.197.16','36.50.94.16','103.121.197.17','36.50.94.17','103.121.197.18','36.50.94.18',
                    '103.121.197.19','36.50.94.19','103.121.197.20','36.50.94.20','103.121.197.21','36.50.94.21',
                    '103.121.197.22','36.50.94.22','103.121.197.23','36.50.94.23','103.121.197.24','36.50.94.24',
                    '103.121.197.25','36.50.94.25','103.121.197.26','36.50.94.26','103.121.197.27','36.50.94.27',
                    '103.121.197.28','36.50.94.28','103.121.197.29','36.50.94.29','103.121.197.30','36.50.94.30',
                    '103.121.197.31','36.50.94.31','103.121.197.32','36.50.94.32','103.121.197.33','36.50.94.33',
                    '103.121.197.34','36.50.94.34','103.121.197.35','36.50.94.35','103.121.197.36','36.50.94.36',
                    '103.121.197.37','36.50.94.37','103.121.197.38','36.50.94.38','103.121.197.39','36.50.94.39',
                    '103.121.197.40','36.50.94.40','103.121.197.41','36.50.94.41','103.121.197.42','36.50.94.42',
                    '103.121.197.43','36.50.94.43','103.121.197.44','36.50.94.44','103.121.197.45','36.50.94.45',
                    '103.121.197.46','36.50.94.46','103.121.197.47','36.50.94.47','103.121.197.48','36.50.94.48',
                    '103.121.197.49','36.50.94.49','103.121.197.50','36.50.94.50','103.121.197.51','36.50.94.51',
                    '103.121.197.52','36.50.94.52','103.121.197.53','36.50.94.53','103.121.197.54','36.50.94.54',
                    '103.121.197.55','36.50.94.55','103.121.197.56','36.50.94.56','103.121.197.57','36.50.94.57',
                    '103.121.197.58','36.50.94.58','103.121.197.59','36.50.94.59','103.121.197.60','36.50.94.60',
                    '103.121.197.61','36.50.94.61','103.121.197.62','36.50.94.62','103.121.197.63','36.50.94.63',
                    '103.121.197.64','36.50.94.64','103.121.197.65','36.50.94.65','103.121.197.66','36.50.94.66',
                    '103.121.197.67','36.50.94.67','103.121.197.68','36.50.94.68','103.121.197.69','36.50.94.69',
                    '103.121.197.70','36.50.94.70','103.121.197.71','36.50.94.71','103.121.197.72','36.50.94.72',
                    '103.121.197.73','36.50.94.73','103.121.197.74','36.50.94.74','103.121.197.75','36.50.94.75',
                    '103.121.197.76','36.50.94.76','103.121.197.77','36.50.94.77','103.121.197.78','36.50.94.78',
                    '103.121.197.79','36.50.94.79','103.121.197.80','36.50.94.80','103.121.197.81','36.50.94.81',
                    '103.121.197.82','36.50.94.82','103.121.197.83','36.50.94.83','103.121.197.84','36.50.94.84',
                    '103.121.197.85','36.50.94.85','103.121.197.86','36.50.94.86','103.121.197.87','36.50.94.87',
                    '103.121.197.88','36.50.94.88','103.121.197.89','36.50.94.89','103.121.197.90','36.50.94.90',
                    '103.121.197.91','36.50.94.91','103.121.197.92','36.50.94.92','103.121.197.93','36.50.94.93',
                    '103.121.197.94','36.50.94.94','103.121.197.95','36.50.94.95','103.121.197.96','36.50.94.96',
                    '103.121.197.97','36.50.94.97','103.121.197.98','36.50.94.98','103.121.197.99','36.50.94.99',
                    '103.121.197.100','36.50.94.100','103.121.197.101','36.50.94.101','103.121.197.102','36.50.94.102',
                    '103.121.197.103','36.50.94.103','103.121.197.104','36.50.94.104','103.121.197.105','36.50.94.105',
                    '103.121.197.106','36.50.94.106','103.121.197.107','36.50.94.107','103.121.197.108','36.50.94.108',
                    '103.121.197.109','36.50.94.109','103.121.197.110','36.50.94.110','103.121.197.111','36.50.94.111',
                    '103.121.197.112','36.50.94.112','103.121.197.113','36.50.94.113','103.121.197.114','36.50.94.114',
                    '103.121.197.115','36.50.94.115','103.121.197.116','36.50.94.116','103.121.197.117','36.50.94.117',
                    '103.121.197.118','36.50.94.118','103.121.197.119','36.50.94.119','103.121.197.120','36.50.94.120',
                    '103.121.197.121','36.50.94.121','103.121.197.122','36.50.94.122','103.121.197.123','36.50.94.123',
                    '103.121.197.124','36.50.94.124','103.121.197.125','36.50.94.125','103.121.197.126','36.50.94.126',
                    '103.121.197.127','36.50.94.127','103.121.197.128','36.50.94.128','103.121.197.129','36.50.94.129',
                    '103.121.197.130','36.50.94.130','103.121.197.131','36.50.94.131','103.121.197.132','36.50.94.132',
                    '103.121.197.133','36.50.94.133','103.121.197.134','36.50.94.134','103.121.197.135','36.50.94.135',
                    '103.121.197.136','36.50.94.136','103.121.197.137','36.50.94.137','103.121.197.138','36.50.94.138',
                    '103.121.197.139','36.50.94.139','103.121.197.140','36.50.94.140','103.121.197.141','36.50.94.141',
                    '103.121.197.142','36.50.94.142','103.121.197.143','36.50.94.143','103.121.197.144','36.50.94.144',
                    '103.121.197.145','36.50.94.145','103.121.197.146','36.50.94.146','103.121.197.147','36.50.94.147',
                    '103.121.197.148','36.50.94.148','103.121.197.149','36.50.94.149','103.121.197.150','36.50.94.150',
                    '103.121.197.151','36.50.94.151','103.121.197.152','36.50.94.152','103.121.197.153','36.50.94.153',
                    '103.121.197.154','36.50.94.154','103.121.197.155','36.50.94.155','103.121.197.156','36.50.94.156',
                    '103.121.197.157','36.50.94.157','103.121.197.158','36.50.94.158','103.121.197.159','36.50.94.159',
                    '103.121.197.160','36.50.94.160','103.121.197.161','36.50.94.161','103.121.197.162','36.50.94.162',
                    '103.121.197.163','36.50.94.163','103.121.197.164','36.50.94.164','103.121.197.165','36.50.94.165',
                    '103.121.197.166','36.50.94.166','103.121.197.167','36.50.94.167','103.121.197.168','36.50.94.168',
                    '103.121.197.169','36.50.94.169','103.121.197.170','36.50.94.170','103.121.197.171','36.50.94.171',
                    '103.121.197.172','36.50.94.172','103.121.197.173','36.50.94.173','103.121.197.174','36.50.94.174',
                    '103.121.197.175','36.50.94.175','103.121.197.176','36.50.94.176','103.121.197.177','36.50.94.177',
                    '103.121.197.178','36.50.94.178','103.121.197.179','36.50.94.179','103.121.197.180','36.50.94.180',
                    '103.121.197.181','36.50.94.181','103.121.197.182','36.50.94.182','103.121.197.183','36.50.94.183',
                    '103.121.197.184','36.50.94.184','103.121.197.185','36.50.94.185','103.121.197.186','36.50.94.186',
                    '103.121.197.187','36.50.94.187','103.121.197.188','36.50.94.188','103.121.197.189','36.50.94.189',
                    '103.121.197.190','36.50.94.190','103.121.197.191','36.50.94.191','103.121.197.192','36.50.94.192',
                    '103.121.197.193','36.50.94.193','103.121.197.194','36.50.94.194','103.121.197.195','36.50.94.195',
                    '103.121.197.196','36.50.94.196','103.121.197.197','36.50.94.197','103.121.197.198','36.50.94.198',
                    '103.121.197.199','36.50.94.199','103.121.197.200','36.50.94.200','103.121.197.201','36.50.94.201',
                    '103.121.197.202','36.50.94.202','103.121.197.203','36.50.94.203','103.121.197.204','36.50.94.204',
                    '103.121.197.205','36.50.94.205','103.121.197.206','36.50.94.206','103.121.197.207','36.50.94.207',
                    '103.121.197.208','36.50.94.208','103.121.197.209','36.50.94.209','103.121.197.210','36.50.94.210',
                    '103.121.197.211','36.50.94.211','103.121.197.212','36.50.94.212','103.121.197.213','36.50.94.213',
                    '103.121.197.214','36.50.94.214','103.121.197.215','36.50.94.215','103.121.197.216','36.50.94.216',
                    '103.121.197.217','36.50.94.217','103.121.197.218','36.50.94.218','103.121.197.219','36.50.94.219',
                    '103.121.197.220','36.50.94.220','103.121.197.221','36.50.94.221','103.121.197.222','36.50.94.222',
                    '103.121.197.223','36.50.94.223','103.121.197.224','36.50.94.224','103.121.197.225','36.50.94.225',
                    '103.121.197.226','36.50.94.226','103.121.197.227','36.50.94.227','103.121.197.228','36.50.94.228',
                    '103.121.197.229','36.50.94.229','103.121.197.230','36.50.94.230','103.121.197.231','36.50.94.231',
                    '103.121.197.232','36.50.94.232','103.121.197.233','36.50.94.233','103.121.197.234','36.50.94.234',
                    '103.121.197.235','36.50.94.235','103.121.197.236','36.50.94.236','103.121.197.237','36.50.94.237',
                    '103.121.197.238','36.50.94.238','103.121.197.239','36.50.94.239','103.121.197.240','36.50.94.240',
                    '103.121.197.241','36.50.94.241','103.121.197.242','36.50.94.242','103.121.197.243','36.50.94.243',
                    '103.121.197.244','36.50.94.244','103.121.197.245','36.50.94.245','103.121.197.246','36.50.94.246',
                    '103.121.197.247','36.50.94.247','103.121.197.248','36.50.94.248','103.121.197.249','36.50.94.249',
                    '103.121.197.250','36.50.94.250','103.121.197.251','36.50.94.251','103.121.197.252','36.50.94.252',
                    '103.121.197.253','36.50.94.253','103.121.197.254','36.50.94.254'
                );

                // Check IP access for offline mode
                if (!in_array($clientIP, $allowedIPs)) {
                    return response()->json([
                        'error' => 'OFFLINE_MODE_RESTRICTED',
                        'details' => [
                            'client_ip' => $clientIP,
                            'test_name' => $jadwal->nama_jadwal,
                            'access_mode' => 'offline'
                        ],
                        'message' => 'Tes ini dikonfigurasi untuk mode offline dan hanya dapat diakses dari jaringan kampus universitas. IP Address Anda (' . $clientIP . ') tidak terdaftar dalam jaringan yang diizinkan.'
                    ], 403);
                }
            }

            $hasil = HasilTestPeserta::where('id_user', $user->id)
                ->where('id_jadwal', $jadwalId)
                ->first();

            if (!$hasil) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Data tes tidak ditemukan.'
                ]);
            }

            if (!$hasil->bisaDilanjutkan()) {
                return redirect()->route('peserta.daftar-tes')->withErrors([
                    'error' => 'Tes ini tidak dapat dilanjutkan.'
                ]);
            }

            // Update status tes menjadi sedang mengerjakan lagi
            $hasil->update([
                'status_tes' => 'sedang_mengerjakan',
                'waktu_terakhir_aktif' => now(),
                'waktu_resume_tes' => now(), // SET WAKTU RESUME
                'boleh_dilanjutkan' => false, // reset flag izin
                'is_submitted_test' => false, // allow to continue
                'sisa_waktu_detik' => $hasil->getSisaWaktuRealTime(), // update dengan sisa waktu real-time
            ]);

            return redirect()->route('peserta.soal', ['id' => $jadwalId]);
        } catch (\Exception $e) {
            return redirect()->route('peserta.daftar-tes')->withErrors([
                'error' => 'Terjadi kesalahan saat melanjutkan tes.'
            ]);
        }
    }
}
