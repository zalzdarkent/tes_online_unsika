export const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return '';

    let dateStr = dateTimeString;

    // Bersihkan format ISO
    if (dateStr.includes('Z')) {
        dateStr = dateStr.replace('Z', '');
    }
    if (dateStr.includes('.')) {
        dateStr = dateStr.split('.')[0];
    }
    if (dateStr.includes('T')) {
        dateStr = dateStr.replace('T', ' ');
    }

    // Ambil hanya bagian tanggal
    const parts = dateStr.trim().split(' ');
    const datePart = parts[0]; // contoh: 2025-08-04

    const [year, month, day] = datePart.split('-');

    if (!year || !month || !day) return dateTimeString;

    // Nama bulan Indonesia
    const bulanIndo = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const namaBulan = bulanIndo[parseInt(month) - 1];

    return `${parseInt(day)} ${namaBulan} ${year}`;
};
