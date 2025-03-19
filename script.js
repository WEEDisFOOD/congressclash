// Global variables
let politicians = [];
let filteredPoliticians = [];
let currentSortField = 'name';
let currentSortDirection = 'asc';

// Column definitions
const columns = {
    name: { path: 'name', type: 'string' },
    role: { path: 'role', type: 'string' },
    state: { path: 'state', type: 'string' },
    party: { path: 'party', type: 'string' },
    currentReceipts: { path: 'current_stats.Total Receipts.value', type: 'number' },
    careerReceipts: { path: 'career_stats.Total Receipts.value', type: 'number' }
};

// Helper functions
function getValueByPath(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function formatCurrency(value) {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

// Render table with filtered data
function renderTable(data) {
    const tbody = document.querySelector('#politicians-table tbody');
    tbody.innerHTML = '';
    console.log('Rendering data:', data); // Debug: log what’s being rendered
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No data available</td></tr>';
        return;
    }
    data.forEach(politician => {
        const row = document.createElement('tr');
        const name = politician.name || 'N/A';
        const role = politician.role || 'N/A';
        const state = politician.state || 'N/A';
        const party = politician.party || 'N/A';
        const currentReceipts = politician.current_stats?.['Total Receipts'];
        const currentDisplay = currentReceipts
            ? `${formatCurrency(currentReceipts.value)} (Rank: ${currentReceipts.rank ?? 'N/A'})`
            : 'N/A';
        const careerReceipts = politician.career_stats?.['Total Receipts'];
        const careerDisplay = careerReceipts
            ? `${formatCurrency(careerReceipts.value)} (Rank: ${careerReceipts.rank ?? 'N/A'})`
            : 'N/A';
        row.innerHTML = `
            <td>${name}</td>
            <td>${role}</td>
            <td>${state}</td>
            <td>${party}</td>
            <td>${currentDisplay}</td>
            <td>${careerDisplay}</td>
        `;
        tbody.appendChild(row);
    });
}

// Sort data
function sortData(field, data) {
    const column = columns[field];
    if (!column) return data;
    const { path, type } = column;
    return data.sort((a, b) => {
        let aValue = getValueByPath(a, path);
        let bValue = getValueByPath(b, path);
        if (type === 'number') {
            aValue = aValue || 0;
            bValue = bValue || 0;
            return currentSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
            aValue = (aValue || '').toLowerCase();
            bValue = (bValue || '').toLowerCase();
            return currentSortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
    });
}

// Filter and sort
function filterAndSort(searchTerm) {
    filteredPoliticians = politicians.filter(p => 
        !searchTerm || (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    sortData(currentSortField, filteredPoliticians);
    renderTable(filteredPoliticians);
    const headers = document.querySelectorAll('#politicians-table th');
    headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
    const currentHeader = document.querySelector(`th[data-field="${currentSortField}"]`);
    if (currentHeader) currentHeader.classList.add(`sorted-${currentSortDirection}`);
}

// Add sorting event listeners
document.querySelectorAll('#politicians-table th').forEach(header => {
    header.addEventListener('click', () => {
        const field = header.getAttribute('data-field');
        if (field === currentSortField) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortField = field;
            currentSortDirection = 'asc';
        }
        filterAndSort(document.getElementById('searchInput').value);
    });
});

// Add search event listener
document.getElementById('searchInput').addEventListener('input', (e) => {
    filterAndSort(e.target.value);
});

// Fetch and initialize
fetch('congress_data.json')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Fetched data:', data); // Debug: log raw data
        politicians = Array.isArray(data) ? data : [];
        filterAndSort('');
    })
    .catch(error => {
        console.error('Error fetching or parsing data:', error);
        renderTable([]); // Show "No data" message on error
    });
