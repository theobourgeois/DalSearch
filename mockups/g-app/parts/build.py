"""Assemble DalSearch mockup pages from shared parts and screenshot them.

Usage: python3 parts/build.py [page ...]   (run from mockups/g-app; no args = all pages)
Outputs <page>.html / <page>.png (dark) and <page>-light.html / <page>-light.png.
"""
import os
import subprocess
import sys

PARTS = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(PARTS)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

NAV = [
    ("home", "Home", "house"),
    ("explore", "Explore", "compass"),
    ("schedule", "Schedule", "calendar-blank"),
    ("rooms", "Rooms", "buildings"),
    ("instructors", "Instructors", "users"),
]

# page name -> (main part, body class, active nav, title, screenshot height)
PAGES = {
    "course-overview": ("course", "tab-overview", "explore", "CSCI 2122 Systems Programming", 1300),
    "course-schedule": ("course", "tab-schedule", "explore", "CSCI 2122 Systems Programming", 1265),
    "course-reviews": ("course", "tab-reviews", "explore", "CSCI 2122 Systems Programming", 1170),
    "explore": ("explore", "page-explore", "explore", "Explore", 1235),
    "schedule": ("schedule", "page-schedule", "schedule", "Schedule", 1215),
    "home": ("home", "page-home", "home", "Home", 860),
    "rooms": ("rooms", "page-rooms", "rooms", "Rooms", 1215),
    "instructors": ("instructors", "page-instructors", "instructors", "Instructors", 1270),
}


def read(name, default=None):
    path = os.path.join(PARTS, name)
    if default is not None and not os.path.exists(path):
        return default
    with open(path) as f:
        return f.read()


def nav(active):
    out = '<nav class="nav">\n'
    for key, label, icon in NAV:
        if key == active:
            out += f'      <a class="on"><svg class="i"><use href="#f-{icon}"/></svg>{label}</a>\n'
        else:
            out += f'      <a><svg class="i"><use href="#r-{icon}"/></svg>{label}</a>\n'
    return out + "    </nav>"


def build(page):
    main_part, body_class, active, title, height = PAGES[page]
    extra_css = read(f"{main_part}.css", default="")
    head = read("head.html").replace("{{TITLE}}", title).replace("{{EXTRA_CSS}}", extra_css)
    sprite = read("sprite.html").replace("{{SPRITE}}", read("phosphor-sprite.txt"))
    body = (
        f'<body class="{body_class}">\n{sprite}\n\n<div class="app">\n\n'
        + read("sidebar.html").replace("{{NAV}}", nav(active))
        + "\n\n"
        + read(f"{main_part}.main.html")
        + "\n</div>\n</body>\n</html>\n"
    )
    for theme, suffix in (("dark", ""), ("light", "-light")):
        name = f"{page}{suffix}"
        html_path = os.path.join(OUT, f"{name}.html")
        with open(html_path, "w") as f:
            f.write(head.replace("{{THEME}}", theme) + "\n" + body)
        subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
             f"--window-size=1440,{height}", "--virtual-time-budget=10000",
             f"--screenshot={os.path.join(OUT, name + '.png')}", f"file://{html_path}"],
            stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL, check=True,
        )
        print(os.path.join(OUT, name + ".png"))


if __name__ == "__main__":
    for p in sys.argv[1:] or list(PAGES):
        build(p)
