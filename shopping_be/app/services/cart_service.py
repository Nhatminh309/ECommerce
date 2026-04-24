from typing import List
from sqlalchemy.orm import Session
from decimal import Decimal

from app.repositories.cart_repository import CartRepository
from app.repositories.cart_item_repository import CartItemRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.user_repository import UserRepository
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.exceptions import ResourceNotFoundException, InvalidRequestException, InsufficientStockException
from app.schemas.cart import CartResponse, CartItemResponse

class CartService:
    def __init__(self, db: Session):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.cart_item_repo = CartItemRepository(db)
        self.product_repo = ProductRepository(db)
        self.user_repo = UserRepository(db)

    def get_cart(self, username: str) -> CartResponse:
        cart = self.cart_repo.find_by_user_username(username)
        if not cart:
            raise ResourceNotFoundException("Cart not found")
        return self._to_cart_response(cart)

    def add_item_to_cart(self, username: str, product_id: int, quantity: int) -> CartResponse:
        if quantity < 1:
            raise InvalidRequestException("Quantity must be at least 1")

        user = self.user_repo.find_by_username(username)
        if not user:
            raise InvalidRequestException("User not found")

        cart = self.cart_repo.find_by_user_id(user.id) or self._create_cart(user)

        product = self.product_repo.find_by_id_and_is_deleted_false(product_id)
        if not product:
            raise ResourceNotFoundException(f"Product not found with id: {product_id}")

        if product.is_deleted:
            raise InvalidRequestException("Product is not available")

        if product.quantity < quantity:
            raise InsufficientStockException(f"Insufficient stock. Available: {product.quantity}")

        existing_item = self.cart_item_repo.find_by_cart_id_and_product_id(cart.id, product_id)

        if existing_item:
            new_quantity = existing_item.quantity + quantity
            if product.quantity < new_quantity:
                raise InsufficientStockException(f"Insufficient stock. Available: {product.quantity}")
            existing_item.quantity = new_quantity
            self.cart_item_repo.update(existing_item)
        else:
            cart_item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
            self.cart_item_repo.create(cart_item)

        # Refresh cart from database
        cart = self.cart_repo.get_by_id(cart.id)
        return self._to_cart_response(cart)

    def update_cart_item(self, username: str, product_id: int, quantity: int) -> CartResponse:
        if quantity < 1:
            raise InvalidRequestException("Quantity must be at least 1")

        user = self.user_repo.find_by_username(username)
        if not user:
            raise InvalidRequestException("User not found")

        cart = self.cart_repo.find_by_user_id(user.id)
        if not cart:
            raise ResourceNotFoundException("Cart not found")

        cart_item = self.cart_item_repo.find_by_cart_id_and_product_id(cart.id, product_id)
        if not cart_item:
            raise ResourceNotFoundException("Cart item not found")

        product = cart_item.product
        if quantity > product.quantity:
            raise InsufficientStockException(f"Insufficient stock. Available: {product.quantity}")

        cart_item.quantity = quantity
        self.cart_item_repo.update(cart_item)

        return self._to_cart_response(cart)

    def remove_item_from_cart(self, username: str, product_id: int):
        user = self.user_repo.find_by_username(username)
        if not user:
            raise InvalidRequestException("User not found")

        cart = self.cart_repo.find_by_user_id(user.id)
        if not cart:
            raise ResourceNotFoundException("Cart not found")

        self.cart_item_repo.delete_by_cart_id_and_product_id(cart.id, product_id)

    def clear_cart(self, username: str):
        user = self.user_repo.find_by_username(username)
        if not user:
            raise InvalidRequestException("User not found")

        cart = self.cart_repo.find_by_user_id(user.id)
        if not cart:
            raise ResourceNotFoundException("Cart not found")

        self.cart_item_repo.delete_by_cart_id(cart.id)

    def _create_cart(self, user) -> Cart:
        cart = Cart(user_id=user.id)
        return self.cart_repo.create(cart)

    def _to_cart_response(self, cart: Cart) -> CartResponse:
        cart_items = []
        total_items = 0
        total_price = Decimal(0)

        if cart.cart_items:
            for item in cart.cart_items:
                product = item.product
                subtotal = product.price * item.quantity
                total_items += item.quantity
                total_price += subtotal

                image_urls = [img.image_url for img in product.images] if product.images else []

                cart_items.append(CartItemResponse(
                    id=item.id,
                    productId=product.id,
                    productName=product.name,
                    price=product.price,
                    quantity=item.quantity,
                    imageUrls=image_urls,
                    subtotal=subtotal
                ))

        return CartResponse(
            id=cart.id,
            userId=cart.user_id,
            cartItems=cart_items,
            totalItems=total_items,
            totalPrice=total_price
        )
