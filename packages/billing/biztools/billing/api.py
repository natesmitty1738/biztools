from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import logging
from .email_invoice import EmailInvoiceManager
from .stripe_processor import StripeProcessor
from .billing_manager import BillingManager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BizTools Billing API")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize billing components
stripe_processor = StripeProcessor("YOUR_STRIPE_TEST_KEY")  # Replace with env var
billing_manager = BillingManager(stripe_processor)

class CreateInvoiceRequest(BaseModel):
    customer: str
    amount: float
    due_date: datetime
    description: Optional[str] = None
    billing_frequency: str

@app.post("/api/billing/create-invoice")
async def create_invoice(request: CreateInvoiceRequest):
    try:
        logger.info(f"Creating invoice for customer: {request.customer}")
        
        # Create customer if not exists
        logger.info("Creating customer...")
        customer_id = billing_manager.create_customer(
            email=request.customer,
            name=request.customer.split("@")[0],  # Simple name from email
            payment_method="pm_test_card"  # Test payment method
        )
        logger.info(f"Customer created with ID: {customer_id}")

        # Create a test product for the invoice
        logger.info("Creating product...")
        product_id = billing_manager.create_product(
            name=f"Service - {datetime.now().strftime('%Y%m%d')}",
            description=request.description or "Service charge",
            prices=[{
                "currency": "USD",
                "amount": request.amount,
                "interval": request.billing_frequency,
                "interval_count": 1
            }]
        )
        logger.info(f"Product created with ID: {product_id}")

        # Create subscription
        logger.info("Creating subscription...")
        products = billing_manager.get_available_products()
        product = next(p for p in products if p["id"] == product_id)
        subscription_id = billing_manager.create_subscription(
            customer_id=customer_id,
            product_id=product_id,
            price_id=product["prices"][0]["id"]
        )
        logger.info(f"Subscription created with ID: {subscription_id}")

        # Get and process the invoice
        logger.info("Processing invoice...")
        invoices = billing_manager.get_customer_invoices(customer_id)
        if not invoices:
            logger.error("No invoice was generated")
            raise HTTPException(status_code=500, detail="No invoice was generated")

        latest_invoice = invoices[0]  # Get newest invoice
        success = billing_manager.process_invoice(latest_invoice["id"])
        if not success:
            logger.error("Failed to process invoice")
            raise HTTPException(status_code=500, detail="Failed to process invoice")
        
        logger.info(f"Invoice processed successfully: {latest_invoice['id']}")
        return {
            "invoice_id": latest_invoice["id"],
            "customer_id": customer_id,
            "subscription_id": subscription_id,
            "amount": latest_invoice["amount"],
            "status": latest_invoice["status"],
            "created_at": latest_invoice["created_at"].isoformat(),
            "paid_at": latest_invoice["paid_at"].isoformat() if latest_invoice["paid_at"] else None
        }
    
    except Exception as e:
        logger.error(f"Error creating invoice: {str(e)}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/billing/invoices")
async def list_invoices(customer_id: Optional[str] = None):
    try:
        if customer_id:
            invoices = billing_manager.get_customer_invoices(customer_id)
        else:
            # Get all invoices from all customers
            invoices = []
            for customer_id in billing_manager.customers:
                invoices.extend(billing_manager.get_customer_invoices(customer_id))
            # Sort by created_at
            invoices.sort(key=lambda x: x["created_at"], reverse=True)
            
        return [{
            "id": inv["id"],
            "customer_id": inv["customer_id"],
            "amount": inv["amount"],
            "status": inv["status"],
            "created_at": inv["created_at"].isoformat(),
            "paid_at": inv["paid_at"].isoformat() if inv["paid_at"] else None
        } for inv in invoices]
    
    except Exception as e:
        logger.error(f"Error listing invoices: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/billing/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str):
    try:
        logger.info(f"Deleting invoice: {invoice_id}")
        success = billing_manager.delete_invoice(invoice_id)
        if not success:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return {"status": "success", "message": "Invoice deleted"}
    except Exception as e:
        logger.error(f"Error deleting invoice: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e)) 