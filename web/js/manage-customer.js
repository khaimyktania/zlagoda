var customerModal = $("#customerModal");

$(function () {
    loadCustomers();
});

// Додайте цей код у ваш JavaScript-файл
function clearPageData() {
    // Очистити всі відображувані дані
    document.getElementById('dataContainer').innerHTML = '';
    // Скинути всі форми
    document.querySelectorAll('form').forEach(form => form.reset());
}

// Викликайте цю функцію при переході між вкладками
document.querySelectorAll('.tab-link').forEach(link => {
    link.addEventListener('click', clearPageData);
});

// Load customers
function loadCustomers() {
    $.get('/getCustomers', function (response) {
        if(response) {
            var table = '';
            $.each(response, function(index, customer) {
                table += '<tr data-id="'+ customer.card_number +'" data-surname="'+ customer.cust_surname +'" data-name="'+ customer.cust_name +'">' +
                    '<td>'+ customer.card_number +'</td>'+
                    '<td>'+ customer.cust_surname + ' ' + customer.cust_name + ' ' + customer.cust_patronymic +'</td>'+
                    '<td>'+ customer.phone_number +'</td>'+
                    '<td>'+ customer.percent +'</td>'+
                    '<td><span class="btn btn-xs btn-primary edit-customer">Edit</span> <span class="btn btn-xs btn-danger delete-customer role-manager">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);

            // Повторно застосовуємо стилі лише для role-manager у таблиці
            fetch('/api/employee_info', {
                method: 'GET',
                credentials: 'include'
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch role');
                return res.json();
            })
            .then(data => {
                const role = data.empl_role.toLowerCase().replace(/cashier/i, 'cashier').replace(/manager/i, 'manager');
                console.log("Role in loadCustomers:", role); // Дебаг
                if (role === 'cashier') {
                    const hiddenElements = document.querySelectorAll('table .role-manager');
                    console.log("Hiding", hiddenElements.length, "role-manager elements in table"); // Дебаг
                    hiddenElements.forEach(el => {
                        el.style.display = 'none';
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching role in loadCustomers:', err);
            });
        }
    });
}

// Open modal for new customer
$('#addCustomerBtn').on('click', function() {
    customerModal.find('.modal-title').text('Add New Customer');
    $("#customerForm")[0].reset();
    // Enable card number field for new customers
    $("#card_number").prop('readonly', false);
    $('.error-message').hide().find('.error-text').text(''); // Очищаємо повідомлення про помилки
    $('.form-control').removeClass('is-invalid');
    customerModal.modal('show');
});

// Edit customer - add event handler for the dynamic edit button
$(document).on('click', '.edit-customer', function() {
    var row = $(this).closest('tr');
    var cardNumber = row.data('id');

    // Fetch the full customer data by ID
    $.get('/getCustomers', function(customers) {
        var customer = customers.find(c => c.card_number == cardNumber);

        if(customer) {
            // Fill the form with customer data
            $("#card_number").val(customer.card_number);
            // Make card number read-only when editing (as it's a primary key)
            $("#card_number").prop('readonly', true);
            $("#cust_surname").val(customer.cust_surname);
            $("#cust_name").val(customer.cust_name);
            $("#cust_patronymic").val(customer.cust_patronymic);
            $("#phone_number").val(customer.phone_number);
            $("#city").val(customer.city);
            $("#street").val(customer.street);
            $("#zip_code").val(customer.zip_code);
            $("#percent").val(customer.percent);

            // Update modal title and show
            customerModal.find('.modal-title').text('Edit Customer');
            $('.error-message').hide().find('.error-text').text(''); // Очищаємо повідомлення про помилки
            $('.form-control').removeClass('is-invalid');
            customerModal.modal('show');
        }
    });
});

// Save customer
$("#saveCustomer").on("click", function () {
    if (validateCustomerForm()) {
        var data = $("#customerForm").serializeArray();
        var requestPayload = {
            card_number: null,
            cust_surname: null,
            cust_name: null,
            cust_patronymic: null,
            phone_number: null,
            city: null,
            street: null,
            zip_code: null,
            percent: null
        };

        // Build object from form fields
        for (var i = 0; i < data.length; ++i) {
            var element = data[i];
            switch(element.name) {
                case 'card_number':
                    requestPayload.card_number = element.value;
                    break;
                case 'cust_surname':
                    requestPayload.cust_surname = element.value;
                    break;
                case 'cust_name':
                    requestPayload.cust_name = element.value;
                    break;
                case 'cust_patronymic':
                    requestPayload.cust_patronymic = element.value;
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
                case 'percent':
                    requestPayload.percent = element.value;
                    break;
            }
        }

        console.log("Sending payload:", requestPayload); // Debug logging

        // Send POST request
        $.ajax({
            type: "POST",
            url: '/insertCustomer',
            data: {
                data: JSON.stringify(requestPayload)
            },
            success: function(response) {
                console.log("Response:", response); // Debug logging
                if($("#card_number").prop('readonly')) {
                    alert("Customer updated successfully!");
                } else {
                    alert("Customer added successfully!");
                }
                customerModal.modal('hide');
                loadCustomers(); // refresh table
                $('.error-message').hide().find('.error-text').text('');
                $('.form-control').removeClass('is-invalid');

            },
            error: function(xhr, status, error) {
                console.error("Error details:", xhr.responseText); // Debug logging
                alert("Error while saving customer: " + error);
            }
        });
    }
});

// Delete customer
$(document).on("click", ".delete-customer", function () {
    var tr = $(this).closest('tr');
    var data = {
        card_number: tr.data('id')
    };
    var isDelete = confirm("Are you sure to delete customer with card " + tr.data('id') + " (" + tr.data('surname') + " " + tr.data('name') + ")?");
    if (isDelete) {
        $.post('/deleteCustomer', data, function(response){
            if(response.success) {
                alert("Customer deleted successfully.");
                loadCustomers(); // refresh table
            } else {
                alert("Error: Could not delete customer.");
            }
        }).fail(function(xhr){
            alert("Error: " + (xhr.responseJSON ? xhr.responseJSON.message : "Error while deleting customer"));
        });
    }
});

// Reset form and clear errors when modal is closed
customerModal.on('hide.bs.modal', function(){
    $("#customerForm")[0].reset();
    $('.error-message').hide().find('.error-text').text('');
    $('.form-control').removeClass('is-invalid');
});

// Clear error on input change
$("#card_number, #cust_surname, #cust_name, #cust_patronymic, #phone_number, #city, #street, #zip_code, #percent").on('input change', function() {
    const field = $(this).attr('id');
    $(`#${field}`).removeClass('is-invalid');
    $(`#${field}_error`).hide();
});

// Sort/filter functionality
$("#sortSelect").on("change", function () {
    var selectedOption = $(this).val();
    var url = '';

    switch(selectedOption) {
        case 'byName':
            url = '/getCustomersSorted';
            break;
        case 'premium':
            url = '/getPremiumCustomers';
            break;
        default:
            url = '/getCustomers';
            break;
    }

    $.get(url, function (response) {
        if(response) {
            var table = '';
            $.each(response, function(index, customer) {
                table += '<tr data-id="'+ customer.card_number +'" data-surname="'+ customer.cust_surname +'" data-name="'+ customer.cust_name +'">' +
                    '<td>'+ customer.card_number +'</td>'+
                    '<td>'+ customer.cust_surname + ' ' + customer.cust_name + ' ' + customer.cust_patronymic +'</td>'+
                    '<td>'+ customer.phone_number +'</td>'+
                    '<td>'+ customer.percent +'</td>'+
                    '<td><span class="btn btn-xs btn-primary edit-customer">Edit</span> <span class="btn btn-xs btn-danger delete-customer role-manager">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);

            // Повторно застосовуємо стилі лише для role-manager у таблиці
            fetch('/api/employee_info', {
                method: 'GET',
                credentials: 'include'
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch role');
                return res.json();
            })
            .then(data => {
                const role = data.empl_role.toLowerCase().replace(/cashier/i, 'cashier').replace(/manager/i, 'manager');
                console.log("Role in sortSelect:", role); // Дебаг
                if (role === 'cashier') {
                    const hiddenElements = document.querySelectorAll('table .role-manager');
                    console.log("Hiding", hiddenElements.length, "role-manager elements in table"); // Дебаг
                    hiddenElements.forEach(el => {
                        el.style.display = 'none';
                    });
                }
            })
            .catch(err => {
                console.error('Error fetching role in sortSelect:', err);
            });
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

    $.get('/getCustomerContactBySurname', { surname: surname }, function (response) {
        if (response) {
            $("#contactInfoResult").html(
                "<strong>Phone:</strong> " + response.phone_number + "<br>" +
                "<strong>Address:</strong> " + response.city + ", " + response.street + ", " + response.zip_code
            ).show();
        } else {
            $("#contactInfoResult").html("No customer found with that surname.").show();
        }
    }).fail(function () {
        $("#contactInfoResult").html("Error while fetching contact info.").show();
    });
});

// Function to validate customer form
function validateCustomerForm() {
    let isValid = true;
    const errors = {};

    // Скидання попередніх повідомлень про помилки
    $('.error-message').hide();

    // Валідація Card Number
    const cardNumber = $('#card_number').val().trim();
    if (!cardNumber) {
        errors.card_number = 'Заповніть це поле. Формат: 13 цифр. Приклад: 1234567890123';
        isValid = false;
    } else if (!/^\d{13}$/.test(cardNumber)) {
        errors.card_number = 'Номер картки має складатися з 13 цифр. Приклад: 1234567890123';
        isValid = false;
    }

    // Валідація Surname
    const surname = $('#cust_surname').val().trim();
    if (!surname) {
        errors.cust_surname = 'Заповніть це поле. Приклад: Smith';
        isValid = false;
    } else if (surname.length > 50) {
        errors.cust_surname = 'Прізвище не може перевищувати 50 символів.';
        isValid = false;
    } else if (!/^[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?$/.test(surname)) {
        errors.cust_surname = 'Прізвище має починатися з великої літери, після дефіса наступна частина також з великої (тільки літери, апострофи або дефіси). Приклад: Smith або Smith-Jones';
        isValid = false;
    }

    // Валідація Name
    const name = $('#cust_name').val().trim();
    if (!name) {
        errors.cust_name = 'Заповніть це поле. Приклад: Tom';
        isValid = false;
    } else if (name.length > 50) {
        errors.cust_name = 'Ім\'я не може перевищувати 50 символів.';
        isValid = false;
    } else if (!/^[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?$/.test(name)) {
        errors.cust_name = 'Ім\'я має починатися з великої літери, після дефіса наступна частина також з великої (тільки літери, апострофи або дефіси). Приклад: Tom або Mary-Jane';
        isValid = false;
    }

    // Валідація Patronymic
    const patronymic = $('#cust_patronymic').val().trim();
    if (patronymic && patronymic.length > 50) {
        errors.cust_patronymic = 'По батькові не може перевищувати 50 символів.';
        isValid = false;
    } else if (patronymic && !/^[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?$/.test(patronymic)) {
        errors.cust_patronymic = 'По батькові має починатися з великої літери, після дефіса наступна частина також з великої (тільки літери, апострофи або дефіси). Приклад: Ivanovich';
        isValid = false;
    }

    // Валідація Phone Number
    const phone = $('#phone_number').val().trim();
    if (!/^\+\d{12}$/.test(phone)) {
        errors.phone_number = 'Номер телефону має бути у форматі +XXXXXXXXXXXX (12 цифр). Приклад: +380123456789';
        isValid = false;
    }

    // Валідація Discount Percent
    const percent = $('#percent').val().trim();
    if (!percent) {
        errors.percent = 'Заповніть це поле. Приклад: 10';
        isValid = false;
    } else {
        const percentNum = parseFloat(percent);
        if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
            errors.percent = 'Відсоток знижки має бути числом від 0 до 100. Приклад: 10';
            isValid = false;
        }
    }

    // Валідація City
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

    // Валідація Street
    const street = $('#street').val().trim();
    if (!street) {
        errors.street = 'Заповніть це поле. Приклад: Main-Street, 123';
        isValid = false;
    } else if (!/^([A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)([-\s][A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*,\s\d{1,3}[A-ZА-ЯІЇЄҐ]?$/.test(street)) {
        errors.street = 'Вулиця має починатися з великої літери, після дефіса або пробілу наступна частина також з великої, після коми — номер (до 3 цифр). Приклад: Main-Street, 123';
        isValid = false;
    }

    // Валідація ZIP Code
    const zipCode = $('#zip_code').val().trim();
    if (!zipCode) {
        errors.zip_code = 'Заповніть це поле. Приклад: 12345';
        isValid = false;
    } else if (zipCode.length !== 5 || !/^\d+$/.test(zipCode)) {
        errors.zip_code = 'Поштовий індекс має складатися з 5 цифр. Приклад: 12345';
        isValid = false;
    }

    // Відображення помилок
    for (let field in errors) {
        $(`#${field}_error`).find('.error-text').text(errors[field]);
        $(`#${field}_error`).show();
        $(`#${field}`).addClass('is-invalid');
    }

    return isValid;
}