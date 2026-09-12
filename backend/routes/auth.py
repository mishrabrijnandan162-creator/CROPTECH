from flask import Blueprint, request, jsonify

from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt
)

from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)

from extensions import db
from models import User, Farmer, FPO


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# =========================
# REGISTER
# =========================

@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    role = data.get("role")

    # Check required fields
    if not all([name, email, phone, password, role]):
        return jsonify({
            "message": "All fields are required"
        }), 400

    # Convert role to uppercase
    role = role.upper()

    # Allowed roles
    allowed_roles = [
        "FARMER",
        "FPO",
        "BUYER"
    ]

    if role not in allowed_roles:
        return jsonify({
            "message": "Invalid role"
        }), 400

    # Check existing user
    existing_user = User.query.filter(
        (User.email == email) |
        (User.phone == phone)
    ).first()

    if existing_user:
        return jsonify({
            "message": "Email or phone already registered"
        }), 409

    # Hash password
    password_hash = generate_password_hash(password)

    # Create User
    user = User(
        name=name,
        email=email,
        phone=phone,
        password_hash=password_hash,
        role=role
    )

    db.session.add(user)

    # Get user.id before commit
    db.session.flush()

    # =========================
    # CREATE FARMER PROFILE
    # =========================

    if role == "FARMER":

        farmer = Farmer(
            user_id=user.id
        )

        db.session.add(farmer)

    # =========================
    # CREATE FPO PROFILE
    # =========================

    elif role == "FPO":
        fpo = FPO(
        user_id=user.id,
        name=name,
        verification_status="PENDING"
    )
    db.session.add(fpo)

    # BUYER ke liye abhi separate profile nahi hai

    # Save everything
    db.session.commit()

    return jsonify({
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 201


# =========================
# LOGIN
# =========================

@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    # Find user
    user = User.query.filter_by(
        email=email
    ).first()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # Check password
    if not check_password_hash(
        user.password_hash,
        password
    ):
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    # Check account status
    if not user.is_active:
        return jsonify({
            "message": "Account is inactive"
        }), 403

    # Create JWT token
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "name": user.name
        }
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


# =========================
# CURRENT USER
# =========================

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def current_user():

    claims = get_jwt()

    return jsonify({
        "message": "Authenticated user",
        "user_id": claims["sub"],
        "name": claims.get("name"),
        "role": claims.get("role")
    }), 200

@auth_bp.route("/create-admin", methods=["POST"])
def create_admin():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    if not name or not email or not phone or not password:
        return jsonify({
            "message": "Name, email, phone and password are required"
        }), 400

    existing_user = User.query.filter(
        (User.email == email) | (User.phone == phone)
    ).first()

    if existing_user:
        return jsonify({
            "message": "User with this email or phone already exists"
        }), 409

    admin = User(
        name=name,
        email=email,
        phone=phone,
        password_hash=generate_password_hash(password),
        role="ADMIN"
    )

    db.session.add(admin)
    db.session.commit()

    return jsonify({
        "message": "Admin created successfully",
        "admin_id": admin.id
    }), 201