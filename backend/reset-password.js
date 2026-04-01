const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Buscar usuario por email (puede ser irios@algo.com)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'irios' } },
          { firstName: { contains: 'irios' } },
          { lastName: { contains: 'irios' } }
        ]
      }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado con el término "irios"');
      console.log('\n📋 Usuarios disponibles:');
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
      console.table(allUsers);
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
    console.log(`   Rol: ${user.role}`);

    // Nueva contraseña
    const newPassword = 'Irios2024!';
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    console.log('\n✅ Contraseña restablecida exitosamente!');
    console.log(`\n🔑 Nueva contraseña: ${newPassword}`);
    console.log('\n⚠️  IMPORTANTE: Cambia esta contraseña después de iniciar sesión.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
