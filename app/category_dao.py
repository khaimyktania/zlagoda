from sql_connection import execute_query, get_sql_connection

def validate_category(category):
    errors = []

    try:
        name = category['category_name'].strip()

        if not name:
            errors.append("Category name is required.")
        elif len(name) > 50:
            errors.append("Category name must not exceed 50 characters.")
        elif any(char.isdigit() for char in name):
            errors.append("Category name must not contain digits.")
    except Exception:
        errors.append("Invalid Name format.")

    if errors:
        raise ValueError("Validation error(s): " + "; ".join(errors))


def get_categories(connection):
    query = "SELECT * FROM category;"
    try:
        result = execute_query(connection, query)
        response = []
        for row in result:
            response.append({
                'category_number': row['category_number'],
                'name': row['category_name']
            })
        return response
    except Exception as e:
        print(f"Помилка в get_categories: {e}")
        raise


def insert_new_category(connection, category):
    validate_category(category)
    # Перевірка чи це оновлення (category_number існує і не None)
    if category.get('category_number') and str(category['category_number']).strip():
        # Це оновлення
        return update_category(connection, category)
    else:
        # Це нова вставка
        query = "INSERT INTO category (category_name) VALUES (%s);"
        data = (category["category_name"],)

        try:
            result = execute_query(connection, query, data)
            return result  # Повертає ID доданого запису
        except Exception as e:
            print(f"Помилка під час додавання категорії: {e}")
            raise


def update_category(connection, category):
    # Переконуємося, що маємо дійсний номер категорії
    validate_category(category)
    if not category.get('category_number') or not str(category['category_number']).strip():
        raise ValueError("category_number обов'язковий для оновлення")

    query = """
        UPDATE category SET
            category_name = %s
        WHERE category_number = %s;
    """
    data = (
        category['category_name'],
        category['category_number']
    )

    try:
        print(f"Оновлення категорії з номером: {category['category_number']}")
        result = execute_query(connection, query, data)
        return result  # Повертає кількість оновлених рядків
    except Exception as e:
        print(f"Помилка оновлення категорії: {e}")
        raise


def delete_category(connection, category_number):
    # Спочатку перевіряємо, чи категорія використовується в таблиці продуктів
    check_query = "SELECT COUNT(*) as count FROM products WHERE category_number = %s"
    try:
        result = execute_query(connection, check_query, (category_number,))
        count = result[0]['count']

        if count > 0:
            # Категорія використовується, не видаляємо
            return {
                'success': False,
                'message': f"Неможливо видалити категорію. Вона використовується {count} продуктом(ами)."
            }

        # Безпечно видаляти
        query = "DELETE FROM category WHERE category_number = %s"
        rows_deleted = execute_query(connection, query, (category_number,))

        return {
            'success': True,
            'rows_deleted': rows_deleted
        }
    except Exception as e:
        print(f"Помилка видалення категорії: {e}")
        raise


#для запиту
def get_store_products_summary_by_category(connection, category_number):
    query = """
        SELECT 
            c.category_number,
            c.category_name,
            COUNT(sp.UPC) AS store_product_count,
            SUM(sp.products_number) AS total_quantity
        FROM 
            category c
            INNER JOIN products p ON c.category_number = p.category_number
            INNER JOIN store_products sp ON p.id_product = sp.id_product
        WHERE 
            c.category_number = %s
        GROUP BY 
            c.category_number, c.category_name
        HAVING 
            COUNT(sp.UPC) > 0
        ORDER BY 
            c.category_number;
    """
    try:
        result = execute_query(connection, query, (category_number,))
        return result
    except Exception as e:
        print(f"Помилка в get_store_products_summary_by_category: {e}")
        raise

#для запиту
def get_dead_categories(connection):
    query = """
        SELECT 
            c.category_number,
            c.category_name
        FROM 
            category c
        WHERE 
            EXISTS (
                SELECT 1
                FROM products p
                INNER JOIN store_products sp ON p.id_product = sp.id_product
                WHERE 
                    p.category_number = c.category_number
                    AND NOT EXISTS (
                        SELECT 1
                        FROM sale s
                        WHERE s.UPC = sp.UPC
                    )
            )
            AND NOT EXISTS (
                SELECT 1
                FROM products p
                INNER JOIN store_products sp ON p.id_product = sp.id_product
                INNER JOIN sale s ON sp.UPC = s.UPC
                WHERE 
                    p.category_number = c.category_number
            )
        ORDER BY 
            c.category_number;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Помилка в get_dead_categories: {e}")
        raise
def get_categories_without_low_price_and_stock(min_price):
    connection = get_sql_connection()
    try:
        with connection.cursor() as cursor:
            query = """
                SELECT c.category_number, c.category_name
                FROM category c
                WHERE NOT EXISTS (
                    SELECT p.id_product
                    FROM products p
                    JOIN store_products sp ON sp.id_product = p.id_product
                    JOIN sale s ON s.UPC = sp.UPC
                    WHERE p.category_number = c.category_number
                      AND s.selling_price < %s
                )
                AND NOT EXISTS (
                    SELECT p.id_product
                    FROM products p
                    JOIN store_products sp ON sp.id_product = p.id_product
                    WHERE p.category_number = c.category_number
                      AND sp.products_number > 0
                );
            """
            cursor.execute(query, (min_price,))
            rows = cursor.fetchall()
            columns = ['category_number', 'category_name']
            return [dict(zip(columns, row)) for row in rows]
    finally:
        connection.close()


def get_category_sales_count():
    connection = get_sql_connection()
    try:
        with connection.cursor() as cursor:
            query = """
                SELECT 
                c.category_number,
                COUNT(s.check_number) AS total_sales
            FROM category c
            LEFT JOIN products p ON c.category_number = p.category_number
            LEFT JOIN store_products sp ON p.id_product = sp.id_product
            LEFT JOIN sale s ON sp.UPC = s.UPC
            GROUP BY c.category_number
            """
            cursor.execute(query)
            rows = cursor.fetchall()
            columns = ['category_number', 'total_sales']
            return [dict(zip(columns, row)) for row in rows]
    finally:
        connection.close()

