# HotelEase Microservices - GraphQL Queries and Mutations

This document provides example GraphQL queries and mutations for testing the HotelEase microservices using a tool like Postman.

## Service Endpoints (for Postman/Client)

*   **Room Service:** `http://localhost:8001/graphql`
*   **Guest Service:** `http://localhost:8003/graphql`
*   **Reservation Service:** `http://localhost:8002/graphql`
*   **Billing Service:** `http://localhost:8004/graphql`

---

## Room Service

**Host URL:** `http://localhost:8001/graphql`
**(Container URL for reference: `http://room_service:8000/graphql`)**

### 1. Get All Rooms

```graphql
query GetAllRooms {
  rooms {
    id
    roomNumber
    roomType
    pricePerNight
    status
  }
}
```

### 2. Get Room by ID

*Example Variables (replace `1` with an actual room ID):*
```json
{
  "roomId": 1
}
```

*Query:*
```graphql
query GetRoomById($roomId: Int!) {
  room(id: $roomId) {
    id
    roomNumber
    roomType
    pricePerNight
    status
  }
}
```

### 3. Create Room

*Variables:*
```json
{
  "roomData": {
    "roomNumber": "101",
    "roomType": "Deluxe",
    "pricePerNight": 150.0,
    "status": "Available"
  }
}
```

*Mutation:*
```graphql
mutation CreateRoom($roomData: RoomInput!) {
  createRoom(roomData: $roomData) {
    id
    roomNumber
    roomType
    pricePerNight
    status
  }
}
```

### 4. Update Room

*Example Variables (replace `1` with an actual room ID):*
```json
{
  "roomId": 1,
  "roomData": {
    "roomType": "Deluxe Suite",
    "pricePerNight": 175.0,
    "status": "Occupied"
  }
}
```

*Mutation:*
```graphql
mutation UpdateRoom($roomId: Int!, $roomData: RoomUpdateInput!) {
  updateRoom(id: $roomId, roomData: $roomData) {
    id
    roomNumber
    roomType
    pricePerNight
    status
  }
}
```

### 5. Delete Room

*Example Variables (replace `1` with an actual room ID):*
```json
{
  "roomId": 1
}
```

*Mutation:*
```graphql
mutation DeleteRoom($roomId: Int!) {
  deleteRoom(id: $roomId) 
}
```
*(Note: `deleteRoom` in your schema returns a boolean. You can request `id` if your schema was changed to return `RoomType`)*

---

## Guest Service

**Host URL:** `http://localhost:8003/graphql`
**(Container URL for reference: `http://guest_service:8000/graphql`)**

### 1. Get All Guests

```graphql
query GetAllGuests {
  guests {
    id
    fullName
    email
    phone
    address 
  }
}
```

### 2. Get Guest by ID

*Example Variables (replace `1` with an actual guest ID):*
```json
{
  "guestId": 1
}
```

*Query:*
```graphql
query GetGuestById($guestId: Int!) {
  guest(id: $guestId) {
    id
    fullName
    email
    phone
    address
  }
}
```

### 3. Create Guest

*Variables:*
```json
{
  "guestData": {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "123-456-7890",
    "address": "123 Main St"
  }
}
```

*Mutation:*
```graphql
mutation CreateGuest($guestData: GuestInput!) {
  createGuest(guestData: $guestData) {
    id
    fullName
    email
    phone
    address
  }
}
```

### 4. Update Guest

*Example Variables (replace `1` with an actual guest ID):*
```json
{
  "guestId": 1,
  "guestData": {
    "fullName": "Jane Doe",
    "email": "jane.doe.updated@example.com"
  }
}
```

*Mutation:*
```graphql
mutation UpdateGuest($guestId: Int!, $guestData: GuestUpdateInput!) {
  updateGuest(id: $guestId, guestData: $guestData) {
    id
    fullName
    email
    phone
    address
  }
}
```

### 5. Delete Guest

*Example Variables (replace `1` with an actual guest ID):*
```json
{
  "guestId": 1
}
```

*Mutation:*
```graphql
mutation DeleteGuest($guestId: Int!) {
  deleteGuest(id: $guestId)
}
```
*(Note: `deleteGuest` in your schema returns a boolean. You can request `id` if your schema was changed to return `GuestType`)*

---

## Reservation Service

**Host URL:** `http://localhost:8002/graphql`
**(Container URL for reference: `http://reservation_service:8000/graphql`)**

### 1. Get All Reservations

```graphql
query GetAllReservations {
  reservations {
    id
    guestId
    roomId
    checkInDate
    checkOutDate
    status
    room {
      id
      roomNumber
    }
    guest {
      id
      fullName
    }
  }
}
```

### 2. Get Reservation by ID

*Example Variables (replace `1` with an actual reservation ID):*
```json
{
  "reservationId": 1
}
```

*Query:*
```graphql
query GetReservationById($reservationId: Int!) {
  reservation(id: $reservationId) {
    id
    guestId
    roomId
    checkInDate
    checkOutDate
    status
    room {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
    guest {
      id
      fullName
      email
      phone
      address
    }
  }
}
```

### 3. Create Reservation

*Variables (ensure guest ID 1 and room ID 1 exist, or use valid IDs):*
```json
{
  "reservationData": {
    "guestId": 1,
    "roomId": 1,
    "checkInDate": "2024-09-01", 
    "checkOutDate": "2024-09-05",
    "status": "Confirmed"
  }
}
```

*Mutation:*
```graphql
mutation CreateReservation($reservationData: ReservationInput!) {
  createReservation(reservationData: $reservationData) {
    id
    guestId
    roomId
    checkInDate
    checkOutDate
    status
    room {
      id
      roomNumber
      status
    }
    guest {
      id
      fullName
      email
    }
  }
}
```

### 4. Update Reservation

*Example Variables (replace `1` with an actual reservation ID):*
```json
{
  "reservationId": 1,
  "reservationData": {
    "checkOutDate": "2024-09-06",
    "status": "CheckedIn"
  }
}
```

*Mutation:*
```graphql
mutation UpdateReservation($reservationId: Int!, $reservationData: ReservationUpdateInput!) {
  updateReservation(id: $reservationId, reservationData: $reservationData) {
    id
    guestId
    roomId
    checkInDate
    checkOutDate
    status
    room {
      id
      roomNumber
    }
    guest {
      id
      fullName
    }
  }
}
```

### 5. Delete Reservation

*Example Variables (replace `1` with an actual reservation ID):*
```json
{
  "reservationId": 1
}
```

*Mutation:*
```graphql
mutation DeleteReservation($reservationId: Int!) {
  deleteReservation(id: $reservationId) 
}
```
*(Note: `deleteReservation` in your schema returns a boolean.)*

---

## Billing Service

**Host URL:** `http://localhost:8004/graphql`
**(Container URL for reference: `http://billing_service:8000/graphql`)**

### 1. Get All Bills

```graphql
query GetAllBills {
  bills {
    id
    reservationId
    amount
    paymentStatus
    issueDate
  }
}
```

### 2. Get Bill by ID

*Example Variables (replace `1` with an actual bill ID):*
```json
{
  "billId": 1
}
```

*Query:*
```graphql
query GetBillById($billId: Int!) {
  bill(id: $billId) {
    id
    reservationId
    amount
    paymentStatus
    issueDate
  }
}
```

### 3. Create Bill

*Variables (ensure reservation ID 1 exists, or use a valid ID):*
```json
{
  "billData": {
    "reservationId": 1,
    "amount": 750.0,
    "paymentStatus": "Pending",
    "issueDate": "2024-09-05" 
  }
}
```

*Mutation:*
```graphql
mutation CreateBill($billData: BillInput!) {
  createBill(billData: $billData) {
    id
    reservationId
    amount
    paymentStatus
    issueDate
  }
}
```

### 4. Update Bill

*Example Variables (replace `1` with an actual bill ID):*
```json
{
  "billId": 1,
  "billData": {
    "amount": 760.0,
    "paymentStatus": "Paid"
  }
}
```

*Mutation:*
```graphql
mutation UpdateBill($billId: Int!, $billData: BillUpdateInput!) {
  updateBill(id: $billId, billData: $billData) {
    id
    reservationId
    amount
    paymentStatus
    issueDate
  }
}
```

### 5. Delete Bill

*Example Variables (replace `1` with an actual bill ID):*
```json
{
  "billId": 1
}
```

*Mutation:*
```graphql
mutation DeleteBill($billId: Int!) {
  deleteBill(id: $billId)
}
```
*(Note: `deleteBill` in your schema returns a boolean. You can request `id` if your schema was changed to return `BillType`)*
