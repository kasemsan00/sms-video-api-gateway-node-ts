import logger from "../../logger.js";
import pool from "../Services/db.service.js";
import mysql from "mysql2";

/**
 * Create database if it doesn't exist
 * @param {string} databaseName - Name of the database to create
 * @returns {Promise<boolean>} - True if database was created or already exists
 */
const createDatabase = async (databaseName = "conference") => {
  let connection;
  try {
    // Create connection without specifying database
    const connectionConfig = {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      port: process.env.MYSQL_PORT,
      charset: "utf8mb4",
    };

    connection = mysql.createConnection(connectionConfig);

    // Promisify the connection query method
    const query = (sql, params) => {
      return new Promise((resolve, reject) => {
        connection.query(sql, params, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    };

    // Check if database exists
    const checkDbQuery = "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?";
    const dbExists = await query(checkDbQuery, [databaseName]);

    if (dbExists.length > 0) {
      logger.info(`Database '${databaseName}' already exists`);
      return true;
    }

    // Create database with utf8mb4_unicode_ci collation
    const createDbQuery = `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` 
                          CHARACTER SET utf8mb4 
                          COLLATE utf8mb4_unicode_ci`;

    await query(createDbQuery);
    logger.info(`Successfully created database '${databaseName}' with utf8mb4_unicode_ci collation`);

    return true;
  } catch (error) {
    logger.error(`Error creating database '${databaseName}':`, error);
    throw error;
  } finally {
    if (connection) {
      connection.end();
    }
  }
};

/**
 * Check if a table exists in the database
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} - True if table exists, false otherwise
 */
const tableExists = async (tableName) => {
  try {
    const query = "SHOW TABLES LIKE ?";
    const result = await pool.query(query, [tableName]);
    return result.length > 0;
  } catch (error) {
    logger.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Check if a table has any records
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} - True if table has records, false otherwise
 */
const tableHasRecords = async (tableName) => {
  try {
    const query = `SELECT COUNT(*) as count FROM ${tableName}`;
    const result = await pool.query(query);
    return result[0].count > 0;
  } catch (error) {
    logger.error(`Error checking records in table ${tableName}:`, error);
    return false;
  }
};

/**
 * Seed color_scheme table with default colors
 */
const seedColorScheme = async () => {
  try {
    if (!(await tableExists("color_scheme"))) {
      logger.warn("color_scheme table does not exist, skipping seed");
      return;
    }

    if (await tableHasRecords("color_scheme")) {
      logger.info("color_scheme table already has records, skipping seed");
      return;
    }

    const colors = [
      "#3B3486",
      "#7743DB",
      "#6D9886",
      "#393E46",
      "#DC5F00",
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
      "#F8C471",
      "#82E0AA",
      "#F1948A",
      "#85C1E9",
      "#D7BDE2",
      "#AED6F1",
      "#A9DFBF",
      "#F9E79F",
      "#FADBD8",
      "#D5DBDB",
      "#2C3E50",
      "#E74C3C",
      "#3498DB",
      "#2ECC71",
      "#F39C12",
      "#9B59B6",
      "#1ABC9C",
      "#34495E",
      "#E67E22",
      "#95A5A6",
      "#FF5733",
      "#33FF57",
      "#3357FF",
      "#FF33F5",
      "#F5FF33",
      "#8E44AD",
      "#27AE60",
      "#2980B9",
      "#E74C3C",
      "#F39C12",
      "#16A085",
      "#2C3E50",
      "#C0392B",
      "#8E44AD",
      "#2980B9",
    ];

    const insertQuery = "INSERT INTO color_scheme (color_hex) VALUES ?";
    const values = colors.map((color) => [color]);

    await pool.query(insertQuery, [values]);
    logger.info(`Successfully seeded color_scheme table with ${colors.length} colors`);
  } catch (error) {
    logger.error("Error seeding color_scheme table:", error);
  }
};

/**
 * Seed services table with default service
 */
const seedServices = async () => {
  try {
    if (!(await tableExists("services"))) {
      logger.warn("services table does not exist, skipping seed");
      return;
    }

    if (await tableHasRecords("services")) {
      logger.info("services table already has records, skipping seed");
      return;
    }

    const defaultService = {
      id: 999,
      name: "Default",
      webTitle: "",
      prefixHLSVideoSMS: null,
      prefixTextVideoSMS: "สนทนาวิดีโอ",
      prefixTextLocationSMS: "เรียกพิกัดปัจจุบัน",
      domainsVideo: "https://localhost:3000",
      domainsLocation: "https://localhost:3000",
      smsSenderName: "iDEMS",
      logo: "service1.png",
      titleColor: "#094060",
      latitude: null,
      longitude: null,
    };

    const insertQuery = `
      INSERT INTO services (
        id, name, webTitle, prefixHLSVideoSMS, prefixTextVideoSMS, 
        prefixTextLocationSMS, domainsVideo, domainsLocation, 
        smsSenderName, logo, titleColor, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      defaultService.id,
      defaultService.name,
      defaultService.webTitle,
      defaultService.prefixHLSVideoSMS,
      defaultService.prefixTextVideoSMS,
      defaultService.prefixTextLocationSMS,
      defaultService.domainsVideo,
      defaultService.domainsLocation,
      defaultService.smsSenderName,
      defaultService.logo,
      defaultService.titleColor,
      defaultService.latitude,
      defaultService.longitude,
    ];

    await pool.query(insertQuery, values);
    logger.info("Successfully seeded services table with default service");
  } catch (error) {
    logger.error("Error seeding services table:", error);
  }
};

/**
 * Seed radio_devices table with default devices if empty
 */
const seedRadioDevices = async () => {
  try {
    if (!(await tableExists("radio_devices"))) {
      logger.warn("radio_devices table does not exist, skipping seed");
      return;
    }

    if (await tableHasRecords("radio_devices")) {
      logger.info("radio_devices table already has records, skipping seed");
      return;
    }

    // Check table structure first
    const describeQuery = "DESCRIBE radio_devices";
    const structure = await pool.query(describeQuery);
    logger.info(
      "radio_devices table structure:",
      structure.map((col) => col.Field),
    );

    // Add default radio devices if table is empty
    logger.info("radio_devices table is empty but structure exists, ready for manual data entry");
  } catch (error) {
    logger.error("Error checking radio_devices table:", error);
  }
};

/**
 * Seed radio_locations table with default locations if empty
 */
const seedRadioLocations = async () => {
  try {
    if (!(await tableExists("radio_locations"))) {
      logger.warn("radio_locations table does not exist, skipping seed");
      return;
    }

    if (await tableHasRecords("radio_locations")) {
      logger.info("radio_locations table already has records, skipping seed");
      return;
    }

    // Check table structure first
    const describeQuery = "DESCRIBE radio_locations";
    const structure = await pool.query(describeQuery);
    logger.info(
      "radio_locations table structure:",
      structure.map((col) => col.Field),
    );

    // Add default radio locations if table is empty
    logger.info("radio_locations table is empty but structure exists, ready for manual data entry");
  } catch (error) {
    logger.error("Error checking radio_locations table:", error);
  }
};

/**
 * Create car_track table
 */
const createCarTrackTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS car_track (
      id int NOT NULL AUTO_INCREMENT,
      uid varchar(10) DEFAULT NULL,
      status varchar(50) DEFAULT 'open',
      mobile varchar(20) DEFAULT NULL,
      userName varchar(100) DEFAULT NULL,
      room varchar(50) DEFAULT NULL,
      latitude decimal(12,9) DEFAULT NULL,
      longitude decimal(12,9) DEFAULT NULL,
      accuracy decimal(20,6) DEFAULT NULL,
      speed int DEFAULT NULL,
      heading int DEFAULT NULL,
      altitude float DEFAULT NULL,
      altitudeAccuracy float DEFAULT NULL,
      dtmUpdated datetime DEFAULT (now()),
      dtmCreated datetime DEFAULT (now()),
      dtmStarted datetime DEFAULT NULL,
      dtmArrived datetime DEFAULT NULL,
      dtmCanceled datetime DEFAULT NULL,
      dtmCompleted datetime DEFAULT NULL,
      PRIMARY KEY (id),
      KEY room (room)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created car_track table");
};

/**
 * Create case_data table
 */
const createCaseDataTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS case_data (
      id int unsigned NOT NULL AUTO_INCREMENT,
      caseId int NOT NULL,
      service int DEFAULT NULL,
      roomId int DEFAULT NULL,
      operationNumber varchar(100) DEFAULT NULL,
      status varchar(50) DEFAULT NULL,
      hn varchar(50) DEFAULT NULL,
      patientMobile varchar(20) DEFAULT NULL,
      mobileCreated varchar(50) DEFAULT NULL,
      caseType varchar(50) DEFAULT NULL,
      userName varchar(100) DEFAULT NULL,
      dtmCreated datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created case_data table");
};

/**
 * Create chat_message table
 */
const createChatMessageTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS chat_message (
      id int NOT NULL AUTO_INCREMENT,
      room tinytext,
      identity varchar(100) DEFAULT NULL,
      chat_identity varchar(100) DEFAULT NULL,
      userName tinytext,
      text text,
      color varchar(100) DEFAULT NULL,
      files text,
      replyToMessageId int DEFAULT NULL,
      replyToUserName tinytext,
      replyToText tinytext,
      dtmCreated datetime DEFAULT NULL,
      userType varchar(50) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created chat_message table");
};

/**
 * Create color_scheme table
 */
const createColorSchemeTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS color_scheme (
      id int unsigned NOT NULL AUTO_INCREMENT,
      color_hex varchar(50) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created color_scheme table");
};

/**
 * Create data_log table
 */
const createDataLogTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS data_log (
      id int NOT NULL AUTO_INCREMENT,
      room varchar(50) DEFAULT NULL,
      identity varchar(100) DEFAULT NULL,
      userName varchar(100) DEFAULT NULL,
      userType varchar(50) DEFAULT NULL,
      action varchar(100) DEFAULT NULL,
      data text,
      dtmCreated datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created data_log table");
};

/**
 * Create files table
 */
const createFilesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS files (
      id int NOT NULL AUTO_INCREMENT,
      fileName varchar(255) DEFAULT NULL,
      originalName varchar(255) DEFAULT NULL,
      mimeType varchar(100) DEFAULT NULL,
      size int DEFAULT NULL,
      path varchar(500) DEFAULT NULL,
      room varchar(50) DEFAULT NULL,
      identity varchar(100) DEFAULT NULL,
      userName varchar(100) DEFAULT NULL,
      dtmCreated datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created files table");
};

/**
 * Create link_connect table
 */
const createLinkConnectTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS link_connect (
      id int unsigned NOT NULL AUTO_INCREMENT,
      recordId int DEFAULT NULL,
      mobile varchar(20) NOT NULL DEFAULT '',
      linkID text,
      domainIndex int DEFAULT '0',
      share int DEFAULT '0',
      enabled int DEFAULT '1',
      userName varchar(100) DEFAULT NULL,
      room varchar(50) DEFAULT NULL,
      userType varchar(10) DEFAULT NULL,
      linkType varchar(100) DEFAULT NULL,
      crmSender varchar(100) DEFAULT NULL,
      accuracy varchar(50) DEFAULT NULL,
      latitude decimal(12,9) DEFAULT NULL,
      longitude decimal(12,9) DEFAULT NULL,
      patientLatitude decimal(12,9) unsigned DEFAULT NULL,
      patientLongitude decimal(12,9) unsigned DEFAULT NULL,
      patientUpdated datetime DEFAULT NULL,
      service int DEFAULT NULL,
      errorVideo text,
      errorLocation text,
      os text,
      userAgent text,
      requireJoinPermission int DEFAULT '0',
      requireUserName int DEFAULT '0',
      requirePassword int DEFAULT '0',
      oneTimeLink int DEFAULT '0',
      password tinytext,
      isAdmin varchar(11) DEFAULT '0',
      dtmCreated datetime DEFAULT NULL,
      dtmExpired datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created link_connect table");
};

/**
 * Create radio_devices table
 */
const createRadioDevicesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS radio_devices (
      id int NOT NULL AUTO_INCREMENT,
      deviceId varchar(100) DEFAULT NULL,
      deviceName varchar(200) DEFAULT NULL,
      deviceType varchar(50) DEFAULT NULL,
      status varchar(20) DEFAULT 'active',
      locationId int DEFAULT NULL,
      frequency varchar(50) DEFAULT NULL,
      channel varchar(50) DEFAULT NULL,
      dtmCreated datetime DEFAULT NULL,
      dtmUpdated datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created radio_devices table");
};

/**
 * Create radio_locations table
 */
const createRadioLocationsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS radio_locations (
      id int NOT NULL AUTO_INCREMENT,
      locationName varchar(200) DEFAULT NULL,
      latitude decimal(12,9) DEFAULT NULL,
      longitude decimal(12,9) DEFAULT NULL,
      address text,
      description text,
      status varchar(20) DEFAULT 'active',
      dtmCreated datetime DEFAULT NULL,
      dtmUpdated datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created radio_locations table");
};

/**
 * Create record_media table
 */
const createRecordMediaTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS record_media (
      id int NOT NULL AUTO_INCREMENT,
      recordId varchar(100) DEFAULT NULL,
      room varchar(50) DEFAULT NULL,
      fileName varchar(255) DEFAULT NULL,
      filePath varchar(500) DEFAULT NULL,
      fileSize int DEFAULT NULL,
      duration int DEFAULT NULL,
      recordType varchar(50) DEFAULT NULL,
      status varchar(20) DEFAULT 'completed',
      dtmCreated datetime DEFAULT NULL,
      dtmCompleted datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created record_media table");
};

/**
 * Create room_conference table
 */
const createRoomConferenceTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS room_conference (
      id int unsigned NOT NULL AUTO_INCREMENT,
      status varchar(10) DEFAULT NULL,
      roomType varchar(10) DEFAULT NULL,
      room varchar(50) DEFAULT NULL,
      service int DEFAULT NULL,
      recordId tinytext,
      recordStatus int DEFAULT '0',
      autoRecord int DEFAULT '0',
      recordType varchar(50) DEFAULT NULL,
      encodingOptionsPreset varchar(50) DEFAULT NULL,
      chatEnabled int DEFAULT '0',
      messageUnread int DEFAULT '0',
      agentSeen datetime DEFAULT NULL,
      dtmCreated datetime DEFAULT NULL,
      dtmUpdated datetime DEFAULT NULL,
      dtmClosed datetime DEFAULT NULL,
      dtmExpired datetime DEFAULT NULL,
      dtmStartRecord datetime DEFAULT NULL,
      dtmStopRecord datetime DEFAULT NULL,
      userAgent tinytext,
      webSocketURL tinytext,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created room_conference table");
};

/**
 * Create room_user table
 */
const createRoomUserTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS room_user (
      id int NOT NULL AUTO_INCREMENT,
      room varchar(100) DEFAULT NULL,
      identity tinytext,
      color varchar(50) DEFAULT NULL,
      userName varchar(100) DEFAULT NULL,
      userType varchar(50) DEFAULT NULL,
      status varchar(11) DEFAULT NULL,
      socketId tinytext,
      conference int DEFAULT '1',
      cameraMicrophoneStatus varchar(100) DEFAULT NULL,
      camera tinyint(1) DEFAULT '1',
      microphone tinyint(1) DEFAULT '1',
      latitude varchar(100) DEFAULT NULL,
      longitude varchar(100) DEFAULT NULL,
      accuracy varchar(100) DEFAULT NULL,
      userAgent text,
      dtmcreated datetime DEFAULT NULL,
      dtmupdated datetime NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created room_user table");
};

/**
 * Create services table
 */
const createServicesTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS services (
      id int unsigned NOT NULL AUTO_INCREMENT,
      name varchar(200) DEFAULT NULL,
      webTitle varchar(100) DEFAULT NULL,
      prefixHLSVideoSMS varchar(50) DEFAULT NULL,
      prefixTextVideoSMS varchar(50) DEFAULT NULL,
      prefixTextLocationSMS varchar(50) DEFAULT NULL,
      domainsVideo text,
      domainsLocation text,
      smsSenderName text,
      logo varchar(200) DEFAULT NULL,
      titleColor varchar(100) DEFAULT NULL,
      latitude decimal(12,9) DEFAULT NULL,
      longitude decimal(12,9) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created services table");
};

/**
 * Create usage_status_log table
 */
const createUsageStatusLogTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS usage_status_log (
      id int NOT NULL AUTO_INCREMENT,
      room varchar(50) DEFAULT NULL,
      identity varchar(100) DEFAULT NULL,
      userName varchar(100) DEFAULT NULL,
      userType varchar(50) DEFAULT NULL,
      action varchar(100) DEFAULT NULL,
      status varchar(50) DEFAULT NULL,
      data text,
      dtmCreated datetime DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  await pool.query(createTableQuery);
  logger.info("Created usage_status_log table");
};

/**
 * Function to create missing tables (if needed)
 */
const createMissingTables = async () => {
  logger.info("Checking for missing tables and creating if necessary...");

  const tableCreators = {
    car_track: createCarTrackTable,
    case_data: createCaseDataTable,
    chat_message: createChatMessageTable,
    color_scheme: createColorSchemeTable,
    data_log: createDataLogTable,
    files: createFilesTable,
    link_connect: createLinkConnectTable,
    radio_devices: createRadioDevicesTable,
    radio_locations: createRadioLocationsTable,
    record_media: createRecordMediaTable,
    room_conference: createRoomConferenceTable,
    room_user: createRoomUserTable,
    services: createServicesTable,
    usage_status_log: createUsageStatusLogTable,
  };

  const missingTables = [];
  const createdTables = [];

  for (const [tableName, createFunction] of Object.entries(tableCreators)) {
    if (!(await tableExists(tableName))) {
      missingTables.push(tableName);
      try {
        await createFunction();
        createdTables.push(tableName);
        logger.info(`✅ Successfully created table: ${tableName}`);
      } catch (error) {
        logger.error(`❌ Failed to create table ${tableName}:`, error);
      }
    }
  }

  if (missingTables.length > 0) {
    logger.info(`Found ${missingTables.length} missing tables: ${missingTables.join(", ")}`);
    logger.info(`Successfully created ${createdTables.length} tables: ${createdTables.join(", ")}`);
  } else {
    logger.info("✅ All required tables already exist");
  }

  return { missingTables, createdTables };
};

/**
 * Main function to initialize seed database
 */
const initSeedDatabase = async () => {
  logger.info("Starting database seeding process...");

  try {
    // Create database if it doesn't exist
    await createDatabase("conference");

    // Test database connection
    await new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
        if (err) {
          reject(err);
          return;
        }
        logger.info("Database connection established for seeding");
        connection.release();
        resolve();
      });
    });

    // Create missing tables if they don't exist
    await createMissingTables();

    // Check all tables exist
    const tables = [
      "car_track",
      "case_data",
      "chat_message",
      "color_scheme",
      "data_log",
      "files",
      "link_connect",
      "radio_devices",
      "radio_locations",
      "record_media",
      "room_conference",
      "room_user",
      "services",
      "usage_status_log",
    ];

    logger.info("Verifying all database tables...");
    for (const table of tables) {
      const exists = await tableExists(table);
      const hasRecords = exists ? await tableHasRecords(table) : false;
      logger.info(`Table ${table}: ${exists ? "EXISTS" : "MISSING"} - Records: ${hasRecords ? "YES" : "NO"}`);
    }

    // Seed tables that need default data
    await seedColorScheme();
    await seedServices();
    await seedRadioDevices();
    await seedRadioLocations();

    logger.info("Database seeding process completed successfully");
  } catch (error) {
    logger.error("Error during database seeding:", error);
    throw error;
  }
};

export default {
  initSeedDatabase,
  createMissingTables,
  tableExists,
  tableHasRecords,
  seedColorScheme,
  seedServices,
  seedRadioDevices,
  seedRadioLocations,
  createDatabase,
  createCarTrackTable,
  createCaseDataTable,
  createChatMessageTable,
  createColorSchemeTable,
  createDataLogTable,
  createFilesTable,
  createLinkConnectTable,
  createRadioDevicesTable,
  createRadioLocationsTable,
  createRecordMediaTable,
  createRoomConferenceTable,
  createRoomUserTable,
  createServicesTable,
  createUsageStatusLogTable,
};
