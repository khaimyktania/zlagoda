import pymysql


def get_categories(connection):
    cursor = connection.cursor()
    query = "SELECT * FROM category;"
    cursor.execute(query)

    response = []
    for (category_number, category_name) in cursor:
        response.append({
            'category_number': category_number,
            'name': category_name
        })

    return response


def insert_new_category(connection, category):
    cursor = connection.cursor()

    # Check if this is an update (category_number exists and is not None)
    if category.get('category_number') and str(category['category_number']).strip():
        # This is an update
        return update_category(connection, category)
    else:
        # This is a new insertion
        query = ("INSERT INTO category (category_name) VALUES (%s);")
        data = (category["category_name"],)

        cursor.execute(query, data)
        connection.commit()
        return cursor.lastrowid


def update_category(connection, category):
    cursor = connection.cursor()

    # Ensure we have a valid category number
    if not category.get('category_number') or not str(category['category_number']).strip():
        raise ValueError("category_number is required for update")

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
        print(f"Updating category with number: {category['category_number']}")
        cursor.execute(query, data)
        connection.commit()
        return cursor.rowcount  # Return number of updated rows
    except pymysql.MySQLError as e:
        connection.rollback()
        print(f"Error updating category: {e}")
        raise


def delete_category(connection, category_number):
    cursor = connection.cursor()

    # First check if category is referenced in products table
    check_query = "SELECT COUNT(*) FROM products WHERE category_number = %s"
    cursor.execute(check_query, (category_number,))
    count = cursor.fetchone()[0]

    if count > 0:
        # Category is in use, don't delete
        return {
            'success': False,
            'message': f"Cannot delete category. It is used by {count} product(s)."
        }

    # Safe to delete
    query = "DELETE FROM category WHERE category_number = %s"
    cursor.execute(query, (category_number,))
    connection.commit()

    return {
        'success': True,
        'rows_deleted': cursor.rowcount
    }