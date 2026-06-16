let financeTrendChartInstance = null;
let financeMarginChartInstance = null;
let financeCostChartInstance = null;

// Mapping from bulanFilter values → financeData month index
let BULAN_TO_FINANCE_INDEX = {};

function initFinanceDashboard() {
    if (!window.financeData) {
        console.error('No finance data found in window.financeData');
        return;
    }

    // Build dynamic mapping if available
    if (window.financeData.monthFilterNames) {
        window.financeData.monthFilterNames.forEach((name, idx) => {
            BULAN_TO_FINANCE_INDEX[name] = idx;
        });
    }

    try {
        updateFinanceSection();
    } catch (error) {
        console.error('Error rendering finance dashboard:', error);
    }

    // Listen to filter changes
    const bulanFilter = document.getElementById('bulanFilter');
    if (bulanFilter) {
        bulanFilter.addEventListener('change', updateFinanceSection);
    }
}

function getSelectedFinanceMonth() {
    const bulanFilter = document.getElementById('bulanFilter');
    if (!bulanFilter) return null;
    const val = bulanFilter.value;
    if (val === 'All') return null; // Show all months
    return val;
}

function updateFinanceSection() {
    updateFinanceKPIs();
    updateFinanceCharts();
    renderFinanceTable();
}

function updateFinanceKPIs() {
    const data = window.financeData.summary;
    const months = window.financeData.months;
    const selectedBulan = getSelectedFinanceMonth();

    let idx = -1;
    let periodLabel = "Tidak Ada Data";

    if (selectedBulan) {
        if (BULAN_TO_FINANCE_INDEX[selectedBulan] !== undefined) {
            idx = BULAN_TO_FINANCE_INDEX[selectedBulan];
            periodLabel = selectedBulan;
        } else {
            idx = -1;
            periodLabel = selectedBulan + ' (Kosong)';
        }
    } else {
        // Semua Bulan -> default KPI to last available month
        idx = data.penjualan.length - 1;
        periodLabel = "Semua Bulan";
    }

    const penjualan = idx >= 0 ? data.penjualan[idx] || 0 : 0;
    const hpp = idx >= 0 ? data.hpp[idx] || 0 : 0;
    const labaKotor = idx >= 0 ? data.labaKotor[idx] || 0 : 0;
    const biayaOp = idx >= 0 ? data.biayaOperasional[idx] || 0 : 0;
    const realLaba = idx >= 0 ? data.realLaba[idx] || 0 : 0;
    const grossMargin = penjualan > 0 ? (labaKotor / penjualan) * 100 : 0;
    const netMargin = penjualan > 0 ? (realLaba / penjualan) * 100 : 0;

    // Update period label
    const periodEl = document.getElementById('finPeriodLabel');
    if (periodEl) periodEl.textContent = `Bulan: ${periodLabel}`;

    // Update values
    setFinVal('finValPenjualan', penjualan);
    setFinVal('finValHPP', hpp);
    setFinVal('finValLabaKotor', labaKotor);
    setFinVal('finValBiayaOp', biayaOp);
    setFinVal('finValRealLaba', realLaba);

    // Update margins
    const marginEl = document.getElementById('finMarginKotor');
    if (marginEl) marginEl.textContent = grossMargin.toFixed(1) + '%';

    const netMarginEl = document.getElementById('finMarginNet');
    if (netMarginEl) netMarginEl.textContent = netMargin.toFixed(1) + '%';

    // Update bar widths for visual comparison
    const maxVal = Math.max(penjualan, 1);
    setBarWidth('finBarPenjualan', penjualan, maxVal);
    setBarWidth('finBarHPP', hpp, maxVal);
    setBarWidth('finBarLabaKotor', labaKotor, maxVal);
    setBarWidth('finBarBiayaOp', biayaOp, maxVal);
    setBarWidth('finBarRealLaba', realLaba, maxVal);
}

function setFinVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = formatRupiah(value);
}

function setBarWidth(id, value, maxVal) {
    const el = document.getElementById(id);
    if (el) {
        const pct = Math.max((value / maxVal) * 100, 2);
        el.style.width = pct + '%';
    }
}

function updateFinanceCharts() {
    const data = window.financeData.summary;
    const selectedBulan = getSelectedFinanceMonth();

    let labels, datasets, chartType;

    if (selectedBulan) {
        if (BULAN_TO_FINANCE_INDEX[selectedBulan] !== undefined) {
            const idx = BULAN_TO_FINANCE_INDEX[selectedBulan];
            labels = [window.financeData.months[idx]];
            datasets = {
                penjualan: [data.penjualan[idx] || 0],
                hpp: [data.hpp[idx] || 0],
                labaKotor: [data.labaKotor[idx] || 0],
                biayaOp: [data.biayaOperasional[idx] || 0],
                pendOp: [data.pendapatanOperasional[idx] || 0],
                biayaNonOp: [data.biayaNonOperasional[idx] || 0],
                sewa: [data.sewaTempat[idx] || 0],
                realLaba: [data.realLaba[idx] || 0]
            };
            chartType = 'bar';
        } else {
            labels = [selectedBulan];
            datasets = {
                penjualan: [0], hpp: [0], labaKotor: [0], biayaOp: [0],
                pendOp: [0], biayaNonOp: [0], sewa: [0], realLaba: [0]
            };
            chartType = 'bar';
        }
    } else {
        labels = window.financeData.months;
        datasets = {
            penjualan: data.penjualan,
            hpp: data.hpp,
            labaKotor: data.labaKotor,
            biayaOp: data.biayaOperasional,
            pendOp: data.pendapatanOperasional,
            biayaNonOp: data.biayaNonOperasional,
            sewa: data.sewaTempat,
            realLaba: data.realLaba
        };
        chartType = 'line';
    }

    // 1. Trend Chart (Pendapatan & Laba)
    const trendCtx = document.getElementById('financeTrendChart').getContext('2d');
    if (financeTrendChartInstance) financeTrendChartInstance.destroy();
    
    financeTrendChartInstance = new Chart(trendCtx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Penjualan',
                    data: datasets.penjualan,
                    borderColor: '#3b82f6',
                    backgroundColor: chartType === 'bar' ? 'rgba(59,130,246,0.7)' : 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    borderRadius: chartType === 'bar' ? 8 : 0
                },
                {
                    label: 'Laba Kotor',
                    data: datasets.labaKotor,
                    borderColor: '#f59e0b',
                    backgroundColor: chartType === 'bar' ? 'rgba(245,158,11,0.7)' : 'transparent',
                    borderWidth: 2,
                    tension: 0.3,
                    borderRadius: chartType === 'bar' ? 8 : 0
                },
                {
                    label: 'Real Laba',
                    data: datasets.realLaba,
                    borderColor: '#10b981',
                    backgroundColor: chartType === 'bar' ? 'rgba(16,185,129,0.7)' : 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: chartType !== 'bar',
                    borderRadius: chartType === 'bar' ? 8 : 0
                }
            ]
        },
        options: getChartOptions('Rp')
    });

    // 2. Margin Profitabilitas
    const grossMargin = datasets.labaKotor.map((val, i) => (val / (datasets.penjualan[i] || 1)) * 100);
    const opMargin = datasets.pendOp.map((val, i) => (val / (datasets.penjualan[i] || 1)) * 100);
    const netMargin = datasets.realLaba.map((val, i) => (val / (datasets.penjualan[i] || 1)) * 100);

    const marginCtx = document.getElementById('financeMarginChart').getContext('2d');
    if (financeMarginChartInstance) financeMarginChartInstance.destroy();
    
    financeMarginChartInstance = new Chart(marginCtx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Gross Margin %',
                    data: grossMargin,
                    borderColor: '#f59e0b',
                    backgroundColor: chartType === 'bar' ? 'rgba(245,158,11,0.7)' : 'transparent',
                    borderDash: chartType === 'bar' ? [] : [5, 5],
                    tension: 0.3,
                    borderRadius: chartType === 'bar' ? 8 : 0
                },
                {
                    label: 'Operating Margin %',
                    data: opMargin,
                    borderColor: '#8b5cf6',
                    backgroundColor: chartType === 'bar' ? 'rgba(139,92,246,0.7)' : 'transparent',
                    borderDash: chartType === 'bar' ? [] : [5, 5],
                    tension: 0.3,
                    borderRadius: chartType === 'bar' ? 8 : 0
                },
                {
                    label: 'Net Margin (Real) %',
                    data: netMargin,
                    borderColor: '#10b981',
                    backgroundColor: chartType === 'bar' ? 'rgba(16,185,129,0.7)' : 'transparent',
                    borderWidth: 3,
                    tension: 0.3,
                    borderRadius: chartType === 'bar' ? 8 : 0
                }
            ]
        },
        options: getChartOptions('%')
    });

    // 3. Struktur Biaya (Stacked Bar)
    const costCtx = document.getElementById('financeCostChart').getContext('2d');
    if (financeCostChartInstance) financeCostChartInstance.destroy();
    
    financeCostChartInstance = new Chart(costCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'HPP',
                    data: datasets.hpp,
                    backgroundColor: '#ef4444',
                    borderRadius: 4
                },
                {
                    label: 'Biaya Operasional',
                    data: datasets.biayaOp,
                    backgroundColor: '#f97316',
                    borderRadius: 4
                },
                {
                    label: 'Biaya Non-Operasional',
                    data: datasets.biayaNonOp,
                    backgroundColor: '#eab308',
                    borderRadius: 4
                },
                {
                    label: 'Sewa Tempat',
                    data: datasets.sewa,
                    backgroundColor: '#6366f1',
                    borderRadius: 4
                }
            ]
        },
        options: {
            ...getChartOptions('Rp'),
            scales: {
                x: { stacked: true, grid: { display: false }, ticks: { color: '#cbd5e1' } },
                y: { 
                    stacked: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: '#cbd5e1',
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000).toFixed(0) + 'M';
                        }
                    }
                }
            }
        }
    });
}

function getChartOptions(format) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#cbd5e1', padding: 16, usePointStyle: true }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (format === 'Rp') {
                            label += formatRupiah(context.raw);
                        } else {
                            label += context.raw.toFixed(1) + '%';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#cbd5e1' } },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                    color: '#cbd5e1',
                    callback: function(value) {
                        if (format === 'Rp') {
                            return 'Rp ' + (value / 1000000).toFixed(0) + 'M';
                        }
                        return value.toFixed(0) + '%';
                    }
                }
            }
        }
    };
}

function renderFinanceTable() {
    const tableBody = document.getElementById('financeTableBody');
    tableBody.innerHTML = '';
    
    const { allRows, months } = window.financeData;
    const selectedBulan = getSelectedFinanceMonth();
    
    let monthIndices;
    let displayMonths;

    if (selectedBulan) {
        if (BULAN_TO_FINANCE_INDEX[selectedBulan] !== undefined) {
            const idx = BULAN_TO_FINANCE_INDEX[selectedBulan];
            monthIndices = [idx];
            displayMonths = [months[idx]];
        } else {
            monthIndices = [-1]; // Explicitly empty
            displayMonths = [selectedBulan + ' (Kosong)'];
        }
    } else {
        monthIndices = months.map((_, i) => i);
        displayMonths = months;
    }

    // Create header row for months
    const thead = document.querySelector('#financeTable thead tr');
    while (thead.children.length > 1) {
        thead.removeChild(thead.lastChild);
    }
    
    displayMonths.forEach(m => {
        const th = document.createElement('th');
        th.textContent = m;
        th.className = 'text-right';
        thead.appendChild(th);
    });

    // Populate rows
    allRows.forEach(row => {
        const tr = document.createElement('tr');
        
        if (row.isHeader) tr.className = 'finance-header-row';
        if (row.isSubtotal) tr.className = 'finance-subtotal-row';
        
        // Description cell
        const tdDesc = document.createElement('td');
        tdDesc.textContent = row.deskripsi;
        tr.appendChild(tdDesc);
        
        // Value cells (only selected months)
        monthIndices.forEach(idx => {
            const val = idx >= 0 ? (row.values[idx] || 0) : 0;
            const tdVal = document.createElement('td');
            tdVal.className = 'text-right';
            if ((val === 0 && row.isHeader) || idx < 0) {
                tdVal.textContent = '';
            } else {
                tdVal.textContent = formatRupiah(val);
                if (val < 0) tdVal.classList.add('text-danger');
            }
            tr.appendChild(tdVal);
        });
        
        tableBody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', initFinanceDashboard);
