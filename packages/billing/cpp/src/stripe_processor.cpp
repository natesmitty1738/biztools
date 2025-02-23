#include "biztools/billing/stripe_processor.hpp"
#include <cmath>
#include <spdlog/spdlog.h>

namespace biztools {
namespace billing {

StripeProcessor::StripeProcessor(const std::string& api_key)
    : api_key_(api_key)
    , stripe_client_(api_key)
{}

StripeProcessor::~StripeProcessor() = default;

bool StripeProcessor::process_payment(
    const std::string& customer_id,
    double amount,
    const std::string& currency
) {
    try {
        stripe::PaymentIntentCreateParams params;
        params.customer = customer_id;
        params.amount = convert_to_cents(amount);
        params.currency = currency;
        params.confirm = true;
        params.automatic_payment_methods = {{"enabled", true}};

        auto intent = stripe_client_.paymentIntents.create(params);
        
        return intent.status == "succeeded";
    } catch (const stripe::Error& e) {
        spdlog::error("Stripe payment failed: {}", handle_stripe_error(e));
        return false;
    }
}

bool StripeProcessor::refund_payment(const std::string& payment_id) {
    try {
        stripe::RefundCreateParams params;
        params.payment_intent = payment_id;

        auto refund = stripe_client_.refunds.create(params);
        
        return refund.status == "succeeded";
    } catch (const stripe::Error& e) {
        spdlog::error("Stripe refund failed: {}", handle_stripe_error(e));
        return false;
    }
}

std::string StripeProcessor::create_payment_method(const std::string& token) {
    try {
        stripe::PaymentMethodCreateParams params;
        params.type = "card";
        params.card = {{"token", token}};

        auto payment_method = stripe_client_.paymentMethods.create(params);
        
        return payment_method.id;
    } catch (const stripe::Error& e) {
        throw std::runtime_error(handle_stripe_error(e));
    }
}

std::string StripeProcessor::create_stripe_customer(
    const std::string& email,
    const std::string& payment_method
) {
    try {
        stripe::CustomerCreateParams params;
        params.email = email;
        params.payment_method = payment_method;
        params.invoice_settings = {
            {"default_payment_method", payment_method}
        };

        auto customer = stripe_client_.customers.create(params);
        
        return customer.id;
    } catch (const stripe::Error& e) {
        throw std::runtime_error(handle_stripe_error(e));
    }
}

void StripeProcessor::update_payment_method(
    const std::string& customer_id,
    const std::string& payment_method
) {
    try {
        stripe::CustomerUpdateParams params;
        params.invoice_settings = {
            {"default_payment_method", payment_method}
        };

        stripe_client_.customers.update(customer_id, params);
    } catch (const stripe::Error& e) {
        throw std::runtime_error(handle_stripe_error(e));
    }
}

int64_t StripeProcessor::convert_to_cents(double amount) const {
    return static_cast<int64_t>(std::round(amount * 100));
}

std::string StripeProcessor::handle_stripe_error(const stripe::Error& error) const {
    std::stringstream ss;
    ss << "Stripe error: " << error.type << " - " << error.message;
    if (!error.code.empty()) {
        ss << " (Code: " << error.code << ")";
    }
    return ss.str();
}

} // namespace billing
} // namespace biztools 