from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models import User, FPO, Product, Order


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# =========================
# ADMIN DASHBOARD
# =========================

@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def admin_dashboard():

    claims = get_jwt()
    user_id = int(claims["sub"])

    # Only ADMIN allowed
    if claims.get("role") != "ADMIN":
        return jsonify({
            "message": "Only admins can access this dashboard"
        }), 403

    admin = User.query.get(user_id)

    if not admin:
        return jsonify({
            "message": "Admin not found"
        }), 404

    # =========================
    # USER COUNTS
    # =========================

    total_users = User.query.count()

    total_farmers = User.query.filter_by(
        role="FARMER"
    ).count()

    total_fpos = User.query.filter_by(
        role="FPO"
    ).count()

    total_buyers = User.query.filter_by(
        role="BUYER"
    ).count()

    # =========================
    # PRODUCT COUNT
    # =========================

    total_products = Product.query.count()

    # =========================
    # ORDER COUNT
    # =========================

    total_orders = Order.query.count()

    # =========================
    # TOTAL SALES
    # =========================

    orders = Order.query.filter(
        Order.status != "CANCELLED"
    ).all()

    total_sales = sum(
        float(order.total_price or 0)
        for order in orders
    )

    # =========================
    # PENDING FPO VERIFICATION
    # =========================

    pending_fpo = FPO.query.filter_by(
        verification_status="PENDING"
    ).count()

    # =========================
    # RESPONSE
    # =========================

    return jsonify({
        "status": "success",

        "admin": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email
        },

        "stats": {
            "total_users": total_users,
            "farmers": total_farmers,
            "fpos": total_fpos,
            "buyers": total_buyers,
            "products": total_products,
            "orders": total_orders,
            "total_sales": total_sales,
            "pending_fpo": pending_fpo
        }
    }), 200


# =========================
# VERIFY FPO
# =========================

@admin_bp.route("/fpo/<int:fpo_id>/verify", methods=["POST"])
@jwt_required()
def verify_fpo(fpo_id):

    claims = get_jwt()

    # Only ADMIN allowed
    if claims.get("role") != "ADMIN":
        return jsonify({
            "message": "Only admins can verify FPOs"
        }), 403

    fpo = FPO.query.get(fpo_id)

    if not fpo:
        return jsonify({
            "message": "FPO not found"
        }), 404

    if fpo.verification_status == "VERIFIED":
        return jsonify({
            "message": "FPO is already verified"
        }), 400

    fpo.verification_status = "VERIFIED"

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "FPO verified successfully",
        "fpo": {
            "id": fpo.id,
            "name": fpo.name,
            "verification_status": fpo.verification_status
        }
    }), 200