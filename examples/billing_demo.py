"""
BizTools Billing System Demo

This script demonstrates how to use the billing system with Stripe integration.
To run this demo:
1. Install required packages: pip install biztools-billing stripe
2. Set your Stripe API key in the environment: export STRIPE_API_KEY=sk_test_...
3. Run the script: python billing_demo.py
"""

import os
import time
from datetime import datetime
from biztools.billing import StripeProcessor, BillingManager, Price

def main():
    # Initialize Stripe processor with API key
    stripe_api_key = os.getenv("STRIPE_API_KEY")
    if not stripe_api_key:
        raise ValueError("Please set STRIPE_API_KEY environment variable")
    
    processor = StripeProcessor(stripe_api_key)
    billing_manager = BillingManager(processor)

    # 1. Create products
    print("\n1. Creating products...")
    basic_plan = billing_manager.create_product(
        name="Basic Plan",
        description="Essential business tools",
        prices=[
            Price(
                currency="USD",
                amount=9.99,
                interval="month",
                interval_count=1
            )
        ]
    )
    
    pro_plan = billing_manager.create_product(
        name="Pro Plan",
        description="Advanced business tools with premium features",
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

    # List available products
    print("\nAvailable Products:")
    for product in billing_manager.get_available_products():
        print(f"- {product.name}")
        for price in product.prices:
            print(f"  ${price.amount}/{price.interval}")

    # 2. Create a customer with payment method
    print("\n2. Creating customer...")
    # In real world, you'd get this token from Stripe.js
    payment_method = processor.create_payment_method("tok_visa")
    
    customer_id = billing_manager.create_customer(
        email="demo@example.com",
        name="Demo User",
        payment_method=payment_method
    )
    print(f"Created customer: {customer_id}")

    # 3. Create a subscription
    print("\n3. Creating subscription...")
    products = billing_manager.get_available_products()
    basic_plan = next(p for p in products if p.name == "Basic Plan")
    monthly_price = basic_plan.prices[0]

    subscription_id = billing_manager.create_subscription(
        customer_id=customer_id,
        product_id=basic_plan.id,
        price_id=monthly_price.id
    )
    print(f"Created subscription: {subscription_id}")

    # 4. Check and process invoice
    print("\n4. Processing initial invoice...")
    invoices = billing_manager.get_customer_invoices(customer_id)
    if invoices:
        invoice = invoices[0]
        print(f"Processing invoice {invoice.id} for ${invoice.amount}")
        success = billing_manager.process_invoice(invoice.id)
        print(f"Payment {'succeeded' if success else 'failed'}")

    # 5. Simulate monthly billing
    print("\n5. Simulating monthly billing cycle...")
    print("Running monthly billing process...")
    billing_manager.process_monthly_billing()
    
    # 6. Cancel subscription
    print("\n6. Canceling subscription...")
    billing_manager.cancel_subscription(subscription_id, immediate=False)
    subscription = billing_manager.get_subscription(subscription_id)
    print(f"Subscription status: {subscription.status}")
    print(f"Auto-renew: {subscription.auto_renew}")

    # 7. Show final invoice summary
    print("\n7. Final invoice summary:")
    invoices = billing_manager.get_customer_invoices(customer_id)
    for invoice in invoices:
        print(f"Invoice {invoice.id}:")
        print(f"- Amount: ${invoice.amount}")
        print(f"- Status: {invoice.status}")
        print(f"- Created: {invoice.created_at}")
        if invoice.paid_at:
            print(f"- Paid: {invoice.paid_at}")
        print()

if __name__ == "__main__":
    main() 