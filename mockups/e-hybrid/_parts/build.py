"""Assemble e-hybrid pages from shared parts.

Usage: python3 build.py home explore course schedule
Each page needs _parts/<page>.main.html (the <main> element) and may add _parts/<page>.css.
"""
import os
import sys

PARTS = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(PARTS)

NAV = [
    ("home", "Home", "i-home"),
    ("explore", "Explore", "i-compass"),
    ("schedule", "Schedule", "i-calendar"),
    ("rooms", "Rooms", "i-building"),
    ("instructors", "Instructors", "i-users"),
]
TITLES = {
    "home": "Home",
    "explore": "Explore",
    "course": "CSCI 2122 Systems Programming",
    "schedule": "Schedule",
}


def read(name):
    with open(os.path.join(PARTS, name)) as f:
        return f.read()


def nav(active):
    out = '    <nav class="mt-5 flex flex-col gap-1">\n'
    for key, label, icon in NAV:
        badge = (
            '<span class="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rosy-dot px-1.5 text-[11px] font-extrabold text-white">1</span>'
            if key == "schedule"
            else ""
        )
        if key == active:
            out += (
                f'      <a class="flex h-10 items-center gap-3 rounded-full bg-white pl-1.5 pr-3 text-[14px] font-bold text-ink shadow-pill ring-1 ring-slate-900/5">'
                f'<span class="grid h-8 w-8 place-items-center rounded-full bg-gold"><svg class="i i-sm text-ink"><use href="#{icon}"/></svg></span>{label}{badge}</a>\n'
            )
        else:
            out += (
                f'      <a class="flex h-10 items-center gap-3 rounded-full pl-1.5 pr-3 text-[14px] font-semibold text-slate-600">'
                f'<span class="grid h-8 w-8 place-items-center"><svg class="i i-sm text-slate-400"><use href="#{icon}"/></svg></span>{label}{badge}</a>\n'
            )
    return out + "    </nav>\n"


def build(page):
    active = {"course": "explore"}.get(page, page)
    try:
        extra_css = read(f"{page}.css")
    except FileNotFoundError:
        extra_css = ""
    head = read("head.html").replace("{{TITLE}}", TITLES.get(page, page)).replace("{{EXTRA_CSS}}", extra_css)
    html = (
        head
        + '<body class="text-[14px]">\n'
        + read("sprite.html")
        + '\n<div class="flex min-h-screen">\n'
        + read("aside.html").replace("{{NAV}}", nav(active))
        + read(f"{page}.main.html")
        + "</div>\n</body>\n</html>\n"
    )
    with open(os.path.join(OUT, f"{page}.html"), "w") as f:
        f.write(html)
    print("built", page)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        build(p)
