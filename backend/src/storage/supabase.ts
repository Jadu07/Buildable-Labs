import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Initialize the Supabase client with the service role key for admin privileges in backend
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
