# HotelEase Microservices: Architecture Overview

Dokumen ini menjelaskan arsitektur sistem HotelEase, termasuk struktur database per layanan, bagaimana data disimpan, komunikasi antar layanan, dan panduan untuk kolaborasi tim.

## 1. Konsep Umum

HotelEase dibangun menggunakan arsitektur microservices. Setiap fungsionalitas inti (Manajemen Kamar, Tamu, Reservasi, dan Tagihan) dipisahkan menjadi layanan independen. Masing-masing layanan memiliki database sendiri untuk memastikan isolasi dan skalabilitas.

**Teknologi Utama:**
*   **Backend:** Python dengan FastAPI
*   **GraphQL API:** Strawberry
*   **Database:** PostgreSQL
*   **ORM:** SQLAlchemy
*   **Kontainerisasi:** Docker & Docker Compose

## 2. Detail Layanan dan Struktur Database

Setiap layanan memiliki database PostgreSQL sendiri yang berjalan dalam kontainer Docker terpisah. Data untuk setiap database disimpan secara persisten menggunakan Docker volumes. Ini berarti data akan tetap ada meskipun kontainer dihentikan dan dimulai ulang.

### 2.1. Room Service
*   **Tujuan:** Mengelola informasi kamar hotel.
*   **Port Host (GraphQL):** `8001` (mapping dari `8000` di kontainer)
*   **Nama Kontainer Service:** `room_service`
*   **Nama Kontainer Database:** `room_db`
*   **Nama Database:** `room_service`
*   **Port Host Database:** `5432` (mapping dari `5432` di kontainer)
*   **Docker Volume:** `room_data` (menyimpan data di `/var/lib/postgresql/data` dalam kontainer `room_db`)

*   **Tabel Database: `rooms`**
    | Kolom             | Tipe Data      | Constraints                               | Deskripsi                                     |
    |-------------------|----------------|-------------------------------------------|-----------------------------------------------|
    | `id`              | INTEGER        | PRIMARY KEY, AUTOINCREMENT                | ID unik untuk kamar                           |
    | `room_number`     | VARCHAR        | UNIQUE, INDEX                             | Nomor kamar                                   |
    | `room_type`       | VARCHAR        | NOT NULL                                  | Tipe kamar (e.g., Deluxe, Standard)           |
    | `price_per_night` | NUMERIC(10, 2) | NOT NULL                                  | Harga per malam                               |
    | `status`          | VARCHAR        | NOT NULL                                  | Status kamar (e.g., available, occupied)      |

### 2.2. Guest Service
*   **Tujuan:** Mengelola informasi tamu.
*   **Port Host (GraphQL):** `8003` (mapping dari `8000` di kontainer)
*   **Nama Kontainer Service:** `guest_service`
*   **Nama Kontainer Database:** `guest_db`
*   **Nama Database:** `guest_service`
*   **Port Host Database:** `5434` (mapping dari `5432` di kontainer)
*   **Docker Volume:** `guest_data` (menyimpan data di `/var/lib/postgresql/data` dalam kontainer `guest_db`)

*   **Tabel Database: `guests`**
    | Kolom       | Tipe Data | Constraints                               | Deskripsi                      |
    |-------------|-----------|-------------------------------------------|--------------------------------|
    | `id`        | INTEGER   | PRIMARY KEY, AUTOINCREMENT                | ID unik untuk tamu             |
    | `full_name` | VARCHAR   | NOT NULL                                  | Nama lengkap tamu              |
    | `email`     | VARCHAR   | UNIQUE, INDEX, NOT NULL                   | Alamat email tamu              |
    | `phone`     | VARCHAR   | NOT NULL                                  | Nomor telepon tamu             |
    | `address`   | TEXT      | NOT NULL                                  | Alamat tamu                    |

### 2.3. Reservation Service
*   **Tujuan:** Mengelola reservasi kamar oleh tamu.
*   **Port Host (GraphQL):** `8002` (mapping dari `8000` di kontainer)
*   **Nama Kontainer Service:** `reservation_service`
*   **Nama Kontainer Database:** `reservation_db`
*   **Nama Database:** `reservation_service`
*   **Port Host Database:** `5433` (mapping dari `5432` di kontainer)
*   **Docker Volume:** `reservation_data` (menyimpan data di `/var/lib/postgresql/data` dalam kontainer `reservation_db`)

*   **Tabel Database: `reservations`**
    | Kolom            | Tipe Data | Constraints                | Deskripsi                                     |
    |------------------|-----------|----------------------------|-----------------------------------------------|
    | `id`             | INTEGER   | PRIMARY KEY, AUTOINCREMENT | ID unik untuk reservasi                       |
    | `guest_id`       | INTEGER   | NOT NULL                   | ID tamu (merujuk ke `guests.id`)              |
    | `room_id`        | INTEGER   | NOT NULL                   | ID kamar (merujuk ke `rooms.id`)              |
    | `check_in_date`  | DATE      | NOT NULL                   | Tanggal check-in                              |
    | `check_out_date` | DATE      | NOT NULL                   | Tanggal check-out                             |
    | `status`         | VARCHAR   | NOT NULL                   | Status reservasi (e.g., confirmed, cancelled) |

    *Relasi (Logis, tidak ada Foreign Key fisik antar database):*
    *   `guest_id` di `reservations` secara logis merujuk ke `id` di tabel `guests` (milik `Guest Service`).
    *   `room_id` di `reservations` secara logis merujuk ke `id` di tabel `rooms` (milik `Room Service`).

### 2.4. Billing Service
*   **Tujuan:** Mengelola tagihan untuk reservasi.
*   **Port Host (GraphQL):** `8004` (mapping dari `8000` di kontainer)
*   **Nama Kontainer Service:** `billing_service`
*   **Nama Kontainer Database:** `billing_db`
*   **Nama Database:** `billing_service`
*   **Port Host Database:** `5435` (mapping dari `5432` di kontainer)
*   **Docker Volume:** `billing_data` (menyimpan data di `/var/lib/postgresql/data` dalam kontainer `billing_db`)

*   **Tabel Database: `bills`**
    | Kolom            | Tipe Data         | Constraints                                     | Deskripsi                                     |
    |------------------|-------------------|-------------------------------------------------|-----------------------------------------------|
    | `id`             | INTEGER           | PRIMARY KEY, AUTOINCREMENT                      | ID unik untuk tagihan                         |
    | `reservation_id` | INTEGER           | NOT NULL                                        | ID reservasi (merujuk ke `reservations.id`)   |
    | `total_amount`   | NUMERIC(10, 2)    | NOT NULL                                        | Jumlah total tagihan                          |
    | `payment_status` | VARCHAR           | NOT NULL                                        | Status pembayaran (e.g., pending, paid)       |
    | `generated_at`   | TIMESTAMP WITH TZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP             | Waktu tagihan dibuat                          |

    *Relasi (Logis, tidak ada Foreign Key fisik antar database):*
    *   `reservation_id` di `bills` secara logis merujuk ke `id` di tabel `reservations` (milik `Reservation Service`).

## 3. Penyimpanan Data (Persistensi)

Seperti yang disebutkan, setiap database layanan (PostgreSQL) menggunakan Docker named volumes (`room_data`, `guest_data`, `reservation_data`, `billing_data`).
*   **Lokasi Data di Host:** Docker mengelola lokasi fisik volume ini di sistem host Anda. Biasanya tersembunyi di direktori instalasi Docker. Anda tidak perlu berinteraksi langsung dengan file-file ini.
*   **Keuntungan:** Data tetap aman dan persisten bahkan jika kontainer database dihapus dan dibuat ulang (selama volume tidak dihapus secara eksplisit). Ini penting untuk pengembangan dan produksi.
*   **Backup:** Untuk backup, Anda bisa menggunakan perintah `pg_dump` dari dalam kontainer database atau tool manajemen Docker volume.

## 4. Komunikasi Antar Layanan

Layanan-layanan ini berkomunikasi satu sama lain melalui API GraphQL mereka, bukan melalui koneksi database langsung.
*   **Jaringan Docker:** Semua layanan dan database mereka berada dalam satu jaringan Docker kustom bernama `hotelease_network` (didefinisikan di `docker-compose.yml`). Ini memungkinkan kontainer untuk saling menemukan dan berkomunikasi menggunakan nama layanan mereka sebagai hostname (misalnya, `room_service`, `guest_service`).
*   **Mekanisme Komunikasi:**
    *   `Reservation Service` perlu data dari `Room Service` dan `Guest Service`. Ia bertindak sebagai klien GraphQL untuk kedua layanan tersebut. URL layanan target dikonfigurasi melalui environment variables di `docker-compose.yml`:
        *   `ROOM_SERVICE_URL=http://room_service:8000/graphql`
        *   `GUEST_SERVICE_URL=http://guest_service:8000/graphql`
    *   `Billing Service` perlu data dari `Reservation Service`. Ia bertindak sebagai klien GraphQL untuk `Reservation Service`. URL layanan target dikonfigurasi melalui environment variable:
        *   `RESERVATION_SERVICE_URL=http://reservation_service:8000/graphql`
*   **Penting:** Perhatikan bahwa port yang digunakan untuk komunikasi antar-kontainer adalah port internal kontainer (misalnya, `8000`), bukan port yang di-expose ke host (misalnya, `8001`, `8002`, dst.).

## 5. Kolaborasi dengan Tim Lain (Menggunakan API Anda)

Jika tim lain perlu menggunakan API yang telah Anda buat, berikut langkah-langkah dan pertimbangan umumnya:

### 5.1. Menyediakan Akses ke API Anda
Tim lain akan berinteraksi dengan layanan Anda melalui endpoint GraphQL yang telah di-expose.

*   **Dokumentasi API:**
    *   Sediakan dokumentasi yang jelas tentang skema GraphQL Anda untuk setiap layanan. File `hotelease_graphql_queries.md` yang kita buat adalah awal yang baik.
    *   Jelaskan setiap query, mutation, input type, dan output type.
    *   Sertakan contoh request dan response.
    *   GraphQL native memiliki fitur introspeksi yang memungkinkan klien untuk menjelajahi skema (misalnya, melalui tool seperti GraphiQL atau Postman).

*   **Endpoint yang Digunakan Tim Lain:**
    Tim lain akan mengakses layanan Anda melalui **port host** yang Anda expose di `docker-compose.yml`, bukan port internal kontainer atau nama layanan Docker.
    *   Room Service: `http://<IP_ADDRESS_HOST_ANDA>:8001/graphql`
    *   Guest Service: `http://<IP_ADDRESS_HOST_ANDA>:8003/graphql`
    *   Reservation Service: `http://<IP_ADDRESS_HOST_ANDA>:8002/graphql`
    *   Billing Service: `http://<IP_ADDRESS_HOST_ANDA>:8004/graphql`
    Ganti `<IP_ADDRESS_HOST_ANDA>` dengan alamat IP mesin Anda yang dapat diakses oleh tim lain di jaringan yang sama. Jika mereka menjalankan di mesin yang sama (misalnya untuk pengembangan lokal), mereka bisa menggunakan `http://localhost:<PORT>/graphql`.

### 5.2. Cara Tim Lain Menjalankan dan Menggunakan Layanan Anda

Ada beberapa skenario bagaimana tim lain bisa menggunakan layanan Anda:

**Skenario A: Tim Lain Menjalankan Seluruh Sistem Anda (Docker Compose)**
Ini adalah cara termudah jika mereka membutuhkan *semua* layanan Anda untuk berfungsi.
1.  **Bagikan Kode Sumber:** Anda perlu membagikan seluruh direktori proyek Anda (termasuk semua folder layanan dan `docker-compose.yml`).
2.  **Prasyarat:** Tim lain perlu menginstal Docker dan Docker Compose di mesin mereka.
3.  **Menjalankan:** Mereka cukup menjalankan `docker-compose up --build -d` dari root direktori proyek Anda.
4.  **Akses API:** Mereka kemudian dapat mengakses API melalui `http://localhost:<PORT_HOST>/graphql` seperti yang dijelaskan di atas.

**Skenario B: Tim Lain Hanya Membutuhkan Satu atau Beberapa Layanan Anda (Docker Image)**
Jika tim lain hanya membutuhkan, misalnya, `Room Service` dan tidak ingin menjalankan seluruh tumpukan database dan layanan lainnya, Anda bisa menyediakan Docker image untuk layanan spesifik.
1.  **Build Docker Image:**
    *   Anda sudah memiliki `Dockerfile` di setiap direktori layanan (misalnya, `room_service/Dockerfile`).
    *   Anda bisa build image secara manual:
        ```bash
        cd room_service
        docker build -t hotelease/room-service:latest .
        cd ..
        # Ulangi untuk layanan lain jika perlu
        ```
2.  **Publikasikan Docker Image (Opsional, tapi direkomendasikan untuk kolaborasi):**
    *   Dorong image ke Docker Hub atau registry kontainer privat (seperti GitLab Container Registry, GitHub Packages, AWS ECR, dll.).
        ```bash
        docker login # Jika belum
        docker tag hotelease/room-service:latest yourusername/hotelease-room-service:latest
        docker push yourusername/hotelease-room-service:latest
        ```
    *   Tim lain kemudian bisa `docker pull yourusername/hotelease-room-service:latest`.
3.  **Menjalankan Image oleh Tim Lain:**
    *   Tim lain perlu menjalankan image ini dan juga database PostgreSQL yang sesuai jika layanan tersebut membutuhkannya.
    *   Contoh untuk `Room Service` (jika tim lain ingin menjalankannya secara mandiri):
        Mereka perlu membuat network, menjalankan kontainer `room_db`, lalu menjalankan kontainer `room_service` yang terhubung ke database tersebut dan mengekspos port yang benar. Ini bisa dilakukan dengan `docker run` atau dengan file `docker-compose.yml` yang lebih sederhana yang hanya mendefinisikan `room_service` dan `room_db`.
        ```yaml
        # Contoh docker-compose.yml sederhana untuk tim lain (hanya room_service)
        version: '3.8'
        services:
          room_db_external:
            image: postgres:14
            container_name: room_db_for_external_team
            environment:
              POSTGRES_USER: postgres
              POSTGRES_PASSWORD: postgres
              POSTGRES_DB: room_service_ext
            volumes:
              - room_data_ext:/var/lib/postgresql/data
            ports:
              - "5438:5432" # Port DB yang berbeda jika ada konflik
            networks:
              - hotelease_ext_network
            healthcheck:
              test: ["CMD-SHELL", "pg_isready -U postgres"]
              interval: 5s
              timeout: 5s
              retries: 5

          room_service_external:
            image: yourusername/hotelease-room-service:latest # Atau image lokal jika tidak dipublish
            container_name: room_service_for_external_team
            depends_on:
              room_db_external:
                condition: service_healthy
            environment:
              - DATABASE_URL=postgresql://postgres:postgres@room_db_external:5432/room_service_ext
            ports:
              - "8081:8000" # Port API yang berbeda jika ada konflik
            networks:
              - hotelease_ext_network
            restart: on-failure

        networks:
          hotelease_ext_network:
            driver: bridge

        volumes:
          room_data_ext:
        ```
    *   Ini lebih rumit bagi tim lain karena mereka perlu mengelola dependensi database dan konfigurasi jaringan sendiri jika mereka tidak menggunakan `docker-compose.yml` lengkap Anda.

**Rekomendasi untuk Kolaborasi Awal:**
Biasanya, **Skenario A (membagikan seluruh `docker-compose` setup)** adalah yang paling mudah untuk memulai, terutama jika layanan Anda memiliki dependensi satu sama lain (seperti `Reservation Service` yang membutuhkan `Room` dan `Guest Service`). Ini memastikan seluruh lingkungan berjalan seperti yang Anda desain.

### 5.3. Pertimbangan Penting Lainnya
*   **Versi API:** Jika Anda membuat perubahan yang signifikan (breaking changes) pada API Anda, komunikasikan ini dengan jelas dan pertimbangkan untuk menggunakan versioning API (misalnya, `/v1/graphql`, `/v2/graphql`).
*   **Keamanan:** Untuk produksi, Anda perlu memikirkan tentang autentikasi dan otorisasi untuk API Anda (misalnya, menggunakan token JWT). Saat ini, API terbuka.
*   **Logging dan Monitoring:** Untuk lingkungan produksi, penting untuk memiliki logging dan monitoring yang baik.
*   **Environment Variables:** Pastikan semua konfigurasi penting (seperti URL database, URL layanan lain, secret keys) dikelola melalui environment variables, seperti yang sudah Anda lakukan. Ini memudahkan konfigurasi di lingkungan yang berbeda.

Semoga penjelasan ini membantu Anda dan tim lain memahami arsitektur dan cara kerja sistem HotelEase!
