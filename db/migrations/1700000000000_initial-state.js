import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const up = (pgm) => {
  const schemaPath = path.join(__dirname, '../legacy/schema.sql');
  const seedsPath = path.join(__dirname, '../legacy/seeds.sql');
  
  const schemaSql = fs.readFileSync(schemaPath, { encoding: 'utf8' });
  const seedsSql = fs.readFileSync(seedsPath, { encoding: 'utf8' });

  pgm.sql(schemaSql);
  pgm.sql(seedsSql);
};

export const down = false;