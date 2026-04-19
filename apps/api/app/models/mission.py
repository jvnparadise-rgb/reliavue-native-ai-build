from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import UuidTimestampMixin


class Mission(UuidTimestampMixin, Base):
    __tablename__ = "missions"

    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id"), nullable=False)
    roof_id: Mapped[str | None] = mapped_column(ForeignKey("roofs.id"), nullable=True)
    pv_field_id: Mapped[str | None] = mapped_column(ForeignKey("pv_fields.id"), nullable=True)
    mission_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="created")

    roof = relationship("Roof", back_populates="missions")
    pv_field = relationship("PvField", back_populates="missions")
    anomalies = relationship("Anomaly", back_populates="mission", cascade="all, delete-orphan")
