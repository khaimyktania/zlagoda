// API endpoints
var categoryListApiUrl = 'http://127.0.0.1:5000/getCategories';
var categorySaveApiUrl = 'http://127.0.0.1:5000/saveCategory';
var categoryDeleteApiUrl = 'http://127.0.0.1:5000/deleteCategory';

//для запиту
var storeProductsSummaryApiUrl = 'http://127.0.0.1:5000/api/reports/store-products-summary-by-category';
var summaryModal = $("#summaryModal");

var deadCategoriesApiUrl = 'http://127.0.0.1:5000/api/reports/dead-categories';
var deadCategoriesModal = $("#deadCategoriesModal");


// DOM elements
var categoryModal = $("#categoryModal");
var categoryForm = $("#categoryForm");
var sortDirection = 'asc'; // Default sort direction

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

$(document).ready(function() {
    // Прибирати помилки при введенні в поля
    $('#category_name').on('input change', function() {
        const field = $(this).attr('id');
        $(`#${field}`).removeClass('is-invalid');
        $(`#${field}_error`).hide();
    });
    // Load categories when page loads
    loadCategories();

    // Setup event handlers
    $("#addCategoryBtn").click(openAddCategoryModal);
    $("#saveCategory").click(saveCategory);
    $("#sortCategoriesBtn").click(sortCategories);
    //для запиту
    $("#deadCategoriesBtn").click(showDeadCategories);

    // Event delegation for dynamic buttons
    $(document).on('click', '.edit-category', editCategory);
    $(document).on('click', '.delete-category', deleteCategory);
    //для запиту
    $(document).on('click', '.summary-category', showCategorySummary);


    // Reset form and clear errors when modal is closed
    categoryModal.on('hide.bs.modal', resetCategoryForm);

    // Clear errors when modal is opened
    categoryModal.on('show.bs.modal', function() {
        $('.error-message').hide().find('.error-text').text('');
        $('.is-invalid').removeClass('is-invalid');
    });

    //для запиту
    // Clear summary modal when closed
    summaryModal.on('hide.bs.modal', function() {
        $('#summaryContent').empty();
    });
    deadCategoriesModal.on('hide.bs.modal', function() {
        $('#deadCategoriesContent').empty();
    });
});

// Load all categories into the table
function loadCategories() {
    $.get(categoryListApiUrl, function(categories) {
        displayCategories(categories);
    }).fail(function(error) {
        console.error("Error loading categories:", error);
        alert("Error loading categories. Please check the console for details.");
    });
}

// Display categories in the table
function displayCategories(categories, salesMap = {}) {
    var tbody = $("#categoryTableBody");
    tbody.empty();

    categories.forEach(function(category) {
        const totalSales = salesMap[category.category_number] || 0;
        var row = `
            <tr data-number="${category.category_number}" data-name="${category.name}">
                <td>${category.category_number}</td>
                <td>${category.name}</td>
                <td>${totalSales}</td>
                <td>
                    <span class="btn btn-xs btn-primary edit-category">Edit</span>
                    <span class="btn btn-xs btn-danger delete-category">Delete</span>
                    <span class="btn btn-xs btn-info summary-category">Summary</span>
                </td>
            </tr>
        `;
        tbody.append(row);
    });

    // Update the table header if not already added
    const thead = $("#categoryTableBody").closest("table").find("thead tr");
    if (thead.find("th").length === 3) {
        thead.find("th:last").before('<th>Sales Count</th>');
    }
}


// Sort categories by name
function sortCategories() {
    $.get(categoryListApiUrl, function(categories) {
        categories.sort(function(a, b) {
            if (sortDirection === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });

        // Toggle sort direction for next click
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';

        // Update the button text with arrow indicators
        var buttonText = sortDirection === 'asc' ? 'Sort by Name ▼' : 'Sort by Name ▲';
        $("#sortCategoriesBtn").text(buttonText);

        displayCategories(categories);
    }).fail(function(error) {
        console.error("Error loading categories for sorting:", error);
        alert("Error loading categories for sorting. Please check the console for details.");
    });
}

// Open modal for adding a new category
function openAddCategoryModal() {
    resetCategoryForm();
    categoryModal.find('.modal-title').text('Add New Category');
    categoryModal.modal('show');
}

// Edit category - populate form with existing data
function editCategory() {
    var tr = $(this).closest('tr');
    var categoryNumber = tr.data('number');
    var categoryName = tr.data('name');

    $("#category_number").val(categoryNumber);
    $("#category_name").val(categoryName);

    categoryModal.find('.modal-title').text('Edit Category');
    categoryModal.modal('show');
}

//для запиту
// Show category summary in modal
function showCategorySummary() {
    var tr = $(this).closest('tr');
    var categoryNumber = tr.data('number');
    var categoryName = tr.data('name');

    $.ajax({
        url: storeProductsSummaryApiUrl,
        type: 'GET',
        data: { category_number: categoryNumber },
        success: function(response) {
            var content = '<div class="table-responsive"><table class="table table-bordered"><thead><tr>' +
                '<th>Номер категорії</th>' +
                '<th>Назва категорії</th>' +
                '<th>Кількість продуктів у магазині</th>' +
                '<th>Загальна кількість</th>' +
                '</tr></thead><tbody>';

            if (response.length === 0) {
                content += '<tr><td colspan="4">Продуктів у магазині для цієї категорії не знайдено.</td></tr>';
            } else {
                response.forEach(function(row) {
                    content += '<tr>' +
                        '<td>' + row.category_number + '</td>' +
                        '<td>' + row.category_name + '</td>' +
                        '<td>' + row.store_product_count + '</td>' +
                        '<td>' + row.total_quantity + '</td>' +
                        '</tr>';
                });
            }

            content += '</tbody></table></div>';
            $('#summaryContent').html(content);
            summaryModal.find('.modal-title').text('Зведення для категорії: ' + categoryName);
            summaryModal.modal('show');
        },
        error: function(xhr) {
            console.error('Помилка отримання зведення:', xhr.responseText);
            alert('Помилка отримання зведення: ' + xhr.responseText);
        }
    });
}

//для запиту
function showDeadCategories() {
    $.ajax({
        url: deadCategoriesApiUrl,
        type: 'GET',
        success: function(response) {
            var content = '<div class="table-responsive"><table class="table table-bordered"><thead><tr>' +
                '<th>Номер категорії</th>' +
                '<th>Назва категорії</th>' +
                '</tr></thead><tbody>';

            if (response.length === 0) {
                content += '<tr><td colspan="2">Категорій без неактивних продуктів не знайдено.</td></tr>';
            } else {
                response.forEach(function(row) {
                    content += '<tr>' +
                        '<td>' + row.category_number + '</td>' +
                        '<td>' + row.category_name + '</td>' +
                        '</tr>';
                });
            }

            content += '</tbody></table></div>';
            $('#deadCategoriesContent').html(content);
            deadCategoriesModal.find('.modal-title').text('Категорії без неактивних продуктів');
            deadCategoriesModal.modal('show');
        },
        error: function(xhr) {
            console.error('Помилка отримання даних про категорії:', xhr.responseText);
            alert('Помилка отримання даних про категорії: ' + xhr.responseText);
        }
    });
}

// Validate category form
function validateCategoryForm() {
    let isValid = true;
    const errors = {};

    // Скидання попередніх повідомлень про помилки та підсвічування
    $('.error-message').hide().find('.error-text').text('');
    $('.is-invalid').removeClass('is-invalid');

    // Валідація Category Name
    const categoryName = $("#category_name").val().trim();
    if (!categoryName) {
        errors.category_name = 'Назва категорії є обов\'язковим полем.';
        isValid = false;
    } else if (categoryName.length < 3) {
        errors.category_name = 'Назва категорії має містити щонайменше 3 символи.';
        isValid = false;
    } else if (!/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9\s]+$/.test(categoryName)) {
        errors.category_name = 'Назва категорії може містити лише літери, цифри та пробіли.';
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

// Save category (create or update)
function saveCategory() {
    // Перевіряємо валідацію перед збереженням
    if (!validateCategoryForm()) {
        return;
    }

    var categoryData = {
        category_number: $("#category_number").val(),
        category_name: $("#category_name").val()
    };

    $.ajax({
        url: categorySaveApiUrl,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(categoryData),
        success: function(response) {
            categoryModal.modal('hide');
            loadCategories(); // Refresh the table

            // Show success message
            if (categoryData.category_number) {
                alert("Category updated successfully");
            } else {
                alert("Category created successfully");
            }
        },
        error: function(xhr, status, error) {
            console.error("Error saving category:", xhr.responseText);
            alert("Error saving category: " + xhr.responseText);
        }
    });
}

// Delete category
function deleteCategory() {
    var tr = $(this).closest('tr');
    var categoryNumber = tr.data('number');
    var categoryName = tr.data('name');

    var confirmDelete = confirm(`Are you sure you want to delete the category "${categoryName}"?`);
    if (!confirmDelete) return;

    $.ajax({
        url: categoryDeleteApiUrl,
        method: 'POST',
        data: { category_number: categoryNumber },
        success: function(response) {
            if (response.success) {
                alert("Category deleted successfully");
                loadCategories(); // Refresh the table
            } else {
                alert(response.message);
            }
        },
        error: function(xhr, status, error) {
            console.error("Error deleting category:", xhr.responseText);
            alert("Error deleting category: " + xhr.responseText);
        }
    });
}
$("#sortBySalesBtn").click(function () {
    $.get("/api/category_sales_count", function (salesData) {
        if (!Array.isArray(salesData)) {
            alert("Error loading sales data.");
            return;
        }

        // Map sales: category_number -> count
        const salesMap = {};
        salesData.forEach(row => {
            salesMap[row.category_number] = row.total_sales;
        });

        // Fetch category list again and sort based on sales count
        $.get(categoryListApiUrl, function (categories) {
            categories.sort(function (a, b) {
                const salesA = salesMap[a.category_number] || 0;
                const salesB = salesMap[b.category_number] || 0;
                return salesB - salesA;
            });

            displayCategories(categories, salesMap);
        });
    }).fail(function (err) {
        console.error("Failed to load category sales count", err.responseText);
        alert("Failed to load sales data");
    });
});


// Reset category form and clear errors
function resetCategoryForm() {
    categoryForm[0].reset();
    $("#category_number").val(''); // Clear hidden field
    categoryModal.find('.modal-title').text('Add New Category');
    $('.error-message').hide().find('.error-text').text(''); // Очищаємо повідомлення про помилки
    $('.is-invalid').removeClass('is-invalid'); // Очищаємо підсвічування
}