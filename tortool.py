from playwright.sync_api import sync_playwright
import time

def get_tor_metrics(country_code):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        url = f"https://metrics.torproject.org/rs.html#aggregate/all/country:{country_code}"
        page.goto(url)
        
        page.wait_for_selector('#torstatus_results')
        time.sleep(2)
        
        row = page.query_selector('#torstatus_results tbody tr')
        if row:
            relays = int(row.query_selector('td:nth-child(8)').inner_text())
            guards = int(row.query_selector('td:nth-child(9)').inner_text())
            exits = int(row.query_selector('td:nth-child(10)').inner_text())
            total_servers = relays + guards + exits
            
            bandwidth = row.query_selector('td:nth-child(4)').inner_text()
            bandwidth_num = float(bandwidth.split()[0])  # Just get the number
            
            as_text = row.query_selector('td:nth-child(2)').inner_text()
            as_count = int(as_text.split()[0].strip('('))
            
            weight = row.query_selector('td:nth-child(3)').inner_text()
            weight_num = float(weight.strip('%')) / 100  # Convert percentage to decimal
            
            browser.close()
            return f"{total_servers},{bandwidth_num},{as_count},{weight_num:.3f}"
        
        browser.close()
        return "Data not found"

def main():
    while True:
        country_code = input("Enter two-letter country code (or 'quit' to exit): ").strip().lower()
        if country_code == 'quit':
            break
            
        if len(country_code) != 2:
            print("Please enter a valid two-letter country code.")
            continue
            
        try:
            result = get_tor_metrics(country_code)
            print(result)
        except Exception as e:
            print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
