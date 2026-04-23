import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_KEY not set');
  process.exit(1);
}

async function executeSql(): Promise<void> {
  try {
    console.log('📖 Reading SQL file...');
    const sqlPath = path.join(__dirname, '../docs/supabase-init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Remove comments and split by semicolon
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements\n`);

    // Execute each statement via Supabase REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 50).replace(/\n/g, ' ');
      console.log(`[${i + 1}/${statements.length}] ${preview}...`);

      try {
        const response = await fetch(`${supabaseUrl}/sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: statement }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error(`  ❌ Error: ${text.substring(0, 80)}`);
        } else {
          console.log(`  ✅ OK`);
        }
      } catch (err) {
        console.error(`  ❌ Network error:`, err instanceof Error ? err.message : String(err));
      }
    }

    console.log('\n✅ SQL execution completed!');
  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

executeSql();
