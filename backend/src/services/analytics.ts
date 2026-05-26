import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface OpeningEntry {
  eco: string;
  name: string;
  moves: string; // space-separated SAN moves prefix
}

let _openings: OpeningEntry[] | null = null;

function loadOpenings(): OpeningEntry[] {
  if (_openings) return _openings;
  const path = join(__dirname, '..', 'data', 'openings.json');
  const raw = readFileSync(path, 'utf-8');
  _openings = JSON.parse(raw) as OpeningEntry[];
  // Sort by move-prefix length DESC so longer/more specific matches win.
  _openings.sort((a, b) => b.moves.split(/\s+/).length - a.moves.split(/\s+/).length);
  return _openings;
}

/**
 * Detect an opening from a PGN by matching the longest SAN move-prefix
 * in our small lookup table. Strips PGN headers and move numbers.
 */
export function detectOpening(pgn: string): { eco: string; name: string } | null {
  if (!pgn || pgn.trim() === '') return null;
  const moves = pgnToMoveList(pgn);
  if (moves.length === 0) return null;

  const movesStr = moves.join(' ');
  const table = loadOpenings();
  for (const entry of table) {
    if (entry.moves === '') continue;
    if (movesStr === entry.moves || movesStr.startsWith(entry.moves + ' ')) {
      return { eco: entry.eco, name: entry.name };
    }
  }
  return null;
}

/** Convert a PGN movetext block into a flat array of SAN tokens. */
export function pgnToMoveList(pgn: string): string[] {
  // Drop headers like [Event "..."]
  const noHeaders = pgn.replace(/\[[^\]]*\]/g, '');
  // Drop comments {...}
  const noComments = noHeaders.replace(/\{[^}]*\}/g, '');
  // Drop NAGs ($1 etc.)
  const noNag = noComments.replace(/\$\d+/g, '');
  // Drop move numbers like "1." "12..."
  const noNumbers = noNag.replace(/\d+\.(\.\.)?/g, '');
  // Drop result tokens
  const noResult = noNumbers.replace(/\b(1-0|0-1|1\/2-1\/2|\*)\b/g, '');
  return noResult
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}
