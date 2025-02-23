#include "biztools/billing/billing_manager.hpp"
#include <random>
#include <sstream>
#include <iomanip>
#include <chrono>

namespace biztools {
namespace billing {

BillingManager::BillingManager(std::shared_ptr<PaymentProcessor> payment_processor)
    : payment_processor_(std::move(payment_processor)) {}

std::string BillingManager::create_product(
    const std::string& name,
    const std::string& description,
    const std::vector<Price>& prices
) {
    Product product;
    product.id = generate_id("prod");
    product.name = name;
    product.description = description;
    product.active = true;
    product.prices = prices;

    // Assign IDs to prices if not already set
    for (auto& price : product.prices) {
        if (price.id.empty()) {
            price.id = generate_id("price");
        }
    }

    products_[product.id] = product;
    return product.id;
}

void BillingManager::update_product(
    const std::string& product_id,
    const nlohmann::json& updates
) {
    auto it = products_.find(product_id);
    if (it == products_.end()) {
        throw std::runtime_error("Product not found");
    }

    auto& product = it->second;
    if (updates.contains("name")) {
        product.name = updates["name"];
    }
    if (updates.contains("description")) {
        product.description = updates["description"];
    }
    if (updates.contains("active")) {
        product.active = updates["active"];
    }
    if (updates.contains("prices")) {
        product.prices.clear();
        for (const auto& price : updates["prices"]) {
            product.prices.push_back(price.get<Price>());
        }
    }
}

std::string BillingManager::create_customer(
    const std::string& email,
    const std::string& name,
    const std::string& payment_method
) {
    Customer customer;
    customer.id = generate_id("cust");
    customer.email = email;
    customer.name = name;
    customer.payment_method = payment_method;
    customer.active = true;
    customer.created_at = std::chrono::system_clock::now();

    customers_[customer.id] = customer;
    return customer.id;
}

void BillingManager::update_customer(
    const std::string& customer_id,
    const nlohmann::json& updates
) {
    auto it = customers_.find(customer_id);
    if (it == customers_.end()) {
        throw std::runtime_error("Customer not found");
    }

    auto& customer = it->second;
    if (updates.contains("email")) {
        customer.email = updates["email"];
    }
    if (updates.contains("name")) {
        customer.name = updates["name"];
    }
    if (updates.contains("payment_method")) {
        customer.payment_method = updates["payment_method"];
    }
    if (updates.contains("active")) {
        customer.active = updates["active"];
    }
}

std::string BillingManager::create_subscription(
    const std::string& customer_id,
    const std::string& product_id,
    const std::string& price_id
) {
    // Validate customer and product
    if (!customers_.contains(customer_id)) {
        throw std::runtime_error("Customer not found");
    }
    if (!products_.contains(product_id)) {
        throw std::runtime_error("Product not found");
    }

    // Create subscription
    Subscription sub;
    sub.id = generate_id("sub");
    sub.customer_id = customer_id;
    sub.product_id = product_id;
    sub.price_id = price_id;
    sub.status = "active";
    sub.current_period_start = std::chrono::system_clock::now();
    
    // Set period end based on price interval
    const auto& product = products_[product_id];
    const auto* price = std::find_if(
        product.prices.begin(),
        product.prices.end(),
        [&price_id](const Price& p) { return p.id == price_id; }
    );
    
    if (price == product.prices.end()) {
        throw std::runtime_error("Price not found");
    }

    // Calculate period end
    auto period_end = sub.current_period_start;
    if (price->interval == "month") {
        period_end += std::chrono::hours(24 * 30 * price->interval_count);
    } else if (price->interval == "year") {
        period_end += std::chrono::hours(24 * 365 * price->interval_count);
    }
    
    sub.current_period_end = period_end;
    sub.auto_renew = true;

    // Store subscription
    subscriptions_[sub.id] = sub;

    // Generate initial invoice
    generate_invoice(sub.id);

    return sub.id;
}

void BillingManager::cancel_subscription(
    const std::string& subscription_id,
    bool immediate
) {
    auto it = subscriptions_.find(subscription_id);
    if (it == subscriptions_.end()) {
        throw std::runtime_error("Subscription not found");
    }

    auto& sub = it->second;
    if (immediate) {
        sub.status = "canceled";
        sub.canceled_at = std::chrono::system_clock::now();
    } else {
        sub.auto_renew = false;
    }
}

void BillingManager::process_monthly_billing() {
    auto now = std::chrono::system_clock::now();

    for (auto& [id, sub] : subscriptions_) {
        if (sub.status != "active" || !sub.auto_renew) {
            continue;
        }

        if (is_subscription_due(sub)) {
            generate_invoice(id);
        }
    }
}

void BillingManager::generate_invoice(const std::string& subscription_id) {
    auto it = subscriptions_.find(subscription_id);
    if (it == subscriptions_.end()) {
        throw std::runtime_error("Subscription not found");
    }

    const auto& sub = it->second;
    const auto& product = products_[sub.product_id];
    const auto* price = std::find_if(
        product.prices.begin(),
        product.prices.end(),
        [&sub](const Price& p) { return p.id == sub.price_id; }
    );

    if (price == product.prices.end()) {
        throw std::runtime_error("Price not found");
    }

    Invoice invoice;
    invoice.id = generate_id("inv");
    invoice.customer_id = sub.customer_id;
    invoice.subscription_id = sub.id;
    invoice.amount = price->amount;
    invoice.currency = price->currency;
    invoice.status = "open";
    invoice.created_at = std::chrono::system_clock::now();

    invoices_[invoice.id] = invoice;
}

bool BillingManager::process_invoice(const std::string& invoice_id) {
    auto it = invoices_.find(invoice_id);
    if (it == invoices_.end()) {
        throw std::runtime_error("Invoice not found");
    }

    auto& invoice = it->second;
    if (invoice.status != "open") {
        return false;
    }

    // Process payment
    bool success = payment_processor_->process_payment(
        invoice.customer_id,
        invoice.amount,
        invoice.currency
    );

    if (success) {
        invoice.status = "paid";
        invoice.paid_at = std::chrono::system_clock::now();

        // Update subscription period if payment successful
        auto sub_it = subscriptions_.find(invoice.subscription_id);
        if (sub_it != subscriptions_.end()) {
            auto& sub = sub_it->second;
            sub.current_period_start = sub.current_period_end;
            sub.current_period_end += (sub.current_period_end - sub.current_period_start);
        }
    } else {
        // Handle failed payment
        auto sub_it = subscriptions_.find(invoice.subscription_id);
        if (sub_it != subscriptions_.end()) {
            auto& sub = sub_it->second;
            sub.status = "past_due";
        }
    }

    return success;
}

std::vector<Invoice> BillingManager::get_customer_invoices(
    const std::string& customer_id
) {
    std::vector<Invoice> result;
    for (const auto& [id, invoice] : invoices_) {
        if (invoice.customer_id == customer_id) {
            result.push_back(invoice);
        }
    }
    return result;
}

std::optional<Subscription> BillingManager::get_subscription(
    const std::string& subscription_id
) {
    auto it = subscriptions_.find(subscription_id);
    if (it != subscriptions_.end()) {
        return it->second;
    }
    return std::nullopt;
}

std::vector<Product> BillingManager::get_available_products() {
    std::vector<Product> result;
    for (const auto& [id, product] : products_) {
        if (product.active) {
            result.push_back(product);
        }
    }
    return result;
}

// Private helper methods
void BillingManager::validate_subscription(const Subscription& sub) {
    if (!customers_.contains(sub.customer_id)) {
        throw std::runtime_error("Invalid customer ID");
    }
    if (!products_.contains(sub.product_id)) {
        throw std::runtime_error("Invalid product ID");
    }
}

std::string BillingManager::generate_id(const std::string& prefix) {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(0, 35);

    std::stringstream ss;
    ss << prefix << "_";
    
    const char charset[] = "0123456789abcdefghijklmnopqrstuvwxyz";
    for (int i = 0; i < 16; ++i) {
        ss << charset[dis(gen)];
    }
    
    return ss.str();
}

bool BillingManager::is_subscription_due(const Subscription& sub) {
    auto now = std::chrono::system_clock::now();
    return now >= sub.current_period_end;
}

} // namespace billing
} // namespace biztools 