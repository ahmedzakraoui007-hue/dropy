import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const testUsers = [
  { email: 'admin.test@dropy.store', password: 'password123', role: 'admin' },
  { email: 'seller.test@dropy.store', password: 'password123', role: 'seller' },
  { email: 'creator.test@dropy.store', password: 'password123', role: 'creator' },
  { email: 'supplier.test@dropy.store', password: 'password123', role: 'supplier' }
];
async function run() {
  for (const user of testUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role }
    });
    if (error) console.error('Error for', user.email, ':', error.message);
    else {
      console.log('Created:', data.user?.email);
      await supabase.from('profiles').upsert({
        id: data.user!.id,
        email: user.email,
        role: user.role,
        status: 'approved',
        full_name: 'Test ' + user.role
      });
    }
  }
}
run();
