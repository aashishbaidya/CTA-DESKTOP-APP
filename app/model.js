'use strict'

const path = require('path')
const fs = require('fs')
const SQL = require('sql.js')
const view = require(path.join(__dirname, 'view.js'))
const request = require('request');
const rp = require('request-promise');
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
    let query = 'SELECT * FROM `_table_main` WHERE `_table_id` = '+ [tid] +' AND `_delete_flag` = "0" AND `_table_status` = "Not Sent" ORDER BY `_table_id` DESC;'
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

module.exports.getUserData = function () {
  let db = SQL.dbOpen(window.model.db)
  let datas={}
  if (db !== null) {
    let query = 'SELECT * FROM `_user`;'
    console.log(query);
    let row = db.exec(query)
    console.log(row)
    if (row !== undefined && row.length > 0) {
      row = _rowsFromSqlDataObject(row[0])
      datas=row
    }
  }
  SQL.dbClose(db, window.model.db)
  return datas
}

module.exports.userLogOut = function () {
  let db = SQL.dbOpen(window.model.db)
  var datas = ""
  if (db !== null) {
    let query = 'DELETE FROM `_user`;'
    try {
      let row = db.exec(query)
      datas="Success"
      SQL.dbClose(db, window.model.db)
      window.view.home()
    } catch (error) {
      datas="Failed"
      console.log('model.getUserData', error.message)
      SQL.dbClose(db, window.model.db)
    }     
  }
}

module.exports.selectRequiredData = function (rows, db) {
  $.each( rows, function( key, row ) {
    let db1 = SQL.dbOpen(window.model.db)
    let query1 = "select max(_table_date) from '_table_main' WHERE imei='"+row['imei']+"';"
    console.log(query1);
    let row1 = db1.exec(query1)
    SQL.dbClose(db1, window.model.db)
    
    // console.log(_rowsFromSqlDataObject({values: values, columns: columns}), pid, edited_key, edited_value)
    var query = "SELECT * FROM '_table_main' WHERE _delete_flag='0' AND _table_status='Not Sent' AND imei = '"+ row['imei'] +"';"
    if (row1[0]['values'][0][0]){
      query = "SELECT * FROM '_table_main' WHERE _delete_flag='0' AND _table_status='Not Sent' AND imei = '"+ row['imei'] +"' AND _table_date > '"+row1[0]['values'][0][0]+"';"
    }


    console.log('here', query)
    try {
      let row = db.exec(query)
      if (row !== undefined && row.length > 0) {
        
        row = _rowsFromSqlDataObject(row[0], db)
        //model.selectRequiredData(row)
        console.log(row);
        model.saveImportedData(row)
      }
    } catch (error) {
      console.log('model.selectRequiredData', error.message)
    }
  });

}


module.exports.importData = function (filePath) {
  let db = SQL.dbOpen(filePath)
  if (db !== null) {

   let query = "SELECT DISTINCT imei FROM '_table_main';"
    try {
      let row = db.exec(query)
      console.log('here');
      if (row !== undefined && row.length > 0) {
        
        row = _rowsFromSqlDataObject(row[0], db)
        console.log('here', row)
        model.selectRequiredData(row, db)

        // model.saveImportedData(row)

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
      query += ' ("_table_id", "_table_Name", "_table_date", "_table_json", "_table_Gps", "_table_photo", "_table_status", "_delete_flag", "imei") VALUES'

      $.each( rows, function( key, row ) {
        if(key != 0){
          query += ' ,'
        }
        query += `  ('` + row._table_id + `','` + row._table_Name + `','` + row._table_date + `','` + row._table_json + `','` + row._table_Gps + `','` + row._table_photo + `','` + row._table_status + `','` + row._delete_flag + `','` + row.imei +`')`
      });
    query += ';'
     console.log(query);
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
      console.log('model.updateData', 'No data found for form_id =', pid)
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
        console.log('model.updateData', 'No data found for form_id =', pid)
      }
    } catch (error) {
      console.log('model.updateData', error.message)
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
module.exports.getRowData = function (pid, db) {
  let query = 'SELECT * FROM `_table_main` WHERE `_id_table` IS ? ;'
  let statement = db.prepare(query, [pid])
  let data={}

  if (statement.step()) {
    let values = [statement.get()]
    let columns = statement.getColumnNames()
    // console.log(_rowsFromSqlDataObject({values: values, columns: columns}), pid, edited_key, edited_value)
    data=_rowsFromSqlDataObject({values: values, columns: columns})
  } else {
    console.log('model.updateData', 'No data found for form_id =', pid)
  }
  return data
}

module.exports.uploadData = function (pid) {
  let status=false
  var userData = window.model.getUserData()
  if (!userData[0]){
    alert("Please login first to upload the data.");
    return status
  }
  
  let db = SQL.dbOpen(window.model.db)
  if (db !== null) {
    let data = window.model.getRowData(pid, db)

    var options = {
      method: 'POST',
      uri: 'https://cta.wwfnepal.org.np/api/index.php/enter_record',
      form: {
          // Like <input type="text" name="name">
          data: data[0]['_table_json'],
          username: userData[0]['username'],
          password: userData[0]['password'],
      },
      headers: {
          /* 'content-type': 'application/x-www-form-urlencoded' */ // Is set automatically
      }
    };
    console.log(options);
    rp(options)
      .then(function (body) {
          request(options, function (error, response, body) {
            var BODY = JSON.parse(body);
            console.log(BODY);
            if(BODY.status ===200 ) {
              alert("Submission Successful.");
              window.model.markAsUploaded(pid, db);
              status = true
             }
            else {
              alert('Submission failed. Data invalid.');
              // console.log('statusCode:', response && response.statusCode); 
              console.log('body:', body);
              status = false
            }
            
          });    
        })
      .catch(function (err) {
          alert('Submission failed. Please check your internet connection and try again.');
          console.log(err);
      });
  }
  SQL.dbClose(db, window.model.db) 
  return status
}


module.exports.markAsUploaded = function (pid) {
      let db1 = SQL.dbOpen(window.model.db)
      let query = 'UPDATE `_table_main` SET `_table_status` = "Sent" WHERE `_id_table` = "'+[pid]+'" ;'
      let statement = db1.prepare(query)
      try {
        if (statement.run()) {
          console.log('Submitted', pid)
        } else {
          console.log('model.uploadData', 'No data found for row =', pid)
        }
      } catch (error) {
        console.log('model.uploadData', error.message)
      } finally {
        SQL.dbClose(db1, window.model.db) 
      }
   
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

module.exports.saveUser = function (userName, passWord) {
  let db = SQL.dbOpen(window.model.db);
  if( db !== null) {
    let query = 'INSERT INTO _user VALUES';
    query += `(null,"`+ userName + `", "` + passWord + `");`;
    db.exec(query);
  }
  SQL.dbClose(db, window.model.db)
  view.home()
}
