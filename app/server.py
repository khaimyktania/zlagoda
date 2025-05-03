from flask import Flask, request, jsonify
from flask import Flask, request, jsonify, session, redirect
from functools import wraps
from credentials_utils import load_credentials, save_credentials, auto_generate_credentials
from flask import jsonify, session
from datetime import date
from app import category_dao
from sql_connection import get_sql_connection, execute_query
import json
import employee_dao
import product_dao
import customer_dao
import store_product_dao
import check_dao
from store_product_dao import get_all_store_products_sorted
from sql_connection import get_sql_connection




app = Flask(__name__, static_folder='../web', template_folder='../web')
app.secret_key = 'supersecretkey'  # заміни на щось безпечне
connection = get_sql_connection()

employees = employee_dao.get_all_employees(connection)
auto_generate_credentials(employees)


def require_role(*roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Відлагоджувальна інформація
            print(f"Checking role. Session: {session}")
            print(f"Required roles: {roles}")

            # Перевірка на авторизацію
            if 'role' not in session or 'id_employee' not in session:
                print("Authentication required. User not logged in.")
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Будь ласка, увійдіть в систему'
                }), 401

            user_role = session.get('role')
            print(f"User role: {user_role}")

            if user_role not in roles:
                print(f"Access denied for role {user_role}")
                return jsonify({
                    'error': 'Access denied',
                    'message': f'Ця функція доступна тільки для ролей: {", ".join(roles)}. Ваша роль: {user_role}'
                }), 403

            print(f"Access granted for role {user_role}")
            return func(*args, **kwargs)

        return wrapper

    return decorator


@app.route('/')
def home():
    return app.send_static_file('main.html')


from credentials_utils import check_password  # додай імпорт

@app.route('/login', methods=['POST'])
def login():
    try:
        username = request.form.get('username')
        password = request.form.get('password')

        print(f"Login attempt for username: {username}")

        credentials = load_credentials()
        for id_emp, cred in credentials.items():
            if cred['login'] == username and check_password(password, cred['password_hash'], cred['salt']):
                session['role'] = cred['role']
                session['id_employee'] = id_emp
                print(f"Login successful. Role: {cred['role']}, ID: {id_emp}")
                return jsonify({'success': True, 'role': cred['role']})

        print("Invalid credentials")
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"[LOGIN ERROR]: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/getCustomerPurchasesByDateRange', methods=['GET'])
@require_role('manager')
def get_customer_purchases_by_date_range():
    connection = None
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not start_date or not end_date:
            return jsonify({
                'success': False,
                'message': 'Start and end dates are required'
            }), 400

        connection = get_sql_connection()
        response = check_dao.get_customer_purchases_by_date_range(connection, start_date, end_date)

        return jsonify(response)
    except Exception as e:
        print(f"Error in get_customer_purchases_by_date_range: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/api/employee_info', methods=['GET'])
def get_employee_info():
    try:
        user_id = session.get('id_employee')
        user_role = session.get('role')
        print(f"Fetching employee info for user_id: {user_id}, role: {user_role}")

        if not user_id:
            print("Session error: No id_employee in session")
            return jsonify({'success': False, 'message': 'User not authenticated, no id_employee in session'}), 401

        connection = get_sql_connection()
        query = """
        SELECT id_employee, empl_name, empl_surname, empl_role
        FROM employee
        WHERE id_employee = %s
        """
        result = execute_query(connection, query, (user_id,))
        connection.close()

        if result:
            employee = result[0]
            response = {
                'id_employee': employee['id_employee'],
                'empl_name': employee['empl_name'],
                'empl_surname': employee['empl_surname'],
                'empl_role': employee['empl_role']
            }
            print(f"Returning employee info: {response}")
            return jsonify(response)
        else:
            print(f"Employee not found for user_id: {user_id}")
            return jsonify({'success': False, 'message': 'Employee not found in database'}), 404
    except Exception as e:
        print(f"Error in get_employee_info: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/manage_product')
@require_role('cashier','manager')
def manage_product():
    return app.send_static_file('manage_product.html')

@app.route('/manage_store_product')
def manage_store_product():
    return app.send_static_file('manage_store_product.html')


@app.route('/getProducts', methods=['GET'])
@require_role('cashier', 'manager')
def get_products():
    connection = None
    try:
        print("Endpoint /getProducts викликаний")
        # Печатаємо інформацію про сесію для відлагодження
        print(f"Поточна сесія: {session}")

        connection = get_sql_connection()
        products = product_dao.get_all_products(connection)
        print(f"Retrieved {len(products)} products from database")
        response = jsonify(products)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Помилка в get_products: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/insertProduct', methods=['POST'])
@require_role('manager')
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
@require_role('manager')
def delete_product():
    return_id = product_dao.delete_products(connection, request.form['product_id'])
    response = jsonify({
        'product_id': return_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/searchProductsByName', methods=['GET'])
def search_products_by_name_api():
    connection = get_sql_connection()
    product_name = request.args.get('name')

    products = []
    if product_name:
        products = product_dao.search_products_by_name(connection, product_name)
    else:
        products = product_dao.get_all_products(connection)

    connection.close()
    return jsonify(products)

@app.route('/manage-employee')
@require_role('manager')
def manage_employee():
    return app.send_static_file('manage-employee.html')


@app.route('/getEmployees', methods=['GET'])
@require_role('manager')
def get_employees():
    response = employee_dao.get_all_employees(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/insertEmployee', methods=['POST'])
@require_role('manager')
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
@require_role('manager')
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
@require_role('manager')
def delete_employee():
    connection = None
    try:
        employee_id = request.form['id_employee']
        connection = get_sql_connection()
        result = employee_dao.delete_employee(connection, employee_id)
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Employee deleted successfully',
                'rows_updated': result['rows_updated']
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 500
    except Exception as e:
        print(f"Error in delete_employee: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/getCashiers', methods=['GET'])
@require_role('cashier','manager')
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
@require_role('manager')
def get_cashiers_sorted():
    connection = get_sql_connection()
    cashiers = employee_dao.get_cashiers_ordered_by_surname(connection)
    return jsonify(cashiers)

@app.route('/getContactBySurname')
@require_role('manager')
def get_contact_by_surname_api():
    surname = request.args.get('surname')
    connection = get_sql_connection()
    result = employee_dao.get_contact_by_surname(connection, surname)
    if result:
        return jsonify(result)
    else:
        return jsonify(None)
@app.route('/getEmployeesNeverSoldPromotionalToNonPremium', methods=['GET'])
@require_role('manager')
def get_employees_never_sold_promotional_to_non_premium():
    connection = None
    try:
        connection = get_sql_connection()
        response = employee_dao.get_employees_never_sold_promotional_to_non_premium(connection)
        return jsonify(response)
    except Exception as e:
        print(f"Помилка в get_employees_never_sold_promotional_to_non_premium: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()
@app.route('/getEmployeesNeverSoldPromotionalToNonCardHolders', methods=['GET'])
@require_role('manager')
def get_employees_never_sold_promotional_to_non_card_holders():
    connection = None
    try:
        connection = get_sql_connection()
        response = employee_dao.get_employees_never_sold_promotional_to_non_card_holders(connection)
        return jsonify(response)
    except Exception as e:
        print(f"Помилка в get_employees_never_sold_promotional_to_non_card_holders: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/getAllProductsSorted', methods=['GET'])
@require_role('cashier','manager')
def get_all_products_sorted():
    return jsonify(product_dao.get_all_products_sorted(connection))

@app.route('/getProductsNotInStore', methods=['GET'])
@require_role('cashier', 'manager')
def get_products_not_in_store():
    connection = None
    try:
        connection = get_sql_connection()
        query = """
        SELECT p.id_product, p.product_name
        FROM products p
        LEFT JOIN store_products sp ON p.id_product = sp.id_product
        WHERE sp.id_product IS NULL OR sp.products_number = 0
        ORDER BY p.product_name ASC
        """
        products = execute_query(connection, query)
        return jsonify(products)
    except Exception as e:
        print(f"Error in get_products_not_in_store: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/getAvailableProducts', methods=['GET'])
@require_role('cashier', 'manager')
def get_available_products():
    connection = None
    try:
        connection = get_sql_connection()
        products = product_dao.get_available_products(connection)
        return jsonify(products)
    except Exception as e:
        print(f"Помилка в get_available_products: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/getProductsByCategory', methods=['GET'])
@require_role('cashier','manager')
def get_products_by_category():
    category_number = request.args.get('category_number')
    return jsonify(product_dao.get_products_by_category(connection, category_number))


@app.route('/manage_category')
@require_role('manager')
def manage_category():
    return app.send_static_file('manage_category.html')

@app.route('/getCategories', methods=['GET'])
@require_role('cashier','manager')
def get_categories():
    connection = None
    try:
        connection = get_sql_connection()
        response_data = category_dao.get_categories(connection)
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Помилка в get_categories: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/saveCategory', methods=['POST'])
@require_role('manager')
def save_category():
    connection = None
    try:
        request_payload = request.get_json()
        print(f"Category request payload: {request_payload}")

        connection = get_sql_connection()

        if request_payload.get('category_number') and str(request_payload['category_number']).strip():
            # Update category
            print(f"Updating category with number: {request_payload['category_number']}")
            rows_updated = category_dao.update_category(connection, request_payload)
            result = {
                'success': True,
                'operation': 'update',
                'rows_updated': rows_updated
            }
        else:
            # Insert new category
            print("Inserting new category")
            category_id = category_dao.insert_new_category(connection, request_payload)
            result = {
                'success': True,
                'operation': 'insert',
                'category_number': category_id
            }

        response = jsonify(result)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        print(f"Error in save_category: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if connection:
            connection.close()


@app.route('/deleteCategory', methods=['POST'])
@require_role('manager')
def delete_category():
    connection = None
    try:
        category_number = request.form['category_number']
        connection = get_sql_connection()
        result = category_dao.delete_category(connection, category_number)

        if result['success']:
            response_data = {
                'success': True,
                'message': 'Category deleted successfully',
                'rows_deleted': result['rows_deleted']
            }
        else:
            response_data = {
                'success': False,
                'message': result['message']
            }

        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response

    except Exception as e:
        print(f"Error in delete_category: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if connection:
            connection.close()

# Add these routes to your server.py file
@app.route('/manage_customer')
@require_role('cashier','manager')
def manage_customer():
    return app.send_static_file('manage_customer.html')


@app.route('/getCustomers', methods=['GET'])
@require_role('cashier','manager')
def get_customers():
    response = customer_dao.get_all_customers(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/api/current_employee')
@require_role('cashier','manager')
def get_current_employee():
    id_employee = session.get('id_employee')
    if not id_employee:
        return jsonify({'error': 'Not logged in'}), 401

    emp = employee_dao.get_employee_by_id(connection, id_employee)
    if not emp:
        return jsonify({'error': 'Employee not found'}), 404

    return jsonify({
        'empl_name': emp['empl_name'],
        'empl_surname': emp['empl_surname'],
        'empl_role': emp['empl_role']
    })

@app.route('/getCustomersSorted', methods=['GET'])
@require_role('cashier','manager')
def get_customers_sorted():
    response = customer_dao.get_all_customers_ordered_by_surname(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/getPremiumCustomers', methods=['GET'])
@require_role('cashier','manager')
def get_premium_customers():
    response = customer_dao.get_premium_customers(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/getCustomerContactBySurname', methods=['GET'])
@require_role('manager')
def get_customer_contact_by_surname():
    surname = request.args.get('surname')
    response = customer_dao.get_contact_by_surname(connection, surname)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/insertCustomer', methods=['POST'])
@require_role('manager', 'cashier')
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
@require_role('manager')
def delete_customer():
    connection = None
    try:
        card_number = request.form['card_number']
        connection = get_sql_connection()
        result = customer_dao.delete_customer(connection, card_number)
        if result['success']:
            response = jsonify({
                'success': True,
                'message': 'Customer deleted successfully',
                'rows_updated': result['rows_updated']
            })
        else:
            response = jsonify({
                'success': False,
                'message': result['message']
            })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Error in delete_customer: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    finally:
        if connection:
            connection.close()

    # Add these routes to your server.py file

@app.route('/getStoreProducts', methods=['GET'])
@require_role('cashier', 'manager')
def get_store_products():
    connection = None
    try:
        connection = get_sql_connection()
        response = store_product_dao.get_all_store_products(connection)
        return jsonify(response)
    except Exception as e:
        print(f"Error in get_store_products: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/getStoreProductByUPC', methods=['GET'])
@require_role('cashier','manager')
def get_store_product_by_upc():
    upc = request.args.get('upc')
    if not upc:
        return jsonify({"success": False, "message": "UPC is required"}), 400
    connection = get_sql_connection()
    try:
        # Змінено: використовуємо get_store_product_detail_by_upc замість get_store_product_by_upc
        response = store_product_dao.get_store_product_detail_by_upc(connection, upc)
        if response:
            return jsonify(response)
        else:
            return jsonify({"success": False, "message": "Product not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        connection.close()

@app.route('/generateUPC', methods=['GET'])
@require_role('manager')
def generate_upc():
    connection = get_sql_connection()
    try:
        new_upc = store_product_dao.generate_upc(connection)
        return jsonify({"success": True, "upc": new_upc})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        connection.close()

@app.route('/repriceStoreProduct', methods=['POST'])
@require_role('manager')
def reprice_store_product():
    connection = get_sql_connection()
    try:
        upc = request.form['upc']
        new_price = float(request.form['new_price'])
        additional_quantity = int(request.form.get('additional_quantity', 0))
        result = store_product_dao.reprice_store_product(connection, upc, new_price, additional_quantity)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        connection.close()

@app.route('/insertStoreProduct', methods=['POST'])
@require_role('manager')
def insert_store_product():
    connection = get_sql_connection()
    try:
        request_payload = json.loads(request.form['data'])
        existing_product = store_product_dao.get_store_product_by_upc(connection, request_payload.get('UPC'))

        if existing_product:
            rows_updated = store_product_dao.update_store_product(connection, request_payload)
            return jsonify({'success': True, 'operation': 'update', 'rows_updated': rows_updated})
        else:
            result = store_product_dao.insert_store_product(connection, request_payload)
            return jsonify({'success': True, 'operation': 'insert', 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/deleteStoreProduct', methods=['POST'])
@require_role('manager')
def delete_store_product():
    connection = None
    try:
        upc = request.form['upc']
        connection = get_sql_connection()
        result = store_product_dao.delete_store_product(connection, upc)
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Store product deleted successfully',
                'rows_updated': result['rows_updated']  # Змінено з rows_deleted на rows_updated
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 500
    except Exception as e:
        print(f"Error in delete_store_product: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/makePromotional', methods=['POST'])
@require_role('manager')
def make_promotional():
    connection = get_sql_connection()
    try:
        upc = request.form['upc']
        promotional = request.form.get('promotional', 'true').lower() == 'true'
        result = store_product_dao.make_product_promotional(connection, upc, promotional)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/updateProductQuantity', methods=['POST'])
@require_role('manager')
def update_product_quantity():
    connection = get_sql_connection()
    try:
        upc = request.form['upc']
        new_quantity = request.form['quantity']
        result = store_product_dao.update_product_quantity(connection, upc, new_quantity)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/getProductVAT', methods=['GET'])
@require_role('cashier','manager')
def get_product_vat():
    upc = request.args.get('upc')
    if not upc:
        return jsonify({"success": False, "message": "UPC is required"}), 400
    connection = get_sql_connection()
    try:
        result = store_product_dao.recalculate_vat(connection, upc)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/getPromotionalProductsSortedByQuantity', methods=['GET'])
@require_role('cashier', 'manager')
def get_promotional_products_sorted_by_quantity():
    connection = get_sql_connection()
    try:
        response = store_product_dao.get_promotional_products_sorted_by_quantity(connection)
        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/getPromotionalProductsSortedByName', methods=['GET'])
@require_role('cashier', 'manager')
def get_promotional_products_sorted_by_name():
    connection = get_sql_connection()
    try:
        response = store_product_dao.get_promotional_products_sorted_by_name(connection)
        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/getNonPromotionalProductsSortedByQuantity', methods=['GET'])
@require_role('cashier', 'manager')
def get_non_promotional_products_sorted_by_quantity():
    connection = get_sql_connection()
    try:
        response = store_product_dao.get_non_promotional_products_sorted_by_quantity(connection)
        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/getNonPromotionalProductsSortedByName', methods=['GET'])
@require_role('cashier', 'manager')
def get_non_promotional_products_sorted_by_name():
    connection = get_sql_connection()
    try:
        response = store_product_dao.get_non_promotional_products_sorted_by_name(connection)
        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()

@app.route('/getAllProductsSortedByQuantity', methods=['GET'])
@require_role('cashier', 'manager')
def get_all_products_sorted_by_quantity():
    connection = get_sql_connection()
    try:
        response = store_product_dao.get_all_store_products_sorted_by_quantity(connection)
        return jsonify(response)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        connection.close()


@app.route('/manage_check')
@require_role('cashier', 'manager')
def manage_check():
    return app.send_static_file('manage_check.html')
@app.route('/checkCardNumber', methods=['GET'])
@require_role('manager', 'cashier')
def check_card_number():
    connection = None
    try:
        card_number = request.args.get('card_number')
        if not card_number:
            return jsonify({'success': False, 'message': 'Card number is required'}), 400

        connection = get_sql_connection()
        cursor = connection.cursor()
        query = "SELECT card_number FROM customer_card WHERE card_number = %s"
        cursor.execute(query, (card_number,))
        result = cursor.fetchone()
        cursor.close()

        return jsonify({
            'success': True,
            'exists': bool(result),
            'card_number': card_number if result else None
        })
    except Exception as e:
        print(f"Error in check_card_number: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/getRecentChecks', methods=['GET'])
@require_role('cashier', 'manager')
def get_recent_checks():
    connection = None
    try:
        connection = get_sql_connection()
        limit = request.args.get('limit', 50, type=int)

        # Отримуємо роль та ID користувача з сесії
        user_role = session.get('role')
        user_id = session.get('id_employee')  # Змінено з 'user_id' на 'id_employee'

        # Касир бачить тільки свої чеки, менеджер - всі
        if user_role == 'cashier':
            response = check_dao.get_recent_checks(connection, limit, user_id)
        else:  # 'manager'
            response = check_dao.get_recent_checks(connection, limit)

        return jsonify(response)
    except Exception as e:
        print(f"Error in get_recent_checks: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/getCheckByNumber', methods=['GET'])
@require_role('cashier', 'manager')
def get_check_by_number():
    connection = None
    try:
        check_number = request.args.get('check_number')
        if not check_number:
            return jsonify({'success': False, 'message': 'Check number is required'}), 400

        connection = get_sql_connection()
        response = check_dao.get_check_by_number(connection, check_number)

        if response:
            user_role = session.get('role')
            user_id = session.get('id_employee')
            if user_role == 'cashier' and response['id_employee'] != user_id:
                return jsonify({'success': False, 'message': 'You do not have permission to view this check'}), 403
            return jsonify(response)
        else:
            return jsonify({'success': False, 'message': 'Check not found'}), 404
    except Exception as e:
        print(f"Error in get_check_by_number: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/getCheckProducts', methods=['GET'])
@require_role('cashier', 'manager')
def get_check_products():
    connection = None
    try:
        check_number = request.args.get('check_number')
        if not check_number:
            return jsonify({'success': False, 'message': 'Check number is required'}), 400

        connection = get_sql_connection()
        response = check_dao.get_check_products(connection, check_number)
        return jsonify(response)
    except Exception as e:
        print(f"Error in get_check_products: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/getCheckStatistics', methods=['GET'])
@require_role('manager', 'cashier')
def get_check_statistics():
    connection = None
    try:
        period = request.args.get('period', 'all')
        connection = get_sql_connection()

        user_role = session.get('role')
        user_id = session.get('id_employee')

        if user_role == 'cashier':
            response = check_dao.get_check_statistics(connection, period, user_id)
        else:
            response = check_dao.get_check_statistics(connection, period)

        return jsonify(response)
    except Exception as e:
        print(f"Error in get_check_statistics: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/generateCheckNumber', methods=['GET'])
@require_role('cashier')
def generate_check_number():
    connection = None
    try:
        connection = get_sql_connection()
        check_number = check_dao.generate_check_number(connection)
        return jsonify({'success': True, 'check_number': check_number})
    except Exception as e:
        print(f"Error in generate_check_number: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/insertCheck', methods=['POST'])
@require_role('cashier')
def insert_check():
    connection = None
    try:
        # Debug: Log request content type and data
        print("Request Content-Type:", request.headers.get('Content-Type'))
        print("Request data:", request.get_data(as_text=True))

        # Get JSON directly from request
        request_payload = request.json

        # Debug: Log what we received
        print("Received payload:", request_payload)
        print("Employee ID:", request_payload.get('id_employee'), "Type:", type(request_payload.get('id_employee')))

        connection = get_sql_connection()

        # Validate required fields with better debugging
        if not request_payload.get('check_number'):
            print("Missing check_number")
            return jsonify({'success': False, 'message': 'Check number is required'}), 400

        if not request_payload.get('id_employee'):
            print("Missing id_employee")
            return jsonify({'success': False, 'message': 'Employee ID is required'}), 400

        if not request_payload.get('sum_total'):
            print("Missing sum_total")
            return jsonify({'success': False, 'message': 'Total sum is required'}), 400

        result = check_dao.insert_check(connection, request_payload)

        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Check created successfully',
                'check_number': result['check_number']
            })
        else:
            print("DAO error:", result['message'])
            return jsonify({
                'success': False,
                'message': result['message']
            }), 500
    except Exception as e:
        print(f"Error in insert_check: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/deleteCheck', methods=['POST'])
@require_role('manager')
def delete_check():
    connection = None
    try:
        # Read JSON data from the request body instead of form data
        data = request.get_json()

        if not data or 'check_number' not in data:
            return jsonify({'success': False, 'message': 'Check number is required'}), 400

        check_number = data['check_number']

        connection = get_sql_connection()
        result = check_dao.delete_check(connection, check_number)

        if result['success']:
            return jsonify({
                'success': True,
                'message': 'Check deleted successfully',
                'rows_deleted': result['rows_deleted']
            })
        else:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 500
    except Exception as e:
        print(f"Error in delete_check: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/getChecksByDateRange', methods=['GET'])
@require_role('manager', 'cashier')
def get_checks_by_date_range():
    connection = None
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        user_role = session.get('role')
        user_id = session.get('id_employee')

        id_employee = request.args.get('id_employee')

        if not start_date or not end_date:
            return jsonify({'success': False, 'message': 'Start and end dates are required'}), 400

        connection = get_sql_connection()

        if user_role == 'cashier':
            employee_id = user_id
        else:
            employee_id = id_employee if id_employee and id_employee.strip() else None

        response = check_dao.find_checks_by_date_range(connection, start_date, end_date, employee_id)

        return jsonify(response)
    except Exception as e:
        print(f"Error in get_checks_by_date_range: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/getAllEmployees', methods=['GET'])
@require_role('cashier', 'manager')
def get_all_employees():
    connection = None
    try:
        connection = get_sql_connection()
        # This needs to be implemented based on your employee_dao module
        response = employee_dao.get_all_employees(connection)
        return jsonify(response)
    except Exception as e:
        print(f"Error in get_all_employees: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/getAllCustomers', methods=['GET'])
@require_role('cashier', 'manager')
def get_all_customers():
    connection = None
    try:
        connection = get_sql_connection()
        response = customer_dao.get_all_customers(connection)
        return jsonify(response)
    except Exception as e:
        print(f"Error in get_all_customers: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/reports')
def reports():
    return app.send_static_file('reports.html')
@app.route('/api/reports/employees')
@require_role('manager')
def report_employees():
    result = employee_dao.get_all_employees_ordered_by_surname(connection)
    return jsonify(result)

@app.route('/api/reports/customers')
@require_role('manager')
def report_customers():
    result = customer_dao.get_all_customers_ordered_by_surname(connection)
    return jsonify(result)

@app.route('/api/reports/categories')
@require_role('manager')
def report_categories():
    result = category_dao.get_categories(connection)
    return jsonify(result)

@app.route('/api/reports/products')
@require_role('manager')
def report_products():
    result = product_dao.get_all_products(connection)
    return jsonify(result)

@app.route('/api/reports/store-products')
@require_role('manager')
def report_store_products():
    result = store_product_dao.get_all_store_products(connection)
    return jsonify(result)

@app.route('/api/reports/receipts')
@require_role('manager')
def report_receipts():
    connection = get_sql_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT check_number, print_date, sum_total, vat FROM `check` ORDER BY print_date DESC")
    result = cursor.fetchall()
    return jsonify(result)


@app.route('/login.html')
def login_page():
    return app.send_static_file('login.html')

@app.route('/manager_account.html')
@require_role('manager')
def manager_account():
    return app.send_static_file('manager_account.html')

@app.route('/cashier_account.html')
@require_role('cashier')
def cashier_account():
    return app.send_static_file('cashier_account.html')

@app.route('/debug/credentials', methods=['GET'])
def debug_credentials():
    return jsonify(load_credentials())

@app.route('/api/employee_full_info', methods=['GET'])
@require_role('manager', 'cashier')
def get_full_employee_info():
    id_emp = session.get('id_employee')
    if not id_emp:
        return jsonify({'success': False, 'message': 'Not logged in'}), 401

    employee = employee_dao.get_employee_info_by_id(connection, id_emp)
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404

    # Прямо тут обробляємо значення для JSON
    return jsonify({
        'success': True,
        'id_employee': employee['id_employee'],
        'empl_surname': employee['empl_surname'],
        'empl_name': employee['empl_name'],
        'empl_patronymic': employee['empl_patronymic'],
        'empl_role': employee['empl_role'],
        'salary': float(employee['salary']),  # Decimal → float
        'date_of_birth': employee['date_of_birth'].isoformat(),  # date → str
        'date_of_start': employee['date_of_start'].isoformat(),  # date → str
        'phone_number': employee['phone_number'].strip(),  # прибираємо \t або пробіли
        'city': employee['city'],
        'street': employee['street'],
        'zip_code': employee['zip_code']
    })


@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')  # ⬅️ Переходить до /

@app.route('/getAllStoreProductsSorted', methods=['GET'])
def api_get_all_store_products_sorted():
    try:
        connection = get_sql_connection()
        result = store_product_dao.get_all_store_products_sorted(connection)
        return jsonify(result)
    except Exception as e:
        print("Помилка в /getAllStoreProductsSorted:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/getCashierTotalSales', methods=['GET'])
@require_role('manager')
def get_cashier_total_sales():
    connection = None
    try:
        id_employee = request.args.get('id_employee')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not id_employee or not start_date or not end_date:
            return jsonify({
                'success': False,
                'message': 'Потрібні ідентифікатор касира та діапазон дат'
            }), 400

        connection = get_sql_connection()
        response = check_dao.get_cashier_total_sales(connection, id_employee, start_date, end_date)

        return jsonify({
            'success': True,
            'total_sales': float(response['total_sales']) if response['total_sales'] else 0.0
        })
    except Exception as e:
        print(f"Помилка в get_cashier_total_sales: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

@app.route('/api/cashiers', methods=['GET'])
@require_role('manager', 'cashier')  # Обмеження доступу для менеджерів і касирів
def get_cashiers_api():
    connection = None
    try:
        connection = get_sql_connection()
        cashiers = check_dao.get_cashiers(connection)
        response = jsonify(cashiers)
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except Exception as e:
        print(f"Помилка в get_cashiers_api: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()
@app.route('/api/product_sales_by_name', methods=['GET'])
@require_role('manager')
def get_product_sales_by_name():
    connection = None
    try:
        product_name = request.args.get('product_name')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not product_name or not start_date or not end_date:
            return jsonify({
                'success': False,
                'message': 'Product name, start date, and end date are required'
            }), 400

        connection = get_sql_connection()
        response = check_dao.get_product_sales_by_name_and_period(
            connection, product_name, start_date, end_date
        )

        return jsonify({
            'success': True,
            'total_quantity': float(response['total_quantity']) if response['total_quantity'] else 0.0
        })
    except Exception as e:
        print(f"Error in get_product_sales_by_name: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()



#для запиту
@app.route('/api/reports/store-products-summary-by-category', methods=['GET'])
@require_role('manager')
def get_store_products_summary_by_category():
    connection = None
    try:
        category_number = request.args.get('category_number')
        if not category_number:
            return jsonify({'success': False, 'message': 'Category number is required'}), 400

        connection = get_sql_connection()
        response = category_dao.get_store_products_summary_by_category(connection, category_number)
        return jsonify(response)
    except Exception as e:
        print(f"Помилка в get_store_products_summary_by_category: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()

#для запиту
@app.route('/api/reports/dead-categories', methods=['GET'])
@require_role('manager')
def get_dead_categories():
    connection = None
    try:
        connection = get_sql_connection()
        response = category_dao.get_dead_categories(connection)
        return jsonify(response)
    except Exception as e:
        print(f"Помилка в get_dead_categories: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if connection:
            connection.close()


@app.route('/api/categories_without_low_price_and_stock', methods=['GET'])
def api_categories_without_low_price_and_stock():
    min_price = request.args.get('min_price')
    if not min_price:
        return jsonify({"success": False, "message": "Minimum price is required"}), 400
    try:
        min_price = float(min_price)
    except ValueError:
        return jsonify({"success": False, "message": "Minimum price must be a valid number"}), 400

    try:
        result = category_dao.get_categories_without_low_price_and_stock(min_price)
        return jsonify(result)
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/category_sales_count', methods=['GET'])
def api_category_sales_count():
    try:
        result = category_dao.get_category_sales_count()
        return jsonify(result)
    except Exception as e:
        print("category_sales_count error:", e)
        return jsonify({"error": "Server error"}), 500
if __name__ == "__main__":
    print("Starting Python Flask Server For Grocery Store Management System")
    app.run(port=5000, debug=True)