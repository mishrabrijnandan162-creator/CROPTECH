"""
Demand prediction service.

Wraps the two trained RandomForest models (regressor + classifier) that
were trained on the same 14-column feature set:

    price, inventory, active_buyers, days_to_harvest, market_distance,
    crop_Maize, crop_Onion, crop_Potato, crop_Rice, crop_Tomato, crop_Wheat,
    season_Kharif, season_Rabi, season_Zaid

Models are loaded once at import time (process start) and reused for
every request rather than reloading from disk on each call.
"""

import os
from datetime import date

import joblib
import pandas as pd

ML_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(ML_DIR, "models")

SUPPORTED_CROPS = ["Maize", "Onion", "Potato", "Rice", "Tomato", "Wheat"]
SUPPORTED_SEASONS = ["Kharif", "Rabi", "Zaid"]

_demand_regressor = joblib.load(
    os.path.join(MODELS_DIR, "crop_demand_model.pkl")
)
_demand_classifier = joblib.load(
    os.path.join(MODELS_DIR, "demand_level_classifier.pkl")
)
_regressor_columns = joblib.load(
    os.path.join(MODELS_DIR, "feature_columns.pkl")
)
_classifier_columns = joblib.load(
    os.path.join(MODELS_DIR, "classification_feature_columns.pkl")
)

# Both models were trained on the same 14 columns, but keep them
# separate in case the two pickles ever drift apart.
assert _regressor_columns == _classifier_columns, (
    "Regressor and classifier were trained on different feature columns"
)

FEATURE_COLUMNS = _regressor_columns


class DemandPredictionError(ValueError):
    """Raised when the caller-supplied inputs can't be used for prediction."""


def infer_season(on_date: date | None = None) -> str:
    """
    Map a calendar date to the standard Indian cropping season.
      Kharif: Jun - Oct
      Rabi:   Nov - Mar
      Zaid:   Apr - May
    """
    on_date = on_date or date.today()
    month = on_date.month

    if month in (6, 7, 8, 9, 10):
        return "Kharif"
    if month in (11, 12, 1, 2, 3):
        return "Rabi"
    return "Zaid"


def build_feature_row(
    *,
    crop_name: str,
    price: float,
    inventory: float,
    active_buyers: float,
    days_to_harvest: float,
    market_distance: float,
    season: str | None = None,
) -> pd.DataFrame:
    """
    Build a single-row DataFrame matching the exact column order the
    models were trained on (one-hot crop/season, everything else raw).
    """

    crop_name = (crop_name or "").strip().title()
    if crop_name not in SUPPORTED_CROPS:
        raise DemandPredictionError(
            f"'{crop_name}' isn't a crop the demand model was trained on. "
            f"Supported crops: {', '.join(SUPPORTED_CROPS)}"
        )

    season = season or infer_season()
    season = season.strip().title()
    if season not in SUPPORTED_SEASONS:
        raise DemandPredictionError(
            f"'{season}' isn't a valid season. "
            f"Supported seasons: {', '.join(SUPPORTED_SEASONS)}"
        )

    row = {col: 0 for col in FEATURE_COLUMNS}
    row["price"] = float(price)
    row["inventory"] = float(inventory)
    row["active_buyers"] = float(active_buyers)
    row["days_to_harvest"] = float(days_to_harvest)
    row["market_distance"] = float(market_distance)
    row[f"crop_{crop_name}"] = 1
    row[f"season_{season}"] = 1

    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def predict_demand(
    *,
    crop_name: str,
    price: float,
    inventory: float,
    active_buyers: float,
    days_to_harvest: float,
    market_distance: float,
    season: str | None = None,
) -> dict:
    """
    Run both models and return a combined prediction.
    """

    features = build_feature_row(
        crop_name=crop_name,
        price=price,
        inventory=inventory,
        active_buyers=active_buyers,
        days_to_harvest=days_to_harvest,
        market_distance=market_distance,
        season=season,
    )

    demand_score = float(_demand_regressor.predict(features)[0])
    demand_level = str(_demand_classifier.predict(features)[0])

    # Class probabilities, if the caller wants to show confidence.
    proba = None
    if hasattr(_demand_classifier, "predict_proba"):
        classes = list(_demand_classifier.classes_)
        probs = _demand_classifier.predict_proba(features)[0]
        proba = {cls: round(float(p), 4) for cls, p in zip(classes, probs)}

    return {
        "demand_score": round(demand_score, 2),
        "demand_level": demand_level,
        "demand_level_probabilities": proba,
        "season_used": features.loc[0][[
            c for c in FEATURE_COLUMNS if c.startswith("season_")
        ]].idxmax().replace("season_", ""),
    }
