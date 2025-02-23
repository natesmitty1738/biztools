#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include <memory>
#include <cmath>
#include <chrono>
#include "bloom_recommender.hpp"

namespace biztools {
namespace recommender {

class LlamaBloomRecommender {
public:
    LlamaBloomRecommender(
        const std::string& llama_model_path,
        size_t cache_size = 10000,
        double false_positive_rate = 0.01
    );

    // Core recommendation methods
    std::vector<std::pair<std::string, double>>
    recommend(const std::string& user_id,
             const std::string& context,
             size_t n_recommendations = 10);

    std::vector<std::pair<std::string, double>>
    similar_items(const std::string& item_id,
                 size_t n_similar = 10);

    // Training and update methods
    void add_item(
        const std::string& item_id,
        const std::string& title,
        const std::string& description,
        const std::vector<std::string>& categories,
        const std::vector<std::string>& features
    );

    void add_user_interaction(
        const std::string& user_id,
        const std::string& item_id,
        const std::string& interaction_type,
        double timestamp
    );

private:
    // Bloom filter cache for fast lookups
    struct CacheEntry {
        BloomFilter filter;
        double timestamp;
        std::vector<std::pair<std::string, double>> recommendations;

        CacheEntry(size_t expected_items, double fp_rate)
            : filter(expected_items, fp_rate), timestamp(0) {}
    };

    // LLaMA model wrapper
    class LlamaModel {
    public:
        LlamaModel(const std::string& model_path);
        
        std::vector<std::pair<std::string, double>>
        generate_recommendations(
            const std::string& user_context,
            const std::vector<std::string>& candidate_items,
            size_t n_recommendations
        );

    private:
        // LLaMA model implementation details
        void* m_model;  // Replace with actual LLaMA model type
        std::string generate_prompt(
            const std::string& user_context,
            const std::vector<std::string>& items
        );
    };

    // Cache management
    std::unordered_map<std::string, CacheEntry> m_user_cache;
    std::unordered_map<std::string, CacheEntry> m_item_cache;
    
    // Item catalog
    struct ItemInfo {
        std::string title;
        std::string description;
        std::vector<std::string> categories;
        std::vector<std::string> features;
        BloomFilter feature_filter;

        ItemInfo(size_t expected_features, double fp_rate)
            : feature_filter(expected_features, fp_rate) {}
    };
    std::unordered_map<std::string, ItemInfo> m_items;

    // Configuration
    const size_t m_cache_size;
    const double m_fp_rate;
    std::unique_ptr<LlamaModel> m_llama;

    // Helper methods
    bool is_cache_valid(const CacheEntry& entry) const;
    void update_cache(const std::string& key,
                     const std::vector<std::pair<std::string, double>>& recommendations);
    std::vector<std::string> get_candidate_items(const std::string& user_id,
                                               const std::string& context) const;
    void cleanup_cache();
};

} // namespace recommender
} // namespace biztools 