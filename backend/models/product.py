from extensions import db
from datetime import datetime


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    farmer_id = db.Column(
        db.Integer,
        db.ForeignKey("farmers.id"),
        nullable=True
    )

    fpo_id = db.Column(
        db.Integer,
        db.ForeignKey("fpos.id"),
        nullable=True
    )

    crop_name = db.Column(
        db.String(100),
        nullable=False
    )

    quantity = db.Column(
        db.Float,
        nullable=False
    )

    unit = db.Column(
        db.String(20),
        default="kg"
    )

    quality_grade = db.Column(
        db.String(50)
    )

    harvest_date = db.Column(
        db.Date
    )

    location = db.Column(
        db.String(200)
    )

    expected_price = db.Column(
        db.Float
    )

    is_organic = db.Column(
        db.Boolean,
        default=False
    )

    description = db.Column(
        db.Text
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    is_available = db.Column(
        db.Boolean,
        default=True
    )