var productModal = $("#productModal");

$(function () {
    loadProducts();
});

// Завантаження продуктів
function loadProducts(category_number = null, sorted = false) {
    let url;

    if (category_number) {
        url = "/getProductsByCategory?category_number=" + category_number;
    } else if (sorted) {
        url = "/getAllProductsSorted";
    } else {
        url = "/getProducts"; // Default endpoint for unsorted products
    }

    $.get(url, function (response) {
        if (response) {
            let table = '';
            $.each(response, function (index, product) {
                table += '<tr data-id="'+ product.id_product +'" data-name="'+ product.product_name +'" data-category="'+ product.category_number +'" data-char="'+ product.characteristics +'" data-producer="'+ (product.producer || '') +'">' +
                    '<td>'+ product.product_name +'</td>'+
                    '<td>'+ product.category_number +'</td>'+
                    '<td>'+ product.characteristics +'</td>'+
                    '<td>'+ (product.producer || '') +'</td>'+ // Added producer column with empty fallback
                    '<td><span class="btn btn-xs btn-primary edit-product">Edit</span> <span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
}

// Add event handler for Sort by Name button
$("#sortByNameBtn").on("click", function() {
    loadProducts(null, true); // Load products sorted by name
});

// Add event handler for default display button
$("#defaultDisplayBtn").on("click", function() {
    loadProducts(null, false); // Load products in default order
});

// Open modal for new product
$('#addProductBtn').on('click', function() {
    productModal.find('.modal-title').text('Add New Product');
    $("#productForm")[0].reset();
    $("#id_product").val(''); // Ensure ID is empty for new product
     // Завантажити категорії перед показом модалки
    loadCategories();
    productModal.modal('show');
});

// Edit product - add event handler for the dynamic edit button
$(document).on('click', '.edit-product', function() {
    var tr = $(this).closest('tr');
    var productId = tr.data('id');
    var productName = tr.data('name');
    var categoryNumber = tr.data('category');
    var characteristics = tr.data('char');
    var producer = tr.data('producer'); // Get producer value

    // Fill the form with product data
    $("#id_product").val(productId);
    $("#product_name").val(productName);
    $("#characteristics").val(characteristics);
    $("#producer").val(producer); // Set producer value

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
        characteristics: null,
        producer: null // Added producer field
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
            case 'producer':
                requestPayload.producer = element.value; // Get producer value
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
            loadProducts(null, false); // оновити таблицю без сортування
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
            loadProducts(null, false); // оновити таблицю без сортування
        }).fail(function(xhr){
            console.error("Error details:", xhr.responseText);
            alert("Error while deleting product.");
        });
    }
});

function loadCategories() {
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
    });
}

$("#categoryFilter").on("change", function () {
    const selectedCategory = $(this).val();
    loadProducts(selectedCategory, false); // фільтр за категорією без сортування
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
    loadProducts(null, false); // початкове завантаження без сортування
});

// Скидання форми при закритті модалки
productModal.on('hide.bs.modal', function(){
    $("#productForm")[0].reset(); // скинути всю форму
    $("#id_product").val(''); // Clear the hidden ID field
    productModal.find('.modal-title').text('Add New Product');
});