from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models import FPO, Product, Order


fpo_bp = Blueprint(
    "fpo",
    __name__,
    url_prefix="/api/fpo"
)


# =========================
# FPO DASHBOARD
# =========================

@fpo_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def fpo_dashboard():

    claims = get_jwt()
    user_id = int(claims["sub"])

    # Only FPO can access
    if claims.get("role") != "FPO":
        return jsonify({
            "message": "Only FPOs can access this dashboard"
        }), 403

    # Find FPO profile
    fpo = FPO.query.filter_by(
        user_id=user_id
    ).first()

    if not fpo:
        return jsonify({
            "message": "FPO profile not found"
        }), 404

    # Get FPO products
    products = Product.query.filter_by(
        fpo_id=fpo.id
    ).order_by(
        Product.created_at.desc()
    ).all()

    # Product statistics
    total_products = len(products)

    available_products = [
        product for product in products
        if product.is_available
    ]

    total_quantity = sum(
        float(product.quantity or 0)
        for product in products
    )

    # Get orders for FPO products
    product_ids = [product.id for product in products]

    if product_ids:
        orders = Order.query.filter(
            Order.product_id.in_(product_ids)
        ).all()
    else:
        orders = []

    total_orders = len(orders)

    pending_orders = [
        order for order in orders
        if order.status == "PENDING"
    ]

    confirmed_orders = [
        order for order in orders
        if order.status == "CONFIRMED"
    ]

    delivered_orders = [
        order for order in orders
        if order.status == "DELIVERED"
    ]

    total_sales = sum(
        float(order.total_price or 0)
        for order in orders
        if order.status != "CANCELLED"
    )

    return jsonify({

        "status": "success",

        # =========================
        # FPO INFORMATION
        # =========================

        "fpo": {
            "id": fpo.id,
            "user_id": fpo.user_id,
            "name": fpo.name,
            "registration_number": fpo.registration_number,
            "location": fpo.location,
            "district": fpo.district,
            "state": fpo.state,
            "verification_status": fpo.verification_status
        },

        # =========================
        # STATISTICS
        # =========================

        "stats": {
            "total_products": total_products,
            "available_products": len(available_products),
            "total_quantity": total_quantity,
            "total_orders": total_orders,
            "pending_orders": len(pending_orders),
            "confirmed_orders": len(confirmed_orders),
            "delivered_orders": len(delivered_orders),
            "total_sales": total_sales
        },

        # =========================
        # PRODUCTS
        # =========================

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