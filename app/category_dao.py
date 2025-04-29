from sql_connection import execute_query, get_sql_connection


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