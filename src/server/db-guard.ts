import { Prisma } from "@prisma/client";

const CONNECTIVITY_ERROR_CODES = new Set(["P1001", "P1002", "P1008", "P1017"]);
const MISSING_RESOURCE_ERROR_CODES = new Set(["P2021", "P2022"]);

export function isPrismaKnownError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isDbConnectivityError(error: unknown): boolean {
  if (isPrismaKnownError(error) && CONNECTIVITY_ERROR_CODES.has(error.code)) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("can't reach database server") ||
      message.includes("connection") ||
      message.includes("timed out")
    );
  }
  return false;
}

export function isDbSchemaMissingError(error: unknown): boolean {
  return isPrismaKnownError(error) && MISSING_RESOURCE_ERROR_CODES.has(error.code);
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
