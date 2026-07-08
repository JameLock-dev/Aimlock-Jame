require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const JSON_DB_PATH = path.join(__dirname, "keys-db.json");

// Nếu có DATABASE_URL thì dùng Postgres. Nếu chưa có, server tự dùng keys-db.json
// để app vẫn chạy được local/Railway không cần cấu hình database.
const DATABASE_URL = String(
  process.env.DATABASE_PUBLIC_URL ||
  process.env.POSTGRES_PUBLIC_URL ||
  process.env.DATABASE_URL ||
  ""
).trim();

const ENV_ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "").trim();
const ENV_DEFAULT_KEY = cleanKey(process.env.DEFAULT_KEY);
const JSON_DEFAULT_KEY = ENV_DEFAULT_KEY || "Jame261103";
const JSON_DEFAULT_ADMIN_PASSWORD = "Admin11";

function isRailwayInternalUrl(url) {
  return /railway\.internal/i.test(url || "");
}

function sslConfig(url) {
  const value = String(url || "").toLowerCase();

  if (!url) return false;
  if (process.env.DB_SSL === "false" || process.env.PGSSLMODE === "disable") return false;
  if (isRailwayInternalUrl(url)) return false;

  if (
    process.env.DB_SSL === "true" ||
    process.env.PGSSLMODE === "require" ||
    value.includes("sslmode=require") ||
    value.includes("proxy.rlwy.net") ||
    process.env.NODE_ENV === "production"
  ) {
    return { rejectUnauthorized: false };
  }

  return false;
}

let pool = null;
let storageMode = DATABASE_URL ? "postgres" : "json";

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: sslConfig(DATABASE_URL)
  });

  pool.on("error", (err) => {
    console.error("Postgres pool error:", dbErrorMessage(err));
  });
} else {
  console.warn("⚠️ Chưa có DATABASE_URL. Server đang dùng local JSON database: keys-db.json");
}

app.set("trust proxy", true);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function dbErrorMessage(error) {
  const msg = error?.message || String(error || "Lỗi không xác định");

  if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
    return "Không tìm thấy host Postgres. Nếu dùng Railway, hãy đặt DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}} rồi Redeploy.";
  }

  if (msg.includes("ECONNREFUSED")) {
    return "Postgres từ chối kết nối. Kiểm tra lại DATABASE_URL / DATABASE_PUBLIC_URL.";
  }

  if (msg.includes("password authentication failed")) {
    return "Sai user/password Postgres. Hãy copy lại DATABASE_PUBLIC_URL từ PostgreSQL service.";
  }

  if (msg.includes("does not support SSL") || msg.includes("SSL")) {
    return "Lỗi SSL Postgres. Nếu dùng private URL hãy đặt DB_SSL=false, nếu dùng public URL hãy dùng DATABASE_PUBLIC_URL.";
  }

  return msg;
}

function cleanKey(value) {
  return String(value || "").trim();
}

function cleanDeviceId(value) {
  const deviceId = String(value || "browser").trim();
  return deviceId.slice(0, 120) || "browser";
}

function safeIso(value, fallbackDays = 365) {
  const date = value ? new Date(value) : null;
  if (date && !Number.isNaN(date.getTime())) return date.toISOString();
  return new Date(Date.now() + fallbackDays * 86400000).toISOString();
}

function normalizeJsonDb(data) {
  const db = data && typeof data === "object" ? data : {};
  db.settings = db.settings && typeof db.settings === "object" ? db.settings : {};
  db.keys = Array.isArray(db.keys) ? db.keys : [];
  db.usageLog = Array.isArray(db.usageLog) ? db.usageLog : [];

  db.keys = db.keys
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const keyValue = cleanKey(item.key || item.key_value || item.keyValue);
      return {
        key: keyValue,
        type: cleanKey(item.type) || "custom",
        expire: safeIso(item.expire),
        slotUsed: Math.max(0, Number(item.slotUsed ?? item.slot_used ?? 0)),
        slotLimit: Math.max(1, Number(item.slotLimit ?? item.slot_limit ?? 1)),
        status: cleanKey(item.status) || "active",
        createdAt: safeIso(item.createdAt || item.created_at || new Date().toISOString()),
        lastUsedAt: item.lastUsedAt || item.last_used_at || null,
        lastDevice: cleanKey(item.lastDevice || item.last_device || ""),
        devices: Array.isArray(item.devices) ? item.devices : []
      };
    })
    .filter((item) => item.key);

  return db;
}

function readJsonDb() {
  try {
    if (!fs.existsSync(JSON_DB_PATH)) {
      return normalizeJsonDb({ settings: {}, keys: [], usageLog: [] });
    }

    const raw = fs.readFileSync(JSON_DB_PATH, "utf8");
    return normalizeJsonDb(JSON.parse(raw || "{}"));
  } catch (error) {
    console.error("Không đọc được keys-db.json:", error.message);
    return normalizeJsonDb({ settings: {}, keys: [], usageLog: [] });
  }
}

function writeJsonDb(db) {
  const normalized = normalizeJsonDb(db);
  const tmpPath = `${JSON_DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(normalized, null, 2));
  fs.renameSync(tmpPath, JSON_DB_PATH);
}

function getAdminPassword() {
  if (ENV_ADMIN_PASSWORD) return ENV_ADMIN_PASSWORD;

  if (storageMode === "json") {
    const db = readJsonDb();
    return cleanKey(db.settings.adminPassword) || JSON_DEFAULT_ADMIN_PASSWORD;
  }

  return "";
}

function requireAdmin(req, res, next) {
  const expectedPassword = getAdminPassword();

  if (!expectedPassword) {
    return res.status(500).json({
      ok: false,
      message: "Chưa cấu hình ADMIN_PASSWORD trong biến môi trường."
    });
  }

  const password = String(req.headers["x-admin-password"] || "").trim();

  if (password !== expectedPassword) {
    return res.status(401).json({ ok: false, message: "Sai mật khẩu admin." });
  }

  next();
}

function rowToKey(row) {
  return {
    key: row.key_value,
    type: row.type || "custom",
    expire: row.expire,
    slotUsed: Number(row.slot_used || 0),
    slotLimit: Number(row.slot_limit || 1),
    status: row.status || "active",
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    lastDevice: row.last_device || ""
  };
}

function jsonKeyToPublic(item) {
  const devices = Array.isArray(item.devices) ? item.devices : [];
  const realUsed = Math.max(Number(item.slotUsed || 0), devices.length);

  return {
    key: item.key,
    type: item.type || "custom",
    expire: item.expire,
    slotUsed: realUsed,
    slotLimit: Number(item.slotLimit || 1),
    status: item.status || "active",
    createdAt: item.createdAt,
    lastUsedAt: item.lastUsedAt || null,
    lastDevice: item.lastDevice || ""
  };
}

async function initPostgres() {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS keys (
      id SERIAL PRIMARY KEY,
      key_value TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'custom',
      expire TIMESTAMPTZ NOT NULL,
      slot_used INTEGER DEFAULT 0,
      slot_limit INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_used_at TIMESTAMPTZ,
      last_device TEXT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS key_devices (
      id SERIAL PRIMARY KEY,
      key_id INTEGER REFERENCES keys(id) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_seen TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(key_id, device_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usage_log (
      id SERIAL PRIMARY KEY,
      key_value TEXT NOT NULL,
      device_id TEXT,
      ip TEXT,
      success BOOLEAN DEFAULT TRUE,
      reason TEXT,
      time TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS ip TEXT;`);
  await pool.query(`ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE;`);
  await pool.query(`ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS reason TEXT;`);
  await pool.query(`ALTER TABLE keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE keys ADD COLUMN IF NOT EXISTS last_device TEXT;`);

  if (ENV_DEFAULT_KEY) {
    await pool.query(
      `
      INSERT INTO keys (key_value, type, expire, slot_used, slot_limit, status)
      VALUES ($1, 'free', NOW() + INTERVAL '365 days', 0, 100, 'active')
      ON CONFLICT (key_value) DO NOTHING;
      `,
      [ENV_DEFAULT_KEY]
    );
  }
}

function initJsonDb() {
  const db = readJsonDb();

  if (!cleanKey(db.settings.adminPassword)) {
    db.settings.adminPassword = JSON_DEFAULT_ADMIN_PASSWORD;
  }

  const hasDefaultKey = db.keys.some((item) => item.key.toLowerCase() === JSON_DEFAULT_KEY.toLowerCase());
  if (!hasDefaultKey) {
    db.keys.unshift({
      key: JSON_DEFAULT_KEY,
      type: "free",
      expire: safeIso(null, 365),
      slotUsed: 0,
      slotLimit: 100,
      status: "active",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      lastDevice: "",
      devices: []
    });
  }

  writeJsonDb(db);
}

async function initDb() {
  if (storageMode === "postgres") {
    await initPostgres();
    console.log("✅ Postgres connected & database ready");
    return;
  }

  initJsonDb();
  console.log("✅ Local JSON database ready");
}

async function writeLog(payload) {
  const { keyValue = "", deviceId = "", ip = "", success = false, reason = "" } = payload || {};

  if (storageMode === "postgres") {
    try {
      await pool.query(
        `
        INSERT INTO usage_log (key_value, device_id, ip, success, reason)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [keyValue, deviceId, ip, success, reason]
      );
    } catch (error) {
      console.warn("Không ghi được usage_log:", dbErrorMessage(error));
    }

    return;
  }

  const db = readJsonDb();
  db.usageLog.push({
    keyValue,
    deviceId,
    ip,
    success: Boolean(success),
    reason,
    time: new Date().toISOString()
  });
  writeJsonDb(db);
}

function clientIp(req) {
  return String(req.ip || req.headers["x-forwarded-for"] || "").split(",")[0].trim();
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/api/health", async (req, res) => {
  if (storageMode === "postgres") {
    try {
      await pool.query("SELECT 1");
      return res.json({
        ok: true,
        service: "AIMLOCK JAME",
        storage: "postgres",
        postgres: true,
        urlMode: isRailwayInternalUrl(DATABASE_URL) ? "internal" : "public/external",
        time: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ ok: false, message: dbErrorMessage(error), storage: "postgres" });
    }
  }

  return res.json({
    ok: true,
    service: "AIMLOCK JAME",
    storage: "json",
    postgres: false,
    time: new Date().toISOString()
  });
});

app.get("/api/stats", async (req, res) => {
  if (storageMode === "postgres") {
    try {
      const online = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM key_devices
        WHERE last_seen > NOW() - INTERVAL '5 minutes'
      `);

      const activeKeys = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM keys
        WHERE status = 'active' AND expire > NOW()
      `);

      const today = await pool.query(`
        SELECT COUNT(*)::int AS total
        FROM usage_log
        WHERE success = TRUE AND time::date = CURRENT_DATE
      `);

      return res.json({
        ok: true,
        online: Number(online.rows[0]?.total || 0),
        activeKeys: Number(activeKeys.rows[0]?.total || 0),
        today: Number(today.rows[0]?.total || 0),
        railway: "Online",
        storage: "postgres"
      });
    } catch (error) {
      return res.status(500).json({
        ok: false,
        online: 0,
        activeKeys: 0,
        today: 0,
        railway: "OFFLINE",
        storage: "postgres",
        message: dbErrorMessage(error)
      });
    }
  }

  const db = readJsonDb();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  const onlineDeviceIds = new Set();
  for (const key of db.keys) {
    for (const device of key.devices || []) {
      const seenAt = new Date(device.lastSeen || 0).getTime();
      if (now - seenAt <= fiveMinutes) onlineDeviceIds.add(device.deviceId);
    }
  }

  const activeKeys = db.keys.filter((item) => item.status === "active" && new Date(item.expire).getTime() > now).length;
  const todayDate = new Date().toISOString().slice(0, 10);
  const today = db.usageLog.filter((log) => log.success === true && String(log.time || "").slice(0, 10) === todayDate).length;

  return res.json({
    ok: true,
    online: onlineDeviceIds.size,
    activeKeys,
    today,
    railway: "Local JSON",
    storage: "json"
  });
});

app.post("/api/verify-key", async (req, res) => {
  const input = cleanKey(req.body?.key);
  const deviceId = cleanDeviceId(req.body?.deviceId);
  const ip = clientIp(req);

  if (!input) {
    return res.status(400).json({ ok: false, message: "Vui lòng nhập key." });
  }

  if (storageMode === "postgres") {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        "SELECT * FROM keys WHERE LOWER(key_value) = LOWER($1) FOR UPDATE",
        [input]
      );

      if (!result.rows.length) {
        await client.query(
          "INSERT INTO usage_log (key_value, device_id, ip, success, reason) VALUES ($1, $2, $3, $4, $5)",
          [input, deviceId, ip, false, "Key không tồn tại"]
        );
        await client.query("COMMIT");
        return res.status(404).json({ ok: false, message: "Key không tồn tại." });
      }

      const item = result.rows[0];

      if (item.status !== "active") {
        await client.query(
          "INSERT INTO usage_log (key_value, device_id, ip, success, reason) VALUES ($1, $2, $3, $4, $5)",
          [item.key_value, deviceId, ip, false, "Key đã bị khóa"]
        );
        await client.query("COMMIT");
        return res.status(403).json({ ok: false, message: "Key đã bị khóa." });
      }

      if (new Date(item.expire).getTime() <= Date.now()) {
        await client.query("UPDATE keys SET status = 'expired' WHERE id = $1", [item.id]);
        await client.query(
          "INSERT INTO usage_log (key_value, device_id, ip, success, reason) VALUES ($1, $2, $3, $4, $5)",
          [item.key_value, deviceId, ip, false, "Key đã hết hạn"]
        );
        await client.query("COMMIT");
        return res.status(403).json({ ok: false, message: "Key đã hết hạn." });
      }

      const device = await client.query(
        "SELECT id FROM key_devices WHERE key_id = $1 AND device_id = $2 LIMIT 1",
        [item.id, deviceId]
      );

      const deviceCount = await client.query(
        "SELECT COUNT(*)::int AS total FROM key_devices WHERE key_id = $1",
        [item.id]
      );

      const slotLimit = Number(item.slot_limit || 1);
      const effectiveUsed = Math.max(Number(item.slot_used || 0), Number(deviceCount.rows[0]?.total || 0));
      let finalUsed = effectiveUsed;

      if (device.rows.length) {
        await client.query(
          "UPDATE key_devices SET last_seen = NOW() WHERE key_id = $1 AND device_id = $2",
          [item.id, deviceId]
        );
      } else {
        if (effectiveUsed >= slotLimit) {
          await client.query(
            "INSERT INTO usage_log (key_value, device_id, ip, success, reason) VALUES ($1, $2, $3, $4, $5)",
            [item.key_value, deviceId, ip, false, "Key đã hết slot"]
          );
          await client.query("COMMIT");
          return res.status(403).json({ ok: false, message: `Key đã hết slot: ${effectiveUsed}/${slotLimit}` });
        }

        await client.query("INSERT INTO key_devices (key_id, device_id) VALUES ($1, $2)", [item.id, deviceId]);
        finalUsed = effectiveUsed + 1;
      }

      const updated = await client.query(
        `
        UPDATE keys
        SET slot_used = $2,
            last_used_at = NOW(),
            last_device = $3
        WHERE id = $1
        RETURNING *
        `,
        [item.id, finalUsed, deviceId]
      );

      await client.query(
        "INSERT INTO usage_log (key_value, device_id, ip, success, reason) VALUES ($1, $2, $3, $4, $5)",
        [item.key_value, deviceId, ip, true, "Đăng nhập thành công"]
      );
      await client.query("COMMIT");

      return res.json({ ok: true, message: "Key hợp lệ.", key: rowToKey(updated.rows[0]) });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}

      return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
    } finally {
      client.release();
    }
  }

  const db = readJsonDb();
  const item = db.keys.find((key) => key.key.toLowerCase() === input.toLowerCase());

  if (!item) {
    await writeLog({ keyValue: input, deviceId, ip, success: false, reason: "Key không tồn tại" });
    return res.status(404).json({ ok: false, message: "Key không tồn tại." });
  }

  if (item.status !== "active") {
    await writeLog({ keyValue: item.key, deviceId, ip, success: false, reason: "Key đã bị khóa" });
    return res.status(403).json({ ok: false, message: "Key đã bị khóa." });
  }

  if (new Date(item.expire).getTime() <= Date.now()) {
    item.status = "expired";
    db.usageLog.push({ keyValue: item.key, deviceId, ip, success: false, reason: "Key đã hết hạn", time: new Date().toISOString() });
    writeJsonDb(db);
    return res.status(403).json({ ok: false, message: "Key đã hết hạn." });
  }

  item.devices = Array.isArray(item.devices) ? item.devices : [];
  const existingDevice = item.devices.find((device) => device.deviceId === deviceId);
  const slotLimit = Number(item.slotLimit || 1);
  const effectiveUsed = Math.max(Number(item.slotUsed || 0), item.devices.length);

  if (existingDevice) {
    existingDevice.lastSeen = new Date().toISOString();
  } else {
    if (effectiveUsed >= slotLimit) {
      await writeLog({ keyValue: item.key, deviceId, ip, success: false, reason: "Key đã hết slot" });
      return res.status(403).json({ ok: false, message: `Key đã hết slot: ${effectiveUsed}/${slotLimit}` });
    }

    item.devices.push({ deviceId, createdAt: new Date().toISOString(), lastSeen: new Date().toISOString() });
  }

  item.slotUsed = Math.max(Number(item.slotUsed || 0), item.devices.length);
  item.lastUsedAt = new Date().toISOString();
  item.lastDevice = deviceId;

  db.usageLog.push({ keyValue: item.key, deviceId, ip, success: true, reason: "Đăng nhập thành công", time: new Date().toISOString() });
  writeJsonDb(db);

  return res.json({ ok: true, message: "Key hợp lệ.", key: jsonKeyToPublic(item) });
});

app.get("/api/admin/keys", requireAdmin, async (req, res) => {
  if (storageMode === "postgres") {
    try {
      const result = await pool.query(`
        SELECT
          k.*,
          GREATEST(k.slot_used, COUNT(kd.id)::int) AS slot_used
        FROM keys k
        LEFT JOIN key_devices kd ON kd.key_id = k.id
        GROUP BY k.id
        ORDER BY k.created_at DESC, k.id DESC
      `);

      return res.json({ ok: true, keys: result.rows.map(rowToKey), storage: "postgres" });
    } catch (error) {
      return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
    }
  }

  const db = readJsonDb();
  const keys = db.keys
    .map(jsonKeyToPublic)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({ ok: true, keys, storage: "json" });
});

app.post("/api/admin/keys", requireAdmin, async (req, res) => {
  const input = cleanKey(req.body?.key);
  const type = cleanKey(req.body?.type) || "custom";
  const expire = safeIso(req.body?.expire, 7);
  const slotUsed = Math.max(0, Number(req.body?.slotUsed || 0));
  const slotLimit = Math.max(1, Number(req.body?.slotLimit || 1));
  const status = cleanKey(req.body?.status) || "active";

  if (!input) {
    return res.status(400).json({ ok: false, message: "Thiếu key." });
  }

  if (storageMode === "postgres") {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        INSERT INTO keys (key_value, type, expire, slot_used, slot_limit, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (key_value)
        DO UPDATE SET
          type = EXCLUDED.type,
          expire = EXCLUDED.expire,
          slot_used = EXCLUDED.slot_used,
          slot_limit = EXCLUDED.slot_limit,
          status = EXCLUDED.status
        RETURNING *
        `,
        [input, type, expire, slotUsed, slotLimit, status]
      );

      if (slotUsed === 0) {
        await client.query("DELETE FROM key_devices WHERE key_id = $1", [result.rows[0].id]);
      }

      await client.query("COMMIT");

      return res.json({ ok: true, message: "Đã lưu key.", key: rowToKey(result.rows[0]) });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}

      return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
    } finally {
      client.release();
    }
  }

  const db = readJsonDb();
  let item = db.keys.find((key) => key.key.toLowerCase() === input.toLowerCase());

  if (!item) {
    item = {
      key: input,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      lastDevice: "",
      devices: []
    };
    db.keys.unshift(item);
  }

  item.type = type;
  item.expire = expire;
  item.slotUsed = slotUsed;
  item.slotLimit = slotLimit;
  item.status = status;
  if (slotUsed === 0) item.devices = [];

  writeJsonDb(db);

  return res.json({ ok: true, message: "Đã lưu key.", key: jsonKeyToPublic(item) });
});

app.delete("/api/admin/keys/:key", requireAdmin, async (req, res) => {
  const input = cleanKey(req.params.key);

  if (storageMode === "postgres") {
    try {
      const result = await pool.query("DELETE FROM keys WHERE LOWER(key_value) = LOWER($1) RETURNING key_value", [input]);
      return res.json({ ok: true, message: result.rowCount ? "Đã xóa key." : "Không tìm thấy key." });
    } catch (error) {
      return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
    }
  }

  const db = readJsonDb();
  const before = db.keys.length;
  db.keys = db.keys.filter((item) => item.key.toLowerCase() !== input.toLowerCase());
  writeJsonDb(db);

  return res.json({ ok: true, message: db.keys.length < before ? "Đã xóa key." : "Không tìm thấy key." });
});

// Bắt mọi đường dẫn /api bị sai để frontend luôn nhận JSON, không nhận HTML.
app.use("/api", (req, res) => {
  return res.status(404).json({
    ok: false,
    message: `Không tìm thấy API ${req.method} ${req.originalUrl}. Hãy kiểm tra đã deploy đúng server.js chưa.`
  });
});

initDb()
  .catch((error) => {
    console.error("❌ Database init failed:", dbErrorMessage(error));
    if (storageMode === "postgres") {
      console.warn("⚠️ Postgres lỗi. Server chuyển tạm sang local JSON database để app vẫn mở được.");
      storageMode = "json";
      initJsonDb();
    }
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`✅ AIMLOCK JAME server running on port ${PORT}`);
      console.log(`✅ Storage mode: ${storageMode}`);
      console.log(`✅ Open app: http://localhost:${PORT}`);
      if (storageMode === "json") {
        console.log("ℹ️ Local admin password mặc định: Admin11. Hãy đổi bằng ADMIN_PASSWORD khi dùng thật.");
      }
    });
  });
