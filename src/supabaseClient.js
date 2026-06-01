import { createClient } from '@supabase/supabase-js';

// No environment variables, no broken fallbacks—just clean hardcoded project strings
const supabaseUrl = 'https://djryhdofdwjauzcfkaat.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcnloZG9mZHdqYXV6Y2ZrYWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTI4MzMsImV4cCI6MjA5NTcyODgzM30.PzWl7fo6roxyQxiKfLkuQlyOCBO9_ooX2IRFiooi3ok';

export const supabase = createClient(supabaseUrl, supabaseKey);
