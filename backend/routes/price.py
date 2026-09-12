from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from ml.price_predictor import (
    predict_price,
    PricePredictionError,
    SUPPORTED_SEASONS,
    SUPPORTED_CUSTOMER_TYPES,
)

price_bp = Blueprint(
    "price",
    __name__,
    url_prefix="/api/price"
)


# GET SUPPORTED SEASONS/CUSTOMER TYPES (for the frontend to validate/build UI)
@price_bp.route("/meta", methods=["GET"])
def price_meta():
    return jsonify({
        "status": "success",
        "supported_seasons": SUPPORTED_SEASONS,
        "supported_customer_types": SUPPORTED_CUSTOMER_TYPES,
    }), 200


# PREDICT A DYNAMIC PRICE
@price_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body is required"
        }), 400

    required_fields = [
        "base_price", "competitor_price", "demand", "inventory",
        "time_to_event", "distance", "season", "customer_type"
    ]
    missing = [f for f in required_fields if data.get(f) in (None, "")]

    if missing:
        return jsonify({
            "status": "error",
            "message": f"Missing required fields: {', '.join(missing)}"
        }), 400

    try:
        result = predict_price(
            base_price=float(data["base_price"]),
            competitor_price=float(data["competitor_price"]),
            demand=float(data["demand"]),
            inventory=float(data["inventory"]),
            time_to_event=float(data["time_to_event"]),
            distance=float(data["distance"]),
            season=data["season"],
            customer_type=data["customer_type"],
        )
    except PricePredictionError as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "base_price, competitor_price, demand, inventory, "
                        "time_to_event and distance must all be numbers"
        }), 400

    return jsonify({
        "status": "success",
        "prediction": result
    }), 200