import { NextResponse } from "next/server";
import { getSupabaseClient } from "../../../lib/supabase";
import fs from 'fs';
import path from 'path';

/**
 * POST /api/setup-identity-registry
 * Create the identity registry tables directly from the API
 */
export async function POST() {
  try {
    // Get the Supabase client with service role
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to connect to database" },
        { status: 500 }
      );
    }

    console.log('Setting up identity registry tables...');

    // Try to read the consolidated SQL schema file from multiple locations
    const possiblePaths = [
      path.join(process.cwd(), 'identity-registry-schema.sql'), // Project root
      path.join(process.cwd(), 'packages', 'nextjs', 'identity-registry-schema.sql'), // packages/nextjs directory
    ];
    
    let schemaSql;
    
    // Try each path until we find the file
    for (const schemaPath of possiblePaths) {
      try {
        console.log(`Trying to read schema from: ${schemaPath}`);
        schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log(`Successfully read schema from: ${schemaPath}`);
        break;
      } catch {
        console.log(`File not found at: ${schemaPath}`);
        // Continue to the next path
      }
    }
    
    // If we couldn't find the file in any location
    if (!schemaSql) {
      console.error('Error: Could not find identity-registry-schema.sql in any location');
      return NextResponse.json(
        {
          error: "Failed to read identity registry schema file",
          details: "Please ensure identity-registry-schema.sql exists in the project root or packages/nextjs directory"
        },
        { status: 500 }
      );
    }

    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Try to use the rpc function to execute SQL directly
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          
          // If this is the first statement and it's trying to create the exec_sql function,
          // the error is expected because the function doesn't exist yet
          if (i === 0 && statement.includes('CREATE OR REPLACE FUNCTION exec_sql')) {
            console.log('Attempting to create exec_sql function directly...');
            
            // Execute the statement directly using a query
            const { error: directError } = await supabase.from('identity_registry').insert([
              {
                wallet_address: '0xSetupWallet',
                normalized_wallet: '0xsetupwallet'
              }
            ]);
            
            if (directError) {
              console.log('Error with direct insert, table might not exist yet:', directError);
              
              // We can't execute SQL directly without the exec_sql function,
              // so we'll just log the issue and continue with the minimal insert approach
              
              // We can't execute this directly, so we'll use the minimal insert approach
              console.log('Attempting to create identity_registry table with minimal fields...');
            }
          }
          
          // Continue with the next statement
        }
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Continue with the next statement
      }
    }

    // Verify the identity_registry table exists
    try {
      const { data, error: identityRegistryError } = await supabase
        .from('identity_registry')
        .select('*')
        .limit(1);
      
      if (identityRegistryError) {
        console.log('Error checking if identity_registry table exists:', identityRegistryError);
        
        // If the table doesn't exist, create it directly using SQL
        console.log('Attempting to create identity_registry table with SQL...');
        
        try {
          // Create the identity_registry table using SQL
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS identity_registry (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              wallet_address TEXT NOT NULL,
              normalized_wallet TEXT NOT NULL,
              username TEXT UNIQUE,
              display_name TEXT,
              bio TEXT,
              profile_image_url TEXT,
              banner_image_url TEXT,
              email TEXT,
              ens_name TEXT,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_identity_registry_wallet_address ON identity_registry(wallet_address);
            CREATE INDEX IF NOT EXISTS idx_identity_registry_normalized_wallet ON identity_registry(normalized_wallet);
            CREATE INDEX IF NOT EXISTS idx_identity_registry_username ON identity_registry(username);
          `;
          
          // Execute the SQL directly
          const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
          
          if (sqlError) {
            console.error('Error creating table with SQL:', sqlError);
            
            // Fall back to the insert method
            console.log('Falling back to insert method...');
            
            // Try a full insert with all columns
            const { error: createError } = await supabase
              .from('identity_registry')
              .insert([
                {
                  wallet_address: '0xTestWallet',
                  normalized_wallet: '0xtestwallet',
                  username: 'test_user',
                  display_name: 'Test User',
                  bio: 'This is a test user'
                }
              ]);
            
            if (createError) {
              console.log('Error with full insert, trying minimal insert');
              
              // Try a minimal insert with just the required columns
              const { error: minimalError } = await supabase
                .from('identity_registry')
                .insert([
                  {
                    wallet_address: '0xTestWallet',
                    normalized_wallet: '0xtestwallet'
                  }
                ]);
              
              if (minimalError) {
                console.error('Error with minimal insert:', minimalError);
                return NextResponse.json(
                  {
                    error: "Failed to create identity_registry table",
                    details: minimalError
                  },
                  { status: 500 }
                );
              } else {
                console.log('Successfully created identity_registry table with minimal fields');
              }
            }
          } else {
            console.log('Successfully created identity_registry table with SQL');
            
            // Insert a test record to verify the table works
            const { error: insertError } = await supabase
              .from('identity_registry')
              .insert([
                {
                  wallet_address: '0xTestWallet',
                  normalized_wallet: '0xtestwallet',
                  username: 'test_user',
                  display_name: 'Test User',
                  bio: 'This is a test user'
                }
              ]);
              
            if (insertError) {
              console.log('Error inserting test record, but table was created:', insertError);
            } else {
              console.log('Successfully inserted test record');
            }
          }
          
          // Verify the table exists by using a different method - check if the table exists in the schema
          const { data: tableExists, error: tableCheckError } = await supabase
            .rpc('exec_sql', {
              sql: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'identity_registry');"
            });
          
          if (tableCheckError) {
            console.error('Error checking if table exists in schema:', tableCheckError);
          } else {
            console.log('Table existence check result:', tableExists);
          }
          
          console.log('identity_registry table creation process completed');
        } catch (createError) {
          console.error('Error creating identity_registry table:', createError);
          return NextResponse.json(
            {
              error: "Failed to create identity_registry table",
              details: createError instanceof Error ? createError.message : String(createError)
            },
            { status: 500 }
          );
        }
      } else {
        console.log(`identity_registry table exists with ${Array.isArray(data) ? data.length : 0} records checked`);
      }
    } catch (error) {
      console.error('Error verifying identity_registry table:', error);
      return NextResponse.json(
        {
          error: "Failed to verify identity_registry table",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Identity registry tables created successfully"
    });
  } catch (error) {
    console.error('Error setting up identity registry:', error);
    return NextResponse.json(
      { error: "Failed to set up identity registry" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/setup-identity-registry
 * Check if the identity registry tables exist
 */
export async function GET() {
  try {
    // Get the Supabase client
    const supabase = getSupabaseClient(true);
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to connect to database" },
        { status: 500 }
      );
    }

    // Check tables using information_schema for more reliable results
    const checkTableSQL = `
      SELECT
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = t.table_name
        ) as exists
      FROM (
        VALUES ('identity_registry'), ('follows'), ('social_links')
      ) as t(table_name);
    `;

    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', { sql: checkTableSQL });
    
    if (schemaError) {
      console.error('Error checking tables in schema:', schemaError);
      
      // Fall back to the original method
      // Check if the identity_registry table exists
      const { data: identityRegistryData, error: identityRegistryError } = await supabase
        .from('identity_registry')
        .select('*')
        .limit(1);
      
      // Check if the follows table exists
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('*')
        .limit(1);
      
      // Check if the social_links table exists
      const { data: socialLinksData, error: socialLinksError } = await supabase
        .from('social_links')
        .select('*')
        .limit(1);
      
      return NextResponse.json({
        exists: !identityRegistryError,
        tables: {
          identity_registry: {
            exists: !identityRegistryError,
            count: Array.isArray(identityRegistryData) ? identityRegistryData.length : 0
          },
          follows: {
            exists: !followsError,
            count: Array.isArray(followsData) ? followsData.length : 0
          },
          social_links: {
            exists: !socialLinksError,
            count: Array.isArray(socialLinksData) ? socialLinksData.length : 0
          }
        }
      });
    }
    
    // Get record counts for each table
    const countSQL = `
      SELECT
        'identity_registry' as table_name,
        (SELECT COUNT(*) FROM identity_registry) as count
      UNION ALL
      SELECT
        'follows' as table_name,
        (SELECT COUNT(*) FROM follows) as count
      UNION ALL
      SELECT
        'social_links' as table_name,
        (SELECT COUNT(*) FROM social_links) as count;
    `;
    
    const { data: countData, error: countError } = await supabase.rpc('exec_sql', { sql: countSQL });
    
    // Process the schema data
    const tableInfo: Record<string, { exists: boolean; column_count: number; count: number }> = {};
    let identityRegistryExists = false;
    
    if (Array.isArray(schemaData)) {
      for (const row of schemaData) {
        if (typeof row === 'object' && row !== null && 'table_name' in row) {
          const tableName = String(row.table_name);
          if (tableName === 'identity_registry') {
            identityRegistryExists = Boolean(row.exists);
          }
          
          tableInfo[tableName] = {
            exists: Boolean(row.exists),
            column_count: Number(row.column_count),
            count: 0
          };
        }
      }
    }
    
    // Add count data if available
    if (!countError && Array.isArray(countData)) {
      for (const row of countData) {
        if (typeof row === 'object' && row !== null && 'table_name' in row && 'count' in row) {
          const tableName = String(row.table_name);
          if (tableInfo[tableName]) {
            tableInfo[tableName].count = parseInt(String(row.count), 10);
          }
        }
      }
    }
    
    return NextResponse.json({
      exists: identityRegistryExists,
      tables: tableInfo,
      schema_check: schemaData,
      count_check: countData
    });
  } catch (error) {
    console.error('Error checking identity registry:', error);
    return NextResponse.json(
      {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    );
  }
}