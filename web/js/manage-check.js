// Glob// Global variables
let currentCheckItems = [];
let currentTotalAmount = 0;
let currentVAT = 0;
let employees = [];
let customers = [];
let storeProducts = [];
let currentUserRole = '';
let currentUserId = '';
let currentUserName = '';

// API endpoints
const API_ENDPOINTS = {
    GET_CHECKS: "/getRecentChecks",
    GET_CHECK_BY_NUMBER: "/getCheckByNumber",
    GET_CHECK_PRODUCTS: "/getCheckProducts",
    GET_CHECK_STATISTICS: "/getCheckStatistics",
    GET_EMPLOYEES: "/getAllEmployees",
     GET_CASHIERS: "/getCashiers",
    GET_CUSTOMERS: "/getAllCustomers",
    GET_STORE_PRODUCTS: "/getStoreProducts",
    GENERATE_CHECK_NUMBER: "/generateCheckNumber",
    INSERT_CHECK: "/insertCheck",
    DELETE_CHECK: "/deleteCheck",
    GET_CHECKS_BY_DATE_RANGE: "/getChecksByDateRange",
    GET_CASHIER_TOTAL_SALES: "/getCashierTotalSales",
    GET_PRODUCT_SALES_BY_NAME: "/api/product_sales_by_name",
    GET_CUSTOMER_PURCHASES: "/getCustomerPurchasesByDateRange"
};

// Function to show error in modal
function showErrorModal(message) {
    $('#error-message').text(message || 'An error occurred. Please try again.');
    $('#errorModal').modal('show');
}

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

// Initialize on document load
$(document).ready(function() {
    // Load initial data
     checkCurrentUserRole();
    loadCheckStatistics('all');
    loadRecentChecks();
        loadCashierFilter();
loadStoreProductsForSales();
    // Initialize event handlers
    initEventHandlers();

    // Set default dates for filters
    setDefaultDates();

    // Add validation for check number fields
    addCheckNumberValidation();

    // Додайте цей код до функції $(document).ready() або до ініціалізації сторінки



$('#calculate-sales-by-name').on('click', function() {
        calculateProductSalesByName();
    });

    setDefaultDatesForSales();

// Обробник для кнопки "Apply Filters"
$('#apply-cashier-filter').on('click', function() {
    applyFilters();
});

// Обробник для кнопки "Reset All"
$('#reset-date-filter').on('click', function() {
    // Скинути значення фільтрів
    $('#start-date').val('');
    $('#end-date').val('');

    // Скинути вибір касира, якщо користувач не є касиром
    if (currentUserRole.toLowerCase() !== 'cashier') {
        $('#cashier-select').val('');
    }

    // Приховати статус фільтра
    $('#filter-status').hide();

    // Перезавантажити список чеків
    loadRecentChecks();
});

// Обробник для пошуку за номером чека
$('#search-check').on('click', function() {
    const checkNumber = $('#check-number-search').val().trim();

    if (!checkNumber) {
        showErrorModal('Please enter a check number');
        return;
    }
if (currentUserRole.toLowerCase() === 'manager') {
        loadCashierTotalSales('', $('#start-date').val(), $('#end-date').val());
    }
    // Очистити список чеків
    $('#checks-list').find('.check-item').remove();
    $('#loading-indicator').show();

    $.ajax({
        url: API_ENDPOINTS.GET_CHECK_BY_NUMBER,
        type: 'GET',
        data: { check_number: checkNumber },
        success: function(response) {
            $('#loading-indicator').hide();

            if (response && response.check_number) {
                // Здійснюємо запит на отримання додаткової інформації (продукти, касир тощо)
                $.ajax({
                    url: API_ENDPOINTS.GET_CHECK_DETAILS,
                    type: 'GET',
                    data: { check_number: checkNumber },
                    success: function(details) {
                        // Об'єднуємо дані та відображаємо чек
                        const checkData = {...response, ...details};
                        const checksList = [checkData]; // Масив з одним елементом
                        renderChecksListItems(checksList);

                        // Оновити статус фільтра
                        $('#filter-status').text(`Showing check number: ${checkNumber}`).show();
                    },
                    error: function() {
                        // Якщо не вдалося отримати деталі, відображаємо базову інформацію
                        const checksList = [response];
                        renderChecksListItems(checksList);
                    }
                });
            } else {
                $('#checks-list').html('<div class="alert alert-warning">Check not found</div>');
            }
        },
        error: function(xhr) {
            $('#loading-indicator').hide();
            showErrorModal('Error searching for check:', xhr.responseText);
            $('#checks-list').html('<div class="alert alert-danger">Error searching for check</div>');
        }
    });
});

    // Обробник події для кнопки "Load Purchases"
    $('#load-customer-purchases').on('click', function() {
        const startDate = $('#purchases-start-date').val();
        const endDate = $('#purchases-end-date').val();
        loadCustomerPurchases(startDate, endDate);
    });

    // Встановлення дат за замовчуванням
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    $('#purchases-end-date').val(formatDateForInput(today));
    $('#purchases-start-date').val(formatDateForInput(thirtyDaysAgo));

    // Функція для форматування дати у формат YYYY-MM-DD
    function formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

function deleteStoreProduct(upc) {
    console.log("Deleting store product with UPC:", upc);
    $.ajax({
        url: '/deleteStoreProduct', // Переконайтеся, що це правильний URL
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ upc: upc }),
        success: function(response) {
            console.log("Delete response:", response);
            if (response.success) {
                alert(`Product deleted successfully. Rows updated: ${response.rows_updated}`);
                loadStoreProducts();
            } else {
                console.error("Delete failed:", response.message);
                alert('Failed to delete product: ' + response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error deleting store product:', xhr.responseText, status, error);
            alert('Failed to delete product. Please try again.');
        }
    });
}

    // Функція для завантаження даних про покупки
    function loadCustomerPurchases(startDate, endDate) {
        if (!startDate || !endDate) {
            showErrorModal('Please select both start and end dates');
            return;
        }

        const startDateFormatted = startDate + ' 00:00:00';
        const endDateFormatted = endDate + ' 23:59:59';

        console.log('Sending AJAX request to:', API_ENDPOINTS.GET_CUSTOMER_PURCHASES);
        console.log('Parameters:', { start_date: startDateFormatted, end_date: endDateFormatted });

        $('#loading-indicator').show();
        $('#customer-purchases-list2').empty();

        $.ajax({
            url: API_ENDPOINTS.GET_CUSTOMER_PURCHASES,
            type: 'GET',
            data: {
                start_date: startDateFormatted,
                end_date: endDateFormatted
            },
            success: function(response) {
                $('#loading-indicator').hide();
                console.log('Received response:', response);

                if (response && Array.isArray(response)) {
                    if (response.length === 0) {
                        console.log('No purchases found');
                        $('#customer-purchases-list2').html('<div class="alert alert-info">No customer purchases found for the selected period.</div>');
                    } else {
                        console.log('Rendering purchases:', response);
                        renderCustomerPurchases(response);
                    }
                    $('#customerPurchasesModal').modal('show');
                } else {
                    console.error('Invalid response format:', response);
                    $('#customer-purchases-list2').html('<div class="alert alert-warning">Invalid response format. Please try again.</div>');
                    $('#customerPurchasesModal').modal('show');
                }
            },
            error: function(xhr, status, error) {
                $('#loading-indicator').hide();
                console.error('AJAX error:', status, error);
                console.error('Response text:', xhr.responseText);
                $('#customer-purchases-list2').html('<div class="alert alert-danger">Error loading customer purchases: ' + xhr.responseText + '</div>');
                $('#customerPurchasesModal').modal('show');
            }
        });
    }

function loadStoreProductsForSales() {
    console.log("Loading store products for sales filter...");
    return $.ajax({
        url: API_ENDPOINTS.GET_STORE_PRODUCTS,
        type: 'GET',
        success: function(response) {
            console.log("Store products for sales filter loaded successfully:", response);
            storeProducts = response;

            // Заповнюємо розкривний список продуктів
            let options = '<option value="">Select product</option>';
            storeProducts.forEach(function(product) {
                // Показуємо лише продукти в наявності
                if (product.products_number > 0) {
                    options += `<option value="${product.product_name}">
                                ${product.product_name} - $${parseFloat(product.selling_price).toFixed(2)}
                                </option>`;
                }
            });
            $('#product-sales-select').html(options);
        },
        error: function(xhr, status, error) {
            console.error('Error loading store products for sales:', xhr.responseText, status, error);
            $('#product-sales-select').html('<option value="">Error loading products</option>');
        }
    });
}
    // Функція для відображення даних у таблиці
    function renderCustomerPurchases(purchases) {
        console.log('Rendering table with data:', purchases);
        let html = `
            <table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>Card Number</th>
                        <th>Surname</th>
                        <th>Total Checks</th>
                        <th>Total Purchases ($)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        purchases.forEach(purchase => {
            console.log('Processing purchase:', purchase);
            html += `
                <tr>
                    <td>${purchase.card_number || 'N/A'}</td>
                    <td>${purchase.cust_surname || 'N/A'}</td>
                    <td>${purchase.total_checks || 0}</td>
                    <td>$${parseFloat(purchase.total_purchases || 0).toFixed(2)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        $('#customer-purchases-list2').html(html);
    }
});


// Initialize all event handlers
function initEventHandlers() {
    $('.btn-group [data-period]').on('click', function() {
        const period = $(this).data('period');
        if (currentUserRole.toLowerCase() === 'manager') {
            loadCheckStatistics(period);
        }
    });

    $('#apply-cashier-filter').on('click', function() {
        applyFilters();
    });

    $('#reset-date-filter').on('click', function() {
        resetDateFilter();
    });

    $('#search-check').on('click', function() {
        searchCheckByNumber();
    });

    $('.open-create-check-modal, [data-toggle="modal"][data-target="#createCheckModal"]').on('click', function() {
        prepareCreateCheckModal();
    });

    $('#createCheckModal').on('show.bs.modal', function(e) {
        prepareCreateCheckModal();
    });

    $('#add-product').on('click', function() {
        addProductToCheck();
    });

    $('#save-check').on('click', function() {
        saveCheck();
    });

    $(document).on('click', '#delete-check-btn', function() {
        const checkNumber = $('#detail-check-number').text();
        deleteCheck(checkNumber);
    });

    $(document).on('click', '.toggle-products', function() {
        const checkDiv = $(this).closest('.check-item');
        const productsDiv = checkDiv.find('.check-products');
        productsDiv.toggleClass('active');
        const icon = $(this).find('i');
        if (productsDiv.hasClass('active')) {
            icon.removeClass('zmdi-plus').addClass('zmdi-minus');
            const checkNumber = checkDiv.data('check-number');
            const productsLoaded = checkDiv.data('products-loaded');
            if (!productsLoaded) {
                loadCheckProducts(checkNumber, productsDiv);
                checkDiv.data('products-loaded', true);
            }
        } else {
            icon.removeClass('zmdi-minus').addClass('zmdi-plus');
        }
    });

    $(document).on('click', '.view-check-details', function() {
        const checkNumber = $(this).closest('.check-item').data('check-number');
        viewCheckDetails(checkNumber);
    });

    $('#product-select').on('change', function() {
        updateProductPriceFromSelection();
    });

    $('#product-quantity').on('change', function() {
        updateProductPriceFromQuantity();
    });

    $(document).on('click', '.remove-product', function() {
        const index = $(this).data('index');
        removeProductFromCheck(index);
    });

    $('#check-number-search').on('keypress', function(e) {
        if (e.which === 13) {
            searchCheckByNumber();
        }
    });
}
    // View check details
    $(document).on('click', '.view-check-details', function() {
        const checkNumber = $(this).closest('.check-item').data('check-number');
        viewCheckDetails(checkNumber);
    });

    // Handle product select change
    $('#product-select').on('change', function() {
        updateProductPriceFromSelection();
    });

    // Handle product quantity change
    $('#product-quantity').on('change', function() {
        updateProductPriceFromQuantity();
    });

    // Remove product from check
    $(document).on('click', '.remove-product', function() {
        const index = $(this).data('index');
        removeProductFromCheck(index);
    });
$('#cashier-select').on('change', function() {
        if (currentUserRole.toLowerCase() === 'manager') {
            const cashierId = $(this).val();
            const startDate = $('#start-date').val();
            const endDate = $('#end-date').val();
            loadCashierTotalSales(cashierId, startDate, endDate);
        }
    });

    // Оновлення при зміні дат
    $('#start-date, #end-date').on('change', function() {
        if (currentUserRole.toLowerCase() === 'manager') {
            const cashierId = $('#cashier-select').val();
            const startDate = $('#start-date').val();
            const endDate = $('#end-date').val();
            loadCashierTotalSales(cashierId, startDate, endDate);
        }
    });
    // Check number search on Enter key
    $('#check-number-search').on('keypress', function(e) {
        if (e.which === 13) {
            searchCheckByNumber();
        }
    });

    // Пошук кількості проданих одиниць
    $('#search-product-units').on('click', function() {
        const upc = $('#product-search').val();
        const startDate = $('#start-date').val();
        const endDate = $('#end-date').val();

        if (!upc) {
            alert('Будь ласка, виберіть товар');
            return;
        }
        if (!startDate || !endDate) {
            alert('Будь ласка, виберіть діапазон дат');
            return;
        }

        loadProductUnitsSold(upc, startDate, endDate);
    });
 $('#product-search').on('change', function() {
        updateProductPriceFromSelection();
    });
    // Автоматичне оновлення при зміні товару
    $('#product-search').on('change', function() {
        if (currentUserRole.toLowerCase() === 'manager') {
            const upc = $(this).val();
            const startDate = $('#start-date').val();
            const endDate = $('#end-date').val();
            if (upc && startDate && endDate) {
                loadProductUnitsSold(upc, startDate, endDate);
            } else {
                $('#product-units-result').val('0');
            }
        }
    });

    // Автоматичне оновлення при зміні дат
    $('#start-date, #end-date').on('change', function() {
        if (currentUserRole.toLowerCase() === 'manager') {
            const upc = $('#product-search').val();
            const startDate = $('#start-date').val();
            const endDate = $('#end-date').val();
            if (upc && startDate && endDate) {
                loadProductUnitsSold(upc, startDate, endDate);
            }
        }
    });

// Set default dates for the filter
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    $('#end-date').val(formatDateForInput(today));
    $('#start-date').val(formatDateForInput(thirtyDaysAgo));
}


function loadCustomerPurchases(startDate, endDate) {
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    const startDateFormatted = startDate + ' 00:00:00';
    const endDateFormatted = endDate + ' 23:59:59';

    $('#loading-indicator').show();
    $('#customer-purchases-list').empty();

    $.ajax({
        url: API_ENDPOINTS.GET_CUSTOMER_PURCHASES,
        type: 'GET',
        data: {
            start_date: startDateFormatted,
            end_date: endDateFormatted
        },
        success: function(response) {
            $('#loading-indicator').hide();
            if (response && Array.isArray(response)) {
                if (response.length === 0) {
                    $('#customer-purchases-list').html('<div class="alert alert-info">No customer purchases found for the selected period.</div>');
                } else {
                    renderCustomerPurchases(response);
                }
            } else {
                $('#customer-purchases-list').html('<div class="alert alert-warning">Invalid response format. Please try again.</div>');
            }
        },
        error: function(xhr) {
            $('#loading-indicator').hide();
            console.error('Error loading customer purchases:', xhr.responseText);
            $('#customer-purchases-list').html('<div class="alert alert-danger">Error loading customer purchases.</div>');
        }
    });
}

function renderCustomerPurchases(purchases) {
    let html = `
        <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>Card Number</th>
                    <th>Surname</th>
                    <th>Total Checks</th>
                    <th>Total Purchases ($)</th>
                </tr>
            </thead>
            <tbody>
    `;

    purchases.forEach(purchase => {
        html += `
            <tr>
                <td>${purchase.card_number}</td>
                <td>${purchase.cust_surname}</td>
                <td>${purchase.total_checks}</td>
                <td>$${parseFloat(purchase.total_purchases).toFixed(2)}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    $('#customer-purchases-list').html(html);
}

function checkCurrentUserRole() {
    console.log("Checking current user role and ID...");
    $.ajax({
        url: '/api/employee_info',
        type: 'GET',
        success: function(response) {
            console.log("Employee info response:", response);
            currentUserRole = response.empl_role || '';
            currentUserId = String(response.id_employee || '');
            currentUserName = `${response.empl_surname} ${response.empl_name}`; // Зберігаємо ім'я користувача

            if (!currentUserId) {
                console.error("No id_employee in response. Cannot proceed.");
                alert('Error: User ID not found. Please log in again.');
                window.location.href = '/login.html';
                return;
            }

            console.log("Current user role:", currentUserRole, "Current user ID:", currentUserId, "Name:", currentUserName);
            adjustUIBasedOnRole();
            if (currentUserRole.toLowerCase() === 'cashier') {
                applyFiltersForCashier();
                $('#total-sales-by-cashier-container').hide();
            } else {
                loadCashierFilter();
            }
            loadCheckStatistics('all');
            loadRecentChecks();
        },
        error: function(xhr) {
            console.error('Error getting user info:', xhr.responseText);
            alert('Error loading user information. Please log in again.');
            window.location.href = '/login.html';
        }
    });
}
function applyFiltersForCashier() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    const startDateFormatted = startDate + ' 00:00:00';
    const endDateFormatted = endDate + ' 23:59:59';

    $('#loading-indicator').show();
    $('#checks-list').find('.check-item').remove();

    const filterParams = {
        start_date: startDateFormatted,
        end_date: endDateFormatted,
        id_employee: currentUserId
    };

    $.ajax({
        url: API_ENDPOINTS.GET_CHECKS_BY_DATE_RANGE,
        type: 'GET',
        data: filterParams,
        success: function(response) {
            $('#loading-indicator').hide();
            if (response && Array.isArray(response)) {
                if (response.length === 0) {
                    $('#checks-list').html('<div class="alert alert-info">No checks found for the selected criteria.</div>');
                } else {
                    renderChecksListItems(response);
                }
            } else {
                $('#checks-list').html('<div class="alert alert-warning">Invalid response format. Please try again.</div>');
            }
            $('#filter-status').text(`Showing your checks from ${startDate} to ${endDate}`).show();
        },
        error: function(xhr) {
            $('#loading-indicator').hide();
            console.error('Error applying filters:', xhr.responseText);
            $('#checks-list').html('<div class="alert alert-danger">Error applying filter: ' + xhr.responseText + '</div>');
        }
    });
}

function loadStoreProducts() {
    console.log("Loading store products data...");
    return $.ajax({
        url: API_ENDPOINTS.GET_STORE_PRODUCTS,
        type: 'GET',
        success: function(response) {
            console.log("Store products data received:", response);
            if (!Array.isArray(response)) {
                console.error("Response is not an array:", response);
                $('#product-select').html('<option value="">Invalid data format</option>');
                $('#product-search').html('<option value="">Invalid data format</option>');
                return;
            }

            storeProducts = response;
            let options = '<option value="">Select product</option>';
            let availableProducts = 0;

            storeProducts.forEach(function(product, index) {
                console.log(`Processing product ${index + 1}:`, product);
                // Показуємо лише продукти з products_number > 0
                if (product.products_number > 0 && product.UPC && product.product_name && product.selling_price) {
                    options += `<option value="${product.UPC}"
                                data-price="${product.selling_price}"
                                data-name="${product.product_name}"
                                data-stock="${product.products_number}">
                                ${product.product_name} - $${parseFloat(product.selling_price).toFixed(2)}
                                </option>`;
                    availableProducts++;
                } else {
                    console.warn(`Skipping product due to zero stock or missing data:`, product);
                }
            });

            console.log(`Found ${availableProducts} available products`);

            $('#product-select').html(options);
            $('#product-search').html(options);

            console.log("Product select HTML after update:", $('#product-select').html());
            console.log("Product search HTML after update:", $('#product-search').html());

            if (availableProducts === 0) {
                $('#product-select').html('<option value="">No products available</option>');
                $('#product-search').html('<option value="">No products available</option>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading store products:', xhr.responseText, status, error);
            $('#product-select').html('<option value="">Error loading products</option>');
            $('#product-search').html('<option value="">Error loading products</option>');
            alert('Failed to load products. Please try again.');
        }
    });
}
// Функція для обчислення продажів за назвою товару
function calculateProductSalesByName() {
    const productName = $('#product-sales-select').val();
    const startDate = $('#sales-start-date').val();
    const endDate = $('#sales-end-date').val();

    if (!productName) {
        alert('Please select a product');
        return;
    }

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    $.ajax({
        url: API_ENDPOINTS.GET_PRODUCT_SALES_BY_NAME,
        type: 'GET',
        data: {
            product_name: productName,
            start_date: startDate + ' 00:00:00',
            end_date: endDate + ' 23:59:59'
        },
        success: function(response) {
            if (response.success) {
                $('#sales-result').text(
                    `Total units sold for "${productName}": ${response.total_quantity}`
                ).show();
            } else {
                $('#sales-result').text(
                    `Error: ${response.message || 'Unable to calculate sales'}`
                ).show();
            }
        },
        error: function(xhr) {
            console.error('Error calculating product sales:', xhr.responseText);
            $('#sales-result').text('Error calculating product sales').show();
        }
    });
}

function setDefaultDatesForSales() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    $('#sales-end-date').val(formatDateForInput(today));
    $('#sales-start-date').val(formatDateForInput(thirtyDaysAgo));
}
//function loadTotalSalesByCashier(startDate, endDate, cashierId) {
//    console.log("loadTotalSalesByCashier called with:", { startDate, endDate, cashierId });
//
//    if (currentUserRole.toLowerCase() !== 'manager') {
//        console.log("Not a manager, hiding total-sales-by-cashier-container");
//        $('#total-sales-by-cashier-container').hide();
//        return;
//    }
//
//    if (!cashierId) {
//        console.log("No cashier ID provided, showing select message");
//        $('#total-sales-by-cashier').text('Select a cashier');
//        $('#total-sales-by-cashier-container').show();
//        return;
//    }
//
//    const params = {
//        start_date: startDate + ' 00:00:00',
//        end_date: endDate + ' 23:59:59',
//        id_employee: cashierId
//    };
//
//    console.log("Sending AJAX request with params:", params);
//
//    $.ajax({
//        url: API_ENDPOINTS.GET_TOTAL_SALES_BY_CASHIER,
//        type: 'GET',
//        data: params,
//        success: function(response) {
//            console.log("Total sales by cashier response:", response);
//            if (response && response.total_sales !== undefined) {
//                const totalSales = parseFloat(response.total_sales).toFixed(2);
//                $('#total-sales-by-cashier').text('$' + totalSales);
//                $('#total-sales-by-cashier-container').show();
//                console.log("Displayed total sales:", totalSales);
//            } else {
//                $('#total-sales-by-cashier').text('No sales data');
//                $('#total-sales-by-cashier-container').show();
//                console.log("No valid sales data in response");
//            }
//        },
//        error: function(xhr) {
//            console.error('Error loading total sales by cashier:', xhr.responseText);
//            $('#total-sales-by-cashier').text('Error loading sales');
//            $('#total-sales-by-cashier-container').show();
//        }
//    });
//}
function applyFilters() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();
    let cashierId = $('#cashier-select').val();

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    const startDateFormatted = startDate + ' 00:00:00';
    const endDateFormatted = endDate + ' 23:59:59';

    $('#loading-indicator').show();
    $('#checks-list').find('.check-item').remove();

    const filterParams = {
        start_date: startDateFormatted,
        end_date: endDateFormatted
    };

    if (currentUserRole.toLowerCase() === 'cashier') {
        filterParams.id_employee = currentUserId;
        $('#total-sales-by-cashier-container').hide();
    } else if (cashierId && cashierId !== '') {
        filterParams.id_employee = cashierId;
    }

    console.log("Filter parameters:", filterParams);

    $.ajax({
        url: API_ENDPOINTS.GET_CHECKS_BY_DATE_RANGE,
        type: 'GET',
        data: filterParams,
        success: function(response) {
            $('#loading-indicator').hide();
            console.log("Filter response:", response);

            if (response && Array.isArray(response)) {
                if (response.length === 0) {
                    $('#checks-list').html('<div class="alert alert-info">No checks found for the selected criteria.</div>');
                } else {
                    renderChecksListItems(response);
                }
            } else {
                $('#checks-list').html('<div class="alert alert-warning">Invalid response format. Please try again.</div>');
                console.error("Invalid response format:", response);
            }

            let filterStatusText = `Showing checks from ${startDate} to ${endDate}`;
            if (currentUserRole.toLowerCase() === 'cashier') {
                filterStatusText += ' for your checks only';
            } else if (cashierId && cashierId !== '') {
                const cashierName = $('#cashier-select option:selected').text();
                filterStatusText += ` for cashier: ${cashierName}`;
            } else {
                filterStatusText += ' for all cashiers';
            }

            $('#filter-status').text(filterStatusText).show();


        },
        error: function(xhr, status, error) {
            $('#loading-indicator').hide();
            console.error('Error applying filters:', xhr.responseText, status, error);
            $('#checks-list').html(`<div class="alert alert-danger">Error applying filter: ${xhr.responseText || error}</div>`);
            $('#total-sales-by-cashier-container').hide();
        }
    });
}

function adjustUIBasedOnRole() {
    if (currentUserRole.toLowerCase() === 'cashier') {
        $('.cashier-filter').hide();
        $('.admin-only').hide();
        $('.product-sales-filter').hide(); // Приховуємо секцію продажів для касирів
        $('#checks-heading').text('My Checks');
        $('button[data-target="#createCheckModal"]').show(); // Показуємо кнопку для касирів
    } else {
        $('.cashier-filter').show();
        $('.admin-only').show();
        $('.product-sales-filter').show(); // Показуємо секцію продажів для менеджерів
        $('#checks-heading').text('All Checks');
        $('#cashier-select').prop('disabled', false);
        $('button[data-target="#createCheckModal"]').hide(); // Приховуємо кнопку для менеджерів
    }
}
// Add this function to adjust UI for cashier role
// Add this function to adjust UI for cashier role
function adjustUIForCashierRole() {
    // Hide elements that should not be visible to cashiers
    // For example, if there are admin-only buttons
    $('.admin-only').hide();

    // Update UI text to reflect limited view
    $('#checks-heading').text('My Checks');
}

// Load employees data with enhanced debugging
function loadEmployees() {
    console.log("Loading employees data...");
    return $.ajax({
        url: API_ENDPOINTS.GET_CASHIERS,
        type: 'GET',
        success: function(response) {
            console.log("Employees data loaded successfully:", response);
            employees = response;

            // Populate employee dropdown - ensure IDs are strings
            let options = '<option value="">Select employee</option>';
            employees.forEach(function(employee) {
                // Ensure employee ID is properly set as a string value
                options += `<option value="${employee.id_employee}">${employee.empl_surname} ${employee.empl_name}</option>`;
            });
            $('#employee-select').html(options);

            // Debug: Log dropdown options after setting
            console.log("Employee select options set:", $('#employee-select').html());

            // Additional debugging: check if options are properly set with values
            $('#employee-select option').each(function() {
                console.log("Option value:", $(this).val(), "text:", $(this).text());
            });
        },
        error: function(xhr, status, error) {
            console.error('Error loading employees:', xhr.responseText, status, error);
            $('#employee-select').html('<option value="">Error loading employees</option>');
        }
    });
}

// Load customers for the dropdown - Added error handling
function loadCustomers() {
    console.log("Loading customers data...");
    return $.ajax({
        url: API_ENDPOINTS.GET_CUSTOMERS,
        type: 'GET',
        success: function(response) {
            console.log("Customers data loaded successfully:", response);
            customers = response;

            // Populate customer dropdown
            let options = '<option value="">No customer card</option>';
            customers.forEach(function(customer) {
                options += `<option value="${customer.card_number}">${customer.cust_surname} ${customer.cust_name} (${customer.card_number})</option>`;
            });
            $('#customer-select').html(options);
        },
        error: function(xhr, status, error) {
            console.error('Error loading customers:', xhr.responseText, status, error);
            $('#customer-select').html('<option value="">Error loading customers</option>');
        }
    });
}

// Load store products for the dropdown - Added error handling
function loadStoreProducts() {
    console.log("Loading store products data...");
    return $.ajax({
        url: API_ENDPOINTS.GET_STORE_PRODUCTS,
        type: 'GET',
        success: function(response) {
            console.log("Store products data received:", response);
            if (!Array.isArray(response)) {
                console.error("Response is not an array:", response);
                $('#product-select').html('<option value="">Invalid data format</option>');
                $('#product-search').html('<option value="">Invalid data format</option>');
                return;
            }

            storeProducts = response;
            let options = '<option value="">Select product</option>';
            let availableProducts = 0;

            storeProducts.forEach(function(product, index) {
                console.log(`Processing product ${index + 1}:`, product);
                if (product.products_number > 0 && product.UPC && product.product_name && product.selling_price) {
                    options += `<option value="${product.UPC}"
                                data-price="${product.selling_price}"
                                data-name="${product.product_name}"
                                data-stock="${product.products_number}">
                                ${product.product_name} - $${parseFloat(product.selling_price).toFixed(2)}
                                </option>`;
                    availableProducts++;
                } else {
                    console.warn(`Skipping product due to missing data or zero stock:`, product);
                }
            });

            console.log(`Found ${availableProducts} available products`);

            // Заповнюємо обидва розкривні списки
            $('#product-select').html(options);
            $('#product-search').html(options);

            // Логування для перевірки
            console.log("Product select HTML after update:", $('#product-select').html());
            console.log("Product search HTML after update:", $('#product-search').html());

            if (availableProducts === 0) {
                $('#product-select').html('<option value="">No products available</option>');
                $('#product-search').html('<option value="">No products available</option>');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading store products:', xhr.responseText, status, error);
            $('#product-select').html('<option value="">Error loading products</option>');
            $('#product-search').html('<option value="">Error loading products</option>');
            alert('Failed to load products. Please try again.');
        }
    });
}
function loadProductUnitsSold(upc, startDate, endDate) {
    if (currentUserRole.toLowerCase() !== 'manager') {
        $('#product-units-result').val('N/A');
        return;
    }

    if (!upc || !startDate || !endDate) {
        $('#product-units-result').val('0');
        return;
    }

    $.ajax({
        url: API_ENDPOINTS.GET_PRODUCT_UNITS_SOLD,
        type: 'GET',
        data: {
            upc: upc,
            start_date: startDate + ' 00:00:00',
            end_date: endDate + ' 23:59:59'
        },
        success: function(response) {
            if (response.success) {
                $('#product-units-result').val(response.total_units_sold);
            } else {
                $('#product-units-result').val('0');
            }
        },
        error: function(xhr) {
            console.error('Помилка завантаження кількості проданих одиниць:', xhr.responseText);
            $('#product-units-result').val('Помилка');
        }
    });
}

function loadCashierFilter() {
    console.log("Loading cashiers for filter...");
    return $.ajax({
        url: API_ENDPOINTS.GET_CASHIERS, // Reusing existing endpoint
        type: 'GET',
        success: function(response) {
            console.log("Cashiers loaded successfully:", response);

            // Populate cashier filter dropdown
            let options = '<option value="">All Cashiers</option>';
            response.forEach(function(employee) {
                options += `<option value="${employee.id_employee}">${employee.empl_surname} ${employee.empl_name}</option>`;
            });
            $('#cashier-select').html(options);
        },
        error: function(xhr, status, error) {
            console.error('Error loading cashiers for filter:', xhr.responseText, status, error);
            $('#cashier-select').html('<option value="">Error loading cashiers</option>');
        }
    });
}

// Improved prepareCreateCheckModal function with better error handling
function prepareCreateCheckModal() {
    console.log("Preparing create check modal...");

    // Reset form
    $('#checkForm')[0].reset();
    $('#check-products-container').html('<div class="text-center" id="no-products-message"><p>No products added yet</p></div>');
    currentCheckItems = [];
    currentTotalAmount = 0;
    currentVAT = 0;
    updateCheckTotals();

    // Show loading indicators
    $('#employee-select').html('<option value="">Loading employees...</option>');
    $('#customer-select').html('<option value="">Loading customers...</option>');

    // Load customers and products
    loadCustomers();
    loadStoreProducts();
    generateCheckNumber();

    // Load employees and handle cashier restrictions
    if (currentUserRole.toLowerCase() === 'cashier') {
        // For cashiers, set their own ID and disable the employee select
        $('#employee-select').html(`<option value="${currentUserId}">${currentUserName || 'Current Cashier'}</option>`);
        $('#employee-select').prop('disabled', true);
    } else {
        // For managers, load all employees and enable the select
        loadEmployees();
        $('#employee-select').prop('disabled', false);
    }
}

// Generate new check number with improved error handling
// Generate new check number with improved error handling
function generateCheckNumber() {
    console.log("Generating check number...");
    $.ajax({
        url: API_ENDPOINTS.GENERATE_CHECK_NUMBER,
        type: 'GET',
        success: function(response) {
            console.log("Check number generated successfully:", response);

            // Set the check number - no need to truncate as our new format is short
            $('#check-number').val(response.check_number);
        },
        error: function(xhr, status, error) {
            console.error('Error generating check number:', xhr.responseText, status, error);

            // Generate a fallback check number in the format CH + random number
            const randomNum = Math.floor(Math.random() * 900) + 100; // Random 3-digit number
            const fallbackNumber = 'CH' + randomNum;
            $('#check-number').val(fallbackNumber);

            alert('Error generating check number. A temporary number has been assigned.');
        }
    });
}

// Add a validation function for check number input - updated for new format
function validateCheckNumberLength(inputField) {
    // Regular expression to match our check number format (CH followed by 3+ digits)
    const checkNumberPattern = /^CH\d{3,}$/;

    if (!checkNumberPattern.test(inputField.value)) {
        showErrorModal('Check number must be in format CH followed by at least 3 digits (e.g., CH001)');
        // Reset to empty or previous valid value
        inputField.value = '';
    }
}

// This function should be called in document.ready
function addCheckNumberValidation() {
    // Add validation for check number input in create form
    $('#check-number').on('blur', function() {
        validateCheckNumberLength(this);
    });

    // Add validation for check number search field
    $('#check-number-search').on('blur', function() {
        validateCheckNumberLength(this);
    });
}

// Update product price when selection changes
function updateProductPriceFromSelection() {
    const selectedUPC = $('#product-select').val();
    const quantity = parseInt($('#product-quantity').val()) || 1;

    if (selectedUPC) {
        const selectedOption = $('#product-select option:selected');
        const price = parseFloat(selectedOption.data('price'));

        if (!isNaN(price)) {
            $('#product-price').val(price.toFixed(2));
        }
    } else {
        $('#product-price').val('');
    }
}

// Update product price based on quantity
function updateProductPriceFromQuantity() {
    updateProductPriceFromSelection();
}

// Add product to current check
function addProductToCheck() {
    const selectedUPC = $('#product-select').val();

    if (!selectedUPC) {
        showErrorModal('Please select a product');
        return;
    }

    const quantity = parseInt($('#product-quantity').val());
    if (!quantity || quantity <= 0) {
        showErrorModal('Please enter a valid quantity');
        return;
    }

    const selectedOption = $('#product-select option:selected');
    const productName = selectedOption.data('name');
    const availableStock = parseInt(selectedOption.data('stock'));
    const unitPrice = parseFloat(selectedOption.data('price'));

    // Check if quantity is available
    if (quantity > availableStock) {
        alert(`Only ${availableStock} items available in stock`);
        return;
    }

    // Check if product already exists in the check
    const existingIndex = currentCheckItems.findIndex(item => item.UPC === selectedUPC);

    if (existingIndex !== -1) {
        // Update existing item
        const newQuantity = currentCheckItems[existingIndex].quantity + quantity;

        if (newQuantity > availableStock) {
            alert(`Cannot add more. Only ${availableStock} items available in stock`);
            return;
        }

        currentCheckItems[existingIndex].quantity = newQuantity;
        currentCheckItems[existingIndex].total = newQuantity * unitPrice;
    } else {
        // Add new item
        currentCheckItems.push({
            UPC: selectedUPC,
            name: productName,
            quantity: quantity,
            price: unitPrice,
            total: quantity * unitPrice
        });
    }

    // Update the UI
    renderCheckProducts();
    updateCheckTotals();

    // Reset product selection
    $('#product-select').val('');
    $('#product-quantity').val(1);
    $('#product-price').val('');
}

// Render the products in the check
function renderCheckProducts() {
    if (currentCheckItems.length > 0) {
        let html = '';

        currentCheckItems.forEach(function(item, index) {
            html += `
                <div class="new-check-product">
                    <div class="row">
                        <div class="col-md-5">${item.name}</div>
                        <div class="col-md-2">${item.quantity}</div>
                        <div class="col-md-2">$${item.price.toFixed(2)}</div>
                        <div class="col-md-2">$${item.total.toFixed(2)}</div>
                        <div class="col-md-1">
                            <button type="button" class="btn btn-sm btn-danger remove-product" data-index="${index}">
                                <i class="zmdi zmdi-close"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        $('#check-products-container').html(html);
        $('#no-products-message').hide();
    } else {
        $('#check-products-container').html('<div class="text-center" id="no-products-message"><p>No products added yet</p></div>');
    }
}

// Remove product from check
function removeProductFromCheck(index) {
    if (index >= 0 && index < currentCheckItems.length) {
        currentCheckItems.splice(index, 1);
        renderCheckProducts();
        updateCheckTotals();
    }
}

// Update check totals (sum and VAT)
function updateCheckTotals() {
    currentTotalAmount = currentCheckItems.reduce((sum, item) => sum + item.total, 0);
    currentVAT = currentTotalAmount * 0.2;  // 20% VAT

    $('#check-total').text(currentTotalAmount.toFixed(2));
    $('#check-vat').text(currentVAT.toFixed(2));
}

// Save check to database - остаточно виправлена функція
function saveCheck() {
    if (currentCheckItems.length === 0) {
        showErrorModal('Please add at least one product to the check');
        return;
    }

    let employeeId;
    if (currentUserRole.toLowerCase() === 'cashier') {
        employeeId = currentUserId; // Для касирів завжди використовуємо їхній ID
    } else {
        employeeId = $('#employee-select').val();
        if (!employeeId) {
            alert('Please select an employee');
            return;
        }
    }

    const checkNumber = $('#check-number').val();
    const cardNumber = $('#customer-select').val() || null;

    const products = currentCheckItems.map(item => ({
        UPC: item.UPC,
        product_number: parseInt(item.quantity),
        selling_price: parseFloat(item.price)
    }));

    const checkData = {
        check_number: checkNumber,
        id_employee: employeeId,
        card_number: cardNumber,
        sum_total: parseFloat(currentTotalAmount.toFixed(2)),
        vat: parseFloat(currentVAT.toFixed(2)),
        products: products
    };

    console.log("Saving check data:", JSON.stringify(checkData));

    $.ajax({
        url: API_ENDPOINTS.INSERT_CHECK,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(checkData),
        success: function(response) {
            console.log("Save check response:", response);
            if (response.success) {
                alert('Check saved successfully');
                $('#createCheckModal').modal('hide');
                loadRecentChecks();
                loadCheckStatistics('all');
            } else {
                alert('Error saving check: ' + (response.message || JSON.stringify(response)));
            }
        },
        error: function(xhr, status, error) {
            let errorMessage = 'Error saving check: ';
            try {
                const responseJson = JSON.parse(xhr.responseText);
                errorMessage += JSON.stringify(responseJson);
                console.log("Error response:", responseJson);
            } catch (e) {
                errorMessage += ' Status: ' + status + '. Error: ' + error;
            }
            console.error('Error saving check:', errorMessage, status, error);
            alert(errorMessage);
        }
    });
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Load check statistics
function loadCheckStatistics(period) {
    $.ajax({
        url: API_ENDPOINTS.GET_CHECK_STATISTICS,
        type: 'GET',
        data: { period: period },
        success: function(response) {
            updateStatisticsDisplay(response, period);
        },
        error: function(xhr) {
            console.error('Error loading check statistics:', xhr.responseText);
        }
    });
}

// Update statistics display - FIXED type checking for numeric values
function updateStatisticsDisplay(stats, period) {
    if (stats) {
        $('#stats-total-checks').text(stats.total_checks || 0);

        // Convert string values to numbers before using toFixed
        const totalSales = parseFloat(stats.total_sales || 0);
        const totalVat = parseFloat(stats.total_vat || 0);
        const averageCheck = parseFloat(stats.average_check || 0);

        $('#stats-total-sales').text('$' + totalSales.toFixed(2));
        $('#stats-total-vat').text('$' + totalVat.toFixed(2));
        $('#stats-average-check').text('$' + averageCheck.toFixed(2));

        let periodText = 'All time';
        switch(period) {
            case 'today': periodText = 'Today'; break;
            case 'week': periodText = 'Last 7 days'; break;
            case 'month': periodText = 'Last 30 days'; break;
            case 'year': periodText = 'Last year'; break;
        }

        $('#stats-period').text(periodText);

        if (stats.oldest_date && stats.newest_date) {
            const oldestDate = new Date(stats.oldest_date);
            const newestDate = new Date(stats.newest_date);
            $('#stats-date-range').text(
                oldestDate.toLocaleDateString() + ' to ' + newestDate.toLocaleDateString()
            );
        } else {
            $('#stats-date-range').text('N/A');
        }
    }
}

// Load recent checks
function renderChecksListItems(checks) {
    if (checks && checks.length > 0) {
        // Sort checks by date (newest first)
        checks.sort((a, b) => new Date(b.print_date) - new Date(a.print_date));

        let checksList = '';

        checks.forEach(function(check) {
            // Format date
            const date = new Date(check.print_date);
            const formattedDate = date.toLocaleString();

            // Rest of your existing code for rendering the checks...
            checksList += `
                <div class="check-item" data-check-number="${check.check_number}">
                    <!-- Existing HTML structure -->
                </div>
            `;
        });

        $('#checks-list').html(checksList);
    } else {
        $('#checks-list').html('<div class="alert alert-info">No checks found.</div>');
    }
}


// Render checks list items
function renderChecksListItems(checks) {
    if (checks && checks.length > 0) {
        let checksList = '';

        checks.forEach(function(check) {
            // Format date
            const date = new Date(check.print_date);
            const formattedDate = date.toLocaleString();

            checksList += `
                <div class="check-item" data-check-number="${check.check_number}">
                    <div class="check-header">
                        <div>
                            <strong>Check #${check.check_number}</strong>
                            <div class="text-muted">${formattedDate}</div>
                            <div>Cashier: ${check.cashier_name || 'N/A'}</div>
                            <div>Products: ${check.product_count || 0}</div>
                        </div>
                        <div>
                            <div class="check-amount">$${parseFloat(check.sum_total).toFixed(2)}</div>
                            <div class="check-vat">VAT: $${parseFloat(check.vat).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <button class="btn btn-sm btn-outline-primary toggle-products">
                                <i class="zmdi zmdi-plus"></i> Products
                            </button>
                            <button class="btn btn-sm btn-outline-info view-check-details">
                                <i class="zmdi zmdi-info"></i> Details
                            </button>
                        </div>
                    </div>
                    <div class="check-products">
                        <div class="text-center py-2">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="sr-only">Loading...</span>
                            </div>
                            Loading products...
                        </div>
                    </div>
                </div>
            `;
        });

        $('#checks-list').html(checksList);
    } else {
        $('#checks-list').html('<div class="alert alert-info">No checks found.</div>');
    }
}
// Load products for a specific check
function loadCheckProducts(checkNumber, productsContainer) {
    $.ajax({
        url: API_ENDPOINTS.GET_CHECK_PRODUCTS,
        type: 'GET',
        data: { check_number: checkNumber },
        success: function(response) {
            renderCheckProductsDetails(response, productsContainer);
        },
        error: function(xhr) {
            productsContainer.html('<div class="alert alert-danger">Error loading products.</div>');
        }
    });
}

// Render check products - Renamed to avoid conflict with another function
function renderCheckProductsDetails(products, container) {
    if (products && products.length > 0) {
        let productsHtml = '<div class="mt-3">';

        products.forEach(function(product) {
            const productName = product.product_name || 'Unknown Product';
            productsHtml += `
                <div class="check-product-item">
                    <div>
                        <span>${productName}</span>
                        <small class="text-muted">UPC: ${product.UPC}</small>
                    </div>
                    <div>
                        <span>${product.product_number} x $${parseFloat(product.selling_price).toFixed(2)}</span>
                        <span class="ml-3 font-weight-bold">$${parseFloat(product.total_price).toFixed(2)}</span>
                    </div>
                </div>
            `;
        });

        productsHtml += '</div>';
        container.html(productsHtml);
    } else {
        container.html('<div class="alert alert-info mt-3">No products found for this check.</div>');
    }
}

// Apply date filter - FIXED: improved date formatting and parameter handling
// Apply date filter with improved logging and error handling
function applyFilters() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();
    let cashierId = $('#cashier-select').val();

    if (!startDate || !endDate) {
        showErrorModal('Будь ласка, виберіть початкову та кінцеву дати');
        return;
    }

    const startDateFormatted = startDate + ' 00:00:00';
    const endDateFormatted = endDate + ' 23:59:59';

    $('#loading-indicator').show();
    $('#checks-list').find('.check-item').remove();

    const filterParams = {
        start_date: startDateFormatted,
        end_date: endDateFormatted
    };

    if (currentUserRole.toLowerCase() === 'cashier') {
        filterParams.id_employee = currentUserId;
    } else if (cashierId && cashierId !== '') {
        filterParams.id_employee = cashierId;
    }

    console.log("Параметри фільтра:", filterParams);

    $.ajax({
        url: API_ENDPOINTS.GET_CHECKS_BY_DATE_RANGE,
        type: 'GET',
        data: filterParams,
        success: function(response) {
            $('#loading-indicator').hide();
            console.log("Відповідь фільтра:", response);

            if (response && Array.isArray(response)) {
                if (response.length === 0) {
                    $('#checks-list').html('<div class="alert alert-info">Чеків за вибраними критеріями не знайдено.</div>');
                } else {
                    renderChecksListItems(response);
                }
            } else {
                $('#checks-list').html('<div class="alert alert-warning">Невірний формат відповіді. Спробуйте ще раз.</div>');
                console.error("Невірний формат відповіді:", response);
            }

            let filterStatusText = `Відображаються чеки з ${startDate} по ${endDate}`;
            if (currentUserRole.toLowerCase() === 'cashier') {
                filterStatusText += ' лише для ваших чеків';
            } else if (cashierId && cashierId !== '') {
                const cashierName = $('#cashier-select option:selected').text();
                filterStatusText += ` для касира: ${cashierName}`;
            } else {
                filterStatusText += ' для всіх касирів';
            }

            $('#filter-status').text(filterStatusText).show();

            // Завантажити загальну суму продажів для обраного касира
            if (currentUserRole.toLowerCase() === 'manager') {
                loadCashierTotalSales(cashierId, startDate, endDate);
            }
        },
        error: function(xhr, status, error) {
            $('#loading-indicator').hide();
            console.error('Помилка застосування фільтрів:', xhr.responseText, status, error);
            $('#checks-list').html(`<div class="alert alert-danger">Помилка застосування фільтра: ${xhr.responseText || error}</div>`);
        }
    });
}

function resetDateFilter() {
    setDefaultDates();
    $('#cashier-select').val(''); // Reset cashier selection
    $('#filter-status').hide();
    loadRecentChecks();
    if (currentUserRole.toLowerCase() === 'manager') {
        loadCashierTotalSales('', $('#start-date').val(), $('#end-date').val());
    }
}
// Search check by number
function searchCheckByNumber() {
    const checkNumber = $('#check-number-search').val().trim();

    if (!checkNumber) {
        showErrorModal('Please enter a check number');
        return;
    }

    viewCheckDetails(checkNumber);
}

// View check details
// View check details
function viewCheckDetails(checkNumber) {
        console.log("Fetching check details for check number:", checkNumber);
        console.log("Current user ID:", currentUserId, "Role:", currentUserRole);

        $('#checkDetailsModal .modal-body').html('<div class="text-center py-5"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div><p class="mt-2">Loading check details...</p></div>');
        $('#checkDetailsModal').modal('show');

        $.ajax({
            url: API_ENDPOINTS.GET_CHECK_BY_NUMBER,
            type: 'GET',
            data: { check_number: checkNumber },
            success: function(checkData) {
                console.log("Check data received:", checkData);

                if (checkData && checkData.check_number) {
                    // Перетворюємо id_employee і currentUserId в рядки для коректного порівняння
                    const checkEmployeeId = String(checkData.id_employee || '');
                    const userId = String(currentUserId || '');

                    // Логування для дебагу
                    console.log("Check employee ID:", checkEmployeeId, "User ID:", userId);

                    // Перевірка для касира
                    if (currentUserRole.toLowerCase() === 'cashier' && checkEmployeeId !== userId) {
                        console.warn("Access denied: Cashier attempting to view another cashier's check");
                        $('#checkDetailsModal').modal('hide');
                        showErrorModal('You do not have permission to view this check.');
                        return;
                    }

                    // Завантажуємо продукти чека
                    $.ajax({
                        url: API_ENDPOINTS.GET_CHECK_PRODUCTS,
                        type: 'GET',
                        data: { check_number: checkNumber },
                        success: function(productsData) {
                            console.log("Check products received:", productsData);
                            displayCheckDetails(checkData, productsData);
                        },
                        error: function(xhr) {
                            console.error('Error getting check products:', xhr.responseText);
                            displayCheckDetails(checkData, []);
                        }
                    });
                } else {
                    console.warn("Check not found or invalid data:", checkData);
                    $('#checkDetailsModal').modal('hide');
                    showErrorModal('Check not found');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error getting check details:', xhr.responseText, status, error);
                $('#checkDetailsModal').modal('hide');
                showErrorModal('Error loading check details: ' + error);
            }
        });
    }

function loadCashierTotalSales(cashierId, startDate, endDate) {
    if (currentUserRole.toLowerCase() !== 'manager') {
        $('#stats-cashier-sales').text('N/A');
        $('#stats-selected-cashier').text('N/A');
        return;
    }

    if (!cashierId || !startDate || !endDate) {
        $('#stats-cashier-sales').text('$0.00');
        $('#stats-selected-cashier').text('None');
        return;
    }

    $.ajax({
        url: API_ENDPOINTS.GET_CASHIER_TOTAL_SALES,
        type: 'GET',
        data: {
            id_employee: cashierId,
            start_date: startDate + ' 00:00:00',
            end_date: endDate + ' 23:59:59'
        },
        success: function(response) {
            if (response.success) {
                $('#stats-cashier-sales').text('$' + parseFloat(response.total_sales).toFixed(2));
                const cashierName = $('#cashier-select option:selected').text() || 'Unknown';
                $('#stats-selected-cashier').text(cashierName);
            } else {
                $('#stats-cashier-sales').text('$0.00');
                $('#stats-selected-cashier').text('None');
            }
        },
        error: function(xhr) {
            console.error('Помилка завантаження загальної суми продажів касира:', xhr.responseText);
            $('#stats-cashier-sales').text('$0.00');
            $('#stats-selected-cashier').text('Error');
        }
    });
}
// Load recent checks
function loadRecentChecks() {
    $('#loading-indicator').show();
    $('#checks-list').find('.check-item').remove();

    let requestData = {};
    if (currentUserRole.toLowerCase() === 'cashier') {
        requestData.id_employee = currentUserId;
    }

    $.ajax({
        url: API_ENDPOINTS.GET_CHECKS,
        type: 'GET',
        data: requestData,
        success: function(response) {
            $('#loading-indicator').hide();
            renderChecksListItems(response);
            if (currentUserRole.toLowerCase() === 'cashier') {
                $('#filter-status').text('Showing your checks only').show();
            } else {
                $('#filter-status').hide();
            }
        },
        error: function(xhr) {
            $('#loading-indicator').hide();
            console.error('Error loading checks:', xhr.responseText);
            $('#checks-list').html('<div class="alert alert-danger">Error loading checks.</div>');
        }
    });
}

// Display check details
function displayCheckDetails(checkData, productsData) {
    // Reset modal content
    $('#checkDetailsModal .modal-body').html(`
        <div class="check-details">
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Check Number:</strong> <span id="detail-check-number">${checkData.check_number}</span>
                </div>
                <div class="col-md-6">
                    <strong>Date:</strong> <span id="detail-date"></span>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Employee:</strong> <span id="detail-employee"></span>
                </div>
                <div class="col-md-6">
                    <strong>Customer Card:</strong> <span id="detail-customer"></span>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>Total Items:</strong> <span id="detail-total-items"></span>
                </div>
                <div class="col-md-6">
                    <strong>Total Amount:</strong> <span id="detail-total"></span>
                    <div><strong>VAT:</strong> <span id="detail-vat"></span></div>
                </div>
            </div>

            <h5 class="mt-4">Products</h5>
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>UPC</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody id="detail-products-body">
                    </tbody>
                </table>
            </div>
        </div>
    `);

    // Populate check details modal
    $('#detail-check-number').text(checkData.check_number);
    $('#detail-employee').text(checkData.cashier_name || checkData.id_employee);

    // Format date
    const date = new Date(checkData.print_date);
    $('#detail-date').text(date.toLocaleString());

    $('#detail-total').text('$' + parseFloat(checkData.sum_total).toFixed(2));
    $('#detail-vat').text('$' + parseFloat(checkData.vat).toFixed(2));

    // Display customer card if available
    if (checkData.card_number) {
        $('#detail-customer').text(checkData.card_number);
    } else {
        $('#detail-customer').text('No customer card');
    }

    // Display products
    let productsHtml = '';
    let totalItems = 0;

    if (productsData && productsData.length > 0) {
        productsData.forEach(function(product) {
            totalItems += parseInt(product.product_number);
            productsHtml += `
                <tr>
                    <td>${product.product_name}</td>
                    <td>${product.UPC}</td>
                    <td>${product.product_number}</td>
                    <td>$${parseFloat(product.selling_price).toFixed(2)}</td>
                    <td>$${parseFloat(product.total_price).toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        productsHtml = '<tr><td colspan="5" class="text-center">No products found</td></tr>';
    }

    $('#detail-products-body').html(productsHtml);
    $('#detail-total-items').text(totalItems);

    // Show modal
    $('#checkDetailsModal').modal('show');
}

// Delete check
function deleteCheck(checkNumber) {
    if (confirm(`Are you sure you want to delete check ${checkNumber}? This action cannot be undone.`)) {
        $.ajax({
            url: API_ENDPOINTS.DELETE_CHECK,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ check_number: checkNumber }),
            success: function(response) {
                if (response.success) {
                    $('#checkDetailsModal').modal('hide');
                    alert('Check deleted successfully');
                    loadRecentChecks();  // Refresh the checks list
                    loadCheckStatistics('all');  // Refresh statistics
                } else {
                    alert('Error deleting check: ' + response.message);
                }
            },
            error: function(xhr) {
                console.error('Error deleting check:', xhr.responseText);
                alert('Error deleting check. Please try again.');
            }
        });
    }
}

function loadCashierFilter() {
    // Цей ендпоінт повинен повертати список всіх касирів
    $.ajax({
        url: '/api/cashiers',  // Припускаємо, що у вас є такий ендпоінт
        type: 'GET',
        success: function(cashiers) {
            const cashierSelect = $('#cashier-select');

            // Очистити поточні опції, крім першої (All Cashiers)
            cashierSelect.find('option:not(:first)').remove();

            // Додати опції для кожного касира
            if (Array.isArray(cashiers)) {
                cashiers.forEach(function(cashier) {
                    const fullName = `${cashier.empl_surname} ${cashier.empl_name}`;
                    cashierSelect.append(
                        $('<option></option>')
                            .attr('value', cashier.id_employee)
                            .text(fullName)
                    );
                });

                console.log(`Loaded ${cashiers.length} cashiers for filter`);
            } else {
                console.error('Invalid cashiers data format:', cashiers);
            }

            // Якщо користувач є касиром, вибрати його та деактивувати селект
            if (currentUserRole.toLowerCase() === 'cashier') {
                cashierSelect.val(currentUserId);
                cashierSelect.prop('disabled', true);
            }
        },
        error: function(xhr) {
            console.error('Error loading cashiers:', xhr.responseText);
        }
    });
}
