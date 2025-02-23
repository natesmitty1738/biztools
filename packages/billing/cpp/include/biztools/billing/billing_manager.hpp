#pragma once

#include <string>
#include <vector>
#include <memory>
#include <chrono>
#include <optional>
#include <unordered_map>
#include "nlohmann/json.hpp"

namespace biztools {
namespace billing {

struct Price {
    std::string id;
    std::string currency;
    double amount;
    std::string interval;  // "month", "year"
    int interval_count;    // e.g., 1 for monthly, 12 for yearly
};

struct Product {
    std::string id;
    std::string name;
    std::string description;
    bool active;
    std::vector<Price> prices;
};

struct Customer {
    std::string id;
    std::string email;
    std::string name;
    std::string payment_method;
    bool active;
    std::chrono::system_clock::time_point created_at;
};

struct Subscription {
    std::string id;
    std::string customer_id;
    std::string product_id;
    std::string price_id;
    std::string status;  // active, canceled, past_due
    std::chrono::system_clock::time_point current_period_start;
    std::chrono::system_clock::time_point current_period_end;
    std::optional<std::chrono::system_clock::time_point> canceled_at;
    bool auto_renew;
};

struct Invoice {
    std::string id;
    std::string customer_id;
    std::string subscription_id;
    double amount;
    std::string currency;
    std::string status;  // draft, open, paid, void
    std::chrono::system_clock::time_point created_at;
    std::optional<std::chrono::system_clock::time_point> paid_at;
};

class PaymentProcessor {
public:
    virtual ~PaymentProcessor() = default;
    virtual bool process_payment(const std::string& customer_id, 
                               double amount,
                               const std::string& currency) = 0;
    virtual bool refund_payment(const std::string& payment_id) = 0;
};

class BillingManager {
public:
    BillingManager(std::shared_ptr<PaymentProcessor> payment_processor);

    // Product management
    std::string create_product(const std::string& name,
                             const std::string& description,
                             const std::vector<Price>& prices);
    
    void update_product(const std::string& product_id,
                       const nlohmann::json& updates);

    // Customer management
    std::string create_customer(const std::string& email,
                              const std::string& name,
                              const std::string& payment_method);
    
    void update_customer(const std::string& customer_id,
                        const nlohmann::json& updates);

    // Subscription management
    std::string create_subscription(const std::string& customer_id,
                                  const std::string& product_id,
                                  const std::string& price_id);
    
    void cancel_subscription(const std::string& subscription_id,
                           bool immediate = false);

    // Billing operations
    void process_monthly_billing();
    void generate_invoice(const std::string& subscription_id);
    bool process_invoice(const std::string& invoice_id);

    // Queries
    std::vector<Invoice> get_customer_invoices(const std::string& customer_id);
    std::optional<Subscription> get_subscription(const std::string& subscription_id);
    std::vector<Product> get_available_products();

private:
    std::shared_ptr<PaymentProcessor> payment_processor_;
    
    // In-memory storage (replace with database in production)
    std::unordered_map<std::string, Product> products_;
    std::unordered_map<std::string, Customer> customers_;
    std::unordered_map<std::string, Subscription> subscriptions_;
    std::unordered_map<std::string, Invoice> invoices_;

    // Helper methods
    void validate_subscription(const Subscription& sub);
    std::string generate_id(const std::string& prefix);
    bool is_subscription_due(const Subscription& sub);
};

} // namespace billing
} // namespace biztools 