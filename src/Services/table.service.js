import sql from "./db.service.js";

const checkTableExists = async (tableName) => {
  try {
    const stmt = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = ?
    `;
    const [result] = await sql.query(stmt, [tableName]);
    return result.count > 0;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    throw error;
  }
};

export default {
  checkTableExists,
};
