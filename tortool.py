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
        
        as_cell = page.query_selector('td:has-text("distinct")')
        if as_cell:
            as_text = as_cell.inner_text()
            as_count = as_text.split()[0].strip('(')
        else:
            as_count = "Not found"
        
        weight_cell = page.query_selector('#torstatus_results tbody tr td:nth-child(3)')
        if weight_cell:
            weight = weight_cell.inner_text()
        else:
            weight = "Not found"
        
        browser.close()
        return as_count, weight

def main():
    while True:
        country_code = input("Enter two-letter country code (or 'quit' to exit): ").strip().lower()
        if country_code == 'quit':
            break
            
        if len(country_code) != 2:
            print("Please enter a valid two-letter country code.")
            continue
            
        try:
            as_count, consensus_weight = get_tor_metrics(country_code)
            print(f"\nResults for {country_code.upper()}:")
            print(f"Distinct Autonomous Systems: {as_count}")
            print(f"Consensus Weight: {consensus_weight}")
        except Exception as e:
            print(f"An error occurred: {e}")
        
        print("\n" + "-"*50 + "\n")

if __name__ == "__main__":
    main()
