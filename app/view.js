'use strict'
const path = require('path')
const electron = require('electron');
const model = require(path.join(__dirname, 'model.js'))
const dialog = electron.remote;
module.exports.openFile = function () {
  dialog.dialog.showOpenDialog(function(fileNames){

      if( fileNames === undefined ){

        alert('No file was Selected')
        return ;

        }

    var fileName = fileNames[0]
    alert(fileName);
    window.model.importData(fileName)
    
  })
}




module.exports.showMenu = function (rowsObject) {
  let markup = `<li class="nav-item">
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
    console.log(markup);
  $('#mainMenu').html(markup)
}

module.exports.home = function (e) {
  let editPerson = fs.readFileSync(path.join(htmlPath, 'home.html'), 'utf8')
  $('#main_body').html(editPerson)
  

}

module.exports.showTableData = function (rowsObject) {
  console.log('rowslength' + " "+rowsObject.length, rowsObject);
  if (rowsObject[0]){
  $('#data_list_header').html(rowsObject[0]._table_Name)
  let table = `<table class="table table-bordered">
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
  head_cols += `<th>Upload</th><th>Edit</th><th>Delete</th>`
  
  $('#table_header').html(head_cols)

  let body_cols=''
  for (let rowId in rowsObject) {
    let row = rowsObject[rowId]
    let col='<tr>'
    let jsonData = JSON.parse(row._table_json)
    Object.keys(jsonData.formdata).forEach(function(key,index) {
      col += `<td>`+ jsonData.formdata[key] +`</td>`
    })
    col+='<td><a href="#">Upload</a></td>' +
       '<td><a href="#"><img id="edit-pid_' +
       row._table_id + '" class="icon edit" src="' +
       path.join(__dirname, 'img', 'edit-icon.png') + '"></a></td>' +
       '<td><a href="#"><img id="del-pid_' + row._id_table + '_' + row._table_id +
       '" class="icon delete" src="' + path.join(__dirname, 'img', 'x-icon.png') +
       '"></a></div></td>'
    
    col += '</tr>'

    body_cols += col  


    // markup += '<br><div><div class="row justify-content-start"  style="margin-left: 20px;>' +
    // '<div class="col-xs-2 edit-icons"><a href="#"><img id="edit-pid_' +
    // row._table_id + '" class="icon edit" src="' +
    // path.join(__dirname, 'img', 'edit-icon.png') + '"></a>' +
    // '<a href="#"><img id="del-pid_' + row._id_table +
    // '" class="icon delete" src="' + path.join(__dirname, 'img', 'x-icon.png') +
    // '"></a></div>' +
    // '<div class="col-xs-5 name">' + row._table_date + ',&nbsp;</div>' +
    // '<div class="col-xs-5 name">' + row._table_status + '</div>' +
    // '</div></div>'
  }
  $('#table_body').html(body_cols)

  
  $('#data-list img.edit').each(function (idx, obj) {
    $(obj).on('click', function () {
      alert()
      window.view.editPerson(this.id)
    })
  })
  $('#data-list img.edit').each(function (idx, obj) {
    $(obj).on('click', function () {
      alert()
      window.view.editPerson(this.id)
    })
  })
  $('#data-list img.delete').each(function (idx, obj) {
    $(obj).on('click', function () {
      window.view.deleteData(this.id)
    })
  })
  }
  else{
    $('#data_list_header').html("No Data")
  }
}

module.exports.listTableData = function (_table_id) {
  let people = fs.readFileSync(path.join(htmlPath, 'people.html'), 'utf8')
  $('#main_body').html(people)
  console.log(_table_id)
  window.model.getTableData(_table_id)
  
}

module.exports.addPerson = function (e) {
  let editPerson = fs.readFileSync(path.join(htmlPath, 'edit-person.html'), 'utf8')
  $('#main_body').html(editPerson)
  $('#edit-person h2').html('Add Person')
  $('#edit-person-submit').html('Save')
  $('#edit-person-form input').val('')
  $('#edit-person-form').removeClass('was-validated')
  $('#first_name, #last_name')
    .removeClass('is-valid is-invalid')
  $('#person_id').parent().hide()
  $('#edit-person').show()

    $('#edit-person-submit').click(function (e) {
    e.preventDefault()
    let ok = true
    $('#first_name, #last_name').each(function (idx, obj) {
      if ($(obj).val() === '') {
        $(obj).removeClass('is-valid').addClass('is-invalid')
        ok = false
      } else {
        $(obj).addClass('is-valid').removeClass('is-invalid')
      }
    })
    if (ok) {
      $('#edit-person-form').addClass('was-validated')
      let formId = $(e.target).parents('form').attr('id')
      let keyValue = window.view.getFormFieldValues(formId)
      window.model.saveFormData('people', keyValue, function () {
        window.model.getPeople()
      })
    }
  })
}

module.exports.editPerson = function (pid) {
  alert();
  let editPerson = fs.readFileSync(path.join(htmlPath, 'edit-person.html'), 'utf8')
  $('#main_body').html(editPerson)

  $('#edit-person h2').html('Edit Person')
  $('#edit-person-submit').html('Update')
  $('#edit-person-form').removeClass('was-validated')
  $('#first_name, #last_name')
    .removeClass('is-valid is-invalid')
  $('#person_id').parent().show()
  pid = pid.split('_')[1]
  let row = model.getPerson(pid)[0]
  $('#person_id').val(row.person_id)
  $('#first_name').val(row.first_name)
  $('#last_name').val(row.last_name)
  
  $('#edit-person').show()
    $('#edit-person-submit').click(function (e) {
    e.preventDefault()
    let ok = true
    $('#first_name, #last_name').each(function (idx, obj) {
      if ($(obj).val() === '') {
        $(obj).removeClass('is-valid').addClass('is-invalid')
        ok = false
      } else {
        $(obj).addClass('is-valid').removeClass('is-invalid')
      }
    })
    if (ok) {
      $('#edit-person-form').addClass('was-validated')
      let formId = $(e.target).parents('form').attr('id')
      let keyValue = window.view.getFormFieldValues(formId)
      window.model.saveFormData('people', keyValue, function () {
        window.model.getPeople()
      })
    }
  })
}

module.exports.deleteData = function (pid) {
  model.deleteData(pid.split('_')[1], pid.split('_')[2])
}

module.exports.getFormFieldValues = function (formId) {
  let keyValue = {columns: [], values: []}
  $('#' + formId).find('input:visible, textarea:visible').each(function (idx, obj) {
    keyValue.columns.push($(obj).attr('id'))
    keyValue.values.push($(obj).val())
  })
  return keyValue
}
