import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, ".env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("Failed to load .env file at:", envPath, result.error);
} else {
  console.log("Loaded .env from:", envPath);
}
