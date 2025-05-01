from sql_connection import execute_query, get_sql_connection
from datetime import datetime


def get_all_checks(connection):
    """
    Get all check records from database
    """
    query = """
    SELECT c.check_number, c.id_employee, c.card_number, c.print_date, 
           c.sum_total, c.vat, 
           e.empl_surname, e.empl_name,
           CONCAT(cu.cust_surname, ' ', cu.cust_name) as customer_name
    FROM `check` c
    LEFT JOIN employee e ON c.id_employee = e.id_employee
    LEFT JOIN customer_card cu ON c.card_number = cu.card_number
    ORDER BY c.print_date DESC;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error in get_all_checks: {e}")
        raise


def get_check_by_number(connection, check_number):
    """
    Get check details by check number
    """
    query = """
    SELECT c.check_number, c.id_employee, c.card_number, c.print_date, 
           c.sum_total, c.vat
    FROM `check` c
    WHERE c.check_number = %s;
    """
    try:
        result = execute_query(connection, query, (check_number,))
        if result:
            return result[0]
        return None
    except Exception as e:
        print(f"Error in get_check_by_number: {e}")
        raise


def get_check_products(connection, check_number):
    """
    Get all products in a specific check
    """
    query = """
    SELECT s.UPC, s.product_number, s.selling_price,
           p.product_name, 
           (s.product_number * s.selling_price) as total_price
    FROM sale s
    JOIN store_products sp ON s.UPC = sp.UPC
    JOIN products p ON sp.id_product = p.id_product
    WHERE s.check_number = %s;
    """
    try:
        result = execute_query(connection, query, (check_number,))
        return result
    except Exception as e:
        print(f"Error in get_check_products: {e}")
        raise


def insert_check(connection, check_data):
    """
    Insert a new check record with its products
    """
    # Start a transaction
    connection.begin()

    try:
        # Insert check header
        check_query = """
        INSERT INTO `check` 
        (check_number, id_employee, card_number, print_date, sum_total, vat) 
        VALUES (%s, %s, %s, %s, %s, %s);
        """

        # Calculate VAT (20% of total)
        sum_total = float(check_data['sum_total'])
        vat = round(sum_total * 0.2, 4)

        # If print_date is not provided, use current date/time
        print_date = check_data.get('print_date', datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

        check_params = (
            check_data['check_number'],
            check_data['id_employee'],
            check_data.get('card_number'),  # Can be None
            print_date,
            sum_total,
            vat
        )

        execute_query(connection, check_query, check_params)

        # Insert sale items if provided
        if 'products' in check_data and check_data['products']:
            sale_query = """
            INSERT INTO sale
            (UPC, check_number, product_number, selling_price)
            VALUES (%s, %s, %s, %s);
            """

            for product in check_data['products']:
                sale_params = (
                    product['UPC'],
                    check_data['check_number'],
                    product['product_number'],
                    product['selling_price']
                )

                execute_query(connection, sale_query, sale_params)

                # Update store_products quantity if needed
                if check_data.get('update_inventory', True):
                    update_query = """
                    UPDATE store_products
                    SET products_number = products_number - %s
                    WHERE UPC = %s;
                    """
                    execute_query(connection, update_query, (product['product_number'], product['UPC']))

        # Commit transaction
        connection.commit()
        return {"success": True, "check_number": check_data['check_number']}

    except Exception as e:
        # Rollback transaction in case of error
        connection.rollback()
        print(f"Error in insert_check: {e}")
        return {"success": False, "message": str(e)}


def delete_check(connection, check_number):
    """
    Delete a check and its associated sale records
    """
    # Start a transaction
    connection.begin()

    try:
        # First get the products to return them to inventory if needed
        products = get_check_products(connection, check_number)

        # Delete sale records first (due to foreign key constraint)
        sale_query = "DELETE FROM sale WHERE check_number = %s;"
        execute_query(connection, sale_query, (check_number,))

        # Delete check record
        check_query = "DELETE FROM `check` WHERE check_number = %s;"
        result = execute_query(connection, check_query, (check_number,))

        # Restore inventory quantities
        for product in products:
            update_query = """
            UPDATE store_products
            SET products_number = products_number + %s
            WHERE UPC = %s;
            """
            execute_query(connection, update_query, (product['product_number'], product['UPC']))

        # Commit transaction
        connection.commit()
        return {"success": True, "rows_deleted": result}

    except Exception as e:
        # Rollback transaction in case of error
        connection.rollback()
        print(f"Error in delete_check: {e}")
        return {"success": False, "message": str(e)}



def get_recent_checks(connection, limit=50):
    """
    Get most recent checks with limit
    """
    query = """
    SELECT c.check_number, c.id_employee, c.print_date, 
           c.sum_total, c.vat, 
           CONCAT(e.empl_surname, ' ', e.empl_name) as cashier_name,
           COUNT(s.UPC) as product_count
    FROM `check` c
    LEFT JOIN employee e ON c.id_employee = e.id_employee
    LEFT JOIN sale s ON c.check_number = s.check_number
    GROUP BY c.check_number
    ORDER BY c.print_date DESC
    LIMIT %s;
    """
    try:
        result = execute_query(connection, query, (limit,))
        return result
    except Exception as e:
        print(f"Error in get_recent_checks: {e}")
        raise


def get_check_statistics(connection, period='all'):
    """
    Get statistics about checks for a specific period
    period: 'today', 'week', 'month', 'year', 'all'
    """
    time_condition = ""
    if period == 'today':
        time_condition = "WHERE DATE(c.print_date) = CURRENT_DATE"
    elif period == 'week':
        time_condition = "WHERE c.print_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)"
    elif period == 'month':
        time_condition = "WHERE c.print_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)"
    elif period == 'year':
        time_condition = "WHERE c.print_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)"

    query = f"""
    SELECT 
        COUNT(c.check_number) as total_checks,
        SUM(c.sum_total) as total_sales,
        SUM(c.vat) as total_vat,
        AVG(c.sum_total) as average_check,
        MIN(c.print_date) as oldest_date,
        MAX(c.print_date) as newest_date
    FROM `check` c
    {time_condition};
    """

    try:
        result = execute_query(connection, query)
        return result[0] if result else None
    except Exception as e:
        print(f"Error in get_check_statistics: {e}")
        raise


def find_checks_by_date_range(connection, start_date, end_date, id_employee=None):
    """
    Find checks within a date range with optional employee filter
    """
    query_parts = [
        "SELECT c.check_number, c.id_employee, c.card_number, c.print_date,",
        "c.sum_total, c.vat,",
        "CONCAT(e.empl_surname, ' ', e.empl_name) as cashier_name,",
        "COUNT(s.UPC) as product_count",  # Додаємо підрахунок продуктів
        "FROM `check` c",
        "LEFT JOIN employee e ON c.id_employee = e.id_employee",
        "LEFT JOIN sale s ON c.check_number = s.check_number",
        "WHERE c.print_date BETWEEN %s AND %s"
    ]

    params = [start_date, end_date]

    # Add employee filter if specified
    if id_employee:
        query_parts.append("AND c.id_employee = %s")
        params.append(id_employee)

    # Add GROUP BY as we're using COUNT
    query_parts.append("GROUP BY c.check_number")
    query_parts.append("ORDER BY c.print_date DESC")

    query = " ".join(query_parts)

    try:
        result = execute_query(connection, query, tuple(params))
        return result
    except Exception as e:
        print(f"Error in find_checks_by_date_range: {e}")
        raise

def generate_check_number(connection):
    """
    Generate a unique check number
    Format: 'CH' + 3 digit sequence number (CH001, CH002, etc.)
    """
    # Get the highest sequence number
    query = """
    SELECT MAX(check_number) FROM `check`
    WHERE check_number LIKE 'CH%';
    """
    try:
        result = execute_query(connection, query)

        if result[0]['MAX(check_number)']:
            # Extract sequence number and increment
            last_number = result[0]['MAX(check_number)']
            # Remove 'CH' prefix and convert to integer, then increment
            sequence = int(last_number[2:]) + 1
        else:
            # First check in the system
            sequence = 1

        # Format with leading zeros (ensuring 3 digits minimum)
        return f"CH{sequence:03d}"
    except Exception as e:
        print(f"Error in generate_check_number: {e}")
        raise

def get_cashiers(connection):
    """
    Get all employees with position 'Cashier'
    """
    query = """
    SELECT id_employee, empl_surname, empl_name
    FROM employee
    WHERE empl_role = 'Cashier'
    ORDER BY empl_surname, empl_name;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error in get_cashiers: {e}")
        raise