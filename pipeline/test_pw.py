from playwright.sync_api import sync_playwright

def test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.goto('https://www.oliveyoung.co.kr/store/main/getBestList.do?dispCatNo=10000010001')
        page.wait_for_timeout(5000)
        html = page.content()
        with open('pw_out.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("HTML length:", len(html))
        
        # Take screenshot for debugging
        page.screenshot(path="pw_out.png")
        print("Screenshot saved to pw_out.png")
        browser.close()

if __name__ == "__main__":
    test()
