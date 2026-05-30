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
    updateCategoryProfitChart(filteredData);
    updateCategoryRevenueList(filteredData);
    updateTopCategories(filteredData);
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
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Keuntungan (Rp)',
                data: values,
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: '#ec4899',
                pointRadius: 4,
                tension: 0.3,
                fill: true
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
                    grid: { display: false },
                    ticks: {
                        color: '#cbd5e1'
                    }
                }
            }
        }
    });
}

function updateCategoryProfitChart(data) {
    const catProfits = {};
    data.forEach(item => {
        const cat = item.Kategory || 'Unknown';
        if (!catProfits[cat]) catProfits[cat] = 0;
        catProfits[cat] += item['profit'] || 0;
    });
    
    // Sort by profit descending
    const sortedCats = Object.entries(catProfits).sort((a, b) => b[1] - a[1]);
    
    const container = document.getElementById('categoryProfitList');
    container.innerHTML = '';
    
    if (sortedCats.length === 0) {
        container.innerHTML = '<div class="no-data">Tidak ada data</div>';
        return;
    }
    
    sortedCats.forEach(catData => {
        const catName = catData[0];
        const catValue = catData[1];
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'profit-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'profit-cat';
        nameSpan.textContent = catName;
        
        const valSpan = document.createElement('span');
        valSpan.className = 'profit-val';
        valSpan.textContent = formatRupiah(catValue);
        
        itemDiv.appendChild(nameSpan);
        itemDiv.appendChild(valSpan);
        
        container.appendChild(itemDiv);
    });
}

function updateTopCategories(data) {
    const container = document.getElementById('topCategoriesContainer');
    container.innerHTML = '';
    
    // Group data by Kategory
    const categoryGroups = {};
    data.forEach(item => {
        const cat = item.Kategory;
        if (!cat) return; // Skip if no category
        
        if (!categoryGroups[cat]) categoryGroups[cat] = {};
        
        const prod = item.product || 'Unknown';
        if (!categoryGroups[cat][prod]) categoryGroups[cat][prod] = 0;
        
        categoryGroups[cat][prod] += item['total sales amount'] || 0;
    });
    
    // For each category, get top 10 products and render
    Object.keys(categoryGroups).sort().forEach(cat => {
        const products = categoryGroups[cat];
        
        const sortedProducts = Object.entries(products)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
            
        if (sortedProducts.length === 0) return;
        
        // Create Card Element
        const card = document.createElement('div');
        card.className = 'category-card glassmorphism';
        
        // Card Title
        const title = document.createElement('h3');
        title.textContent = `Kategori: ${cat}`;
        card.appendChild(title);
        
        // List items
        sortedProducts.forEach(prod => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'top-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = prod[0];
            nameSpan.title = prod[0]; // for hover if truncated
            
            const valSpan = document.createElement('span');
            valSpan.className = 'item-val';
            valSpan.textContent = formatRupiah(prod[1]);
            
            itemDiv.appendChild(nameSpan);
            itemDiv.appendChild(valSpan);
            
            card.appendChild(itemDiv);
        });
        
        container.appendChild(card);
    });
}

function updateCategoryRevenueList(data) {
    const catRevenue = {};
    data.forEach(item => {
        const cat = item.Kategory || 'Unknown';
        if (!catRevenue[cat]) catRevenue[cat] = 0;
        catRevenue[cat] += item['total sales amount'] || 0;
    });

    // Sort by revenue descending
    const sorted = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]);

    const container = document.getElementById('categoryRevenueList');
    container.innerHTML = '';

    if (sorted.length === 0) {
        container.innerHTML = '<div class="no-data">Tidak ada data</div>';
        return;
    }

    sorted.forEach(([catName, catValue]) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'profit-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'profit-cat';
        nameSpan.textContent = catName;

        const valSpan = document.createElement('span');
        valSpan.className = 'profit-val revenue-val';
        valSpan.textContent = formatRupiah(catValue);

        itemDiv.appendChild(nameSpan);
        itemDiv.appendChild(valSpan);
        container.appendChild(itemDiv);
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', initDashboard);
