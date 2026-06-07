import { Router } from 'express';
import { eq, desc } from 'drizzle-orm';
import { matchIdParamSchema } from '../validation/matches.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';
import { commentary } from '../db/schema.js';
import { db } from '../db/db.js';

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
  const parsedParams = matchIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: 'Invalid match id', details: parsedParams.error.issues });
  }

  const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ error: 'Invalid query', details: parsedQuery.error.issues });
  }

  const matchId = parsedParams.data.id;
  const limit = Math.min(parsedQuery.data.limit ?? MAX_LIMIT, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.status(200).json({ data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch commentary', details: JSON.stringify(e) });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const parsedParams = matchIdParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: 'Invalid match id', details: parsedParams.error.issues });
  }

  const parsedBody = createCommentarySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsedBody.error.issues });
  }

  const matchId = parsedParams.data.id;

  try {
    const [entry] = await db
      .insert(commentary)
      .values({ matchId, ...parsedBody.data })
      .returning();

    if(res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(entry.matchId,entry);
    }

    res.status(201).json({ data: entry });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create commentary', details: JSON.stringify(e) });
  }
});
