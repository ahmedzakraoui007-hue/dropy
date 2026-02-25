import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});
async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test-admin-orchids@gmail.com',
    password: 'password123',
    email_confirm: true
  });
  if (error) console.error(error);
  else console.log('Created:', data.user?.email);
}
run();
