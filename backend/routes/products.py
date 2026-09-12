from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models import User, Farmer, FPO, Product


products_bp = Blueprint(
    "products",
    __name__,
    url_prefix="/api/products"
)


# =========================================================
# GET ALL AVAILABLE PRODUCTS
# =========================================================

@products_bp.route("", methods=["GET"])
def get_products():

    products = Product.query.filter_by(
        is_available=True
    ).all()

    return jsonify({
        "status": "success",
        "products": [
            {
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
            for product in products
        ]
    }), 200


# =========================================================
# ADD A PRODUCT
# =========================================================

@products_bp.route("", methods=["POST"])
@jwt_required()
def add_product():

    claims = get_jwt()

    user_id = int(claims["sub"])
    role = claims.get("role")

    if role not in ["FARMER", "FPO"]:
        return jsonify({
            "message": "Only farmers and FPOs can add products"
        }), 403

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    crop_name = data.get("crop_name")
    quantity = data.get("quantity")

    if not crop_name or quantity is None:
        return jsonify({
            "message": "crop_name and quantity are required"
        }), 400


    # ================= FARMER =================

    if role == "FARMER":

        farmer = Farmer.query.filter_by(
            user_id=user_id
        ).first()

        if not farmer:
            return jsonify({
                "message": "Farmer profile not found"
            }), 404

        product = Product(
            farmer_id=farmer.id,
            crop_name=crop_name,
            quantity=quantity,
            unit=data.get("unit", "kg"),
            quality_grade=data.get("quality_grade"),
            location=data.get("location"),
            expected_price=data.get("expected_price"),
            is_organic=data.get("is_organic", False),
            description=data.get("description")
        )


    # ================= FPO =================

    else:

        fpo = FPO.query.filter_by(
            user_id=user_id
        ).first()

        if not fpo:
            return jsonify({
                "message": "FPO profile not found"
            }), 404

        product = Product(
            fpo_id=fpo.id,
            crop_name=crop_name,
            quantity=quantity,
            unit=data.get("unit", "kg"),
            quality_grade=data.get("quality_grade"),
            location=data.get("location"),
            expected_price=data.get("expected_price"),
            is_organic=data.get("is_organic", False),
            description=data.get("description")
        )


    db.session.add(product)
    db.session.commit()

    return jsonify({
        "message": "Product added successfully",
        "product": {
            "id": product.id,
            "crop_name": product.crop_name,
            "quantity": product.quantity,
            "unit": product.unit,
            "expected_price": product.expected_price,
            "is_organic": product.is_organic
        }
    }), 201


# =========================================================
# GET SINGLE PRODUCT - OWNER ONLY
# =========================================================

@products_bp.route("/<int:product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):

    claims = get_jwt()

    user_id = int(claims["sub"])
    role = claims.get("role")

    if role not in ["FARMER", "FPO"]:
        return jsonify({
            "message": "Only farmers and FPOs can access this product"
        }), 403

    product = Product.query.get(product_id)

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404


    # ================= FARMER OWNERSHIP =================

    if role == "FARMER":

        farmer = Farmer.query.filter_by(
            user_id=user_id
        ).first()

        if not farmer or product.farmer_id != farmer.id:
            return jsonify({
                "message": "You are not allowed to access this product"
            }), 403


    # ================= FPO OWNERSHIP =================

    elif role == "FPO":

        fpo = FPO.query.filter_by(
            user_id=user_id
        ).first()

        if not fpo or product.fpo_id != fpo.id:
            return jsonify({
                "message": "You are not allowed to access this product"
            }), 403


    return jsonify({
        "message": "Product fetched successfully",
        "product": {
            "id": product.id,
            "crop_name": product.crop_name,
            "quantity": product.quantity,
            "unit": product.unit,
            "quality_grade": product.quality_grade,
            "location": product.location,
            "expected_price": product.expected_price,
            "is_organic": product.is_organic,
            "description": product.description,
            "is_available": product.is_available
        }
    }), 200


# =========================================================
# UPDATE PRODUCT
# =========================================================

@products_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):

    claims = get_jwt()

    user_id = int(claims["sub"])
    role = claims.get("role")

    if role not in ["FARMER", "FPO"]:
        return jsonify({
            "message": "Only farmers and FPOs can update products"
        }), 403

    product = Product.query.get(product_id)

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404


    # ================= FARMER OWNERSHIP =================

    if role == "FARMER":

        farmer = Farmer.query.filter_by(
            user_id=user_id
        ).first()

        if not farmer or product.farmer_id != farmer.id:
            return jsonify({
                "message": "You are not allowed to update this product"
            }), 403


    # ================= FPO OWNERSHIP =================

    elif role == "FPO":

        fpo = FPO.query.filter_by(
            user_id=user_id
        ).first()

        if not fpo or product.fpo_id != fpo.id:
            return jsonify({
                "message": "You are not allowed to update this product"
            }), 403


    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400


    # ================= UPDATE FIELDS =================

    if "crop_name" in data:
        product.crop_name = data["crop_name"]

    if "quantity" in data:
        product.quantity = data["quantity"]

    if "unit" in data:
        product.unit = data["unit"]

    if "quality_grade" in data:
        product.quality_grade = data["quality_grade"]

    if "location" in data:
        product.location = data["location"]

    if "expected_price" in data:
        product.expected_price = data["expected_price"]

    if "is_organic" in data:
        product.is_organic = data["is_organic"]

    if "description" in data:
        product.description = data["description"]

    if "is_available" in data:
        product.is_available = data["is_available"]


    db.session.commit()


    return jsonify({
        "message": "Product updated successfully",
        "product": {
            "id": product.id,
            "crop_name": product.crop_name,
            "quantity": product.quantity,
            "unit": product.unit,
            "quality_grade": product.quality_grade,
            "location": product.location,
            "expected_price": product.expected_price,
            "is_organic": product.is_organic,
            "description": product.description,
            "is_available": product.is_available
        }
    }), 200


# =========================================================
# DELETE PRODUCT
# =========================================================

# =========================================================
# DELETE PRODUCT
# =========================================================

@products_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):

    claims = get_jwt()

    user_id = int(claims["sub"])
    role = claims.get("role")

    if role not in ["FARMER", "FPO"]:
        return jsonify({
            "message": "Only farmers and FPOs can delete products"
        }), 403

    product = Product.query.get(product_id)

    if not product:
        return jsonify({
            "message": "Product not found"
        }), 404


    # ================= FARMER OWNERSHIP =================

    if role == "FARMER":

        farmer = Farmer.query.filter_by(
            user_id=user_id
        ).first()

        if not farmer or product.farmer_id != farmer.id:
            return jsonify({
                "message": "You are not allowed to delete this product"
            }), 403


    # ================= FPO OWNERSHIP =================

    elif role == "FPO":

        fpo = FPO.query.filter_by(
            user_id=user_id
        ).first()

        if not fpo or product.fpo_id != fpo.id:
            return jsonify({
                "message": "You are not allowed to delete this product"
            }), 403


    # =====================================================
    # SOFT DELETE
    # =====================================================

    product.is_available = False

    db.session.commit()

    return jsonify({
        "message": "Product removed from marketplace successfully"
    }), 200