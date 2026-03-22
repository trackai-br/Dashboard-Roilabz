import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'missing';
  checks.SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'ok' : 'missing';
  checks.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ok' : 'missing';

  // Check DB connectivity
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    const { error } = await supabase.from('meta_accounts').select('id').limit(1);
    checks.database = error ? `error: ${error.message}` : 'ok';
  } catch (e: any) {
    checks.database = `error: ${e.message}`;
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
}
