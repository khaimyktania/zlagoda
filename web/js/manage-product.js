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
                    '<td><span class="btn btn-xs btn-danger delete-product">Delete</span></td></tr>';
            });
            $("table").find('tbody').empty().html(table);
        }
    });
}

$('#productModal').on('show.bs.modal', function () {
    loadCategories();
});

// Збереження продукту
$("#saveProduct").on("click", function () {
    var data = $("#productForm").serializeArray();
    var requestPayload = {
        product_name: null,
        category_number: null,
        characteristics: null
    };

    // Формуємо об'єкт з полів форми
    for (var i = 0; i < data.length; ++i) {
        var element = data[i];
        switch(element.name) {
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

    // Відправка POST-запиту
    $.ajax({
        type: "POST",
        url: productSaveApiUrl,
        data: {
            data: JSON.stringify(requestPayload)
        },
        success: function(response) {
            alert("Product saved successfully!");
            productModal.modal('hide');
            loadProducts(); // оновити таблицю
        },
        error: function() {
            alert("Error while saving product.");
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
        }).fail(function(){
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


// Скидання форми при закритті модалки
productModal.on('hide.bs.modal', function(){
    $("#productForm")[0].reset(); // скинути всю форму
    productModal.find('.modal-title').text('Add New Product');
});
