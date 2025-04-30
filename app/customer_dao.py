from sql_connection import execute_query, get_sql_connection

def validate_customer(customer):
    errors = []

    # Обов'язкові поля
    required_fields = ['card_number', 'cust_surname', 'cust_name', 'phone_number', 'percent']
    for field in required_fields:
        if not customer.get(field):
            errors.append(f"Field '{field}' is required.")

    # Відсоток має бути в межах 0–100
    try:
        percent = float(customer['percent'])
        if percent < 0 or percent > 100:
            errors.append("Percent must be between 0 and 100.")
    except Exception:
        errors.append("Invalid format for percent.")

    # Телефон не довший за 13 символів
    if len(customer.get('phone_number', '')) > 13:
        errors.append("Phone number must be ≤ 13 characters.")

    # Якщо хоч одне поле адреси вказане — усі мають бути
    has_any_address_field = any(customer.get(field) for field in ['city', 'street', 'zip_code'])
    if has_any_address_field:
        for field in ['city', 'street', 'zip_code']:
            if not customer.get(field):
                errors.append(f"If address is provided, '{field}' must not be empty.")

    if errors:
        raise ValueError("Validation error(s): " + "; ".join(errors))


def insert_new_customer(connection, customer):
    validate_customer(customer)
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
    if not customer['card_number']:
        raise ValueError("card_number is required for update")

    validate_customer(customer)

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