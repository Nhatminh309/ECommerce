# Backend API Contract

Extracted from `shopping/src/main/java/vn/cole/shopping/controller`, DTO classes, `SecurityConfig`, and service implementations.

All JSON success responses use:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Validation errors return:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "fieldName": "message"
  }
}
```

## Authentication

JWT is passed as `Authorization: Bearer <token>`.

| Method | URL | Auth | Request Body | Response Data |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | Public | `{ "username": "string, 3-50", "password": "string, min 6", "confirmPassword": "string" }` | `{ "token": "string", "username": "string", "role": "CUSTOMER" }` |
| POST | `/auth/login` | Public | `{ "username": "string", "password": "string" }` | `{ "token": "string", "username": "string", "role": "CUSTOMER|ADMIN" }` |
| GET | `/auth/me` | Authenticated | none | `{ "id": number, "username": "string", "role": "string" }` |
| GET | `/auth/user/{userId}` | ADMIN | none | `{ "id": number, "username": "string", "role": "string" }` |

## Products

`ProductController` is mapped to both `/api/products` and `/products`. The frontend uses `/products`.

| Method | URL | Auth | Request Body / Params | Response Data |
| --- | --- | --- | --- | --- |
| GET | `/products` | Public | query: `keyword?`, `page` default `0`, `size` default `10` | Spring `Page<ProductResponseDTO>` |
| GET | `/products/{id}` | Public | none | `ProductResponseDTO` |
| POST | `/products` | ADMIN | `{ "name": "string", "description": "string", "price": number > 0, "quantity": number >= 0, "imageUrls": ["string"] }` | `ProductResponseDTO` |
| PUT | `/products/{id}` | ADMIN | same as create | `ProductResponseDTO` |
| DELETE | `/products/{id}` | ADMIN | none | `null` |
| POST | `/products/upload-image` | ADMIN | multipart field `file` | uploaded image URL string |
| POST | `/products/{id}/images` | ADMIN | `{ "imageUrls": ["string"] }` | `null` |
| DELETE | `/products/images/{imageId}` | ADMIN | none | `null` |

`ProductResponseDTO`: `{ "id": number, "name": "string", "description": "string", "price": number, "quantity": number, "createdAt": "ISO datetime", "imageUrls": ["string"] }`.

## Cart

| Method | URL | Auth | Request Body | Response Data |
| --- | --- | --- | --- | --- |
| GET | `/cart` | CUSTOMER or ADMIN | none | `CartResponse` |
| POST | `/cart/add` | CUSTOMER or ADMIN | `{ "productId": number, "quantity": number >= 1 }` | `CartResponse` |
| PUT | `/cart/update` | CUSTOMER or ADMIN | `{ "productId": number, "quantity": number >= 1 }` | `CartResponse` |
| DELETE | `/cart/remove/{productId}` | CUSTOMER or ADMIN | none | `null` |
| DELETE | `/cart/clear` | CUSTOMER or ADMIN | none | `null` |

`CartResponse`: `{ "id": number, "userId": number, "cartItems": [CartItemResponse], "totalItems": number, "totalPrice": number }`.

`CartItemResponse`: `{ "id": number, "productId": number, "productName": "string", "price": number, "quantity": number, "imageUrls": ["string"], "subtotal": number }`.

## Orders

`OrderController` is mapped to both `/api/orders` and `/orders`. Because `SecurityConfig` restricts `/api/orders/**` to ADMIN, the customer frontend uses `/orders`.

| Method | URL | Auth | Request Body / Params | Response Data |
| --- | --- | --- | --- | --- |
| POST | `/orders` | CUSTOMER or ADMIN | none | `OrderResponse` |
| GET | `/orders/{id}` | CUSTOMER or ADMIN | none | `OrderResponse` |
| GET | `/orders/my` | CUSTOMER or ADMIN | query: `page` default `0`, `size` default `10` | Spring `Page<OrderResponse>` |
| GET | `/orders` | ADMIN | query: `page` default `0`, `size` default `10` | Spring `Page<OrderResponse>` |
| PUT | `/orders/{id}/status` | ADMIN | `{ "status": "PENDING|CONFIRMED|SHIPPED|DELIVERED" }` | `OrderResponse` |

`OrderResponse`: `{ "id": number, "userId": number, "username": "string", "totalPrice": number, "status": "string", "createdAt": "ISO datetime", "updatedAt": "ISO datetime", "orderItems": [OrderItemResponse] }`.

`OrderItemResponse`: `{ "id": number, "productId": number, "productName": "string", "quantity": number, "price": number, "subtotal": number, "imageUrls": ["string"] }`.

## Frontend Mapping

| Backend API | Frontend Function | Screen / Caller |
| --- | --- | --- |
| POST `/auth/register` | `authService.register(data)` | `RegisterPage` |
| POST `/auth/login` | `authService.login(data)` | `LoginPage` |
| GET `/auth/me` | `authService.getCurrentUser()` | `AuthContext` |
| GET `/auth/user/{userId}` | `authService.getUserById(userId)` | admin service utility |
| GET `/products` | `productService.getAllProducts(params)` | `ProductsPage`, `AdminProductPage` |
| GET `/products/{id}` | `productService.getProduct(id)` | `ProductDetailPage` |
| POST `/products` | `productService.createProduct(data)` | `AdminProductPage` |
| PUT `/products/{id}` | `productService.updateProduct(id, data)` | `AdminProductPage` |
| DELETE `/products/{id}` | `productService.deleteProduct(id)` | `AdminProductPage` |
| POST `/products/upload-image` | `productService.uploadImage(file)` | admin service utility |
| POST `/products/{id}/images` | `productService.addImagesToProduct(id, imageUrls)` | admin service utility |
| DELETE `/products/images/{imageId}` | `productService.deleteProductImage(imageId)` | admin service utility |
| GET `/cart` | `cartService.getCart()` | `CartContext`, `CartPage`, `CheckoutPage` |
| POST `/cart/add` | `cartService.addItemToCart(data)` | `ProductDetailPage` through `CartContext` |
| PUT `/cart/update` | `cartService.updateCartItem(data)` | `CartPage` through `CartContext` |
| DELETE `/cart/remove/{productId}` | `cartService.removeItemFromCart(productId)` | `CartPage` through `CartContext` |
| DELETE `/cart/clear` | `cartService.clearCart()` | `CartContext` |
| POST `/orders` | `orderService.createOrder()` | `CheckoutPage` |
| GET `/orders/{id}` | `orderService.getOrder(id)` | order service utility |
| GET `/orders/my` | `orderService.getMyOrders(params)` | `OrdersPage` / `OrderHistoryPage` |
| GET `/orders` | `orderService.getAllOrders(params)` | `AdminOrderPage` |
| PUT `/orders/{id}/status` | `orderService.updateOrderStatus(id, status)` | `AdminOrderPage` |
