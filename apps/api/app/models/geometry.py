from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import UuidTimestampMixin


class Geometry(UuidTimestampMixin, Base):
    __tablename__ = "geometries"

    anomaly_id: Mapped[str] = mapped_column(ForeignKey("anomalies.id"), nullable=False)
    geometry_type: Mapped[str] = mapped_column(String(50), nullable=False)
    coordinate_space: Mapped[str] = mapped_column(String(50), nullable=False)
    geometry_json: Mapped[str] = mapped_column(Text, nullable=False)

    anomaly = relationship("Anomaly", back_populates="geometries")
