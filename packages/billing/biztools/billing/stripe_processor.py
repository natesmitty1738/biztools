import stripe
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class StripeProcessor:
    def __init__(self, api_key: str):
        self.api_key = api_key
        # Don't initialize stripe for testing
        if api_key != "YOUR_STRIPE_TEST_KEY":
            stripe.api_key = api_key

    def process_payment(self, customer_id: str, amount: float, currency: str = "USD") -> bool:
        logger.info(f"Processing payment for customer {customer_id}: {amount} {currency}")
        if self.api_key == "YOUR_STRIPE_TEST_KEY":
            logger.info("Test mode: Payment succeeded")
            return True
            
        try:
            # Real Stripe payment processing would go here
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            return False

    def refund_payment(self, payment_id: str) -> bool:
        logger.info(f"Refunding payment {payment_id}")
        if self.api_key == "YOUR_STRIPE_TEST_KEY":
            logger.info("Test mode: Refund succeeded")
            return True
            
        try:
            # Real Stripe refund would go here
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            return False

    def create_payment_method(self, token: str) -> str:
        logger.info(f"Creating payment method with token {token}")
        if self.api_key == "YOUR_STRIPE_TEST_KEY":
            logger.info("Test mode: Created test payment method")
            return "pm_test_card"
            
        try:
            # Real Stripe payment method creation would go here
            return "pm_test_card"
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise ValueError(str(e))

    def create_stripe_customer(self, email: str, payment_method: str) -> str:
        logger.info(f"Creating customer for {email} with payment method {payment_method}")
        if self.api_key == "YOUR_STRIPE_TEST_KEY":
            customer_id = f"cus_test_{email.split('@')[0]}"
            logger.info(f"Test mode: Created customer {customer_id}")
            return customer_id
            
        try:
            # Real Stripe customer creation would go here
            return f"cus_test_{email.split('@')[0]}"
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise ValueError(str(e))

    def update_payment_method(self, customer_id: str, payment_method: str) -> None:
        logger.info(f"Updating payment method for customer {customer_id}")
        if self.api_key == "YOUR_STRIPE_TEST_KEY":
            logger.info("Test mode: Updated payment method")
            return
            
        try:
            # Real Stripe payment method update would go here
            pass
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            raise ValueError(str(e)) 