require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin11";

// Ưu tiên DATABASE_PUBLIC_URL để tránh lỗi ENOTFOUND postgres.railway.internal.
// Trên Railway App Service nên đặt: DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}}
const DATABASE_URL = String(
  process.env.DATABASE_PUBLIC_URL ||
  process.env.POSTGRES_PUBLIC_URL ||
  process.env.DATABASE_URL ||
  ""
).trim();

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
  console.warn("⚠️ Chưa có DATABASE_URL / DATABASE_PUBLIC_URL trong Railway Variables.");
}

app.set("trust proxy", true);
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function dbErrorMessage(error) {
  const msg = error?.message || String(error || "Lỗi không xác định");

  if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
    return "Không tìm thấy host Postgres. Hãy đặt DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}} trong Railway App Service, rồi Redeploy.";
  }

  if (msg.includes("ECONNREFUSED")) {
    return "Postgres từ chối kết nối. Kiểm tra lại DATABASE_URL / DATABASE_PUBLIC_URL trên Railway.";
  }

  if (msg.includes("password authentication failed")) {
    return "Sai user/password Postgres. Hãy copy lại DATABASE_PUBLIC_URL từ PostgreSQL service trên Railway.";
  }

  if (msg.includes("does not support SSL") || msg.includes("SSL")) {
    return "Lỗi SSL Postgres. Nếu dùng private URL hãy đặt DB_SSL=false, nếu dùng public URL hãy dùng DATABASE_PUBLIC_URL.";
  }

  return msg;
}

function requireDatabase(req, res, next) {
  if (!pool || !DATABASE_URL) {
    return res.status(500).json({
      ok: false,
      message: "Chưa cấu hình DATABASE_URL. Trên Railway App Service hãy thêm DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}} rồi Redeploy.",
      railway: "NO DATABASE"
    });
  }

  next();
}

function requireAdmin(req, res, next) {
  const password = req.headers["x-admin-password"];

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: "Sai mật khẩu admin." });
  }

  next();
}

function cleanKey(value) {
  return String(value || "").trim();
}

function cleanDeviceId(value) {
  const deviceId = String(value || "browser").trim();
  return deviceId.slice(0, 120) || "browser";
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

async function initDb() {
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

  // Thêm cột mới nếu database cũ chưa có.
  await pool.query(`ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS ip TEXT;`);
  await pool.query(`ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE;`);
  await pool.query(`ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS reason TEXT;`);


  // AIMLOCK APP SETTINGS API - FIX V2
  // Dùng bảng riêng aimlock_app_settings để tránh lỗi table cũ thiếu column "data".
  await pool.query(`
    CREATE TABLE IF NOT EXISTS aimlock_app_settings (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE aimlock_app_settings ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;`);
  await pool.query(`ALTER TABLE aimlock_app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);

  await pool.query(`
    INSERT INTO aimlock_app_settings (id, data, updated_at)
    VALUES (1, '{}'::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING;
  `);

  // Key mẫu luôn còn hạn 365 ngày. Có thể đổi bằng DEFAULT_KEY trên Railway.
  await pool.query(
    `
    INSERT INTO keys (key_value, type, expire, slot_used, slot_limit, status)
    VALUES ($1, 'free', NOW() + INTERVAL '365 days', 0, 100, 'active')
    ON CONFLICT (key_value) DO NOTHING;
    `,
    [process.env.DEFAULT_KEY || "JAMEADMINKEY"]
  );

  // Cho phép Admin11 cũng là key mẫu trong database.
  await pool.query(
    `
    INSERT INTO keys (key_value, type, expire, slot_used, slot_limit, status)
    VALUES ($1, 'admin', NOW() + INTERVAL '3650 days', 0, 100, 'active')
    ON CONFLICT (key_value) DO NOTHING;
    `,
    [ADMIN_PASSWORD]
  );

  console.log("✅ Postgres connected & database ready");
}

async function writeLog(clientOrPool, payload) {
  const db = clientOrPool || pool;
  if (!db) return;

  const { keyValue = "", deviceId = "", ip = "", success = false, reason = "" } = payload || {};

  try {
    await db.query(
      `
      INSERT INTO usage_log (key_value, device_id, ip, success, reason)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [keyValue, deviceId, ip, success, reason]
    );
  } catch (error) {
    console.warn("Không ghi được usage_log:", dbErrorMessage(error));
  }
}

async function getKeyRowByValue(clientOrPool, keyValue) {
  const db = clientOrPool || pool;
  const result = await db.query(
    "SELECT * FROM keys WHERE LOWER(key_value) = LOWER($1) LIMIT 1",
    [keyValue]
  );

  return result.rows[0] || null;
}

async function syncSlotUsed(clientOrPool, keyId) {
  const db = clientOrPool || pool;

  const updated = await db.query(
    `
    UPDATE keys
    SET slot_used = (
      SELECT COUNT(*)::int
      FROM key_devices
      WHERE key_id = $1
    )
    WHERE id = $1
    RETURNING *
    `,
    [keyId]
  );

  return updated.rows[0] || null;
}


// AIMLOCK APP SETTINGS API - FIX V2
function defaultAppSettings() {
  return {
    maintenance: false,
    forceUpdate: false,
    minVersion: 1,
    latestVersion: 1,

    freeKeyUrl: "https://link-cua-ban.com/lay-key",
    updateUrl: "https://link-cua-ban.com/tai-apk",
    zaloUrl: "https://zalo.me/0333635135",
    tiktokUrl: "https://www.tiktok.com/",

    maintenanceTitle: "APP ĐANG BẢO TRÌ",
    maintenanceMessage: "Vui lòng quay lại sau.",
    forceTitle: "CẦN CẬP NHẬT APP",
    forceMessage: "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục.",

    updateItems: [
      {
        badge: "NEW",
        title: "NEW AIMLOCK MỚI",
        description: "Thêm tính năng AIMLOCK mới cho anh em."
      },
      {
        badge: "01",
        title: "Admin Settings",
        description: "Có thể sửa update/link/trạng thái app trực tiếp trên admin."
      }
    ]
  };
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const text = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(text)) return true;
  if (["false", "0", "no", "off"].includes(text)) return false;

  return fallback;
}

function parseUpdateItems(value, fallback) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }

  return fallback;
}

function normalizeAppSettings(input) {
  const defaults = defaultAppSettings();
  const current = input && typeof input === "object" ? input : {};

  const updateItems = parseUpdateItems(
    current.updateItems ?? current.update_items,
    defaults.updateItems
  );

  return {
    ...defaults,
    ...current,

    maintenance: toBoolean(current.maintenance ?? current.isMaintenance, defaults.maintenance),
    forceUpdate: toBoolean(current.forceUpdate ?? current.force_update ?? current.requiredUpdate ?? current.mustUpdate, defaults.forceUpdate),

    minVersion: Number(current.minVersion ?? current.minimumVersion ?? current.minAppVersion ?? current.requiredVersion ?? defaults.minVersion) || 1,
    latestVersion: Number(current.latestVersion ?? current.newVersion ?? current.currentVersion ?? current.version ?? defaults.latestVersion) || 1,

    freeKeyUrl: String(current.freeKeyUrl ?? current.keyUrl ?? current.linkKeyUrl ?? current.getKeyUrl ?? defaults.freeKeyUrl),
    updateUrl: String(current.updateUrl ?? current.downloadUrl ?? current.apkUrl ?? current.newVersionUrl ?? current.appDownloadUrl ?? current.boostLinkUrl ?? defaults.updateUrl),
    zaloUrl: String(current.zaloUrl ?? current.supportUrl ?? defaults.zaloUrl),
    tiktokUrl: String(current.tiktokUrl ?? current.communityUrl ?? defaults.tiktokUrl),

    maintenanceTitle: String(current.maintenanceTitle ?? current.statusTitle ?? defaults.maintenanceTitle),
    maintenanceMessage: String(current.maintenanceMessage ?? current.maintenanceText ?? current.statusMessage ?? defaults.maintenanceMessage),
    forceTitle: String(current.forceTitle ?? current.updateTitle ?? defaults.forceTitle),
    forceMessage: String(current.forceMessage ?? current.updateMessage ?? current.oldVersionMessage ?? defaults.forceMessage),

    updateItems
  };
}

async function ensureAppSettingsTable() {
  if (!pool || !DATABASE_URL) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS aimlock_app_settings (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE aimlock_app_settings ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;`);
  await pool.query(`ALTER TABLE aimlock_app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);

  await pool.query(`
    INSERT INTO aimlock_app_settings (id, data, updated_at)
    VALUES (1, '{}'::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING;
  `);
}

async function readAppSettingsFromDb() {
  if (!pool || !DATABASE_URL) {
    return normalizeAppSettings(defaultAppSettings());
  }

  await ensureAppSettingsTable();

  const result = await pool.query(
    "SELECT data, updated_at FROM aimlock_app_settings WHERE id = 1 LIMIT 1"
  );

  const row = result.rows[0];

  if (!row) {
    const settings = normalizeAppSettings(defaultAppSettings());

    await pool.query(
      `
      INSERT INTO aimlock_app_settings (id, data, updated_at)
      VALUES (1, $1::jsonb, NOW())
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `,
      [JSON.stringify(settings)]
    );

    return settings;
  }

  return normalizeAppSettings({
    ...(row.data || {}),
    updatedAt: row.updated_at
  });
}

async function saveAppSettingsToDb(payload) {
  if (!pool || !DATABASE_URL) {
    const error = new Error("Chưa cấu hình DATABASE_URL nên không thể lưu settings.");
    error.statusCode = 500;
    throw error;
  }

  await ensureAppSettingsTable();

  const current = await readAppSettingsFromDb();
  const next = normalizeAppSettings({
    ...current,
    ...(payload || {}),
    updatedAt: new Date().toISOString()
  });

  await pool.query(
    `
    INSERT INTO aimlock_app_settings (id, data, updated_at)
    VALUES (1, $1::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    `,
    [JSON.stringify(next)]
  );

  return next;
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

app.get("/api/health", requireDatabase, async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.json({
      ok: true,
      service: "AIMLOCK JAME",
      postgres: true,
      urlMode: isRailwayInternalUrl(DATABASE_URL) ? "internal" : "public/external",
      time: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

app.get("/api/stats", requireDatabase, async (req, res) => {
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
      railway: "Online"
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      online: 0,
      activeKeys: 0,
      today: 0,
      railway: "OFFLINE",
      message: dbErrorMessage(error)
    });
  }
});



// AIMLOCK APP SETTINGS API - FIX V2
// APK/WebView đọc settings công khai.
app.get("/api/app-settings", async (req, res) => {
  try {
    const settings = await readAppSettingsFromDb();

    return res.json({
      ok: true,
      ...settings,
      settings
    });
  } catch (error) {
    const fallback = defaultAppSettings();

    return res.status(500).json({
      ok: false,
      message: dbErrorMessage(error),
      ...fallback,
      settings: fallback
    });
  }
});

// Admin lưu settings. Cần header x-admin-password đúng ADMIN_PASSWORD.
app.post("/api/app-settings", requireAdmin, async (req, res) => {
  try {
    const saved = await saveAppSettingsToDb(req.body || {});

    return res.json({
      ok: true,
      message: "Đã lưu settings.",
      ...saved,
      settings: saved
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: dbErrorMessage(error)
    });
  }
});

// Giữ route cũ để admin.js cũ cũng chạy.
app.get("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await readAppSettingsFromDb();

    return res.json({
      ok: true,
      ...settings,
      settings
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: dbErrorMessage(error)
    });
  }
});

app.post("/api/admin/settings", requireAdmin, async (req, res) => {
  try {
    const saved = await saveAppSettingsToDb(req.body || {});

    return res.json({
      ok: true,
      message: "Đã lưu settings.",
      ...saved,
      settings: saved
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      message: dbErrorMessage(error)
    });
  }
});


app.post("/api/verify-key", async (req, res) => {
  const input = cleanKey(req.body?.key);
  const deviceId = cleanDeviceId(req.body?.deviceId);
  const ip = String(req.ip || req.headers["x-forwarded-for"] || "").split(",")[0].trim();

  if (!input) {
    return res.status(400).json({ ok: false, message: "Vui lòng nhập Password / Key." });
  }

  // Admin password đăng nhập được kể cả khi Postgres đang lỗi.
  if (input === ADMIN_PASSWORD) {
    return res.json({
      ok: true,
      message: "Đăng nhập Admin thành công.",
      key: {
        key: "ADMIN",
        type: "admin",
        expire: "2099-12-31T23:59:59.000Z",
        slotUsed: 1,
        slotLimit: 1,
        status: "active"
      }
    });
  }

  if (!pool || !DATABASE_URL) {
    return res.status(500).json({
      ok: false,
      message: "Chưa cấu hình DATABASE_URL. Hãy thêm DATABASE_URL=${{Postgres.DATABASE_PUBLIC_URL}} trên Railway rồi Redeploy."
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM keys WHERE LOWER(key_value) = LOWER($1) FOR UPDATE",
      [input]
    );

    if (!result.rows.length) {
      await writeLog(client, { keyValue: input, deviceId, ip, success: false, reason: "Key không tồn tại" });
      await client.query("COMMIT");
      return res.status(404).json({ ok: false, message: "Key không tồn tại." });
    }

    const item = result.rows[0];

    if (item.status !== "active") {
      await writeLog(client, { keyValue: item.key_value, deviceId, ip, success: false, reason: "Key đã bị khóa" });
      await client.query("COMMIT");
      return res.status(403).json({ ok: false, message: "Key đã bị khóa." });
    }

    if (new Date(item.expire).getTime() <= Date.now()) {
      await client.query("UPDATE keys SET status = 'expired' WHERE id = $1", [item.id]);
      await writeLog(client, { keyValue: item.key_value, deviceId, ip, success: false, reason: "Key đã hết hạn" });
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
        await writeLog(client, { keyValue: item.key_value, deviceId, ip, success: false, reason: "Key đã hết slot" });
        await client.query("COMMIT");
        return res.status(403).json({ ok: false, message: `Key đã hết slot: ${effectiveUsed}/${slotLimit}` });
      }

      await client.query(
        "INSERT INTO key_devices (key_id, device_id) VALUES ($1, $2)",
        [item.id, deviceId]
      );
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

    await writeLog(client, { keyValue: item.key_value, deviceId, ip, success: true, reason: "Đăng nhập thành công" });
    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: "Key hợp lệ.",
      key: rowToKey(updated.rows[0])
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  } finally {
    client.release();
  }
});

app.get("/api/admin/keys", requireDatabase, requireAdmin, async (req, res) => {
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

    return res.json({ ok: true, keys: result.rows.map(rowToKey) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

/*
  FIX SLOT RESET:
  - Bản cũ lấy slotUsed mặc định = 0 mỗi lần admin lưu key.
  - Sau đó ghi slot_used = 0 và DELETE key_devices, nên số người đã nhập key bị reset.
  - Bản này KHÔNG nhận slotUsed từ form lưu key nữa.
  - Muốn reset thiết bị phải bấm endpoint reset riêng: DELETE /api/admin/keys/:key/devices
*/
app.post("/api/admin/keys", requireDatabase, requireAdmin, async (req, res) => {
  const input = cleanKey(req.body?.key);
  const type = cleanKey(req.body?.type) || "custom";
  const expire = req.body?.expire || new Date(Date.now() + 7 * 86400000).toISOString();
  const slotLimit = Math.max(1, Number(req.body?.slotLimit || 1));
  const status = cleanKey(req.body?.status) || "active";

  if (!input) {
    return res.status(400).json({ ok: false, message: "Thiếu key." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO keys (key_value, type, expire, slot_used, slot_limit, status)
      VALUES ($1, $2, $3, 0, $4, $5)
      ON CONFLICT (key_value)
      DO UPDATE SET
        type = EXCLUDED.type,
        expire = EXCLUDED.expire,
        slot_limit = EXCLUDED.slot_limit,
        status = EXCLUDED.status,
        slot_used = GREATEST(
          keys.slot_used,
          (
            SELECT COUNT(*)::int
            FROM key_devices
            WHERE key_id = keys.id
          )
        )
      RETURNING *
      `,
      [input, type, expire, slotLimit, status]
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: "Đã lưu key. Slot đã dùng được giữ nguyên.",
      key: rowToKey(result.rows[0])
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  } finally {
    client.release();
  }
});

app.get("/api/admin/keys/:key/devices", requireDatabase, requireAdmin, async (req, res) => {
  try {
    const keyRow = await getKeyRowByValue(pool, req.params.key);

    if (!keyRow) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy key." });
    }

    const result = await pool.query(
      `
      SELECT
        device_id AS id,
        device_id AS name,
        created_at AS "firstUsedAt",
        last_seen AS "lastUsedAt"
      FROM key_devices
      WHERE key_id = $1
      ORDER BY last_seen DESC, created_at DESC
      `,
      [keyRow.id]
    );

    return res.json({ ok: true, devices: result.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

app.delete("/api/admin/keys/:key/devices", requireDatabase, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const keyRow = await getKeyRowByValue(client, req.params.key);

    if (!keyRow) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, message: "Không tìm thấy key." });
    }

    await client.query("DELETE FROM key_devices WHERE key_id = $1", [keyRow.id]);

    const updated = await client.query(
      "UPDATE keys SET slot_used = 0, last_device = NULL, last_used_at = NULL WHERE id = $1 RETURNING *",
      [keyRow.id]
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: "Đã reset toàn bộ thiết bị của key.",
      key: rowToKey(updated.rows[0])
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  } finally {
    client.release();
  }
});

app.delete("/api/admin/keys/:key/devices/:deviceId", requireDatabase, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const keyRow = await getKeyRowByValue(client, req.params.key);

    if (!keyRow) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, message: "Không tìm thấy key." });
    }

    await client.query(
      "DELETE FROM key_devices WHERE key_id = $1 AND device_id = $2",
      [keyRow.id, req.params.deviceId]
    );

    const updated = await syncSlotUsed(client, keyRow.id);

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: "Đã xóa thiết bị khỏi key.",
      key: rowToKey(updated)
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}

    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  } finally {
    client.release();
  }
});

app.delete("/api/admin/keys/:key", requireDatabase, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM keys WHERE LOWER(key_value) = LOWER($1) RETURNING key_value",
      [req.params.key]
    );

    return res.json({
      ok: true,
      message: result.rowCount ? "Đã xóa key." : "Không tìm thấy key."
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

initDb()
  .catch((error) => {
    console.error("❌ Database init failed:", dbErrorMessage(error));
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`✅ AIMLOCK JAME server running on port ${PORT}`);
      console.log(`✅ Admin password: ${ADMIN_PASSWORD}`);
      console.log(`✅ Database URL mode: ${DATABASE_URL ? (isRailwayInternalUrl(DATABASE_URL) ? "internal" : "public/external") : "missing"}`);
    });
  });