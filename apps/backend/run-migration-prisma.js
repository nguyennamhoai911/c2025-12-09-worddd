const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Running migration...');
    
    await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS "popupWidth" INTEGER DEFAULT 380');
    console.log('✅ Added popupWidth column');
    
    await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS "popupHeight" INTEGER DEFAULT 500');
    console.log('✅ Added popupHeight column');
    
    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
