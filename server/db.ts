import {readFileSync} from 'fs';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const seedData = JSON.parse(readFileSync(join(__dirname, 'seed.json'), 'utf-8'));

export class Collection<T extends Record<string, unknown>> {
  private data: T[];

  constructor(collectionName: string) {
    this.data = (seedData[collectionName] as T[]) || [];
  }

  getAll(filter?: Partial<Record<string, unknown>>): T[] {
    if (!filter) return [...this.data];
    return this.data.filter((item) =>
      Object.entries(filter).every(([key, value]) => item[key] === value),
    );
  }

  getOne(filter?: Partial<Record<string, unknown>>): T | undefined {
    if (!filter) return this.data[0];
    return this.data.find((item) =>
      Object.entries(filter).every(([key, value]) => item[key] === value),
    );
  }

  count(filter?: Partial<Record<string, unknown>>): number {
    return this.getAll(filter).length;
  }
}
