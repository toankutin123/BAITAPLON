from scraper import scrape_bds
import json

if __name__ == "__main__":
    url = input("Nhập link BĐS: ")

    data = scrape_bds(url)

    print("\n===== KẾT QUẢ =====\n")
    print(json.dumps(data, indent=2, ensure_ascii=False))