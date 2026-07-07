const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin11";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function requireDatabase(req, res, next) {
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      ok: false,
      message: "Chưa cấu hình DATABASE_URL trên Railway Variables."
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

function rowToKey(row) {
  return {
    key: row.key_value,
    type: row.type,
    expire: row.expire,
    slotUsed: Number(row.slot_used || 0),
    slotLimit: Number(row.slot_limit || 1),
    status: row.status,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    lastDevice: row.last_device || ""
  };
}

async function initDb() {
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
    CREATE TABLE IF NOT EXISTS usage_log (
      id SERIAL PRIMARY KEY,
      key_value TEXT NOT NULL,
      device_id TEXT,
      time TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    INSERT INTO keys (key_value, type, expire, slot_used, slot_limit, status)
    VALUES
      ('JAMETO-OKIUO', '1day', '2026-07-07 01:01:00+07', 400, 400, 'active'),
      ('Admin11', 'custom', '2031-07-04 22:34:00+07', 2, 100, 'active'),
      ('VIP123-JAME', '30day', '2027-07-28 20:51:00+07', 3, 3, 'active'),
      ('JAME-VIP1', '7', '2026-07-12 01:01:00+07', 15, 15, 'active')
    ON CONFLICT (key_value) DO NOTHING;
  `);
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
    res.json({ ok: true, service: "AIMLOCK JAME", postgres: true, time: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.get("/api/stats", requireDatabase, async (req, res) => {
  try {
    const activeKeys = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM keys
      WHERE status = 'active' AND expire > NOW()
    `);

    const today = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM usage_log
      WHERE time::date = NOW()::date
    `);

    res.json({
      ok: true,
      online: Math.max(1, today.rows[0].total || 1),
      activeKeys: activeKeys.rows[0].total || 0,
      today: Math.max(1, today.rows[0].total || 1),
      railway: "Online"
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.post("/api/verify-key", requireDatabase, async (req, res) => {
  const { key, deviceId = "browser" } = req.body || {};
  const input = String(key || "").trim();

  if (!input) {
    return res.status(400).json({ ok: false, message: "Vui lòng nhập key." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM keys WHERE LOWER(key_value) = LOWER($1) FOR UPDATE",
      [input]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, message: "Key không tồn tại." });
    }

    const item = result.rows[0];

    if (item.status !== "active") {
      await client.query("ROLLBACK");
      return res.status(403).json({ ok: false, message: "Key đã bị khóa." });
    }

    if (new Date(item.expire).getTime() <= Date.now()) {
      await client.query("UPDATE keys SET status = 'expired' WHERE id = $1", [item.id]);
      await client.query("COMMIT");
      return res.status(403).json({ ok: false, message: "Key đã hết hạn." });
    }

    const slotUsed = Number(item.slot_used || 0);
    const slotLimit = Number(item.slot_limit || 1);

    if (slotUsed >= slotLimit) {
      await client.query("ROLLBACK");
      return res.status(403).json({ ok: false, message: "Key đã hết slot." });
    }

    const updated = await client.query(
      `UPDATE keys
       SET slot_used = slot_used + 1,
           last_used_at = NOW(),
           last_device = $2
       WHERE id = $1
       RETURNING *`,
      [item.id, deviceId]
    );

    await client.query(
      "INSERT INTO usage_log (key_value, device_id) VALUES ($1, $2)",
      [item.key_value, deviceId]
    );

    await client.query("COMMIT");

    res.json({
      ok: true,
      message: "Key hợp lệ.",
      key: rowToKey(updated.rows[0])
    });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ ok: false, message: error.message });
  } finally {
    client.release();
  }
});

app.get("/api/admin/keys", requireDatabase, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM keys ORDER BY created_at DESC, id DESC");
    res.json({ ok: true, keys: result.rows.map(rowToKey) });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.post("/api/admin/keys", requireDatabase, requireAdmin, async (req, res) => {
  const {
    key,
    type = "custom",
    expire,
    slotUsed = 0,
    slotLimit = 1,
    status = "active"
  } = req.body || {};

  const input = String(key || "").trim();

  if (!input) {
    return res.status(400).json({ ok: false, message: "Thiếu key." });
  }

  const expireValue = expire || new Date(Date.now() + 7 * 86400000).toISOString();

  try {
    const result = await pool.query(
      `INSERT INTO keys (key_value, type, expire, slot_used, slot_limit, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (key_value)
       DO UPDATE SET
         type = EXCLUDED.type,
         expire = EXCLUDED.expire,
         slot_used = EXCLUDED.slot_used,
         slot_limit = EXCLUDED.slot_limit,
         status = EXCLUDED.status
       RETURNING *`,
      [input, type, expireValue, Number(slotUsed || 0), Number(slotLimit || 1), status]
    );

    res.json({
      ok: true,
      message: "Đã lưu key",
      key: rowToKey(result.rows[0])
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

app.delete("/api/admin/keys/:key", requireDatabase, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM keys WHERE LOWER(key_value) = LOWER($1) RETURNING key_value",
      [req.params.key]
    );

    res.json({
      ok: true,
      message: result.rowCount ? "Đã xóa key" : "Không tìm thấy key"
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`AIMLOCK JAME Postgres server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database init failed:", error);
    app.listen(PORT, () => {
      console.log(`AIMLOCK JAME server running without initialized database on port ${PORT}`);
    });
  });
