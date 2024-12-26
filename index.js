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
          body { font-family: Arial, sans-serif; margin: 20px; }
          .stat-box { 
            padding: 15px; 
            margin: 10px 0; 
            background: #f5f5f5; 
            border-radius: 5px; 
          }
        </style>
      </head>
      <body>
        <h1>German Tor Relay Analysis</h1>
        <div id="results">Loading...</div>
        <script>
          fetch('/api/relays')
            .then(response => response.json())
            .then(data => {
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
              document.getElementById('results').innerHTML = 'Error loading data';
              console.error('Error:', error);
            });
        </script>
      </body>
    </html>
  `);
});

app.get('/api/relays', async (req, res) => {
  try {
    const response = await axios.get('https://onionoo.torproject.org/details?country=de');
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
