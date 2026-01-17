const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.pycbywljeewrmmstxsug:c1obwbLTbVEbxBxl@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "popupWidth" INTEGER DEFAULT 380');
    console.log('✅ Added popupWidth column');
    
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "popupHeight" INTEGER DEFAULT 500');
    console.log('✅ Added popupHeight column');
    
    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
