from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models import Farmer, Product


farmers_bp = Blueprint(
    "farmers",
    __name__,
    url_prefix="/api/farmers"
)


# =========================
# CREATE FARMER PROFILE
# =========================

@farmers_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_farmer_profile():

    claims = get_jwt()
    user_id = int(claims["sub"])

    if claims.get("role") != "FARMER":
        return jsonify({
            "message": "Only farmers can create a farmer profile"
        }), 403

    existing_farmer = Farmer.query.filter_by(
        user_id=user_id
    ).first()

    if existing_farmer:
        return jsonify({
            "message": "Farmer profile already exists",
            "farmer_id": existing_farmer.id
        }), 409

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    farmer = Farmer(
        user_id=user_id,
        farm_name=data.get("farm_name"),
        location=data.get("location"),
        district=data.get("district"),
        state=data.get("state"),
        pincode=data.get("pincode")
    )

    db.session.add(farmer)
    db.session.commit()

    return jsonify({
        "message": "Farmer profile created successfully",
        "farmer_id": farmer.id
    }), 201


# =========================
# FARMER DASHBOARD
# =========================

@farmers_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def farmer_dashboard():

    claims = get_jwt()
    user_id = int(claims["sub"])

    # Only farmer can access
    if claims.get("role") != "FARMER":
        return jsonify({
            "message": "Only farmers can access this dashboard"
        }), 403

    # Find farmer profile
    farmer = Farmer.query.filter_by(
        user_id=user_id
    ).first()

    if not farmer:
        return jsonify({
            "message": "Farmer profile not found"
        }), 404

    # Get farmer's products
    products = Product.query.filter_by(
        farmer_id=farmer.id
    ).order_by(
        Product.created_at.desc()
    ).all()

    # Calculate statistics
    total_products = len(products)

    available_products = [
        product for product in products
        if product.is_available
    ]

    total_quantity = sum(
        float(product.quantity or 0)
        for product in products
    )

    return jsonify({
        "status": "success",

        "farmer": {
            "id": farmer.id,
            "user_id": farmer.user_id,
            "farm_name": farmer.farm_name,
            "location": farmer.location,
            "district": farmer.district,
            "state": farmer.state,
            "pincode": farmer.pincode
        },

        "stats": {
            "total_products": total_products,
            "available_products": len(available_products),
            "total_quantity": total_quantity
        },

        "products": [
            {
                "id": product.id,
                "crop_name": product.crop_name,
                "quantity": product.quantity,
                "unit": product.unit,
                "quality_grade": product.quality_grade,
                "location": product.location,
                "expected_price": product.expected_price,
                "is_organic": product.is_organic,
                "is_available": product.is_available,
                "description": product.description,
                "created_at": (
                    product.created_at.isoformat()
                    if product.created_at else None
                )
            }
            for product in products
        ]
    }), 200