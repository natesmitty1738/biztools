#pragma once

#include <vector>
#include <string>
#include <unordered_map>
#include <memory>
#include <cmath>
#include <random>

namespace biztools {
namespace recommender {

class BloomFilter {
public:
    BloomFilter(size_t expected_items, double false_positive_rate = 0.01)
        : m_size(compute_optimal_size(expected_items, false_positive_rate))
        , m_num_hashes(compute_optimal_hashes(expected_items, m_size))
        , m_bits(m_size)
        , m_items_count(0) {}

    void add(const std::string& item);
    bool probably_contains(const std::string& item) const;
    double similarity(const BloomFilter& other) const;
    void clear();

private:
    size_t m_size;
    size_t m_num_hashes;
    std::vector<bool> m_bits;
    size_t m_items_count;

    static size_t compute_optimal_size(size_t n, double p) {
        return static_cast<size_t>(-n * log(p) / (log(2) * log(2)));
    }

    static size_t compute_optimal_hashes(size_t n, size_t m) {
        return static_cast<size_t>(m / n * log(2));
    }

    std::vector<size_t> get_hash_values(const std::string& item) const;
};

class BloomRecommender {
public:
    BloomRecommender(size_t expected_items_per_user = 1000,
                    double false_positive_rate = 0.01)
        : m_expected_items(expected_items_per_user)
        , m_fp_rate(false_positive_rate) {}

    // Training methods
    void add_interaction(const std::string& user_id,
                        const std::string& item_id,
                        double timestamp);
    
    void add_item_features(const std::string& item_id,
                          const std::vector<std::string>& features);

    // Recommendation methods
    std::vector<std::pair<std::string, double>> 
    recommend(const std::string& user_id,
             size_t n_recommendations = 10) const;

    std::vector<std::pair<std::string, double>>
    similar_items(const std::string& item_id,
                 size_t n_similar = 10) const;

    // Utility methods
    void clear();
    size_t num_users() const { return m_user_profiles.size(); }
    size_t num_items() const { return m_item_profiles.size(); }

private:
    // Configuration
    size_t m_expected_items;
    double m_fp_rate;

    // User and item profiles using Bloom filters
    std::unordered_map<std::string, std::unique_ptr<BloomFilter>> m_user_profiles;
    std::unordered_map<std::string, std::unique_ptr<BloomFilter>> m_item_profiles;
    
    // Recent interactions for temporal weighting
    struct Interaction {
        std::string user_id;
        std::string item_id;
        double timestamp;
    };
    std::vector<Interaction> m_recent_interactions;

    // Helper methods
    double compute_temporal_weight(double timestamp) const;
    std::vector<std::string> get_user_history(const std::string& user_id) const;
};

} // namespace recommender
} // namespace biztools 