
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  { email: 'admin@dropy.store', password: 'password123', role: 'admin' },
  { email: 'seller@dropy.store', password: 'password123', role: 'seller' },
  { email: 'creator@dropy.store', password: 'password123', role: 'creator' },
  { email: 'supplier@dropy.store', password: 'password123', role: 'supplier' }
];

async function setup() {
  console.log('Starting test users setup...');

  for (const user of testUsers) {
    console.log(`Setting up ${user.email}...`);
    
    // Create user in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { role: user.role }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`User ${user.email} already exists in Auth. Updating profile...`);
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === user.email);
        if (existingUser) {
          await updateProfile(existingUser.id, user.email, user.role);
        }
      } else {
        console.error(`Error creating ${user.email}:`, authError.message);
      }
    } else if (authData.user) {
      console.log(`User ${user.email} created successfully.`);
      await updateProfile(authData.user.id, user.email, user.role);
    }
  }

  console.log('Setup complete!');
}

async function updateProfile(id: string, email: string, role: string) {
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id,
      email,
      role,
      status: 'approved',
      full_name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`
    }, { onConflict: 'id' });

  if (profileError) {
    console.error(`Error updating profile for ${email}:`, profileError.message);
  } else {
    console.log(`Profile for ${email} updated.`);
  }
}

setup();
