
// Налаштування Ajax для запобігання кешуванню
$.ajaxSetup({
    cache: false,
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    }
});


var productModal = $("#productModal");

// API endpoints
var productSaveApiUrl = '/insertProduct';
var productDeleteApiUrl = '/deleteProduct';

// Змінена функція для перевірки, чи це сторінка продуктів
function isProductPage() {
    return window.location.pathname === '/manage_product';
}

// Завантаження продуктів
function loadProducts(category_number = null, sorted = false) {
    // Перевірка чи це сторінка продуктів
    if (!isProductPage()) return;

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
                    '<td>'+ (product.producer || '') +'</td>'+
                    '<td><span class="btn btn-xs btn-primary edit-product">Edit</span> <span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
            });

            // Використовуємо специфічний ідентифікатор для таблиці продуктів
            $("#productsTable").find('tbody').empty().html(table);
        }
    });
}

// Оновлена document.ready функція за шаблоном
$(document).ready(function() {
    // Load products and filters when page loads
    if (isProductPage()) {
        loadProducts();
        loadCategoryFilter();

        // Setup event handlers for static buttons
        $('#addProductBtn').click(function() {
            productModal.find('.modal-title').text('Add New Product');
            $("#productForm")[0].reset();
            $("#id_product").val('');
            loadCategories();
            productModal.modal('show');
        });

        // Додати обробники подій для кнопок сортування
        $("#sortByNameBtn").click(function() {
            loadProducts(null, true);
        });

        $("#defaultDisplayBtn").click(function() {
            loadProducts(null, false);
        });

        // Фільтр за категоріями
        $("#categoryFilter").change(function() {
            const selectedCategory = $(this).val();
            loadProducts(selectedCategory, false);
        });

        // Save product button handler
        $("#saveProduct").click(saveProduct);

        // Reset form when modal is closed
        productModal.on('hide.bs.modal', function(){
            $("#productForm")[0].reset();
            $("#id_product").val('');
            productModal.find('.modal-title').text('Add New Product');
        });
    }
});

// Ініціалізація сторінки тільки якщо це сторінка продуктів
$(function () {
    if (isProductPage()) {
        loadCategoryFilter();
        loadProducts(null, false);

        // Додати обробники подій для кнопок сортування
        $("#sortByNameBtn").on("click", function() {
            loadProducts(null, true);
        });

        $("#defaultDisplayBtn").on("click", function() {
            loadProducts(null, false);
        });

        // Обробник для додавання нового продукту
        $('#addProductBtn').on('click', function() {
            productModal.find('.modal-title').text('Add New Product');
            $("#productForm")[0].reset();
            $("#id_product").val('');
            loadCategories();
            productModal.modal('show');
        });

        // Фільтр за категоріями
        $("#categoryFilter").on("change", function () {
            const selectedCategory = $(this).val();
            loadProducts(selectedCategory, false);
        });
    }
});



// Обробник редагування продукту
$(document).on('click', '.edit-product', function() {
    var tr = $(this).closest('tr');
    var productId = tr.data('id');
    var productName = tr.data('name');
    var categoryNumber = tr.data('category');
    var characteristics = tr.data('char');
    var producer = tr.data('producer');

    // Заповнення форми даними продукту
    $("#id_product").val(productId);
    $("#product_name").val(productName);
    $("#characteristics").val(characteristics);
    $("#producer").val(producer);

    // Завантаження категорій і вибір потрібної
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

        // Встановлення правильної категорії після заповнення випадаючого списку
        $("#category_number").val(categoryNumber);
    });

    // Оновлення заголовка модалки та показ
    productModal.find('.modal-title').text('Edit Product');
    productModal.modal('show');
});

// Завантаження категорій перед відкриттям модалки
$('#productModal').on('show.bs.modal', function () {
    loadCategories();
});

// Збереження продукту
$("#saveProduct").on("click", function () {
    var data = $("#productForm").serializeArray();
    var requestPayload = {
        id_product: null,
        product_name: null,
        category_number: null,
        characteristics: null,
        producer: null
    };

    // Формування об'єкта з полів форми
    for (var i = 0; i < data.length; ++i) {
        var element = data[i];
        switch(element.name) {
            case 'id_product':
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
                requestPayload.producer = element.value;
                break;
        }
    }

    console.log("Sending product payload:", requestPayload);

    // Відправка POST-запиту
    $.ajax({
        type: "POST",
        url: productSaveApiUrl,
        data: {
            data: JSON.stringify(requestPayload)
        },
        success: function(response) {
            console.log("Response:", response);
            if(requestPayload.id_product) {
                alert("Product updated successfully!");
            } else {
                alert("Product saved successfully!");
            }
            productModal.modal('hide');
            loadProducts(null, false);
        },
        error: function(xhr, status, error) {
            console.error("Error details:", xhr.responseText);
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
            loadProducts(null, false);
        }).fail(function(xhr){
            console.error("Error details:", xhr.responseText);
            alert("Error while deleting product.");
        });
    }
});

// Завантаження категорій для форми
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

// Завантаження категорій для фільтру
function loadCategoryFilter() {
    // Перевірка чи це сторінка продуктів
    if (!isProductPage()) return;

    $.get('/getCategories', function(categories) {
        const $filter = $('#categoryFilter');
        if (!$filter.length) return;

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

// Скидання форми при закритті модалки
productModal.on('hide.bs.modal', function(){
    $("#productForm")[0].reset();
    $("#id_product").val('');
    productModal.find('.modal-title').text('Add New Product');
});