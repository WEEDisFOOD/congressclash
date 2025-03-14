let data = [];
let filteredData = [];
let sortColumn = 'name';
let sortOrder = 'asc';

function renderTable() {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';
    filteredData.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${formatCurrency(getNestedValue(member, 'current_stats.Total Receipts.value'))}</td>
            <td>${formatCurrency(getNestedValue(member, 'current_stats.Total Individual Contributions.value'))}</td>
            <td>${formatCurrency(getNestedValue(member, 'career_stats.Total Receipts.value'))}</td>
        `;
        tableBody.appendChild(row);
    });
}

function formatCurrency(value) {
    if (value == null) return 'N/A';
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function filterData(searchTerm) {
    if (searchTerm) {
        filteredData = data.filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));
    } else {
        filteredData = data;
    }
    renderTable();
}

function sortData(column) {
    if (sortColumn === column) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortOrder = 'asc';
    }
    filteredData.sort((a, b) => {
        let valA = getNestedValue(a, column);
        let valB = getNestedValue(b, column);
        if (typeof valA === 'object' && valA !== null) valA = valA.value;
        if (typeof valB === 'object' && valB !== null) valB = valB.value;
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
    renderTable();
}

// Fetch JSON data
fetch('congress_finance.json')
    .then(response => response.json())
    .then(jsonData => {
        data = jsonData;
        filteredData = data;
        renderTable();
    })
    .catch(error => console.error('Error loading JSON:', error));

// Add event listeners
document.querySelector('#searchInput').addEventListener('input', e => {
    filterData(e.target.value);
});

document.querySelectorAll('#dataTable th').forEach(th => {
    th.addEventListener('click', () => {
        const column = th.dataset.column;
        sortData(column);
    });
});
