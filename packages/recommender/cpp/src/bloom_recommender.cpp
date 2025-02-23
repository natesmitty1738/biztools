#include "biztools/recommender/bloom_recommender.hpp"
#include <xxhash.h>
#include <algorithm>
#include <chrono>

namespace biztools
{
  namespace recommender
  {

    // BloomFilter implementation
    std::vector<size_t> BloomFilter::get_hash_values(const std::string &item) const
    {
      std::vector<size_t> hashes(m_num_hashes);

      // Use xxHash for fast, high-quality hashing
      uint64_t h1 = XXH64(item.data(), item.size(), 0);
      uint64_t h2 = XXH64(item.data(), item.size(), h1);

      // Double hashing technique for multiple hash functions
      for (size_t i = 0; i < m_num_hashes; ++i)
      {
        hashes[i] = (h1 + i * h2) % m_size;
      }

      return hashes;
    }

    void BloomFilter::add(const std::string &item)
    {
      auto hashes = get_hash_values(item);
      for (auto h : hashes)
      {
        m_bits[h] = true;
      }
      m_items_count++;
    }

    bool BloomFilter::probably_contains(const std::string &item) const
    {
      auto hashes = get_hash_values(item);
      return std::all_of(hashes.begin(), hashes.end(),
                         [this](size_t h)
                         { return m_bits[h]; });
    }

    double BloomFilter::similarity(const BloomFilter &other) const
    {
      if (m_size != other.m_size)
      {
        throw std::runtime_error("Bloom filters must have the same size for comparison");
      }

      // Compute Jaccard similarity between bit vectors
      size_t intersection = 0;
      size_t union_count = 0;

      for (size_t i = 0; i < m_size; ++i)
      {
        if (m_bits[i] && other.m_bits[i])
          intersection++;
        if (m_bits[i] || other.m_bits[i])
          union_count++;
      }

      return union_count > 0 ? static_cast<double>(intersection) / union_count : 0.0;
    }

    void BloomFilter::clear()
    {
      std::fill(m_bits.begin(), m_bits.end(), false);
      m_items_count = 0;
    }

    // BloomRecommender implementation
    void BloomRecommender::add_interaction(const std::string &user_id,
                                           const std::string &item_id,
                                           double timestamp)
    {
      // Create user profile if it doesn't exist
      if (!m_user_profiles.contains(user_id))
      {
        m_user_profiles[user_id] = std::make_unique<BloomFilter>(m_expected_items, m_fp_rate);
      }

      // Add item to user's profile
      m_user_profiles[user_id]->add(item_id);

      // Store recent interaction
      m_recent_interactions.push_back({user_id, item_id, timestamp});

      // Keep only recent interactions (last 30 days)
      const double thirty_days = 30 * 24 * 60 * 60; // in seconds
      auto now = std::chrono::system_clock::now();
      auto now_ts = std::chrono::duration_cast<std::chrono::seconds>(
                        now.time_since_epoch())
                        .count();

      m_recent_interactions.erase(
          std::remove_if(m_recent_interactions.begin(), m_recent_interactions.end(),
                         [now_ts, thirty_days](const Interaction &i)
                         {
                           return (now_ts - i.timestamp) > thirty_days;
                         }),
          m_recent_interactions.end());
    }

    void BloomRecommender::add_item_features(const std::string &item_id,
                                             const std::vector<std::string> &features)
    {
      // Create item profile if it doesn't exist
      if (!m_item_profiles.contains(item_id))
      {
        m_item_profiles[item_id] = std::make_unique<BloomFilter>(features.size() * 2, m_fp_rate);
      }

      // Add features to item's profile
      for (const auto &feature : features)
      {
        m_item_profiles[item_id]->add(feature);
      }
    }

    std::vector<std::pair<std::string, double>>
    BloomRecommender::recommend(const std::string &user_id,
                                size_t n_recommendations) const
    {
      std::vector<std::pair<std::string, double>> recommendations;

      // Get user's profile
      auto user_it = m_user_profiles.find(user_id);
      if (user_it == m_user_profiles.end())
      {
        return recommendations;
      }

      // Get user's recent history
      auto history = get_user_history(user_id);

      // Compute similarity with all items
      for (const auto &[item_id, item_profile] : m_item_profiles)
      {
        // Skip items in user's history
        if (std::find(history.begin(), history.end(), item_id) != history.end())
        {
          continue;
        }

        // Compute similarity score
        double similarity = user_it->second->similarity(*item_profile);

        // Apply temporal weighting if available
        auto recent_interaction = std::find_if(
            m_recent_interactions.rbegin(),
            m_recent_interactions.rend(),
            [&item_id](const Interaction &i)
            { return i.item_id == item_id; });

        if (recent_interaction != m_recent_interactions.rend())
        {
          similarity *= compute_temporal_weight(recent_interaction->timestamp);
        }

        recommendations.emplace_back(item_id, similarity);
      }

      // Sort by similarity score
      std::partial_sort(
          recommendations.begin(),
          recommendations.begin() + std::min(n_recommendations, recommendations.size()),
          recommendations.end(),
          [](const auto &a, const auto &b)
          { return a.second > b.second; });

      // Return top N recommendations
      recommendations.resize(std::min(n_recommendations, recommendations.size()));
      return recommendations;
    }

    std::vector<std::pair<std::string, double>>
    BloomRecommender::similar_items(const std::string &item_id,
                                    size_t n_similar) const
    {
      std::vector<std::pair<std::string, double>> similar;

      // Get item's profile
      auto item_it = m_item_profiles.find(item_id);
      if (item_it == m_item_profiles.end())
      {
        return similar;
      }

      // Compute similarity with all other items
      for (const auto &[other_id, other_profile] : m_item_profiles)
      {
        if (other_id == item_id)
          continue;

        double similarity = item_it->second->similarity(*other_profile);
        similar.emplace_back(other_id, similarity);
      }

      // Sort by similarity score
      std::partial_sort(
          similar.begin(),
          similar.begin() + std::min(n_similar, similar.size()),
          similar.end(),
          [](const auto &a, const auto &b)
          { return a.second > b.second; });

      // Return top N similar items
      similar.resize(std::min(n_similar, similar.size()));
      return similar;
    }

    void BloomRecommender::clear()
    {
      m_user_profiles.clear();
      m_item_profiles.clear();
      m_recent_interactions.clear();
    }

    double BloomRecommender::compute_temporal_weight(double timestamp) const
    {
      auto now = std::chrono::system_clock::now();
      auto now_ts = std::chrono::duration_cast<std::chrono::seconds>(
                        now.time_since_epoch())
                        .count();

      // Exponential decay over 30 days
      const double thirty_days = 30 * 24 * 60 * 60; // in seconds
      double time_diff = now_ts - timestamp;
      return exp(-time_diff / thirty_days);
    }

    std::vector<std::string> BloomRecommender::get_user_history(
        const std::string &user_id) const
    {
      std::vector<std::string> history;

      for (const auto &interaction : m_recent_interactions)
      {
        if (interaction.user_id == user_id)
        {
          history.push_back(interaction.item_id);
        }
      }

      return history;
    }

  } // namespace recommender
} // namespace biztools