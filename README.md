# Tor Metrics Tool

Made this little tool out of curiosity about Tor relays across different countries. I was bored one night and wanted to explore relationships between different Tor metrics - like how many servers each country runs, their network capacity, and how much consensus weight they carry.

## What it does

Feed it a two-letter country code (like 'us' or 'de') and it'll scrape some interesting stats from the Tor metrics site, giving you:

 - Total number of servers
 - Network speed (Advertised Bandwidth)
 - Number of distinct Autonomous Systems
 - Consensus Weight percentage

## Setup

    pip install playwright
    playwright install

## Usage

Just run it and enter country codes. It'll spit out the data in CSV format so you can easily dump it into Excel or whatever for analysis.

Originally I just wanted to check AS counts, but got carried away and added more metrics because... why not? Have fun poking around!

## Note

This scrapes from Tor's public metrics page which updates regularly, so numbers will change over time.
