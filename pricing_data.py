#!/usr/bin/env python3
"""
pricing_data.py — reads pricing/catalog.json and nothing else.

It used to hold the plan tables itself. It no longer does: the catalog is the
single source of truth, owned by the dashboard repo and copied byte-identical
into this one, so a price can only be changed in one place. Everything this
module exposes is either read straight from the catalog or computed from it.
Nothing here hardcodes a price, a minute count or a trial term, and the build
fails rather than render a figure that is not in the catalog.
"""

import json
import os
import sys

CATALOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "pricing", "catalog.json")

# The contract these pages are built against. check() asserts the catalog still
# matches it, so a copy that drifts from the dashboard's file stops the build
# instead of quietly repricing the public page.
EXPECTED = {
    "personal":      {"monthly": 19,  "annual": 190,  "minutes": 30},
    "business_lite": {"monthly": 99,  "annual": 990,  "minutes": 100},
    "business_pro":  {"monthly": 199, "annual": 1990, "minutes": 250},
    "enterprise":    {"monthly": None, "annual": None, "minutes": None},
}
SCHEMA_VERSION = 1


def load() -> dict:
    with open(CATALOG_PATH, encoding="utf-8") as fh:
        return json.load(fh)


CATALOG = load()
PLANS = {p["key"]: p for p in CATALOG["plans"]}
ORDER = [p["key"] for p in CATALOG["plans"]]
PACKAGES = CATALOG["packages"]
ENTITLEMENTS = CATALOG["entitlements"]
ALIASES = CATALOG["plan_key_aliases"]


def plan(key: str) -> dict:
    return PLANS[key]


def package_for(key: str):
    """The extra-minute package a plan buys, or None for a quoted plan."""
    pk = PLANS[key].get("package")
    return PACKAGES[pk] if pk else None


def per_minute(pkg: dict) -> float:
    return pkg["price"] / pkg["minutes"]


def money(n) -> str:
    """$1,990 and $19 — no cents, which every figure in the catalog happens to be."""
    return "$" + format(int(round(n)), ",")


def per_month(annual: int) -> str:
    """$15.83 — the monthly figure the annual table prints. Two decimals here
    because 190/12 is not a round number and rounding it would misstate it."""
    return "$" + format(annual / 12.0, ",.2f")


def status_of(key) -> str:
    return ENTITLEMENTS[key]["status"] if key else "live"


def tag_for(key):
    """The small tag beside a feature, or None when it is simply live."""
    return CATALOG["status_tags"].get(status_of(key))


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


def check() -> None:
    """Fail the build rather than ship a catalog that has drifted."""
    if CATALOG.get("schema_version") != SCHEMA_VERSION:
        sys.exit(f"catalog: schema_version {CATALOG.get('schema_version')!r}, "
                 f"expected {SCHEMA_VERSION}")
    if ORDER != ["personal", "business_lite", "business_pro", "enterprise"]:
        sys.exit(f"catalog: plan keys/order drifted: {ORDER}")
    for key, want in EXPECTED.items():
        got = PLANS.get(key)
        if not got:
            sys.exit(f"catalog: missing plan {key!r}")
        for field, value in want.items():
            if got.get(field) != value:
                sys.exit(f"catalog: {key}.{field} is {got.get(field)!r}, "
                         f"expected {value!r}")
    for key, p in PLANS.items():
        if p["monthly"] and p["annual"] != p["monthly"] * 10:
            sys.exit(f"catalog: {key} annual {p['annual']} is not 10x monthly "
                     f"{p['monthly']} ({CATALOG['annual']['label']})")
        if p.get("checkout_enabled") and p["key"] == "enterprise":
            sys.exit("catalog: enterprise must never be checkout_enabled")
        for f in p["features"]:
            k = f.get("key")
            if k and k not in ENTITLEMENTS:
                sys.exit(f"catalog: {key} feature points at unknown "
                         f"entitlement {k!r}")
    for pk, pkg in PACKAGES.items():
        if pkg["plan"] not in PLANS:
            sys.exit(f"catalog: package {pk} points at unknown plan")
    for value, target in ALIASES.items():
        if target not in PLANS:
            sys.exit(f"catalog: alias {value!r} points at unknown plan {target!r}")
    if not move_up()["personal_match"]:
        sys.exit("catalog: Personal never reaches the Business Lite price with "
                 "packages; the move-up copy would have nothing to state")


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
