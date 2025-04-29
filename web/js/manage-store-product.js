// Global variables
var storeProductModal = $("#storeProductModal");
var vatInfoModal = $("#vatInfoModal");
var productSelect = $("#id_product");

// API URLs
const storeProductsApiUrl = "/getStoreProducts";
const storeProductSaveApiUrl = "/insertStoreProduct";
const storeProductDeleteApiUrl = "/deleteStoreProduct";
const makePromotionalApiUrl = "/makePromotional";
const updateQuantityApiUrl = "/updateProductQuantity";
const getVatInfoApiUrl = "/getProductVAT";

$(function () {
    // Initial load of store products
    loadStoreProducts();

    // Load product dropdown for modal
    loadProductDropdown();

    // Initialize event handlers
    initEventHandlers();
});

// Load all store products
function loadStoreProducts() {
    $.get(storeProductsApiUrl, function (response) {
        if (response) {
            let table = '';
            $.each(response, function (index, product) {
                // Determine if this is a promotional product for row styling
                const promotionalClass = product.promotional_product == 1 ? 'promotional-product' : '';

                // Format price with VAT
                const priceWithVAT = parseFloat(product.selling_price).toFixed(2);

                // UPC_prom might be null for non-promotional products
                const promotionalUPC = product.UPC_prom || '-';

                // Create table row
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
                        '<div class="btn-group">' +
                            '<button class="btn btn-xs btn-primary edit-store-product">Edit</button> ' +
                            '<button class="btn btn-xs btn-danger delete-store-product">Delete</button> ' +
                            (product.promotional_product == 1 ?
                                '<button class="btn btn-xs btn-warning make-non-promotional">Make Non-Promotional</button>' :
                                '<button class="btn btn-xs btn-success make-promotional">Make Promotional</button>'
                            ) +
                        '</div>' +
                    '</td></tr>';
            });

            $("table").find('tbody').empty().html(table);
        }
    });
}

// Load products dropdown for store product form
function loadProductDropdown() {
    $.get("/getAllProductsSorted", function (response) {
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

// Initialize all event handlers
function initEventHandlers() {
    // Add new store product button
    $('#storeProductModal button.btn-primary').on('click', saveStoreProduct);

    // Edit store product
    $(document).on('click', '.edit-store-product', function() {
        var tr = $(this).closest('tr');
        openEditStoreProductModal(tr);
    });

    // Delete store product
    $(document).on('click', '.delete-store-product', function() {
        var tr = $(this).closest('tr');
        deleteStoreProduct(tr);
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
}

// Save or update store product
function saveStoreProduct() {
    // Collect form data
    var formData = {
        UPC: $('#UPC').val(),
        UPC_prom: $('#UPC_prom').val() || null,
        id_product: $('#id_product').val(),
        selling_price: $('#selling_price').val(),
        products_number: $('#products_number').val(),
        promotional_product: $('#promotional_product').is(':checked') ? 1 : 0
    };

    // Validation
    if (!formData.UPC) {
        alert('UPC is required');
        return;
    }

    if (!formData.id_product) {
        alert('Product is required');
        return;
    }

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
});