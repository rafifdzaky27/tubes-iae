from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time
from .db import engine, Base, get_db, wait_for_db
from .models import Reservation
from .schema import graphql_router
from datetime import date, timedelta

# Create FastAPI app
app = FastAPI(title="Reservation Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include GraphQL router
app.include_router(graphql_router, prefix="/graphql")

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "reservation_service"}

# Startup event to initialize database and add sample data
@app.on_event("startup")
async def startup_event():
    # Wait for database to be ready
    print("Waiting for database to be ready...")
    if wait_for_db():
        print("Creating database tables...")
        # Create database tables
        Base.metadata.create_all(bind=engine)
        
        # Add sample data
        print("Adding sample data...")
        db = next(get_db())
        try:
            # Check if there are already reservations in the database
            if db.query(Reservation).count() == 0:
                # Add some sample reservations
                today = date.today()
                sample_reservations = [
                    Reservation(
                        guest_id=1, 
                        room_id=1, 
                        check_in_date=today, 
                        check_out_date=today + timedelta(days=3), 
                        status="confirmed"
                    ),
                    Reservation(
                        guest_id=2, 
                        room_id=2, 
                        check_in_date=today + timedelta(days=1), 
                        check_out_date=today + timedelta(days=5), 
                        status="confirmed"
                    ),
                ]
                db.add_all(sample_reservations)
                db.commit()
                print("Sample data added successfully")
        except Exception as e:
            print(f"Error adding sample data: {e}")
        finally:
            db.close()
    else:
        print("Failed to connect to database. Service may not function correctly.")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
