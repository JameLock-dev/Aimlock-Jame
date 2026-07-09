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

const DEFAULT_APP_SETTINGS = {
  freeKeyUrl: "https://link4m.net/GhYJFCll",
  zaloUrl: "https://zalo.me/0333635135",
  boostLinkUrl: "https://boostylink.com/Kt8rStah",
  currentVersion: "1",
  latestVersion: "1",
  minVersion: "1",
  forceUpdate: "false",
  maintenance: "false",
  forceTitle: "CẦN CẬP NHẬT APP V1",
  forceMessage: "Phiên bản bạn đang dùng đã cũ. Vui lòng tải bản mới để tiếp tục.",
  maintenanceTitle: "APP ĐANG NÂNG CẤP",
  maintenanceMessage: "20h00 SẼ CẬP NHẬT XONG ANH EM NHÉ<br>Vui lòng quay lại sau.",
  updateVersion: "V1",
  updateTitle: "AIMLOCK JAME",
  updateLabel: "BẢN CẬP NHẬT",
  updateHeadline: "Phiên bản 1 chính thức",
  updateSummary: "Cập nhật giao diện, module, HUD và hệ thống thông báo tự động.",
  updateTimeLabel: "Vừa cập nhật",
  updateItemsJson: JSON.stringify([
    { badge: "NEW", title: "AIMLOCK JAME", description: "Admin có thể chỉnh nội dung cập nhật trực tiếp trong bảng Settings." },
    { badge: "01", title: "Thông báo tự động", description: "App tự nhận phiên bản mới từ server và bật thông báo khi có update." }
  ])
};

function normalizeBool(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

function safeParseItems(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function settingsToPublic(settings) {
  const merged = { ...DEFAULT_APP_SETTINGS, ...(settings || {}) };
  return {
    settings: {
      freeKeyUrl: merged.freeKeyUrl,
      zaloUrl: merged.zaloUrl,
      boostLinkUrl: merged.boostLinkUrl,
      currentVersion: merged.currentVersion,
      latestVersion: merged.latestVersion,
      minVersion: merged.minVersion,
      forceUpdate: normalizeBool(merged.forceUpdate),
      maintenance: normalizeBool(merged.maintenance),
      forceTitle: merged.forceTitle,
      forceMessage: merged.forceMessage,
      maintenanceTitle: merged.maintenanceTitle,
      maintenanceMessage: merged.maintenanceMessage
    },
    update: {
      version: merged.updateVersion || merged.latestVersion || "V1",
      title: merged.updateTitle || "AIMLOCK JAME",
      label: merged.updateLabel || "BẢN CẬP NHẬT",
      headline: merged.updateHeadline || "Cập nhật mới",
      summary: merged.updateSummary || "Đã có cập nhật mới cho hệ thống.",
      time_label: merged.updateTimeLabel || "Vừa cập nhật",
      date: new Date().toISOString().slice(0, 10),
      items: safeParseItems(merged.updateItemsJson)
    }
  };
}

async function getAppSettings() {
  if (!pool) return { ...DEFAULT_APP_SETTINGS };
  const result = await pool.query("SELECT key, value FROM app_settings");
  const settings = { ...DEFAULT_APP_SETTINGS };
  for (const row of result.rows) settings[row.key] = row.value;
  return settings;
}

async function saveAppSettings(settings) {
  const allowed = Object.keys(DEFAULT_APP_SETTINGS);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const key of allowed) {
      if (!Object.prototype.hasOwnProperty.call(settings, key)) continue;
      const value = key === "updateItemsJson"
        ? JSON.stringify(safeParseItems(settings[key]))
        : String(settings[key] ?? "");
      await client.query(
        `INSERT INTO app_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  for (const [key, value] of Object.entries(DEFAULT_APP_SETTINGS)) {
    await pool.query(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO NOTHING`,
      [key, String(value)]
    );
  }

  // Key mẫu luôn còn hạn 365 ngày. Có thể đổi bằng DEFAULT_KEY trên Railway.
  await pool.query(
    `
    INSERT INTO keys (key_value, type, expire, slot_used, slot_limit, status)
    VALUES ($1, 'free', NOW() + INTERVAL '365 days', 0, 100, 'active')
    ON CONFLICT (key_value) DO NOTHING;
    `,
    [process.env.DEFAULT_KEY || "JAME-FREE-KEY"]
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

app.get("/api/app-settings", requireDatabase, async (req, res) => {
  try {
    const settings = await getAppSettings();
    return res.json({ ok: true, ...settingsToPublic(settings) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

app.get("/api/admin/settings", requireDatabase, requireAdmin, async (req, res) => {
  try {
    const settings = await getAppSettings();
    return res.json({ ok: true, raw: settings, ...settingsToPublic(settings) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

app.post("/api/admin/settings", requireDatabase, requireAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    await saveAppSettings(payload);
    const settings = await getAppSettings();
    return res.json({ ok: true, message: "Đã lưu settings.", raw: settings, ...settingsToPublic(settings) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

app.get("/updates.json", async (req, res) => {
  try {
    if (!pool || !DATABASE_URL) {
      return res.sendFile(path.join(__dirname, "updates.json"));
    }
    const settings = await getAppSettings();
    return res.json(settingsToPublic(settings).update);
  } catch (_) {
    return res.sendFile(path.join(__dirname, "updates.json"));
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

app.post("/api/admin/keys", requireDatabase, requireAdmin, async (req, res) => {
  const input = cleanKey(req.body?.key);
  const type = cleanKey(req.body?.type) || "custom";
  const expire = req.body?.expire || new Date(Date.now() + 7 * 86400000).toISOString();
  const slotUsed = Math.max(0, Number(req.body?.slotUsed || 0));
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

    // Khi admin nhập slotUsed = 0, reset danh sách thiết bị của key này.
    if (slotUsed === 0) {
      await client.query("DELETE FROM key_devices WHERE key_id = $1", [result.rows[0].id]);
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: "Đã lưu key.",
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
    const keyResult = await pool.query(
      "SELECT id, key_value FROM keys WHERE LOWER(key_value) = LOWER($1) LIMIT 1",
      [req.params.key]
    );

    if (!keyResult.rows.length) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy key." });
    }

    const result = await pool.query(
      `
      SELECT device_id, created_at, last_seen
      FROM key_devices
      WHERE key_id = $1
      ORDER BY last_seen DESC, created_at DESC
      `,
      [keyResult.rows[0].id]
    );

    return res.json({
      ok: true,
      message: "Đã tải danh sách thiết bị.",
      key: keyResult.rows[0].key_value,
      devices: result.rows.map((row) => ({
        deviceId: row.device_id,
        deviceName: row.device_id?.startsWith("browser-") ? "Browser Device" : "Unknown Device",
        firstSeen: row.created_at,
        lastSeen: row.last_seen
      }))
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

app.delete("/api/admin/keys/:key/devices/:deviceId", requireDatabase, requireAdmin, async (req, res) => {
  try {
    const keyResult = await pool.query(
      "SELECT id, key_value FROM keys WHERE LOWER(key_value) = LOWER($1) LIMIT 1",
      [req.params.key]
    );

    if (!keyResult.rows.length) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy key." });
    }

    await pool.query(
      "DELETE FROM key_devices WHERE key_id = $1 AND device_id = $2",
      [keyResult.rows[0].id, req.params.deviceId]
    );

    const count = await pool.query(
      "SELECT COUNT(*)::int AS total FROM key_devices WHERE key_id = $1",
      [keyResult.rows[0].id]
    );

    await pool.query(
      "UPDATE keys SET slot_used = $2 WHERE id = $1",
      [keyResult.rows[0].id, Number(count.rows[0]?.total || 0)]
    );

    return res.json({ ok: true, message: "Đã gỡ thiết bị khỏi key." });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
  }
});

app.post("/api/admin/keys/:key/reset-devices", requireDatabase, requireAdmin, async (req, res) => {
  try {
    const keyResult = await pool.query(
      "SELECT id, key_value FROM keys WHERE LOWER(key_value) = LOWER($1) LIMIT 1",
      [req.params.key]
    );

    if (!keyResult.rows.length) {
      return res.status(404).json({ ok: false, message: "Không tìm thấy key." });
    }

    await pool.query("DELETE FROM key_devices WHERE key_id = $1", [keyResult.rows[0].id]);
    await pool.query("UPDATE keys SET slot_used = 0 WHERE id = $1", [keyResult.rows[0].id]);

    return res.json({ ok: true, message: "Đã reset toàn bộ máy của key." });
  } catch (error) {
    return res.status(500).json({ ok: false, message: dbErrorMessage(error) });
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
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`✅ AIMLOCK JAME server running on port ${PORT}`);
      console.log(`✅ Admin password: ${ADMIN_PASSWORD}`);
      console.log(`✅ Database URL mode: ${DATABASE_URL ? (isRailwayInternalUrl(DATABASE_URL) ? "internal" : "public/external") : "missing"}`);
    });
  });
