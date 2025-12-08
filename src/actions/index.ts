import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { SongProjects, SongSections, and, db, eq } from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function getOwnedProject(projectId: string, userId: string) {
  const [project] = await db
    .select()
    .from(SongProjects)
    .where(and(eq(SongProjects.id, projectId), eq(SongProjects.userId, userId)));

  if (!project) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Song project not found.",
    });
  }

  return project;
}

export const server = {
  createSongProject: defineAction({
    input: z.object({
      title: z.string().min(1),
      artistName: z.string().optional(),
      genre: z.string().optional(),
      mood: z.string().optional(),
      language: z.string().optional(),
      bpm: z.number().optional(),
      keySignature: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [project] = await db
        .insert(SongProjects)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          title: input.title,
          artistName: input.artistName,
          genre: input.genre,
          mood: input.mood,
          language: input.language,
          bpm: input.bpm,
          keySignature: input.keySignature,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        success: true,
        data: { project },
      };
    },
  }),

  updateSongProject: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        title: z.string().min(1).optional(),
        artistName: z.string().optional(),
        genre: z.string().optional(),
        mood: z.string().optional(),
        language: z.string().optional(),
        bpm: z.number().optional(),
        keySignature: z.string().optional(),
        notes: z.string().optional(),
      })
      .refine(
        (input) =>
          input.title !== undefined ||
          input.artistName !== undefined ||
          input.genre !== undefined ||
          input.mood !== undefined ||
          input.language !== undefined ||
          input.bpm !== undefined ||
          input.keySignature !== undefined ||
          input.notes !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedProject(input.id, user.id);

      const [project] = await db
        .update(SongProjects)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.artistName !== undefined ? { artistName: input.artistName } : {}),
          ...(input.genre !== undefined ? { genre: input.genre } : {}),
          ...(input.mood !== undefined ? { mood: input.mood } : {}),
          ...(input.language !== undefined ? { language: input.language } : {}),
          ...(input.bpm !== undefined ? { bpm: input.bpm } : {}),
          ...(input.keySignature !== undefined ? { keySignature: input.keySignature } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(eq(SongProjects.id, input.id))
        .returning();

      return {
        success: true,
        data: { project },
      };
    },
  }),

  listSongProjects: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const projects = await db
        .select()
        .from(SongProjects)
        .where(eq(SongProjects.userId, user.id));

      return {
        success: true,
        data: { items: projects, total: projects.length },
      };
    },
  }),

  createSongSection: defineAction({
    input: z.object({
      songProjectId: z.string().min(1),
      orderIndex: z.number().int().optional(),
      sectionType: z.string().optional(),
      label: z.string().optional(),
      lyrics: z.string().min(1),
      chords: z.string().optional(),
      melodyHints: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedProject(input.songProjectId, user.id);

      const [section] = await db
        .insert(SongSections)
        .values({
          id: crypto.randomUUID(),
          songProjectId: input.songProjectId,
          orderIndex: input.orderIndex ?? 1,
          sectionType: input.sectionType,
          label: input.label,
          lyrics: input.lyrics,
          chords: input.chords,
          melodyHints: input.melodyHints,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return {
        success: true,
        data: { section },
      };
    },
  }),

  updateSongSection: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        songProjectId: z.string().min(1),
        orderIndex: z.number().int().optional(),
        sectionType: z.string().optional(),
        label: z.string().optional(),
        lyrics: z.string().optional(),
        chords: z.string().optional(),
        melodyHints: z.string().optional(),
      })
      .refine(
        (input) =>
          input.orderIndex !== undefined ||
          input.sectionType !== undefined ||
          input.label !== undefined ||
          input.lyrics !== undefined ||
          input.chords !== undefined ||
          input.melodyHints !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedProject(input.songProjectId, user.id);

      const [existing] = await db
        .select()
        .from(SongSections)
        .where(
          and(
            eq(SongSections.id, input.id),
            eq(SongSections.songProjectId, input.songProjectId)
          )
        );

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Song section not found.",
        });
      }

      const [section] = await db
        .update(SongSections)
        .set({
          ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
          ...(input.sectionType !== undefined ? { sectionType: input.sectionType } : {}),
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.lyrics !== undefined ? { lyrics: input.lyrics } : {}),
          ...(input.chords !== undefined ? { chords: input.chords } : {}),
          ...(input.melodyHints !== undefined ? { melodyHints: input.melodyHints } : {}),
          updatedAt: new Date(),
        })
        .where(eq(SongSections.id, input.id))
        .returning();

      return {
        success: true,
        data: { section },
      };
    },
  }),

  deleteSongSection: defineAction({
    input: z.object({
      id: z.string().min(1),
      songProjectId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedProject(input.songProjectId, user.id);

      const result = await db
        .delete(SongSections)
        .where(
          and(
            eq(SongSections.id, input.id),
            eq(SongSections.songProjectId, input.songProjectId)
          )
        );

      if (result.rowsAffected === 0) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Song section not found.",
        });
      }

      return { success: true };
    },
  }),

  listSongSections: defineAction({
    input: z.object({
      songProjectId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedProject(input.songProjectId, user.id);

      const sections = await db
        .select()
        .from(SongSections)
        .where(eq(SongSections.songProjectId, input.songProjectId));

      return {
        success: true,
        data: { items: sections, total: sections.length },
      };
    },
  }),
};
