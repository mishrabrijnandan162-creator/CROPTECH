import os

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from extensions import db

load_dotenv()

app = Flask(__name__)

CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")

db.init_app(app)

jwt = JWTManager(app)

# Import models AFTER db has been created
from models import User, Farmer, FPO, Product, Order
from routes.auth import auth_bp
from routes.products import products_bp
from routes.farmers import farmers_bp
from routes.buyer import buyer_bp
from routes.seller import seller_bp
from routes.demand import demand_bp
from routes.price import price_bp
from routes.admin import admin_bp
from routes.fpo import fpo_bp



app.register_blueprint(auth_bp)
app.register_blueprint(products_bp)
app.register_blueprint(farmers_bp)
app.register_blueprint(buyer_bp)
app.register_blueprint(seller_bp)
app.register_blueprint(demand_bp)
app.register_blueprint(price_bp)
app.register_blueprint(fpo_bp)
app.register_blueprint(admin_bp)

@app.route("/")
def home():
    return jsonify({
        "project": "CROP TECH",
        "message": "CROP TECH API is running",
        "status": "success"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "message": "Backend is working correctly"
    })


@app.route("/api/database-test")
def database_test():
    try:
        with db.engine.connect() as connection:
            connection.execute(db.text("SELECT 1"))

        return jsonify({
            "status": "success",
            "message": "CROP TECH database connected successfully"
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Database connection failed",
            "error": str(e)
        }), 500


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)