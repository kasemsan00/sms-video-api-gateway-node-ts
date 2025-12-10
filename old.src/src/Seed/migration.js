import pool from "../Services/db.service.js";
import logger from "../../logger.js";

/**
 * Check if a column exists in a table
 * @param {string} tableName - Name of the table
 * @param {string} columnName - Name of the column
 * @returns {Promise<boolean>} - True if column exists, false otherwise
 */
const columnExists = async (tableName, columnName) => {
  try {
    const query = `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ? 
      AND COLUMN_NAME = ?
    `;
    const result = await pool.query(query, [tableName, columnName]);
    return result.length > 0;
  } catch (error) {
    logger.error(`Error checking if column ${columnName} exists in table ${tableName}:`, error);
    return false;
  }
};

/**
 * Add organization column to case_data table if it doesn't exist
 */
const addOrganizationColumnToCaseData = async () => {
  try {
    const exists = await columnExists("case_data", "organization");

    if (exists) {
      logger.info("organization column already exists in case_data table");
      return true;
    }

    const alterQuery = `ALTER TABLE case_data ADD COLUMN organization VARCHAR(50) DEFAULT NULL`;
    await pool.query(alterQuery);
    logger.info("✅ Successfully added organization column to case_data table");
    return true;
  } catch (error) {
    logger.error("❌ Error adding organization column to case_data table:", error);
    throw error;
  }
};

/**
 * Add recordId column to link_connect table if it doesn't exist
 */
const addRecordIdColumnToLinkConnect = async () => {
  try {
    const exists = await columnExists("link_connect", "recordId");

    if (exists) {
      logger.info("recordId column already exists in link_connect table");
      return true;
    }

    const alterQuery = `ALTER TABLE link_connect ADD COLUMN recordId INT DEFAULT NULL`;
    await pool.query(alterQuery);
    logger.info("✅ Successfully added recordId column to link_connect table");
    return true;
  } catch (error) {
    logger.error("❌ Error adding recordId column to link_connect table:", error);
    throw error;
  }
};

/**
 * Check if a table exists
 * @param {string} tableName - Name of the table
 * @returns {Promise<boolean>} - True if table exists, false otherwise
 */
const tableExists = async (tableName) => {
  try {
    const query = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
    `;
    const result = await pool.query(query, [tableName]);
    return result.length > 0;
  } catch (error) {
    logger.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Create notification table if it doesn't exist
 */
const createNotificationTable = async () => {
  try {
    const exists = await tableExists("notification");

    if (exists) {
      logger.info("notification table already exists");
      return true;
    }

    const createQuery = `
      CREATE TABLE \`notification\` (
        \`notificationId\` INT NOT NULL AUTO_INCREMENT,
        \`userName\` VARCHAR(100) NULL DEFAULT NULL COMMENT 'ผู้แจ้ง' COLLATE 'utf8mb4_unicode_ci',
        \`message\` VARCHAR(500) NULL DEFAULT NULL COMMENT 'ข้อความเพิ่มเติม' COLLATE 'utf8mb4_unicode_ci',
        \`caseId\` INT NULL DEFAULT NULL COMMENT 'หมายเลขเคส',
        \`read\` TINYINT NOT NULL DEFAULT '0' COMMENT 'สถานะการอ่าน: 0 = ยังไม่ได้อ่าน, 1 = อ่านแล้ว',
        \`notificationType\` VARCHAR(50) NULL DEFAULT NULL COMMENT 'ประเภทของการแจ้งเตือน' COLLATE 'utf8mb4_unicode_ci',
        \`relatedUrl\` VARCHAR(500) NULL DEFAULT NULL COMMENT 'URL หรือ Path ที่เกี่ยวข้องกับการแจ้งเตือน (สำหรับคลิกไปหน้ารายละเอียด)' COLLATE 'utf8mb4_unicode_ci',
        \`dtmRead\` DATETIME NULL DEFAULT NULL COMMENT 'วันเวลาที่อ่านการแจ้งเตือน',
        \`dtmCreated\` DATETIME NOT NULL DEFAULT (now()) COMMENT 'วันเวลาที่สร้างการแจ้งเตือน',
        PRIMARY KEY (\`notificationId\`) USING BTREE,
        INDEX \`notification_id\` (\`notificationId\`) USING BTREE
      )
      COLLATE='utf8mb4_unicode_ci'
      ENGINE=InnoDB
      AUTO_INCREMENT=1
    `;

    await pool.query(createQuery);
    logger.info("✅ Successfully created notification table");
    return true;
  } catch (error) {
    logger.error("❌ Error creating notification table:", error);
    throw error;
  }
};

/**
 * Check case_data organization column and add if needed
 */
const checkCaseDataOrganization = async () => {
  try {
    // First, ensure the organization column exists
    await addOrganizationColumnToCaseData();

    // Then check the data
    const query = `SELECT id, caseId, organization FROM case_data LIMIT 5`;
    const result = await pool.query(query);
    logger.info("Sample case_data records with organization:", result);

    // Check if there are any records with organization data
    const orgQuery = `SELECT COUNT(*) as count FROM case_data WHERE organization IS NOT NULL`;
    const orgResult = await pool.query(orgQuery);
    logger.info(`Records with organization data: ${orgResult[0].count}`);

    return result;
  } catch (error) {
    logger.error("Error checking case_data organization:", error);
    throw error;
  }
};

/**
 * Run all migrations
 */
const runMigrations = async () => {
  logger.info("Starting database migrations...");

  try {
    await createNotificationTable();
    await checkCaseDataOrganization();
    await addRecordIdColumnToLinkConnect();
    logger.info("✅ All migrations completed successfully");
  } catch (error) {
    logger.error("❌ Migration failed:", error);
    throw error;
  }
};

export default {
  checkCaseDataOrganization,
  addOrganizationColumnToCaseData,
  addRecordIdColumnToLinkConnect,
  createNotificationTable,
  columnExists,
  tableExists,
  runMigrations,
};
