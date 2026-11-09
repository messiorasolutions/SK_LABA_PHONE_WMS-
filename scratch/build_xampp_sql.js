const fs = require('fs');

let sql = fs.readFileSync('cpanel_database.sql', 'utf8');

// Replace ANSI quotes with backticks for table and column names
sql = sql.replace(/SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO,ANSI_QUOTES';/g, "SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';");

// Replace "identifiers" with `identifiers`
sql = sql.replace(/"([a-zA-Z0-9_]+)"/g, '`$1`');

// Ensure database creation header at top
const header = `-- ============================================================
-- SK LABA PHONE WMS - XAMPP Local Database (Schema + Full Data)
-- Compatible with XAMPP MySQL / MariaDB and phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS \`sklafjrn_wms\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`sklafjrn_wms\`;

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

`;

// Remove original header lines 1-5 if they exist
sql = sql.replace(/^-- SK LABA PHONE Database Export[\s\S]*?SET FOREIGN_KEY_CHECKS = 0;/m, header);

// Replace Argon2 hashes with bcrypt hash for 'Skadmin@2001' so login works out of the box with bcryptjs
const bcryptHash = '$2b$10$8ef842jf5ezY9n4x0QyYcenLGHkTxelFd6QcvcYCmp23Z47v4sKIC';
sql = sql.replace(/\$argon2id\$v=19\$m=65536,p=1,t=3\$[a-zA-Z0-9+/=,]+\$[a-zA-Z0-9+/=]+/g, bcryptHash);

fs.writeFileSync('xampp_database.sql', sql, 'utf8');
console.log('Successfully created xampp_database.sql! Size in bytes:', sql.length);

