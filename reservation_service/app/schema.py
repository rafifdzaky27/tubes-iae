import strawberry
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import date
from .models import Reservation
from .db import get_db
from fastapi import Depends
from strawberry.fastapi import GraphQLRouter
from .client import RoomServiceClient, GuestServiceClient

# Dependency to get database session for strawberry
def get_context():
    db = next(get_db())
    try:
        yield {"db": db}
    finally:
        db.close()

# Input types for mutations
@strawberry.input
class ReservationInput:
    guest_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    status: str = "confirmed"

@strawberry.input
class ReservationUpdateInput:
    guest_id: Optional[int] = None
    room_id: Optional[int] = None
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    status: Optional[str] = None

# Output types for queries and mutations
@strawberry.type
class RoomType:
    id: int
    room_number: str
    room_type: str
    price_per_night: float
    status: str

@strawberry.type
class GuestType:
    id: int
    full_name: str
    email: str
    phone: str
    address: str

@strawberry.type
class ReservationType:
    id: int
    guest_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    status: str
    guest: Optional[GuestType] = None
    room: Optional[RoomType] = None

# Convert database model to GraphQL type
def reservation_to_graphql(reservation: Reservation) -> ReservationType:
    return ReservationType(
        id=reservation.id,
        guest_id=reservation.guest_id,
        room_id=reservation.room_id,
        check_in_date=reservation.check_in_date,
        check_out_date=reservation.check_out_date,
        status=reservation.status
    )

# Queries
@strawberry.type
class Query:
    @strawberry.field
    async def reservation(self, info, id: int) -> Optional[ReservationType]:
        db = info.context["db"]
        reservation = db.query(Reservation).filter(Reservation.id == id).first()
        if not reservation:
            return None
        
        result = reservation_to_graphql(reservation)
        
        # Fetch related guest and room data
        room_client = RoomServiceClient()
        guest_client = GuestServiceClient()
        
        try:
            room_data = await room_client.get_room(reservation.room_id)
            if room_data:
                result.room = RoomType(
                    id=room_data["id"],
                    room_number=room_data["roomNumber"],  # Changed to camelCase
                    room_type=room_data["roomType"],        # Changed to camelCase
                    price_per_night=room_data["pricePerNight"],# Changed to camelCase
                    status=room_data["status"]
                )
                
            guest_data = await guest_client.get_guest(reservation.guest_id)
            if guest_data:
                result.guest = GuestType(
                    id=guest_data["id"],
                    full_name=guest_data.get("fullName"),  # Changed to get("fullName")
                    email=guest_data.get("email"),        # Using .get for safety
                    phone=guest_data.get("phone"),        # Using .get for safety
                    address=guest_data.get("address")     # Using .get for safety
                )
        finally:
            await room_client.close()
            await guest_client.close()
            
        return result

    @strawberry.field
    def reservations(self, info) -> List[ReservationType]:
        db = info.context["db"]
        reservations = db.query(Reservation).all()
        return [reservation_to_graphql(reservation) for reservation in reservations]
    
    @strawberry.field
    def reservations_by_guest(self, info, guest_id: int) -> List[ReservationType]:
        db = info.context["db"]
        reservations = db.query(Reservation).filter(Reservation.guest_id == guest_id).all()
        return [reservation_to_graphql(reservation) for reservation in reservations]
    
    @strawberry.field
    def reservations_by_room(self, info, room_id: int) -> List[ReservationType]:
        db = info.context["db"]
        reservations = db.query(Reservation).filter(Reservation.room_id == room_id).all()
        return [reservation_to_graphql(reservation) for reservation in reservations]

# Mutations
@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_reservation(self, info, reservation_data: ReservationInput) -> ReservationType:
        db = info.context["db"]
        # Check if room is available
        room_client = RoomServiceClient()
        try:
            room_data = await room_client.get_room(reservation_data.room_id)
            if not room_data or room_data["status"] != "available":
                raise Exception(f"Room {reservation_data.room_id} is not available")
            
            # Create reservation
            reservation = Reservation(
                guest_id=reservation_data.guest_id,
                room_id=reservation_data.room_id,
                check_in_date=reservation_data.check_in_date,
                check_out_date=reservation_data.check_out_date,
                status=reservation_data.status
            )
            db.add(reservation)
            db.commit()
            db.refresh(reservation)
            
            # Update room status to reserved
            await room_client.update_room_status(reservation_data.room_id, "reserved")
            
            graphql_reservation = reservation_to_graphql(reservation)

            # Populate room details from already fetched room_data
            if room_data: # room_data was fetched for validation earlier
                graphql_reservation.room = RoomType(
                    id=room_data["id"],
                    room_number=room_data["roomNumber"],
                    room_type=room_data["roomType"],
                    price_per_night=room_data["pricePerNight"],
                    status=room_data["status"]
                )
            
            # Fetch and populate guest details
            guest_client = GuestServiceClient()
            try:
                guest_data = await guest_client.get_guest(reservation.guest_id)
                if guest_data:
                    graphql_reservation.guest = GuestType(
                        id=guest_data["id"],
                        full_name=guest_data.get("fullName"), # Assumes guest_service returns camelCase fullName
                        email=guest_data.get("email"),
                        phone=guest_data.get("phone"),
                        address=guest_data.get("address")
                    )
            finally:
                await guest_client.close()
                
            return graphql_reservation
        finally:
            await room_client.close()

    @strawberry.mutation
    async def update_reservation(self, info, id: int, reservation_data: ReservationUpdateInput) -> Optional[ReservationType]:
        db = info.context["db"]
        reservation = db.query(Reservation).filter(Reservation.id == id).first()
        if not reservation:
            return None
        
        room_client = None
        try:
            # If room is changing, check availability of new room and update statuses
            if reservation_data.room_id is not None and reservation_data.room_id != reservation.room_id:
                room_client = RoomServiceClient()
                room_data = await room_client.get_room(reservation_data.room_id)
                if not room_data or room_data["status"] != "available":
                    raise Exception(f"Room {reservation_data.room_id} is not available")
                
                # Update old room status to available
                await room_client.update_room_status(reservation.room_id, "available")
                
                # Update new room status to reserved
                await room_client.update_room_status(reservation_data.room_id, "reserved")
                
                reservation.room_id = reservation_data.room_id
            
            # Update other fields
            if reservation_data.guest_id is not None:
                reservation.guest_id = reservation_data.guest_id
            if reservation_data.check_in_date is not None:
                reservation.check_in_date = reservation_data.check_in_date
            if reservation_data.check_out_date is not None:
                reservation.check_out_date = reservation_data.check_out_date
            if reservation_data.status is not None:
                reservation.status = reservation_data.status
                
                # If status is changed to checked-out, update room status to available
                if reservation_data.status == "checked-out" and room_client is None:
                    room_client = RoomServiceClient()
                    await room_client.update_room_status(reservation.room_id, "available")
                
            db.commit()
            db.refresh(reservation)
            
            graphql_reservation = reservation_to_graphql(reservation)

            # Fetch full details for the response
            response_room_client = None
            response_guest_client = None
            try:
                response_room_client = RoomServiceClient()
                current_room_data = await response_room_client.get_room(reservation.room_id)
                if current_room_data:
                    graphql_reservation.room = RoomType(
                        id=current_room_data["id"],
                        room_number=current_room_data["roomNumber"],
                        room_type=current_room_data["roomType"],
                        price_per_night=current_room_data["pricePerNight"],
                        status=current_room_data["status"]
                    )

                response_guest_client = GuestServiceClient()
                current_guest_data = await response_guest_client.get_guest(reservation.guest_id)
                if current_guest_data:
                    graphql_reservation.guest = GuestType(
                        id=current_guest_data["id"],
                        full_name=current_guest_data.get("fullName"),
                        email=current_guest_data.get("email"),
                        phone=current_guest_data.get("phone"),
                        address=current_guest_data.get("address")
                    )
            finally:
                if response_room_client:
                    await response_room_client.close()
                if response_guest_client:
                    await response_guest_client.close()
            
            return graphql_reservation
        finally:
            if room_client:
                await room_client.close()

    @strawberry.mutation
    async def delete_reservation(self, info, id: int) -> bool:
        db = info.context["db"]
        reservation = db.query(Reservation).filter(Reservation.id == id).first()
        if not reservation:
            return False
        
        # Update room status to available
        room_client = RoomServiceClient()
        try:
            await room_client.update_room_status(reservation.room_id, "available")
            db.delete(reservation)
            db.commit()
            return True
        finally:
            await room_client.close()

# Create GraphQL schema
schema = strawberry.Schema(query=Query, mutation=Mutation)

# Create GraphQL router for FastAPI
graphql_router = GraphQLRouter(
    schema,
    context_getter=get_context
)
