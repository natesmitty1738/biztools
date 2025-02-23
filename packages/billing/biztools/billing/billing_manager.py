from datetime import datetime
from typing import List, Optional, Dict, Any
import logging
from .stripe_processor import StripeProcessor

logger = logging.getLogger(__name__)

class BillingManager:
    def __init__(self, payment_processor: StripeProcessor):
        self.payment_processor = payment_processor
        self.customers = {}
        self.products = {}
        self.subscriptions = {}
        self.invoices = {}

    def create_customer(self, email: str, name: str, payment_method: str) -> str:
        # Check if customer already exists
        for customer_id, customer in self.customers.items():
            if customer["email"] == email:
                logger.info(f"Customer already exists: {customer_id}")
                return customer_id

        # Create new customer
        customer_id = self.payment_processor.create_stripe_customer(email, payment_method)
        self.customers[customer_id] = {
            "id": customer_id,
            "email": email,
            "name": name,
            "payment_method": payment_method,
            "created_at": datetime.now()
        }
        logger.info(f"Created new customer: {customer_id}")
        return customer_id

    def create_product(self, name: str, description: str, prices: List[Dict[str, Any]]) -> str:
        product_id = f"prod_{len(self.products)}"
        self.products[product_id] = {
            "id": product_id,
            "name": name,
            "description": description,
            "prices": [{
                "id": f"price_{len(self.products)}_{i}",
                **price
            } for i, price in enumerate(prices)]
        }
        logger.info(f"Created product: {product_id}")
        return product_id

    def create_subscription(self, customer_id: str, product_id: str, price_id: str) -> str:
        if customer_id not in self.customers:
            raise ValueError("Customer not found")
        if product_id not in self.products:
            raise ValueError("Product not found")

        subscription_id = f"sub_{len(self.subscriptions)}"
        self.subscriptions[subscription_id] = {
            "id": subscription_id,
            "customer_id": customer_id,
            "product_id": product_id,
            "price_id": price_id,
            "status": "active",
            "created_at": datetime.now()
        }
        logger.info(f"Created subscription: {subscription_id}")

        # Create initial invoice
        self.generate_invoice(subscription_id)
        return subscription_id

    def generate_invoice(self, subscription_id: str) -> str:
        if subscription_id not in self.subscriptions:
            raise ValueError("Subscription not found")

        sub = self.subscriptions[subscription_id]
        product = self.products[sub["product_id"]]
        price = next(p for p in product["prices"] if p["id"] == sub["price_id"])

        invoice_id = f"inv_{len(self.invoices)}"
        self.invoices[invoice_id] = {
            "id": invoice_id,
            "customer_id": sub["customer_id"],
            "subscription_id": subscription_id,
            "amount": price["amount"],
            "currency": price["currency"],
            "status": "open",
            "created_at": datetime.now(),
            "paid_at": None
        }
        logger.info(f"Generated invoice: {invoice_id}")
        return invoice_id

    def process_invoice(self, invoice_id: str) -> bool:
        if invoice_id not in self.invoices:
            logger.error(f"Invoice not found: {invoice_id}")
            raise ValueError("Invoice not found")

        invoice = self.invoices[invoice_id]
        if invoice["status"] != "open":
            logger.info(f"Invoice {invoice_id} is not open (status: {invoice['status']})")
            return False

        success = self.payment_processor.process_payment(
            invoice["customer_id"],
            invoice["amount"],
            invoice["currency"]
        )

        if success:
            invoice["status"] = "paid"
            invoice["paid_at"] = datetime.now()
            logger.info(f"Invoice {invoice_id} processed successfully")
        else:
            logger.error(f"Failed to process invoice {invoice_id}")

        return success

    def get_customer_invoices(self, customer_id: str) -> List[Dict[str, Any]]:
        invoices = [
            invoice for invoice in self.invoices.values()
            if invoice["customer_id"] == customer_id
        ]
        logger.info(f"Found {len(invoices)} invoices for customer {customer_id}")
        return sorted(invoices, key=lambda x: x["created_at"], reverse=True)

    def get_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        return self.subscriptions.get(subscription_id)

    def get_available_products(self) -> List[Dict[str, Any]]:
        return list(self.products.values())

    def delete_invoice(self, invoice_id: str) -> bool:
        if invoice_id not in self.invoices:
            logger.error(f"Invoice not found: {invoice_id}")
            return False

        invoice = self.invoices[invoice_id]
        if invoice["status"] == "paid":
            # Refund the payment
            logger.info(f"Refunding payment for invoice {invoice_id}")
            success = self.payment_processor.refund_payment(invoice_id)
            if not success:
                logger.error(f"Failed to refund payment for invoice {invoice_id}")
                return False

        # Delete the invoice
        del self.invoices[invoice_id]
        logger.info(f"Deleted invoice {invoice_id}")

        # Cancel subscription if it exists
        subscription_id = invoice.get("subscription_id")
        if subscription_id and subscription_id in self.subscriptions:
            self.subscriptions[subscription_id]["status"] = "canceled"
            logger.info(f"Canceled subscription {subscription_id}")

        return True 