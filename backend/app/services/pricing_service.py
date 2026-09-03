from sqlalchemy.orm import Session
from app.models.market_data import MarketData


def suggest_price(
    db: Session,
    material_cost: float,
    labour_cost: float,
    packaging_cost: float,
    other_cost: float,
    category: str,
):
    """
    Suggests a competitive price RANGE - never a single "correct" price.
    Combines two things: (1) cost-plus pricing, a standard handmade-craft
    markup over what it actually costs to make, and (2) our sample
    reference market data for similar products, when available.
    """
    production_cost = round((material_cost or 0) + (labour_cost or 0) + (packaging_cost or 0) + (other_cost or 0), 2)

    # A typical handmade/craft retail markup - covers profit, marketplace
    # fees, and marketing. This is a starting point, not a guarantee.
    cost_plus_min = round(production_cost * 1.35, 2)
    cost_plus_max = round(production_cost * 1.75, 2)

    reference_prices = sorted(
        price for (price,) in db.query(MarketData.price).filter(MarketData.category == category).all()
    )

    if reference_prices:
        n = len(reference_prices)
        market_min = reference_prices[max(0, int(n * 0.25) - 1)]
        market_max = reference_prices[min(n - 1, int(n * 0.75))]

        # Blend cost-based and market-based numbers - but never suggest
        # below what it actually costs to make (that would be a loss).
        suggested_min = round(max(production_cost, (cost_plus_min + market_min) / 2), 2)
        suggested_max = round(max(suggested_min + 1, (cost_plus_max + market_max) / 2), 2)
        used_market_reference = True
    else:
        suggested_min = cost_plus_min
        suggested_max = cost_plus_max
        used_market_reference = False

    recommended_price = round((suggested_min + suggested_max) / 2, 2)
    recommended_price = max(recommended_price, production_cost + 1)

    explanation = [
        f"Your production cost per piece is ₹{production_cost}.",
        f"A typical handmade-craft markup (covering profit, packaging and marketing) suggests ₹{cost_plus_min}–₹{cost_plus_max}.",
    ]
    if used_market_reference:
        explanation.append(
            f"We compared this with {len(reference_prices)} sample reference prices for '{category}' products "
            "and adjusted the range to stay competitive."
        )
    else:
        explanation.append("No reference data was available for this category, so this is based on cost-plus pricing alone.")
    explanation.append("This is a suggested competitive price range, not a guaranteed market price.")

    return {
        "production_cost": production_cost,
        "suggested_min": suggested_min,
        "suggested_max": suggested_max,
        "recommended_price": recommended_price,
        "explanation": " ".join(explanation),
        "used_market_reference": used_market_reference,
        "reference_sample_size": len(reference_prices),
        "data_source": "sample/reference data (not live market data)",
    }
