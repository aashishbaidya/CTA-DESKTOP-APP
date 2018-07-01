'use strict'

const path = require('path')
const fs = require('fs')
const SQL = require('sql.js')
const view = require(path.join(__dirname, 'view.js'))

/*
  SQL.js returns a compact object listing the columns separately from the
  values or rows of data. This function joins the column names and
  values into a single objects and collects these together by row id.
  {
    0: {first_name: "Jango", last_name: "Reinhardt", person_id: 1},
    1: {first_name: "Svend", last_name: "Asmussen", person_id: 2},
  }
  This format makes updating the markup easy when the DOM input id attribute
  is the same as the column name. See view.showPeople() for an example.
*/
let _rowsFromSqlDataObject = function (object) {
  let data = {}
  let i = 0
  let j = 0
  for (let valueArray of object.values) {
    data[i] = {}
    j = 0
    for (let column of object.columns) {
      Object.assign(data[i], {[column]: valueArray[j]})
      j++
    }
    i++
  }
  return data
}

/*
  Return a string of placeholders for use in a prepared statement.
*/
let _placeHoldersString = function (length) {
  let places = ''
  for (let i = 1; i <= length; i++) {
    places += '?, '
  }
  return /(.*),/.exec(places)[1]
}

SQL.dbOpen = function (databaseFileName) {
  try {
    return new SQL.Database(fs.readFileSync(databaseFileName))
  } catch (error) {
    console.log("Can't open database file.", error.message)
    return null
  }
}

SQL.dbClose = function (databaseHandle, databaseFileName) {
  try {
    let data = databaseHandle.export()
    let buffer = Buffer.alloc(data.length, data)
    fs.writeFileSync(databaseFileName, buffer)
    databaseHandle.close()
    return true
  } catch (error) {
    console.log("Can't close database file.", error)
    return null
  }
}

/*
  A function to create a new SQLite3 database from schema.sql.

  This function is called from main.js during initialization and that's why
  it's passed appPath. The rest of the model operates from renderer and uses
  window.model.db.
*/
module.exports.initDb = function (appPath, callback) {
  let dbPath = path.join(appPath, 'main.db')
  let createDb = function (dbPath) {
    // Create a database.
    let db = new SQL.Database()
    let query = fs.readFileSync(
    path.join(__dirname, 'db', 'schema.sql'), 'utf8')
    let result = db.exec(query)
    if (Object.keys(result).length === 0 &&
      typeof result.constructor === 'function' &&
      SQL.dbClose(db, dbPath)) {
      console.log('Created a new database.')
    } else {
      console.log('model.initDb.createDb failed.')
    }
  }
  let db = SQL.dbOpen(dbPath)
  if (db === null) {
    /* The file doesn't exist so create a new database. */
    createDb(dbPath)
  } else {
    /*
      The file is a valid sqlite3 database. This simple query will demonstrate
      whether it's in good health or not.
    */
    let query = 'SELECT count(*) as `count` FROM `sqlite_master`'
    let row = db.exec(query)
    let tableCount = parseInt(row[0].values)
    if (tableCount === 0) {
      console.log('The file is an empty SQLite3 database.')
      createDb(dbPath)
    } else {
      console.log('The database has', tableCount, 'tables.')
    }
    if (typeof callback === 'function') {
      callback()
    }
  }
}

/*
  Populates the Menu List.
*/

module.exports.getMenu = function () {
  let db = SQL.dbOpen(window.model.db)
  if (db !== null) {
    let query = "SELECT DISTINCT `_table_Name`, `_table_id` FROM `_table_main`"
    try {
      let row = db.exec(query)
      if (row !== undefined && row.length > 0) {
        
        row = _rowsFromSqlDataObject(row[0])
        view.showMenu(row)
        console.log(row)
      }
    } catch (error) {
      console.log('model.getMenu', error.message)
    } finally {
      SQL.dbClose(db, window.model.db)
    }
  }
}


module.exports.getTableData = function (tid) {
  let db = SQL.dbOpen(window.model.db)
  let datas={}
  if (db !== null) {
    let query = 'SELECT * FROM `_table_main` WHERE `_table_id` = '+ [tid] +' AND `_delete_flag` = "0" ORDER BY `_table_id` DESC;'
    console.log(query);
    try {
      let row = db.exec(query)
      console.log(row)
      if (row !== undefined && row.length > 0) {
        row = _rowsFromSqlDataObject(row[0])
        datas=row

      }
    } catch (error) {
      console.log('model.getTableData', error.message)
    } finally {
      SQL.dbClose(db, window.model.db)
      view.showTableData(datas)
    }
  }
}


module.exports.importData = function (filePath) {
  let db = SQL.dbOpen(filePath)
  if (db !== null) {

   let query = "SELECT * FROM '_table_main' WHERE _delete_flag='0';"
    try {
      let row = db.exec(query)
      if (row !== undefined && row.length > 0) {
        
        row = _rowsFromSqlDataObject(row[0])
        model.saveImportedData(row)

      }
    } catch (error) {
      console.log('model.importData', error.message)
    } finally {
      SQL.dbClose(db, filePath)
    }
  }
}


module.exports.saveImportedData = function (rows) {
  let db = SQL.dbOpen(window.model.db)
  try {
    let query = 'INSERT INTO `_table_main`'
      query += ' ("_table_id", "_table_Name", "_table_date", "_table_json", "_table_Gps", "_table_photo", "_table_status", "_delete_flag") VALUES'

      $.each( rows, function( key, row ) {
        if(key != 0){
          query += ' ,'
        }
        query += `  ('`+ row._table_id + `','` + row._table_Name + `','` + row._table_date + `','` + row._table_json + `','` + row._table_Gps + `','` + row._table_photo + `','` + row._table_status + `','` + row._delete_flag + `')`
  
      });
    query += ';'
    // console.log(query);
    let result = db.exec(query)
    if (Object.keys(result).length === 0 &&
      typeof result.constructor === 'function') {
      console.log('Insertrd.' + result)
    } else {
      console.log('model.initDb.createDb failed.')
    }
    
  } catch (error) {
    console.log('model.saveFormData', error.message)
  } finally {
    SQL.dbClose(db, window.model.db)
    model.getMenu()
  }
}


module.exports.updateData = function (pid, edited_key, edited_value) {
  let data={}
  let db = SQL.dbOpen(window.model.db)
  if (db !== null) {
  
    let query = 'SELECT * FROM `_table_main` WHERE `_id_table` IS ? ;'
    let statement = db.prepare(query, [pid])
    
    if (statement.step()) {
      let values = [statement.get()]
      let columns = statement.getColumnNames()
      // console.log(_rowsFromSqlDataObject({values: values, columns: columns}), pid, edited_key, edited_value)
      data=_rowsFromSqlDataObject({values: values, columns: columns})
    } else {
      console.log('model.getPeople', 'No data found for person_id =', pid)
    }

    
    let json_data = JSON.parse(data[0]._table_json)
    json_data['formdata'][edited_key] = edited_value

    let json_string = JSON.stringify(json_data)
    let query1 = `UPDATE "_table_main" SET "_table_json" = '`+[ json_string ]+`' WHERE "_id_table" = "`+[pid]+`" ;`
    let statement1 = db.prepare(query1)
    try {
      if (statement1.run()) {
        console.log('Deleted', pid)
        
      } else {
        console.log('model.deleteData', 'No data found for person_id =', pid)
      }
    } catch (error) {
      console.log('model.deleteData', error.message)
    } finally {
      SQL.dbClose(db, window.model.db)
    }
  }
}

/*
  Delete a row's data from the database.
*/
module.exports.deleteData = function (pid, pid_table) {
  let status=false
  let db = SQL.dbOpen(window.model.db)
  if (db !== null) {
    let query = 'UPDATE `_table_main` SET `_delete_flag` = "1" WHERE `_id_table` = "'+[pid]+'" ;'
    let statement = db.prepare(query)
    try {
      if (statement.run()) {
        console.log('Deleted', pid)
        status=true  
      } else {
        console.log('model.deleteData', 'No data found for person_id =', pid)
      }
    } catch (error) {
      console.log('model.deleteData', error.message)
    } finally {
      SQL.dbClose(db, window.model.db)
      
    }
  }
  return status
}

module.exports.uploadData = function (argument) {
  // body...
}

module.exports.saveFormData = function (tableName, keyValue, callback) {
  if (keyValue.columns.length > 0) {
    let db = SQL.dbOpen(window.model.db)
    if (db !== null) {
      let query = 'INSERT OR REPLACE INTO `' + tableName
      query += '` (`' + keyValue.columns.join('`, `') + '`)'
      query += ' VALUES (' + _placeHoldersString(keyValue.values.length) + ')'
      let statement = db.prepare(query)
      try {
        if (statement.run(keyValue.values)) {
          $('#' + keyValue.columns.join(', #'))
          .addClass('form-control-success')
          .animate({class: 'form-control-success'}, 1500, function () {
            if (typeof callback === 'function') {
              callback()
            }
          })
        } else {
          console.log('model.saveFormData', 'Query failed for', keyValue.values)
        }
      } catch (error) {
        console.log('model.saveFormData', error.message)
      } finally {
        SQL.dbClose(db, window.model.db)
      }
    }
  }
}
