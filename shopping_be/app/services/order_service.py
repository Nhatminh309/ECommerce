from typing import List, Optional
from sqlalchemy.orm import Session
from decimal import Decimal

from app.repositories.order_repository import OrderRepository
from app.repositories.order_item_repository import OrderItemRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.cart_item_repository import CartItemRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.user_repository import UserRepository
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.cart_item import CartItem
from app.models.product import Product
from app.exceptions import ResourceNotFoundException, InvalidRequestException, InsufficientStockException
from app.schemas.order import OrderResponse, OrderItemResponse, CreateOrderRequest
from app.schemas.upload import UpdateOrderStatusRequest
from app.enums import OrderStatus, Role

class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.order_item_repo = OrderItemRepository(db)
        self.cart_repo = CartRepository(db)
        self.cart_item_repo = CartItemRepository(db)
        self.product_repo = ProductRepository(db)
        self.user_repo = UserRepository(db)

    def create_order(self, username: str, shipping_info: CreateOrderRequest) -> OrderResponse:
        user = self.user_repo.find_by_username(username)
        if not user:
            raise InvalidRequestException("User not found")

        cart = self.cart_repo.find_by_user_id(user.id)
        if not cart:
            raise ResourceNotFoundException("Cart is empty")

        if not cart.cart_items:
            raise InvalidRequestException("Cart is empty")

        # Validate stock for all items
        for cart_item in cart.cart_items:
            product = cart_item.product
            if product.is_deleted:
                raise InvalidRequestException(f"Product '{product.name}' is no longer available")
            if product.quantity < cart_item.quantity:
                raise InsufficientStockException(
                    f"Insufficient stock for product: {product.name}. "
                    f"Available: {product.quantity}, Requested: {cart_item.quantity}"
                )

        # Create order with shipping info
        order = Order(
            user_id=user.id,
            total_price=Decimal(0),
            status=OrderStatus.PENDING,
            full_name=shipping_info.full_name,
            phone_number=shipping_info.phone_number,
            address=shipping_info.address,
            note=shipping_info.note
        )

        order_items = []
        total_price = Decimal(0)

        for cart_item in cart.cart_items:
            product = cart_item.product

            order_item = OrderItem(
                order=order,
                product_id=product.id,
                quantity=cart_item.quantity,
                price=product.price
            )
            order_items.append(order_item)
            total_price += product.price * cart_item.quantity

            # Reduce stock
            product.quantity -= cart_item.quantity
            self.product_repo.update(product)

        order.total_price = total_price
        order.order_items = order_items

        order = self.order_repo.create(order)
        self.order_item_repo.create_many(order_items)

        # Clear cart
        self.cart_item_repo.delete_by_cart_id(cart.id)

        return self._to_order_response(order)

    def get_order(self, order_id: int, username: str, user_role: str) -> OrderResponse:
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ResourceNotFoundException(f"Order not found with id: {order_id}")

        current_user = self.user_repo.find_by_username(username)
        if user_role != Role.ADMIN and order.user_id != current_user.id:
            raise InvalidRequestException("Not authorized to view this order")

        return self._to_order_response(order)

    def get_my_orders(self, username: str, page: int = 0, size: int = 10) -> dict:
        user = self.user_repo.find_by_username(username)
        if not user:
            raise InvalidRequestException("User not found")

        skip = page * size
        orders = self.order_repo.find_by_user_id_paginated(user.id, skip, size)
        total = self.order_repo.count_by_user_id(user.id)
        return {
            "items": [self._to_order_response(order) for order in orders],
            "total": total,
            "page": page,
            "size": size
        }

    def get_all_orders(self, page: int = 0, size: int = 10) -> dict:
        skip = page * size
        orders = self.order_repo.find_paid_paginated(skip, size)
        total = self.order_repo.count_paid()
        return {
            "items": [self._to_order_response(order) for order in orders],
            "total": total,
            "page": page,
            "size": size
        }

    def update_order_status(self, order_id: int, request: UpdateOrderStatusRequest) -> OrderResponse:
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ResourceNotFoundException(f"Order not found with id: {order_id}")

        new_status = request.status
        if new_status is None:
            raise InvalidRequestException("Status is required")

        if not self._is_valid_transition(order.status, new_status):
            raise InvalidRequestException(
                f"Invalid status transition from {order.status} to {new_status}"
            )

        order.status = new_status
        order = self.order_repo.update(order)
        return self._to_order_response(order)

    def delete_order(self, order_id: int, username: str, user_role: str) -> bool:
        """Delete an order. Users can delete their own orders, admins can delete any."""
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ResourceNotFoundException(f"Order not found with id: {order_id}")

        current_user = self.user_repo.find_by_username(username)
        if user_role != Role.ADMIN and order.user_id != current_user.id:
            raise InvalidRequestException("Not authorized to delete this order")

        self.order_repo.delete(order)
        return True

    def _is_valid_transition(self, current: OrderStatus, new: OrderStatus) -> bool:
        if current == new:
            return False
        transitions = {
            OrderStatus.PENDING: [OrderStatus.CONFIRMED],
            OrderStatus.CONFIRMED: [OrderStatus.SHIPPED],
            OrderStatus.SHIPPED: [OrderStatus.DELIVERED],
            OrderStatus.DELIVERED: []
        }
        return new in transitions.get(current, [])

    def _to_order_response(self, order: Order) -> OrderResponse:
        order_items = []
        for item in order.order_items:
            product = item.product
            image_urls = [img.image_url for img in product.images] if product.images else []
            order_items.append(OrderItemResponse(
                id=item.id,
                productId=product.id,
                productName=product.name,
                quantity=item.quantity,
                price=item.price,
                subtotal=item.quantity * item.price,
                imageUrls=image_urls
            ))

        return OrderResponse(
            id=order.id,
            userId=order.user_id,
            username=order.user.username,
            totalPrice=order.total_price,
            status=order.status.value,
            full_name=order.full_name,
            phone_number=order.phone_number,
            address=order.address,
            note=order.note,
            created_at=order.created_at,
            updated_at=order.updated_at,
            orderItems=order_items
        )
