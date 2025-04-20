from flask import Flask, request, jsonify
from sql_connection import get_sql_connection
import json
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
    product_id = product_dao.insert_new_product(connection, request_payload)
    response = jsonify({
        'product_id': product_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/deleteProduct', methods=['POST'])
def delete_product():
    return_id = product_dao.delete_products(connection, request.form['id_product'])
    response = jsonify({
        'product_id': return_id
    })
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

if __name__ == "__main__":
    print("Starting Python Flask Server For Grocery Store Management System")
    app.run(port=5000, debug=True)