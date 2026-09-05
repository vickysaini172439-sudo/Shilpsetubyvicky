from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    preferred_language = Column(String, default="Hindi")

    # Used to reset a forgotten password. We store the id of the question
    # the artisan picked, and a HASH of their answer - never the answer
    # itself, exactly like the password. Nullable because accounts created
    # before this feature existed do not have one.
    security_question = Column(String, nullable=True)
    security_answer_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business", back_populates="owner", uselist=False)
