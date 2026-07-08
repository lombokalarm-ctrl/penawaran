/**
 * Format number to Indonesian Rupiah currency format
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format ISO Date string to Indonesian date layout (e.g., "7 Juli 2026")
 */
export function formatIndonesianDate(dateString: string): string {
  if (!dateString) return '-';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Helper to translate number into words in Indonesian (e.g. 1500000 -> "Satu Juta Lima Ratus Ribu")
 * Extremely useful for formal corporate receipts and invoice agreements.
 */
export function terbilang(nominal: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  
  const num = Math.floor(nominal);
  if (num < 12) {
    return bilangan[num];
  } else if (num < 20) {
    return terbilang(num - 10) + ' Belas';
  } else if (num < 100) {
    return terbilang(Math.floor(num / 10)) + ' Puluh ' + terbilang(num % 10);
  } else if (num < 200) {
    return 'Seratus ' + terbilang(num - 100);
  } else if (num < 1000) {
    return terbilang(Math.floor(num / 100)) + ' Ratus ' + terbilang(num % 100);
  } else if (num < 2000) {
    return 'Seribu ' + terbilang(num - 1000);
  } else if (num < 1000000) {
    return terbilang(Math.floor(num / 1000)) + ' Ribu ' + terbilang(num % 1000);
  } else if (num < 1000000000) {
    return terbilang(Math.floor(num / 1000000)) + ' Juta ' + terbilang(num % 1000000);
  } else if (num < 1000000000000) {
    return terbilang(Math.floor(num / 1000000000)) + ' Miliar ' + terbilang(num % 1000000000);
  } else {
    return 'Angka terlalu besar';
  }
}

export function formatTerbilangRupiah(value: number): string {
  const word = terbilang(value).trim();
  if (!word) return 'Nol Rupiah';
  // Capitalize first letters
  const capitalized = word.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  return `${capitalized} Rupiah`;
}
