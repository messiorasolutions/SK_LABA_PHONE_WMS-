const fs = require('fs');

let sql = fs.readFileSync('cpanel_database.sql', 'utf8');

// Header
const header = `-- ============================================================
-- SK LABA PHONE WMS - Complete Database (Schema + Full Data)
-- Compatible with XAMPP MySQL / MariaDB and phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS \`sklafjrn_wms\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`sklafjrn_wms\`;

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';

`;

// Replace header
sql = sql.replace(/^-- SK LABA PHONE Database Export[\s\S]*?SET FOREIGN_KEY_CHECKS = 0;\r?\n/m, header);

// 1. In DROP TABLE IF EXISTS "tableName" -> `tableName`
sql = sql.replace(/DROP TABLE IF EXISTS "([a-zA-Z0-9_]+)"/g, 'DROP TABLE IF EXISTS `$1`');
sql = sql.replace(/DROP TABLE IF EXISTS `([a-zA-Z0-9_]+)`/g, 'DROP TABLE IF EXISTS `$1`');

// 2. In CREATE TABLE "tableName" ( ... ); -> replace "identifiers" inside CREATE TABLE with `identifiers`
sql = sql.replace(/CREATE TABLE ["`]([a-zA-Z0-9_]+)["`]\s*\([\s\S]*?\);/g, (match) => {
    return match.replace(/"([a-zA-Z0-9_]+)"/g, '`$1`');
});

// 3. In INSERT INTO "tableName" ("col1", "col2", ...) VALUES
// Replace ONLY table and column names before VALUES
sql = sql.replace(/INSERT INTO ["`]([a-zA-Z0-9_]+)["`]\s*\(([\s\S]*?)\)\s*VALUES/g, (match, tbl, cols) => {
    const cleanCols = cols.replace(/"([a-zA-Z0-9_]+)"/g, '`$1`');
    return 'INSERT INTO `' + tbl + '` (' + cleanCols + ') VALUES';
});

// 4. Update Argon2 password hashes to bcrypt hash for 'Skadmin@2001'
const bcryptHash = '$2b$10$8ef842jf5ezY9n4x0QyYcenLGHkTxelFd6QcvcYCmp23Z47v4sKIC';
sql = sql.replace(/\$argon2id\$v=19\$m=65536,p=1,t=3\$[a-zA-Z0-9+/=,]+\$[a-zA-Z0-9+/=]+/g, bcryptHash);

fs.writeFileSync('database.sql', sql, 'utf8');
fs.writeFileSync('xampp_database.sql', sql, 'utf8');
console.log('Fixed database.sql and xampp_database.sql successfully! Length:', sql.length);

