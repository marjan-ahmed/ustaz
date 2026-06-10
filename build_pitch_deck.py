#!/usr/bin/env python3
"""Generate the USTAZ pitch deck (.pptx) rebranded to the app's colors."""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ── Brand ─────────────────────────────────────────────────────────────────
ORANGE = RGBColor(0xDB, 0x4B, 0x0D)   # primary
NAVY   = RGBColor(0x11, 0x18, 0x28)   # secondary
CREAM  = RGBColor(0xFC, 0xEE, 0xE2)
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
GRAY   = RGBColor(0x3A, 0x3F, 0x4A)
LGRAY  = RGBColor(0x6B, 0x70, 0x7A)
LITEOR = RGBColor(0xF8, 0xC9, 0xA8)

FONT = "Calibri"
EMU_W, EMU_H = Inches(13.333), Inches(7.5)

prs = Presentation()
prs.slide_width = EMU_W
prs.slide_height = EMU_H
BLANK = prs.slide_layouts[6]


def slide():
    return prs.slides.add_slide(BLANK)


def rect(s, x, y, w, h, color, line=None):
    sh = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = color
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line; sh.line.width = Pt(1)
    sh.shadow.inherit = False
    return sh


def oval(s, x, y, w, h, color):
    sh = s.shapes.add_shape(MSO_SHAPE.OVAL, x, y, w, h)
    sh.fill.solid(); sh.fill.fore_color.rgb = color
    sh.line.fill.background(); sh.shadow.inherit = False
    return sh


def text(s, x, y, w, h, runs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
         space_after=6, line_spacing=1.05):
    """runs: list of paragraphs; each paragraph is list of (txt, size, bold, color)."""
    tb = s.shapes.add_textbox(x, y, w, h); tf = tb.text_frame
    tf.word_wrap = True; tf.vertical_anchor = anchor
    for i, para in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align; p.space_after = Pt(space_after); p.line_spacing = line_spacing
        for (txt, size, bold, color) in para:
            r = p.add_run(); r.text = txt
            r.font.size = Pt(size); r.font.bold = bold
            r.font.color.rgb = color; r.font.name = FONT
    return tb


def bullets(s, x, y, w, h, items, size=15, color=GRAY, gap=8, lead_color=ORANGE):
    tb = s.shapes.add_textbox(x, y, w, h); tf = tb.text_frame; tf.word_wrap = True
    for i, it in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(gap); p.line_spacing = 1.05
        lead = p.add_run(); lead.text = "▸  "
        lead.font.size = Pt(size); lead.font.bold = True
        lead.font.color.rgb = lead_color; lead.font.name = FONT
        if isinstance(it, tuple):
            head, rest = it
            r1 = p.add_run(); r1.text = head
            r1.font.size = Pt(size); r1.font.bold = True
            r1.font.color.rgb = NAVY; r1.font.name = FONT
            r2 = p.add_run(); r2.text = rest
            r2.font.size = Pt(size); r2.font.bold = False
            r2.font.color.rgb = color; r2.font.name = FONT
        else:
            r = p.add_run(); r.text = it
            r.font.size = Pt(size); r.font.color.rgb = color; r.font.name = FONT
    return tb


def footer(s, n):
    text(s, Inches(0.5), Inches(7.05), Inches(8), Inches(0.35),
         [[("USTAZ", 9, True, ORANGE), ("   ustaz-bice.vercel.app", 9, False, LGRAY)]])
    text(s, Inches(12.4), Inches(7.05), Inches(0.6), Inches(0.35),
         [[(str(n), 9, True, LGRAY)]], align=PP_ALIGN.RIGHT)


def content_slide(no, kicker, title, body_fn):
    s = slide()
    rect(s, 0, 0, EMU_W, EMU_H, WHITE)
    # left accent bar
    rect(s, Inches(0.5), Inches(0.7), Inches(0.12), Inches(1.15), ORANGE)
    # decorative corner
    oval(s, Inches(12.2), Inches(-0.6), Inches(1.8), Inches(1.8), CREAM)
    text(s, Inches(0.8), Inches(0.62), Inches(10), Inches(0.4),
         [[(kicker, 12, True, ORANGE)]])
    text(s, Inches(0.78), Inches(1.0), Inches(11.5), Inches(0.9),
         [[(title, 30, True, NAVY)]])
    body_fn(s)
    footer(s, no)
    return s


def divider_slide(no, kicker, title, subtitle_lines, bg=NAVY):
    s = slide()
    rect(s, 0, 0, EMU_W, EMU_H, bg)
    oval(s, Inches(-1.2), Inches(5.3), Inches(3.2), Inches(3.2), ORANGE)
    oval(s, Inches(11.6), Inches(-1.4), Inches(3.4), Inches(3.4),
         RGBColor(0x1d, 0x26, 0x3a))
    text(s, Inches(1.2), Inches(2.5), Inches(11), Inches(1.2),
         [[(kicker, 14, True, ORANGE)], [(title, 48, True, WHITE)]], space_after=4)
    text(s, Inches(1.25), Inches(4.2), Inches(10.5), Inches(2),
         [[(l, 17, False, RGBColor(0xCF, 0xD3, 0xDA))] for l in subtitle_lines],
         space_after=8, line_spacing=1.15)
    return s


# ════════════════════════════════════════════════════════════════════════
# 1 — TITLE
# ════════════════════════════════════════════════════════════════════════
s = slide()
rect(s, 0, 0, EMU_W, EMU_H, WHITE)
rect(s, Inches(8.9), 0, Inches(4.43), EMU_H, NAVY)
oval(s, Inches(11.0), Inches(2.4), Inches(2.7), Inches(2.7), ORANGE)
oval(s, Inches(10.2), Inches(4.6), Inches(1.2), Inches(1.2), RGBColor(0x1d,0x26,0x3a))
rect(s, Inches(0.9), Inches(2.5), Inches(0.14), Inches(2.0), ORANGE)
text(s, Inches(1.25), Inches(2.45), Inches(7), Inches(2.2),
     [[("USTAZ", 66, True, NAVY)],
      [("Trusted home-service professionals, on demand.", 20, True, ORANGE)]],
     space_after=10)
text(s, Inches(1.28), Inches(4.55), Inches(7), Inches(1.6),
     [[("Pakistan's verified marketplace for electricians, plumbers, carpenters,", 14, False, GRAY)],
      [("AC, solar & cleaning — with live tracking and a 3-day work guarantee.", 14, False, GRAY)]],
     space_after=4)
text(s, Inches(1.28), Inches(6.0), Inches(7), Inches(0.5),
     [[("● Live MVP:  ", 13, True, ORANGE), ("ustaz-bice.vercel.app", 13, True, NAVY)]])
# right panel logo text
text(s, Inches(8.9), Inches(5.6), Inches(4.43), Inches(0.5),
     [[("Applying for NIC Karachi incubation", 11, False, RGBColor(0xCF,0xD3,0xDA))]],
     align=PP_ALIGN.CENTER)

# ════════════════════════════════════════════════════════════════════════
# 2 — VISION
# ════════════════════════════════════════════════════════════════════════
divider_slide(2, "OUR VISION", "Vision", [
    "Making trusted home services as easy to book as a ride — across Pakistan.",
    "Because today, a family lets an unknown stranger into their home and hopes for the best.",
    "We are transforming an informal, trust-deficient market into a verified, real-time, accountable platform —",
    "and bringing dignity, steady digital income, and a portable reputation to Pakistan's millions of unrecognized tradesmen.",
])

# ════════════════════════════════════════════════════════════════════════
# 3 — TRACTION
# ════════════════════════════════════════════════════════════════════════
def s3(s):
    # ── TEAM FIRST (NIC v2.1: team is evaluated before traction) ──
    text(s, Inches(0.8), Inches(1.82), Inches(11.7), Inches(1.0),
         [[("Team — ", 14, True, ORANGE), ("3 co-founders: CEO/Tech · Product & Finance · CMO/Design.", 14, True, NAVY)],
          [("Marjan Ahmed — full-stack engineer, built the entire platform solo at 17 (GIAIC Senior · Agentic-AI engineer, Filion Capital · AI-finance hackathon winner).", 12, False, GRAY)]],
         space_after=3, line_spacing=1.08)
    # ── TRACTION ──
    bullets(s, Inches(0.8), Inches(3.0), Inches(7.3), Inches(4), [
        ("Built product — ", "live MVP + installable PWA at ustaz-bice.vercel.app (not a prototype or mockup)."),
        ("8+ core systems live — ", "phone-OTP auth, PostGIS matching, live GPS tracking, chat + push, prepaid wallet & commission, 3-day warranty, ratings, admin portal."),
        ("Security-hardened — ", "RLS on every table + SECURITY DEFINER RPCs, senior-reviewed auth."),
        ("Self-funded, built solo — ", "zero external capital spent to reach a production-grade platform."),
        ("Pilot — ", "live in Karachi, onboarding the first providers now (applying to NIC Karachi)."),
    ], size=13, gap=9)
    # stat card (placeholder testimonial removed — panel-ready)
    CL = RGBColor(0xCF, 0xD3, 0xDA)
    rect(s, Inches(8.55), Inches(3.0), Inches(3.95), Inches(3.05), NAVY)
    rect(s, Inches(8.55), Inches(3.0), Inches(3.95), Inches(0.12), ORANGE)
    text(s, Inches(8.85), Inches(3.28), Inches(3.4), Inches(2.7),
         [[("Built & shipped — solo", 12, True, ORANGE)],
          [("6", 28, True, WHITE), ("  service categories", 11.5, False, CL)],
          [("8+", 26, True, WHITE), ("  core systems live", 11.5, False, CL)],
          [("100%", 23, True, WHITE), ("  RLS-secured tables", 11.5, False, CL)],
          [("Rs. 0", 23, True, WHITE), ("  external capital raised", 11.5, False, CL)]],
         space_after=6)
content_slide(3, "3. TEAM & CURRENT TRACTION", "Who's building it — and what's already shipped", s3)

# ════════════════════════════════════════════════════════════════════════
# 4 — PROBLEM
# ════════════════════════════════════════════════════════════════════════
def s4(s):
    text(s, Inches(0.8), Inches(1.9), Inches(11.6), Inches(0.8),
         [[("The anxiety: ", 14, True, ORANGE),
           ("a Karachi mother's AC dies in the June heat. She must let an unknown man into her home, with no idea who he is, what he'll charge, when he'll arrive, or whether it'll break again tomorrow.", 13, False, GRAY)]],
         line_spacing=1.12)
    rows = [
        ("No verification", "Support", "An unknown stranger in your home — no identity check, no accountability."),
        ("Opaque pricing", "Financial", "Overcharging is routine — no standard rates, no upfront quote, no receipt."),
        ("No recourse / guarantee", "Process", "If the work fails a day later, the worker vanishes — broken workflow."),
        ("No visibility / ETA", "Productivity", "“He's on the way” means waiting blind for hours — like a ride with no map."),
        ("Supply side ignored", "Financial + Process", "Skilled workers have no steady demand, no digital reach, no portable reputation."),
    ]
    y = Inches(2.85)
    for pain, cat, desc in rows:
        rect(s, Inches(0.8), y, Inches(0.12), Inches(0.6), ORANGE)
        text(s, Inches(1.05), y, Inches(3.2), Inches(0.6), [[(pain, 13, True, NAVY)]], anchor=MSO_ANCHOR.MIDDLE)
        rect(s, Inches(4.35), y + Inches(0.08), Inches(1.95), Inches(0.44), CREAM)
        text(s, Inches(4.35), y + Inches(0.08), Inches(1.95), Inches(0.44),
             [[(cat, 10.5, True, ORANGE)]], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        text(s, Inches(6.5), y, Inches(6.0), Inches(0.6), [[(desc, 11.5, False, GRAY)]], anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.0)
        y += Inches(0.66)
    text(s, Inches(0.8), Inches(6.3), Inches(11.6), Inches(0.5),
         [[("Pain mapped to NIC's four categories — Financial · Productivity · Process · Support.", 11, True, NAVY)]])
content_slide(4, "4. PROBLEM & CUSTOMER PAIN POINTS", "Home services in Pakistan are broken on trust", s4)

# ════════════════════════════════════════════════════════════════════════
# 5 — SOLUTION
# ════════════════════════════════════════════════════════════════════════
def s5(s):
    text(s, Inches(0.8), Inches(1.95), Inches(11.5), Inches(0.5),
         [[("An on-demand marketplace of verified pros, matched by location and tracked live.", 16, True, ORANGE)]])
    # 3 steps
    steps = [("1", "Pick a service & location", "Choose from electrician, plumber, carpenter, AC, solar or cleaning — set your spot on the map."),
             ("2", "Get matched instantly", "PostGIS finds nearby phone-verified providers; they accept in real time."),
             ("3", "Track live & pay on done", "Watch your pro arrive on a live map, chat in-app, pay on completion — covered by a 3-day warranty.")]
    x = Inches(0.8)
    for num, head, body in steps:
        card = rect(s, x, Inches(2.7), Inches(3.7), Inches(2.5), CREAM)
        oval(s, x + Inches(0.25), Inches(2.95), Inches(0.7), Inches(0.7), ORANGE)
        text(s, x + Inches(0.25), Inches(3.0), Inches(0.7), Inches(0.6),
             [[(num, 22, True, WHITE)]], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        text(s, x + Inches(0.25), Inches(3.85), Inches(3.2), Inches(1.3),
             [[(head, 14.5, True, NAVY)], [(body, 11.5, False, GRAY)]], space_after=6, line_spacing=1.08)
        x += Inches(3.95)
    text(s, Inches(0.8), Inches(5.5), Inches(11.6), Inches(0.8),
         [[("Trust built in:  ", 13, True, NAVY),
           ("phone-verified providers · live GPS · in-app chat & push · 3-day free re-fix · two-way ratings · prepaid escrow wallet.", 13, False, GRAY)]])
content_slide(5, "5. SOLUTION & MVP", "Verified. Tracked. Guaranteed.", s5)

# ════════════════════════════════════════════════════════════════════════
# 6 — TECH STACK
# ════════════════════════════════════════════════════════════════════════
def s6(s):
    cols = [
        ("FRONTEND", ["Next.js 15 (App Router, Turbopack)", "React + Tailwind, PWA (offline-ready)", "Capacitor — native Android shell", "Google Maps live tracking UI"]),
        ("BACKEND", ["Supabase Postgres + PostGIS", "Row-Level Security + SECURITY DEFINER RPCs", "Realtime (broadcast + postgres_changes)", "Edge Functions (Deno)"]),
        ("SERVICES", ["Twilio Verify — phone OTP", "Firebase Cloud Messaging — push", "Google Maps — geocoding & maps", "Resend — transactional email"]),
    ]
    x = Inches(0.8)
    for title_, items in cols:
        rect(s, x, Inches(2.0), Inches(3.8), Inches(3.1), WHITE, line=LITEOR)
        rect(s, x, Inches(2.0), Inches(3.8), Inches(0.5), NAVY)
        text(s, x, Inches(2.05), Inches(3.8), Inches(0.45),
             [[(title_, 13, True, WHITE)]], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        bullets(s, x + Inches(0.2), Inches(2.65), Inches(3.5), Inches(2.4), items, size=11.5, gap=9)
        x += Inches(4.0)
    text(s, Inches(0.8), Inches(5.4), Inches(11.6), Inches(1.35),
         [[("Building now (pilot):  ", 13, True, ORANGE),
           ("automated JazzCash/EasyPaisa webhook reconciliation — replacing manual receipt review — plus native iOS/Android apps.", 12.5, False, GRAY)],
          [("Next:  ", 13, True, ORANGE),
           ("payment-gateway + Raast · per-query KYC & background checks · multi-city expansion · provider financing & insurance partnerships.", 12.5, False, GRAY)]],
         line_spacing=1.12, space_after=5)
content_slide(6, "5 · TECH STACK & PRODUCT ROADMAP", "A real-time marketplace, engineered to scale", s6)

# ════════════════════════════════════════════════════════════════════════
# 7 — CUSTOMER SEGMENTS
# ════════════════════════════════════════════════════════════════════════
def s7(s):
    # Demand persona
    rect(s, Inches(0.8), Inches(1.95), Inches(5.65), Inches(4.3), CREAM)
    rect(s, Inches(0.8), Inches(1.95), Inches(5.65), Inches(0.12), ORANGE)
    text(s, Inches(1.1), Inches(2.2), Inches(5.1), Inches(0.6),
         [[("DEMAND — “Safe Household Manager”", 13.5, True, ORANGE)]])
    text(s, Inches(1.1), Inches(2.8), Inches(5.15), Inches(3.3),
         [[("Demographic: ", 12, True, NAVY), ("age 28–50, urban Karachi, SEC A/B household.", 12, False, GRAY)],
          [("Geographic: ", 12, True, NAVY), ("DHA, Clifton, Gulshan, PECHS, North Nazimabad.", 12, False, GRAY)],
          [("Psychographic: ", 12, True, NAVY), ("values safety over price; has been overcharged; manages the home; won't risk an unverified stranger; wants a visible ETA and accountability.", 12, False, GRAY)],
          [("Trigger: ", 12, True, ORANGE), ("AC breaks in June — needs a trusted technician today, not a stranger from a Facebook group.", 12, False, GRAY)]],
         space_after=7, line_spacing=1.08)
    # Supply persona
    rect(s, Inches(6.85), Inches(1.95), Inches(5.65), Inches(4.3), NAVY)
    rect(s, Inches(6.85), Inches(1.95), Inches(5.65), Inches(0.12), ORANGE)
    text(s, Inches(7.15), Inches(2.2), Inches(5.1), Inches(0.6),
         [[("SUPPLY — “Underserved Tradesman”", 13.5, True, ORANGE)]])
    CL = RGBColor(0xCF, 0xD3, 0xDA)
    text(s, Inches(7.15), Inches(2.8), Inches(5.15), Inches(3.3),
         [[("Demographic: ", 12, True, WHITE), ("age 22–45, skilled electrician / plumber / AC tech.", 12, False, CL)],
          [("Geographic: ", 12, True, WHITE), ("works across Karachi, based in lower-income areas.", 12, False, CL)],
          [("Psychographic: ", 12, True, WHITE), ("wants steady, predictable digital demand and a reputation that travels with him; tired of middlemen taking large cuts.", 12, False, CL)],
          [("Trigger: ", 12, True, ORANGE), ("wants to stop depending on ustads / contractors and own his own customer pipeline.", 12, False, CL)]],
         space_after=7, line_spacing=1.08)
    text(s, Inches(0.8), Inches(6.4), Inches(11.7), Inches(0.4),
         [[("This two-sided pool — Karachi's middle-class households × the city's skilled tradesmen — is our SAM foundation (sizing on next slide).", 11, False, NAVY)]])
content_slide(7, "6. CUSTOMER SEGMENTATION & PERSONA", "Two personas, served on both sides", s7)

# ════════════════════════════════════════════════════════════════════════
# 8 — MARKET SIZING
# ════════════════════════════════════════════════════════════════════════
def s8(s):
    data = [("01", "TAM", "~$3–5B",
             "Pakistan home services (informal + formal).  Source: SMEDA / ILO, 2024."),
            ("02", "SAM", "~$600M",
             "Smartphone-enabled urban households — Karachi, Lahore, Islamabad, Faisalabad.  Source: PTA / PBS HIES, 2025."),
            ("03", "SOM", "~PKR 1.4M",
             "Year 1, Karachi: 5,000 households × 4 jobs/yr × PKR 72 commission.")]
    x = Inches(0.8)
    for num, code, figure, desc in data:
        rect(s, x, Inches(2.1), Inches(3.8), Inches(3.7), WHITE, line=LITEOR)
        oval(s, x + Inches(1.35), Inches(1.75), Inches(1.1), Inches(1.1), ORANGE)
        text(s, x + Inches(1.35), Inches(1.82), Inches(1.1), Inches(1.0),
             [[(num, 22, True, WHITE)]], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        text(s, x, Inches(2.95), Inches(3.8), Inches(0.45),
             [[(code, 16, True, NAVY)]], align=PP_ALIGN.CENTER)
        text(s, x, Inches(3.38), Inches(3.8), Inches(0.6),
             [[(figure, 27, True, ORANGE)]], align=PP_ALIGN.CENTER)
        text(s, x + Inches(0.25), Inches(4.2), Inches(3.3), Inches(1.5),
             [[(desc, 10.5, False, GRAY)]], align=PP_ALIGN.CENTER, line_spacing=1.08)
        x += Inches(4.0)
    # bottom-up SOM formula band (numbers filled in)
    rect(s, Inches(0.8), Inches(5.95), Inches(11.7), Inches(0.95), NAVY)
    text(s, Inches(1.05), Inches(6.03), Inches(11.3), Inches(0.85),
         [[("Bottom-up SOM:  ", 12, True, ORANGE),
           ("5,000 Karachi households × 4 jobs/yr × PKR 600 avg job × 12% = ~PKR 1.44M (Year 1, conservative — matches our QRR plan).", 11, False, WHITE)],
          [("Market data limited at this stage — joining NIC to validate. Sources: SMEDA/ILO 2024 · PTA/PBS HIES 2024–25.", 10, True, RGBColor(0xCF,0xD3,0xDA))]],
         space_after=3, line_spacing=1.04)
content_slide(8, "7. MARKET SIZING  (TAM · SAM · SOM)", "A vast, underserved, digitizing market", s8)

# ════════════════════════════════════════════════════════════════════════
# 9 — UVP
# ════════════════════════════════════════════════════════════════════════
s = slide()
rect(s, 0, 0, EMU_W, EMU_H, CREAM)
rect(s, 0, Inches(2.6), EMU_W, Inches(2.3), NAVY)
oval(s, Inches(11.3), Inches(0.5), Inches(1.6), Inches(1.6), ORANGE)
text(s, Inches(0.8), Inches(0.9), Inches(11), Inches(0.5), [[("8. UNIQUE VALUE PROPOSITION (UVP)", 12, True, ORANGE)]])
text(s, Inches(0.8), Inches(1.45), Inches(11.5), Inches(0.9),
     [[("Trust a stranger in your home — for the first time.", 28, True, NAVY)]])
text(s, Inches(1.0), Inches(2.85), Inches(11.3), Inches(1.9),
     [[("USTAZ verifies every pro, shows you exactly where they are, and ", 18, False, WHITE),
       ("guarantees the work for 3 days — or we fix it free.", 18, True, ORANGE)],
      [("Halal by design — no interest, no hidden charges, just a transparent service fee.", 16, True, LITEOR)]],
     anchor=MSO_ANCHOR.MIDDLE, space_after=10, line_spacing=1.16)
chips = ["Feel safe at the door", "See them on the way", "Covered for 3 days", "Halal, transparent fee"]
x = Inches(0.8)
for c in chips:
    w = Inches(2.95)
    rect(s, x, Inches(5.4), w, Inches(0.8), WHITE, line=LITEOR)
    text(s, x, Inches(5.4), w, Inches(0.8), [[(c, 13, True, NAVY)]],
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    x += Inches(3.05)
footer(s, 9)

# ════════════════════════════════════════════════════════════════════════
# 10 — COMPETITORS
# ════════════════════════════════════════════════════════════════════════
def s10(s):
    headers = ["Alternative", "Verified", "Live GPS", "Warranty", "Escrow", "Reputation", "Price clarity"]
    data = [
        ("USTAZ",            "✓", "✓", "✓", "✓", "✓", "✓"),
        ("Mahir",            "~", "✗", "✗", "✗", "~", "~"),
        ("RepairGuru",       "~", "✗", "✗", "✗", "~", "~"),
        ("OLX / classifieds","✗", "✗", "✗", "✗", "✗", "✗"),
        ("Facebook groups",  "✗", "✗", "✗", "✗", "✗", "✗"),
        ("Word-of-mouth",    "✗", "✗", "✗", "✗", "~", "✗"),
    ]
    rows = len(data) + 1
    cols = len(headers)
    tbl = s.shapes.add_table(rows, cols, Inches(0.8), Inches(1.95), Inches(11.7), Inches(3.55)).table
    tbl.columns[0].width = Inches(2.7)
    for c in range(1, cols):
        tbl.columns[c].width = Inches(1.5)
    for c in range(cols):
        cell = tbl.cell(0, c); cell.fill.solid(); cell.fill.fore_color.rgb = NAVY
        p = cell.text_frame.paragraphs[0]; p.alignment = PP_ALIGN.CENTER if c else PP_ALIGN.LEFT
        r = p.add_run(); r.text = headers[c]; r.font.size = Pt(11); r.font.bold = True
        r.font.color.rgb = WHITE; r.font.name = FONT
    GREEN = RGBColor(0x1E, 0x9E, 0x5A); RED = RGBColor(0xC2, 0x3B, 0x22); AMB = RGBColor(0xC9, 0x7A, 0x12)
    for ri, row in enumerate(data, start=1):
        is_ustaz = ri == 1
        for ci, val in enumerate(row):
            cell = tbl.cell(ri, ci); cell.fill.solid()
            cell.fill.fore_color.rgb = (LITEOR if is_ustaz else (CREAM if ri % 2 else WHITE)) if ci else (ORANGE if is_ustaz else WHITE)
            p = cell.text_frame.paragraphs[0]; p.alignment = PP_ALIGN.LEFT if ci == 0 else PP_ALIGN.CENTER
            r = p.add_run()
            if ci == 0:
                r.text = val; r.font.bold = True
                r.font.color.rgb = WHITE if is_ustaz else NAVY; r.font.size = Pt(11.5)
            else:
                r.text = {"✓": "✓", "~": "~", "✗": "✗"}[val]; r.font.bold = True; r.font.size = Pt(13)
                r.font.color.rgb = GREEN if val == "✓" else (AMB if val == "~" else RED)
            r.font.name = FONT
    rect(s, Inches(0.8), Inches(5.62), Inches(11.7), Inches(0.46), CREAM)
    text(s, Inches(1.0), Inches(5.62), Inches(11.3), Inches(0.46),
         [[("The real competitor is informality — ~90–95% of the market is still cash, unverified, untracked.  ", 11, True, NAVY),
           ("(industry estimate)", 9, False, LGRAY)]], anchor=MSO_ANCHOR.MIDDLE)
    rect(s, Inches(0.8), Inches(6.16), Inches(11.7), Inches(0.74), NAVY)
    text(s, Inches(1.0), Inches(6.16), Inches(11.3), Inches(0.74),
         [[("Why bookings stay on-platform (anti-disintermediation):  ", 11, True, ORANGE)],
          [("3-day warranty & dispute cover apply only to in-app jobs · a provider's ratings, job history & search visibility — i.e. their future demand — live only here · customer loyalty credits + wallet incentives. Going cash-direct forfeits all of it.", 10, False, WHITE)]],
         anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.0, space_after=1)
content_slide(10, "9. COMPETITOR ANALYSIS / ALTERNATIVES", "We compete with chaos — and beat it", s10)

# ════════════════════════════════════════════════════════════════════════
# 11 — CHANNELS
# ════════════════════════════════════════════════════════════════════════
def s11(s):
    # Demand side
    rect(s, Inches(0.8), Inches(1.95), Inches(5.65), Inches(4.35), CREAM)
    rect(s, Inches(0.8), Inches(1.95), Inches(5.65), Inches(0.12), ORANGE)
    text(s, Inches(1.1), Inches(2.2), Inches(5.1), Inches(0.5), [[("DEMAND  ·  acquiring customers", 13, True, ORANGE)]])
    bullets(s, Inches(1.1), Inches(2.8), Inches(5.15), Inches(3.4), [
        ("Meta / TikTok ads — ", "Karachi women 25–45, home-owner interest."),
        ("SEO landing pages — ", "per service × city (already shipped — a live channel asset)."),
        ("Residential societies (B2B2C) — ", "one manager unlocks 200+ households."),
        ("Referral loop — ", "customers earn for each new customer."),
        ("Community & mosque networks — ", "trust-building in conservative areas."),
    ], size=12, gap=8)
    # Supply side
    rect(s, Inches(6.85), Inches(1.95), Inches(5.65), Inches(4.35), NAVY)
    rect(s, Inches(6.85), Inches(1.95), Inches(5.65), Inches(0.12), ORANGE)
    text(s, Inches(7.15), Inches(2.2), Inches(5.1), Inches(0.5), [[("SUPPLY  ·  acquiring providers", 13, True, ORANGE)]])
    CL = RGBColor(0xCF, 0xD3, 0xDA)
    bullets(s, Inches(7.15), Inches(2.8), Inches(5.15), Inches(3.4), [
        ("Door-to-door — ", "Karachi trade hubs (Saddar, Lea Market, Sohrab Goth)."),
        ("Ustad / contractor referrals — ", "master tradesmen refer apprentices."),
        ("Provider-led word-of-mouth — ", "satisfied pros recruit peers, at zero cost."),
        ("Trade associations — ", "electrician & plumber guild outreach."),
    ], size=12, gap=9, color=CL)
    text(s, Inches(0.8), Inches(6.45), Inches(11.7), Inches(0.4),
         [[("Referral loops on both sides drive CAC down over time as the network compounds.", 11, True, NAVY)]])
content_slide(11, "10. MARKETING & DISTRIBUTION CHANNELS", "Two acquisition engines, one flywheel", s11)

# ════════════════════════════════════════════════════════════════════════
# 12 — REVENUE STREAMS
# ════════════════════════════════════════════════════════════════════════
def s12(s):
    CL = RGBColor(0xCF, 0xD3, 0xDA)
    # ── Left: how the prepaid credit / commission works ──
    rect(s, Inches(0.8), Inches(1.95), Inches(6.2), Inches(4.0), NAVY)
    rect(s, Inches(0.8), Inches(1.95), Inches(6.2), Inches(0.12), ORANGE)
    text(s, Inches(1.1), Inches(2.2), Inches(5.7), Inches(0.5), [[("HOW WE EARN  ·  prepaid wallet", 13, True, ORANGE)]])
    steps = [
        ("1", "Free Rs. 500 welcome credit", "Every new provider claims Rs. 500 on their dashboard — start earning with no upfront cost."),
        ("2", "12% deducted per completed job", "On each finished job the platform deducts a 12% commission from the provider's wallet (e.g. a Rs. 500 job → Rs. 60)."),
        ("3", "Top up when credit runs low", "The free Rs. 500 credit covers the first several jobs; then the provider tops up to keep receiving jobs (0 balance = paused)."),
    ]
    y = Inches(2.75)
    for n, head, body in steps:
        oval(s, Inches(1.1), y, Inches(0.45), Inches(0.45), ORANGE)
        text(s, Inches(1.1), y, Inches(0.45), Inches(0.45), [[(n, 13, True, WHITE)]],
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        text(s, Inches(1.7), y - Inches(0.04), Inches(5.1), Inches(1.0),
             [[(head, 12.5, True, WHITE)], [(body, 10.5, False, CL)]], space_after=2, line_spacing=1.03)
        y += Inches(1.02)
    # ── Right: top-up packages ──
    rect(s, Inches(7.3), Inches(1.95), Inches(5.2), Inches(4.0), WHITE, line=LITEOR)
    rect(s, Inches(7.3), Inches(1.95), Inches(5.2), Inches(0.12), ORANGE)
    text(s, Inches(7.6), Inches(2.2), Inches(4.6), Inches(0.5), [[("TOP-UP PACKAGES", 13, True, ORANGE)]])
    pkgs = [("Starter", "Rs. 500", "Just testing"),
            ("Standard", "Rs. 1,000", "Regular work  ·  popular"),
            ("Pro", "Rs. 2,000", "Full-time")]
    y = Inches(2.75)
    for label, amt, tag in pkgs:
        rect(s, Inches(7.6), y, Inches(4.6), Inches(0.78), CREAM)
        rect(s, Inches(7.6), y, Inches(0.1), Inches(0.78), ORANGE)
        text(s, Inches(7.8), y, Inches(2.3), Inches(0.78),
             [[(label, 13, True, NAVY)], [(tag, 9.5, False, GRAY)]], space_after=1, anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.0)
        text(s, Inches(10.0), y, Inches(2.1), Inches(0.78), [[(amt, 16, True, ORANGE)]],
             align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE)
        y += Inches(0.88)
    text(s, Inches(7.6), Inches(5.5), Inches(4.7), Inches(0.4),
         [[("Pay via Easypaisa · JazzCash · Bank → upload receipt → admin credits wallet.", 10, False, GRAY)]], line_spacing=1.0)
    # ── Bottom band: status (resolves pre-revenue contradiction) + ujrah ──
    rect(s, Inches(0.8), Inches(6.05), Inches(11.7), Inches(0.85), CREAM)
    text(s, Inches(1.05), Inches(6.05), Inches(11.4), Inches(0.85),
         [[("Status: ", 11, True, ORANGE),
           ("the 12% monetization engine is fully built & live in-product. Pre-revenue today — pilot providers run on the free Rs. 500 credit, so commission collected ≈ Rs. 0 so far; revenue starts as they exhaust credit and top up.", 10.5, False, NAVY)],
          [("Sharia (ujrah): fee charged ONLY on completed, customer-confirmed jobs; unused prepaid credit fully refundable; Sharia advisory via NIC pre-launch. No interest, no ambiguity.", 10.5, False, GRAY)]],
         anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.02, space_after=2)
content_slide(12, "11. REVENUE STREAMS & BUSINESS MODEL", "Free credit, then a 12% prepaid commission", s12)

# ════════════════════════════════════════════════════════════════════════
# 13 — COST STRUCTURE
# ════════════════════════════════════════════════════════════════════════
def s13(s):
    CL = RGBColor(0xCF, 0xD3, 0xDA)
    # Left — CapEx list
    rect(s, Inches(0.8), Inches(1.95), Inches(3.5), Inches(3.5), CREAM)
    rect(s, Inches(0.8), Inches(1.95), Inches(3.5), Inches(0.12), ORANGE)
    text(s, Inches(1.05), Inches(2.18), Inches(3.0), Inches(0.5), [[("CAPEX · one-time", 13, True, ORANGE)]])
    bullets(s, Inches(1.05), Inches(2.72), Inches(3.1), Inches(2.6), [
        "Product dev — done (founder-built)",
        "Office space & setup",
        "Brand & design system",
        "Native mobile app build",
        "Verification system (one-time build)",
    ], size=11.5, gap=10)
    # Right — OpEx burn table
    text(s, Inches(4.55), Inches(2.0), Inches(8), Inches(0.4),
         [[("OPEX · monthly  ", 12, True, ORANGE), ("(PKR — illustrative 2025 list prices)", 10, False, GRAY)]])
    rows, cols = 7, 3
    tbl = s.shapes.add_table(rows, cols, Inches(4.55), Inches(2.45), Inches(7.95), Inches(2.95)).table
    tbl.columns[0].width = Inches(3.55); tbl.columns[1].width = Inches(2.2); tbl.columns[2].width = Inches(2.2)
    hdr = ["Line item", "Pre-revenue", "500 jobs/mo"]
    data = [
        ("Supabase + Vercel", "~8–12K", "~15–25K"),
        ("Twilio OTP", "~3K", "~8K"),
        ("Google Maps API", "~2K", "~6K"),
        ("FCM / Resend", "Free", "Free"),
        ("Domain & misc", "~3K", "~3K"),
        ("Total cloud burn", "~16–20K", "~32–42K"),
    ]
    for c in range(cols):
        cell = tbl.cell(0, c); cell.fill.solid(); cell.fill.fore_color.rgb = NAVY
        p = cell.text_frame.paragraphs[0]; p.alignment = PP_ALIGN.LEFT if c == 0 else PP_ALIGN.CENTER
        r = p.add_run(); r.text = hdr[c]; r.font.size = Pt(11); r.font.bold = True; r.font.color.rgb = WHITE; r.font.name = FONT
    for ri, row in enumerate(data, start=1):
        total = ri == len(data)
        for ci, val in enumerate(row):
            cell = tbl.cell(ri, ci); cell.fill.solid()
            cell.fill.fore_color.rgb = LITEOR if total else (CREAM if ri % 2 else WHITE)
            p = cell.text_frame.paragraphs[0]; p.alignment = PP_ALIGN.LEFT if ci == 0 else PP_ALIGN.CENTER
            r = p.add_run(); r.text = val; r.font.size = Pt(11); r.font.bold = (ci == 0 or total)
            r.font.color.rgb = NAVY if (ci == 0 or total) else ORANGE; r.font.name = FONT
    # NIC saving band
    rect(s, Inches(0.8), Inches(5.58), Inches(11.7), Inches(1.12), NAVY)
    text(s, Inches(1.05), Inches(5.66), Inches(11.3), Inches(1.0),
         [[("With NIC Karachi incubation:  ", 12, True, ORANGE),
           ("free office + zero utilities save ~PKR 80–120K/mo — that single saving dwarfs our entire cloud burn, redirected straight into provider acquisition.", 11, False, WHITE)],
          [("Variable OpEx (scales with volume): per-query KYC/identity checks + field acquisition (agent + signups). The free Rs. 500 credit is a non-cash virtual token — it delays commission, not upfront cash.", 10, True, CL)]],
         space_after=3, line_spacing=1.04)
content_slide(13, "12. COST STRUCTURE  (CapEx vs OpEx)", "A lean, software-margin business", s13)

# ════════════════════════════════════════════════════════════════════════
# 14 — FINANCIALS
# ════════════════════════════════════════════════════════════════════════
def s14(s):
    text(s, Inches(0.8), Inches(1.95), Inches(11.5), Inches(0.5),
         [[("Pre-revenue MVP today — high-margin economics as marketplace liquidity builds.", 15, True, ORANGE)]])
    cards = [("Revenue driver", "Completed jobs × commission per job. Grows with provider liquidity & repeat rate."),
             ("Gross margin", "Software margins — minimal cost per transaction once a city reaches density."),
             ("Burn", "Lean: cloud + APIs + acquisition. No inventory, no fleet, no salaries beyond core team.")]
    x = Inches(0.8)
    for head, body in cards:
        rect(s, x, Inches(2.7), Inches(3.8), Inches(2.0), WHITE, line=LITEOR)
        rect(s, x, Inches(2.7), Inches(3.8), Inches(0.12), ORANGE)
        text(s, x + Inches(0.25), Inches(2.95), Inches(3.3), Inches(1.7),
             [[(head, 14.5, True, NAVY)], [(body, 12, False, GRAY)]], space_after=6, line_spacing=1.12)
        x += Inches(4.0)
    rect(s, Inches(0.8), Inches(5.05), Inches(11.7), Inches(1.65), CREAM)
    text(s, Inches(1.1), Inches(5.2), Inches(11.2), Inches(1.4),
         [[("Pre-revenue — joining NIC to build professional financial models with mentorship support.", 12.5, True, NAVY)],
          [("Unit economics:  ", 12, True, ORANGE),
           ("avg job ≈ PKR 600  →  revenue/job = PKR 72  →  break-even ≈ 280 jobs/mo at ~PKR 20K cloud burn.", 11.5, False, GRAY)],
          [("Free Rs. 500 welcome credit = provider-acquisition cost. Figures illustrative until validated — detailed P&L built during incubation.", 10.5, True, LGRAY)]],
         space_after=5, line_spacing=1.12)
content_slide(14, "13. FINANCIALS", "Lean burn, scalable margins", s14)

# ════════════════════════════════════════════════════════════════════════
# 15 — KEY METRICS (table)
# ════════════════════════════════════════════════════════════════════════
def s16(s):
    text(s, Inches(0.8), Inches(1.95), Inches(11.5), Inches(0.5),
         [[("Exit path", 16, True, ORANGE)]])
    bullets(s, Inches(0.8), Inches(2.5), Inches(11.6), Inches(2), [
        ("Primary — strategic acquisition: ", "by a super-app, classifieds leader, telco, or bank scaling into home services."),
        ("Likely acquirers: ", "Jazz / PTCL (telco super-app), OLX Pakistan (classifieds → services), Careem Pakistan, HBL / Meezan (bank-led services)."),
        ("Secondary — regional roll-up → ", "dominate Pakistan, then list on PSX or expand to comparable markets."),
    ], size=13.5, gap=10)
    text(s, Inches(0.8), Inches(4.35), Inches(11.5), Inches(0.5),
         [[("Corporate structure & governance", 16, True, ORANGE)]])
    bullets(s, Inches(0.8), Inches(4.9), Inches(11.6), Inches(2), [
        ("Today: ", "early-stage / unregistered — planning Pvt Ltd (SECP) registration within ~3–6 months of incubation, with NIC legal mentorship."),
        ("Equity: ", "3 co-founders on an agreed split; 4-year vesting + anti-dilution & exit clauses to be formalised with NIC legal support pre-investment."),
    ], size=13.5, gap=10)
content_slide(15, "14. LONG-TERM VISION & EXIT STRATEGY", "Building Pakistan's default home-services brand", s16)

# ════════════════════════════════════════════════════════════════════════
# KEY METRICS & PROJECTIONS (table)
# ════════════════════════════════════════════════════════════════════════
def s15(s):
    text(s, Inches(0.8), Inches(1.9), Inches(11.6), Inches(0.6),
         [[("Bottom-up Year-1 plan (illustrative) — built from active providers × jobs × Rs. 72 commission/job.", 13.5, True, ORANGE)]])
    rows, cols = 6, 5
    left, top = Inches(0.8), Inches(2.55)
    w, h = Inches(11.7), Inches(3.0)
    tbl = s.shapes.add_table(rows, cols, left, top, w, h).table
    headers = ["Metric", "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"]
    metrics = [
        ["Active providers", "40", "75", "120", "175"],
        ["Jobs / month", "480", "1,050", "1,920", "3,150"],
        ["Commission / job", "Rs. 72", "Rs. 72", "Rs. 72", "Rs. 72"],
        ["QRR — revenue (PKR)", "~104K", "~227K", "~415K", "~680K"],
        ["Customer CAC (PKR)", "500", "350", "230", "150"],
    ]
    tbl.columns[0].width = Inches(3.1)
    for c in range(1, cols):
        tbl.columns[c].width = Inches(2.15)
    for c in range(cols):
        cell = tbl.cell(0, c)
        cell.fill.solid(); cell.fill.fore_color.rgb = NAVY
        p = cell.text_frame.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
        r = p.add_run(); r.text = headers[c]; r.font.size = Pt(12); r.font.bold = True
        r.font.color.rgb = WHITE; r.font.name = FONT
    for ri, mrow in enumerate(metrics, start=1):
        for ci, val in enumerate(mrow):
            cell = tbl.cell(ri, ci)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CREAM if ri % 2 else WHITE
            if ci == 0:
                cell.fill.fore_color.rgb = WHITE
            p = cell.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT if ci == 0 else PP_ALIGN.CENTER
            r = p.add_run(); r.text = val
            r.font.size = Pt(12); r.font.bold = (ci == 0)
            r.font.color.rgb = NAVY if ci == 0 else ORANGE
            r.font.name = FONT
    text(s, Inches(0.8), Inches(5.7), Inches(11.7), Inches(1.1),
         [[("LTV ≈ Rs. 1,300 ", 11.5, True, ORANGE), ("(≈ 6 jobs/yr × Rs. 72 × ~3-yr retention).    ", 11.5, False, GRAY),
           ("Customer CAC: Rs. 500 → Rs. 150 ", 11.5, True, NAVY), ("as referral loops compound.", 11.5, False, GRAY)],
          [("Provider acquisition (field agent + signups) is budgeted separately. Year-1 revenue ≈ Rs. 1.4M (illustrative bottom-up) — validated in pilot, refined with NIC.", 10.5, True, LGRAY)]],
         space_after=4, line_spacing=1.1)
content_slide(16, "15. KEY METRICS & PROJECTIONS", "Bottom-up Year-1 economics (FY 2026)", s15)

# ════════════════════════════════════════════════════════════════════════
# 17 — FOUNDER & TEAM
# ════════════════════════════════════════════════════════════════════════
def s17(s):
    text(s, Inches(0.8), Inches(1.9), Inches(11.5), Inches(0.5),
         [[("A technical founder, backed by product, finance, growth & design.", 15, True, ORANGE)]])
    CL = RGBColor(0xCF, 0xD3, 0xDA)
    members = [
        ("MAR", "Marjan Ahmed", "Founder & CEO", "The Hacker / CTO",
         "Full-stack engineer — built all of USTAZ solo at 17. GIAIC Senior · Agentic-AI engineer at Filion Capital · AI-finance hackathon winner."),
        ("MAS", "Masood Alam", "Product Director & Financial Consultant", "The Hustler",
         "Steers product direction and the commission / wallet financial model & unit economics."),
        ("MSA", "Muhammad Sufyan Ahmed", "CMO & Designer", "Growth & Brand",
         "Owns brand, growth marketing and the product design system & UX."),
    ]
    x = Inches(0.8)
    for initials, name, role, arche, desc in members:
        rect(s, x, Inches(2.35), Inches(3.8), Inches(3.7), NAVY)
        rect(s, x, Inches(2.35), Inches(3.8), Inches(0.12), ORANGE)
        oval(s, x + Inches(1.5), Inches(2.65), Inches(0.8), Inches(0.8), ORANGE)
        text(s, x + Inches(1.5), Inches(2.68), Inches(0.8), Inches(0.72),
             [[(initials, 15, True, WHITE)]], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        text(s, x + Inches(0.25), Inches(3.6), Inches(3.35), Inches(2.4),
             [[(name, 14.5, True, WHITE)],
              [(role, 11, True, ORANGE)],
              [(arche + " — NIC archetype", 9.5, True, CL)],
              [(desc, 10.5, False, CL)]],
             space_after=4, line_spacing=1.06)
        x += Inches(4.0)
    text(s, Inches(0.8), Inches(6.2), Inches(11.7), Inches(0.62),
         [[("Staying lean: ", 12, True, ORANGE),
           ("we batch-verify through trade associations & guild leaders (20–30 tradesmen at a time) as proxy aggregators — so 3 founders scale supply without drowning in manual checks. Post-incubation: recruit a COO for city ops (NIC helps).", 10.5, False, GRAY)]],
         line_spacing=1.04)
content_slide(17, "16. FOUNDERS & CORE TEAM", "Already built. Ready to scale.", s17)

# ════════════════════════════════════════════════════════════════════════
# 18 — CONTACT / THANK YOU
# ════════════════════════════════════════════════════════════════════════
s = slide()
rect(s, 0, 0, EMU_W, EMU_H, WHITE)
rect(s, 0, 0, Inches(4.6), EMU_H, NAVY)
oval(s, Inches(-1.0), Inches(5.4), Inches(2.6), Inches(2.6), ORANGE)
text(s, Inches(0.6), Inches(2.7), Inches(3.6), Inches(1.4),
     [[("USTAZ", 44, True, WHITE)], [("Trusted pros, on demand.", 14, True, ORANGE)]], space_after=8)
text(s, Inches(5.2), Inches(1.4), Inches(7.5), Inches(0.8), [[("Thank you", 40, True, NAVY)]])
text(s, Inches(5.2), Inches(2.5), Inches(7.5), Inches(0.5), [[("CONTACT", 13, True, ORANGE)]])
contact = [
    ("Website", "ustaz-bice.vercel.app"),
    ("Email", "marjanahmed.dev@gmail.com"),
    ("Founder", "Marjan Ahmed — Founder & CEO"),
    ("Location", "Karachi, Pakistan"),
]
y = Inches(3.15)
for label, val in contact:
    rect(s, Inches(5.2), y + Inches(0.07), Inches(0.12), Inches(0.4), ORANGE)
    text(s, Inches(5.45), y, Inches(2.0), Inches(0.5), [[(label, 13, True, NAVY)]], anchor=MSO_ANCHOR.MIDDLE)
    text(s, Inches(7.4), y, Inches(5.2), Inches(0.5), [[(val, 13, False, GRAY)]], anchor=MSO_ANCHOR.MIDDLE)
    y += Inches(0.62)
text(s, Inches(5.2), Inches(6.2), Inches(7.5), Inches(0.5),
     [[("Applying for NIC Karachi incubation", 11, False, LGRAY)]])

prs.save("USTAZ-Pitch-Deck.pptx")
print("Saved USTAZ-Pitch-Deck.pptx with", len(prs.slides._sldIdLst), "slides")
