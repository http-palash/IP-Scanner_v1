document.getElementById('scanForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const startIP = document.getElementById('startIP').value;
  const endIP = document.getElementById('endIP').value;
  const macOnly = document.getElementById('macOnly').checked;
  const autoReload = document.getElementById('autoReload').checked;
  const reloadInterval = parseInt(document.getElementById('reloadInterval').value);

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
    displayResults(data);


    if (autoReload) {
     let i = 0;
      setTimeout(() => {
        i +=1;
        document.getElementById('scanForm').dispatchEvent(new Event('submit'));
        console.log('Get manufacturer API call',i);
      }, reloadInterval);
    }

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
  const headers = ['IP', 'MAC Address', 'Status','Manufacturer'];
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
      // result.Hostname || 'Unknown',
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



document.addEventListener('DOMContentLoaded', function () {
  const button = document.getElementById('scan-button');
  const form = document.getElementById('scanForm');

  const originalText = button.innerHTML;
  function animateButton() {
    button.innerHTML = 'Clicked';
    button.classList.add('clicked');

    button.addEventListener('animationend', () => {
      button.classList.remove('clicked');
      button.innerHTML = originalText;
    }, { once: true });
  }

  // Trigger animation on any click (manual or programmatic)
  button.addEventListener('click', animateButton);

  // Also trigger animation on form submit (indirect click)
  form.addEventListener('submit', function (event) {
    event.preventDefault();

    // Call animation manually, since `submit` may skip 'click' event on some browsers
    animateButton();
  });
});