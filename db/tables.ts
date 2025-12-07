/**
 * Song Lyric Maker - write lyrics with sections (verse, chorus, bridge).
 *
 * Design goals:
 * - Core entity: SongProject.
 * - Each song has multiple ordered sections (with type: verse/chorus/etc.).
 * - Optional "melodyHints" for future expansion and a field for chords/notes.
 */

import { defineTable, column, NOW } from "astro:db";

export const SongProjects = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    title: column.text(),                             // song title / working title
    artistName: column.text({ optional: true }),      // real or pen name
    genre: column.text({ optional: true }),           // "pop", "rock", "lofi"
    mood: column.text({ optional: true }),            // "happy", "sad", "energetic"
    language: column.text({ optional: true }),
    bpm: column.number({ optional: true }),           // beats per minute (optional)
    keySignature: column.text({ optional: true }),    // "C major", "G minor", ...
    notes: column.text({ optional: true }),           // general project notes
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const SongSections = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    songProjectId: column.text({
      references: () => SongProjects.columns.id,
    }),
    orderIndex: column.number(),                      // 1, 2, 3...
    sectionType: column.text({ optional: true }),     // "verse", "chorus", "bridge", etc.
    label: column.text({ optional: true }),           // "Verse 1", "Chorus A"
    lyrics: column.text(),                            // section lyrics
    chords: column.text({ optional: true }),          // chord notation if needed
    melodyHints: column.text({ optional: true }),     // optional description for melody
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const tables = {
  SongProjects,
  SongSections,
} as const;
