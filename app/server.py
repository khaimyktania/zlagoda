from flask import Flask, request, jsonify

from app import category_dao
from sql_connection import get_sql_connection
import json
import employee_dao
import product_dao
import customer_dao
import store_product_dao

app = Flask(__name__, static_folder='../web', template_folder='../web')

connection = get_sql_connection()


@app.route('/')
def home():
    return app.send_static_file('main.html')



@app.route('/manage_product')
def manage_product():
    return app.send_static_file('manage_product.html')

@app.route('/manage_store_product')
def manage_store_product():
    return app.send_static_file('manage_store_product.html')

@app.route('/getProducts', methods=['GET'])
def get_products():
    response = product_dao.get_all_products(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/insertProduct', methods=['POST'])
def insert_product():
    try:
        request_payload = json.loads(request.form['data'])
        print(f"Product request payload: {request_payload}")

        # Check if this is an update or insert
        if request_payload.get('id_product') and request_payload['id_product'].strip():
            # This is an update
            print(f"Updating product with ID: {request_payload['id_product']}")
            rows_updated = product_dao.update_product(connection, request_payload)
            response = jsonify({
                'success': True,
                'operation': 'update',
                'rows_updated': rows_updated
            })
        else:
            # This is a new insert
            print("Inserting new product")
            product_id = product_dao.insert_new_product(connection, request_payload)
            response = jsonify({
                'success': True,
                'operation': 'insert',
                'product_id': product_id
            })

        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        # print(f"Error in insert_product: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/deleteProduct', methods=['POST'])
def delete_product():
    return_id = product_dao.delete_products(connection, request.form['product_id'])
    response = jsonify({
        'product_id': return_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/getCategories', methods=['GET'])
def get_categories():
    response = category_dao.get_categories(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/manage_employee')
def manage_employee():
    return app.send_static_file('manage-employee.html')


@app.route('/getEmployees', methods=['GET'])
def get_employees():
    response = employee_dao.get_all_employees(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/insertEmployee', methods=['POST'])
def insert_employee():
    request_payload = json.loads(request.form['data'])

    # Check if this is an update operation (id_employee exists and is not empty)
    if request_payload.get('id_employee'):
        # This is an update
        rows_updated = employee_dao.update_employee(connection, request_payload)
        response = jsonify({
            'success': True,
            'rows_updated': rows_updated
        })
    else:
        # Generate a new ID for insertion (you may need to adjust this based on your ID format)
        # For example, if your ID is numeric:
        cursor = connection.cursor()
        cursor.execute("SELECT MAX(CAST(id_employee AS UNSIGNED)) FROM employee")
        result = cursor.fetchone()
        max_id = result[0] if result[0] else 0
        new_id = str(int(max_id) + 1) if max_id else "1"

        # Set the new ID in the payload
        request_payload['id_employee'] = new_id

        # This is a new insert
        employee_id = employee_dao.insert_new_employee(connection, request_payload)
        response = jsonify({
            'success': True,
            'id_employee': new_id
        })

    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/updateEmployee', methods=['POST'])
def update_employee():
    request_payload = json.loads(request.form['data'])
    rows_updated = employee_dao.update_employee(connection, request_payload)
    response = jsonify({
        'success': True,
        'rows_updated': rows_updated
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/deleteEmployee', methods=['POST'])
def delete_employee():
    employee_id = request.form['id_employee']
    rows_deleted = employee_dao.delete_employee(connection, employee_id)
    return jsonify({
        'success': True,
        'deleted_id': employee_id,
        'rows_deleted': rows_deleted
    })


@app.route('/getCashiers', methods=['GET'])
def get_cashiers():
    cashiers = employee_dao.get_cashiers_ordered_by_surname(connection)
    response = jsonify(cashiers)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/getEmployeesSorted')
def get_employees_sorted():
    connection = get_sql_connection()
    employees = employee_dao.get_all_employees_ordered_by_surname(connection)
    return jsonify(employees)

@app.route('/getCashiersSorted')
def get_cashiers_sorted():
    connection = get_sql_connection()
    cashiers = employee_dao.get_cashiers_ordered_by_surname(connection)
    return jsonify(cashiers)

@app.route('/getContactBySurname')
def get_contact_by_surname_api():
    surname = request.args.get('surname')
    connection = get_sql_connection()
    result = employee_dao.get_contact_by_surname(connection, surname)
    if result:
        return jsonify(result)
    else:
        return jsonify(None)

@app.route('/getAllProductsSorted', methods=['GET'])
def get_all_products_sorted():
    return jsonify(product_dao.get_all_products_sorted(connection))

@app.route('/getProductsByCategory', methods=['GET'])
def get_products_by_category():
    category_number = request.args.get('category_number')
    return jsonify(product_dao.get_products_by_category(connection, category_number))

@app.route('/manage_category')
def manage_category():
    return app.send_static_file('manage_category.html')


@app.route('/saveCategory', methods=['POST'])
def save_category():
    try:
        request_payload = request.get_json()
        print(f"Category request payload: {request_payload}")

        # Check if this is an update or insert
        if request_payload.get('category_number') and str(request_payload['category_number']).strip():
            # This is an update
            print(f"Updating category with number: {request_payload['category_number']}")
            rows_updated = category_dao.update_category(connection, request_payload)
            response = jsonify({
                'success': True,
                'operation': 'update',
                'rows_updated': rows_updated
            })
        else:
            # This is a new insert
            print("Inserting new category")
            category_id = category_dao.insert_new_category(connection, request_payload)
            response = jsonify({
                'success': True,
                'operation': 'insert',
                'category_number': category_id
            })

        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in save_category: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/deleteCategory', methods=['POST'])
def delete_category():
    try:
        category_number = request.form['category_number']
        result = category_dao.delete_category(connection, category_number)

        if result['success']:
            response = jsonify({
                'success': True,
                'message': 'Category deleted successfully',
                'rows_deleted': result['rows_deleted']
            })
        else:
            response = jsonify({
                'success': False,
                'message': result['message']
            })

        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in delete_category: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# Add these routes to your server.py file
@app.route('/manage_customer')
def manage_customer():
    return app.send_static_file('manage_customer.html')


@app.route('/getCustomers', methods=['GET'])
def get_customers():
    response = customer_dao.get_all_customers(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/getCustomersSorted', methods=['GET'])
def get_customers_sorted():
    response = customer_dao.get_all_customers_ordered_by_surname(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/getPremiumCustomers', methods=['GET'])
def get_premium_customers():
    response = customer_dao.get_premium_customers(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/getCustomerContactBySurname', methods=['GET'])
def get_customer_contact_by_surname():
    surname = request.args.get('surname')
    response = customer_dao.get_contact_by_surname(connection, surname)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/insertCustomer', methods=['POST'])
def insert_customer():
    try:
        request_payload = json.loads(request.form['data'])
        print(f"Customer request payload: {request_payload}")

        # Check if this is an update or insert
        if request_payload.get('card_number') and request_payload['card_number'].strip():
            # Check if customer already exists (this would be an update)
            cursor = connection.cursor()
            cursor.execute("SELECT card_number FROM customer_card WHERE card_number = %s",
                           (request_payload['card_number'],))
            result = cursor.fetchone()

            if result:
                # This is an update
                print(f"Updating customer with card number: {request_payload['card_number']}")
                rows_updated = customer_dao.update_customer(connection, request_payload)
                response = jsonify({
                    'success': True,
                    'operation': 'update',
                    'rows_updated': rows_updated
                })
            else:
                # This is a new insert with provided card number
                print("Inserting new customer with provided card number")
                customer_dao.insert_new_customer(connection, request_payload)
                response = jsonify({
                    'success': True,
                    'operation': 'insert',
                    'card_number': request_payload['card_number']
                })
        else:
            # Card number is required, so we should return an error
            return jsonify({
                'success': False,
                'error': 'Card number is required'
            }), 400

        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in insert_customer: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/deleteCustomer', methods=['POST'])
def delete_customer():
    try:
        card_number = request.form['card_number']
        rows_deleted = customer_dao.delete_customer(connection, card_number)

        response = jsonify({
            'success': True,
            'message': 'Customer deleted successfully',
            'rows_deleted': rows_deleted
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in delete_customer: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

    # Add these routes to your server.py file


@app.route('/getStoreProducts', methods=['GET'])
def get_store_products():
        response = store_product_dao.get_all_store_products(connection)
        response = jsonify(response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

@app.route('/getStoreProductByUPC', methods=['GET'])
def get_store_product_by_upc():
        upc = request.args.get('upc')
        if not upc:
            return jsonify({"success": False, "message": "UPC is required"}), 400

        response = store_product_dao.get_store_product_by_upc(connection, upc)
        if response:
            response = jsonify(response)
            response.headers.add('Access-Control-Allow-Origin', '*')
            return response
        else:
            return jsonify({"success": False, "message": "Product not found"}), 404

@app.route('/insertStoreProduct', methods=['POST'])
def insert_store_product():
    try:
        request_payload = json.loads(request.form['data'])
        print(f"Store product request payload: {request_payload}")

        # Check if this is an update (UPC exists in database) or insert
        existing_product = store_product_dao.get_store_product_by_upc(connection, request_payload.get('UPC'))

        if existing_product:
            # This is an update
            print(f"Updating store product with UPC: {request_payload['UPC']}")
            rows_updated = store_product_dao.update_store_product(connection, request_payload)
            response = jsonify({
                'success': True,
                'operation': 'update',
                'rows_updated': rows_updated
            })
        else:
            # This is a new insert
            print("Inserting new store product")
            result = store_product_dao.insert_store_product(connection, request_payload)
            response = jsonify({
                'success': True,
                'operation': 'insert',
                'result': result
            })

        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in insert_store_product: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/deleteStoreProduct', methods=['POST'])
def delete_store_product():
    try:
        upc = request.form['upc']
        rows_deleted = store_product_dao.delete_store_product(connection, upc)

        response = jsonify({
            'success': True,
            'message': 'Store product deleted successfully',
            'rows_deleted': rows_deleted
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in delete_store_product: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/makePromotional', methods=['POST'])
def make_promotional():
    try:
        upc = request.form['upc']
        promotional = request.form.get('promotional', 'true').lower() == 'true'

        result = store_product_dao.make_product_promotional(connection, upc, promotional)

        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in make_promotional: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/updateProductQuantity', methods=['POST'])
def update_product_quantity():
    try:
        upc = request.form['upc']
        new_quantity = request.form['quantity']

        result = store_product_dao.update_product_quantity(connection, upc, new_quantity)

        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in update_product_quantity: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/getProductVAT', methods=['GET'])
def get_product_vat():
    upc = request.args.get('upc')
    if not upc:
        return jsonify({"success": False, "message": "UPC is required"}), 400

    result = store_product_dao.recalculate_vat(connection, upc)
    response = jsonify(result)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/getPromotionalProductsSortedByQuantity', methods=['GET'])
def get_promotional_products_sorted_by_quantity():
    try:
        response = store_product_dao.get_promotional_products_sorted_by_quantity(connection)
        response = jsonify(response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in get_promotional_products_sorted_by_quantity: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/getPromotionalProductsSortedByName', methods=['GET'])
def get_promotional_products_sorted_by_name():
    try:
        response = store_product_dao.get_promotional_products_sorted_by_name(connection)
        response = jsonify(response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in get_promotional_products_sorted_by_name: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/getNonPromotionalProductsSortedByQuantity', methods=['GET'])
def get_non_promotional_products_sorted_by_quantity():
    try:
        response = store_product_dao.get_non_promotional_products_sorted_by_quantity(connection)
        response = jsonify(response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in get_non_promotional_products_sorted_by_quantity: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/getNonPromotionalProductsSortedByName', methods=['GET'])
def get_non_promotional_products_sorted_by_name():
    try:
        response = store_product_dao.get_non_promotional_products_sorted_by_name(connection)
        response = jsonify(response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in get_non_promotional_products_sorted_by_name: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/getAllProductsSortedByQuantity', methods=['GET'])
def get_all_products_sorted_by_quantity():
    try:
        response = store_product_dao.get_all_store_products_sorted_by_quantity(connection)
        response = jsonify(response)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in get_all_products_sorted_by_quantity: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == "__main__":
    print("Starting Python Flask Server For Grocery Store Management System")
    app.run(port=5000, debug=True)