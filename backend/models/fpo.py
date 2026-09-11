from extensions import db


class FPO(db.Model):
    __tablename__ = "fpos"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    name = db.Column(
        db.String(200),
        nullable=False
    )

    registration_number = db.Column(
        db.String(100),
        unique=True
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

    verification_status = db.Column(
        db.String(20),
        default="PENDING"
    )