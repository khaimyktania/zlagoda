from flask import Flask, request, jsonify

from app import category_dao
from sql_connection import get_sql_connection
import json
import employee_dao
import product_dao

app = Flask(__name__, static_folder='../web', template_folder='../web')

connection = get_sql_connection()


@app.route('/')
def home():
    return app.send_static_file('main.html')


@app.route('/manage_product')
def manage_product():
    return app.send_static_file('manage_product.html')


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

if __name__ == "__main__":
    print("Starting Python Flask Server For Grocery Store Management System")
    app.run(port=5000, debug=True)