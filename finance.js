let financeTrendChartInstance = null;
let financeMarginChartInstance = null;
let financeCostChartInstance = null;

function initFinanceDashboard() {
    if (!window.financeData) {
        console.error('No finance data found in window.financeData');
        return;
    }

    try {
        updateFinanceKPIs();
        updateFinanceCharts();
        renderFinanceTable();
    } catch (error) {
        console.error('Error rendering finance dashboard:', error);
    }
}

function updateFinanceKPIs() {
    const data = window.financeData.summary;
    // Get the last month's index (April)
    const lastIdx = data.penjualan.length - 1;

    document.getElementById('kpiFinPenjualan').textContent = formatRupiah(data.penjualan[lastIdx]);
    document.getElementById('kpiFinHPP').textContent = formatRupiah(data.hpp[lastIdx]);
    
    // Calculate margin for Laba Kotor
    const grossMargin = (data.labaKotor[lastIdx] / data.penjualan[lastIdx]) * 100;
    document.getElementById('kpiFinLabaKotor').textContent = formatRupiah(data.labaKotor[lastIdx]);
    document.getElementById('kpiFinLabaKotorMargin').textContent = `Margin: ${grossMargin.toFixed(1)}%`;
    
    document.getElementById('kpiFinOperasional').textContent = formatRupiah(data.biayaOperasional[lastIdx]);
    document.getElementById('kpiFinRealLaba').textContent = formatRupiah(data.realLaba[lastIdx]);
}

function updateFinanceCharts() {
    const data = window.financeData.summary;
    const labels = window.financeData.months;

    // 1. Trend Chart (Pendapatan & Laba)
    const trendCtx = document.getElementById('financeTrendChart').getContext('2d');
    if (financeTrendChartInstance) financeTrendChartInstance.destroy();
    
    financeTrendChartInstance = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Penjualan',
                    data: data.penjualan,
                    borderColor: '#3b82f6',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Laba Kotor',
                    data: data.labaKotor,
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.3
                },
                {
                    label: 'Real Laba',
                    data: data.realLaba,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: getChartOptions('Rp')
    });

    // 2. Margin Profitabilitas
    const grossMargin = data.labaKotor.map((val, i) => (val / data.penjualan[i]) * 100);
    const opMargin = data.pendapatanOperasional.map((val, i) => (val / data.penjualan[i]) * 100);
    const netMargin = data.realLaba.map((val, i) => (val / data.penjualan[i]) * 100);

    const marginCtx = document.getElementById('financeMarginChart').getContext('2d');
    if (financeMarginChartInstance) financeMarginChartInstance.destroy();
    
    financeMarginChartInstance = new Chart(marginCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Gross Margin %',
                    data: grossMargin,
                    borderColor: '#f59e0b',
                    borderDash: [5, 5],
                    tension: 0.3
                },
                {
                    label: 'Operating Margin %',
                    data: opMargin,
                    borderColor: '#8b5cf6',
                    borderDash: [5, 5],
                    tension: 0.3
                },
                {
                    label: 'Net Margin (Real) %',
                    data: netMargin,
                    borderColor: '#10b981',
                    borderWidth: 3,
                    tension: 0.3
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
                    data: data.hpp,
                    backgroundColor: '#ef4444'
                },
                {
                    label: 'Biaya Operasional',
                    data: data.biayaOperasional,
                    backgroundColor: '#f97316'
                },
                {
                    label: 'Biaya Non-Operasional',
                    data: data.biayaNonOperasional,
                    backgroundColor: '#eab308'
                },
                {
                    label: 'Sewa Tempat',
                    data: data.sewaTempat,
                    backgroundColor: '#6366f1'
                }
            ]
        },
        options: {
            ...getChartOptions('Rp'),
            scales: {
                x: { stacked: true, grid: { display: false } },
                y: { 
                    stacked: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
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
                labels: { color: '#cbd5e1' }
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
                        return value + '%';
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
    
    // Create header row for months
    const thead = document.querySelector('#financeTable thead tr');
    // Keep first column (Deskripsi), remove existing month columns if any to prevent duplicates on re-render
    while (thead.children.length > 1) {
        thead.removeChild(thead.lastChild);
    }
    
    months.forEach(m => {
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
        
        // Value cells
        row.values.forEach(val => {
            const tdVal = document.createElement('td');
            tdVal.className = 'text-right';
            if (val === 0 && row.isHeader) {
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
