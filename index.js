const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tor Relay Analysis</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .stat-box { 
            padding: 15px; 
            margin: 10px 0; 
            background: #f5f5f5; 
            border-radius: 5px; 
          }
          .input-box {
            margin: 20px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            border: 1px solid #dee2e6;
          }
          .input-box input {
            padding: 8px;
            font-size: 16px;
            border: 1px solid #ced4da;
            border-radius: 4px;
            width: 100px;
          }
          .input-box p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <h1>Tor Relay Analysis</h1>
        
        <div class="input-box">
          <p>Enter country code (e.g., de, us, fr):</p>
          <input 
            type="text" 
            id="countryCode" 
            maxlength="2" 
            placeholder="de"
            value="de"
          >
          <p>Press Enter to search</p>
        </div>

        <div id="results">Loading...</div>

        <script>
          const countryInput = document.getElementById('countryCode');
          
          function fetchData(countryCode) {
            document.getElementById('results').innerHTML = 'Loading...';
            
            fetch('/api/relays/' + countryCode.toLowerCase())
              .then(response => response.json())
              .then(data => {
                if (data.error) {
                  document.getElementById('results').innerHTML = \`
                    <div class="stat-box" style="background: #fee;">
                      <h3>Error: \${data.error}</h3>
                    </div>
                  \`;
                  return;
                }
                
                document.getElementById('results').innerHTML = \`
                  <div class="stat-box">
                    <h3>Running relays: \${data.runningCount}</h3>
                  </div>
                  <div class="stat-box">
                    <h3>Not running relays: \${data.notRunningCount}</h3>
                  </div>
                  <div class="stat-box">
                    <h3>Total relays: \${data.runningCount + data.notRunningCount}</h3>
                  </div>
                  <div class="stat-box">
                    <h3>Total bandwidth: \${data.totalBandwidth} MB/s</h3>
                  </div>
                \`;
              })
              .catch(error => {
                document.getElementById('results').innerHTML = \`
                  <div class="stat-box" style="background: #fee;">
                    <h3>Error loading data</h3>
                  </div>
                \`;
                console.error('Error:', error);
              });
          }

          countryInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
              const countryCode = countryInput.value.trim();
              if (countryCode) {
                fetchData(countryCode);
              }
            }
          });

          // Initial load with default country (de)
          fetchData('de');
        </script>
      </body>
    </html>
  `);
});

app.get('/api/relays/:country', async (req, res) => {
  try {
    const country = req.params.country.toLowerCase();
    if (!country.match(/^[a-z]{2}$/)) {
      res.status(400).json({ error: 'Invalid country code. Please use two letters (e.g., de, us, fr)' });
      return;
    }

    const response = await axios.get('https://onionoo.torproject.org/details?country=' + country);
    const relays = response.data.relays;
    
    const stats = relays.reduce((acc, relay) => {
      if (relay.running) {
        acc.runningCount++;
      } else {
        acc.notRunningCount++;
      }
      
      if (relay.advertised_bandwidth) {
        acc.totalBandwidth += relay.advertised_bandwidth;
      }
      return acc;
    }, { runningCount: 0, notRunningCount: 0, totalBandwidth: 0 });

    stats.totalBandwidth = (stats.totalBandwidth / (1024 * 1024)).toFixed(2);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
