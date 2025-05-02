var employeeModal = $("#employeeModal");
var neverSoldPromotionalModal = $("#neverSoldPromotionalModal");

$(function () {
    loadEmployees();
});

// Clear page data when switching tabs
function clearPageData() {
    document.getElementById('dataContainer').innerHTML = '';
    document.querySelectorAll('form').forEach(form => form.reset());
}

document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', clearPageData);
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
    $("#id_employee").val('');
    $('.error-message').hide().find('.error-text').text('');
    $('.form-control').removeClass('is-invalid');
    employeeModal.modal('show');
});

// Edit employee
$(document).on('click', '.edit-employee', function() {
    var row = $(this).closest('tr');
    var employeeId = row.data('id');

    $.get('/getEmployees', function(employees) {
        var employee = employees.find(e => e.id_employee == employeeId);

        if(employee) {
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

            employeeModal.find('.modal-title').text('Edit Employee');
            $('.error-message').hide().find('.error-text').text('');
            $('.form-control').removeClass('is-invalid');
            employeeModal.modal('show');
        }
    });
});

// Save employee
$("#saveEmployee").on("click", function () {
    if (validateEmployeeForm()) {
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

        console.log("Sending payload:", requestPayload);

        $.ajax({
            type: "POST",
            url: '/insertEmployee',
            data: {
                data: JSON.stringify(requestPayload)
            },
            success: function(response) {
                console.log("Response:", response);
                if(requestPayload.id_employee) {
                    alert("Employee updated successfully!");
                } else {
                    alert("Employee added successfully!");
                }
                employeeModal.modal('hide');
                loadEmployees();
                $('.error-message').hide().find('.error-text').text('');
                $('.form-control').removeClass('is-invalid');
            },
            error: function(xhr, status, error) {
                console.error("Error details:", xhr.responseText);
                alert("Error while saving employee: " + error);
            }
        });
    }
});

// Clear form and errors on modal close
employeeModal.on('hide.bs.modal', function(){
    $("#employeeForm")[0].reset();
    $('.error-message').hide().find('.error-text').text('');
    $('.form-control').removeClass('is-invalid');
});

$("#empl_surname, #empl_name, #empl_patronymic, #empl_role, #salary, #date_of_birth, #date_of_start, #phone_number, #city, #street, #zip_code").on('input change', function() {
    const field = $(this).attr('id');
    $(`#${field}`).removeClass('is-invalid');
    $(`#${field}_error`).hide();
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
                loadEmployees();
            } else {
                alert("Error: Could not delete employee.");
            }
        }).fail(function(xhr){
            alert("Error: " + (xhr.responseJSON ? xhr.responseJSON.message : "Error while deleting employee"));
        });
    }
});

// Sort employees
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

// Search by surname
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

// Find employees who never sold promotional products to non-card holders
$("#findEmployeesNeverSoldPromotional").on("click", function () {
    $.get('/getEmployeesNeverSoldPromotionalToNonCardHolders', function (response) {
        var tableBody = $("#neverSoldPromotionalTable").find('tbody');
        tableBody.empty();
        $("#noResultsMessage").hide();

        if (response && response.length > 0) {
            var table = '';
            $.each(response, function(index, employee) {
                table += '<tr>' +
                    '<td>' + employee.id_employee + '</td>' +
                    '<td>' + employee.empl_surname + '</td>' +
                    '<td>' + employee.empl_name + '</td>' +
                    '<td>' + employee.empl_role + '</td>' +
                    '<td>' + employee.phone_number + '</td>' +
                    '</tr>';
            });
            tableBody.html(table);
            neverSoldPromotionalModal.modal('show');
        } else {
            $("#noResultsMessage").show();
            neverSoldPromotionalModal.modal('show');
        }
    }).fail(function () {
        $("#noResultsMessage").html("Error while fetching employees.").show();
        neverSoldPromotionalModal.modal('show');
    });
});

// Validate employee form
function validateEmployeeForm() {
    let isValid = true;
    const errors = {};

    $('.error-message').hide().find('.error-text').text('');
    $('.is-invalid').removeClass('is-invalid');

    const surname = $('#empl_surname').val().trim();
    if (!surname) {
        errors.empl_surname = 'Заповніть це поле. Приклад: Smith';
        isValid = false;
    } else if (surname.length > 50) {
        errors.empl_surname = 'Прізвище не може перевищувати 50 символів.';
        isValid = false;
    } else if (!/^[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?$/.test(surname)) {
        errors.empl_surname = 'Прізвище має починатися з великої літери, після дефіса наступна частина також з великої (тільки літери, апострофи або дефіси). Приклад: Smith або Smith-Jones';
        isValid = false;
    }

    const name = $('#empl_name').val().trim();
    if (!name) {
        errors.empl_name = 'Заповніть це поле. Приклад: Tom';
        isValid = false;
    } else if (name.length > 50) {
        errors.empl_name = 'Ім\'я не може перевищувати 50 символів.';
        isValid = false;
    } else if (!/^[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?$/.test(name)) {
        errors.empl_name = 'Ім\'я має починатися з великої літери, після дефіса наступна частина також з великої (тільки літери, апострофи або дефіси). Приклад: Tom або Mary-Jane';
        isValid = false;
    }

    const patronymic = $('#empl_patronymic').val().trim();
    if (patronymic && patronymic.length > 50) {
        errors.empl_patronymic = 'По батькові не може перевищувати 50 символів.';
        isValid = false;
    } else if (patronymic && !/^[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?$/.test(patronymic)) {
        errors.empl_patronymic = 'По батькові має починатися з великої літери, після дефіса наступна частина також з великої (тільки літери, апострофи або дефіси). Приклад: Ivanovich';
        isValid = false;
    }

    const role = $('#empl_role').val();
    if (!role) {
        errors.empl_role = 'Оберіть роль (Cashier або Manager).';
        isValid = false;
    }

    const salary = $('#salary').val().trim();
    if (!salary) {
        errors.salary = 'Заповніть це поле. Приклад: 500.00';
        isValid = false;
    } else {
        const salaryNum = parseFloat(salary);
        if (isNaN(salaryNum) || salaryNum < 0) {
            errors.salary = 'Зарплата має бути невід\'ємним числом. Приклад: 500.00';
            isValid = false;
        }
    }

    const birthDate = $('#date_of_birth').val();
    if (!birthDate) {
        errors.date_of_birth = 'Заповніть це поле. Формат: РРРР-ММ-ДД';
        isValid = false;
    } else {
        const birth = new Date(birthDate);
        const today = new Date();
        const age = (today - birth) / (1000 * 60 * 60 * 24 * 365);
        if (birth > today) {
            errors.date_of_birth = 'Дата народження не може бути в майбутньому.';
            isValid = false;
        } else if (age < 18 || age > 135) {
            errors.date_of_birth = 'Працівник має бути віком від 18 до 135 років.';
            isValid = false;
        }
    }

    const startDate = $('#date_of_start').val();
    if (!startDate) {
        errors.date_of_start = 'Заповніть це поле. Формат: РРРР-ММ-ДД';
        isValid = false;
    } else if (new Date(startDate) > new Date()) {
        errors.date_of_start = 'Дата початку роботи не може бути в майбутньому.';
        isValid = false;
    }

    const phone = $('#phone_number').val().trim();
    if (!/^\+\d{12}$/.test(phone)) {
        errors.phone_number = 'Номер телефону має бути у форматі +XXXXXXXXXXXX (12 цифр). Приклад: +380123456789';
        isValid = false;
    }

    const city = $('#city').val().trim();
    if (!city) {
        errors.city = 'Заповніть це поле. Приклад: Kyiv';
        isValid = false;
    } else if (city.length > 50) {
        errors.city = 'Назва міста не може перевищувати 50 символів.';
        isValid = false;
    } else if (!/^[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)?$/.test(city)) {
        errors.city = 'Місто має починатися з великої літери, після дефіса наступна частина також з великої (тільки літери, апострофи або дефіси). Приклад: Kyiv або Nova-Kahovka';
        isValid = false;
    }

    const street = $('#street').val().trim();
    if (!street) {
        errors.street = 'Заповніть це поле. Приклад: Main-Street, 123';
        isValid = false;
    } else if (!/^([A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)([-\s][A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*,\s\d{1,3}[A-ZА-ЯІЇЄҐ]?$/.test(street)) {
        errors.street = 'Вулиця має починатися з великої літери, після дефіса або пробілу наступна частина також з великої, після коми — номер (до 3 цифр). Приклад: Main-Street, 123';
        isValid = false;
    }

    const zipCode = $('#zip_code').val().trim();
    if (!zipCode) {
        errors.zip_code = 'Заповніть це поле. Приклад: 12345';
        isValid = false;
    } else if (zipCode.length !== 5 || !/^\d+$/.test(zipCode)) {
        errors.zip_code = 'Поштовий індекс має складатися з 5 цифр. Приклад: 12345';
        isValid = false;
    }

    for (let field in errors) {
        $(`#${field}_error`).find('.error-text').text(errors[field]);
        $(`#${field}_error`).show();
        $(`#${field}`).addClass('is-invalid');
    }

    return isValid;
}