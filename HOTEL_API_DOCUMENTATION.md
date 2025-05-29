# Dokumentasi API Sistem Hotel (Kelompok Anda)

Dokumen ini menyediakan informasi mengenai cara berinteraksi dengan API GraphQL dari layanan-layanan sistem hotel kami.

## Informasi Umum

Semua layanan mengekspos endpoint GraphQL pada path `/graphql`.

**URL Basis untuk Akses Lokal (dari mesin yang sama):**
- Guest Service: `http://localhost:<GUEST_SERVICE_HOST_PORT>/graphql`
- Room Service: `http://localhost:<ROOM_SERVICE_HOST_PORT>/graphql`
- Reservation Service: `http://localhost:<RESERVATION_SERVICE_HOST_PORT>/graphql`
- Billing Service: `http://localhost:<BILLING_SERVICE_HOST_PORT>/graphql`

**URL Basis untuk Akses dari Kelompok Lain (dalam jaringan yang sama):**
Ganti `<YOUR_IP_ADDRESS>` dengan IP address mesin Anda saat ini (cek dengan `ipconfig` di Windows) dan `<SERVICE_HOST_PORT>` dengan port yang sesuai yang di-map di `docker-compose.yml`.

- Guest Service: `http://<YOUR_IP_ADDRESS>:<GUEST_SERVICE_HOST_PORT>/graphql`
- Room Service: `http://<YOUR_IP_ADDRESS>:<ROOM_SERVICE_HOST_PORT>/graphql`
- Reservation Service: `http://<YOUR_IP_ADDRESS>:<RESERVATION_SERVICE_HOST_PORT>/graphql`
- Billing Service: `http://<YOUR_IP_ADDRESS>:<BILLING_SERVICE_HOST_PORT>/graphql`

**Catatan Penting:**
- IP Address lokal (`<YOUR_IP_ADDRESS>`) bisa berubah jika jaringan Anda menggunakan DHCP. Pastikan untuk selalu menggunakan IP yang terbaru.
- Pastikan port yang digunakan tidak diblokir oleh firewall di mesin host.
- Semua field dan nama operasi GraphQL menggunakan `camelCase`.

---

## 1. Guest Service

**Host Port (Contoh):** `8000` (sesuaikan dengan `docker-compose.yml` Anda)

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
    }
  }
  # GuestInput: { fullName: String!, email: String!, phone: String, address: String }
  ```

---

## 2. Room Service

**Host Port (Contoh):** `8003` (sesuaikan dengan `docker-compose.yml` Anda)

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
      status
    }
  }
  ```

- **`availableRooms -> [RoomType]`**: Mengambil daftar kamar yang tersedia.
  ```graphql
  query GetAvailableRooms {
    availableRooms {
      id
      roomNumber
      roomType
      pricePerNight
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
      status
    }
  }
  # RoomInput: { roomNumber: String!, roomType: String!, pricePerNight: Float!, status: String! }
  ```

- **`updateRoomStatus(id: Int!, status: String!) -> RoomType`**: (Jika ada, contoh) Mengubah status kamar.
  ```graphql
  mutation UpdateRoomStatus($roomId: Int!, $newStatus: String!) {
    updateRoomStatus(id: $roomId, status: $newStatus) {
      id
      status
    }
  }
  ```

---

## 3. Reservation Service

**Host Port (Contoh):** `8001` (sesuaikan dengan `docker-compose.yml` Anda)

### Queries

- **`reservation(id: Int!) -> ReservationType`**: Mengambil detail reservasi berdasarkan ID.
  ```graphql
  query GetReservation($reservationId: Int!) {
    reservation(id: $reservationId) {
      id
      guestId
      roomId
      startTime
      endTime
      totalPrice
      status
      guest { # Data dari GuestService
        id
        fullName
      }
      room { # Data dari RoomService
        id
        roomNumber
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
      status
    }
  }
  ```

### Mutations

- **`createReservation(reservationData: ReservationInput!) -> ReservationType`**: Membuat reservasi baru.
  ```graphql
  mutation CreateNewReservation($reservationData: ReservationInput!) {
    createReservation(reservationData: $reservationData) {
      id
      guestId
      roomId
      startTime
      endTime
      totalPrice
      status
    }
  }
  # ReservationInput: { guestId: Int!, roomId: Int!, startTime: DateTime!, endTime: DateTime! }
  ```

- **`updateReservationStatus(id: Int!, status: String!) -> ReservationType`**: Mengubah status reservasi. **Ini bisa menjadi trigger untuk Hotelmate.**
  ```graphql
  mutation UpdateReservationStatus($reservationId: Int!, $newStatus: String!) {
    updateReservationStatus(id: $reservationId, status: $newStatus) {
      id
      status
      # Jika status = "completed", service ini akan memanggil API Hotelmate
    }
  }
  ```

---

## 4. Billing Service

**Host Port (Contoh):** `8002` (sesuaikan dengan `docker-compose.yml` Anda)

### Queries

- **`bill(id: Int!) -> BillType`**: Mengambil detail tagihan berdasarkan ID.
  ```graphql
  query GetBill($billId: Int!) {
    bill(id: $billId) {
      id
      reservationId
      guestId
      amount
      paymentStatus
      paymentDate
      # reservation { id startTime endTime } # Detail reservasi dari ReservationService
    }
  }
  ```

- **`bills -> [BillType]`**: Mengambil daftar semua tagihan.
  ```graphql
  query GetAllBills {
    bills {
      id
      reservationId
      paymentStatus
    }
  }
  ```

### Mutations

- **`createBill(billData: BillInput!) -> BillType`**: Membuat tagihan baru.
  ```graphql
  mutation CreateNewBill($billData: BillInput!) {
    createBill(billData: $billData) {
      id
      reservationId
      amount
      paymentStatus
    }
  }
  # BillInput: { reservationId: Int!, amount: Float!, paymentStatus: String! }
  ```

- **`updateBillStatus(id: Int!, paymentStatus: String!) -> BillType`**: Mengubah status pembayaran tagihan. **Ini juga bisa menjadi trigger untuk Hotelmate jika pembayaran lunas menandakan kunjungan selesai.**
  ```graphql
  mutation UpdateBill($billId: Int!, $newPaymentStatus: String!) {
    updateBillStatus(id: $billId, paymentStatus: $newPaymentStatus) {
      id
      paymentStatus
    }
  }
  ```

- **`deleteBill(id: Int!) -> Boolean`**: Menghapus tagihan.
  ```graphql
  mutation DeleteExistingBill($billId: Int!) {
    deleteBill(id: $billId)
  }
  ```

---

## Informasi Tambahan untuk Integrasi dengan Hotelmate

Sistem kami akan berinteraksi dengan Hotelmate terutama pada saat:
1.  **Reservasi Selesai:** `ReservationService` (setelah status reservasi menjadi 'completed' atau 'checked-out') atau `BillingService` (setelah tagihan lunas) akan memanggil mutation yang disediakan oleh `Review Service` dan `Loyalty Service` Hotelmate untuk:
    *   Memberitahukan bahwa kunjungan telah selesai dan tamu dapat memberikan ulasan.
    *   Mencatat kunjungan untuk pemberian poin loyalitas.

    **Data yang akan dikirim (Contoh):**
    *   `guestId` (dari sistem kami)
    *   `reservationId` atau `stayId` (dari sistem kami)
    *   `hotelId` (jika berlaku)
    *   Tanggal selesai kunjungan
    *   Total biaya (jika relevan untuk poin loyalitas)

Kami membutuhkan definisi GraphQL mutation yang spesifik dari Hotelmate untuk tujuan ini.

2.  **Menampilkan Data Hotelmate (Opsional):**
    Layanan kami (misalnya `RoomService` atau `GuestService`) mungkin akan memanggil query yang disediakan Hotelmate untuk mengambil:
    *   Rata-rata rating atau ulasan untuk kamar/hotel.
    *   Informasi poin loyalitas atau status tier tamu.

Kami membutuhkan definisi GraphQL query yang spesifik dari Hotelmate untuk tujuan ini.


Silakan hubungi kami jika ada pertanyaan lebih lanjut atau untuk koordinasi detail teknis API.
