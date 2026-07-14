/**
 * Supabase Configuration - My Bakery Store
 * Shared between the main site (index.html) and admin panel (admin.html).
 * Loaded AFTER the Supabase CDN script in each HTML file.
 */

const SUPABASE_URL  = 'https://itoixviumhqkqcznsqnw.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2l4dml1bWhxa3Fjem5zcW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NjQ2NTMsImV4cCI6MjA5OTU0MDY1M30.4-Mi0SxGuym-O4E_pGFpqzS1Rnnu7kmc_2H4A6R-2qM';

// The CDN exposes the Supabase library as window.supabase (the library object).
// We replace it with an initialized client so all scripts can just use `supabase.from(...)` etc.
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
