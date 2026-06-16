const XLSX = require('xlsx');
const fs = require('fs');

const wb = XLSX.readFile('Laporan_Keuangan.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(ws);

const monthKeys = ['SEPTEMBER', 'NOVEMBER', 'DESEMBER', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL'];
const pctKeys = ['__EMPTY', '__EMPTY_1', '__EMPTY_2', '__EMPTY_3', '__EMPTY_4', '__EMPTY_5', '__EMPTY_6'];
const monthLabels = ['Sep', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr'];

function parseVal(v) {
    if (v === undefined || v === null || v === '') return 0;
    if (typeof v === 'number') return v;
    // Handle comma decimal separator: "44802288,29" → 44802288.29
    const s = String(v).replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
}

function parsePct(v) {
    if (v === undefined || v === null || v === '') return 0;
    if (typeof v === 'number') return v; // Already in fraction form (0.67 = 67%)
    const s = String(v);
    if (s.includes('%')) {
        // Already in percent form like "0,23%" → convert to fraction
        const num = parseFloat(s.replace('%', '').replace(',', '.'));
        return isNaN(num) ? 0 : num / 100;
    }
    const num = parseFloat(s.replace(',', '.'));
    return isNaN(num) ? 0 : num;
}

function getValues(row) {
    if (!row) return monthKeys.map(() => 0);
    return monthKeys.map(k => parseVal(row[k]));
}

function getPcts(row) {
    if (!row) return pctKeys.map(() => 0);
    return pctKeys.map(k => parsePct(row[k]));
}

function findRow(keyword) {
    return rawData.find(r => r.Deskripsi && r.Deskripsi.includes(keyword));
}

// Extract key summary rows
const summary = {
    penjualan: getValues(findRow('40000 Penjualan')),
    hpp: getValues(findRow('SubTotal Biaya pokok penjualan')),
    labaKotor: getValues(findRow('SubTotal Laba kotor')),
    biayaOperasional: getValues(findRow('SubTotal Biaya Operasional')),
    pendapatanOperasional: getValues(findRow('Total Pendapatan bersih operasional')),
    biayaNonOperasional: getValues(findRow('SubTotal Biaya non operasional')),
    sewaTempat: getValues(findRow('SEWA TEMPAT')),
    labaBersih: getValues(findRow('Total Laba bersih')),
    realLaba: getValues(findRow('REAL LABA'))
};

// Extract overhead detail
const overhead = {
    gaji: getValues(findRow('60100 Biaya gaji')),
    utilitas: getValues(findRow('60200 Biaya air listrik')),
    perlengkapan: getValues(findRow('60300 Biaya perlengkapan')),
    penyusutan: getValues(findRow('60400 Biaya penyusutan'))
};

// Extract other expenses detail
const biayaLain = {
    pengeluaranLain: getValues(findRow('80000 Pengeluaran lain')),
    feeEwallet: getValues(findRow('80003 Fee E-wallet')),
    penyesuaianBarang: getValues(findRow('81000 Penyesuaian Barang'))
};

// Build all rows for P&L table
const allRows = rawData.map(row => {
    const desc = row.Deskripsi || '';
    const hasValues = monthKeys.some(k => row[k] !== undefined && row[k] !== null);
    const isHeader = !hasValues && desc !== '';
    const isSubtotal = desc.startsWith('SubTotal') || desc.startsWith('Total') || desc === 'REAL LABA' || desc === 'SEWA TEMPAT';

    return {
        deskripsi: desc,
        values: getValues(row),
        percentages: getPcts(row),
        isHeader: isHeader,
        isSubtotal: isSubtotal
    };
});

const financeData = {
    months: monthLabels,
    monthsFull: monthKeys,
    summary: summary,
    overhead: overhead,
    biayaLain: biayaLain,
    allRows: allRows
};

fs.writeFileSync('finance_data.js', 'window.financeData = ' + JSON.stringify(financeData, null, 2) + ';');
console.log('finance_data.js generated successfully!');
console.log('Months:', monthLabels);
console.log('Penjualan:', summary.penjualan);
console.log('HPP:', summary.hpp);
console.log('Laba Kotor:', summary.labaKotor);
console.log('Real Laba:', summary.realLaba);
