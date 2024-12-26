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
            max-width: 1000px;
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
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #f8f9fa;
            font-weight: bold;
          }
          tr:hover {
            background: #f5f5f5;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
          }
          .loading {
            text-align: center;
            padding: 20px;
            font-size: 18px;
            color: #666;
          }
          .error {
            background: #fee;
            padding: 15px;
            border-radius: 5px;
            color: #c00;
            margin: 10px 0;
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

        <div id="results" class="loading">Loading...</div>

        <script>
          const countryInput = document.getElementById('countryCode');
          
          function formatNumber(num) {
            return new Intl.NumberFormat().format(num);
          }
          
          function formatPercent(num) {
            return new Intl.NumberFormat('en-US', { 
              style: 'percent', 
              maximumFractionDigits: 2 
            }).format(num);
          }
          
          function fetchData(countryCode) {
            document.getElementById('results').innerHTML = '<div class="loading">Loading...</div>';
            
            fetch('/api/relays/' + countryCode.toLowerCase())
              .then(response => response.json())
              .then(data => {
                if (data.error) {
                  document.getElementById('results').innerHTML = \`
                    <div class="error">
                      <h3>Error: \${data.error}</h3>
                    </div>
                  \`;
                  return;
                }
                
                document.getElementById('results').innerHTML = \`
                  <div class="stats-grid">
                    <div class="stat-box">
                      <h3>Running relays</h3>
                      <div>\${formatNumber(data.runningCount)}</div>
                    </div>
                    <div class="stat-box">
                      <h3>Total bandwidth</h3>
                      <div>\${formatNumber(data.totalBandwidth.toFixed(2))} MB/s</div>
                    </div>
                    <div class="stat-box">
                      <h3>Unique AS Systems</h3>
                      <div>\${formatNumber(data.uniqueASCount)}</div>
                    </div>
                    <div class="stat-box">
                      <h3>Network Weight</h3>
                      <div>\${formatPercent(data.consensusWeightFraction)}</div>
                    </div>
                  </div>

                  <h2>AS Distribution</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>AS Number</th>
                        <th>AS Name</th>
                        <th>Relay Count</th>
                        <th>Total Bandwidth (MB/s)</th>
                        <th>% of Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${data.asDistribution.map(as => \`
                        <tr>
                          <td>\${as.asn}</td>
                          <td>\${as.name}</td>
                          <td>\${formatNumber(as.relayCount)}</td>
                          <td>\${formatNumber(as.bandwidth.toFixed(2))}</td>
                          <td>\${formatPercent(as.bandwidthFraction)}</td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                \`;
              })
              .catch(error => {
                document.getElementById('results').innerHTML = \`
                  <div class="error">
                    <h3>Error loading data</h3>
                    <p>\${error.message}</p>
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

    const allRelaysResponse = await axios.get('https://onionoo.torproject.org/details');
    const allRelays = allRelaysResponse.data.relays;
    const totalNetworkWeight = allRelays.reduce((sum, relay) => 
      sum + (relay.consensus_weight || 0), 0);

    const response = await axios.get('https://onionoo.torproject.org/details?country=' + country);
    const relays = response.data.relays;
    
    const stats = {
      runningCount: 0,
      notRunningCount: 0,
      totalBandwidth: 0,
      totalWeight: 0,
      asSystems: new Map()
    };

    relays.forEach(relay => {
      if (relay.running) {
        stats.runningCount++;
      } else {
        stats.notRunningCount++;
      }
      
      if (relay.advertised_bandwidth) {
        stats.totalBandwidth += relay.advertised_bandwidth;
      }

      if (relay.consensus_weight) {
        stats.totalWeight += relay.consensus_weight;
      }

      if (relay.as && relay.as_name) {
        const asKey = relay.as;
        if (!stats.asSystems.has(asKey)) {
          stats.asSystems.set(asKey, {
            asn: relay.as,
            name: relay.as_name,
            relayCount: 0,
            bandwidth: 0
          });
        }
        
        const asInfo = stats.asSystems.get(asKey);
        asInfo.relayCount++;
        if (relay.advertised_bandwidth) {
          asInfo.bandwidth += relay.advertised_bandwidth / (1024 * 1024);
        }
      }
    });

    stats.totalBandwidth = (stats.totalBandwidth / (1024 * 1024));

    const consensusWeightFraction = stats.totalWeight / totalNetworkWeight;

    const asDistribution = Array.from(stats.asSystems.values())
      .map(as => ({
        ...as,
        bandwidthFraction: as.bandwidth / stats.totalBandwidth
      }))
      .sort((a, b) => b.bandwidth - a.bandwidth);

    const response_data = {
      runningCount: stats.runningCount,
      notRunningCount: stats.notRunningCount,
      totalBandwidth: stats.totalBandwidth,
      consensusWeightFraction,
      uniqueASCount: stats.asSystems.size,
      asDistribution
    };
    
    res.json(response_data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
