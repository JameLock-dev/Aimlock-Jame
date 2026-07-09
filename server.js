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
