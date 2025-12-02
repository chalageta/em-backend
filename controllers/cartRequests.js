import db from "../db.js"; // your MySQL connection

// Create cart request (guest)
export const createCartRequest = async (req, res) => {
  try {
    const { userInfo, items } = req.body;

    if (!userInfo || !userInfo.name || !userInfo.email || !userInfo.phone || !userInfo.address) {
      return res.status(400).json({ message: "Please provide all required user information" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart cannot be empty" });
    }

    // Insert user info
    const [result] = await db.promise().query(
      `INSERT INTO cart_requests (name, email, phone, address, tin, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userInfo.name,
        userInfo.email,
        userInfo.phone,
        userInfo.address,
        userInfo.tin || null,
        userInfo.message || null,
        "pending",
      ]
    );

    const requestId = result.insertId;

    // Insert cart items
    for (let item of items) {
      await db.promise().query(
        `INSERT INTO cart_request_items (cart_request_id, product_name, quantity, image, slug) VALUES (?, ?, ?, ?, ?)`,
        [requestId, item.product_name, item.quantity, item.image, item.slug]
      );
    }

    res.status(201).json({ message: "Cart request submitted successfully", requestId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all cart requests (admin)
export const getAllCartRequests = async (req, res) => {
  try {
    const [requests] = await db.promise().query("SELECT * FROM cart_requests");

    const requestsWithItems = await Promise.all(
      requests.map(async (reqRow) => {
        const [items] = await db.promise().query(
          "SELECT * FROM cart_request_items WHERE cart_request_id = ?",
          [reqRow.id]
        );
        return { ...reqRow, items };
      })
    );

    res.status(200).json(requestsWithItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update cart request status (admin)
export const updateCartRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await db.promise().query(
      "UPDATE cart_requests SET status = ? WHERE id = ?",
      [status, id]
    );

    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete cart request (admin)
export const deleteCartRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // First delete cart items
    await db.promise().query(
      "DELETE FROM cart_request_items WHERE cart_request_id = ?",
      [id]
    );

    // Then delete the request itself
    await db.promise().query(
      "DELETE FROM cart_requests WHERE id = ?",
      [id]
    );

    res.status(200).json({ message: "Cart request deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
