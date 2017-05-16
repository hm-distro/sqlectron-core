/*eslint-disable */

const BigQuery = require('@google-cloud/bigquery');
import { identify } from 'sql-query-identifier';
import uriComponent from '@google-cloud/common';

import createLogger from '../../logger';

const logger = createLogger('db:clients:bigquery');

var bqClient = {};

export function createServer(serverConfig) {
	console.log("in BQ create server");
}

export function createConnection(serverConfig) {
	console.log("in BQ createconnection");
}

export default function (bqconfig) {
  // return new Promise(async (resolve, reject) => {
    // const dbConfig = configDatabase(bqconfig.keyfile, bqconfig.project, bqconfig.database);
    logger().debug('creating database client %j', bqconfig);
    const client  = BigQuery(bqconfig.database);
	bqClient = BigQuery(bqconfig.database);
      return{
		    client: client,
        defaultProject: bqconfig.database.projectId,
        wrapIdentifier,
        connect: () => connect(),
        disconnect: () => disconnect(),
        listTables: (dataset) => listTables(client, dataset),
        listViews: () => listViews(client),
        listRoutines: () => listRoutines(client),
        listTableColumns: (db, table) => listTableColumns(client, db, table),
        listSchemas: () => listSchemas(client),
        getTableReferences: (table) => getTableReferences(client, table),
        query: (queryText) => executeQuery(client, queryText),
        executeQuery: (queryText) => executeQuery(client, queryText),
        listDatabases: () => listDatabases(client),
        getQuerySelectTop: (table, limit) => getQuerySelectTop(client, table, limit),
        getTableCreateScript: (table) => getTableCreateScript(client, table),
        getViewCreateScript: (view) => getViewCreateScript(client, view),
      };
}

export function wrapIdentifier(value) {
  if (value === '*') return value;
  const matched = value.match(/(.*?)(\[[0-9]\])/); // eslint-disable-line no-useless-escape
  if (matched) return wrapIdentifier(matched[1]) + matched[2];
  return `"${value.replace(/"/g, '""')}"`;
}

function configDatabase(keyfile, project, database) {
  const config = {
    projectId: project,
    keyFilename: keyfile,
    dataset: database
  }

  return config;
}

export function connect() {
	return Promise.resolve();
}
export function disconnect() {
  // BigQuery does not have a connection pool. So we open and close connections
  // for every query request. This allows multiple request at same time by
  // using a different thread for each connection.
  // This may cause connection limit problem. So we may have to change this at some point.
  return Promise.resolve();;
}

export async function listDatabases(client) {
  const data = await client.getDatasets().then(function(x) {
	  return x[0].map(function(y){return y.id;});
  });
  return data;
}

export async function listTables(client, dataset) {
  let thisDataset = dataset.schema;
  let thisProject = '';
  if (thisDataset.indexOf(':') >= 0) {
    const newProject = thisDataset.split(':')[0];
    thisDataset = thisDataset.split(':')[1];
    client.projectId = newProject;
  }
  const data  = await client.dataset(thisDataset).getTables().then(function(x) {
    return x[0].map(function(y){return {name: y.id}});
  });
  console.log(data);
  return data;
}

export async function listViews(client, dataset) {
  let thisDataset = dataset.schema;
  let thisProject = '';
  if (thisDataset.indexOf(':') >= 0) {
    const newProject = thisDataset.split(':')[0];
    thisDataset = thisDataset.split(':')[1];
    client.projectId = newProject;
  }
  const data  = await client.dataset(thisDataset).getTables().then(function(x) {
    let views = x[0].filter(function(x) {return x.metadata.type == "VIEW";});
    return views.map(function(y){return {name: y.id}});
  });
  console.log(data);
  return data;
}

function parseQueryResults(data, command) {
    let response = [{fields: Object.keys(data[0] || {}).map((name) => ({ name })),
    command: command,
    rows: data,
    rowCount: results.length}];
      console.log(response);
      return response;
}

function executeSingleQuery(client, queryText, command) {
    let queryObject = {
      query: queryText,
      useLegacySql: false,
    }
    let data = [];
    return new Promise((resolve, reject) => {
      client.query(queryObject, function(err, rows) {
        if (err) {
			// console.log(err);
			return reject(err)
		};
      
        resolve(parseQueryResults(rows));
      });
    });
}

function executeQuery(client, queryText) {
  console.log("querytext");
  console.log(queryText);
  console.log(client.projectId);
  // set the project to the default project ID
  // client.projectId = client.defaultProject;
  // console.log(client.projectId);
  const commands = identifyCommands(queryText);
  console.log(commands);
  let results = [];
  for (var i = 0; i < commands.length; i++) {
	  let thisResult = executeSingleQuery(client, commands[i].text, commands[i].type);
	  results.push(thisResult);
  }
  return Promise.all(results);
  
}

function identifyCommands(queryText) {
  try {
    return identify(queryText);
  } catch (err) {
    return [];
  }
}

/*eslint-disable */
