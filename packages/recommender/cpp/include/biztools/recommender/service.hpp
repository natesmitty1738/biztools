#pragma once

#include <biztools/core/service.hpp>
#include "llama_bloom_recommender.hpp"
#include "recommender.grpc.pb.h"
#include <httplib.h>

namespace biztools {
namespace recommender {

// gRPC service implementation
class RecommenderGrpcService final : public Recommender::Service {
public:
    explicit RecommenderGrpcService(std::shared_ptr<LlamaBloomRecommender> recommender)
        : recommender_(std::move(recommender)) {}

    grpc::Status GetRecommendations(
        grpc::ServerContext* context,
        const RecommendRequest* request,
        RecommendResponse* response) override;

    grpc::Status GetSimilarItems(
        grpc::ServerContext* context,
        const SimilarItemsRequest* request,
        SimilarItemsResponse* response) override;

private:
    std::shared_ptr<LlamaBloomRecommender> recommender_;
};

// REST handler implementation
class RecommenderRestHandler {
public:
    explicit RecommenderRestHandler(std::shared_ptr<LlamaBloomRecommender> recommender)
        : recommender_(std::move(recommender)) {
        setup_routes();
    }

    void setup_routes();
    httplib::Server& server() { return server_; }

private:
    std::shared_ptr<LlamaBloomRecommender> recommender_;
    httplib::Server server_;

    // REST endpoints
    void handle_recommendations(const httplib::Request& req, httplib::Response& res);
    void handle_similar_items(const httplib::Request& req, httplib::Response& res);
};

// Main service class combining both interfaces
class RecommenderService 
    : public core::BaseService<RecommenderGrpcService, RecommenderRestHandler> {
public:
    RecommenderService(
        const std::string& grpc_address,
        const std::string& rest_address,
        const std::string& model_path
    );

    // ServiceInterface implementation
    bool is_healthy() const override;
    void configure(const nlohmann::json& config) override;
    nlohmann::json get_metrics() const override;
    std::string get_version() const override;

protected:
    void start_grpc() override;
    void stop_grpc() override;
    void start_rest() override;
    void stop_rest() override;

private:
    std::shared_ptr<LlamaBloomRecommender> recommender_;
    std::atomic<bool> is_healthy_{false};
};

} // namespace recommender
} // namespace biztools 