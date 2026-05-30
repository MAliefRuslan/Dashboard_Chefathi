// window.rawData is loaded from data.js
let productChartInstance = null;
let groupChartInstance = null;

// Format IDR currency
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
};

// Initialize the dashboard
function initDashboard() {
    try {
        if (!window.rawData) {
            console.error('No data found in window.rawData');
            return;
        }
        populateFilters();
        updateDashboard();
        
        // Event Listeners for Filters
        document.getElementById('kategoryFilter').addEventListener('change', updateDashboard);
        document.getElementById('bulanFilter').addEventListener('change', updateDashboard);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function populateFilters() {
    const kategories = [...new Set(window.rawData.map(item => item.Kategory))].filter(Boolean);
    const bulans = [...new Set(window.rawData.map(item => item.Bulan))].filter(Boolean);
    
    const katSelect = document.getElementById('kategoryFilter');
    kategories.forEach(k => {
        const option = document.createElement('option');
        option.value = k;
        option.textContent = k;
        katSelect.appendChild(option);
    });
    
    const bulSelect = document.getElementById('bulanFilter');
    bulans.forEach(b => {
        const option = document.createElement('option');
        option.value = b;
        option.textContent = b;
        bulSelect.appendChild(option);
    });
}

function updateDashboard() {
    const selKat = document.getElementById('kategoryFilter').value;
    const selBul = document.getElementById('bulanFilter').value;
    
    let filteredData = window.rawData;
    if (selKat !== 'All') {
        filteredData = filteredData.filter(d => d.Kategory === selKat);
    }
    if (selBul !== 'All') {
        filteredData = filteredData.filter(d => d.Bulan === selBul);
    }
    
    updateKPIs(filteredData);
    updateProductChart(filteredData);
    updateGroupChart(filteredData);
}

function updateKPIs(data) {
    const totalSales = data.reduce((acc, curr) => acc + (curr['total sales amount'] || 0), 0);
    const totalProfit = data.reduce((acc, curr) => acc + (curr['profit'] || 0), 0);
    const totalQty = data.reduce((acc, curr) => acc + (curr['sold qty'] || 0), 0);
    
    document.getElementById('kpiTotalSales').textContent = formatRupiah(totalSales);
    document.getElementById('kpiTotalProfit').textContent = formatRupiah(totalProfit);
    document.getElementById('kpiTotalQty').textContent = new Intl.NumberFormat('id-ID').format(totalQty);
}

function updateProductChart(data) {
    const productSales = {};
    data.forEach(item => {
        const prod = item.product || 'Unknown';
        if (!productSales[prod]) productSales[prod] = 0;
        productSales[prod] += item['total sales amount'] || 0;
    });
    
    // Sort and get top 10 products
    const sortedProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
        
    const labels = sortedProducts.map(p => p[0]);
    const values = sortedProducts.map(p => p[1]);
    
    const ctx = document.getElementById('productChart').getContext('2d');
    
    if (productChartInstance) {
        productChartInstance.destroy();
    }
    
    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    
    productChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Penjualan (Rp)',
                data: values,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatRupiah(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + (value / 1000000).toFixed(1) + 'M';
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function updateGroupChart(data) {
    const groupProfits = {};
    data.forEach(item => {
        const grp = item.group || 'Unknown';
        if (!groupProfits[grp]) groupProfits[grp] = 0;
        groupProfits[grp] += item['profit'] || 0;
    });
    
    const labels = Object.keys(groupProfits);
    const values = Object.values(groupProfits);
    
    const ctx = document.getElementById('groupChart').getContext('2d');
    
    if (groupChartInstance) {
        groupChartInstance.destroy();
    }
    
    groupChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#cbd5e1' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const val = formatRupiah(context.raw);
                            return `${label}: ${val}`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', initDashboard);
