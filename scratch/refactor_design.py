import os
import re

directories = [
    r"d:\PROJECT\teras_umkm\src\app\cart",
    r"d:\PROJECT\teras_umkm\src\app\wallet",
    r"d:\PROJECT\teras_umkm\src\app\admin",
]

replacements = {
    # Backgrounds
    "bg-bg-dark": "bg-surface",
    "bg-surface-dark": "bg-surface",
    "bg-surface-container": "bg-surface-container",
    # Text colors
    "text-text-primary": "text-foreground",
    "text-text-secondary": "text-foreground/70",
    # Radius
    "rounded-lg": "rounded-[var(--radius-brand)]",
    "rounded-xl": "rounded-[var(--radius-brand)]",
    "rounded-2xl": "rounded-[var(--radius-brand)]",
    # Borders
    "border-border-subtle": "border-border-subtle",
    # Shadows
    "glow-card": "shadow-[var(--shadow-md)]",
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for old, new in replacements.items():
        # Only replace if old is a whole word using regex
        content = re.sub(r'\b' + re.escape(old) + r'\b', new, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".jsx"):
                process_file(os.path.join(root, file))

print("Design tokens refactored successfully.")
