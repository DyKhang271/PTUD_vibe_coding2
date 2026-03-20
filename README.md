# Hệ Thống Quản Lý Thư Viện Đại Học (MVP)

Đây là ứng dụng web MVP cho việc quản lý thư viện trường đại học.
Hệ thống được thiết kế tối giản (Minimal & Clean), sử dụng tông màu nhẹ nhàng, hiển thị tốt trên các thiết bị.

## Công nghệ sử dụng
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Fetch API)

## Các Chức Năng Chính
1. **Đăng nhập**: Phân quyền Admin và Thủ thư.
2. **Quản lý Độc giả**: Thêm, sửa, xóa, in thẻ thư viện.
3. **Quản lý Thể loại sách**: Thêm, sửa, xóa.
4. **Quản lý Đầu sách**: Thêm, sửa, xóa, liên kết với thể loại.
5. **Quản lý Bản sao (Cuốn sách)**: Nhập kho cuốn sách và quản lý tình trạng (khả dụng/mất).
6. **Mượn / Trả sách**: Tạo phiếu mượn (1 độc giả mượn 1 sách tối đa), xác nhận trả sách nhanh chóng.
7. **Báo cáo**: Thống kê sách mượn nhiều nhất và độc giả chưa trả sách.

## Hướng dẫn cài đặt và khởi chạy

**Bước 1**: Đảm bảo máy bạn đã cài đặt Node.js.  
**Bước 2**: Mở terminal ở thư mục này (`quan-ly-thu-vien`) và chạy lệnh cài đặt thư viện:
```bash
npm install
```
*(Nếu cài đặt `sqlite3` bị lỗi trên Windows do thiếu Build Tools, bạn có thể chạy `npm install sqlite3 --no-bin-links` hoặc cài Visual Studio Build Tools để cài đặt thành công module C++ dở dang)*

**Bước 3**: Khởi chạy server:
```bash
npm start
```
Hoặc: `node server.js`

**Bước 4**: Truy cập ứng dụng:
Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

## Dữ Liệu Mẫu (Sample Data)
Hệ thống tự động tạo CSDL `library.db` và chèn dữ liệu mẫu khi chạy lần đầu.

Tài khoản mặc định:
- **Admin**: `admin` / `admin123`
- **Thủ thư**: `thuthu1` / `123456`
# PTUD_vibe_coding2
