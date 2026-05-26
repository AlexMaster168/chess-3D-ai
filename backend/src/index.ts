import 'dotenv/config';
import { createApp } from './app.js';
import { initDb } from './db/index.js';

const PORT = Number(process.env.PORT ?? 4000);
const DB_PATH = process.env.DB_PATH ?? './data/chess.db';

initDb(DB_PATH);
const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[chess-ai/backend] listening on http://localhost:${PORT}  (db: ${DB_PATH})`);
});
