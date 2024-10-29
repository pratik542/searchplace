document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsTableBody = document.querySelector('#results-table tbody');
    const loadingSpinner = document.getElementById('loading-spinner');
    const paginationButtons = document.getElementById('pagination-buttons');
    const limitInput = document.getElementById('limit-input-box');

    const API_URL = "https://wft-geo-db.p.rapidapi.com/v1/geo/cities";
    const API_KEY = '076641d0b1msh3f9dd801dd8ebc9p121de4jsna693868e5ee3'; // Replace with your actual API key
    let currentPage = 1;
    let resultsPerPage = 5;
    let searchQuery = '';
    let searchTimeout;
    let lastRequestTime = 0;
    const requestDelay = 1000; // Delay in milliseconds

    // Event listeners
    limitInput.addEventListener('change', updateResultsPerPage);
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') performSearch();
    });
    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            searchInput.focus();
        }
    });

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(performSearch, 300); // Debounce delay
    });

    function updateResultsPerPage() {
        const value = Math.min(parseInt(limitInput.value, 10), 10);
        limitInput.value = value; // Limit to max 10
        resultsPerPage = value;
        performSearch(); // Re-fetch data with new limit
    }

    async function performSearch() {
        const currentTime = Date.now();
        // Check if the last request was made too recently
        if (currentTime - lastRequestTime < requestDelay) {
            displayMessage("Please wait before making another request.");
            return; // Exit if the time since the last request is too short
        }

        searchQuery = searchInput.value.trim();
        if (!searchQuery) {
            displayMessage("Start searching");
            hidePagination();
            return;
        }

        showLoadingSpinner(true);
        lastRequestTime = currentTime; // Update the last request time

        const options = {
            method: 'GET',
            url: API_URL,
            params: {
                namePrefix: searchQuery,
                limit: resultsPerPage,
                offset: (currentPage - 1) * resultsPerPage
            },
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'wft-geo-db.p.rapidapi.com'
            }
        };

        try {
            const response = await axios.request(options);
            const data = response.data;

            if (data && data.data.length > 0) {
                renderTable(data.data);
                setupPagination(Math.ceil(data.metadata.totalCount / resultsPerPage));
            } else {
                displayMessage("No results found");
                hidePagination();
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                displayMessage("Too many requests. Please wait a moment and try again.");
            } else {
                console.error("Error fetching data:", error);
                displayMessage("Error fetching data. Please try again.");
            }
            hidePagination();
        } finally {
            showLoadingSpinner(false);
        }
    }

    function renderTable(results) {
        resultsTableBody.innerHTML = results.map((item, index) => `
         <tr>
           <td>${index + 1 + (currentPage - 1) * resultsPerPage}</td>
           <td>${item.city}</td>
           <td class="country"><img src="https://flagsapi.com/${item.countryCode}/flat/24.png" alt="flag"> ${item.country}</td>
         </tr>
       `).join('');
    }

    function setupPagination(totalPages) {
        paginationButtons.innerHTML = "";
        if (totalPages === 0) {
            hidePagination();
            return;
        }

        for (let i = 1; i <= totalPages; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.className = i === currentPage ? 'active' : '';
            button.addEventListener('click', () => {
                currentPage = i;
                performSearch();
            });
            paginationButtons.appendChild(button);
        }
    }

    function hidePagination() {
        paginationButtons.innerHTML = "";
        paginationButtons.style.display = "none"; // Hide pagination
    }

    function showLoadingSpinner(show) {
        loadingSpinner.hidden = !show;
    }

    function displayMessage(message) {
        resultsTableBody.innerHTML = `<tr><td colspan="3">${message}</td></tr>`;
    }
});