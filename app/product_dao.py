import pymysql

from sql_connection import get_sql_connection

def get_all_products(connection):

    cursor = connection.cursor()

    query = "SELECT * FROM products;"

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

# def insert_new_product(connection, product):
#     cursor = connection.cursor()
#     # query = ("INSERT INTO products "
#     #          "(product_name, category_number, characteristics) "
    #          "VALUES (%s, %s, %s);")
    #
    # data = (product["product_name"], product["category_number"], product["characteristics"])
    # cursor.execute(query, data)
    # connection.commit()
    #
    # return cursor.lastrowid

def delete_products(connection, id_product):
    cursor = connection.cursor()
    query = ("DELETE FROM products where id_product=" + id_product)
    cursor.execute(query)
    connection.commit()


def insert_new_product(connection, product):
    cursor = connection.cursor()

    # Check if this is an update (id_product exists and is not empty)
    if product.get('id_product') and product['id_product'].strip():
        # This is an update - use the dedicated update function
        return update_product(connection, product)
    else:
        # This is a new insertion
        query = ("INSERT INTO products "
                 "(product_name, category_number, characteristics) "
                 "VALUES (%s, %s, %s);")
        data = (product["product_name"], product["category_number"], product["characteristics"])
        cursor.execute(query, data)
        connection.commit()
        return cursor.lastrowid


def update_product(connection, product):
    cursor = connection.cursor()

    # Ensure we have a valid product ID
    if not product.get('id_product') or not product['id_product'].strip():
        raise ValueError("id_product is required for update")

    query = """
        UPDATE products SET
            product_name = %s,
            category_number = %s,
            characteristics = %s
        WHERE id_product = %s;
    """
    data = (
        product['product_name'],
        product['category_number'],
        product['characteristics'],
        product['id_product']
    )

    try:
        print(f"Updating product with ID: {product['id_product']}")
        cursor.execute(query, data)
        connection.commit()
        return cursor.rowcount  # Return number of updated rows
    except pymysql.MySQLError as e:
        connection.rollback()
        print(f"Error updating product: {e}")
        raise


def delete_products(connection, id_product):
    cursor = connection.cursor()
    query = ("DELETE FROM products WHERE id_product = %s")
    cursor.execute(query, (id_product,))
    connection.commit()
    return cursor.rowcount


def get_all_products_sorted(connection):
    cursor = connection.cursor()
    query = "SELECT * FROM products ORDER BY product_name ASC;"
    cursor.execute(query)

    response = []
    for (id_product, product_name, category_number, characteristics) in cursor:
        response.append({
            'id_product': id_product,
            'product_name': product_name,
            'category_number': category_number,
            'characteristics': characteristics
        })

    return response

def get_products_by_category(connection, category_number):
    cursor = connection.cursor()
    query = "SELECT * FROM products WHERE category_number = %s ORDER BY product_name ASC;"
    cursor.execute(query, (category_number,))

    response = []
    for (id_product, product_name, category_number, characteristics) in cursor:
        response.append({
            'id_product': id_product,
            'product_name': product_name,
            'category_number': category_number,
            'characteristics': characteristics
        })

    return response


if __name__ == '__main__':
    connection = get_sql_connection()
    print(get_all_products(connection))