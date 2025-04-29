from sql_connection import execute_query, get_sql_connection


def insert_new_customer(connection, customer):
    query = """
        INSERT INTO customer_card (
            card_number, cust_surname, cust_name, cust_patronymic,
            phone_number, city, street, zip_code, percent
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    data = (
        customer['card_number'],
        customer['cust_surname'],
        customer['cust_name'],
        customer['cust_patronymic'],
        customer['phone_number'],
        customer['city'],
        customer['street'],
        customer['zip_code'],
        customer['percent']
    )

    try:
        result = execute_query(connection, query, data)
        return result
    except Exception as e:
        print(f"Error adding customer: {e}")
        raise


def update_customer(connection, customer):
    # Check if card_number exists
    if not customer['card_number']:
        raise ValueError("card_number is required for update")

    query = """
        UPDATE customer_card SET
            cust_surname = %s,
            cust_name = %s,
            cust_patronymic = %s,
            phone_number = %s,
            city = %s,
            street = %s,
            zip_code = %s,
            percent = %s
        WHERE card_number = %s;
    """
    data = (
        customer['cust_surname'],
        customer['cust_name'],
        customer['cust_patronymic'],
        customer['phone_number'],
        customer['city'],
        customer['street'],
        customer['zip_code'],
        customer['percent'],
        customer['card_number']
    )

    try:
        result = execute_query(connection, query, data)
        return result
    except Exception as e:
        print(f"Error updating customer: {e}")
        raise


def delete_customer(connection, card_number):
    query = "DELETE FROM customer_card WHERE card_number = %s;"
    try:
        result = execute_query(connection, query, (card_number,))
        return result
    except Exception as e:
        print(f"Error deleting customer: {e}")
        raise


def get_contact_by_surname(connection, surname):
    query = """
        SELECT phone_number, city, street, zip_code
        FROM customer_card
        WHERE cust_surname = %s;
    """

    try:
        result = execute_query(connection, query, (surname,))
        if result and len(result) > 0:
            return result[0]
        else:
            return None
    except Exception as e:
        print(f"Error getting contact by surname: {e}")
        raise


def get_all_customers_ordered_by_surname(connection):
    query = """
        SELECT card_number, cust_surname, cust_name, cust_patronymic,
               phone_number, city, street, zip_code, percent
        FROM customer_card
        ORDER BY cust_surname;
    """

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error getting customer list: {e}")
        raise


def get_premium_customers(connection):
    query = """
        SELECT card_number, cust_surname, cust_name, cust_patronymic,
               phone_number, city, street, zip_code, percent
        FROM customer_card
        WHERE percent >= 10
        ORDER BY cust_surname;
    """

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error getting premium customers: {e}")
        raise


def get_all_customers(connection):
    query = "SELECT * FROM customer_card;"

    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error getting all customers: {e}")
        raise