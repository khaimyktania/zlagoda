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
var currentRole = null; // Зберігатиме роль користувача ('manager' або 'cashier')

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
            // Перевіряємо, чи є дані в масиві
            if (response.length === 0) {
                console.log("No products found in the response");
                $("#mainProductsContainer").html('<table class="table table-bordered" id="productsTable"><tbody><tr><td colspan="' + (currentRole === 'manager' ? 5 : 4) + '">Немає доступних продуктів</td></tr></tbody></table>');
                return;
            }

            // Викликаємо updateProductsTable для відображення продуктів
            updateProductsTable(response);

            console.log("Products table updated with " + response.length + " rows");
        } else {
            console.error("Invalid response format:", response);
            $("#mainProductsContainer").html('<table class="table table-bordered" id="productsTable"><tbody><tr><td colspan="' + (currentRole === 'manager' ? 5 : 4) + '">Помилка завантаження даних</td></tr></tbody></table>');
        }
    }).fail(function(xhr, status, error) {
        console.error("Error loading products:", error);
        console.error("Status:", status);
        console.error("Server response:", xhr.responseText);
        $("#mainProductsContainer").html('<table class="table table-bordered" id="productsTable"><tbody><tr><td colspan="' + (currentRole === 'manager' ? 5 : 4) + '">Помилка: ' + error + '</td></tr></tbody></table>');
        alert("Error loading products: " + error);
    });
}

// Оновлена функція пошуку продуктів за назвою
function searchProductsByName(productName) {
    // Показуємо індикатор завантаження
    $("#mainProductsContainer").html('<table class="table table-bordered" id="productsTable"><tbody><tr><td colspan="' + (currentRole === 'manager' ? 5 : 4) + '"><div class="text-center"><i class="zmdi zmdi-spinner zmdi-hc-spin"></i> Пошук...</div></td></tr></tbody></table>');

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
                    $("#mainProductsContainer").html('<table class="table table-bordered" id="productsTable"><tbody><tr><td colspan="' + (currentRole === 'manager' ? 5 : 4) + '">За вашим запитом "' + productName + '" продукти не знайдено</td></tr></tbody></table>');
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
                $("#mainProductsContainer").html('<table class="table table-bordered" id="productsTable"><tbody><tr><td colspan="' + (currentRole === 'manager' ? 5 : 4) + '">Помилка при пошуку</td></tr></tbody></table>');
            }
        },
        error: function(xhr, status, error) {
            console.error("Error searching products:", error);
            $("#mainProductsContainer").html('<table class="table table-bordered" id="productsTable"><tbody><tr><td colspan="' + (currentRole === 'manager' ? 5 : 4) + '">Помилка при пошуку: ' + error + '</td></tr></tbody></table>');
            alert('Error searching products: ' + xhr.responseText);
        }
    });
}

// Оновлення основної таблиці продуктів з результатами пошуку
function updateProductsTable(products) {
    let tableContent = '<table class="table table-bordered" id="productsTable"><thead><tr>' +
        '<th>Name</th>' +
        '<th>Category</th>' +
        '<th>Characteristics</th>' +
        '<th>Producer</th>';

    // Додаємо колонку "Actions" лише для ролі manager
    if (currentRole === 'manager') {
        tableContent += '<th style="width: 150px" class="role-manager">Action</th>';
    }

    tableContent += '</tr></thead><tbody>';

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
            '<td>' + producer + '</td>';

        // Додаємо кнопки "Edit" і "Delete" лише для ролі manager
        if (currentRole === 'manager') {
            tableContent += '<td class="role-manager"><span class="btn btn-xs btn-primary edit-product role-manager">Edit</span> <span class="btn btn-xs btn-danger delete-product role-manager">Delete</span></td>';
        }

        tableContent += '</tr>';
    });

    tableContent += '</tbody></table>';

    $("#mainProductsContainer").html(tableContent);
}

// Оновлення таблиці результатів пошуку (якщо використовується)
function updateSearchResultsTable(products) {
    let tableContent = '<table class="table table-bordered" id="searchResultsTable"><thead><tr>' +
        '<th>Name</th>' +
        '<th>Category</th>' +
        '<th>Characteristics</th>' +
        '<th>Producer</th>';

    // Додаємо колонку "Actions" лише для ролі manager
    if (currentRole === 'manager') {
        tableContent += '<th style="width: 150px" class="role-manager">Action</th>';
    }

    tableContent += '</tr></thead><tbody>';

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
            '<td>' + producer + '</td>';

        // Додаємо кнопки "Edit" і "Delete" лише для ролі manager
        if (currentRole === 'manager') {
            tableContent += '<td class="role-manager"><span class="btn btn-xs btn-primary edit-product role-manager">Edit</span> <span class="btn btn-xs btn-danger delete-product role-manager">Delete</span></td>';
        }

        tableContent += '</tr>';
    });

    tableContent += '</tbody></table>';

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

// Оновлена document.ready функція
$(document).ready(function() {
    console.log("Document ready, checking if product page:", isProductPage());
    // Load products and filters when page loads
    if (isProductPage()) {
        console.log("This is a product page, loading products and filters");
        initializeProductForm();

        loadProducts();
        loadCategoryFilter();

        // Setup event handlers for buttons
        $('#addProductBtn').on('click', function() {
            console.log("Add Product button clicked");
            productModal.find('.modal-title').text('Add New Product');
            $("#productForm")[0].reset();
            $("#id_product").val('');
            loadCategories();
            productModal.modal('show');
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

// Ця функція забезпечує правильну ініціалізацію пошуку
// при навігації на сторінку після первинного завантаження
$(window).on('hashchange', function() {
    if (isProductPage()) {
        initSearchForm();
    }
});

// Функція для валідації форми продукту
function validateProductForm() {
    let isValid = true;

    // Очищення попередніх повідомлень про помилки
    clearFormErrors();

    // Валідація product_name
    const productName = $("#product_name").val().trim();
    if (!productName) {
        markFieldAsInvalid("product_name", "Product name is required");
        isValid = false;
    }

    // Валідація category_number
    const categoryNumber = $("#category_number").val();
    if (!categoryNumber) {
        markFieldAsInvalid("category_number", "Please select a category");
        isValid = false;
    }

    // Валідація characteristics
    const characteristics = $("#characteristics").val().trim();
    if (!characteristics) {
        markFieldAsInvalid("characteristics", "Product characteristics are required");
        isValid = false;
    }

    // Валідація producer
    const producer = $("#producer").val().trim();
    if (!producer) {
        markFieldAsInvalid("producer", "Producer is required");
        isValid = false;
    }

    return isValid;
}

// Функція для позначення поля як невалідного
function markFieldAsInvalid(fieldId, errorMessage) {
    const field = $(`#${fieldId}`);
    const feedbackId = `${fieldId}Feedback`;

    // Перевіряємо, чи існує елемент зворотного зв'язку
    let feedbackElement = $(`#${feedbackId}`);

    // Якщо елемент зворотного зв'язку не існує, створюємо його
    if (feedbackElement.length === 0) {
        feedbackElement = $(`<div id="${feedbackId}" class="invalid-feedback"></div>`);
        field.after(feedbackElement);
    }

    // Додаємо клас is-invalid та стилі програмно
    field.addClass("is-invalid");
    field.css({
        'border': '2px solid #dc3545',
        'background-color': 'rgba(220, 53, 69, 0.05)',
        'box-shadow': '0 0 0 0.2rem rgba(220, 53, 69, 0.25)'
    });

    // Встановлюємо повідомлення про помилку та показуємо його

    console.log(`Field ${fieldId} marked as invalid with message: ${errorMessage}`);
}

// Функція для додавання необхідних елементів форми, якщо їх немає
function prepareFormValidation() {
    // Перевіряємо наявність полів зворотного зв'язку для всіх полів форми
    const formFields = ["product_name", "category_number", "characteristics", "producer"];

    formFields.forEach(field => {
        const feedbackId = `${field}Feedback`;
        if ($(`#${feedbackId}`).length === 0) {
            $(`#${field}`).after(`<div id="${feedbackId}" class="invalid-feedback" style="display: none;"></div>`);
        }
    });

    // Додаємо стилі валідації
    addValidationStyles();

    // Налаштовуємо обробники подій для полів форми
    setupFormValidation();
}

// Оновлений обробник для кнопки збереження
$(document).on("click", "#saveProduct", function(e) {
    e.preventDefault(); // Запобігаємо стандартній поведінці кнопки
    console.log("Save button clicked, validating form");

    // Перевіряємо, чи форма валідна
    if (!validateProductForm()) {
        console.log("Form validation failed");
        return; // Якщо форма не пройшла валідацію, припиняємо виконання
    }

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

            if (xhr.status === 400) {
                try {
                    // Спробуємо розпарсити відповідь сервера і відобразити помилки валідації
                    let response = JSON.parse(xhr.responseText);
                    if (response.validation_errors) {
                        clearFormErrors();

                        // Відображаємо кожну помилку від сервера
                        for (const field in response.validation_errors) {
                            markFieldAsInvalid(field, response.validation_errors[field]);
                        }
                    } else {
                        alert("Validation error: " + response.message || error);
                    }
                } catch (e) {
                    console.error("Error parsing response:", e);
                    alert("Error while saving product: " + error);
                }
            } else {
                alert("Error while saving product: " + error);
            }
        }
    });
});

// Ініціалізація форми - додаємо цей код до document.ready
function initializeProductForm() {
    console.log("Initializing product form");

    // Підготовка елементів форми для валідації
    prepareFormValidation();

    // Обробники подій при відкритті та закритті модального вікна
    productModal.on('show.bs.modal', function() {
        clearFormErrors();
        console.log("Modal showing, cleared form errors");
    });

    productModal.on('hide.bs.modal', function() {
        $("#productForm")[0].reset();
        $("#id_product").val('');
        productModal.find('.modal-title').text('Add New Product');
        clearFormErrors();
        console.log("Modal hiding, reset form and cleared errors");
    });
}

// Функція для динамічного додавання стилів валідації
function addValidationStyles() {
    // Перевіряємо, чи вже додані стилі
    if (!$('#validation-styles').length) {
        const styleElement = $('<style id="validation-styles">')
            .text(`
                input.is-invalid, select.is-invalid, textarea.is-invalid, .form-control.is-invalid {
                    border: 2px solid #dc3545 !important;
                    background-color: rgba(220, 53, 69, 0.05) !important;
                    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
                }
                .invalid-feedback {
                    color: #dc3545 !important;
                    display: block !important;
                    margin-top: 0.25rem !important;
                    font-size: 0.875em !important;
                }
            `);
        $('head').append(styleElement);
        console.log("Validation styles added programmatically");
    }
}

// Встановлення обробників полів форми
function setupFormValidation() {
    // Додаємо обробники для всіх полів форми
    $("#productForm .form-control").on("input blur", function() {
        validateField($(this));
    });
}

// Функція для очищення всіх помилок форми
function clearFormErrors() {
    const formFields = $("#productForm .form-control");
    formFields.removeClass("is-invalid");
    formFields.css({
        'border': '',
        'background-color': '',
        'box-shadow': ''
    });
    $(".invalid-feedback").hide();
    console.log("All form errors cleared");
}

// Функція для валідації окремого поля
function validateField(field) {
    const fieldId = field.attr('id');
    const feedbackElement = $(`#${fieldId}Feedback`);

    // Прибираємо помилку, якщо поле має значення
    if (field.val().trim()) {
        field.removeClass("is-invalid");
        field.css({
            'border': '',
            'background-color': '',
            'box-shadow': ''
        });
        feedbackElement.hide();
        console.log(`Field ${fieldId} validated successfully`);
    }
}

