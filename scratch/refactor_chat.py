import re

def refactor_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacing gold colors with primary
    content = content.replace('#c6a96b', '#2DB24A')
    content = content.replace('#e5c178', '#259a3f')
    content = content.replace('#b09259', '#1e7d32')

    # Replacing zinc background with surface colors
    content = content.replace('bg-zinc-50/90', 'bg-surface-container-low/90')
    content = content.replace('bg-zinc-50/30', 'bg-surface-container-low/30')
    content = content.replace('bg-zinc-50', 'bg-surface-container')
    content = content.replace('bg-zinc-100/50', 'bg-surface-container-low/50')
    content = content.replace('bg-zinc-100', 'bg-surface-container-low')
    content = content.replace('bg-white/95', 'bg-surface/95')
    content = content.replace('bg-white', 'bg-surface')
    content = content.replace('bg-[#FAF8F5]/60', 'bg-surface/60')

    # Replacing zinc text with foreground colors
    content = content.replace('text-zinc-900', 'text-foreground')
    content = content.replace('text-zinc-800', 'text-foreground')
    content = content.replace('text-zinc-600', 'text-foreground/80')
    content = content.replace('text-zinc-500', 'text-foreground/70')
    content = content.replace('text-zinc-400', 'text-foreground/50')

    # Replacing zinc borders with border-subtle
    content = content.replace('border-zinc-200', 'border-border-subtle')
    content = content.replace('border-zinc-100', 'border-border-subtle')

    # Radius updates
    content = content.replace('rounded-2xl', 'rounded-[var(--radius-brand)]')
    content = content.replace('rounded-xl', 'rounded-[var(--radius-lg)]')
    content = content.replace('rounded-lg', 'rounded-[var(--radius-md)]')
    content = content.replace('rounded', 'rounded-[var(--radius-sm)]')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Successfully refactored " + filepath)

refactor_file('d:/PROJECT/teras_umkm/src/components/FloatingChat.tsx')
