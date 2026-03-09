const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking vehicle_categories...');
    const { data, error } = await supabase.from('vehicle_categories').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Categories found:', data);
    }

    console.log('\nChecking services...');
    const { data: services, error: sError } = await supabase.from('services').select('id, name').limit(5);
    if (sError) console.error('Error fetching services:', sError);
    else console.log('Services sample:', services);
}

check();
