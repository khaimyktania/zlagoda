from sql_connection import get_sql_connection

def get_all_products(connection):

    cursor = connection.cursor()

    query = "SELECT * FROM zlagoda.products;"

    cursor.execute(query)

    response = []

    for (id_product,product_name, category_number, characteristics) in cursor:
        response.append(
            {
                'id_product' :id_product,
                'product_name' : product_name,
                'category_number' : category_number,
                'characteristics' : characteristics
            }
        )

    return response

def insert_new_product (connection, product):
    cursor = connection.cursor()
    query = ("INSERT INTO products "
             "(id_product, product_name, category_number, characteristics) "
             "values (%s, %s, %s, %s);")

    data = (product["id_product"], product["product_name"], product["category_number"], product["characteristics"] )
    cursor.execute(query, data)
    connection.commit()

    return cursor.lastrowid

def delete_products(connection, id_product):
    cursor = connection.cursor()
    query = ("DELETE FROM products where id_product=" + str(id_product))
    cursor.execute(query)
    connection.commit()

if __name__ == '__main__':
    connection = get_sql_connection()
    print(get_all_products(connection))