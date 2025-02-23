import pytest
from datetime import datetime, timedelta
from biztools.billing import (
    StripeProcessor,
    BillingManager,
    Price,
    Product,
    Customer,
    Subscription,
    Invoice
)

# Mock Stripe processor for testing
class MockStripeProcessor(StripeProcessor):
    def __init__(self):
        self.payments = {}
        self.refunds = {}
        self.customers = {}
        self.payment_methods = {}

    def process_payment(self, customer_id, amount, currency):
        payment_id = f"py_{len(self.payments)}"
        self.payments[payment_id] = {
            "customer_id": customer_id,
            "amount": amount,
            "currency": currency,
            "status": "succeeded"
        }
        return True

    def refund_payment(self, payment_id):
        if payment_id in self.payments:
            refund_id = f"re_{len(self.refunds)}"
            self.refunds[refund_id] = {
                "payment_id": payment_id,
                "status": "succeeded"
            }
            return True
        return False

    def create_payment_method(self, token):
        payment_method_id = f"pm_{len(self.payment_methods)}"
        self.payment_methods[payment_method_id] = {
            "token": token,
            "type": "card"
        }
        return payment_method_id

    def create_stripe_customer(self, email, payment_method):
        customer_id = f"cus_{len(self.customers)}"
        self.customers[customer_id] = {
            "email": email,
            "payment_method": payment_method
        }
        return customer_id

@pytest.fixture
def billing_manager():
    processor = MockStripeProcessor()
    return BillingManager(processor)

def test_create_product(billing_manager):
    # Create a product with monthly and yearly pricing
    product_id = billing_manager.create_product(
        name="Business Tools Pro",
        description="Full access to all business tools",
        prices=[
            Price(
                currency="USD",
                amount=29.99,
                interval="month",
                interval_count=1
            ),
            Price(
                currency="USD",
                amount=299.99,
                interval="year",
                interval_count=1
            )
        ]
    )

    # Verify product was created
    products = billing_manager.get_available_products()
    assert len(products) == 1
    assert products[0].name == "Business Tools Pro"
    assert len(products[0].prices) == 2
    assert products[0].prices[0].amount == 29.99
    assert products[0].prices[1].amount == 299.99

def test_customer_subscription_flow(billing_manager):
    # 1. Create a product
    product_id = billing_manager.create_product(
        name="Basic Plan",
        description="Basic access",
        prices=[
            Price(
                currency="USD",
                amount=9.99,
                interval="month",
                interval_count=1
            )
        ]
    )
    
    # 2. Create a customer
    customer_id = billing_manager.create_customer(
        email="test@example.com",
        name="Test User",
        payment_method="pm_test_card"
    )

    # 3. Create a subscription
    products = billing_manager.get_available_products()
    price_id = products[0].prices[0].id
    subscription_id = billing_manager.create_subscription(
        customer_id=customer_id,
        product_id=product_id,
        price_id=price_id
    )

    # 4. Verify subscription was created
    subscription = billing_manager.get_subscription(subscription_id)
    assert subscription is not None
    assert subscription.customer_id == customer_id
    assert subscription.status == "active"

    # 5. Check invoices were generated
    invoices = billing_manager.get_customer_invoices(customer_id)
    assert len(invoices) == 1
    assert invoices[0].amount == 9.99
    assert invoices[0].status == "open"

    # 6. Process the invoice
    success = billing_manager.process_invoice(invoices[0].id)
    assert success
    
    # 7. Verify invoice was paid
    invoices = billing_manager.get_customer_invoices(customer_id)
    assert invoices[0].status == "paid"

def test_subscription_cancellation(billing_manager):
    # Setup product and customer
    product_id = billing_manager.create_product(
        name="Cancel Test Plan",
        description="Plan to test cancellation",
        prices=[Price(currency="USD", amount=19.99, interval="month", interval_count=1)]
    )
    
    customer_id = billing_manager.create_customer(
        email="cancel@example.com",
        name="Cancel Test",
        payment_method="pm_test_card"
    )

    # Create subscription
    products = billing_manager.get_available_products()
    price_id = products[0].prices[0].id
    subscription_id = billing_manager.create_subscription(
        customer_id=customer_id,
        product_id=product_id,
        price_id=price_id
    )

    # Test immediate cancellation
    billing_manager.cancel_subscription(subscription_id, immediate=True)
    subscription = billing_manager.get_subscription(subscription_id)
    assert subscription.status == "canceled"
    assert subscription.canceled_at is not None

    # Test end-of-period cancellation
    subscription_id2 = billing_manager.create_subscription(
        customer_id=customer_id,
        product_id=product_id,
        price_id=price_id
    )
    billing_manager.cancel_subscription(subscription_id2, immediate=False)
    subscription = billing_manager.get_subscription(subscription_id2)
    assert subscription.status == "active"
    assert not subscription.auto_renew

def test_monthly_billing_process(billing_manager):
    # Setup product and customer
    product_id = billing_manager.create_product(
        name="Monthly Test Plan",
        description="Plan to test monthly billing",
        prices=[Price(currency="USD", amount=29.99, interval="month", interval_count=1)]
    )
    
    customer_id = billing_manager.create_customer(
        email="monthly@example.com",
        name="Monthly Test",
        payment_method="pm_test_card"
    )

    # Create subscription
    products = billing_manager.get_available_products()
    price_id = products[0].prices[0].id
    subscription_id = billing_manager.create_subscription(
        customer_id=customer_id,
        product_id=product_id,
        price_id=price_id
    )

    # Process initial invoice
    invoices = billing_manager.get_customer_invoices(customer_id)
    billing_manager.process_invoice(invoices[0].id)

    # Simulate monthly billing run
    billing_manager.process_monthly_billing()
    
    # Should not have generated new invoice yet (not due)
    invoices = billing_manager.get_customer_invoices(customer_id)
    assert len(invoices) == 1

    # Force subscription to be due
    subscription = billing_manager.get_subscription(subscription_id)
    subscription.current_period_end = datetime.now() - timedelta(days=1)

    # Run monthly billing again
    billing_manager.process_monthly_billing()
    
    # Should have generated new invoice
    invoices = billing_manager.get_customer_invoices(customer_id)
    assert len(invoices) == 2 