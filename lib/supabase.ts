import { createBrowserClient } from '@supabase/ssr';

// Your verified Supabase credentials
const supabaseUrl = 'https://peficarxbquhecoijbim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmljYXJ4YnF1aGVjb2lqYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjc3ODMsImV4cCI6MjA4Nzc0Mzc4M30.4-f0NExprZFLQuJfbZ6DyhCblgRsScDOg5Le1xUGOfw';

// createBrowserClient is the modern way to handle auth in Next.js App Router
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);