var productModal = $("#productModal");

$(function () {
    loadProducts();
});

// Завантаження продуктів
function loadProducts() {
    $.get(productListApiUrl, function (response) {
        if(response) {
            var table = '';
            $.each(response, function(index, product) {
                table += '<tr data-id="'+ product.id_product +'" data-name="'+ product.product_name +'" data-category="'+ product.category_number +'" data-char="'+ product.characteristics +'">' +
                    '<td>'+ product.product_name +'</td>'+
                    '<td>'+ product.category_number +'</td>'+
                    '<td>'+ product.characteristics +'</td>'+
                    '<td><span class="btn btn-xs btn-primary edit-product">Edit</span> <span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
}

// Open modal for new product
$('#addProductBtn').on('click', function() {
    productModal.find('.modal-title').text('Add New Product');
    $("#productForm")[0].reset();
    $("#id_product").val(''); // Ensure ID is empty for new product
    productModal.modal('show');
});

// Edit product - add event handler for the dynamic edit button
$(document).on('click', '.edit-product', function() {
    var tr = $(this).closest('tr');
    var productId = tr.data('id');
    var productName = tr.data('name');
    var categoryNumber = tr.data('category');
    var characteristics = tr.data('char');

    // Fill the form with product data
    $("#id_product").val(productId);
    $("#product_name").val(productName);
    $("#characteristics").val(characteristics);

    // Load categories and then select the right one
    $.get('/getCategories', function(categories) {
        const $dropdown = $('#category_number');
        $dropdown.empty();
        $dropdown.append('<option value="">Select category</option>');

        categories.forEach(function(category) {
            $dropdown.append(
                $('<option></option>')
                    .attr('value', category.category_number)
                    .text(category.name)
            );
        });

        // Set the correct category after populating the dropdown
        $("#category_number").val(categoryNumber);
    });

    // Update modal title and show
    productModal.find('.modal-title').text('Edit Product');
    productModal.modal('show');
});

$('#productModal').on('show.bs.modal', function () {
    loadCategories();
});

// Збереження продукту
$("#saveProduct").on("click", function () {
    var data = $("#productForm").serializeArray();
    var requestPayload = {
        id_product: null,  // Added for edit functionality
        product_name: null,
        category_number: null,
        characteristics: null
    };

    // Формуємо об'єкт з полів форми
    for (var i = 0; i < data.length; ++i) {
        var element = data[i];
        switch(element.name) {
            case 'id_product':  // Added for edit functionality
                requestPayload.id_product = element.value;
                break;
            case 'product_name':
                requestPayload.product_name = element.value;
                break;
            case 'category_number':
                requestPayload.category_number = element.value;
                break;
            case 'characteristics':
                requestPayload.characteristics = element.value;
                break;
        }
    }

    console.log("Sending product payload:", requestPayload); // Debug logging

    // Відправка POST-запиту
    $.ajax({
        type: "POST",
        url: productSaveApiUrl,
        data: {
            data: JSON.stringify(requestPayload)
        },
        success: function(response) {
            console.log("Response:", response); // Debug logging
            if(requestPayload.id_product) {
                alert("Product updated successfully!");
            } else {
                alert("Product saved successfully!");
            }
            productModal.modal('hide');
            loadProducts(); // оновити таблицю
        },
        error: function(xhr, status, error) {
            console.error("Error details:", xhr.responseText); // Debug logging
            alert("Error while saving product: " + error);
        }
    });
});

// Видалення продукту
$(document).on("click", ".delete-product", function () {
    var tr = $(this).closest('tr');
    var data = {
        product_id : tr.data('id')
    };
    var isDelete = confirm("Are you sure to delete " + tr.data('name') + "?");
    if (isDelete) {
        $.post(productDeleteApiUrl, data, function(response){
            alert("Product deleted.");
            loadProducts(); // оновити таблицю
        }).fail(function(xhr){
            console.error("Error details:", xhr.responseText);
            alert("Error while deleting product.");
        });
    }
});

function loadCategories() {
    $.get('/getCategories', function(categories) {
        const $dropdown = $('#category_number');
        // Only empty the dropdown if it's not already populated (for edit case)
        if ($dropdown.find('option[value="' + $("#category_number").val() + '"]').length === 0) {
            $dropdown.empty();
            $dropdown.append('<option value="">Select category</option>');

            categories.forEach(function(category) {
                $dropdown.append(
                    $('<option></option>')
                        .attr('value', category.category_number)
                        .text(category.name)
                );
            });
        }
    });
}

function loadProducts(category_number = null) {
    let url = category_number
        ? "/getProductsByCategory?category_number=" + category_number
        : "/getAllProductsSorted";

    $.get(url, function (response) {
        if (response) {
            let table = '';
            $.each(response, function (index, product) {
                table += '<tr data-id="'+ product.id_product +'" data-name="'+ product.product_name +'" data-category="'+ product.category_number +'" data-char="'+ product.characteristics +'">' +
                    '<td>'+ product.product_name +'</td>' +
                    '<td>'+ product.category_number +'</td>' +
                    '<td>'+ product.characteristics +'</td>' +
                    '<td><span class="btn btn-xs btn-primary edit-product">Edit</span> <span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
}

$("#categoryFilter").on("change", function () {
    const selectedCategory = $(this).val();
    loadProducts(selectedCategory);
});

// Категорії для фільтру
function loadCategoryFilter() {
    $.get('/getCategories', function(categories) {
        const $filter = $('#categoryFilter');
        $filter.empty().append('<option value="">All Categories</option>');
        categories.forEach(function(category) {
            $filter.append(
                $('<option></option>')
                    .attr('value', category.category_number)
                    .text(category.name)
            );
        });
    });
}

$(function () {
    loadCategoryFilter();
    loadProducts(); // початкове завантаження
});



// Скидання форми при закритті модалки
productModal.on('hide.bs.modal', function(){
    $("#productForm")[0].reset(); // скинути всю форму
    $("#id_product").val(''); // Clear the hidden ID field
    productModal.find('.modal-title').text('Add New Product');
});