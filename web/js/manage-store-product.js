// Global variables
var storeProductModal = $("#storeProductModal");
var vatInfoModal = $("#vatInfoModal");
var productSelect = $("#id_product");
var productDetailModal = $("#productDetailModal");

// API URLs
const storeProductsApiUrl = "/getStoreProducts";
const storeProductSaveApiUrl = "/insertStoreProduct";
const storeProductDeleteApiUrl = "/deleteStoreProduct";
const makePromotionalApiUrl = "/makePromotional";
const updateQuantityApiUrl = "/updateProductQuantity";
const getVatInfoApiUrl = "/getProductVAT";
const getProductDetailByUpcApiUrl = "/getStoreProductByUPC";
const getPromotionalProductsSortedByQuantityApiUrl = "/getPromotionalProductsSortedByQuantity";
const getPromotionalProductsSortedByNameApiUrl = "/getPromotionalProductsSortedByName";
const getNonPromotionalProductsSortedByQuantityApiUrl = "/getNonPromotionalProductsSortedByQuantity";
const getNonPromotionalProductsSortedByNameApiUrl = "/getNonPromotionalProductsSortedByName";
const getAllProductsSortedByQuantityApiUrl = "/getAllProductsSortedByQuantity";
const generateUPCApiUrl = "/generateUPC";
const repriceStoreProductApiUrl = "/repriceStoreProduct";

let currentRole = null;
fetch('/api/employee_info', {
    method: 'GET',
    credentials: 'include'
})
.then(res => res.json())
.then(data => {
    currentRole = data.empl_role.toLowerCase();  // зберігаємо роль

    // Тепер все викликається після встановлення ролі
    loadStoreProducts();
    loadProductDropdown();
    initEventHandlers();
})
.catch(err => {
    console.error('Failed to fetch role:', err);
    alert('Could not load user role.');
});

$(function () {
    initTabNavigation(); // тільки вкладки
});

// Ініціалізація навігації по вкладкам з правильним завантаженням даних
function initTabNavigation() {
    // Очищення існуючих обробників кліків по вкладкам, щоб уникнути дублювання
    $('.tab-link').off('click');

    // Додавання нових обробників кліків
    $('.tab-link').on('click', function(e) {
        // Отримання цільової вкладки
        var targetTab = this.getAttribute('href') || this.getAttribute('data-target');

        // Очищення контейнера перед завантаженням нових даних
        clearPageData();

        // Завантаження відповідних даних в залежності від обраної вкладки
        if (targetTab.includes('store-products') || targetTab === '#store-products') {
            loadStoreProducts();
            updateFilterStatus("Фільтри не застосовано");
        } else if (targetTab.includes('categories') || targetTab === '#categories') {
            if (typeof loadCategories === 'function') {
                loadCategories();
            }
        } else if (targetTab.includes('products') || targetTab === '#products') {
            if (typeof loadProducts === 'function') {
                loadProducts();
            }
        } else if (targetTab.includes('customers') || targetTab === '#customers') {
            if (typeof loadCustomers === 'function') {
                loadCustomers();
            }
        }
        // Додайте інші вкладки за необхідності
    });
}

// Покращена функція clearPageData для очищення конкретних контейнерів
function clearPageData() {
    // Очищення основного контейнера даних
    $('#dataContainer').empty();

    // Очищення тіла таблиці продуктів
    $("table tbody").empty();

    // Скидання статусу фільтра
    $('#filterStatus').text("");

    // Скидання поля пошуку
    $('#upcSearch').val("");
}
// Load all store products
function loadStoreProducts() {
    $.get(storeProductsApiUrl, function (response) {
        renderProductsTable(response);
    });
}

// Render products table with the given data
function renderProductsTable(products) {
    if (products) {
        let table = '';
        $.each(products, function (index, product) {
            const promotionalClass = product.promotional_product == 1 ? 'promotional-product' : '';
            const priceWithVAT = parseFloat(product.selling_price).toFixed(2);
            const promotionalUPC = product.UPC_prom || '-';

            table += '<tr class="' + promotionalClass + '" data-upc="' + product.UPC +
                '" data-product-id="' + product.id_product +
                '" data-product-name="' + product.product_name +
                '" data-selling-price="' + product.selling_price +
                '" data-quantity="' + product.products_number +
                '" data-promotional="' + product.promotional_product +
                '" data-upc-prom="' + (product.UPC_prom || '') + '">' +
                '<td>' + product.UPC + '</td>' +
                '<td>' + promotionalUPC + '</td>' +
                '<td>' + product.product_name + '</td>' +
                '<td><span class="price-with-vat">' + priceWithVAT + '</span> <br>' +
                '<a href="#" class="show-vat-info" data-upc="' + product.UPC + '">VAT info</a></td>' +
                '<td>' + product.products_number + '</td>' +
                '<td>' + (product.promotional_product == 1 ? 'Yes' : 'No') + '</td>' +
                '<td>' +
                    '<div class="btn-group">';

            // Кнопка "Details" для всіх
            table += '<button class="btn btn-xs btn-info view-product-details">Details</button> ';

            // Кнопки для менеджера
            if (currentRole === 'manager') {
                table += '<button class="btn btn-xs btn-primary edit-store-product">Edit</button> ' +
                         '<button class="btn btn-xs btn-danger delete-store-product">Delete</button> ' +
                         '<button class="btn btn-xs btn-warning reprice-store-product">Reprice</button> ' +
                         (product.promotional_product == 1 ?
                            '<button class="btn btn-xs btn-warning make-non-promotional">Make Non-Promotional</button>' :
                            '<button class="btn btn-xs btn-success make-promotional">Make Promotional</button>'
                         );
            }

            table += '</div></td></tr>';
        });

        $("table").find('tbody').empty().html(table);
    }
}
$('#getAllStoreProductsSorted').on('click', function () {
    $.get("/getAllStoreProductsSorted", function (data) {
        renderProductsTable(data);  // використовує currentRole
        $("#filterStatus").text("All store products sorted by name");
    });
});

// Load products dropdown for store product form
// Load products dropdown for store product form
function loadProductDropdown() {
    $.get("/getAvailableProducts", function (response) {
        if (response) {
            productSelect.empty();
            productSelect.append('<option value="">Select product</option>');

            $.each(response, function (index, product) {
                productSelect.append(
                    $('<option></option>')
                        .attr('value', product.id_product)
                        .text(product.product_name)
                );
            });
        }
    });
}

$('#storeProductModal').on('show.bs.modal', function(e) {
    var modalTitle = $(this).find('.modal-title').text();
    if (modalTitle === 'Add New Store Product') {
        // Очищаємо поле UPC
        $('#UPC').val('');
        // Запитуємо новий UPC
        $.get(generateUPCApiUrl, function(response) {
            if (response.success) {
                $('#UPC').val(response.upc);
                $('#UPC').prop('readonly', true); // Робимо поле тільки для читання
            } else {
                alert('Error generating UPC: ' + response.error);
            }
        });
    }
    $('.error-message').hide().find('.error-text').text(''); // Очищаємо повідомлення про помилки
    $('.is-invalid').removeClass('is-invalid'); // Очищаємо підсвічування
});

// Initialize all event handlers
function initEventHandlers() {
    // Add new store product button
    $('#storeProductModal button.btn-primary').on('click', saveStoreProduct);

    // Edit store product
    $(document).on('click', '.edit-store-product', function() {
        var tr = $(this).closest('tr');
        openEditStoreProductModal(tr);
    });

    // View product details
    $(document).on('click', '.view-product-details', function() {
        var tr = $(this).closest('tr');
        var upc = tr.data('upc');
        viewProductDetails(upc);
    });

    // Delete store product
    $(document).on('click', '.delete-store-product', function() {
        var tr = $(this).closest('tr');
        deleteStoreProduct(tr);
    });
    $(document).on('click', '.reprice-store-product', function() {
        var tr = $(this).closest('tr');
        openRepriceModal(tr);
    });
    // Make product promotional
    $(document).on('click', '.make-promotional', function() {
        var tr = $(this).closest('tr');
        makeProductPromotional(tr, true);
    });

    // Make product non-promotional
    $(document).on('click', '.make-non-promotional', function() {
        var tr = $(this).closest('tr');
        makeProductPromotional(tr, false);
    });

    // Show VAT info
    $(document).on('click', '.show-vat-info', function(e) {
        e.preventDefault();
        var upc = $(this).data('upc');
        showVatInfo(upc);
    });

    // Filter promotional products by quantity
    $('#filterPromotionalByQuantity').on('click', function() {
        $.get(getPromotionalProductsSortedByQuantityApiUrl, function(response) {
            renderProductsTable(response);
            updateFilterStatus("Promotional products sorted by quantity");
        });
    });
// Фільтр непромоційних продуктів, які не належать до категорії 1
$('#filterNonPromotionalNotInCategory').on('click', function () {
    $.get('/get_non_promotional_products_not_in_category', { category_number: 1 }, function (response) {
        if (response && response.length > 0) {
            renderNonPromotionalModal(response);
            $('#nonPromotionalModal').modal('show');
        } else {
            alert('No products found for the specified criteria.');
        }
    }).fail(function (xhr) {
        alert('Error retrieving products: ' + xhr.responseText);
    });
});
    // Filter promotional products by name
    $('#filterPromotionalByName').on('click', function() {
        $.get(getPromotionalProductsSortedByNameApiUrl, function(response) {
            renderProductsTable(response);
            updateFilterStatus("Promotional products sorted by name");
        });
    });

    // Filter non-promotional products by quantity
    $('#filterNonPromotionalByQuantity').on('click', function() {
        $.get(getNonPromotionalProductsSortedByQuantityApiUrl, function(response) {
            renderProductsTable(response);
            updateFilterStatus("Non-promotional products sorted by quantity");
        });
    });

    // Filter non-promotional products by name
    $('#filterNonPromotionalByName').on('click', function() {
        $.get(getNonPromotionalProductsSortedByNameApiUrl, function(response) {
            renderProductsTable(response);
            updateFilterStatus("Non-promotional products sorted by name");
        });
    });

    // Filter all products by quantity
    $('#filterAllByQuantity').on('click', function() {
        $.get(getAllProductsSortedByQuantityApiUrl, function(response) {
            renderProductsTable(response);
            updateFilterStatus("All products sorted by quantity");
        });
    });

    // Reset filters (load all products)
    $('#resetFilters').on('click', function() {
        loadStoreProducts();
        updateFilterStatus("No filter applied");
    });

    // Search by UPC
    $('#searchByUPC').on('click', function() {
        var upc = $('#upcSearch').val().trim();
        if (upc) {
            viewProductDetails(upc);
        } else {
            alert('Please enter a UPC to search');
        }
    });

    // Checkbox for promotional product in form
    $('#promotional_product').on('change', function() {
        var isChecked = $(this).is(':checked');

        // If checked, enable UPC_prom field and calculate promotional price
        if (isChecked) {
            $('#UPC_prom').prop('disabled', false);

            // If there's a price, calculate promotional price (20% discount)
            var currentPrice = parseFloat($('#selling_price').val());
            if (!isNaN(currentPrice)) {
                var promotionalPrice = (currentPrice * 0.8).toFixed(4);
                $('#selling_price').val(promotionalPrice);
            }
        } else {
            // If unchecked, disable UPC_prom field and revert price
            $('#UPC_prom').prop('disabled', true);

            // If there's a price, calculate non-promotional price
            var currentPrice = parseFloat($('#selling_price').val());
            if (!isNaN(currentPrice)) {
                var normalPrice = (currentPrice / 0.8).toFixed(4);
                $('#selling_price').val(normalPrice);
            }
        }
    });
    // Прибирати помилки при введенні в поля
    $('#UPC, #UPC_prom, #id_product, #selling_price, #products_number').on('input change', function() {
        const field = $(this).attr('id');
        $(`#${field}`).removeClass('is-invalid');
        $(`#${field}_error`).hide();
    });
}

// Update filter status text
function updateFilterStatus(statusText) {
    $('#filterStatus').text(statusText);
}

function openRepriceModal(tr) {
    var upc = tr.data('upc');
    var productName = tr.data('product-name');
    var currentPrice = tr.data('selling-price');

    // Створюємо модальне вікно для переоцінки
    var modalHtml = `
        <div class="modal fade" id="repriceModal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Reprice Product: ${productName}</h5>
                    </div>
                    <div class="modal-body">
                        <form id="repriceForm">
                            <div class="form-group">
                                <label>UPC</label>
                                <input class="form-control" id="repriceUPC" value="${upc}" readonly>
                            </div>
                            <div class="form-group">
                                <label>Current Price</label>
                                <input class="form-control" value="${currentPrice}" readonly>
                            </div>
                            <div class="form-group">
                                <label>New Price</label>
                                <input class="form-control" id="newPrice" type="number" step="0.0001" required>
                                <small class="text-muted">Price includes 20% VAT</small>
                            </div>
                            <div class="form-group">
                                <label>Additional Quantity (optional)</label>
                                <input class="form-control" id="additionalQuantity" type="number" value="0">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" id="saveReprice">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Додаємо модальне вікно до DOM
    $('body').append(modalHtml);
    var repriceModal = $('#repriceModal');
    repriceModal.modal('show');

    // Обробник збереження переоцінки
    $('#saveReprice').on('click', function() {
        var newPrice = $('#newPrice').val();
        var additionalQuantity = $('#additionalQuantity').val();

        if (!newPrice) {
            alert('New price is required');
            return;
        }

        $.ajax({
            url: repriceStoreProductApiUrl,
            type: 'POST',
            data: {
                upc: upc,
                new_price: newPrice,
                additional_quantity: additionalQuantity
            },
            success: function(response) {
                if (response.success) {
                    alert('Product repriced successfully');
                    repriceModal.modal('hide');
                    loadStoreProducts();
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(xhr) {
                alert('Error repricing product: ' + xhr.responseText);
            }
        });
    });

    // Видаляємо модальне вікно після закриття
    repriceModal.on('hidden.bs.modal', function() {
        repriceModal.remove();
    });
}

// View product details by UPC
function viewProductDetails(upc) {
    $.ajax({
        url: getProductDetailByUpcApiUrl,
        type: 'GET',
        data: { upc: upc },
        success: function(response) {
            if (response) {
                // Format price with VAT
                const priceWithVAT = parseFloat(response.selling_price).toFixed(2);

                // Calculate price without VAT
                const priceWithoutVAT = (parseFloat(response.selling_price) / 1.2).toFixed(2);

                // Populate modal with product details
                $('#detailUPC').text(response.UPC);
                $('#detailPromUPC').text(response.UPC_prom || '-');
                $('#detailName').text(response.product_name);
                $('#detailPrice').text(priceWithVAT);
                $('#detailPriceNoVAT').text(priceWithoutVAT);
                $('#detailQuantity').text(response.products_number);
                $('#detailPromotional').text(response.promotional_product == 1 ? 'Yes' : 'No');

                // Цей рядок був проблемою - виправляємо його
                $('#detailCharacteristics').text(response.characteristics || 'N/A');
                $('#detailCategory').text(response.category_number || 'N/A');

                // Для відлагодження - виведіть вміст response в консоль
                console.log('Product details response:', response);

                // Show the modal
                productDetailModal.modal('show');
            } else {
                alert('Product not found with UPC: ' + upc);
            }
        },
        error: function(xhr) {
            alert('Error retrieving product details: ' + xhr.responseText);
        }
    });
}


// Open the store product modal for editing
function openEditStoreProductModal(tr) {
    // Get data from the row
    var upc = tr.data('upc');
    var productId = tr.data('product-id');
    var sellingPrice = tr.data('selling-price');
    var quantity = tr.data('quantity');
    var isPromotional = tr.data('promotional') == 1;
    var upcProm = tr.data('upc-prom');

    // Fill the form
    storeProductModal.find('.modal-title').text('Edit Store Product');
    $('#UPC').val(upc);
    $('#UPC').prop('readonly', true); // UPC can't be changed when editing
    $('#UPC_prom').val(upcProm);
    $('#id_product').val(productId);
    $('#selling_price').val(sellingPrice);
    $('#products_number').val(quantity);
    $('#promotional_product').prop('checked', isPromotional);

    // Enable/disable UPC_prom based on promotional status
    $('#UPC_prom').prop('disabled', !isPromotional);

    storeProductModal.modal('show');
    $('.error-message').hide().find('.error-text').text(''); // Очищаємо повідомлення про помилки
    $('.is-invalid').removeClass('is-invalid'); // Очищаємо підсвічування
}

// Save or update store product
function saveStoreProduct() {
    // Перевіряємо валідацію перед збереженням
    if (!validateStoreProductForm()) {
        return;
    }

    // Collect form data
    var formData = {
        UPC: $('#UPC').val(),
        UPC_prom: $('#UPC_prom').val() || null,
        id_product: $('#id_product').val(),
        selling_price: $('#selling_price').val(),
        products_number: $('#products_number').val(),
        promotional_product: $('#promotional_product').is(':checked') ? 1 : 0
    };

    // Validation (basic check already done in validateStoreProductForm)
    if (formData.promotional_product === 1 && !formData.UPC_prom) {
        // Generate promotional UPC if not provided
        formData.UPC_prom = 'P' + formData.UPC;
    }

    // Send data to server
    $.ajax({
        url: storeProductSaveApiUrl,
        type: 'POST',
        data: { data: JSON.stringify(formData) },
        success: function(response) {
            if (response.success) {
                alert('Store product saved successfully');
                storeProductModal.modal('hide');
                loadStoreProducts();

                // Reset form
                $('#storeProductForm')[0].reset();
                $('#UPC').prop('readonly', false);
                $('.error-message').hide().find('.error-text').text(''); // Очищаємо повідомлення після успіху
                $('.is-invalid').removeClass('is-invalid'); // Очищаємо підсвічування
            } else {
                alert('Error: ' + response.error);
            }
        },
        error: function(xhr) {
            alert('Error saving store product: ' + xhr.responseText);
        }
    });
}

// Delete store product
function deleteStoreProduct(tr) {
    var upc = tr.data('upc');
    var productName = tr.data('product-name');

    if (confirm('Are you sure you want to delete store product "' + productName + '" (UPC: ' + upc + ')?')) {
        $.ajax({
            url: storeProductDeleteApiUrl,
            type: 'POST',
            data: { upc: upc },
            success: function(response) {
                if (response.success) {
                    alert('Store product deleted successfully');
                    loadStoreProducts();
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(xhr) {
                alert('Error deleting store product: ' + xhr.responseText);
            }
        });
    }
}

// Make product promotional or non-promotional
function makeProductPromotional(tr, makePromotional) {
    var upc = tr.data('upc');
    var productName = tr.data('product-name');

    var action = makePromotional ? 'promotional' : 'non-promotional';
    if (confirm('Are you sure you want to make "' + productName + '" ' + action + '?')) {
        $.ajax({
            url: makePromotionalApiUrl,
            type: 'POST',
            data: {
                upc: upc,
                promotional: makePromotional
            },
            success: function(response) {
                if (response.success) {
                    alert('Product updated successfully');
                    loadStoreProducts();
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(xhr) {
                alert('Error updating product: ' + xhr.responseText);
            }
        });
    }
}

// Show VAT information modal
function showVatInfo(upc) {
    $.ajax({
        url: getVatInfoApiUrl,
        type: 'GET',
        data: { upc: upc },
        success: function(response) {
            if (response.success) {
                // Get product details from the table row
                var tr = $('tr[data-upc="' + upc + '"]');
                var productName = tr.data('product-name');

                // Calculate values
                var sellingPrice = parseFloat(response.selling_price);
                var vatAmount = parseFloat(response.vat_amount);
                var priceWithoutVAT = sellingPrice - vatAmount;

                // Populate modal
                $('#vatProductName').text(productName);
                $('#vatUPC').text(upc);
                $('#vatSellingPrice').text(sellingPrice.toFixed(2));
                $('#vatAmount').text(vatAmount.toFixed(2));
                $('#priceWithoutVAT').text(priceWithoutVAT.toFixed(2));

                // Show modal
                vatInfoModal.modal('show');
            } else {
                alert('Error: ' + response.message);
            }
        },
        error: function(xhr) {
            alert('Error retrieving VAT information: ' + xhr.responseText);
        }
    });
}

// Reset form when modal is closed
storeProductModal.on('hidden.bs.modal', function() {
    $('#storeProductForm')[0].reset();
    $('#UPC').prop('readonly', false);
    storeProductModal.find('.modal-title').text('Add New Store Product');
    $('.error-message').hide().find('.error-text').text(''); // Очищаємо повідомлення про помилки
    $('.is-invalid').removeClass('is-invalid'); // Очищаємо підсвічування
});

// Функція для валідації форми
function validateStoreProductForm() {
    let isValid = true;
    const errors = {};

    // Скидання попередніх повідомлень про помилки та підсвічування
    $('.error-message').hide().find('.error-text').text('');
    $('.is-invalid').removeClass('is-invalid');

    // Валідація UPC
    const UPC = $("#UPC").val().trim();
    if (!UPC) {
        errors.UPC = 'UPC є обов\'язковим полем.';
        isValid = false;
    } else if (!/^[A-Z0-9]{8,}$/.test(UPC)) {
        errors.UPC = 'UPC має містити щонайменше 8 символів (літери A-Z і цифри 0-9).';
        isValid = false;
    }

    // Валідація Promotional UPC (якщо промо-товар)
    const promotionalProduct = $("#promotional_product").is(':checked');
    const UPC_prom = $("#UPC_prom").val().trim();
    if (promotionalProduct && !UPC_prom) {
        errors.UPC_prom = 'Для промо-товару потрібен Promotional UPC.';
        isValid = false;
    } else if (UPC_prom && !/^[A-Z0-9]{8,}$/.test(UPC_prom)) {
        errors.UPC_prom = 'Promotional UPC має містити щонайменше 8 символів (літери A-Z і цифри 0-9).';
        isValid = false;
    }

    // Валідація Product
    const id_product = $("#id_product").val();
    if (!id_product) {
        errors.id_product = 'Оберіть продукт.';
        isValid = false;
    }

    // Валідація Selling Price
    const selling_price = $("#selling_price").val().trim();
    if (!selling_price) {
        errors.selling_price = 'Вкажіть ціну продажу.';
        isValid = false;
    } else if (isNaN(selling_price) || parseFloat(selling_price) <= 0) {
        errors.selling_price = 'Ціна продажу має бути додатним числом.';
        isValid = false;
    }

    // Валідація Quantity
    const products_number = $("#products_number").val().trim();
    if (!products_number) {
        errors.products_number = 'Вкажіть кількість.';
        isValid = false;
    } else if (isNaN(products_number) || parseInt(products_number) <= 0) {
        errors.products_number = 'Кількість має бути цілим додатним числом.';
        isValid = false;
    }

    // Відображення помилок і підсвічування
    for (let field in errors) {
        $(`#${field}_error`).find('.error-text').text(errors[field]);
        $(`#${field}_error`).show();
        $(`#${field}`).addClass('is-invalid');
    }

    return isValid;
}