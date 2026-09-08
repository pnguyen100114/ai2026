# StudyMate - Cài đặt tự động cho người mới

## Cách nhanh nhất: chạy Auto Setup

Trên Windows, chỉ cần:

1. Giải nén toàn bộ thư mục dự án.
2. Nhấp đúp file `setup.bat`.
3. Nếu máy hỏi cài Node.js, chọn `Y`.
4. Dán OpenAI API key khi script yêu cầu.
5. Chờ server khởi động rồi mở <http://localhost:3000>.

Script sẽ tự động:

- Kiểm tra Node.js.
- Cài Node.js LTS bằng `winget` nếu máy hỗ trợ.
- Chạy `npm install`.
- Tạo file `.env`.
- Lưu API key vào `.env`.
- Khởi động website.

Nếu Windows chặn script, hãy nhấp chuột phải vào `setup.bat` và chọn **Run as administrator**, hoặc mở PowerShell tại thư mục dự án rồi chạy:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\setup.ps1
```

Không cần chạy các bước thủ công bên dưới nếu `setup.bat` đã chạy thành công.

Tài liệu này dành cho người chưa quen với Node.js. Làm lần lượt theo từng bước, không cần sửa code.

## 1. Cài phần mềm cần thiết

### Cài Node.js

1. Truy cập: <https://nodejs.org>
2. Tải bản **LTS**.
3. Cài đặt với các lựa chọn mặc định.
4. Đóng rồi mở lại PowerShell hoặc Terminal.

Kiểm tra cài đặt thành công:

```powershell
node --version
npm --version
```

Nếu cả hai lệnh đều hiện phiên bản, bạn có thể tiếp tục.

## 2. Lấy OpenAI API key

1. Truy cập: <https://platform.openai.com/api-keys>
2. Đăng nhập hoặc tạo tài khoản OpenAI.
3. Chọn **Create new secret key**.
4. Sao chép key ngay sau khi tạo. Key thường bắt đầu bằng `sk-`.

API key là thông tin bí mật. Không gửi key vào nhóm chat, không đăng lên GitHub và không chụp ảnh có chứa key.

## 3. Mở thư mục dự án

Giải nén hoặc sao chép toàn bộ thư mục `HTML` vào máy.

Trong File Explorer:

1. Mở thư mục `HTML`.
2. Bấm vào thanh địa chỉ.
3. Gõ `powershell`.
4. Nhấn Enter.

PowerShell sẽ mở đúng tại thư mục dự án.

Hoặc mở PowerShell rồi chạy:

```powershell
cd "D:\duong-dan-den\HTML"
```

Thay `D:\duong-dan-den\HTML` bằng đường dẫn thật trên máy.

## 4. Cài thư viện

Chạy lệnh sau trong PowerShell:

```powershell
npm install
```

Chờ đến khi lệnh hoàn tất.

## 5. Tạo file cấu hình `.env`

Trong thư mục dự án có file `.env.example`.

Chạy:

```powershell
Copy-Item .env.example .env
notepad .env
```

Trong Notepad, thay nội dung bằng key thật:

```env
OPENAI_API_KEY=sk-dan-key-cua-ban-vao-day
PORT=3000
```

Lưu file rồi đóng Notepad.

Không đổi tên file thành `.env.txt`. Nếu Windows ẩn phần mở rộng, bật:

**View → Show → File name extensions**

## 6. Chạy StudyMate

Trong PowerShell, chạy:

```powershell
npm start
```

Nếu chạy thành công, sẽ thấy dòng tương tự:

```text
StudyMate đang chạy tại http://localhost:3000
```

Mở trình duyệt và truy cập:

<http://localhost:3000>

Không mở bằng cách bấm đúp vào `index.html`, vì cách đó không khởi động backend và các tính năng AI sẽ không hoạt động.

## 7. Dừng ứng dụng

Quay lại cửa sổ PowerShell đang chạy server, sau đó nhấn:

```text
Ctrl + C
```

## 8. Chạy lại lần sau

Lần sau chỉ cần:

```powershell
cd "D:\duong-dan-den\HTML"
npm start
```

Sau đó mở <http://localhost:3000>.

## 9. Xử lý lỗi thường gặp

### Lỗi `npm is not recognized`

Node.js chưa được cài hoặc PowerShell chưa được mở lại.

1. Cài lại Node.js bản LTS.
2. Đóng PowerShell.
3. Mở PowerShell mới.
4. Chạy lại `node --version`.

### Lỗi `Server chưa cấu hình OPENAI_API_KEY`

Kiểm tra:

1. File tên chính xác là `.env`.
2. File nằm cùng thư mục với `server.js`.
3. Dòng key không có dấu ngoặc kép:

```env
OPENAI_API_KEY=sk-xxxxxxxx
```

4. Đã dừng và chạy lại `npm start` sau khi sửa `.env`.

### Lỗi OpenAI không đủ quyền hoặc hết hạn mức

Kiểm tra tài khoản OpenAI, phương thức thanh toán và hạn mức API tại:

<https://platform.openai.com/usage>

### Cổng `3000` đang được sử dụng

Mở `.env` và đổi:

```env
PORT=3001
```

Sau đó chạy lại `npm start` và mở <http://localhost:3001>.

## 10. Lưu ý bảo mật khi chia sẻ dự án

- Chỉ gửi `.env.example`, không gửi file `.env`.
- Không đưa API key vào `index.html`, `app.js` hoặc `server.js`.
- Không commit `.env` lên GitHub.
- Nếu lỡ làm lộ key, vào OpenAI Platform để revoke/xóa key đó và tạo key mới.

## Cấu trúc các file quan trọng

```text
HTML/
├── index.html       Giao diện website
├── style.css        Kiểu dáng giao diện
├── app.js           Logic chat, flashcard và kế hoạch học
├── server.js        Backend giữ API key và gọi OpenAI
├── package.json     Danh sách thư viện
├── .env.example     Mẫu cấu hình
├── setup.bat         File auto setup cho Windows
├── setup.ps1         Script cài đặt tự động
└── SETUP.md         Hướng dẫn cài đặt này
```
