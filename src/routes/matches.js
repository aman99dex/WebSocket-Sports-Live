import {Router} from 'express';
import {createMatchSchema, listMatchesQuerySchema, matchIdParamSchema, updateScoreSchema} from "../validation/matches.js";
import {matches} from "../db/schema.js";
import {db} from "../db/db.js";
import {getMatchStatus} from "../utils/match-status.js";
import {desc, eq} from "drizzle-orm";

const MAX_LIMIT = 100;

export const matchRouter = Router();

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse( req.query);
    if(!parsed.success){
        return res.status(400).json({error: 'Invalid query', details: parsed.error.issues});
    }
    const limit =Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

    try {
         const data = await db
             .select()
             .from(matches)
             .orderBy((desc(matches.createdAt)))
             .limit(limit)
         res.json({data });
    }catch (e) {
         res.status(500).json({error : 'Failed to list matches'});
    }
})

matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json({error: 'Invalid payload', details: parsed.error.issues});
    }
    const { startTime, endTime, homeScore, awayScore } = parsed.data;
    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime : new Date(startTime),
            endTime : new Date(endTime),
            homeScore : homeScore?? 0,
            awayScore : awayScore?? 0,
            status: getMatchStatus(startTime, endTime),
        }).returning();
        if (req.app.locals.broadcastMatchCreated) {
             try {
                 req.app.locals.broadcastMatchCreated(event);
             } catch (broadcastError) {
                 console.error('Failed to broadcast match_created event', broadcastError);
             }
        }
        res.status(201).json({data: event});
    } catch (e) {
        return res.status(500).json({error: 'Failed to create match', details: JSON.stringify(e)});
    }

})

matchRouter.patch('/:id/score', async (req, res) => {
    const parsedParams = matchIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
        return res.status(400).json({ error: 'Invalid match id', details: parsedParams.error.issues });
    }

    const parsedBody = updateScoreSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsedBody.error.issues });
    }

    try {
        const [updated] = await db
            .update(matches)
            .set(parsedBody.data)
            .where(eq(matches.id, parsedParams.data.id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Match not found' });
        }

        res.status(200).json({ data: updated });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update score', details: JSON.stringify(e) });
    }
})