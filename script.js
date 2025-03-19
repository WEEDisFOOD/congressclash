let politicians = [];
let currentSortField = 'name';
let currentSortDirection = 'asc';

const columns = {
    name: { path: 'name', type: 'string' },
    role: { path: 'role', type: 'string' },
    state: { path: 'state', type: 'string' },
    party: { path: 'party', type: 'string' },
    currentReceipts: { path: 'current_stats.Total Receipts.value', type: 'number' },
    careerReceipts: { path: 'career_stats.Total Receipts.value', type: 'number' }
};

function getValueByPath(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function formatCurrency(value) {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

function renderTable() {
    const tbody = document.querySelector('#politicians-table tbody');
    tbody.innerHTML = '';
    console.log('Rendering politicians:', politicians);
    politicians.forEach(politician => {
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

function sortData(field) {
    const column = columns[field];
    if (!column) return;
    const { path, type } = column;
    politicians.sort((a, b) => {
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
    renderTable();
}

function sortAndRender() {
    sortData(currentSortField);
    const headers = document.querySelectorAll('#politicians-table th');
    headers.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
    const currentHeader = document.querySelector(`th[data-field="${currentSortField}"]`);
    if (currentHeader) currentHeader.classList.add(`sorted-${currentSortDirection}`);
}

document.querySelectorAll('#politicians-table th').forEach(header => {
    header.addEventListener('click', () => {
        const field = header.getAttribute('data-field');
        if (field === currentSortField) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortField = field;
            currentSortDirection = 'asc';
        }
        sortAndRender();
    });
});

fetch('congress_data.json')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        console.log('Data loaded:', data);
        politicians = data;
        sortAndRender();
    })
    .catch(error => {
        console.error('Error fetching or parsing data:', error);
        alert('Failed to load data. Check the console for details.');
    });
