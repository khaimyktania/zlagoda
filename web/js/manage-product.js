var productModal = $("#productModal");

$(function () {
    // Завантаження продуктів
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
});

// Збереження продукту
$("#saveProduct").on("click", function () {
    var data = $("#productForm").serializeArray();
    var requestPayload = {
        id_product: null,
        product_name: null,
        category_number: null,
        characteristics: null
    };
    for (var i=0;i<data.length;++i) {
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
        }
    }

    callApi("POST", productSaveApiUrl, {
        'data': JSON.stringify(requestPayload)
    });
});

// Видалення продукту
$(document).on("click", ".delete-product", function (){
    var tr = $(this).closest('tr');
    var data = {
        id_product : tr.data('id')
    };
    var isDelete = confirm("Are you sure to delete "+ tr.data('name') +"?");
    if (isDelete) {
        callApi("POST", productDeleteApiUrl, data);
    }
});

// Скидання форми при закритті модалки
productModal.on('hide.bs.modal', function(){
    $("#id_product").val('');
    $("#product_name, #category_number, #characteristics").val('');
    productModal.find('.modal-title').text('Add New Product');
});
