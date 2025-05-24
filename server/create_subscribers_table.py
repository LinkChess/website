from sqlalchemy import create_engine, Column, String, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Subscriber(Base):
    __tablename__ = 'subscribers'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(100), unique=True, nullable=False)
    subscribed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
if __name__ == "__main__":
    engine = create_engine('sqlite:///chess_games.db')
    Base.metadata.create_all(engine)
    print("Subscribers table created successfully!")
