import "server-only";
import { MongoClient, type Db } from "mongodb";

/**
 * Cached MongoDB connection. In dev, Next.js hot-reloads modules but keeps the
 * Node process alive, so we stash the client promise on `globalThis` — otherwise
 * every HMR reload would open a fresh connection and exhaust the (small, free-tier)
 * Atlas connection pool. In production each serverless instance gets its own
 * cached promise, which is exactly the recommended pattern for Mongo + serverless.
 */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "nagorik_obhijog";

declare global {
  var __ngcMongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example) and restart the dev server.",
    );
  }
  if (!global.__ngcMongoClientPromise) {
    global.__ngcMongoClientPromise = new MongoClient(uri, {
      maxPoolSize: 10,
    }).connect();
  }
  return global.__ngcMongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}
