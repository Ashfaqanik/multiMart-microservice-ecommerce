import { PrismaClient } from "@prisma/client";

declare global {
  namespace globalThis {
    var prismadb: PrismaClient | undefined;
  }
}

const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production") {
  if (!globalThis.prismadb) {
    globalThis.prismadb = prisma;
  }
}
export default prisma;
