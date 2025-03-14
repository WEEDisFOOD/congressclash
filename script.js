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
 <td>${formatCurrency(member.current_stats['Total Receipts']?.value)}</td>
 <td>${formatCurrency(member.current_stats['Total Individual Contributions']?.value)}</td>
 <td>${formatCurrency(member.career_stats['Total Receipts']?.value)}</td>
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
 let valA, valB;

 // Map data-column to the correct JSON path
 switch (column) {
 case 'name':
 valA = a.name;
 valB = b.name;
 break;
 case 'current_stats.total_receipts':
 valA = a.current_stats['Total Receipts']?.value || 0;
 valB = b.current_stats['Total Receipts']?.value || 0;
 break;
 case 'current_stats.individual_contributions':
 valA = a.current_stats['Total Individual Contributions']?.value || 0;
 valB = b.current_stats['Total Individual Contributions']?.value || 0;
 break;
 case 'career_stats.total_receipts':
 valA = a.career_stats['Total Receipts']?.value || 0;
 valB = b.career_stats['Total Receipts']?.value || 0;
 break;
 default:
 valA = 0;
 valB = 0;
 }

 // Compare values based on sort order
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
