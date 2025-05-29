# Dokumentasi API Sistem HotelEase

Dokumen ini menyediakan informasi mengenai cara berinteraksi dengan API GraphQL dari layanan-layanan sistem HotelEase.

## Informasi Umum

Semua layanan mengekspos endpoint GraphQL pada path `/graphql`.

**URL Basis untuk Akses API:**

Untuk mengakses API dari jaringan lokal (misalnya, antar kelompok dalam satu jaringan kampus/Wi-Fi yang sama), gunakan IP address mesin yang menjalankan layanan dan port yang sesuai.

- **Guest Service:** `http://<GUEST_SERVICE_HOST_IP>:<GUEST_SERVICE_HOST_PORT>/graphql`
- **Room Service:** `http://<ROOM_SERVICE_HOST_IP>:<ROOM_SERVICE_HOST_PORT>/graphql`
- **Reservation Service:** `http://<RESERVATION_SERVICE_HOST_IP>:<RESERVATION_SERVICE_HOST_PORT>/graphql`
- **Billing Service:** `http://<BILLING_SERVICE_HOST_IP>:<BILLING_SERVICE_HOST_PORT>/graphql`

**Port Host Standar (dapat dikonfigurasi di `docker-compose.yml`):**
- Guest Service Port: `8003`
- Room Service Port: `8001`
- Reservation Service Port: `8002`
- Billing Service Port: `8004`

**Contoh URL Lengkap (jika Guest Service berjalan di IP `192.168.1.10` dengan port `8003`):**
`http://192.168.1.10:8003/graphql`

**Catatan Penting untuk Pengguna API:**
- Pastikan untuk mendapatkan IP address (`<SERVICE_HOST_IP>`) yang benar dari tim yang menjalankan layanan HotelEase.
- IP address lokal dapat berubah jika jaringan menggunakan DHCP. Selalu konfirmasi IP terbaru jika terjadi masalah koneksi.
- Pastikan tidak ada firewall yang memblokir koneksi pada port yang dituju.
- Semua field dan nama operasi GraphQL menggunakan `camelCase`.

---

## 1. Guest Service

**Endpoint:** `http://<GUEST_SERVICE_HOST_IP>:8003/graphql`

### Queries

- **`guest(id: Int!) -> GuestType`**: Mengambil detail tamu berdasarkan ID.
  ```graphql
  query GetGuest($guestId: Int!) {
    guest(id: $guestId) {
      id
      fullName
      email
      phone
      address
    }
  }
  ```

- **`guests -> [GuestType]`**: Mengambil daftar semua tamu.
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

- **`guestByEmail(email: String!) -> GuestType`**: Mengambil detail tamu berdasarkan alamat email.
  ```graphql
  query GetGuestByEmail($email: String!) {
    guestByEmail(email: $email) {
      id
      fullName
      email
      phone
      address
    }
  }
  ```

### Mutations

- **`createGuest(guestData: GuestInput!) -> GuestType`**: Membuat tamu baru.
  ```graphql
  mutation CreateNewGuest($guestData: GuestInput!) {
    createGuest(guestData: $guestData) {
      id
      fullName
      email
      phone
      address
    }
  }
  # Input: GuestInput { fullName: String!, email: String!, phone: String!, address: String! }
  ```

- **`updateGuest(id: Int!, guestData: GuestUpdateInput!) -> GuestType`**: Memperbarui informasi tamu berdasarkan ID.
  ```graphql
  mutation UpdateExistingGuest($guestId: Int!, $guestData: GuestUpdateInput!) {
    updateGuest(id: $guestId, guestData: $guestData) {
      id
      fullName
      email
      phone
      address
    }
  }
  # Input: GuestUpdateInput { fullName: String, email: String, phone: String, address: String }
  # (Semua field opsional)
  ```

- **`deleteGuest(id: Int!) -> Boolean`**: Menghapus tamu berdasarkan ID. Mengembalikan `true` jika berhasil, `false` jika tidak.
  ```graphql
  mutation DeleteExistingGuest($guestId: Int!) {
    deleteGuest(id: $guestId)
  }
  ```

---

## 2. Room Service

**Endpoint:** `http://<ROOM_SERVICE_HOST_IP>:8001/graphql`

### Queries

- **`room(id: Int!) -> RoomType`**: Mengambil detail kamar berdasarkan ID.
  ```graphql
  query GetRoom($roomId: Int!) {
    room(id: $roomId) {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
  }
  ```

- **`rooms -> [RoomType]`**: Mengambil daftar semua kamar.
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

- **`availableRooms -> [RoomType]`**: Mengambil daftar kamar yang tersedia (status 'available').
  ```graphql
  query GetAvailableRooms {
    availableRooms {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
  }
  ```

### Mutations

- **`createRoom(roomData: RoomInput!) -> RoomType`**: Membuat kamar baru.
  ```graphql
  mutation CreateNewRoom($roomData: RoomInput!) {
    createRoom(roomData: $roomData) {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
  }
  # Input: RoomInput { roomNumber: String!, roomType: String!, pricePerNight: Float!, status: String! }
  ```

- **`updateRoom(id: Int!, roomData: RoomUpdateInput!) -> RoomType`**: Memperbarui informasi kamar berdasarkan ID.
  ```graphql
  mutation UpdateExistingRoom($roomId: Int!, $roomData: RoomUpdateInput!) {
    updateRoom(id: $roomId, roomData: $roomData) {
      id
      roomNumber
      roomType
      pricePerNight
      status
    }
  }
  # Input: RoomUpdateInput { roomNumber: String, roomType: String, pricePerNight: Float, status: String }
  # (Semua field opsional)
  ```

- **`deleteRoom(id: Int!) -> Boolean`**: Menghapus kamar berdasarkan ID. Mengembalikan `true` jika berhasil, `false` jika tidak.
  ```graphql
  mutation DeleteExistingRoom($roomId: Int!) {
    deleteRoom(id: $roomId)
  }
  ```

---

## 3. Reservation Service

**Endpoint:** `http://<RESERVATION_SERVICE_HOST_IP>:8002/graphql`

### Queries

- **`reservation(id: Int!) -> ReservationType`**: Mengambil detail reservasi berdasarkan ID. Termasuk detail tamu dan kamar terkait.
  ```graphql
  query GetReservation($reservationId: Int!) {
    reservation(id: $reservationId) {
      id
      guestId
      roomId
      checkInDate
      checkOutDate
      status
      guest { # Data dari GuestService
        id
        fullName
        email
      }
      room { # Data dari RoomService
        id
        roomNumber
        roomType
      }
    }
  }
  ```

- **`reservations -> [ReservationType]`**: Mengambil daftar semua reservasi.
  ```graphql
  query GetAllReservations {
    reservations {
      id
      guestId
      roomId
      checkInDate
      checkOutDate
      status
    }
  }
  ```

- **`reservationsByGuest(guestId: Int!) -> [ReservationType]`**: Mengambil daftar reservasi untuk tamu tertentu.
  ```graphql
  query GetReservationsByGuest($guestId: Int!) {
    reservationsByGuest(guestId: $guestId) {
      id
      roomId
      checkInDate
      checkOutDate
      status
    }
  }
  ```

- **`reservationsByRoom(roomId: Int!) -> [ReservationType]`**: Mengambil daftar reservasi untuk kamar tertentu.
  ```graphql
  query GetReservationsByRoom($roomId: Int!) {
    reservationsByRoom(roomId: $roomId) {
      id
      guestId
      checkInDate
      checkOutDate
      status
    }
  }
  ```

### Mutations

- **`createReservation(reservationData: ReservationInput!) -> ReservationType`**: Membuat reservasi baru. Akan mengupdate status kamar menjadi 'reserved'.
  ```graphql
  mutation CreateNewReservation($reservationData: ReservationInput!) {
    createReservation(reservationData: $reservationData) {
      id
      guestId
      roomId
      checkInDate
      checkOutDate
      status
      guest { id fullName }
      room { id roomNumber status }
    }
  }
  # Input: ReservationInput { guestId: Int!, roomId: Int!, checkInDate: Date!, checkOutDate: Date!, status: String (opsional, default: "confirmed") }
  ```

- **`updateReservation(id: Int!, reservationData: ReservationUpdateInput!) -> ReservationType`**: Memperbarui informasi reservasi. Dapat mengubah status kamar jika `roomId` atau `status` reservasi diubah (misal, menjadi 'checked-out' akan membuat kamar 'available').
  ```graphql
  mutation UpdateExistingReservation($reservationId: Int!, $reservationData: ReservationUpdateInput!) {
    updateReservation(id: $reservationId, reservationData: $reservationData) {
      id
      guestId
      roomId
      checkInDate
      checkOutDate
      status
    }
  }
  # Input: ReservationUpdateInput { guestId: Int, roomId: Int, checkInDate: Date, checkOutDate: Date, status: String }
  # (Semua field opsional)
  ```

- **`deleteReservation(id: Int!) -> Boolean`**: Menghapus reservasi berdasarkan ID. Akan mengupdate status kamar terkait menjadi 'available'. Mengembalikan `true` jika berhasil, `false` jika tidak.
  ```graphql
  mutation DeleteExistingReservation($reservationId: Int!) {
    deleteReservation(id: $reservationId)
  }
  ```

---

## 4. Billing Service

**Endpoint:** `http://<BILLING_SERVICE_HOST_IP>:8004/graphql`

### Queries

- **`bill(id: Int!) -> BillType`**: Mengambil detail tagihan berdasarkan ID. Termasuk detail reservasi terkait.
  ```graphql
  query GetBill($billId: Int!) {
    bill(id: $billId) {
      id
      reservationId
      totalAmount
      paymentStatus
      generatedAt
      reservation {
        id
        checkInDate
        checkOutDate
        guest { id fullName }
        room { id roomNumber pricePerNight }
      }
    }
  }
  ```

- **`bills -> [BillType]`**: Mengambil daftar semua tagihan.
  ```graphql
  query GetAllBills {
    bills {
      id
      reservationId
      totalAmount
      paymentStatus
      generatedAt
    }
  }
  ```

- **`billsByReservation(reservationId: Int!) -> [BillType]`**: Mengambil daftar tagihan untuk reservasi tertentu.
  ```graphql
  query GetBillsByReservation($reservationId: Int!) {
    billsByReservation(reservationId: $reservationId) {
      id
      totalAmount
      paymentStatus
      generatedAt
    }
  }
  ```

- **`billsByStatus(status: String!) -> [BillType]`**: Mengambil daftar tagihan berdasarkan status pembayaran (misal, 'pending', 'paid').
  ```graphql
  query GetBillsByStatus($status: String!) {
    billsByStatus(status: $status) {
      id
      reservationId
      totalAmount
      generatedAt
    }
  }
  ```

### Mutations

- **`createBill(billData: BillInput, reservationId: Int) -> BillType`**: Membuat tagihan baru. Dapat dibuat dengan menyediakan `BillInput` lengkap, atau hanya `reservationId` (maka `totalAmount` akan dihitung otomatis berdasarkan detail reservasi).
  ```graphql
  # Opsi 1: Dengan BillInput lengkap
  mutation CreateNewBillWithData($billData: BillInput!) {
    createBill(billData: $billData) {
      id
      reservationId
      totalAmount
      paymentStatus
      generatedAt
    }
  }
  # Input: BillInput { reservationId: Int!, totalAmount: Float!, paymentStatus: String (opsional, default: "pending") }

  # Opsi 2: Hanya dengan reservationId (otomatis hitung totalAmount)
  mutation CreateNewBillForReservation($resId: Int!) {
    createBill(reservationId: $resId) {
      id
      reservationId
      totalAmount # Akan dihitung otomatis
      paymentStatus # Default 'pending'
      generatedAt
    }
  }
  ```

- **`updateBill(id: Int!, billData: BillUpdateInput!) -> BillType`**: Memperbarui informasi tagihan.
  ```graphql
  mutation UpdateExistingBill($billId: Int!, $billData: BillUpdateInput!) {
    updateBill(id: $billId, billData: $billData) {
      id
      reservationId
      totalAmount
      paymentStatus
      generatedAt
    }
  }
  # Input: BillUpdateInput { totalAmount: Float, paymentStatus: String }
  # (Semua field opsional)
  ```

- **`deleteBill(id: Int!) -> Boolean`**: Menghapus tagihan berdasarkan ID. Mengembalikan `true` jika berhasil, `false` jika tidak.
  ```graphql
  mutation DeleteExistingBill($billId: Int!) {
    deleteBill(id: $billId)
  }
  ```

---

Silakan hubungi tim HotelEase jika ada pertanyaan lebih lanjut atau untuk koordinasi detail teknis API.
