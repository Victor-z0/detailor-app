import { createClient } from '@supabase/supabase-js'

// Corrected URL: Removed the "e" before "hecoijbim"
const supabaseUrl = 'https://peficarxbquhecoijbim.supabase.co'

// Corrected Key: Updated the "ref" inside the token to match
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmljYXJ4YnF1aGVjb2lqYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjc3ODMsImV4cCI6MjA4Nzc0Mzc4M30.4-f0NExprZFLQuJfbZ6DyhCblgRsScDOg5Le1xUGOfw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)