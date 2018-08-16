'use strict'
const path = require('path')
const electron = require('electron');
const model = require(path.join(__dirname, 'model.js'))
const dialog = electron.remote;
const request = require('request');
const rp = require('request-promise');
module.exports.openFile = function () {
dialog.dialog.showOpenDialog(function(fileNames){
      if( fileNames === undefined ){
        alert('No file was Selected')
        return ;
        }
    var fileName = fileNames[0]
    // alert(fileName);
    window.model.importData(fileName)
    
  })
}

module.exports.loginUser = function () {
      $('#hero').value()
      
}


module.exports.showMenu = function (rowsObject) {
  let markup = `<li class="nav-item">
  <img style="margin-left:45px;" src="../img/logo.png">
  <hr>
  <a class="nav-link add" href="#" onclick="window.view.home(this)">Home</a>
  </li>`
  for (let rowId in rowsObject) {
    let row = rowsObject[rowId]
    markup += `<li class="nav-item">
      <a class="nav-link" href="#" onclick="window.view.listTableData(`+ row._table_id + `)">
      `+ row._table_Name + `</a>
    </li>
    <li class="nav-item">`
    }
    
  $('#mainMenu').html(markup)
}

module.exports.home = function (e) {
  let homePage = fs.readFileSync(path.join(htmlPath, 'home.html'), 'utf8')
  $('#main_body').html(homePage)
  let rowsObject = window.model.getUserData()
  if (rowsObject[0]){
    let elem = `<p>Logged in as `+ rowsObject[0].username +`</p>
                <button type="button" class="btn btn-primary" value="Submit" onclick="window.model.userLogOut()">Log Out</button>`
    $('#loginForm').html(elem)
  }
}

module.exports.showTableData = function (rowsObject) {
  console.log('rowslength' + " "+rowsObject.length, rowsObject);
  if (rowsObject[0]){
  $('#data_list_header').html(rowsObject[0]._table_Name)
  let table = `<table id="myTable" class="table table-bordered">
                  <thead>
                    <tr id="table_header" class="text-capitalize">
                    </tr>
                  </thead>
                  <tbody id="table_body">
                  </tbody>
                </table>`

  $('#data-list').html(table)
  
  let head_cols= ''
  Object.keys(JSON.parse(rowsObject[0]._table_json).formdata).forEach(function(key,index) {
      let keys = key.split("_");
      let col_name = ''
      keys.forEach(function(key) {
        col_name+=key+' ';
      });
      head_cols += `<th>`+ col_name +`</th>`
  })
  head_cols += `<th>Upload</th><th>Delete</th>`
  
  $('#table_header').html(head_cols)

  let body_cols=''
  for (let rowId in rowsObject) {
    let row = rowsObject[rowId]
    let col='<tr id="row_'+ row._id_table +'">'
    let jsonData = JSON.parse(row._table_json)
    Object.keys(jsonData.formdata).forEach(function(key,index) {
      col += '<td id="'+ row._id_table +'-cell-'+ key +'" ondblclick="editCell(this.id)">'+ jsonData.formdata[key] +'</td>'
    })
    col+='<td><button class="upload" id="upload-pid_' + row._id_table + '_' + row._table_id +
       '">Upload</button></td>' +
       '<td><button><img id="del-pid_' + row._id_table + '_' + row._table_id +
       '" height="15px" width="15px" src="' + path.join(__dirname, 'img', 'x-icon.png') +
       '"></button></div></td>'
    col += '</tr>'

    body_cols += col  

  }

  $('#table_body').html(body_cols)

  
  $('#data-list button.upload').each(function (idx, obj) {
    $(obj).on('click', function () {
      window.view.uploadData(this.id)
      
    })
  })
  
  $('#data-list img.delete').each(function (idx, obj) {
    $(obj).on('click', function () {
      status = window.view.deleteData(this.id)
    })
  })
  }
  else{
    $('#data_list_header').html("No Data")
  }
}

module.exports.listTableData = function (_table_id) {
  let details = fs.readFileSync(path.join(htmlPath, 'details.html'), 'utf8')
  $('#main_body').html(details)
  console.log(_table_id)
  window.model.getTableData(_table_id)
}

module.exports.editOnTableView = function (td_id) {

  let data=$('#'+td_id).text()
  let input_field = `<div class="form-group">
                     <input type="text" class="form-control" 
                     id="input_`+ td_id +`" value="`+data+`">
                     </div>`

  $('#'+td_id).html(input_field)
  $('#input_'+td_id).focus()

  $('#input_'+td_id).focusout(function () {
      let input_value = $(this).val() 
      $('#'+td_id).html(input_value)      
      let tdata = td_id.split('-')
      model.updateData(tdata[0], tdata[2], input_value)
    })

  $('#input_'+td_id).keypress(function(e) {
    if(e.which == 13) {
        $('#input_'+td_id).blur();
    }
})
}

module.exports.deleteData = function (pid) {
  let status = model.deleteData(pid.split('_')[1], pid.split('_')[2])
  if (status){
    $('#row_'+pid.split('_')[1]).remove()
  }
}

module.exports.uploadData = function (pid) {
  console.log('here uploaded')
  let status = model.uploadData(pid.split('_')[1], pid.split('_')[2])
  if (status){
    $('#row_'+pid.split('_')[1]).remove()
  }
}
module.exports.getFormFieldValues = function (formId) {
  let keyValue = {columns: [], values: []}
  $('#' + formId).find('input:visible, textarea:visible').each(function (idx, obj) {
    keyValue.columns.push($(obj).attr('id'))
    keyValue.values.push($(obj).val())
  })
  return keyValue
}

module.exports.userLogin = function() {
  $('#modalMessage').html('Authenticating, Please wait ... ');
  $("#myModalFooter").hide();
  $('#myModal').modal('show');
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  console.log(username,password);
  
  var options = {
    method: 'POST',
    uri: 'http://www.naxa.com.np/cta/LoginApi/check_user',
    form: {
        
        data: JSON.stringify( {"username":username,"password":password} )
    },
    headers: {
       
    }
  };
  rp(options)
    .then(function (body) {
        request(options, function (error, response, body) {
          var BODY = JSON.parse(body);
          console.log(BODY);
          if (BODY.status === 201) {
            $('#modalMessage').html('Login failed. Invalid username or password. Try again.');
            $("#myModalFooter").show();
            // console.log('statusCode:', response && response.statusCode); 
            console.log('body:', body);

          }
          else if(BODY.status ===200 ) {
            $('#modalMessage').html('Login Successful.');
            $("#myModalFooter").show();
            console.log(typeof(window.model.db));
            window.model.saveUser(username, password);
            window.view.home();
           
           }
        });    
      })
    .catch(function (err) {
        $('#modalMessage').html('Login failed. Please check your username and password and try again.');
        $("#myModalFooter").show();
        console.log(err);
    });
   
}
