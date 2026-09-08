"""
Smart Pricing.

WHY THIS WAS REWRITTEN (the "suggested price kaafi high hai" bug)
----------------------------------------------------------------
The old version blended cost-plus pricing 50/50 with reference market
data, and it picked the market band using raw index arithmetic:

    market_max = reference_prices[min(n - 1, int(n * 0.75))]

With only four sample prices per category, int(4 * 0.75) == 3, which is
the LAST index - so "the 75th percentile" was actually the most
expensive sample in the category. Blending half of that into every
suggestion pushed prices far above what the artisan's own costs could
justify.

Worked example of the old behaviour, Wood Carving, production cost Rs.200:
    cost-plus band      = Rs.270 - Rs.350   (sane)
    market band used    = Rs.500 - Rs.2200  (the whole sample, top included)
    blended suggestion  = Rs.385 - Rs.1275
    recommended         = Rs.830            -> 4.15x production cost

An artisan looking at that number does not think "great margin", they
think "the app is wrong", and they stop trusting it. Which is exactly
what happened.

What this version does differently:
  1. Real percentile interpolation, over a NARROW middle band (35th-65th),
     so we aim at the middle of the market rather than its ceiling.
  2. Cost-plus is the anchor and market data only nudges it (70/30, not
     50/50). What it costs THIS artisan to make THIS item is the fact we
     actually know; the sample data is context, not truth.
  3. A hard ceiling relative to production cost, so no combination of
     inputs can ever produce a silly multiple again.
  4. Quantity: artisans price a batch, not a single abstract unit. The
     tool now asks how many they are making and returns per-unit AND
     batch totals, plus a realistic wholesale rate for bulk orders.
"""

from sqlalchemy.orm import Session
from app.models.market_data import MarketData

# --- Retail markup band over production cost -------------------------
# Grounded in how small Indian handmade businesses actually price for
# direct-to-consumer sales. The markup has to cover marketplace or
# payment-gateway fees (roughly 10-20%), packaging, returns, promotion,
# and leave real profit for the artisan's time and skill.
RETAIL_MARKUP_MIN = 1.45
RETAIL_MARKUP_MAX = 1.95

# Absolute ceiling. Whatever the market data says, we never recommend
# more than this multiple of what the item actually costs to make. This
# is the guard rail the old version was missing.
MAX_MARKUP_CEILING = 2.4

# Wholesale / bulk band, used when the artisan is making a larger batch.
# Bulk buyers expect a lower unit price and the artisan saves on
# per-order effort, so the markup is thinner but the volume is higher.
BULK_MARKUP_MIN = 1.22
BULK_MARKUP_MAX = 1.45

# At or above this many units we treat the batch as a wholesale order.
BULK_THRESHOLD = 10

# How much the reference market data is allowed to move the cost-based
# answer. Cost is the anchor; the market is a sanity check on top of it.
COST_WEIGHT = 0.70
MARKET_WEIGHT = 0.30


def _percentile(sorted_values, fraction: float) -> float:
    """
    Linear-interpolated percentile.

    The old code indexed the list directly, which on a four-item sample
    turned "75th percentile" into "the maximum". Interpolating means a
    small sample degrades gracefully instead of snapping to an extreme.
    """
    if not sorted_values:
        return 0.0
    if len(sorted_values) == 1:
        return float(sorted_values[0])

    position = fraction * (len(sorted_values) - 1)
    lower_index = int(position)
    upper_index = min(lower_index + 1, len(sorted_values) - 1)
    weight = position - lower_index
    return float(sorted_values[lower_index]) * (1 - weight) + float(sorted_values[upper_index]) * weight


def suggest_price(
    db: Session,
    material_cost: float,
    labour_cost: float,
    packaging_cost: float,
    other_cost: float,
    category: str,
    quantity: int = 1,
):
    """
    Suggests a competitive price RANGE - never a single "correct" price.

    Combines cost-plus pricing (the anchor, because it is built from this
    artisan's real costs) with reference market data for the category
    (a nudge, because it is only sample data), then clamps the result so
    it can never drift far from what the item actually costs to make.

    `quantity` is how many pieces the artisan is making in this batch. It
    does not change the per-unit retail price, but it drives the batch
    totals and the wholesale rate, which is what an artisan actually
    needs when a shop asks "what for twenty pieces?".
    """
    try:
        quantity = max(1, int(quantity or 1))
    except (TypeError, ValueError):
        quantity = 1

    unit_cost = round(
        (material_cost or 0) + (labour_cost or 0) + (packaging_cost or 0) + (other_cost or 0), 2
    )

    cost_plus_min = unit_cost * RETAIL_MARKUP_MIN
    cost_plus_max = unit_cost * RETAIL_MARKUP_MAX

    reference_prices = sorted(
        price for (price,) in db.query(MarketData.price).filter(MarketData.category == category).all()
    )

    if reference_prices and unit_cost > 0:
        # A deliberately narrow middle band. We want to land where most
        # of the category actually sells, not at its premium end.
        market_low = _percentile(reference_prices, 0.35)
        market_high = _percentile(reference_prices, 0.65)

        suggested_min = COST_WEIGHT * cost_plus_min + MARKET_WEIGHT * market_low
        suggested_max = COST_WEIGHT * cost_plus_max + MARKET_WEIGHT * market_high
        used_market_reference = True
    else:
        suggested_min = cost_plus_min
        suggested_max = cost_plus_max
        used_market_reference = False

    # --- Guard rails --------------------------------------------------
    # Order matters here, and an earlier version of this function got it
    # wrong in a way worth recording: it clamped the top of the range to
    # the ceiling, and THEN widened the range with
    # `max(suggested_max, suggested_min + 1)` to avoid a zero-width band.
    # When both ends had been clamped to the same ceiling value, that
    # final widening pushed the top back through the ceiling by Rs.1, and
    # the midpoint came out at 2.4025x instead of 2.4x. Tiny, but it
    # meant the one hard guarantee in this file was not actually a
    # guarantee. So the ceiling is now applied last, to every number that
    # leaves this function.
    ceiling = unit_cost * MAX_MARKUP_CEILING if unit_cost > 0 else None

    # Never below cost - selling at a loss is never a suggestion.
    if unit_cost:
        suggested_min = max(suggested_min, unit_cost * 1.15)

    if ceiling is not None:
        suggested_max = min(suggested_max, ceiling)
        suggested_min = min(suggested_min, suggested_max)

    # Give the range a little width, but never by breaching the ceiling -
    # widen downwards instead when there is no room above.
    if suggested_max - suggested_min < 1:
        if ceiling is not None and suggested_max + 1 > ceiling:
            suggested_min = max(0.0, suggested_max - 1)
        else:
            suggested_max = suggested_min + 1

    suggested_min = round(suggested_min, 2)
    suggested_max = round(suggested_max, 2)

    recommended_price = (suggested_min + suggested_max) / 2
    if unit_cost > 0:
        recommended_price = max(recommended_price, unit_cost * 1.2)
    if ceiling is not None:
        recommended_price = min(recommended_price, ceiling)
    recommended_price = round(recommended_price, 2)

    # --- Batch and wholesale numbers ---------------------------------
    total_production_cost = round(unit_cost * quantity, 2)
    total_revenue = round(recommended_price * quantity, 2)
    profit_per_unit = round(recommended_price - unit_cost, 2)
    total_profit = round(profit_per_unit * quantity, 2)
    margin_percent = round((profit_per_unit / recommended_price) * 100, 1) if recommended_price else 0.0

    bulk_min = round(unit_cost * BULK_MARKUP_MIN, 2)
    bulk_max = round(unit_cost * BULK_MARKUP_MAX, 2)
    is_bulk_batch = quantity >= BULK_THRESHOLD

    markup_multiple = round(recommended_price / unit_cost, 2) if unit_cost else None

    # --- Plain-language explanation ----------------------------------
    explanation = [
        f"Making one piece costs you Rs.{unit_cost:.0f}"
        + (f", so all {quantity} pieces cost Rs.{total_production_cost:.0f}." if quantity > 1 else "."),
        f"A realistic handmade retail markup puts one piece at Rs.{suggested_min:.0f}-Rs.{suggested_max:.0f}.",
    ]
    if used_market_reference:
        explanation.append(
            f"That was checked against {len(reference_prices)} sample reference prices for "
            f"'{category}' and kept near the middle of that range, not the top."
        )
    else:
        explanation.append(
            "No reference data was available for this category, so this is based on your costs alone."
        )
    explanation.append(
        f"At Rs.{recommended_price:.0f} each you keep about Rs.{profit_per_unit:.0f} profit per piece "
        f"({margin_percent:.0f}% margin)"
        + (f", which is Rs.{total_profit:.0f} for the whole batch." if quantity > 1 else ".")
    )
    if is_bulk_batch:
        explanation.append(
            f"For a bulk or shop order of {quantity} pieces, Rs.{bulk_min:.0f}-Rs.{bulk_max:.0f} per piece "
            "is a fair wholesale rate - thinner margin, but the whole batch sells at once."
        )
    explanation.append("This is a suggested range, not a guaranteed market price.")

    return {
        "quantity": quantity,
        "production_cost": unit_cost,
        "total_production_cost": total_production_cost,
        "suggested_min": suggested_min,
        "suggested_max": suggested_max,
        "recommended_price": recommended_price,
        "markup_multiple": markup_multiple,
        "profit_per_unit": profit_per_unit,
        "total_profit": total_profit,
        "total_revenue": total_revenue,
        "margin_percent": margin_percent,
        "bulk_price_min": bulk_min,
        "bulk_price_max": bulk_max,
        "is_bulk_batch": is_bulk_batch,
        "explanation": " ".join(explanation),
        "used_market_reference": used_market_reference,
        "reference_sample_size": len(reference_prices),
        "data_source": "sample/reference data (not live market data)",
    }
