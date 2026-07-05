import json
import re

with open("ingredients_master.json", "r", encoding="utf-8") as f:
    master = json.load(f)

for item in master:
    if not item.get("id"):
        # generate ID based on name
        new_id = re.sub(r"[^\w]+", "-", item["name"]).strip("-").lower()
        item["id"] = new_id
        print(f"Fixed empty ID for {item['name']} -> {new_id}")

with open("ingredients_master.json", "w", encoding="utf-8") as f:
    json.dump(master, f, ensure_ascii=False, indent=2)

print("ingredients_master.json updated.")
