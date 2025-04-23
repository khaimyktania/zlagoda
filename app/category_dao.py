def get_categories(connection):
    cursor = connection.cursor()
    query = "SELECT * FROM category"
    cursor.execute(query)
    response = []
    for (category_number, category_name) in cursor:
        response.append({
            'category_number': category_number,
            'name': category_name  # <-- замінили ключ
        })
    return response


if __name__ == '__main__':
    from sql_connection import get_sql_connection

    connection = get_sql_connection()
    print(get_categories(connection))
