# AIMLOCK JAME - Railway Postgres Server

## Cách dùng trên Railway

1. Upload toàn bộ file trong ZIP này lên GitHub repo.
2. Trên Railway, service app phải có các file ở thư mục gốc:
   - package.json
   - server.js
   - index.html
   - admin.html
   - admin.css
   - admin.js
   - styles.css
   - script.js
   - logo.png
3. Tạo Postgres service trên Railway.
4. Vào service app `Aimlock-Jame` → Variables → thêm:

DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_PASSWORD=Admin11

Nếu Postgres service tên khác, thay `Postgres` bằng đúng tên service.

5. Redeploy app.

## URL
- App: /
- Admin: /admin hoặc /admin.html

## Mặc định
- Admin password: Admin11
- Key mẫu: Admin11
