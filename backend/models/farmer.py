from extensions import db


class Farmer(db.Model):
    __tablename__ = "farmers"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    farm_name = db.Column(
        db.String(150)
    )

    location = db.Column(
        db.String(200)
    )

    district = db.Column(
        db.String(100)
    )

    state = db.Column(
        db.String(100)
    )

    pincode = db.Column(
        db.String(10)
    )

    verification_status = db.Column(
        db.String(20),
        default="PENDING"
    )