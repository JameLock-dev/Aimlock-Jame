HUONG DAN CHAY BAN DA SUA HOAN CHINH

1) KHONG mo index.html truc tiep.
2) Giai nen file zip.
3) Neu chay tren may Windows: bam start-local.bat.
4) Web se mo tai: http://localhost:3000
5) Key mac dinh de test: Jame261103
6) Trang admin: http://localhost:3000/admin
7) Mat khau admin mac dinh local: Admin11

DEPLOY RAILWAY:
- Upload folder nay len GitHub.
- Deploy Railway tu repo.
- Railway se chay lenh npm start.
- Mo domain Railway, khong mo GitHub Pages.

Bien moi truong nen dat khi dung that:
ADMIN_PASSWORD=mat_khau_manh_cua_ban
DEFAULT_KEY=key_mac_dinh_cua_ban

Neu co Railway Postgres, dat them:
DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}

GHI CHU:
- Neu khong co DATABASE_URL, server tu dung file keys-db.json.
- Neu co DATABASE_URL, server dung Postgres.
- api-config.js de trong la dung khi frontend va server.js chay cung domain.
