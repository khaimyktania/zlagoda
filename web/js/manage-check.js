// Glob// Global variables
let currentCheckItems = [];
let currentTotalAmount = 0;
let currentVAT = 0;
let employees = [];
let customers = [];
let storeProducts = [];

// API endpoints
const API_ENDPOINTS = {
    GET_CHECKS: "/getRecentChecks",
    GET_CHECK_BY_NUMBER: "/getCheckByNumber",
    GET_CHECK_PRODUCTS: "/getCheckProducts",
    GET_CHECK_STATISTICS: "/getCheckStatistics",
    GET_EMPLOYEES: "/getAllEmployees",
    GET_CUSTOMERS: "/getAllCustomers",
    GET_STORE_PRODUCTS: "/getStoreProducts",
    GENERATE_CHECK_NUMBER: "/generateCheckNumber",
    INSERT_CHECK: "/insertCheck",
    DELETE_CHECK: "/deleteCheck",
    GET_CHECKS_BY_DATE_RANGE: "/getChecksByDateRange"

};

// Initialize on document load
$(document).ready(function() {
    // Load initial data
    loadCheckStatistics('all');
    loadRecentChecks();

    // Initialize event handlers
    initEventHandlers();

    // Set default dates for filters
    setDefaultDates();

    // Add validation for check number fields
    addCheckNumberValidation();
});

// Initialize all event handlers
function initEventHandlers() {
    // Statistics period buttons
    $('.btn-group [data-period]').on('click', function() {
        const period = $(this).data('period');
        loadCheckStatistics(period);
    });

    // Date filter buttons
    $('#apply-date-filter').on('click', function() {
        applyDateFilter();
    });

    $('#reset-date-filter').on('click', function() {
        resetDateFilter();
    });

    // Check search
    $('#search-check').on('click', function() {
        searchCheckByNumber();
    });

    // Create new check modal - FIXED: multiple event bindings for reliability
    $('.open-create-check-modal, [data-toggle="modal"][data-target="#createCheckModal"]').on('click', function() {
        prepareCreateCheckModal();
    });

    // Bind to modal show event to ensure data is loaded when modal opens
    $('#createCheckModal').on('show.bs.modal', function (e) {
        prepareCreateCheckModal();
    });

    // Add product to check
    $('#add-product').on('click', function() {
        addProductToCheck();
    });

    // Save check button
    $('#save-check').on('click', function() {
        saveCheck();
    });

    // Delete check button - FIXED: Added proper data-check-number attribute handling
    $(document).on('click', '#delete-check-btn', function() {
        const checkNumber = $('#detail-check-number').text();
        deleteCheck(checkNumber);
    });

    // Toggle check products view
    $(document).on('click', '.toggle-products', function() {
        const checkDiv = $(this).closest('.check-item');
        const productsDiv = checkDiv.find('.check-products');
        productsDiv.toggleClass('active');

        const icon = $(this).find('i');
        if (productsDiv.hasClass('active')) {
            icon.removeClass('zmdi-plus').addClass('zmdi-minus');

            // Load products if not already loaded
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

    // Check number search on Enter key
    $('#check-number-search').on('keypress', function(e) {
        if (e.which === 13) {
            searchCheckByNumber();
        }
    });
}

// Set default dates for the filter
function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    $('#end-date').val(formatDateForInput(today));
    $('#start-date').val(formatDateForInput(thirtyDaysAgo));
}

// Load employees data with enhanced debugging
function loadEmployees() {
    console.log("Loading employees data...");
    return $.ajax({
        url: API_ENDPOINTS.GET_EMPLOYEES,
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
            console.log("Store products data loaded successfully:", response);
            storeProducts = response;

            // Populate product dropdown
            let options = '<option value="">Select product</option>';
            storeProducts.forEach(function(product) {
                // Only show products that are in stock
                if (product.products_number > 0) {
                    options += `<option value="${product.UPC}"
                                data-price="${product.selling_price}"
                                data-name="${product.product_name}"
                                data-stock="${product.products_number}">
                                ${product.product_name} - $${parseFloat(product.selling_price).toFixed(2)}
                                </option>`;
                }
            });
            $('#product-select').html(options);
        },
        error: function(xhr, status, error) {
            console.error('Error loading store products:', xhr.responseText, status, error);
            $('#product-select').html('<option value="">Error loading products</option>');
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
    $('#product-select').html('<option value="">Loading products...</option>');

    // Load all required data
    loadEmployees();
    loadCustomers();
    loadStoreProducts();
    generateCheckNumber();
}

// Generate new check number with improved error handling
function generateCheckNumber() {
    console.log("Generating check number...");
    $.ajax({
        url: API_ENDPOINTS.GENERATE_CHECK_NUMBER,
        type: 'GET',
        success: function(response) {
            console.log("Check number generated successfully:", response);

            // Ensure check number is no more than 10 characters
            let checkNumber = response.check_number;
            if (checkNumber && checkNumber.length > 10) {
                console.warn("Check number exceeded 10 characters, truncating:", checkNumber);
                checkNumber = checkNumber.substring(0, 10);
            }

            $('#check-number').val(checkNumber);
        },
        error: function(xhr, status, error) {
            console.error('Error generating check number:', xhr.responseText, status, error);

            // Generate a fallback check number (ensure it's max 10 chars)
            const fallbackNumber = ('ERR' + new Date().getTime().toString().substring(0, 7)).substring(0, 10);
            $('#check-number').val(fallbackNumber);
        }
    });
}

// Add a validation function for check number input
function validateCheckNumberLength(inputField) {
    const maxLength = 10;
    if (inputField.value.length > maxLength) {
        inputField.value = inputField.value.substring(0, maxLength);
        console.warn("Check number truncated to 10 characters");
    }
}

// This function should be called in document.ready
function addCheckNumberValidation() {
    // Add validation for check number input in create form
    $('#check-number').on('input', function() {
        validateCheckNumberLength(this);
    });

    // Add validation for check number search field
    $('#check-number-search').on('input', function() {
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
        alert('Please select a product');
        return;
    }

    const quantity = parseInt($('#product-quantity').val());
    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity');
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
        alert('Please add at least one product to the check');
        return;
    }

    const employeeId = $('#employee-select').val();
    if (!employeeId) {
        alert('Please select an employee');
        return;
    }

    const checkNumber = $('#check-number').val();

    // Використовуємо правильну назву поля card_number як у DAO
    const cardNumber = $('#customer-select').val() || null;

    // Prepare products for API - ensure all fields have correct types
    const products = currentCheckItems.map(item => ({
        UPC: item.UPC,
        product_number: parseInt(item.quantity),
        selling_price: parseFloat(item.price)
    }));

    // Create the check data object with properly formatted fields
    // Використовуємо правильну назву поля card_number як у DAO
    const checkData = {
        check_number: checkNumber,
        id_employee: employeeId,
        card_number: cardNumber,  // Правильна назва поля
        sum_total: parseFloat(currentTotalAmount.toFixed(2)),
        vat: parseFloat(currentVAT.toFixed(2)),
        products: products
    };

    // Debug: Log the complete request payload
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
                console.log("Error response:", responseJson);  // Log the error response
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
function loadRecentChecks() {
    $('#loading-indicator').show();
    $('#checks-list').find('.check-item').remove();

    $.ajax({
        url: API_ENDPOINTS.GET_CHECKS,
        type: 'GET',
        success: function(response) {
            $('#loading-indicator').hide();
            renderChecksListItems(response);
        },
        error: function(xhr) {
            $('#loading-indicator').hide();
            console.error('Error loading checks:', xhr.responseText);
            $('#checks-list').html('<div class="alert alert-danger">Error loading checks. Please try again later.</div>');
        }
    });
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
            productsHtml += `
                <div class="check-product-item">
                    <div>
                        <span>${product.product_name}</span>
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
function applyDateFilter() {
    const startDate = $('#start-date').val();
    const endDate = $('#end-date').val();

    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }

    // Format dates correctly for backend
    const startDateFormatted = startDate + ' 00:00:00';
    const endDateFormatted = endDate + ' 23:59:59';

    $('#loading-indicator').show();
    $('#checks-list').find('.check-item').remove();

    $.ajax({
        url: API_ENDPOINTS.GET_CHECKS_BY_DATE_RANGE,
        type: 'GET',
        data: {
            start_date: startDateFormatted,
            end_date: endDateFormatted
        },
        success: function(response) {
            $('#loading-indicator').hide();
            renderChecksListItems(response);

            // Update UI to show filter is active
            $('#date-filter-status').text(`Showing checks from ${startDate} to ${endDate}`).show();
        },
        error: function(xhr, status, error) {
            $('#loading-indicator').hide();
            console.error('Error applying date filter:', xhr.responseText, status, error);

            try {
                const errorResponse = JSON.parse(xhr.responseText);
                $('#checks-list').html(`<div class="alert alert-danger">Error applying filter: ${errorResponse.message || 'Unknown error'}</div>`);
            } catch (e) {
                $('#checks-list').html(`<div class="alert alert-danger">Error applying filter: ${error}</div>`);
            }
        }
    });
}

// Reset date filter
function resetDateFilter() {
    setDefaultDates();
    $('#date-filter-status').hide();
    loadRecentChecks();
}

// Search check by number
function searchCheckByNumber() {
    const checkNumber = $('#check-number-search').val().trim();

    if (!checkNumber) {
        alert('Please enter a check number');
        return;
    }

    viewCheckDetails(checkNumber);
}

// View check details
function viewCheckDetails(checkNumber) {
    // Show loading indicator in the modal
    $('#checkDetailsModal .modal-body').html('<div class="text-center py-5"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div><p class="mt-2">Loading check details...</p></div>');
    $('#checkDetailsModal').modal('show');

    $.ajax({
        url: API_ENDPOINTS.GET_CHECK_BY_NUMBER,
        type: 'GET',
        data: { check_number: checkNumber },
        success: function(checkData) {
            if (checkData) {
                // Get check products
                $.ajax({
                    url: API_ENDPOINTS.GET_CHECK_PRODUCTS,
                    type: 'GET',
                    data: { check_number: checkNumber },
                    success: function(productsData) {
                        displayCheckDetails(checkData, productsData);
                    },
                    error: function(xhr) {
                        console.error('Error getting check products:', xhr.responseText);
                        displayCheckDetails(checkData, []);
                    }
                });
            } else {
                $('#checkDetailsModal').modal('hide');
                alert('Check not found');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error getting check details:', xhr.responseText, status, error);
            $('#checkDetailsModal').modal('hide');
            alert('Error loading check details: ' + error);
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