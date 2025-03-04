# BizTools Billing

Billing system for the BizTools Suite with Stripe integration.

## Installation

```bash
pip install -e .
```

## Development

```bash
pip install -e ".[dev]"
```

## Features

- Invoice generation and management
- Stripe integration for payments
- Subscription handling
- Email notifications

## Quick Start

1. **Install Dependencies**:
```bash
pip install pyyaml jinja2
```

2. **Configure Your Settings**:
Create or edit `config/billing_config.yaml`:

```yaml
email_settings:
  smtp_server: smtp.gmail.com
  smtp_port: 587
  sender_email: your-email@gmail.com
  smtp_password: your-app-password  # Use app-specific password for Gmail

invoice_settings:
  company_name: Your Company Name
  company_address: Your Company Address
  company_logo: path/to/logo.png  # Optional
  currency: USD
  payment_terms: Net 30

customers:
  - name: John Doe
    email: john@example.com
    billing_amount: 99.99
    billing_frequency: monthly  # monthly, quarterly, yearly
    billing_day: 1  # Day of the month to send invoice
```

3. **Run the Invoice Sender**:
```bash
python scripts/send_invoices.py
```

## Configuration Guide

### Email Settings

- `smtp_server`: Your email server (e.g., smtp.gmail.com)
- `smtp_port`: SMTP port (usually 587 for TLS)
- `sender_email`: Your email address
- `smtp_password`: Your email password or app-specific password

For Gmail:
1. Enable 2-factor authentication
2. Generate an app-specific password
3. Use that password in the config

### Invoice Settings

- `company_name`: Your business name
- `company_address`: Your business address
- `company_logo`: Path to your logo file (optional)
- `currency`: Invoice currency (e.g., USD)
- `payment_terms`: Payment terms to display on invoice

### Customer Configuration

Each customer entry supports:
- `name`: Customer's full name
- `email`: Customer's email address
- `billing_amount`: Amount to charge
- `billing_frequency`: One of:
  - `monthly`: Bill every month
  - `quarterly`: Bill every 3 months (Jan, Apr, Jul, Oct)
  - `yearly`: Bill once per year (January)
- `billing_day`: Day of the month to send invoice (1-31)

## Scheduling

### Manual Running
```bash
python scripts/send_invoices.py
```

### Automated with Cron
Add to crontab to run daily at 9 AM:
```bash
0 9 * * * /path/to/python /path/to/scripts/send_invoices.py
```

The script will only send invoices when they're due based on each customer's billing frequency and billing day.

## Invoice Template

The default template includes:
- Company logo and details
- Invoice number and dates
- Customer information
- Billing amount and frequency
- Payment terms
- Professional styling

To customize the template, edit:
`packages/billing/biztools/billing/templates/invoice_template.html`

## Security Best Practices

1. **Email Security**:
   - Use app-specific passwords
   - Enable TLS/SSL
   - Keep credentials secure

2. **File Security**:
   - Protect your config file
   - Use appropriate file permissions
   - Don't commit sensitive data to version control

## Troubleshooting

### Common Issues

1. **Emails Not Sending**:
   - Check SMTP credentials
   - Verify port and server settings
   - Ensure less secure app access is enabled (if using Gmail)

2. **Wrong Billing Dates**:
   - Check customer billing_day settings
   - Verify billing_frequency is correct
   - Check system date/time

3. **Template Issues**:
   - Verify logo path exists
   - Check template syntax
   - Ensure all variables are defined

### Logging

The script logs:
- Successful invoice sends
- Email delivery errors
- Configuration issues
- Template rendering problems

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

- 📫 [GitHub Issues](https://github.com/yourusername/biztools/issues)
- 💬 [Discord Community](https://discord.gg/biztools)
- 📧 support@biztools.dev 