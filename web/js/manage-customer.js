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
                    '<td><span class="btn btn-xs btn-primary edit-customer">Edit</span> <span class="btn btn-xs btn-danger delete-customer">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
}

// Open modal for new customer
$('#addCustomerBtn').on('click', function() {
    customerModal.find('.modal-title').text('Add New Customer');
    $("#customerForm")[0].reset();
    // Enable card number field for new customers
    $("#card_number").prop('readonly', false);
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
            customerModal.modal('show');
        }
    });
});

// Save customer
$("#saveCustomer").on("click", function () {
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

    // Validate required fields
    if (!requestPayload.card_number || !requestPayload.cust_surname || !requestPayload.cust_name) {
        alert("Card number, surname and name are required fields!");
        return;
    }

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
        },
        error: function(xhr, status, error) {
            console.error("Error details:", xhr.responseText); // Debug logging
            alert("Error while saving customer: " + error);
        }
    });
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

// Reset form when modal is closed
customerModal.on('hide.bs.modal', function(){
    $("#customerForm")[0].reset();
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
                    '<td><span class="btn btn-xs btn-primary edit-customer">Edit</span> <span class="btn btn-xs btn-danger delete-customer">Delete</span></td></tr>';
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