document.getElementById('scanForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const startIP = document.getElementById('startIP').value;
  const endIP = document.getElementById('endIP').value;
  const macOnly = document.getElementById('macOnly').checked;

  if (!startIP || !endIP) {
    alert('Please enter both start and end IP!');
    return;
  }

  try {
    const response = await fetch('/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startIP, endIP, macOnly }),
    });

    const data = await response.json();
    displayResults(data); // 🟢 Now this function will be defined below
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to scan IP range. Please try again.');
  }
});

// Function to display scan results
function displayResults(results) {
  const resultsDiv = document.getElementById('results');
  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>No results found.</p>';
    return;
  }

  const table = document.createElement('table');
  const headers = ['IP', 'MAC Address', 'Status', 'Hostname', 'Manufacturer'];
  const headerRow = document.createElement('tr');
  headers.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  results.forEach(result => {
    const row = document.createElement('tr');
    const values = [
      result.IP || 'N/A',
      result.MAC || 'Unknown',
      result.Status || 'Unknown',
      result.Hostname || 'Unknown',
      result.Manufacturer || 'Unknown'
    ];
    values.forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      row.appendChild(td);
    });
    table.appendChild(row);
  });

  resultsDiv.innerHTML = ''; 
  resultsDiv.appendChild(table);
}
