#include "biztools/recommender/service.hpp"
#include <spdlog/spdlog.h>

namespace biztools {
namespace recommender {

// gRPC service implementation
grpc::Status RecommenderGrpcService::GetRecommendations(
    grpc::ServerContext* context,
    const RecommendRequest* request,
    RecommendResponse* response
) {
    try {
        auto recommendations = recommender_->recommend(
            request->user_id(),
            request->context(),
            request->n_recommendations()
        );

        for (const auto& [item_id, score] : recommendations) {
            auto* rec = response->add_recommendations();
            rec->set_item_id(item_id);
            rec->set_score(score);
        }

        return grpc::Status::OK;
    } catch (const std::exception& e) {
        return grpc::Status(grpc::StatusCode::INTERNAL, e.what());
    }
}

grpc::Status RecommenderGrpcService::GetSimilarItems(
    grpc::ServerContext* context,
    const SimilarItemsRequest* request,
    SimilarItemsResponse* response
) {
    try {
        auto similar_items = recommender_->similar_items(
            request->item_id(),
            request->n_similar()
        );

        for (const auto& [item_id, score] : similar_items) {
            auto* item = response->add_items();
            item->set_item_id(item_id);
            item->set_score(score);
        }

        return grpc::Status::OK;
    } catch (const std::exception& e) {
        return grpc::Status(grpc::StatusCode::INTERNAL, e.what());
    }
}

// REST handler implementation
void RecommenderRestHandler::setup_routes() {
    // GET /recommendations?user_id=X&context=Y&n=Z
    server_.Get("/recommendations", [this](const auto& req, auto& res) {
        handle_recommendations(req, res);
    });

    // GET /similar_items?item_id=X&n=Z
    server_.Get("/similar_items", [this](const auto& req, auto& res) {
        handle_similar_items(req, res);
    });

    // Health check
    server_.Get("/health", [](const auto& req, auto& res) {
        res.set_content("{\"status\": \"ok\"}", "application/json");
    });
}

void RecommenderRestHandler::handle_recommendations(
    const httplib::Request& req,
    httplib::Response& res
) {
    try {
        auto user_id = req.get_param_value("user_id");
        auto context = req.get_param_value("context");
        auto n = std::stoi(req.get_param_value("n", "10"));

        auto recommendations = recommender_->recommend(user_id, context, n);

        nlohmann::json response = {
            {"recommendations", nlohmann::json::array()}
        };

        for (const auto& [item_id, score] : recommendations) {
            response["recommendations"].push_back({
                {"item_id", item_id},
                {"score", score}
            });
        }

        res.set_content(response.dump(), "application/json");
    } catch (const std::exception& e) {
        res.status = 500;
        res.set_content(
            nlohmann::json{{"error", e.what()}}.dump(),
            "application/json"
        );
    }
}

void RecommenderRestHandler::handle_similar_items(
    const httplib::Request& req,
    httplib::Response& res
) {
    try {
        auto item_id = req.get_param_value("item_id");
        auto n = std::stoi(req.get_param_value("n", "10"));

        auto similar_items = recommender_->similar_items(item_id, n);

        nlohmann::json response = {
            {"similar_items", nlohmann::json::array()}
        };

        for (const auto& [item_id, score] : similar_items) {
            response["similar_items"].push_back({
                {"item_id", item_id},
                {"score", score}
            });
        }

        res.set_content(response.dump(), "application/json");
    } catch (const std::exception& e) {
        res.status = 500;
        res.set_content(
            nlohmann::json{{"error", e.what()}}.dump(),
            "application/json"
        );
    }
}

// Main service implementation
RecommenderService::RecommenderService(
    const std::string& grpc_address,
    const std::string& rest_address,
    const std::string& model_path
)
    : BaseService(grpc_address, rest_address)
    , recommender_(std::make_shared<LlamaBloomRecommender>(model_path))
{
    grpc_service_ = RecommenderGrpcService(recommender_);
    rest_handler_ = RecommenderRestHandler(recommender_);
}

bool RecommenderService::is_healthy() const {
    return is_healthy_.load();
}

void RecommenderService::configure(const nlohmann::json& config) {
    // Apply configuration
    if (config.contains("cache_size")) {
        // Configure cache size
    }
    if (config.contains("bloom_filter_size")) {
        // Configure Bloom filter size
    }
}

nlohmann::json RecommenderService::get_metrics() const {
    return {
        {"total_recommendations", 0},  // Add actual metrics
        {"cache_hits", 0},
        {"average_latency_ms", 0.0}
    };
}

std::string RecommenderService::get_version() const {
    return "1.0.0";
}

void RecommenderService::start_grpc() {
    spdlog::info("Starting gRPC server...");
    grpc_server_->Start();
}

void RecommenderService::stop_grpc() {
    spdlog::info("Stopping gRPC server...");
    grpc_server_->Shutdown();
}

void RecommenderService::start_rest() {
    spdlog::info("Starting REST server...");
    rest_handler_.server().listen("0.0.0.0", 8080);
}

void RecommenderService::stop_rest() {
    spdlog::info("Stopping REST server...");
    rest_handler_.server().stop();
}

} // namespace recommender
} // namespace biztools 