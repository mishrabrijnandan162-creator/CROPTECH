from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models import Product, Order, Farmer, FPO


seller_bp = Blueprint(
    "seller",
    __name__,
    url_prefix="/api/seller"
)


# ---------------------------------------------------------
# GET SELLER ORDERS
# ---------------------------------------------------------

@seller_bp.route("/orders", methods=["GET"])
@jwt_required()
def get_seller_orders():

    claims = get_jwt()

    role = claims.get("role")
    user_id = int(claims["sub"])

    if role not in ["FARMER", "FPO"]:
        return jsonify({
            "message": "Only farmers and FPOs can view seller orders"
        }), 403

    if role == "FARMER":

        seller = Farmer.query.filter_by(
            user_id=user_id
        ).first()

        if not seller:
            return jsonify({
                "message": "Farmer profile not found"
            }), 404

        products = Product.query.filter_by(
            farmer_id=seller.id
        ).all()

    else:

        seller = FPO.query.filter_by(
            user_id=user_id
        ).first()

        if not seller:
            return jsonify({
                "message": "FPO profile not found"
            }), 404

        products = Product.query.filter_by(
            fpo_id=seller.id
        ).all()

    product_ids = [
        product.id
        for product in products
    ]

    if not product_ids:
        return jsonify({
            "status": "success",
            "orders": []
        }), 200

    orders = Order.query.filter(
        Order.product_id.in_(product_ids)
    ).order_by(
        Order.created_at.desc()
    ).all()

    order_list = []

    for order in orders:

        product = Product.query.get(order.product_id)

        order_list.append({
            "id": order.id,
            "buyer_id": order.buyer_id,
            "product_id": order.product_id,
            "crop_name": (
                product.crop_name
                if product
                else None
            ),
            "quantity": order.quantity,
            "total_price": order.total_price,
            "status": order.status,
            "created_at": (
                order.created_at.isoformat()
                if order.created_at
                else None
            )
        })

    return jsonify({
        "status": "success",
        "orders": order_list
    }), 200


# ---------------------------------------------------------
# UPDATE ORDER STATUS
# ---------------------------------------------------------

@seller_bp.route(
    "/orders/<int:order_id>/status",
    methods=["PUT"]
)
@jwt_required()
def update_order_status(order_id):

    claims = get_jwt()

    role = claims.get("role")
    user_id = int(claims["sub"])

    if role not in ["FARMER", "FPO"]:
        return jsonify({
            "message": "Only farmers and FPOs can update order status"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    new_status = data.get("status")

    if not new_status:
        return jsonify({
            "message": "Status is required"
        }), 400

    new_status = new_status.upper()

    allowed_statuses = [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED"
    ]

    if new_status not in allowed_statuses:
        return jsonify({
            "message": "Invalid order status",
            "allowed_statuses": allowed_statuses
        }), 400

    # Find seller profile
    if role == "FARMER":

        seller = Farmer.query.filter_by(
            user_id=user_id
        ).first()

        if not seller:
            return jsonify({
                "message": "Farmer profile not found"
            }), 404

        seller_product_ids = [
            product.id
            for product in Product.query.filter_by(
                farmer_id=seller.id
            ).all()
        ]

    else:

        seller = FPO.query.filter_by(
            user_id=user_id
        ).first()

        if not seller:
            return jsonify({
                "message": "FPO profile not found"
            }), 404

        seller_product_ids = [
            product.id
            for product in Product.query.filter_by(
                fpo_id=seller.id
            ).all()
        ]

    # Find order
    order = Order.query.filter_by(
        id=order_id
    ).first()

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    # Make sure the order belongs to this seller
    if order.product_id not in seller_product_ids:
        return jsonify({
            "message": "You are not authorised to update this order"
        }), 403

    # -----------------------------------------------------
    # STATUS WORKFLOW VALIDATION
    # -----------------------------------------------------

    current_status = order.status

    allowed_transitions = {
        "PENDING": [
            "CONFIRMED",
            "CANCELLED"
        ],

        "CONFIRMED": [
            "PROCESSING",
            "CANCELLED"
        ],

        "PROCESSING": [
            "SHIPPED"
        ],

        "SHIPPED": [
            "DELIVERED"
        ],

        "DELIVERED": [],

        "CANCELLED": []
    }

    if new_status not in allowed_transitions.get(
        current_status,
        []
    ):
        return jsonify({
            "message": "Invalid status transition",
            "current_status": current_status,
            "requested_status": new_status,
            "allowed_next_statuses": allowed_transitions.get(
                current_status,
                []
            )
        }), 400

    # Update status
    order.status = new_status

    db.session.commit()

    return jsonify({
        "message": "Order status updated successfully",
        "order": {
            "id": order.id,
            "buyer_id": order.buyer_id,
            "product_id": order.product_id,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "status": order.status,
            "created_at": (
                order.created_at.isoformat()
                if order.created_at
                else None
            )
        }
    }), 200

# ---------------------------------------------------------
# GET SELLER ORDER DETAILS
# ---------------------------------------------------------

@seller_bp.route("/orders/<int:order_id>", methods=["GET"])
@jwt_required()
def get_seller_order_details(order_id):

    claims = get_jwt()

    role = claims.get("role")
    user_id = int(claims["sub"])

    # Only farmers and FPOs can view seller order details
    if role not in ["FARMER", "FPO"]:
        return jsonify({
            "message": "Only farmers and FPOs can view seller order details"
        }), 403

    # Find seller profile and their products
    if role == "FARMER":

        seller = Farmer.query.filter_by(
            user_id=user_id
        ).first()

        if not seller:
            return jsonify({
                "message": "Farmer profile not found"
            }), 404

        seller_products = Product.query.filter_by(
            farmer_id=seller.id
        ).all()

    else:

        seller = FPO.query.filter_by(
            user_id=user_id
        ).first()

        if not seller:
            return jsonify({
                "message": "FPO profile not found"
            }), 404

        seller_products = Product.query.filter_by(
            fpo_id=seller.id
        ).all()

    # Get IDs of products owned by this seller
    seller_product_ids = [
        product.id
        for product in seller_products
    ]

    # Find the order
    order = Order.query.filter_by(
        id=order_id
    ).first()

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    # Make sure this order belongs to this seller's product
    if order.product_id not in seller_product_ids:
        return jsonify({
            "message": "You are not authorised to view this order"
        }), 403

    # Get product information
    product = Product.query.get(order.product_id)

    return jsonify({
        "status": "success",
        "order": {
            "id": order.id,
            "buyer_id": order.buyer_id,
            "product_id": order.product_id,
            "crop_name": (
                product.crop_name
                if product
                else None
            ),
            "quantity": order.quantity,
            "unit": (
                product.unit
                if product
                else None
            ),
            "total_price": order.total_price,
            "status": order.status,
            "created_at": (
                order.created_at.isoformat()
                if order.created_at
                else None
            )
        }
    }), 200