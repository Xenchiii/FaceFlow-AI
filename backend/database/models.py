from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date = Column(String)
    time = Column(String)
    venue = Column(String)
    capacity = Column(Integer)
    event_type = Column(String)
    registered = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    attendances = relationship("Attendance", back_populates="event")

class Student(Base):
    __tablename__ = "students"
    
    student_id = Column(String, primary_key=True, index=True)
    year_level = Column(Integer)
    program = Column(String)
    age = Column(Integer)
    gender = Column(String)
    engagement_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    attendances = relationship("Attendance", back_populates="student")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    check_in_time = Column(DateTime, default=datetime.utcnow)
    method = Column(String)  # 'qr' or 'camera'
    
    student = relationship("Student", back_populates="attendances")
    event = relationship("Event", back_populates="attendances")