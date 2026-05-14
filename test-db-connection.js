#!/usr/bin/env node

/**
 * Database Connection Test Script
 *
 * This script tests PostgreSQL connectivity using the exact environment
 * variables configured in the Kubernetes secret and container environment.
 *
 * Usage: node test-db-connection.js
 */

const { Client } = require('pg');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function maskPassword(password) {
  if (!password) return '(not set)';
  if (password.length <= 4) return '****';
  return password.substring(0, 2) + '****' + password.substring(password.length - 2);
}

async function testConnection() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║        PostgreSQL Connection Test (Worker Service)             ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  // 1. Log environment variables
  log('Step 1: Reading Environment Variables', 'bright');
  log('─────────────────────────────────────────────────────────────────');

  const envVars = {
    host: process.env.DATABASE_POSTGRES_HOST || 'localhost',
    port: process.env.DATABASE_POSTGRES_PORT || '5432',
    database: process.env.DATABASE_POSTGRES_NAME || 'backend_database_postgres',
    user: process.env.DATABASE_POSTGRES_USER,
    password: process.env.DATABASE_POSTGRES_PASSWORD,
  };

  log(`Host:      ${envVars.host}`);
  log(`Port:      ${envVars.port}`);
  log(`Database:  ${envVars.database}`);
  log(`User:      ${envVars.user || '(not set)'} ${!envVars.user ? '❌ MISSING' : '✓'}`);
  log(`Password:  ${maskPassword(envVars.password)} ${!envVars.password ? '❌ MISSING' : '✓'}`);

  // Validation
  if (!envVars.user) {
    log('\n❌ ERROR: DATABASE_POSTGRES_USER not set', 'red');
    process.exit(1);
  }

  if (!envVars.password) {
    log('\n❌ ERROR: DATABASE_POSTGRES_PASSWORD not set', 'red');
    process.exit(1);
  }

  // 2. Attempt connection
  log('\nStep 2: Attempting PostgreSQL Connection', 'bright');
  log('─────────────────────────────────────────────────────────────────');

  const client = new Client({
    host: envVars.host,
    port: parseInt(envVars.port),
    database: envVars.database,
    user: envVars.user,
    password: envVars.password,
    // Ensure connection timeouts after 5 seconds
    connectionTimeoutMillis: 5000,
  });

  try {
    log(`Connecting to ${envVars.user}@${envVars.host}:${envVars.port}/${envVars.database}...`);
    await client.connect();
    log('✓ Connection successful!', 'green');

    // 3. Run test query
    log('\nStep 3: Running Test Query', 'bright');
    log('─────────────────────────────────────────────────────────────────');

    const result = await client.query('SELECT NOW() as current_time, current_user as db_user, current_database() as db_name');

    const row = result.rows[0];
    log(`✓ Query successful!`, 'green');
    log(`  Server time:   ${row.current_time}`);
    log(`  Database user: ${row.db_user}`);
    log(`  Database:      ${row.db_name}`);

    // 4. Test schema access
    log('\nStep 4: Testing Schema Access', 'bright');
    log('─────────────────────────────────────────────────────────────────');

    const schemaResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      LIMIT 5
    `);

    if (schemaResult.rows.length > 0) {
      log(`✓ Can access public schema (${schemaResult.rows.length} tables found)`, 'green');
      schemaResult.rows.forEach((row) => {
        log(`  - ${row.table_name}`);
      });
    } else {
      log(`⚠ Public schema is empty (no tables found)`, 'yellow');
    }

    // 5. Test permissions
    log('\nStep 5: Testing User Permissions', 'bright');
    log('─────────────────────────────────────────────────────────────────');

    const permResult = await client.query(`
      SELECT grantee, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
      AND grantee = $1
      LIMIT 5
    `, [envVars.user]);

    if (permResult.rows.length > 0) {
      log(`✓ User has ${permResult.rows.length} privilege grants`, 'green');
      permResult.rows.forEach((row) => {
        log(`  - ${row.privilege_type}`);
      });
    } else {
      log(`⚠ No explicit table grants found (checking role grants...)`, 'yellow');

      const roleResult = await client.query(`
        SELECT rolname
        FROM pg_roles
        WHERE rolname = $1
      `, [envVars.user]);

      if (roleResult.rows.length > 0) {
        log(`✓ User role exists: ${envVars.user}`, 'green');
      }
    }

    log('\n╔════════════════════════════════════════════════════════════════╗', 'green');
    log('║                    ✓ ALL TESTS PASSED                         ║', 'green');
    log('╚════════════════════════════════════════════════════════════════╝\n', 'green');

    await client.end();
    process.exit(0);

  } catch (error) {
    log('\n❌ Connection Failed!', 'red');
    log(`Error: ${error.message}`, 'red');

    if (error.code === 'ECONNREFUSED') {
      log('\nPossible causes:', 'yellow');
      log('  - PostgreSQL is not running');
      log('  - Wrong host/port configuration');
      log('  - Network connectivity issue');
    } else if (error.code === 'ENOTFOUND') {
      log('\nPossible causes:', 'yellow');
      log('  - Host name not resolvable (DNS issue)');
      log(`  - Check if '${envVars.host}' is a valid hostname`);
    } else if (error.code === '28P01' || error.message.includes('password authentication failed')) {
      log('\nPossible causes:', 'yellow');
      log('  - Incorrect password');
      log(`  - User '${envVars.user}' does not exist`);
      log('  - User credentials do not match');
    } else if (error.code === '3D000') {
      log('\nPossible causes:', 'yellow');
      log(`  - Database '${envVars.database}' does not exist`);
    }

    log(`\nFull error: ${error.code || 'unknown'}`);
    log(`Details: ${JSON.stringify(error, null, 2)}`, 'yellow');

    await client.end();
    process.exit(1);
  }
}

testConnection();
