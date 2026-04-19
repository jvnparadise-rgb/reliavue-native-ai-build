from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import UuidTimestampMixin


class Anomaly(UuidTimestampMixin, Base):
    __tablename__ = "anomalies"

    mission_id: Mapped[str] = mapped_column(ForeignKey("missions.id"), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(50), nullable=False)
    anomaly_class: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(5, 4), nullable=True)

    mission = relationship("Mission", back_populates="anomalies")
    geometries = relationship("Geometry", back_populates="anomaly", cascade="all, delete-orphan")
