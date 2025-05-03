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
    validate_product_fields(product)
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
    validate_product_fields(product)
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
    try:
        # Спочатку видаляємо всі записи з store_products, пов’язані з id_product
        delete_store_products_query = """
        DELETE FROM store_products 
        WHERE id_product = %s
        """
        cursor = connection.cursor()
        cursor.execute(delete_store_products_query, (id_product,))
        store_products_deleted = cursor.rowcount
        print(f"Deleted {store_products_deleted} store_products for product ID {id_product}")

        # Тепер видаляємо продукт із таблиці products
        delete_query = "DELETE FROM products WHERE id_product = %s"
        result = execute_query(connection, delete_query, (id_product,))
        print(f"Deleted product with ID {id_product}")

        connection.commit()
        return result

    except Exception as e:
        connection.rollback()
        print(f"Помилка видалення продукту: {e}")
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()

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


def validate_product_fields(product):
    errors = []

    # Перевірка для назви продукту
    if not product.get('product_name'):
        errors.append("Product name is required.")

    # Перевірка для характеристик продукту
    if not product.get('characteristics'):
        errors.append("Product characteristics are required.")

    # Перевірка для виробника
    if not product.get('producer'):
        errors.append("Producer is required.")

    # Перевірка для категорії продукту
    if not product.get('category_number'):
        errors.append("Category number is required.")

    # Якщо є помилки, викидаємо виключення
    if errors:
        raise ValueError("Validation error(s): " + "; ".join(errors))


def search_products_by_name(connection, name):
    """
    Пошук продуктів за назвою (використовуючи часткове співпадіння)
    """
    query = "SELECT * FROM products WHERE product_name LIKE %s ORDER BY product_name ASC;"
    search_pattern = f"%{name}%"
    try:
        result = execute_query(connection, query, (search_pattern,))
        return result
    except Exception as e:
        print(f"Помилка в search_products_by_name: {e}")
        raise

def get_available_products(connection):
    """
    Отримати продукти, які ще не додані до store_products
    """
    query = """
    SELECT p.* 
    FROM products p
    LEFT JOIN store_products sp ON p.id_product = sp.id_product
    WHERE sp.id_product IS NULL
    ORDER BY p.product_name;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Помилка в get_available_products: {e}")
        raise