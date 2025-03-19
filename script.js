let allData = [];
let filteredData = [];
let sortColumn = 'name';
let sortDirection = 'asc';

function renderTable() {
    const tableBody = document.querySelector('#data-table tbody');
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

function filterData(searchTerm) {
    if (searchTerm) {
        filteredData = allData.filter(member => 
            member.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    } else {
        filteredData = allData;
    }
    renderTable();
}

function sortData(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }

    filteredData.sort((a, b) => {
        let valueA, valueB;

        switch (column) {
            case 'name':
                valueA = a.name;
                valueB = b.name;
                break;
            case 'current-stats.total-receipts':
                valueA = a.current_stats['Total Receipts']?.value || 0;
                valueB = b.current_stats['Total Receipts']?.value || 0;
                break;
            case 'current-stats.individual-contributions':
                valueA = a.current_stats['Total Individual Contributions']?.value || 0;
                valueB = b.current_stats['Total Individual Contributions']?.value || 0;
                break;
            case 'career-stats.total-receipts':
                valueA = a.career_stats['Total Receipts']?.value || 0;
                valueB = b.career_stats['Total Receipts']?.value || 0;
                break;
            default:
                valueA = 0;
                valueB = 0;
        }

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

// Fetch JSON data
fetch('congress_finance.json')
    .then(response => response.json())
    .then(jsonData => {
        allData = jsonData;
        filteredData = allData;
        renderTable();
    })
    .catch(error => console.error('Error loading JSON:', error));

// Add event listeners
document.querySelector('#search-input').addEventListener('input', (event) => {
    filterData(event.target.value);
});

document.querySelectorAll('#data-table th').forEach(header => {
    header.addEventListener('click', () => {
        const column = header.dataset.column;
        sortData(column);
    });
});
