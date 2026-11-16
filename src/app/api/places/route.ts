import { searchPlaces } from '@/server/places';
import { allow, tooMany } from '@/server/ratelimit';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (!allow(req, 'places', 900)) return tooMany();
  const q = new URL(req.url).searchParams.get('q') || '';
  return Response.json({ results: searchPlaces(q.slice(0, 80)) });
}
