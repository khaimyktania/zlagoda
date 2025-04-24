var employeeModal = $("#employeeModal");

$(function () {
    loadEmployees();
});

// Load employees
function loadEmployees() {
    $.get('/getEmployees', function (response) {
        if(response) {
            var table = '';
            $.each(response, function(index, employee) {
                table += '<tr data-id="'+ employee.id_employee +'" data-surname="'+ employee.empl_surname +'" data-name="'+ employee.empl_name +'">' +
                    '<td>'+ employee.empl_surname + ' ' + employee.empl_name + ' ' + employee.empl_patronymic +'</td>'+
                    '<td>'+ employee.empl_role +'</td>'+
                    '<td>'+ employee.salary +'</td>'+
                    '<td>'+ employee.phone_number +'</td>'+
                    '<td><span class="btn btn-xs btn-primary edit-employee">Edit</span> <span class="btn btn-xs btn-danger delete-employee">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
}

// Open modal for new employee
$('#addEmployeeBtn').on('click', function() {
    employeeModal.find('.modal-title').text('Add New Employee');
    $("#employeeForm")[0].reset();
    $("#id_employee").val(''); // Ensure ID is empty for new employee
    employeeModal.modal('show');
});

// Edit employee - add event handler for the dynamic edit button
$(document).on('click', '.edit-employee', function() {
    var row = $(this).closest('tr');
    var employeeId = row.data('id');

    // Fetch the full employee data by ID
    $.get('/getEmployees', function(employees) {
        var employee = employees.find(e => e.id_employee == employeeId);

        if(employee) {
            // Fill the form with employee data
            $("#id_employee").val(employee.id_employee);
            $("#empl_surname").val(employee.empl_surname);
            $("#empl_name").val(employee.empl_name);
            $("#empl_patronymic").val(employee.empl_patronymic);
            $("#empl_role").val(employee.empl_role);
            $("#salary").val(employee.salary);
            $("#date_of_birth").val(employee.date_of_birth);
            $("#date_of_start").val(employee.date_of_start);
            $("#phone_number").val(employee.phone_number);
            $("#city").val(employee.city);
            $("#street").val(employee.street);
            $("#zip_code").val(employee.zip_code);

            // Update modal title and show
            employeeModal.find('.modal-title').text('Edit Employee');
            employeeModal.modal('show');
        }
    });
});

// Save employee
$("#saveEmployee").on("click", function () {
    var data = $("#employeeForm").serializeArray();
    var requestPayload = {
        id_employee: null,
        empl_surname: null,
        empl_name: null,
        empl_patronymic: null,
        empl_role: null,
        salary: null,
        date_of_birth: null,
        date_of_start: null,
        phone_number: null,
        city: null,
        street: null,
        zip_code: null
    };

    // Build object from form fields
    for (var i = 0; i < data.length; ++i) {
        var element = data[i];
        switch(element.name) {
            case 'id_employee':
                requestPayload.id_employee = element.value;
                break;
            case 'empl_surname':
                requestPayload.empl_surname = element.value;
                break;
            case 'empl_name':
                requestPayload.empl_name = element.value;
                break;
            case 'empl_patronymic':
                requestPayload.empl_patronymic = element.value;
                break;
            case 'empl_role':
                requestPayload.empl_role = element.value;
                break;
            case 'salary':
                requestPayload.salary = element.value;
                break;
            case 'date_of_birth':
                requestPayload.date_of_birth = element.value;
                break;
            case 'date_of_start':
                requestPayload.date_of_start = element.value;
                break;
            case 'phone_number':
                requestPayload.phone_number = element.value;
                break;
            case 'city':
                requestPayload.city = element.value;
                break;
            case 'street':
                requestPayload.street = element.value;
                break;
            case 'zip_code':
                requestPayload.zip_code = element.value;
                break;
        }
    }

    console.log("Sending payload:", requestPayload); // Debug logging

    // Send POST request
    $.ajax({
        type: "POST",
        url: '/insertEmployee',
        data: {
            data: JSON.stringify(requestPayload)
        },
        success: function(response) {
            console.log("Response:", response); // Debug logging
            if(requestPayload.id_employee) {
                alert("Employee updated successfully!");
            } else {
                alert("Employee added successfully!");
            }
            employeeModal.modal('hide');
            loadEmployees(); // refresh table
        },
        error: function(xhr, status, error) {
            console.error("Error details:", xhr.responseText); // Debug logging
            alert("Error while saving employee: " + error);
        }
    });
});
// Delete employee
$(document).on("click", ".delete-employee", function () {
    var tr = $(this).closest('tr');
    var data = {
        id_employee: tr.data('id')
    };
    var isDelete = confirm("Are you sure to delete " + tr.data('surname') + " " + tr.data('name') + "?");
    if (isDelete) {
        $.post('/deleteEmployee', data, function(response){
            if(response.success) {
                alert("Employee deleted successfully.");
                loadEmployees(); // refresh table
            } else {
                alert("Error: Could not delete employee.");
            }
        }).fail(function(xhr){
            alert("Error: " + (xhr.responseJSON ? xhr.responseJSON.message : "Error while deleting employee"));
        });
    }
});

// Reset form when modal is closed
employeeModal.on('hide.bs.modal', function(){
    $("#employeeForm")[0].reset();
});

$("#sortSelect").on("change", function () {
    var selectedOption = $(this).val();
    var url = '';

    switch(selectedOption) {
        case 'byName':
            url = '/getEmployeesSorted';
            break;
        case 'cashiersByName':
            url = '/getCashiersSorted';
            break;
        default:
            url = '/getEmployees';
            break;
    }

    $.get(url, function (response) {
        if(response) {
            var table = '';
            $.each(response, function(index, employee) {
                table += '<tr data-id="'+ employee.id_employee +'" data-surname="'+ employee.empl_surname +'" data-name="'+ employee.empl_name +'">' +
                    '<td>'+ employee.empl_surname + ' ' + employee.empl_name + ' ' + employee.empl_patronymic +'</td>'+
                    '<td>'+ employee.empl_role +'</td>'+
                    '<td>'+ employee.salary +'</td>'+
                    '<td>'+ employee.phone_number +'</td>'+
                    '<td><span class="btn btn-xs btn-primary edit-employee">Edit</span> <span class="btn btn-xs btn-danger delete-employee">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
});

$("#searchBySurname").on("click", function () {
    var surname = $("#searchSurname").val().trim();

    if (!surname) {
        alert("Please enter a surname.");
        return;
    }

    $.get('/getContactBySurname', { surname: surname }, function (response) {
        if (response) {
            $("#contactInfoResult").html(
                "<strong>Phone:</strong> " + response.phone_number + "<br>" +
                "<strong>Address:</strong> " + response.city + ", " + response.street + ", " + response.zip_code
            ).show();
        } else {
            $("#contactInfoResult").html("No employee found with that surname.").show();
        }
    }).fail(function () {
        $("#contactInfoResult").html("Error while fetching contact info.").show();
    });
});
