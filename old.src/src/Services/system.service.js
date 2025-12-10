import sql from "./db.service.js";

const checkService = async ({ service }) => {
  const stmt = `SELECT count(*) as count FROM services WHERE id = '${service}'`;
  const resp = await sql.query(stmt);
  return resp[0].count > 0;
};

const getService = async ({ service }) => {
  const stmt = `SELECT id as serviceId , name, webTitle, logo, titleColor, latitude, longitude FROM services WHERE id = '${service}' LIMIT 1`;
  const resp = await sql.query(stmt);
  if (resp.length === 0) {
    return null;
  }
  return resp[0];
};

const updateLocation = async ({ service, latitude, longitude }) => {
  const stmt = `UPDATE services SET latitude = '${latitude}', longitude = '${longitude}' WHERE id = '${service}'`;
  return await sql.query(stmt);
};

const updateService = async ({ service, name, latitude, longitude }) => {
  const stmt = `UPDATE services SET name = '${name}', latitude = '${latitude}', longitude = '${longitude}' WHERE id = '${service}'`;
  return await sql.query(stmt);
};

export default {
  getService,
  checkService,
  updateLocation,
  updateService,
};
