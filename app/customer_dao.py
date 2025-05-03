from sql_connection import execute_query, get_sql_connection
import re

def validate_customer(customer):
    errors = []

    # Обов'язкові поля
    required_fields = ['card_number', 'cust_surname', 'cust_name', 'phone_number', 'percent']
    for field in required_fields:
        if not customer.get(field):
            errors.append(f"Field '{field}' is required.")

    # Перевірка імені
    try:
        name = customer['cust_name']
        if not name:
            errors.append("Name is required.")
        elif len(name) > 50:
            errors.append("Name must not exceed 50 characters.")
        elif not all(char.isalpha() or char in "'-" for char in name):
            errors.append("Name must contain only letters, apostrophes, or hyphens.")
        else:
            if not re.fullmatch(r"[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?", name):
                errors.append("Name must start with a capital letter, and after any hyphen, the next part must start with a capital letter.")
    except Exception:
        errors.append("Invalid cust_name format.")

    # Перевірка прізвища
    try:
        surname = customer['cust_surname']
        if not surname:
            errors.append("Surname is required.")
        elif len(surname) > 50:
            errors.append("Surname must not exceed 50 characters.")
        elif not all(char.isalpha() or char in "'-" for char in surname):
            errors.append("Surname must contain only letters, apostrophes, or hyphens.")
        else:
            if not re.fullmatch(r"[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?", surname):
                errors.append("Surname must start with a capital letter, and after any hyphen, the next part must start with a capital letter.")
    except Exception:
        errors.append("Invalid cust_surname format.")

    # Перевірка по-батькові
    try:
        patronymic = customer.get('cust_patronymic', '')
        if patronymic:
            if len(patronymic) > 50:
                errors.append("Patronymic must not exceed 50 characters.")
            elif not all(char.isalpha() or char in "'-" for char in patronymic):
                errors.append("Patronymic must contain only letters, apostrophes, or hyphens.")
            else:
                if not re.fullmatch(r"[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*(?:'[A-Za-zА-Яа-яіїєґ]*)?", patronymic):
                    errors.append("Patronymic must start with a capital letter, and after any hyphen, the next part must start with a capital letter.")
    except Exception:
        errors.append("Invalid cust_patronymic format.")

    # Перевірка адреси
    city = customer.get('city', '').strip()
    zipcode = customer.get('zip_code', '').strip()
    street = customer.get('street', '').strip()

    if city or zipcode or street:
        try:
            if not city:
                errors.append("City is required.")
            elif len(city) > 50:
                errors.append("City must not exceed 50 characters.")
            elif not all(char.isalpha() or char in "'-" for char in city):
                errors.append("City must contain only letters, apostrophes, or hyphens.")
            else:
                if not re.fullmatch(r"[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*(?:-[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)?", city):
                    errors.append("City must start with a capital letter, and after any hyphen, the next part must start with a capital letter.")
        except Exception:
            errors.append("Invalid city format.")

        try:
            if not zipcode:
                errors.append("Zip Code is required if address is partially filled.")
            elif len(zipcode) != 5:
                errors.append("Zip Code must be exactly 5 characters long.")
            elif not zipcode.isdigit():
                errors.append("Zip Code must contain only digits.")
        except Exception:
            errors.append("Invalid zip code format.")

        try:
            if not street:
                errors.append("Street is required if address is partially filled.")
            else:
                pattern = r"^([A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)([-\s][A-ZА-ЯІЇЄҐ][a-zа-яіїєґ']*)*,\s\d{1,3}[A-ZА-ЯІЇЄҐ]?$"
                if not re.match(pattern, street):
                    errors.append("Street must have each word starting with an uppercase letter, if hyphen is used, the next letter should also be uppercase, followed by a comma and a number (up to three digits).")
        except Exception:
            errors.append("Invalid street format.")

    # Відсоток від -1 до 100
    try:
        percent = float(customer['percent'])
        if percent < -1 or percent > 100:
            errors.append("Percent must be between -1 and 100.")
    except Exception:
        errors.append("Invalid format for percent.")

    # Телефон
    phone = customer.get('phone_number', '')
    if not re.fullmatch(r'\+\d{12}', phone):
        errors.append("Phone number must be in format +XXXXXXXXXXXX (12 digits).")

    # Перевірка адреси
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
    validate_customer(customer)
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
    """
    Soft delete a customer by setting their percent to -1, preserving their data for checks.
    """
    try:
        cursor = connection.cursor()
        query = "SELECT card_number FROM customer_card WHERE card_number = %s"
        cursor.execute(query, (card_number,))
        customer = cursor.fetchone()
        if not customer:
            return {"success": False, "message": "Customer not found"}

        soft_delete_query = """
        UPDATE customer_card 
        SET percent = -1 
        WHERE card_number = %s
        """
        cursor.execute(soft_delete_query, (card_number,))
        rows_updated = cursor.rowcount
        connection.commit()
        return {"success": True, "rows_updated": rows_updated}
    except Exception as e:
        connection.rollback()
        print(f"Error soft deleting customer: {str(e)}")
        return {"success": False, "message": f"Error soft deleting customer: {str(e)}"}
    finally:
        cursor.close()

def get_contact_by_surname(connection, surname):
    query = """
        SELECT phone_number, city, street, zip_code
        FROM customer_card
        WHERE cust_surname = %s AND percent >= 0;
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
        WHERE percent >= 0
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
        WHERE percent >= 10 AND percent <= 100
        ORDER BY cust_surname;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error getting premium customers: {e}")
        raise

def get_all_customers(connection):
    query = """
        SELECT * FROM customer_card
        WHERE percent >= 0;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error getting all customers: {e}")
        raise