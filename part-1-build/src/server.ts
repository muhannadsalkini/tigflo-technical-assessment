import './config/env'; // Validate environment variables before anything else
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📚 API docs: http://localhost:${env.PORT}/docs`);
  });
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
