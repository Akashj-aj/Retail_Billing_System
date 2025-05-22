// supabase.js
const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_KEY = window.SUPABASE_KEY;
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


window.supabaseClient = client;
