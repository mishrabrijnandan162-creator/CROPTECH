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
import re


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# =========================
# VALIDATION HELPERS
# =========================

def validate_email(email):
    """
    Basic email format validation.
    """
    email_pattern = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
    return re.fullmatch(email_pattern, email) is not None


def normalize_phone(phone):
    
    '''
        9876543210
        +919876543210
        919876543210

    Store only:
        9876543210 
        '''
    phone = str(phone).strip()

    if phone.startswith("+91"):
        phone = phone[3:]
    elif phone.startswith("91") and len(phone) == 12:
        phone = phone[2:]

    if not re.fullmatch(r"[6-9]\d{9}", phone):
        return None

    return phone

def validate_password(password):
    """
    Password requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """

    if not isinstance(password, str):
        return False

    if len(password) < 8:
        return False

    if not re.search(r"[A-Z]", password):
        return False

    if not re.search(r"[a-z]", password):
        return False

    if not re.search(r"\d", password):
        return False

    if not re.search(r"[^A-Za-z0-9]", password):
        return False

    return True


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
    # =========================
    # PASSWORD VALIDATION
    # =========================

    if not validate_password(password):
        return jsonify({
            "message": (
                "Password must be at least 8 characters long "
                "and contain at least one uppercase letter, "
                "one lowercase letter, one number, "
                "and one special character"
            )
        }), 400

    # Make sure values are strings before processing
    if not isinstance(name, str):
        return jsonify({
            "message": "Name must be a string"
        }), 400

    if not isinstance(email, str):
        return jsonify({
            "message": "Email must be a string"
        }), 400

    if not isinstance(role, str):
        return jsonify({
            "message": "Role must be a string"
        }), 400

    # Clean input
    name = name.strip()
    email = email.strip().lower()
    role = role.strip().upper()

    # =========================
    # EMAIL VALIDATION
    # =========================

    if not validate_email(email):
        return jsonify({
            "message": "Please provide a valid email address"
        }), 400

    # =========================
    # PHONE VALIDATION
    # =========================

    phone = normalize_phone(phone)

    if not phone:
        return jsonify({
            "message": "Please provide a valid 10-digit Indian mobile number"
        }), 400

    # =========================
    # NAME VALIDATION
    # =========================

    if len(name) < 2:
        return jsonify({
            "message": "Name must contain at least 2 characters"
        }), 400

    if len(name) > 100:
        return jsonify({
            "message": "Name must not exceed 100 characters"
        }), 400

    # =========================
    # CONVERT ROLE TO UPPERCASE
    # =========================

    allowed_roles = [
        "FARMER",
        "FPO",
        "BUYER"
    ]

    if role not in allowed_roles:
        return jsonify({
            "message": "Invalid role"
        }), 400

    # =========================
    # CHECK EXISTING USER
    # =========================

    existing_user = User.query.filter(
        (User.email == email) |
        (User.phone == phone)
    ).first()

    if existing_user:
        return jsonify({
            "message": "Email or phone already registered"
        }), 409

    # =========================
    # HASH PASSWORD
    # =========================

    password_hash = generate_password_hash(password)

    # =========================
    # CREATE USER
    # =========================

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

    # =========================
    # BUYER
    # =========================

    # BUYER does not have a separate profile table yet.

    # =========================
    # SAVE EVERYTHING
    # =========================

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

    if not isinstance(email, str):
        return jsonify({
            "message": "Email must be a string"
        }), 400

    email = email.strip().lower()

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


# =========================
# CREATE ADMIN
# =========================

@auth_bp.route("/create-admin", methods=["POST"])
def create_admin():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required"
        }), 400

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    if not name or not email or not phone or not password:
        return jsonify({
            "message": "Name, email, phone and password are required"
        }), 400

    # Make sure values are strings
    if not isinstance(name, str):
        return jsonify({
            "message": "Name must be a string"
        }), 400

    if not isinstance(email, str):
        return jsonify({
            "message": "Email must be a string"
        }), 400

    name = name.strip()
    email = email.strip().lower()

    # =========================
    # VALIDATE EMAIL
    # =========================

    if not validate_email(email):
        return jsonify({
            "message": "Please provide a valid email address"
        }), 400

    # =========================
    # VALIDATE PHONE
    # =========================

    phone = normalize_phone(phone)

    if not phone:
        return jsonify({
            "message": "Please provide a valid 10-digit Indian mobile number"
        }), 400

    # =========================
    # VALIDATE NAME
    # =========================

    if len(name) < 2:
        return jsonify({
            "message": "Name must contain at least 2 characters"
        }), 400

    if len(name) > 100:
        return jsonify({
            "message": "Name must not exceed 100 characters"
        }), 400

    # =========================
    # CHECK EXISTING USER
    # =========================

    existing_user = User.query.filter(
        (User.email == email) |
        (User.phone == phone)
    ).first()

    if existing_user:
        return jsonify({
            "message": "User with this email or phone already exists"
        }), 409

    # =========================
    # CREATE ADMIN
    # =========================

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