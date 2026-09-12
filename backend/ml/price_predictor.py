"""
Price intelligence prediction service.

Wraps the trained RandomForestRegressor that predicts a dynamic
`final_price` from 14 features:

    base_price, competitor_price, demand, inventory, time_to_event,
    distance, demand_ratio,
    season_Autumn, season_Monsoon, season_Summer, season_Winter,
    customer_type_New, customer_type_Premium, customer_type_Regular

Model is loaded once at import time (process start) and reused for
every request rather than reloading from disk on each call.
"""

import os

import joblib
import pandas as pd

ML_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(ML_DIR, "models")

SUPPORTED_SEASONS = ["Autumn", "Monsoon", "Summer", "Winter"]
SUPPORTED_CUSTOMER_TYPES = ["New", "Premium", "Regular"]

_price_model = joblib.load(
    os.path.join(MODELS_DIR, "model3_price_intelligence.pkl")
)
FEATURE_COLUMNS = joblib.load(
    os.path.join(MODELS_DIR, "model3_features.pkl")
)


class PricePredictionError(ValueError):
    """Raised when the caller-supplied inputs can't be used for prediction."""


def predict_price(
    *,
    base_price: float,
    competitor_price: float,
    demand: float,
    inventory: float,
    time_to_event: float,
    distance: float,
    season: str,
    customer_type: str,
) -> dict:
    """
    Run the price intelligence model and return a predicted final price.
    """

    season = (season or "").strip().title()
    if season not in SUPPORTED_SEASONS:
        raise PricePredictionError(
            f"'{season}' isn't a valid season. "
            f"Supported seasons: {', '.join(SUPPORTED_SEASONS)}"
        )

    customer_type = (customer_type or "").strip().title()
    if customer_type not in SUPPORTED_CUSTOMER_TYPES:
        raise PricePredictionError(
            f"'{customer_type}' isn't a valid customer type. "
            f"Supported types: {', '.join(SUPPORTED_CUSTOMER_TYPES)}"
        )

    # demand_ratio is an engineered feature from training, not raw input
    demand_ratio = (demand / inventory) if inventory else 0.0

    row = {col: 0 for col in FEATURE_COLUMNS}
    row["base_price"] = float(base_price)
    row["competitor_price"] = float(competitor_price)
    row["demand"] = float(demand)
    row["inventory"] = float(inventory)
    row["time_to_event"] = float(time_to_event)
    row["distance"] = float(distance)
    row["demand_ratio"] = demand_ratio
    row[f"season_{season}"] = 1
    row[f"customer_type_{customer_type}"] = 1

    features = pd.DataFrame([row], columns=FEATURE_COLUMNS)
    predicted_price = float(_price_model.predict(features)[0])

    return {
        "predicted_price": round(predicted_price, 2),
        "demand_ratio_used": round(demand_ratio, 3),
    }