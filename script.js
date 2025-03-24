// Global variables to store data and current state
let congressMembers = [];
let currentSearchTerm = '';
let currentSortBy = 'career_receipts';
let currentSortOrder = 'desc';

// Format numbers as currency
function formatNumber(num) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format receipts with value and rank
function formatReceipts(receipts) {
    if (receipts && receipts.value !== undefined) {
        const value = formatNumber(receipts.value);
        const rank = receipts.rank ? `(${receipts.rank})` : '(N/A)';
        return `${value} ${rank}`;
    }
    return 'N/A';
}

// Update the table based on search and sort settings
function updateTable() {
    // Filter data based on search term
    const filteredData = congressMembers.filter(member =>
        member.name.toLowerCase().includes(currentSearchTerm.toLowerCase())
    );

    // Sort data based on current sort column and order
    filteredData.sort((a, b) => {
        let aValue, bValue;
        switch (currentSortBy) {
            case 'name':
            case 'role':
            case 'state':
            case 'party':
                aValue = a[currentSortBy].toLowerCase();
                bValue = b[currentSortBy].toLowerCase();
                return currentSortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            case 'current_receipts':
                aValue = a.current_stats['Total Receipts'].value;
                bValue = b.current_stats['Total Receipts'].value;
                break;
            case 'career_receipts':
                aValue = a.career_stats['Total Receipts'].value;
                bValue = b.career_stats['Total Receipts'].value;
                break;
        }
        return currentSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Render the table
    const tbody = document.querySelector('#congress-table tbody');
    tbody.innerHTML = '';
    filteredData.forEach(member => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td data-label="Name">${member.name}</td>
            <td data-label="Role">${member.role}</td>
            <td data-label="State">${member.state}</td>
            <td data-label="Party">${member.party}</td>
            <td data-label="23-24 Receipts">${formatReceipts(member.current_stats['Total Receipts'])}</td>
            <td data-label="Career Receipts">${formatReceipts(member.career_stats['Total Receipts'])}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const headers = document.querySelectorAll('#congress-table th');

    // Search functionality
    searchInput.addEventListener('input', () => {
        currentSearchTerm = searchInput.value;
        updateTable();
    });

    // Sorting functionality
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.column;
            if (column === currentSortBy) {
                currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortBy = column;
                currentSortOrder = 'asc';
            }
            updateTable();
        });
    });

    // Fetch and load the JSON data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            congressMembers = data;
            updateTable(); // Initial render with default sort
        })
        .catch(error => console.error('Error fetching data:', error));
});
