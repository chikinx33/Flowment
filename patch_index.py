import re

with open('src/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Head Section
new_head = """<head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Flowment</title>
        
        <!-- PWA Meta Tags -->
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Flowment">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@300,0..1&display=swap" rel="stylesheet"/>
        
        <script>
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                "primary": "#4f46e5", // Indigo 600
                "primary-light": "#6366f1",
                "surface": "#ffffff",
                "surface-dark": "#0f172a",
              },
              fontFamily: {
                "sans": ["'Pretendard'", "sans-serif"],
                "serif": ["'Newsreader'", "serif"],
              },
              boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
              },
              animation: {
                'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'float': 'float 6s ease-in-out infinite',
              },
              keyframes: {
                fadeIn: {
                  '0%': { opacity: 0, transform: 'translateY(10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' },
                },
                float: {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-10px)' },
                }
              }
            },
          },
        }
        </script>
        <style>
          body { 
            font-family: 'Pretendard', sans-serif; 
            min-height: 100dvh;
            -webkit-tap-highlight-color: transparent;
          }
          .font-serif {
            font-family: 'Newsreader', serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
          }
          /* Hide scrollbar */
          *::-webkit-scrollbar { display: none; }
          * { -ms-overflow-style: none; scrollbar-width: none; }
          
          /* Glassmorphism utilities classes */
          .glass-nav {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid rgba(255, 255, 255, 0.3);
          }
          .dark .glass-nav {
            background: rgba(15, 23, 42, 0.75);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
          }
          .page-transition {
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        </style>
    </head>"""

# Replace all <head>...</head> with new_head
content = re.sub(r'<head>.*?</head>', new_head.replace('\\', '\\\\'), content, flags=re.DOTALL)

# 2. Update Headers
# We will make headers floating/transparent.
def replace_header(match):
    header_content = match.group(0)
    # Remove borders and make transparent blur
    header_content = re.sub(r'bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800', 
                            'bg-transparent pt-6', header_content)
    # Make text larger and serif if it's a title
    header_content = re.sub(r'text-xl font-semibold', 'text-2xl font-serif font-medium tracking-tight', header_content)
    return header_content

content = re.sub(r'<header.*?</header>', replace_header, content, flags=re.DOTALL)

# 3. Update Bottom Nav
nav_html = """
        <!-- Floating Bottom Navigation Bar -->
        <div class="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <nav class="pointer-events-auto flex justify-between items-center w-full max-w-sm glass-nav rounded-[2rem] px-6 py-3 shadow-glass dark:shadow-glass-dark transition-all duration-300">
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors PATTERN_HOME" href="/">
                    <span class="material-symbols-outlined text-[26px]">home</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors PATTERN_CALENDAR" href="/calendar">
                    <span class="material-symbols-outlined text-[26px]">calendar_month</span>
                </a>
                <div class="relative -top-6 transform hover:scale-105 transition-transform">
                    <button onclick="window.location.href='/write'" class="bg-primary hover:bg-indigo-500 text-white size-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 ring-[6px] ring-white/50 dark:ring-slate-900/50 transition-all duration-300">
                        <span class="material-symbols-outlined text-3xl">add</span>
                    </button>
                </div>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors PATTERN_TIMELINE" href="/timeline">
                    <span class="material-symbols-outlined text-[26px]">history</span>
                </a>
                <a class="flex flex-col items-center gap-1 text-slate-400 hover:text-primary dark:hover:text-indigo-400 transition-colors PATTERN_SETTINGS" href="/settings">
                    <span class="material-symbols-outlined text-[26px]">tune</span>
                </a>
            </nav>
        </div>"""

def replace_nav(html, page):
    nav = nav_html
    patterns = ['PATTERN_HOME', 'PATTERN_CALENDAR', 'PATTERN_TIMELINE', 'PATTERN_SETTINGS']
    
    # Reset all to inactive
    for p in patterns:
        nav = nav.replace(p, '')
        
    # Set active
    if page == 'home':
        nav = nav_html.replace('PATTERN_HOME', 'text-primary dark:text-indigo-400')
    elif page == 'calendar':
        nav = nav_html.replace('PATTERN_CALENDAR', 'text-primary dark:text-indigo-400')
    elif page == 'timeline':
        nav = nav_html.replace('PATTERN_TIMELINE', 'text-primary dark:text-indigo-400')
    elif page == 'settings':
        nav = nav_html.replace('PATTERN_SETTINGS', 'text-primary dark:text-indigo-400')
        
    # Clean up remainders
    for p in patterns:
        nav = nav.replace(p, '')
        
    return nav

# Replace navs per route
# Since replacing by regex might erase bindings, we do it by searching blocks.

routes = [
    ('/write', 'none'),
    ('/timeline', 'timeline'),
    ('/calendar', 'calendar'),
    ('/settings', 'settings')
]

for route, active in routes:
    # Use simple logic: find app.get('route', ...) and replace its nav
    # But wait, we can just replace <nav ...</nav>
    pass

# A simpler regex to replace all navs:
original_nav_pattern = r'<nav class="sticky bottom-0.*?</nav>'
# Wait, /write has a different nav (with 'edit' button). 
# Actually, I'll just replace all of them with the standard one, EXCEPT /write.

# Let's read and split by routes to safely replace.
import re
chunks = re.split(r'(app\.get\([\'"]/[A-Za-z0-]*[\'"])', content)
# chunks are: [0: prelude], [1: 'app.get("/")'], [2: body], [3: 'app.get("/write")'] ...
new_content = chunks[0]
for i in range(1, len(chunks), 2):
    route_def = chunks[i]
    route_body = chunks[i+1]
    
    active = 'home'
    if '/calendar' in route_def: active = 'calendar'
    elif '/timeline' in route_def: active = 'timeline'
    elif '/settings' in route_def: active = 'settings'
    elif '/write' in route_def: active = 'write'
    
    # Replace nav
    if active != 'write':
        route_body = re.sub(r'<nav class="sticky bottom-0.*?</nav>', replace_nav(route_body, active), route_body, flags=re.DOTALL)
    else:
        # Write nav has edit active
        write_nav = replace_nav(route_body, 'none')
        # Change add button to edit
        write_nav = write_nav.replace('add', 'edit')
        write_nav = write_nav.replace('/write', '') # remove onclick
        route_body = re.sub(r'<nav class="sticky bottom-0.*?</nav>', write_nav, route_body, flags=re.DOTALL)
        
    new_content += route_def + route_body

# Replace main bg colors
new_content = new_content.replace('bg-white dark:bg-slate-900', 'bg-slate-50 dark:bg-slate-950')

with open('src/index.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
