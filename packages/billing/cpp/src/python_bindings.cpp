#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <pybind11/chrono.h>
#include "biztools/billing/billing_manager.hpp"
#include "biztools/billing/stripe_processor.hpp"

namespace py = pybind11;
using namespace biztools::billing;

PYBIND11_MODULE(biztools_billing_cpp, m) {
    m.doc() = "BizTools Billing System with Stripe Integration";

    // Bind Price structure
    py::class_<Price>(m, "Price")
        .def(py::init<>())
        .def_readwrite("id", &Price::id)
        .def_readwrite("currency", &Price::currency)
        .def_readwrite("amount", &Price::amount)
        .def_readwrite("interval", &Price::interval)
        .def_readwrite("interval_count", &Price::interval_count);

    // Bind Product structure
    py::class_<Product>(m, "Product")
        .def(py::init<>())
        .def_readwrite("id", &Product::id)
        .def_readwrite("name", &Product::name)
        .def_readwrite("description", &Product::description)
        .def_readwrite("active", &Product::active)
        .def_readwrite("prices", &Product::prices);

    // Bind Customer structure
    py::class_<Customer>(m, "Customer")
        .def(py::init<>())
        .def_readwrite("id", &Customer::id)
        .def_readwrite("email", &Customer::email)
        .def_readwrite("name", &Customer::name)
        .def_readwrite("payment_method", &Customer::payment_method)
        .def_readwrite("active", &Customer::active)
        .def_readwrite("created_at", &Customer::created_at);

    // Bind Subscription structure
    py::class_<Subscription>(m, "Subscription")
        .def(py::init<>())
        .def_readwrite("id", &Subscription::id)
        .def_readwrite("customer_id", &Subscription::customer_id)
        .def_readwrite("product_id", &Subscription::product_id)
        .def_readwrite("price_id", &Subscription::price_id)
        .def_readwrite("status", &Subscription::status)
        .def_readwrite("current_period_start", &Subscription::current_period_start)
        .def_readwrite("current_period_end", &Subscription::current_period_end)
        .def_readwrite("canceled_at", &Subscription::canceled_at)
        .def_readwrite("auto_renew", &Subscription::auto_renew);

    // Bind Invoice structure
    py::class_<Invoice>(m, "Invoice")
        .def(py::init<>())
        .def_readwrite("id", &Invoice::id)
        .def_readwrite("customer_id", &Invoice::customer_id)
        .def_readwrite("subscription_id", &Invoice::subscription_id)
        .def_readwrite("amount", &Invoice::amount)
        .def_readwrite("currency", &Invoice::currency)
        .def_readwrite("status", &Invoice::status)
        .def_readwrite("created_at", &Invoice::created_at)
        .def_readwrite("paid_at", &Invoice::paid_at);

    // Bind PaymentProcessor interface
    py::class_<PaymentProcessor, std::shared_ptr<PaymentProcessor>>(m, "PaymentProcessor")
        .def("process_payment", &PaymentProcessor::process_payment)
        .def("refund_payment", &PaymentProcessor::refund_payment);

    // Bind StripeProcessor implementation
    py::class_<StripeProcessor, PaymentProcessor, std::shared_ptr<StripeProcessor>>(m, "StripeProcessor")
        .def(py::init<const std::string&>())
        .def("create_payment_method", &StripeProcessor::create_payment_method)
        .def("create_stripe_customer", &StripeProcessor::create_stripe_customer)
        .def("update_payment_method", &StripeProcessor::update_payment_method);

    // Bind BillingManager
    py::class_<BillingManager>(m, "BillingManager")
        .def(py::init<std::shared_ptr<PaymentProcessor>>())
        
        // Product management
        .def("create_product", &BillingManager::create_product)
        .def("update_product", &BillingManager::update_product)
        .def("get_available_products", &BillingManager::get_available_products)
        
        // Customer management
        .def("create_customer", &BillingManager::create_customer)
        .def("update_customer", &BillingManager::update_customer)
        
        // Subscription management
        .def("create_subscription", &BillingManager::create_subscription)
        .def("cancel_subscription", &BillingManager::cancel_subscription)
        .def("get_subscription", &BillingManager::get_subscription)
        
        // Billing operations
        .def("process_monthly_billing", &BillingManager::process_monthly_billing)
        .def("generate_invoice", &BillingManager::generate_invoice)
        .def("process_invoice", &BillingManager::process_invoice)
        .def("get_customer_invoices", &BillingManager::get_customer_invoices);
} 