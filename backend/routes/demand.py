from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from ml.demand_predictor import (
    predict_demand,
    DemandPredictionError,
    SUPPORTED_CROPS,
    SUPPORTED_SEASONS,
)

demand_bp = Blueprint(
    "demand",
    __name__,
    url_prefix="/api/demand"
)


# GET SUPPORTED CROPS/SEASONS (for the frontend to validate/build UI)
@demand_bp.route("/meta", methods=["GET"])
def demand_meta():
    return jsonify({
        "status": "success",
        "supported_crops": SUPPORTED_CROPS,
        "supported_seasons": SUPPORTED_SEASONS,
    }), 200


# PREDICT DEMAND FOR A CROP LISTING
@demand_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    data = request.get_json()

    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body is required"
        }), 400

    required_fields = [
        "crop_name", "price", "inventory",
        "active_buyers", "days_to_harvest", "market_distance"
    ]
    missing = [f for f in required_fields if data.get(f) in (None, "")]

    if missing:
        return jsonify({
            "status": "error",
            "message": f"Missing required fields: {', '.join(missing)}"
        }), 400

    try:
        result = predict_demand(
            crop_name=data["crop_name"],
            price=float(data["price"]),
            inventory=float(data["inventory"]),
            active_buyers=float(data["active_buyers"]),
            days_to_harvest=float(data["days_to_harvest"]),
            market_distance=float(data["market_distance"]),
            season=data.get("season"),
        )
    except DemandPredictionError as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "price, inventory, active_buyers, days_to_harvest "
                        "and market_distance must all be numbers"
        }), 400

    return jsonify({
        "status": "success",
        "prediction": result
    }), 200
