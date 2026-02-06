import 'dotenv/config'
import prisma from '../src/lib/prisma'

async function testDatabase() {
  console.log('Testing Prisma Postgres connection...\n')

  try {
    // Basic query as a connectivity check (non-destructive)
    await prisma.$queryRaw`SELECT 1`
    console.log('Connected to database!')

    console.log('\nAll tests passed.\n')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()

