#pragma once

#include "billing_manager.hpp"
#include <string>
#include <memory>
#include <stripe.h>

namespace biztools {
namespace billing {

class StripeProcessor : public PaymentProcessor {
public:
    explicit StripeProcessor(const std::string& api_key);
    ~StripeProcessor() override;

    bool process_payment(const std::string& customer_id,
                        double amount,
                        const std::string& currency) override;
    
    bool refund_payment(const std::string& payment_id) override;

    // Stripe-specific methods
    std::string create_payment_method(const std::string& token);
    std::string create_stripe_customer(const std::string& email,
                                     const std::string& payment_method);
    void update_payment_method(const std::string& customer_id,
                             const std::string& payment_method);

private:
    std::string api_key_;
    stripe::Client stripe_client_;

    // Helper methods
    int64_t convert_to_cents(double amount) const;
    std::string handle_stripe_error(const stripe::Error& error) const;
};

} // namespace billing
} // namespace biztools 