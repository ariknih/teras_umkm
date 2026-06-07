import re

file_path = r"d:\PROJECT\teras_umkm\src\app\admin\AdminDashboardClient.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's perform the replacements
# 1. 8c6d12 (old gold primary) -> 0F5132 (Hijau Tua secondary) or 2DB24A (Hijau Utama primary)
# For buttons we will use 2DB24A (Hijau Utama) and hover 259a3f
content = content.replace("bg-[#8c6d12] hover:bg-[#70560e]", "bg-[#2DB24A] hover:bg-[#259a3f]")
content = content.replace("bg-[#8c6d12] hover:bg-[#70560e]/90", "bg-[#2DB24A] hover:bg-[#259a3f]")

# For active link and general text elements, replace 8c6d12 with 0F5132 (Hijau Tua)
content = content.replace("8c6d12", "0F5132")

# 2. bfa032 (medium gold) -> 2DB24A (Hijau Utama)
content = content.replace("bfa032", "2DB24A")

# 3. fbf7ee (light gold bg) -> E8F5E9 (light green bg)
content = content.replace("fbf7ee", "E8F5E9")

# 4. 70560e (darker gold hover) -> 0b3a24 (darker Hijau Tua hover)
content = content.replace("70560e", "0b3a24")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement complete successfully!")
