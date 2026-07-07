# AIMLOCK JAME - Railway Postgres Server

Bản này đã sửa lỗi:

```txt
getaddrinfo ENOTFOUND postgres.railway.internal
```

## Cách deploy trên Railway

1. Upload toàn bộ file trong ZIP này lên GitHub repo.
2. Trên Railway tạo Web/App service từ repo đó.
3. Tạo thêm PostgreSQL service trong cùng project.
4. Vào **App Service → Variables**, thêm:

```env
ADMIN_PASSWORD=Admin11
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
DEFAULT_KEY=JAME-FREE-KEY
```

> Nếu PostgreSQL service của bạn không tên là `Postgres`, hãy chọn đúng tên service rồi lấy biến `DATABASE_PUBLIC_URL`.

5. Xóa các biến cũ nếu có:

```env
PGHOST=postgres.railway.internal
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

6. Bấm **Redeploy / Restart**.

## URL

- App: `/`
- Admin: `/admin` hoặc `/admin.html`
- Check server: `/api/health`

## Mặc định

- Admin password: `Admin11`
- Key mẫu: `JAME-FREE-KEY`

## Ghi chú

- `Admin11` có thể mở app chính kể cả khi database đang lỗi.
- Muốn quản lý danh sách key ở trang Admin thì Postgres phải kết nối thành công.
- Nên dùng `DATABASE_PUBLIC_URL` để tránh lỗi DNS `postgres.railway.internal`.

## Fix lỗi Unexpected token '<'
Lỗi này nghĩa là frontend gọi `/api/verify-key` nhưng server trả về HTML thay vì JSON. Hãy deploy cả project Node.js gồm `server.js` + `package.json`, không upload riêng file HTML/CSS/JS như static site. Sau khi deploy, mở thử `/api/health`; nếu API đúng sẽ trả JSON.


## V7 changes
- Removed crosshair customization text and controls.
- Feature card updated to AINTIBAN.
- Feature card updated to REG FF.
- Other functions kept unchanged.


## V8
- Đã bỏ hoàn toàn tính năng REG FF OB54 khỏi menu, lưới tính năng và modal.
- Giữ nguyên các tính năng còn lại: Boost RAM, AIMBODY, NHẸ TÂM, JAMELOCK, AINTIBAN, REG FF, THÔNG TIN.
