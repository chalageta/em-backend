// models/cartRequest.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
  slug: { type: String }
});

const cartRequestSchema = new mongoose.Schema(
  {
    userInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      tin: { type: String },
      message: { type: String }
    },
    items: [cartItemSchema],
    status: { type: String, default: "pending" } // pending, approved, rejected
  },
  { timestamps: true }
);

const CartRequest = mongoose.model("CartRequest", cartRequestSchema);

export default CartRequest;
