// API endpoints
var categoryListApiUrl = 'http://127.0.0.1:5000/getCategories';
var categorySaveApiUrl = 'http://127.0.0.1:5000/saveCategory';
var categoryDeleteApiUrl = 'http://127.0.0.1:5000/deleteCategory';

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

    // Event delegation for dynamic buttons
    $(document).on('click', '.edit-category', editCategory);
    $(document).on('click', '.delete-category', deleteCategory);

    // Reset form and clear errors when modal is closed
    categoryModal.on('hide.bs.modal', resetCategoryForm);

    // Clear errors when modal is opened
    categoryModal.on('show.bs.modal', function() {
        $('.error-message').hide().find('.error-text').text('');
        $('.is-invalid').removeClass('is-invalid');
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
function displayCategories(categories) {
    var tbody = $("#categoryTableBody");
    tbody.empty();

    categories.forEach(function(category) {
        var row = `
            <tr data-number="${category.category_number}" data-name="${category.name}">
                <td>${category.category_number}</td>
                <td>${category.name}</td>
                <td>
                    <span class="btn btn-xs btn-primary edit-category">Edit</span>
                    <span class="btn btn-xs btn-danger delete-category">Delete</span>
                </td>
            </tr>
        `;
        tbody.append(row);
    });
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
    } else if (!/^[a-zA-Z0-9\s]+$/.test(categoryName)) {
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

// Reset category form and clear errors
function resetCategoryForm() {
    categoryForm[0].reset();
    $("#category_number").val(''); // Clear hidden field
    categoryModal.find('.modal-title').text('Add New Category');
    $('.error-message').hide().find('.error-text').text(''); // Очищаємо повідомлення про помилки
    $('.is-invalid').removeClass('is-invalid'); // Очищаємо підсвічування
}