#!/usr/bin/env python3
"""
Invoice Sending Script

This script reads the billing configuration and sends invoices to customers
based on their billing frequency and billing day settings.

To run manually:
    python scripts/send_invoices.py

To schedule with cron (run daily at 9 AM):
    0 9 * * * /path/to/python /path/to/scripts/send_invoices.py

Required dependencies:
    pip install pyyaml jinja2
"""

import os
import sys
from pathlib import Path
from biztools.billing.email_invoice import EmailInvoiceManager

def main():
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    config_path = project_root / 'config' / 'billing_config.yaml'

    if not config_path.exists():
        print(f"Error: Configuration file not found at {config_path}")
        sys.exit(1)

    try:
        # Process invoices
        EmailInvoiceManager.run_from_config(config_path)
        print("Invoice processing completed successfully")
    except Exception as e:
        print(f"Error processing invoices: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 