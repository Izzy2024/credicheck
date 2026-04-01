const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== DATABASE STATE CHECK ===\n');

    // Check users
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const users = await prisma.user.findMany({ select: { id: true, email: true, isActive: true, createdAt: true } });

    console.log('👥 USERS:');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Active users: ${activeUsers}`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.isActive ? 'ACTIVE' : 'INACTIVE'}) - Created: ${user.createdAt.toISOString().split('T')[0]}`);
    });

    // Check credit references
    const totalReferences = await prisma.creditReference.count();
    const activeReferences = await prisma.creditReference.count({ where: { debtStatus: 'ACTIVE' } });
    const references = await prisma.creditReference.findMany({ select: { id: true, fullName: true, debtStatus: true } });

    console.log('\n📊 CREDIT REFERENCES:');
    console.log(`Total references: ${totalReferences}`);
    console.log(`Active references: ${activeReferences}`);
    references.forEach(ref => {
      console.log(`  - ${ref.fullName} (${ref.debtStatus})`);
    });

    // Check search history
    const totalSearches = await prisma.searchHistory.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const searchesToday = await prisma.searchHistory.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const searchesWithResults = await prisma.searchHistory.count({
      where: { resultsCount: { gt: 0 } },
    });

    const matchRate = totalSearches > 0 ? (searchesWithResults / totalSearches) * 100 : 0;

    const recentSearches = await prisma.searchHistory.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { searchTerm: true, resultsCount: true, createdAt: true }
    });

    console.log('\n🔍 SEARCH HISTORY:');
    console.log(`Total searches: ${totalSearches}`);
    console.log(`Searches today: ${searchesToday}`);
    console.log(`Searches with results: ${searchesWithResults}`);
    console.log(`Match rate: ${matchRate.toFixed(2)}%`);
    console.log('Recent searches:');
    recentSearches.forEach(search => {
      console.log(`  - "${search.searchTerm}" (${search.resultsCount} results) - ${search.createdAt.toISOString()}`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
