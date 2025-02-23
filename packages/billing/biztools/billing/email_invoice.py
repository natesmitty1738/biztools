import os
import yaml
import smtplib
import jinja2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from datetime import datetime, timedelta
from pathlib import Path

class EmailInvoiceManager:
    def __init__(self, config_path):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        # Set up Jinja2 template environment
        template_dir = Path(__file__).parent / 'templates'
        self.jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(template_dir)
        )

    def generate_invoice_html(self, customer, invoice_number):
        """Generate HTML content for the invoice using a template."""
        template = self.jinja_env.get_template('invoice_template.html')
        
        context = {
            'invoice_number': invoice_number,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'due_date': (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d'),
            'customer': customer,
            'company': self.config['invoice_settings'],
        }
        
        return template.render(**context)

    def send_invoice_email(self, customer, invoice_html):
        """Send invoice email to the customer."""
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Invoice from {self.config['invoice_settings']['company_name']}"
        msg['From'] = self.config['email_settings']['sender_email']
        msg['To'] = customer['email']

        # Attach HTML content
        msg.attach(MIMEText(invoice_html, 'html'))

        # Attach company logo if specified
        logo_path = self.config['invoice_settings'].get('company_logo')
        if logo_path and os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                img = MIMEImage(f.read())
                img.add_header('Content-ID', '<company_logo>')
                msg.attach(img)

        # Send email
        with smtplib.SMTP(
            self.config['email_settings']['smtp_server'],
            self.config['email_settings']['smtp_port']
        ) as server:
            server.starttls()
            server.login(
                self.config['email_settings']['sender_email'],
                self.config['email_settings']['smtp_password']
            )
            server.send_message(msg)

    def process_monthly_invoices(self):
        """Process all invoices that are due today."""
        today = datetime.now()
        invoice_number_base = today.strftime('%Y%m')
        
        for idx, customer in enumerate(self.config['customers']):
            # Check if invoice is due today
            if customer['billing_day'] != today.day:
                continue
                
            # Check billing frequency
            if customer['billing_frequency'] == 'monthly':
                should_bill = True
            elif customer['billing_frequency'] == 'quarterly':
                should_bill = today.month in [1, 4, 7, 10]
            elif customer['billing_frequency'] == 'yearly':
                should_bill = today.month == 1
            else:
                continue

            if should_bill:
                invoice_number = f"{invoice_number_base}-{idx+1:03d}"
                invoice_html = self.generate_invoice_html(customer, invoice_number)
                self.send_invoice_email(customer, invoice_html)
                print(f"Sent invoice {invoice_number} to {customer['email']}")

    @classmethod
    def run_from_config(cls, config_path):
        """Class method to create instance and run invoice processing."""
        manager = cls(config_path)
        manager.process_monthly_invoices() 