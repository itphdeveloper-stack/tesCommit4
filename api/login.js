// api/login.js
const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = "";
  try {
    body =
      req.body && Object.keys(req.body).length
        ? req.body
        : await new Promise((resolve, reject) => {
            let data = "";
            req.on("data", (chunk) => (data += chunk));
            req.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                resolve({});
              }
            });
            req.on("error", reject);
          });
  } catch (err) {
    console.error("body parse", err);
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const username = (body.username || "").toString().trim();
  const password = (body.password || "").toString();

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  try {
    // Resolve the CSV path relative to project root
    const csvPath = path.resolve(__dirname, "..", "users.csv");
    const raw = fs.readFileSync(csvPath, "utf8");
    // Simple CSV parsing: each line "username,password"
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const parts = line.split(",");
      if (parts.length < 2) continue;
      const u = parts[0].trim();
      const p = parts.slice(1).join(",").trim(); // allow commas in password if any
      if (u === username && p === password) {
        // Authentication success
        // In production, return a signed token (JWT) instead.
        res.status(200).json({ success: true, username: u });
        return;
      }
    }

    res
      .status(401)
      .json({ success: false, error: "Invalid username or password" });
  } catch (err) {
    console.error("login error", err);
    res.status(500).json({ error: "Server error" });
  }
};
