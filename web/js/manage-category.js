// API endpoints
var categoryListApiUrl = 'http://127.0.0.1:5000/getCategories';
var categorySaveApiUrl = 'http://127.0.0.1:5000/saveCategory';
var categoryDeleteApiUrl = 'http://127.0.0.1:5000/deleteCategory';

// DOM elements
var categoryModal = $("#categoryModal");
var categoryForm = $("#categoryForm");

$(document).ready(function() {
    // Load categories when page loads
    loadCategories();

    // Setup event handlers
    $("#addCategoryBtn").click(openAddCategoryModal);
    $("#saveCategory").click(saveCategory);

    // Event delegation for dynamic buttons
    $(document).on('click', '.edit-category', editCategory);
    $(document).on('click', '.delete-category', deleteCategory);

    // Reset form when modal is closed
    categoryModal.on('hide.bs.modal', resetCategoryForm);
});

// Load all categories into the table
function loadCategories() {
    $.get(categoryListApiUrl, function(categories) {
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
    }).fail(function(error) {
        console.error("Error loading categories:", error);
        alert("Error loading categories. Please check the console for details.");
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

// Save category (create or update)
function saveCategory() {
    var categoryData = {
        category_number: $("#category_number").val(),
        category_name: $("#category_name").val()
    };

    if (!categoryData.category_name) {
        alert("Category name is required");
        return;
    }

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

// Reset category form
function resetCategoryForm() {
    categoryForm[0].reset();
    $("#category_number").val(''); // Clear hidden field
    categoryModal.find('.modal-title').text('Add New Category');
}