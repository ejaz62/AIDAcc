import { config } from "dotenv";

// Load local database settings for integration tests (same precedence as Next.js).
config({ path: [".env.test.local", ".env.local", ".env"], quiet: true });
