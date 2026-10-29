#!/usr/bin/env python3
"""
pricing_data.py — the plan data, and the only place it is written.

It used to parse index.html's `V` object, because that was where the numbers
lived and a second copy would drift the first time a price changed. The five
sector pages were removed on 2026-10-29 and `V` went with them, so the numbers
now live here instead. The rule has not changed, only the address: ONE place
holds a price, and the pricing page renders it.

Each tier is [name, price, minutes, calls, [features...]], the shape the old
object used, so the renderer did not need rewriting. A tier may carry two more
entries: a price suffix ("per location") and an options dict — `from` for a
"From $x" prefix, `note` for a line under the card, and `cta` for a button that
is not the default one.
"""

import sys

# Order they appear on the pricing page.
VERTICALS = [
    ("home", "Home services & trades"),
    ("food", "Restaurants & cafés"),
    ("clinic", "Clinics & dental"),
    ("other", "Any other business"),
]

PLANS = {
    "home": {
        "label": "Home services & trades",
        "tiers": [
            [
                "Starter",
                "$179",
                "Up to 150 minutes",
                "about 100 calls",
                [
                    "After-hours or overflow answering",
                    "Live Google Calendar booking",
                    "Emergency detection with instant transfer to you",
                    "SMS summary to you with the caller's real number",
                    "Caller confirmation text",
                    "Missed-call text-back",
                    "Spam filtering",
                    "Dashboard with transcripts",
                    "14-day call history",
                ],
            ],
            [
                "Growth",
                "$349",
                "Up to 300 minutes",
                "about 200 calls",
                [
                    "Everything in Starter",
                    "All-day coverage",
                    "Transfer rules for any call",
                    "2 calendars",
                    "Appointment reminders",
                    "Review-request texts",
                    "Monthly performance report",
                ],
            ],
            [
                "Pro",
                "$599",
                "Up to 550 minutes",
                "about 365 calls",
                [
                    "Everything in Growth",
                    "Up to 3 lines and 5 calendars at one location",
                    "Priority same-day support",
                    "Quarterly win-back texts and calls to your own past customers (never cold lists or purchased leads)",
                ],
            ],
        ],
    },
    "food": {
        "label": "Restaurants & cafés",
        "tiers": [
            [
                "Café Starter",
                "$199",
                "Up to 160 minutes",
                "about 80 calls",
                [
                    "Answers hours, menu, catering and order questions",
                    "Captures catering and booking requests",
                    "Everything in Home Starter",
                ],
            ],
            [
                "Restaurant Growth",
                "$349",
                "Up to 300 minutes",
                "about 100 calls",
                [
                    "Reservations into your calendar",
                    "Transfers during service",
                    "Everything in Home Growth",
                ],
            ],
            [
                "Multi-Location",
                "$549",
                "Up to 500 minutes per location",
                "",
                [
                    "Everything in Pro",
                ],
                "per location",
                {'from': True, 'scope': None, 'note': 'Priced per location. We set up all your locations on one account and one bill. The free trial covers one location; the rest go live on the paid plan.', 'cta': ['Book a 30-minute call', 'https://calendly.com/hello-voicecaptures/30min']},
            ],
        ],
    },
    "clinic": {
        "label": "Clinics & dental",
        "tiers": [
            [
                "Essentials",
                "$349",
                "Up to 300 minutes",
                "about 120 calls",
                [
                    "Message-taking",
                    "Appointment requests booked to Google Calendar",
                    "Urgent-call transfer to staff",
                    "Recording off by default",
                    "Transcripts deleted after 14 days",
                    "Collects contact details and the general reason for the call, never symptoms, diagnoses or health card numbers",
                ],
            ],
            [
                "Growth",
                "$599",
                "Up to 550 minutes",
                "",
                [
                    "Everything in Essentials",
                    "Reminders",
                    "2 calendars",
                    "Monthly report",
                ],
            ],
            [
                "Pro",
                "$899",
                "Up to 850 minutes",
                "",
                [
                    "Everything in Growth",
                    "Multiple practitioners at one location",
                    "Priority support",
                ],
            ],
        ],
    },
    "other": {
        "label": "Any other business",
        # Same plans as home services: the call flow does not differ.
        "tiers": [
            [
                "Starter",
                "$179",
                "Up to 150 minutes",
                "about 100 calls",
                [
                    "After-hours or overflow answering",
                    "Live Google Calendar booking",
                    "Emergency detection with instant transfer to you",
                    "SMS summary to you with the caller's real number",
                    "Caller confirmation text",
                    "Missed-call text-back",
                    "Spam filtering",
                    "Dashboard with transcripts",
                    "14-day call history",
                ],
            ],
            [
                "Growth",
                "$349",
                "Up to 300 minutes",
                "about 200 calls",
                [
                    "Everything in Starter",
                    "All-day coverage",
                    "Transfer rules for any call",
                    "2 calendars",
                    "Appointment reminders",
                    "Review-request texts",
                    "Monthly performance report",
                ],
            ],
            [
                "Pro",
                "$599",
                "Up to 550 minutes",
                "about 365 calls",
                [
                    "Everything in Growth",
                    "Up to 3 lines and 5 calendars at one location",
                    "Priority same-day support",
                    "Quarterly win-back texts and calls to your own past customers (never cold lists or purchased leads)",
                ],
            ],
        ],
    },
}

# Prepaid terms. The percentages are applied to the monthly price at render
# time rather than written out, so a changed monthly price cannot leave a
# stale prepaid one beside it.
TERMS = [
    ("1", "Monthly", "pay as you go", 0.0),
    ("3", "3 months", "save 5%", 0.05),
    ("6", "6 months", "save 10%", 0.10),
    ("12", "12 months", "2 months free", 1 / 6),
]

# What every plan includes, and what sits outside the tiers.
INCLUDED = [
    "We text you at 80% of your minutes, and again at 100%. The line never stops answering.",
    "Top up from your dashboard — 50 minutes for $65, or 100 for $120.",
    "Minutes used past your plan without a top-up are $1.50 each, on your next invoice.",
]

ADDONS = [
    "Extra line or calendar — $29/mo",
    "90-day history — $19/mo",
    "1-year history — $49/mo",
    "Practice-software, field-service or POS integration — from $500 + $39/mo, quoted",
]

SETUP = [
    "Setup is included — we configure it for you.",
    "Multi-location or custom call flows — $249 one-time.",
]

TRIAL = ("14 days free at one location, up to 100 minutes. Cancel before day 15 "
         "and you pay nothing. On your real business number, with full setup and "
         "real calls. Billed on day 15; we email you a reminder before then. "
         "Month to month after that — cancel anytime.")

FINE = [
    "All prices in CAD. Month to month, cancel anytime.",
    "Every plan answers 24/7 — after-hours, overflow or all day. You set that "
    "with your forwarding, not your plan.",
    "Call history, recordings and transcripts are kept for 14 days on every "
    "plan. Longer history is an add-on. For clinics we recommend staying at 14 "
    "days — on a patient-facing line, keeping less is the safer setting, not a "
    "worse one.",
    "Live booking on the call is included at every plan — never gated behind an "
    "upgrade.",
]

# Which tier carries the "Recommended" flag, by index.
RECOMMENDED = 1


# Per-vertical trimmings: the subtitle under the heading, a note under the
# cards, and which tier carries the "Recommended" flag.
META = {
    "home": {"trades": "Plumbing · HVAC · Electrical · Locksmith · Garage door", "priceNote": "", "rec": 1},
    "food": {"trades": "Cafés · Restaurants · Takeout", "priceNote": "Priced like home services until we know your call volume.", "rec": 1},
    "clinic": {"trades": "Dental · Vet · Physio · Chiro", "priceNote": "No caller health information is stored or logged.", "rec": 2},
    "other": {"trades": "Salons · Studios · Tutors · Venues · Trades", "priceNote": "Priced like home services until we know your call volume.", "rec": 2},
}


def load() -> dict:
    """The shape the pricing renderer expects, assembled from the tables above."""
    check()
    return {
        key: {
            "label": label,
            "tiers": PLANS[key]["tiers"],
            "trades": META[key]["trades"],
            "priceNote": META[key]["priceNote"],
            "rec": META[key]["rec"],
        }
        for key, label in VERTICALS
    }


def check() -> None:
    """Fail the build rather than ship a half-written plan."""
    for key, label in VERTICALS:
        plan = PLANS.get(key)
        if not plan:
            sys.exit(f"pricing_data: no plans for {key!r}")
        if len(plan["tiers"]) < 3:
            sys.exit(f"pricing_data: {key!r} has {len(plan['tiers'])} tiers, expected 3+")
        for t in plan["tiers"]:
            # `calls` is allowed to be empty: a per-location tier has no single
            # call estimate to give, and inventing one would be worse than a gap.
            if len(t) not in (5, 7) or not t[0] or not t[1].startswith("$") or not t[2] or not t[4]:
                sys.exit(f"pricing_data: malformed tier in {key!r}: {t[0]!r}")


if __name__ == "__main__":
    check()
    for key, label in VERTICALS:
        print(f"{label}:")
        for t in PLANS[key]["tiers"]:
            name, price, mins, calls, feats = t[:5]
            extra = "  +opts" if len(t) > 5 else ""
            print(f"  {name:<20} {price:<8} {mins}  ({calls})  {len(feats)} features{extra}")
