#!/usr/bin/env python3
"""
pricing_data.py -- the pricing generator, reading the canonical catalog.

TWO FILES, AND ONLY TWO:

  pricing/catalog.json       Owned by TorontoLeads (the dashboard repo) and
                             copied here BYTE FOR BYTE. Every price, minute
                             count, trial term, package and entitlement status
                             lives there and nowhere else. Never edit it here.
  pricing/presentation.json  This site's wording around those figures: plan
                             names, taglines, the feature lines on each card,
                             section notes, the plain-language rules. It holds
                             no figures, and check() fails the build if one
                             appears in it.

TorontoLeads #126 changed the canonical shape. It is now keyed by plan rather
than a list, prices sit under `price_cad.{month,year}`, packages hang off their
plan instead of a top-level table, and -- the substantive change -- entitlement
status is PER PLAN (`plans.<key>.entitlements.<ent>`) instead of one global
status per entitlement. It also adds `entitlement_keys` (24, with `history_365`
new) and gives Enterprise a trial `minutes_cap` of 60.

This module is the adapter. It projects the canonical shape into the view the
page builder already consumes, so the figures travel one way -- catalog in,
page out -- and nothing downstream hardcodes a number. The build fails rather
than render a figure that is not in the catalog.
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG_PATH = os.path.join(HERE, "pricing", "catalog.json")
PRESENTATION_PATH = os.path.join(HERE, "pricing", "presentation.json")

# The contract these pages are built against. check() asserts the canonical
# copy still matches it, so a copy that drifts from the dashboard's file stops
# the build instead of quietly repricing the public page.
EXPECTED = {
    "personal":      {"monthly": 19,  "annual": 190,  "minutes": 30},
    "business_lite": {"monthly": 99,  "annual": 990,  "minutes": 100},
    "business_pro":  {"monthly": 199, "annual": 1990, "minutes": 250},
    "enterprise":    {"monthly": None, "annual": None, "minutes": None},
}
SCHEMA = 1
ORDER = ["personal", "business_lite", "business_pro", "enterprise"]

# Enterprise writes "contract" or "quoted" where the other plans write a
# number. The pages have always read None for "there is no figure to print".
NOT_A_NUMBER = ("contract", "quoted")


def _n(value):
    """A catalog figure, or None where the catalog says it is quoted."""
    return None if value in NOT_A_NUMBER or value is None else value


def _load(path: str) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


CANONICAL = _load(CATALOG_PATH)
PRESENTATION = _load(PRESENTATION_PATH)


# ------------------------------------------------------------- projection ---
# Canonical facts + this site's wording -> the plan dicts the builder reads.

def _project_plan(key: str) -> dict:
    c = CANONICAL["plans"][key]
    s = PRESENTATION["plans"][key]
    price = c["price_cad"]
    quoted = price in NOT_A_NUMBER
    pkg = c.get("package")
    out = {
        "key": key,
        "name": s["name"],
        "tagline": s["tagline"],
        "audience": s["audience"],
        "badge": s.get("badge"),
        "cta": s["cta"],
        "inherits": s.get("inherits"),
        "features": s["features"],
        "monthly": None if quoted else price["month"],
        "annual": None if quoted else price["year"],
        "minutes": _n(c["minutes"]),
        "calls": c.get("calls_estimate"),
        "retention_days": _n(c["retention_days"]),
        "calendars": _n(c["calendars_max"]),
        "email_recipients": _n(c["email_recipients_max"]),
        "checkout_enabled": c["checkout_enabled"],
        "trial": c["trial"],
        "lookup_keys": c.get("lookup_keys") or {},
        "package": None if pkg in NOT_A_NUMBER or not pkg else pkg["lookup_key"],
        "entitlements": c["entitlements"],
    }
    if "quote_line" in s:
        out["quote_line"] = s["quote_line"]
    return out


PLANS = {k: _project_plan(k) for k in ORDER}

# The canonical file hangs each package off its plan. The pages ask for them by
# lookup key, the way Stripe does, so they are gathered back into one table.
PACKAGES = {}
for _k in ORDER:
    _pkg = CANONICAL["plans"][_k].get("package")
    if _pkg and _pkg not in NOT_A_NUMBER:
        PACKAGES[_pkg["lookup_key"]] = {
            "plan": _k,
            "minutes": _pkg["minutes"],
            "price": _pkg["price_cad"],
        }

# Entitlement status is per plan now. ENTITLEMENTS keeps one row per key with
# this site's label and the status each plan gives it, which is what the drift
# test walks.
ENTITLEMENTS = {
    k: {
        "label": PRESENTATION["entitlement_labels"][k],
        # .get, not [], so a plan that fails to rule on a key reaches check()
        # and gets a sentence naming the plan and the key, rather than dying
        # here with a bare KeyError at import time.
        "by_plan": {p: PLANS[p]["entitlements"].get(k) for p in ORDER},
    }
    for k in CANONICAL["entitlement_keys"]
}

# Old ?plan= values. The canonical legacy_map, plus the short forms this site
# has linked to from live pages and emails that the dashboard does not carry.
ALIASES = dict(CANONICAL["legacy_map"])
ALIASES.update({k: v for k, v in PRESENTATION["extra_plan_aliases"].items()
                if k != "about"})

_T = CANONICAL["trial_types"]
_R = CANONICAL["rules"]

# The shape the page builder reads. Everything numeric in here comes from the
# canonical catalog; everything in words comes from presentation.json.
CATALOG = {
    "currency": CANONICAL["currency"],
    "tax_note": PRESENTATION["tax_note"],
    "plans": [PLANS[k] for k in ORDER],
    "packages": PACKAGES,
    "addons": [
        {
            "lookup_key": k,
            "label": a["label"],
            "price": a["price_cad"],
            "per": "mo" if a["interval"] == "month" else a["interval"],
            "note": PRESENTATION["addon_notes"][k],
        }
        for k, a in CANONICAL["addons"].items()
    ],
    "integration": {
        "label": PRESENTATION["integration"]["label"],
        "one_time_from": CANONICAL["integration"]["setup_from_cad"],
        "monthly": CANONICAL["integration"]["monthly_cad"],
        "note": PRESENTATION["integration"]["note"],
    },
    "entitlements": ENTITLEMENTS,
    "annual": {
        # 12 months charged at ten: the canonical multiplier decides how many
        # are free, so the phrase cannot drift from the price.
        "months_free": 12 - _R["annual_multiplier"],
        "label": PRESENTATION["annual"]["label"],
        "terms": PRESENTATION["annual"]["terms"],
    },
    "alerts": {
        "warn_pct": PRESENTATION["alerts"]["warn_pct"],
        "stop_pct": PRESENTATION["alerts"]["stop_pct"],
    },
    # The plain-language rules. The wording is this site's; every figure inside
    # it is filled from the canonical rules, so "under 10 seconds" and "at most
    # 2 automatic packages" cannot drift from what the dashboard enforces.
    "rules": dict(
        {k: v.format(**_R) for k, v in PRESENTATION["rules"].items()},
        auto_package_cap=_R["auto_package_max_per_month"],
        billable_min_seconds=_R["billable_min_seconds"],
    ),
    "promos": {
        "standard": {"note": "Per plan trial above."},
        "referral_affiliate": {
            "days": _T["referral_affiliate"]["max_days"],
            "minutes_cap": _T["referral_affiliate"]["minutes_cap"],
        },
        "personal_tester": {
            "free_months": _T["personal_tester"]["free_months"],
            "monthly_minutes": _T["personal_tester"]["monthly_minutes"],
        },
        "invite_45": {"legacy": True, "days": _T["invite_45"]["days"]},
    },
    "plan_key_aliases": ALIASES,
}


# ---------------------------------------------------------------- lookups ---

def load() -> dict:
    return CANONICAL


def plan(key: str) -> dict:
    return PLANS[key]


def package_for(key: str):
    """The extra-minute package a plan buys, or None for a quoted plan."""
    pk = PLANS[key].get("package")
    return PACKAGES[pk] if pk else None


def per_minute(pkg: dict) -> float:
    return pkg["price"] / pkg["minutes"]


def money(n) -> str:
    """$1,990 and $19 -- no cents, which every figure in the catalog happens to be."""
    return "$" + format(int(round(n)), ",")


def per_month(annual: int) -> str:
    """$15.83 -- the monthly figure the annual table prints. Two decimals here
    because 190/12 is not a round number and rounding it would misstate it."""
    return "$" + format(annual / 12.0, ",.2f")


def status_of(key, plan_key: str = "business_pro") -> str:
    """An entitlement's status ON A PLAN. Since #126 the same entitlement can be
    live on one plan and an add-on on another, so a status only means anything
    with a plan beside it. Business Pro is the default because it is the plan
    whose card carries the most entitlements."""
    if not key:
        return "live"
    return PLANS[plan_key]["entitlements"][key]


def tag_for(key, plan_key: str = "business_pro"):
    """The small tag beside a feature. Always None: Amir decided on 17 November
    that the page does not caveat itself, so statuses stay internal tracking and
    never render. Kept as the one place that decision is enforced, rather than
    deleted, so turning tags back on is one function."""
    return None


def canonical_plan(value: str):
    """Map an old ?plan= value onto a current key so old links keep working."""
    if not value:
        return None
    v = value.strip().lower()
    if v in PLANS:
        return v
    return ALIASES.get(v)


# ---------------------------------------------------------------- derived ----
# The "when is it time to move up?" figures. These compare a plan plus packages
# against the next plan up, and they are computed rather than written down so a
# price change cannot leave a stale comparison on the page.

def with_packages(key: str, count: int) -> dict:
    """What a plan costs, and how many minutes it gives, with N packages added."""
    p, pkg = PLANS[key], package_for(key)
    if not pkg:
        sys.exit(f"pricing_data: {key!r} has no package to add")
    return {
        "cost": p["monthly"] + pkg["price"] * count,
        "minutes": p["minutes"] + pkg["minutes"] * count,
        "packages": count,
    }


def packages_to_match(key: str, target_key: str):
    """How many packages the cheaper plan needs before it costs at least as much
    as the plan above it, and what you get for that money."""
    target = PLANS[target_key]["monthly"]
    for n in range(1, 13):
        row = with_packages(key, n)
        if row["cost"] >= target:
            return row
    return None


def move_up() -> dict:
    lite, pro = PLANS["business_lite"], PLANS["business_pro"]
    return {
        "lite_step": lite["monthly"] - PLANS["personal"]["monthly"],
        "pro_step": pro["monthly"] - lite["monthly"],
        # Personal + packages reaching the price of Business Lite.
        "personal_match": packages_to_match("personal", "business_lite"),
        # Business Lite plus one and two packages, against Business Pro.
        "lite_one": with_packages("business_lite", 1),
        "lite_two": with_packages("business_lite", 2),
        "pro_minutes": pro["minutes"],
        "pro_price": pro["monthly"],
    }


def all_prices() -> set:
    """Every money figure the catalog permits on a page. The price-drift test
    asserts no page prints a dollar amount outside this set."""
    out = set()
    for p in CATALOG["plans"]:
        for f in ("monthly", "annual"):
            if p.get(f):
                out.add(int(p[f]))
    for pkg in PACKAGES.values():
        out.add(int(pkg["price"]))
    for a in CATALOG["addons"]:
        out.add(int(a["price"]))
    out.add(int(CATALOG["integration"]["one_time_from"]))
    out.add(int(CATALOG["integration"]["monthly"]))
    m = move_up()
    for row in (m["personal_match"], m["lite_one"], m["lite_two"]):
        if row:
            out.add(int(row["cost"]))
    out.add(int(m["lite_step"]))
    out.add(int(m["pro_step"]))
    return out


# ------------------------------------------------------------------ check ----

def _check_presentation_has_no_figures() -> None:
    """presentation.json is wording. If a price, a minute count or a trial term
    ever gets written into it, there are two sources of truth again and they
    will disagree. Prose that happens to name a number is fine -- "up to 3
    people" -- so this looks for the figures the catalog actually owns.

    `alerts` is exempt by name: the usage-alert thresholds are the one product
    figure the canonical catalog has no field for. See the TODO(owner) there."""
    owned = set()
    for key in ORDER:
        c = CANONICAL["plans"][key]
        price = c["price_cad"]
        if price not in NOT_A_NUMBER:
            owned.update({price["month"], price["year"]})
        if _n(c["minutes"]):
            owned.add(c["minutes"])
        pkg = c.get("package")
        if pkg and pkg not in NOT_A_NUMBER:
            owned.update({pkg["minutes"], pkg["price_cad"]})
    for a in CANONICAL["addons"].values():
        owned.add(a["price_cad"])
    owned.update({CANONICAL["integration"]["setup_from_cad"],
                  CANONICAL["integration"]["monthly_cad"]})

    def walk(node, where):
        if isinstance(node, dict):
            for k, v in node.items():
                if where == "" and k == "alerts":
                    continue
                walk(v, f"{where}.{k}")
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{where}[{i}]")
        elif isinstance(node, (int, float)) and not isinstance(node, bool):
            if node in owned:
                sys.exit(f"presentation.json{where}: {node} is a figure the "
                         f"catalog owns. Derive it in pricing_data.py instead.")

    walk(PRESENTATION, "")


def check() -> None:
    """Fail the build rather than ship a catalog that has drifted."""
    if CANONICAL.get("schema") != SCHEMA:
        sys.exit(f"catalog: schema {CANONICAL.get('schema')!r}, expected {SCHEMA}")
    if list(CANONICAL["plans"]) != ORDER:
        sys.exit(f"catalog: plan keys/order drifted: {list(CANONICAL['plans'])}")
    if list(PRESENTATION["plans"]) != ORDER:
        sys.exit("presentation: plans do not match the catalog's keys/order")

    for key, want in EXPECTED.items():
        got = PLANS[key]
        for field, value in want.items():
            if got.get(field) != value:
                sys.exit(f"catalog: {key}.{field} is {got.get(field)!r}, "
                         f"expected {value!r}")

    mult = CANONICAL["rules"]["annual_multiplier"]
    for key, p in PLANS.items():
        if p["monthly"] and p["annual"] != p["monthly"] * mult:
            sys.exit(f"catalog: {key} annual {p['annual']} is not {mult}x "
                     f"monthly {p['monthly']} ({CATALOG['annual']['label']})")
        if p["checkout_enabled"] and key == "enterprise":
            sys.exit("catalog: enterprise must never be checkout_enabled")

    # Every plan must rule on every entitlement. A key added in the dashboard
    # and not answered by some plan would otherwise read as absent.
    keys = CANONICAL["entitlement_keys"]
    if len(keys) != len(set(keys)):
        sys.exit("catalog: entitlement_keys has a duplicate")
    allowed = set(CANONICAL["entitlement_statuses"])
    for key in ORDER:
        ents = PLANS[key]["entitlements"]
        missing = [k for k in keys if k not in ents]
        extra = [k for k in ents if k not in keys]
        if missing:
            sys.exit(f"catalog: {key} does not rule on {missing}")
        if extra:
            sys.exit(f"catalog: {key} has entitlements outside "
                     f"entitlement_keys: {extra}")
        for k, status in ents.items():
            if status not in allowed:
                sys.exit(f"catalog: {key}.{k} status {status!r} is not one of "
                         f"{sorted(allowed)}")
    labels = PRESENTATION["entitlement_labels"]
    unlabelled = [k for k in keys if k not in labels]
    if unlabelled:
        sys.exit(f"presentation: no label for entitlement(s) {unlabelled}")
    for k in labels:
        if k not in keys:
            sys.exit(f"presentation: label for unknown entitlement {k!r}")

    for key, p in PLANS.items():
        for f in p["features"]:
            k = f.get("key")
            if k and k not in ENTITLEMENTS:
                sys.exit(f"presentation: {key} feature points at unknown "
                         f"entitlement {k!r}")

    for pk, pkg in PACKAGES.items():
        if pkg["plan"] not in PLANS:
            sys.exit(f"catalog: package {pk} points at unknown plan")
    for k in CANONICAL["addons"]:
        if k not in PRESENTATION["addon_notes"]:
            sys.exit(f"presentation: no note for add-on {k!r}")
    for value, target in ALIASES.items():
        if target not in PLANS:
            sys.exit(f"catalog: alias {value!r} points at unknown plan {target!r}")
    if not move_up()["personal_match"]:
        sys.exit("catalog: Personal never reaches the Business Lite price with "
                 "packages; the move-up copy would have nothing to state")

    _check_presentation_has_no_figures()


if __name__ == "__main__":
    check()
    for key in ORDER:
        p = PLANS[key]
        price = money(p["monthly"]) if p["monthly"] else "quoted"
        mins = f"{p['minutes']} min" if p["minutes"] else "sized on a call"
        print(f"{p['name']:<16} {price:<8} {mins:<18} "
              f"{len(p['features'])} features  checkout={p['checkout_enabled']}")
    m = move_up()
    print("\nmove-up:", {k: v for k, v in m.items()})
    print("allowed prices:", sorted(all_prices()))
