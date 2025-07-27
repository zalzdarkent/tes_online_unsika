export const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return '';

    // Handle format dari database yang langsung: "2025-07-23 10:30:00"
    let dateStr = dateTimeString;

    // Remove timezone 'Z' jika ada
    if (dateStr.includes('Z')) {
        dateStr = dateStr.replace('Z', '');
    }

    // Remove microseconds (.000000) jika ada
    if (dateStr.includes('.')) {
        dateStr = dateStr.split('.')[0];
    }

    // Replace 'T' dengan spasi jika ada
    if (dateStr.includes('T')) {
        dateStr = dateStr.replace('T', ' ');
    }

    // Ambil bagian tanggal dan waktu
    const parts = dateStr.trim().split(' ');
    if (parts.length < 2) {
        console.log('Invalid date format:', dateTimeString);
        return dateTimeString;
    }

    const datePart = parts[0]; // 2025-07-23
    const timePart = parts[1]; // 10:30:00

    const [year, month, day] = datePart.split('-');
    const timeComponents = timePart.split(':');
    const hour = timeComponents[0];
    const minute = timeComponents[1];

    if (!year || !month || !day || !hour || !minute) {
        console.log('Missing date/time components');
        return dateTimeString;
    }

    // Format manual tanpa Date object untuk menghindari timezone issues
    const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    const formattedTime = `${hour.padStart(2, '0')}.${minute.padStart(2, '0')}`;

    const result = `${formattedDate}, ${formattedTime}`;

    return result;
};
