from sql_connection import execute_query, get_sql_connection


def get_all_store_products(connection):
    """
    Get all products from store_products table with positive quantity
    """
    query = """
    SELECT sp.*, p.product_name 
    FROM store_products sp 
    JOIN products p ON sp.id_product = p.id_product 
    WHERE sp.products_number > 0;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error in get_all_store_products: {e}")
        raise


def get_all_store_products_sorted_by_quantity(connection):
    """
    Get all products from store_products table sorted by quantity
    """
    query = """
    SELECT sp.*, p.product_name 
    FROM store_products sp 
    JOIN products p ON sp.id_product = p.id_product 
    ORDER BY sp.products_number DESC;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error in get_all_store_products_sorted_by_quantity: {e}")
        raise


def get_promotional_products_sorted_by_quantity(connection):
    """
    Get all promotional products sorted by quantity
    """
    query = """
    SELECT sp.*, p.product_name 
    FROM store_products sp 
    JOIN products p ON sp.id_product = p.id_product 
    WHERE sp.promotional_product = 1
    ORDER BY sp.products_number DESC;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error in get_promotional_products_sorted_by_quantity: {e}")
        raise


def get_promotional_products_sorted_by_name(connection):
    """
    Get all promotional products sorted by name
    """
    query = """
    SELECT sp.*, p.product_name 
    FROM store_products sp 
    JOIN products p ON sp.id_product = p.id_product 
    WHERE sp.promotional_product = 1
    ORDER BY p.product_name;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error in get_promotional_products_sorted_by_name: {e}")
        raise


def get_non_promotional_products_sorted_by_quantity(connection):
    """
    Get all non-promotional products sorted by quantity
    """
    query = """
    SELECT sp.*, p.product_name 
    FROM store_products sp 
    JOIN products p ON sp.id_product = p.id_product 
    WHERE sp.promotional_product = 0
    ORDER BY sp.products_number DESC;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error in get_non_promotional_products_sorted_by_quantity: {e}")
        raise


def get_non_promotional_products_sorted_by_name(connection):
    """
    Get all non-promotional products sorted by name
    """
    query = """
    SELECT sp.*, p.product_name 
    FROM store_products sp 
    JOIN products p ON sp.id_product = p.id_product 
    WHERE sp.promotional_product = 0
    ORDER BY p.product_name;
    """
    try:
        result = execute_query(connection, query)
        return result
    except Exception as e:
        print(f"Error in get_non_promotional_products_sorted_by_name: {e}")
        raise


def get_store_product_detail_by_upc(connection, upc):
    """
    Get detailed information about a product by UPC including price, quantity, name, and characteristics
    """
    query = """
    SELECT sp.UPC, sp.UPC_prom, sp.selling_price, sp.products_number, sp.promotional_product, 
           p.product_name, p.characteristics, p.category_number
    FROM store_products sp 
    JOIN products p ON sp.id_product = p.id_product 
    WHERE sp.UPC = %s;
    """
    try:
        result = execute_query(connection, query, (upc,))
        return result[0] if result else None
    except Exception as e:
        print(f"Error in get_store_product_detail_by_upc: {e}")
        raise


def get_store_product_by_upc(connection, upc):
    """
    Get a store product by UPC
    """
    query = """
    SELECT sp.*, p.product_name 
    FROM store_products sp 
    JOIN products p ON sp.id_product = p.id_product 
    WHERE sp.UPC = %s
    """
    try:
        result = execute_query(connection, query, (upc,))
        return result[0] if result else None
    except Exception as e:
        print(f"Error in get_store_product_by_upc: {e}")
        return None

def insert_store_product(connection, store_product):
    """
    Insert a new store product
    """
    query = """
    INSERT INTO store_products 
    (UPC, UPC_prom, id_product, selling_price, products_number, promotional_product) 
    VALUES (%s, %s, %s, %s, %s, %s);
    """
    data = (
        store_product["UPC"],
        store_product.get("UPC_prom", None),
        store_product["id_product"],
        store_product["selling_price"],
        store_product["products_number"],
        store_product.get("promotional_product", 0)
    )

    try:
        result = execute_query(connection, query, data)
        return result
    except Exception as e:
        print(f"Error inserting store product: {e}")
        raise


def update_store_product(connection, store_product):
    """
    Update an existing store product
    """
    query = """
    UPDATE store_products SET 
    UPC_prom = %s, 
    id_product = %s, 
    selling_price = %s, 
    products_number = %s, 
    promotional_product = %s 
    WHERE UPC = %s;
    """
    data = (
        store_product.get("UPC_prom", None),
        store_product["id_product"],
        store_product["selling_price"],
        store_product["products_number"],
        store_product.get("promotional_product", 0),
        store_product["UPC"]
    )

    try:
        result = execute_query(connection, query, data)
        return result
    except Exception as e:
        print(f"Error updating store product: {e}")
        raise


def delete_store_product(connection, upc):
    """
    Soft delete a store product by setting its quantity to 0, preserving its data for checks.
    """
    print(f"Attempting to soft delete product with UPC: {upc}")
    try:
        # Перевіряємо, чи існує продукт
        print("Calling get_store_product_by_upc")
        product = get_store_product_by_upc(connection, upc)
        if not product:
            print(f"Product with UPC {upc} not found")
            return {"success": False, "message": "Product not found"}

        # Встановлюємо products_number = 0
        soft_delete_query = """
        UPDATE store_products 
        SET products_number = 0 
        WHERE UPC = %s
        """
        print(f"Executing query: {soft_delete_query} with UPC: {upc}")
        cursor = connection.cursor()
        cursor.execute(soft_delete_query, (upc,))
        rows_updated = cursor.rowcount
        print(f"Rows updated: {rows_updated}")
        connection.commit()
        return {"success": True, "rows_updated": rows_updated}

    except Exception as e:
        connection.rollback()
        print(f"Error soft deleting store product: {str(e)}")
        return {"success": False, "message": f"Error soft deleting store product: {str(e)}"}
    finally:
        if 'cursor' in locals():
            print("Closing cursor")
            cursor.close()

def make_product_promotional(connection, upc, promotional=True):
    """
    Mark a product as promotional/non-promotional and calculate new price if needed
    """
    try:
        # First get the current product
        product = get_store_product_by_upc(connection, upc)
        if not product:
            return {"success": False, "message": "Product not found"}

        # If already in the requested state, do nothing
        if (promotional and product['promotional_product'] == 1) or (
                not promotional and product['promotional_product'] == 0):
            return {"success": True, "message": "No change needed"}

        # Determine new price
        new_price = product['selling_price']
        if promotional:
            # If making promotional, apply 20% discount
            new_price = float(product['selling_price']) * 0.8

            # Generate promotional UPC if not exists
            upc_prom = product.get('UPC_prom')
            if not upc_prom:
                # Simple approach: append 'P' to original UPC
                upc_prom = f"P{upc[-11:]}"

            update_data = {
                "UPC": upc,
                "UPC_prom": upc_prom,
                "id_product": product['id_product'],
                "selling_price": new_price,
                "products_number": product['products_number'],
                "promotional_product": 1
            }
        else:
            # If making non-promotional, increase price by dividing by 0.8
            new_price = float(product['selling_price']) / 0.8

            update_data = {
                "UPC": upc,
                "UPC_prom": None,
                "id_product": product['id_product'],
                "selling_price": new_price,
                "products_number": product['products_number'],
                "promotional_product": 0
            }

        # Update the product
        update_store_product(connection, update_data)
        return {"success": True, "message": "Product updated successfully", "new_price": new_price}

    except Exception as e:
        print(f"Error making product promotional: {e}")
        return {"success": False, "message": str(e)}


def update_product_quantity(connection, upc, new_quantity):
    """
    Update product quantity
    """
    query = "UPDATE store_products SET products_number = %s WHERE UPC = %s"
    try:
        result = execute_query(connection, query, (new_quantity, upc))
        return {"success": True, "rows_updated": result}
    except Exception as e:
        print(f"Error updating product quantity: {e}")
        return {"success": False, "message": str(e)}


def recalculate_vat(connection, upc):
    """
    Calculate and return VAT (20% of selling price)
    """
    try:
        product = get_store_product_by_upc(connection, upc)
        if not product:
            return {"success": False, "message": "Product not found"}

        # VAT is 20% of the selling price
        vat_amount = float(product['selling_price']) * 0.2
        return {"success": True, "vat_amount": vat_amount, "selling_price": product['selling_price']}
    except Exception as e:
        print(f"Error calculating VAT: {e}")
        return {"success": False, "message": str(e)}

def get_all_store_products_sorted(connection):
        """
        Отримати усі товари у магазині, відсортовані за назвою продукту
        """
        query = """
            SELECT sp.UPC, sp.UPC_prom, p.product_name, sp.selling_price,
                   sp.products_number, sp.promotional_product
            FROM store_products sp
            JOIN products p ON sp.id_product = p.id_product
            ORDER BY p.product_name ASC;
        """
        try:
            result = execute_query(connection, query)
            return result
        except Exception as e:
            print(f"Помилка в get_all_store_products_sorted: {e}")
            raise
def generate_upc(connection):
    """
    Generate a new UPC by finding the maximum existing UPC and incrementing by 1
    """
    query = "SELECT MAX(CAST(UPC AS UNSIGNED)) FROM store_products"
    try:
        cursor = connection.cursor()
        cursor.execute(query)
        result = cursor.fetchone()
        max_upc = result[0] if result[0] else 0
        new_upc = str(int(max_upc) + 1).zfill(12)  # Форматуємо до 12 цифр
        return new_upc
    except Exception as e:
        print(f"Error generating UPC: {e}")
        raise



def reprice_store_product(connection, upc, new_price, additional_quantity=0):
    """
    Reprice all units of a product to a new price and optionally add new quantity
    """
    try:
        product = get_store_product_by_upc(connection, upc)
        if not product:
            return {"success": False, "message": "Product not found"}

        # Оновлюємо ціну та кількість
        new_quantity = product['products_number'] + additional_quantity
        update_data = {
            "UPC": upc,
            "UPC_prom": product['UPC_prom'],
            "id_product": product['id_product'],
            "selling_price": new_price,
            "products_number": new_quantity,
            "promotional_product": product['promotional_product']
        }

        update_store_product(connection, update_data)
        return {
            "success": True,
            "message": "Product repriced and quantity updated successfully",
            "new_price": new_price,
            "new_quantity": new_quantity
        }
    except Exception as e:
        print(f"Error repricing product: {e}")
        return {"success": False, "message": str(e)}
