# 🛒 ECommerce Project (FastAPI + React + AI)

Hệ thống web bán hàng online fullstack với tích hợp trí tuệ nhân tạo và thanh toán trực tuyến.

---

## 📌 Giới thiệu

Đây là dự án **E-Commerce** được xây dựng theo mô hình fullstack, bao gồm:

- 🔧 **Backend**: FastAPI (Python) + PostgreSQL
- 🎨 **Frontend**: ReactJS + Vite + TailwindCSS
- 🤖 **AI**: Google Gemini (Chatbot hỗ trợ khách hàng)
- 💳 **Thanh toán**: OnePay
- 🔐 **Authentication**: JWT

---

## 🎯 Tính năng chính

- Quản lý sản phẩm, danh mục
- Giỏ hàng và đặt hàng
- Thanh toán online qua OnePay
- Chatbot AI hỗ trợ khách hàng
- Hệ thống xác thực và phân quyền

---


---

## 🚀 Hướng dẫn chạy dự án

---

## 🧰 Prerequisites

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

- Docker và Docker Compose
- Node.js >= 18
- Git

---

## 🐳 1. Cài đặt Docker (nếu chưa có)

### Windows / macOS

1. Truy cập: https://www.docker.com/products/docker-desktop
2. Tải và cài đặt Docker Desktop
3. Mở Docker sau khi cài đặt

---

### Linux (Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### Kiểm tra Docker

```bash
docker --version
```

## 2. Chạy Backend (FastAPI + Docker)
### Clone project
```bash
git clone <repository_url>
cd ECommerce
```

### Vào thư mục backend
```bash
cd shopping_be
```

### Tạo file môi trường
```bash
cp .env.example .env
```

### Chạy backend
```bash
docker-compose up --build
```

### Backend chạy tại: 
http://localhost:8000


## 2. Chạy Frontend (ReactJS)
### Mở terminal mới:
```bash
cd shopping_fe
npm install
npm run dev
```

### Tạo file môi trường
```bash
cp .env.example .env
```

### Chạy backend
```bash
docker-compose up --build
```

### Frontend chạy tại:
http://localhost:5173

### 3. Hướng dẫn lấy GEMINI_API_KEY
Truy cập: https://makersuite.google.com/app/apikey

Đăng nhập bằng tài khoản Google

Nhấn Create API Key

Copy API key và dán vào .env

⚠️ Lưu ý
Không commit file .env lên GitHub

Giữ API key bí mật

### 4. Thông tin kiểm thử với OnePay
Chọn thẻ VCB - ATM

Số thẻ: 9704360000000000002

Tên chủ thẻ: NGUYEN VAN A

Ngày hết hạn: 01/13

OTP: 123456




