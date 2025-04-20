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
    request_payload = json.loads(request.form['data'])
    id_product = product_dao.insert_new_product(connection, request_payload)
    response = jsonify({
        'product_id': id_product
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/deleteProduct', methods=['POST'])
def delete_product():
    return_id = product_dao.delete_products(connection, request.form['product_id'])
    response = jsonify({
          'product_id': return_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/getCategories', methods=['GET'])  # 🆕 новий endpoint
def get_categories():
    response = category_dao.get_categories(connection)
    response = jsonify(response)
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/manage_employee')
def manage_employee():
    return app.send_static_file('manage-employee.html')

# @app.route('/getEmployees', methods=['GET'])
# def get_employees():
#     response = employee_dao.get_all_employees(connection)
#     return jsonify(response)
#
# @app.route('/insertEmployee', methods=['POST'])
# def insert_employee():
#     request_payload = json.loads(request.form['data'])
#     employee_id = employee_dao.insert_employee(connection, request_payload)
#     return jsonify({'employee_id': employee_id})
#
# @app.route('/deleteEmployee', methods=['POST'])
# def delete_employee():
#     employee_id = request.form['id_employee']
#     result = employee_dao.delete_employee(connection, employee_id)
#     return jsonify({'deleted_id': employee_id})

if __name__ == "__main__":
    print("Starting Python Flask Server For Grocery Store Management System")
    app.run(port=5000, debug=True)