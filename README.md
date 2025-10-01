# 🎨 ArtSpace

**ArtSpace** คือแพลตฟอร์มเว็บแอปสำหรับกิจกรรมและชุมชนศิลปะ  
ประกอบด้วย **Backend (ASP.NET Core + MySQL)** และ **Frontend (HTML/CSS/JS)**

---

## 📦 การติดตั้ง (Installation)

### 🔧 Backend Setup

1. **ติดตั้ง MySQL**
   - แนะนำให้ใช้เวอร์ชัน **8.x**
   - สร้าง Database ชื่อ `ArtSpace`

2. **ตั้งค่า `appsettings.json`**

   ไปที่โฟลเดอร์ `Backend` แล้วแก้ไขไฟล์ `appsettings.json` ดังนี้:

   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "server=localhost;port=3306;database=ArtSpace;user=root;password=1234;"
     },
     "Jwt": {
       "Key": "<ใส่ secret key ของคุณ>",
       "Issuer": "MyApi",
       "Audience": "MyApiUsers"
     },
     "Logging": {
       "LogLevel": {
         "Default": "Information",
         "Microsoft.AspNetCore": "Warning"
       }
     },
     "AllowedHosts": "*"
   }
   ```

3. **รัน Backend**
   - `zReset.bat` → ใช้เพื่อลบและสร้าง table ใน MySQL ใหม่  
   - `start.bat` → ใช้เพื่อเริ่มการทำงานของ Backend  

   > หลังจากรันแล้ว Backend จะทำงานที่ `http://localhost:5000`

---

### 🎨 Frontend Setup

1. เข้าโฟลเดอร์ **Frontend**
   ```bash
   cd Frontend
   ```

2. เปิดไฟล์ `index.html` ด้วย **Live Server** (VS Code Extension)  
   โดยทั่วไปจะเข้าถึงได้ที่:
   ```
   http://127.0.0.1:5500
   ```
   (ค่ามาตรฐานของ Live Server)

---

## 🛠 Tech Stack

- **Backend**: ASP.NET Core + Entity Framework Core + MySQL + JWT  
- **Frontend**: HTML + CSS + JavaScript (Fetch API)  
- **Tools**: Postman (ทดสอบ API), Live Server (Frontend Dev)
---
