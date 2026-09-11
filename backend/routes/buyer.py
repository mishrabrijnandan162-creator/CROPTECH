from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from sqlalchemy import desc, asc

from extensions import db
from models import Product, Order


buyer_bp = Blueprint(
    "buyer",
    __name__,
    url_prefix="/api/buyer"
)


@buyer_bp.route("/products", methods=["GET"])
@jwt_required()
def browse_products():

    claims = get_jwt()

    if claims.get("role") != "BUYER":
        return jsonify({
            "message": "Only buyers can access the buyer marketplace"
        }), 403

    # Get filter parameters
    crop_name = request.args.get("crop_name")
    location = request.args.get("location")
    organic = request.args.get("organic")
    quality_grade = request.args.get("quality_grade")
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)

    # Get sorting parameter
    sort = request.args.get("sort")

    # Start query with available products
    query = Product.query.filter_by(
        is_available=True
    )

    # Crop name filter
    if crop_name:
        query = query.filter(
            Product.crop_name.ilike(f"%{crop_name}%")
        )

    # Location filter
    if location:
        query = query.filter(
            Product.location.ilike(f"%{location}%")
        )

    # Organic filter
    if organic is not None:
        organic_value = organic.lower() == "true"

        query = query.filter(
            Product.is_organic == organic_value
        )

    # Quality grade filter
    if quality_grade:
        query = query.filter(
            Product.quality_grade.ilike(f"%{quality_grade}%")
        )

    # Minimum price filter
    if min_price is not None:
        query = query.filter(
            Product.expected_price >= min_price
        )

    # Maximum price filter
    if max_price is not None:
        query = query.filter(
            Product.expected_price <= max_price
        )

    # Sorting
    if sort == "price_low":
        query = query.order_by(
            asc(Product.expected_price)
        )

    elif sort == "price_high":
        query = query.order_by(
            desc(Product.expected_price)
        )

    elif sort == "newest":
        query = query.order_by(
            desc(Product.created_at)
        )

    elif sort == "oldest":
        query = query.order_by(
            asc(Product.created_at)
        )

    # Execute query
    products = query.all()

    return jsonify({
        "status": "success",
        "products": [
            {
                "id": product.id,
                "crop_name": product.crop_name,
                "quantity": product.quantity,
                "unit": product.unit,
                "quality_grade": product.quality_grade,
                "harvest_date": (
                    product.harvest_date.isoformat()
                    if product.harvest_date else None
                ),
                "location": product.location,
                "expected_price": product.expected_price,
                "is_organic": product.is_organic,
                "description": product.description
            }
            for product in products
        ]
    }), 200

@buyer_bp.route("/products/<int:product_id>", methods=["GET"])
@jwt_required()
def get_product_details(product_id):

    claims = get_jwt()

    if claims.get("role") != "BUYER":
        return jsonify({
            "message": "Only buyers can view product details"
        }), 403

    product = Product.query.filter_by(
        id=product_id,
        is_available=True
    ).first()

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404

    return jsonify({
        "status": "success",
        "product": {
            "id": product.id,
            "farmer_id": product.farmer_id,
            "fpo_id": product.fpo_id,
            "crop_name": product.crop_name,
            "quantity": product.quantity,
            "unit": product.unit,
            "quality_grade": product.quality_grade,
            "harvest_date": (
                product.harvest_date.isoformat()
                if product.harvest_date else None
            ),
            "location": product.location,
            "expected_price": product.expected_price,
            "is_organic": product.is_organic,
            "description": product.description,
            "created_at": (
                product.created_at.isoformat()
                if product.created_at else None
            )
        }
    }), 200

@buyer_bp.route("/orders", methods=["POST"])
@jwt_required()
def place_order():

    claims = get_jwt()

    if claims.get("role") != "BUYER":
        return jsonify({
            "message": "Only buyers can place orders"
        }), 403

    buyer_id = int(claims["sub"])

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    product_id = data.get("product_id")
    quantity = data.get("quantity")

    if product_id is None or quantity is None:
        return jsonify({
            "message": "product_id and quantity are required"
        }), 400

    try:
        quantity = float(quantity)
    except (TypeError, ValueError):
        return jsonify({
            "message": "Quantity must be a valid number"
        }), 400

    if quantity <= 0:
        return jsonify({
            "message": "Quantity must be greater than zero"
        }), 400

    product = Product.query.filter_by(
        id=product_id,
        is_available=True
    ).first()

    if not product:
        return jsonify({
            "message": "Product not found or unavailable"
        }), 404

    if quantity > product.quantity:
        return jsonify({
            "message": "Requested quantity is not available",
            "available_quantity": product.quantity
        }), 400

    if product.expected_price is None:
        return jsonify({
            "message": "Product price is not available"
        }), 400

    total_price = quantity * product.expected_price

    order = Order(
        buyer_id=buyer_id,
        product_id=product.id,
        quantity=quantity,
        total_price=total_price,
        status="PENDING"
    )

    db.session.add(order)

    product.quantity -= quantity

    if product.quantity == 0:
        product.is_available = False

    db.session.commit()

    return jsonify({
        "message": "Order placed successfully",
        "order": {
            "id": order.id,
            "buyer_id": order.buyer_id,
            "product_id": order.product_id,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "status": order.status,
            "created_at": (
                order.created_at.isoformat()
                if order.created_at else None
            )
        }
    }), 201

@buyer_bp.route("/orders", methods=["GET"])
@jwt_required()
def get_my_orders():

    claims = get_jwt()

    if claims.get("role") != "BUYER":
        return jsonify({
            "message": "Only buyers can view their orders"
        }), 403

    buyer_id = int(claims["sub"])

    orders = Order.query.filter_by(
        buyer_id=buyer_id
    ).order_by(
        desc(Order.created_at)
    ).all()

    return jsonify({
        "status": "success",
        "orders": [
            {
                "id": order.id,
                "product_id": order.product_id,
                "quantity": order.quantity,
                "total_price": order.total_price,
                "status": order.status,
                "created_at": (
                    order.created_at.isoformat()
                    if order.created_at else None
                )
            }
            for order in orders
        ]
    }), 200

@buyer_bp.route("/orders/<int:order_id>", methods=["DELETE"])
@jwt_required()
def cancel_order(order_id):

    claims = get_jwt()

    if claims.get("role") != "BUYER":
        return jsonify({
            "message": "Only buyers can cancel orders"
        }), 403

    buyer_id = int(claims["sub"])

    order = Order.query.filter_by(
        id=order_id,
        buyer_id=buyer_id
    ).first()

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    if order.status != "PENDING":
        return jsonify({
            "message": "Only pending orders can be cancelled"
        }), 400

    product = Product.query.get(order.product_id)

    if product:
        product.quantity += order.quantity
        product.is_available = True

    order.status = "CANCELLED"

    db.session.commit()

    return jsonify({
        "message": "Order cancelled successfully",
        "order": {
            "id": order.id,
            "product_id": order.product_id,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "status": order.status
        }
    }), 200

@buyer_bp.route("/orders/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order_details(order_id):

    claims = get_jwt()

    if claims.get("role") != "BUYER":
        return jsonify({
            "message": "Only buyers can view order details"
        }), 403

    buyer_id = int(claims["sub"])

    order = Order.query.filter_by(
        id=order_id,
        buyer_id=buyer_id
    ).first()

    if not order:
        return jsonify({
            "message": "Order not found"
        }), 404

    product = Product.query.get(order.product_id)

    return jsonify({
        "status": "success",
        "order": {
            "id": order.id,
            "product_id": order.product_id,
            "crop_name": product.crop_name if product else None,
            "quantity": order.quantity,
            "unit": product.unit if product else None,
            "total_price": order.total_price,
            "status": order.status,
            "created_at": (
                order.created_at.isoformat()
                if order.created_at else None
            )
        }
    }), 200