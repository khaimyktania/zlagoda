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
var searchProductByNameApiUrl = '/searchProductsByName';

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

    console.log("Loading products from URL:", url);

    // Додаємо параметр для запобігання кешуванню
    $.get(url + "?_=" + new Date().getTime(), function (response) {
        console.log("Products API response:", response);

        if (response && Array.isArray(response)) {
            let table = '';

            // Перевіряємо, чи є дані в масиві
            if (response.length === 0) {
                console.log("No products found in the response");
                $("#productsTable").find('tbody').html('<tr><td colspan="5">Немає доступних продуктів</td></tr>');
                return;
            }

            $.each(response, function (index, product) {
                // Захист від undefined полів
                const productName = product.product_name || '';
                const categoryNumber = product.category_number || '';
                const characteristics = product.characteristics || '';
                const producer = product.producer || '';

                table += '<tr data-id="'+ (product.id_product || '') +'" data-name="'+ productName +'" data-category="'+ categoryNumber +'" data-char="'+ characteristics +'" data-producer="'+ producer +'">' +
                    '<td>'+ productName +'</td>'+
                    '<td>'+ categoryNumber +'</td>'+
                    '<td>'+ characteristics +'</td>'+
                    '<td>'+ producer +'</td>'+
                    '<td><span class="btn btn-xs btn-primary edit-product">Edit</span> <span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
            });

            // Перевіряємо, чи існує таблиця
            const $productsTable = $("#productsTable");
            if ($productsTable.length === 0) {
                console.error("Product table with ID 'productsTable' not found in the DOM");
                alert("Error: Product table not found. Please check HTML structure.");
                return;
            }

            const $tbody = $productsTable.find('tbody');
            if ($tbody.length === 0) {
                console.error("Table body not found within #productsTable");
                $productsTable.append('<tbody>' + table + '</tbody>');
            } else {
                $tbody.empty().html(table);
            }

            console.log("Products table updated with " + response.length + " rows");
        } else {
            console.error("Invalid response format:", response);
            $("#productsTable").find('tbody').html('<tr><td colspan="5">Помилка завантаження даних</td></tr>');
        }
    }).fail(function(xhr, status, error) {
        console.error("Error loading products:", error);
        console.error("Status:", status);
        console.error("Server response:", xhr.responseText);
        $("#productsTable").find('tbody').html('<tr><td colspan="5">Помилка: ' + error + '</td></tr>');
        alert("Error loading products: " + error);
    });
}

// Оновлена функція пошуку продуктів за назвою
// Modified updateSearchUI function to avoid duplicate display
function searchProductsByName(productName) {
    // Показуємо індикатор завантаження
    $("#productsTable").find('tbody').html('<tr><td colspan="5"><div class="text-center"><i class="zmdi zmdi-spinner zmdi-hc-spin"></i> Пошук...</div></td></tr>');

    // Скидаємо попередні результати
    resetSearchUI();

    // Встановлюємо текст запиту в елементах UI
    $("#searchQuery, #noResultsQuery").text(productName);

    $.ajax({
        url: searchProductByNameApiUrl,
        type: 'GET',
        data: { name: productName },
        success: function(response) {
            if (response && Array.isArray(response)) {
                // Якщо результати пошуку порожні
                if (response.length === 0) {
                    $("#productsTable").find('tbody').html('<tr><td colspan="5">За вашим запитом "' + productName + '" продукти не знайдено</td></tr>');
                    $("#noResultsMessage").show();
                    return;
                }

                // Оновлюємо основну таблицю продуктів
                updateProductsTable(response);

                // Оновлюємо статистику пошуку
                updateSearchStatistics(response);

                // Показуємо блок результатів пошуку
                $("#searchResults").show();
                console.log("Products table updated with " + response.length + " search results");
            } else {
                console.error("Invalid response format:", response);
                $("#productsTable").find('tbody').html('<tr><td colspan="5">Помилка при пошуку</td></tr>');
            }
        },
        error: function(xhr, status, error) {
            console.error("Error searching products:", error);
            $("#productsTable").find('tbody').html('<tr><td colspan="5">Помилка при пошуку: ' + error + '</td></tr>');
            alert('Error searching products: ' + xhr.responseText);
        }
    });
}


// Оновлена document.ready функція
$(document).ready(function() {
    console.log("Document ready, checking if product page:", isProductPage());
    // Load products and filters when page loads
    if (isProductPage()) {
        console.log("This is a product page, loading products and filters");

        // Перевірка наявності таблиці
        if ($("#productsTable").length === 0) {
            console.error("Product table with ID 'productsTable' not found in the DOM");
            alert("Error: Product table not found. Please check HTML structure.");
        }

        loadProducts();
        loadCategoryFilter();

        // Setup event handlers for buttons - FIXED by removing data-toggle from HTML
        $('#addProductBtn').on('click', function() {
            console.log("Add Product button clicked");
            productModal.find('.modal-title').text('Add New Product');
            $("#productForm")[0].reset();
            $("#id_product").val('');
            loadCategories();
            productModal.modal('show'); // Make sure this line executes
        });

        // Додати обробники подій для кнопок сортування
        $("#sortByNameBtn").on("click", function() {
            loadProducts(null, true);
        });

        $("#defaultDisplayBtn").on("click", function() {
            loadProducts(null, false);
        });

        // Фільтр за категоріями
        $("#categoryFilter").on("change", function() {
            const selectedCategory = $(this).val();
            loadProducts(selectedCategory, false);
        });

        // Ініціалізація пошуку
        initSearchForm();

        // Повернення до всіх продуктів
        $("#backToAllProducts").on("click", function() {
            resetSearchUI();
            loadProducts();
        });

        // Save product button handler
        $("#saveProduct").on("click", function() {
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

            // Перевірка обов'язкових полів
            if (!requestPayload.product_name || !requestPayload.characteristics ||
                !requestPayload.category_number || !requestPayload.producer) {
                alert("Заповніть усі обов'язкові поля!");
                return;
            }

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

        // Reset form when modal is closed
        productModal.on('hide.bs.modal', function(){
            $("#productForm")[0].reset();
            $("#id_product").val('');
            productModal.find('.modal-title').text('Add New Product');
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

    console.log("Editing product:", {
        id: productId,
        name: productName,
        category: categoryNumber,
        characteristics: characteristics,
        producer: producer
    });

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
        if (!$filter.length) {
            console.error("Category filter with ID 'categoryFilter' not found");
            return;
        }

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

// Ініціалізація форми пошуку
function initSearchForm() {
    // Search form submission
    $("#searchForm").on("submit", function(e) {
        e.preventDefault();
        const searchTerm = $("#searchInput").val().trim();

        if (searchTerm === "") {
            alert("Please enter a product name to search");
            return;
        }

        searchProductsByName(searchTerm);
    });

    // Clear search button
    $("#clearSearchBtn").on("click", function() {
        $("#searchInput").val("");
        resetSearchUI();
        loadProducts();
    });
}

// Оновлення основної таблиці продуктів з результатами пошуку
function updateProductsTable(products) {
    let tableContent = '';

    $.each(products, function(index, product) {
        // Захист від undefined полів
        const productName = product.product_name || '';
        const categoryNumber = product.category_number || '';
        const characteristics = product.characteristics || '';
        const producer = product.producer || '';

        tableContent += '<tr data-id="' + (product.id_product || '') + '" data-name="' + productName + '" data-category="' + categoryNumber + '" data-char="' + characteristics + '" data-producer="' + producer + '">' +
            '<td>' + productName + '</td>' +
            '<td>' + categoryNumber + '</td>' +
            '<td>' + characteristics + '</td>' +
            '<td>' + producer + '</td>' +
            '<td><span class="btn btn-xs btn-primary edit-product">Edit</span> <span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
    });

    $("#productsTable").find('tbody').html(tableContent);
}

// Оновлення таблиці результатів пошуку
function updateSearchResultsTable(products) {
    let tableContent = '';

    $.each(products, function(index, product) {
        // Захист від undefined полів
        const productName = product.product_name || '';
        const categoryNumber = product.category_number || '';
        const characteristics = product.characteristics || '';
        const producer = product.producer || '';

        tableContent += '<tr data-id="' + (product.id_product || '') + '" data-name="' + productName + '" data-category="' + categoryNumber + '" data-char="' + characteristics + '" data-producer="' + producer + '">' +
            '<td>' + productName + '</td>' +
            '<td>' + categoryNumber + '</td>' +
            '<td>' + characteristics + '</td>' +
            '<td>' + producer + '</td>' +
            '<td><span class="btn btn-xs btn-primary edit-product">Edit</span> <span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
    });

    $("#searchResultsTable").find('tbody').html(tableContent);
}

// Оновлення статистики пошуку
function updateSearchStatistics(products) {
    const totalResults = products.length;

    // Підрахунок унікальних категорій та виробників
    const uniqueCategories = new Set();
    const uniqueProducers = new Set();

    $.each(products, function(index, product) {
        if (product.category_number) uniqueCategories.add(product.category_number);
        if (product.producer) uniqueProducers.add(product.producer);
    });

    // Оновлення елементів UI з підрахунками
    $("#searchResultsCount, #totalResultsCount").text(totalResults);
    $("#categoriesFoundCount").text(uniqueCategories.size);
    $("#producersFoundCount").text(uniqueProducers.size);
}

// Скидання елементів UI пошуку
function resetSearchUI() {
    $("#searchResults, #noResultsMessage").hide();
    $("#searchResultsTable").find('tbody').empty();
    $("#totalResultsCount, #categoriesFoundCount, #producersFoundCount").text("0");
}

// Ця функція забезпечує правильну ініціалізацію пошуку
// при навігації на сторінку після первинного завантаження
$(window).on('hashchange', function() {
    if (isProductPage()) {
        initSearchForm();
    }
});