// Define your API endpoints
var productListApiUrl = 'http://127.0.0.1:5000/getProducts';
var productSaveApiUrl = 'http://127.0.0.1:5000/insertProduct';
var productDeleteApiUrl = 'http://127.0.0.1:5000/deleteProduct';
var productCategory = 'http://127.0.0.1:5000/productCategory';
var orderListApiUrl = 'http://127.0.0.1:5000/getAllOrders';
var orderSaveApiUrl = 'http://127.0.0.1:5000/insertOrder';
// Define employee API endpoints
var employeeListApiUrl = 'http://127.0.0.1:5000/getEmployees';
var employeeSaveApiUrl = 'http://127.0.0.1:5000/insertEmployee';
var employeeDeleteApiUrl = 'http://127.0.0.1:5000/deleteEmployee';

var customerListApiUrl = 'http://127.0.0.1:5000/getCustomers';
var customerSaveApiUrl = 'http://127.0.0.1:5000/insertCustomer';
var customerDeleteApiUrl = 'http://127.0.0.1:5000/deleteCustomer';

// Optional fake store API (for UI dropdowns or demos)
var productsApiUrl = 'https://fakestoreapi.com/products';

// Universal API call (not used much in production)
function callApi(method, url, data) {
    $.ajax({
        method: method,
        url: url,
        data: data,
        success: function(response) {
            if(response) {
                location.reload();
            }
        },
        error: function(error) {
            alert('Error: ' + error.responseText);
        }
    });
}
//// Calculate totals for product list (in orders)
//function calculateValue() {
//    var total = 0;
//    $(".product-item").each(function(index) {
//        var qty = parseFloat($(this).find('.product-qty').val());
//        var price = parseFloat($(this).find('#product_price').val());
//        var subtotal = price * qty;
//        $(this).find('#item_total').val(subtotal.toFixed(2));
//        total += subtotal;
//    });
//    $("#product_grand_total").val(total.toFixed(2));
//}
//
//// Parsing for orders (dummy if you haven’t created orders yet)
//function orderParser(order) {
//    return {
//        id: order.id,
//        date: order.date,
//        orderNo: order.order_number,
//        customerName: order.customer_name,
//        cost: parseFloat(order.total_cost)
//    };
//}
//
//// Parser for products from your backend (getProducts)
//function productParser(product) {
//    return {
//        id: product.id_product,
//        name: product.product_name,
//        category: product.category_number,
//        characteristics: product.characteristics
//    };
//}
//
//// Parser for fakeStoreAPI (demo use only)
//function productDropParser(product) {
//    return {
//        id: product.id,
//        name: product.title
//    };
//}
//
//// 🧠 BONUS: Load products into table (used in manage-product.js usually)
//function loadProductsToTable() {
//    $.get(productListApiUrl, function(products) {
//        var tbody = $("table tbody");
//        tbody.empty();
//        products.forEach(function(product) {
//            var parsed = productParser(product);
//            var row = `
//                <tr>
//                    <td>${parsed.name}</td>
//                    <td>${parsed.category}</td>
//                    <td>${parsed.characteristics}</td>
//                    <td style="width: 150px">
//                        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${parsed.id})">Delete</button>
//                    </td>
//                </tr>
//            `;
//            tbody.append(row);
//        });
//    });
//}
//
//// Delete product
//function deleteProduct(id_product) {
//    $.ajax({
//        url: productDeleteApiUrl + '?id_product=' + id_product,
//        method: 'DELETE',
//        success: function() {
//            loadProductsToTable();
//        }
//    });
//}
//
//// Save product
//function saveProduct() {
//    var product = {
//        id_product: $("#id_product").val() || null,  // якщо пусте, залишаємо null
//        product_name: $("#product_name").val(),
//        category_number: $("#category_number").val(),
//        characteristics: $("#characteristics").val()
//    };
//
//    $.ajax({
//        url: productSaveApiUrl,
//        method: 'POST',
//        contentType: 'application/json',
//        data: JSON.stringify(product),
//        success: function() {
//            $("#productModal").modal("hide");
//            loadProducts(); // оновити таблицю продуктів
//        },
//        error: function() {
//            alert("Error while saving product.");
//        }
//    });
//}
//
//// Load on page ready
//$(document).ready(function() {
//    loadProductsToTable();
//    $("#saveProduct").click(saveProduct);
//});
