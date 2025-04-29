
from sql_connection import execute_query, get_sql_connection


def get_all_products(connection):
    query = "SELECT * FROM products;"
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Помилка в get_all_products: {e}")
        raise


def insert_new_product(connection, product):
    # Перевірка чи це оновлення (id_product існує і не порожній)
    if product.get('id_product') and str(product['id_product']).strip():
        # Це оновлення - використовуємо відповідну функцію
        return update_product(connection, product)
    else:
        # Це нова вставка
        query = (
            "INSERT INTO products "
            "(product_name, category_number, characteristics, producer) "  # Added producer
            "VALUES (%s, %s, %s, %s);"  # Added placeholder for producer
        )
        data = (
            product["product_name"],
            product["category_number"],
            product["characteristics"],
            product["producer"]  # Added producer
        )

        try:
            result = execute_query(connection, query, data)
            return result
        except Exception as e:
            print(f"Помилка додавання продукту: {e}")
            raise


def update_product(connection, product):
    # Переконуємося, що маємо дійсний ID продукту
    if not product.get('id_product') or not str(product['id_product']).strip():
        raise ValueError("id_product обов'язковий для оновлення")

    query = """
        UPDATE products SET
            product_name = %s,
            category_number = %s,
            characteristics = %s,
            producer = %s
        WHERE id_product = %s;
    """
    data = (
        product['product_name'],
        product['category_number'],
        product['characteristics'],
        product['producer'],  # Added producer
        product['id_product']
    )

    try:
        print(f"Оновлення продукту з ID: {product['id_product']}")
        result = execute_query(connection, query, data)
        return result
    except Exception as e:
        print(f"Помилка оновлення продукту: {e}")
        raise


def delete_products(connection, id_product):
    query = "DELETE FROM products WHERE id_product = %s"
    try:
        result = execute_query(connection, query, (id_product,))
        return result
    except Exception as e:
        print(f"Помилка видалення продукту: {e}")
        raise


def get_all_products_sorted(connection):
    query = "SELECT * FROM products ORDER BY product_name ASC;"
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Помилка в get_all_products_sorted: {e}")
        raise


def get_products_by_category(connection, category_number):
    query = "SELECT * FROM products WHERE category_number = %s ORDER BY product_name ASC;"
    try:
        result = execute_query(connection, query, (category_number,))
        return result
    except Exception as e:
        print(f"Помилка в get_products_by_category: {e}")
        raise
