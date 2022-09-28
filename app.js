const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const convertStateTableToResponseTable = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};
const convertDistrictTableToResponseTable = (eachDistrict) => {
  return {
    districtId: eachDistrict.district_id,
    districtName: eachDistrict.district_name,
    stateId: eachDistrict.state_id,
    cases: eachDistrict.cases,
    cured: eachDistrict.cured,
    active: eachDistrict.active,
    deaths: eachDistrict.deaths,
  };
};
//GET ALL STATES API 1
app.get("/states/", async (request, response) => {
  const getAllStates = `
        SELECT
            *
        FROM
            state;`;
  const allStates = await db.all(getAllStates);
  response.send(
    allStates.map((statesAll) => convertStateTableToResponseTable(statesAll))
  );
});
//GET PARTICULAR STATE API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getUniqueState = `
    SELECT
        *
    FROM 
        state
    WHERE
        state_id = ${stateId};`;
  const uniqueState = await db.get(getUniqueState);
  response.send(convertStateTableToResponseTable(uniqueState));
});
//CREATE A TABLE API 3
app.post("/districts/", async (request, response) => {
  const {
    districtName,
    districtId,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = request.body;
  const createTable = `
    INSERT INTO
        district (district_name, state_id, cases, cured, active, deaths)
    VALUES (
        '${districtName}',
        '${stateId}',
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}');`;
  const newTable = await db.run(createTable);
  response.send("District Successfully Added");
});
//GET UNIQUE DISTRICT API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getUniqueDistrict = `
    SELECT 
        *
    FROM 
        district
    WHERE 
        district_id = ${districtId};`;
  const uniqueDistrict = await db.get(getUniqueDistrict);
  response.send(convertDistrictTableToResponseTable(uniqueDistrict));
});
//DELETE A TABLE FROM DISTRICT API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
        DELETE FROM 
            district
        WHERE 
            district_id = ${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});
//UPDATE DISTRICT TABLE API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `
        UPDATE 
            district
        SET
            district_name = '${districtName}',
            state_id = ${stateId},
            cases = ${cases},
            cured = ${cured},
            active = ${active},
            deaths = ${deaths}
        WHERE 
            district_id = ${districtId}; `;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});
//GET TOTAL CASES API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalCases = `
    SELECT 
        sum(district.cases) as totalCases,
        sum(district.cured) as totalCured,
        sum(district.active) as totalActive,
        sum(district.deaths) as totalDeaths
    FROM 
        district
    WHERE 
        state_id = ${stateId};`;
  const getTotal = await db.get(totalCases);
  response.send(getTotal);
});
//GET STATE NAME API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictName = `
    SELECT
        state.state_name
    FROM 
        state INNER JOIN district ON state.state_id = district.state_id
    WHERE 
        district_id = ${districtId};`;
  const result = await db.get(getDistrictName);
  response.send(convertStateTableToResponseTable(result));
});
module.exports = app;
