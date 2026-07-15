import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  // =========================
  // MIDTRANS
  // =========================

  app.post("/api/midtrans/token", async (req, res) => {
    try {
      const { order_id, gross_amount, customer_name } = req.body;

      const rawServerKey = process.env.VITE_MIDTRANS_SERVER_KEY;

if (!rawServerKey) {
  return res.status(500).json({
    success: false,
    error: "MIDTRANS_SERVER_KEY belum diset",
  });
}

const serverKey = rawServerKey
  .replace(/^["']|["']$/g, "")
  .trim();

      const authHeader =
        "Basic " + Buffer.from(serverKey + ":").toString("base64");

      const timestampPart = Date.now().toString(36);
      const randomPart = Math.floor(Math.random() * 1000).toString(36);

      const suffix = `-${timestampPart}-${randomPart}`;

      const maxOriginalLength = 50 - suffix.length;

      const cleanOrderId = order_id
        ? String(order_id).substring(0, maxOriginalLength)
        : "INV";

      const uniqueOrderId = `${cleanOrderId}${suffix}`;

      console.log(
        `[Midtrans] Generate Snap Token : ${uniqueOrderId}`
      );

      const response = await fetch(
        "https://app.sandbox.midtrans.com/snap/v1/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: uniqueOrderId,
              gross_amount: Number(gross_amount),
            },
            customer_details: {
              first_name: customer_name || "Santri",
            },
            credit_card: {
              secure: true,
            },
          }),
        }
      );

      const data = (await response.json()) as any;

      if (response.ok && data.token) {
        res.json({
          success: true,
          token: data.token,
          redirect_url: data.redirect_url,
        });
      } else {
        res.status(400).json({
          success: false,
          error: data.error_messages || data,
        });
      }
    } catch (error: any) {
      console.error("[Midtrans]", error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================
  // DATABASE JSON
  // =========================

  const DB_FILE = path.join(process.cwd(), "database.json");

  function readDb() {
    if (!fs.existsSync(DB_FILE)) {
      return null;
    }

    try {
      return JSON.parse(
        fs.readFileSync(DB_FILE, "utf-8")
      );
    } catch (error) {
      console.error(
        "[Database] Error reading database:",
        error
      );
      return null;
    }
  }

  function writeDb(data: any) {
    try {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error(
        "[Database] Error writing database:",
        error
      );
    }
  }

  // =========================
  // DATABASE API
  // =========================

  app.get("/api/db", (req, res) => {
    const data = readDb();

    if (data) {
      res.json({
        success: true,
        data,
      });
    } else {
      res.json({
        success: false,
        empty: true,
        message: "No database file exists yet",
      });
    }
  });

  app.post("/api/db/save", (req, res) => {
    try {
      const { collection, data } = req.body;

      let currentDb = readDb() || {};

      if (collection) {
        currentDb[collection] = data;
      } else {
        currentDb = req.body;
      }

      writeDb(currentDb);

      res.json({
        success: true,
        message: "Database saved successfully",
      });
    } catch (error: any) {
      console.error(
        "[Database] Error saving database:",
        error
      );

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================
  // HEALTH
  // =========================

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      env: process.env.NODE_ENV || "development",
    });
  });

app.get("/api/routes", (req, res) => {
  const routes: string[] = [];

  (app as any)._router.stack.forEach((r: any) => {
    if (r.route && r.route.path) {
      routes.push(
        `${Object.keys(r.route.methods).join(",").toUpperCase()} ${r.route.path}`
      );
    }
  });

  res.json(routes);
});

  // =========================
  // 404 API
  // =========================

  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      error: "Server API tidak ditemukan",
    });
  });

  // =========================
  // VITE / PRODUCTION
  // =========================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);

    console.log(
      "[Server] Vite middleware mounted for development"
    );
  } else {
    const distPath = path.join(
      process.cwd(),
      "dist"
    );

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(
        path.join(distPath, "index.html")
      );
    });

    console.log(
      "[Server] Static asset serving mounted for production"
    );
  }

  app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Server listening on port ${PORT}`);
});
}

startServer();