import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'admin@razmels.com' },
    update: {},
    create: {
      email: 'admin@razmels.com',
      name: 'Admin Razmels',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log('Seeded User:', user)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
