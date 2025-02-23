#pragma once

#include <memory>
#include <string>
#include <grpcpp/server.h>
#include "nlohmann/json.hpp"

namespace biztools {
namespace core {

class ServiceInterface {
public:
    virtual ~ServiceInterface() = default;

    // Service lifecycle
    virtual void start() = 0;
    virtual void stop() = 0;
    virtual bool is_healthy() const = 0;

    // Configuration
    virtual void configure(const nlohmann::json& config) = 0;
    
    // Metrics and monitoring
    virtual nlohmann::json get_metrics() const = 0;
    virtual std::string get_version() const = 0;

protected:
    // Helper methods for derived services
    virtual void init_grpc_server(const std::string& address);
    virtual void init_rest_server(const std::string& address);

    std::unique_ptr<grpc::Server> grpc_server_;
    // REST server instance (e.g., cpp-httplib or similar)
    void* rest_server_;
};

// Base class for all service implementations
template<typename GrpcService, typename RestHandler>
class BaseService : public ServiceInterface {
public:
    BaseService(const std::string& grpc_address, 
                const std::string& rest_address) {
        init_grpc_server(grpc_address);
        init_rest_server(rest_address);
    }

    void start() override {
        start_grpc();
        start_rest();
    }

    void stop() override {
        stop_grpc();
        stop_rest();
    }

protected:
    virtual void start_grpc() = 0;
    virtual void stop_grpc() = 0;
    virtual void start_rest() = 0;
    virtual void stop_rest() = 0;

    GrpcService grpc_service_;
    RestHandler rest_handler_;
};

} // namespace core
} // namespace biztools 