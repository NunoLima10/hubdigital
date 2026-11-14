import * as schema from './schemas';
import { pgGenerate } from 'drizzle-dbml-generator';

const out = './src/db/schema.dbml';
const relational = true;

pgGenerate({ schema, out, relational });
