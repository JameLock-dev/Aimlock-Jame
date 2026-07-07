const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin11";
const DB_PATH = path.join(__dirname, "keys-db.json");

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function readDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ keys: [], usageLog: [] }, null, 2));
  }

  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch (error) {
    return { keys: [], usageLog: [] };
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function isExpired(expire) {
  if (!expire) return false;
  const expireTime = new Date(expire).getTime();
  if (Number.isNaN(expireTime)) return false;
  return Date.now() > expireTime;
}

function publicKey(item) {
  return {
    key: item.key,
    type: item.type,
    expire: item.expire,
    slotUsed: item.slotUsed || 0,
    slotLimit: item.slotLimit || 1,
    status: item.status || "active",
    createdAt: item.createdAt || ""
  };
}

function requireAdmin(req, res, next) {
  const password = req.headers["x-admin-password"];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: "Sai mật khẩu admin." });
  }
  next();
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, railway: true, time: new Date().toISOString() });
});

app.get("/api/stats", (req, res) => {
  const db = readDb();
  const activeKeys = db.keys.filter((item) => item.status === "active" && !isExpired(item.expire)).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayUsage = (db.usageLog || []).filter((item) => String(item.time || "").startsWith(today)).length;

  res.json({
    ok: true,
    online: Math.max(1, todayUsage),
    activeKeys,
    today: todayUsage,
    railway: "Online"
  });
});

app.post("/api/verify-key", (req, res) => {
  const { key, deviceId = "browser" } = req.body || {};
  const normalized = String(key || "").trim();

  if (!normalized) {
    return res.status(400).json({ ok: false, message: "Vui lòng nhập key." });
  }

  const db = readDb();
  const item = db.keys.find((entry) => String(entry.key).toLowerCase() === normalized.toLowerCase());

  if (!item) {
    return res.status(404).json({ ok: false, message: "Key không tồn tại." });
  }

  if (item.status !== "active") {
    return res.status(403).json({ ok: false, message: "Key đã bị khóa." });
  }

  if (isExpired(item.expire)) {
    item.status = "expired";
    writeDb(db);
    return res.status(403).json({ ok: false, message: "Key đã hết hạn." });
  }

  const slotLimit = Number(item.slotLimit || 1);
  const slotUsed = Number(item.slotUsed || 0);

  if (slotUsed >= slotLimit) {
    return res.status(403).json({ ok: false, message: "Key đã hết slot." });
  }

  item.slotUsed = slotUsed + 1;
  item.lastDevice = deviceId;
  item.lastUsedAt = new Date().toISOString();

  db.usageLog = db.usageLog || [];
  db.usageLog.unshift({
    key: item.key,
    deviceId,
    time: new Date().toISOString()
  });
  db.usageLog = db.usageLog.slice(0, 200);

  writeDb(db);

  res.json({
    ok: true,
    message: "Key hợp lệ.",
    key: publicKey(item)
  });
});

app.get("/api/admin/keys", requireAdmin, (req, res) => {
  const db = readDb();
  res.json({ ok: true, keys: db.keys.map(publicKey) });
});

app.post("/api/admin/keys", requireAdmin, (req, res) => {
  const { key, type = "custom", expire, slotLimit = 1, slotUsed = 0, status = "active" } = req.body || {};
  const normalized = String(key || "").trim();

  if (!normalized) {
    return res.status(400).json({ ok: false, message: "Thiếu key." });
  }

  const db = readDb();
  const index = db.keys.findIndex((item) => String(item.key).toLowerCase() === normalized.toLowerCase());
  const payload = {
    key: normalized,
    type: String(type || "custom"),
    expire: expire || new Date(Date.now() + 7 * 86400000).toISOString(),
    slotUsed: Number(slotUsed || 0),
    slotLimit: Number(slotLimit || 1),
    status,
    createdAt: index >= 0 ? db.keys[index].createdAt : new Date().toISOString()
  };

  if (index >= 0) {
    db.keys[index] = payload;
  } else {
    db.keys.unshift(payload);
  }

  writeDb(db);
  res.json({ ok: true, message: index >= 0 ? "Đã cập nhật key." : "Đã thêm key.", key: publicKey(payload) });
});

app.delete("/api/admin/keys/:key", requireAdmin, (req, res) => {
  const db = readDb();
  const before = db.keys.length;
  db.keys = db.keys.filter((item) => String(item.key).toLowerCase() !== String(req.params.key).toLowerCase());
  writeDb(db);

  res.json({ ok: true, message: before === db.keys.length ? "Không tìm thấy key." : "Đã xóa key." });
});

app.listen(PORT, () => {
  console.log(`AIMLOCK JAME server running on port ${PORT}`);
});
