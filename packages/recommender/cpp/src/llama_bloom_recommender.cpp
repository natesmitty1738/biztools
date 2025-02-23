#include "biztools/recommender/llama_bloom_recommender.hpp"
#include <llama.h> // LLaMA C++ API
#include <algorithm>
#include <sstream>

namespace biztools
{
  namespace recommender
  {

    // LlamaModel implementation
    LlamaBloomRecommender::LlamaModel::LlamaModel(const std::string &model_path)
    {
      // Initialize LLaMA model
      llama_context_params params = llama_context_default_params();
      params.n_ctx = 2048;  // Context window size
      params.n_threads = 4; // Number of threads

      m_model = llama_init_from_file(model_path.c_str(), params);
      if (!m_model)
      {
        throw std::runtime_error("Failed to initialize LLaMA model");
      }
    }

    std::string LlamaBloomRecommender::LlamaModel::generate_prompt(
        const std::string &user_context,
        const std::vector<std::string> &items)
    {
      std::stringstream ss;
      ss << "Based on the following user context:\n"
         << user_context << "\n\n"
         << "Please recommend items from this list:\n";

      for (const auto &item : items)
      {
        ss << "- " << item << "\n";
      }

      ss << "\nProvide recommendations in order of relevance, with scores between 0 and 1.";
      return ss.str();
    }

    std::vector<std::pair<std::string, double>>
    LlamaBloomRecommender::LlamaModel::generate_recommendations(
        const std::string &user_context,
        const std::vector<std::string> &candidate_items,
        size_t n_recommendations)
    {
      std::vector<std::pair<std::string, double>> recommendations;

      // Generate prompt
      std::string prompt = generate_prompt(user_context, candidate_items);

      // Generate completion using LLaMA
      llama_tokens tokens = llama_tokenize(m_model, prompt.c_str(), prompt.length(), true);

      // Process LLaMA output and extract recommendations with scores
      // This is a simplified version - you'd need to implement proper parsing
      // of LLaMA's output to extract items and their scores

      // Sort by score and return top N
      std::partial_sort(
          recommendations.begin(),
          recommendations.begin() + std::min(n_recommendations, recommendations.size()),
          recommendations.end(),
          [](const auto &a, const auto &b)
          { return a.second > b.second; });

      recommendations.resize(std::min(n_recommendations, recommendations.size()));
      return recommendations;
    }

    // LlamaBloomRecommender implementation
    LlamaBloomRecommender::LlamaBloomRecommender(
        const std::string &llama_model_path,
        size_t cache_size,
        double false_positive_rate)
        : m_cache_size(cache_size), m_fp_rate(false_positive_rate), m_llama(std::make_unique<LlamaModel>(llama_model_path))
    {
    }

    std::vector<std::pair<std::string, double>>
    LlamaBloomRecommender::recommend(
        const std::string &user_id,
        const std::string &context,
        size_t n_recommendations)
    {
      // Check cache first
      auto cache_it = m_user_cache.find(user_id);
      if (cache_it != m_user_cache.end() && is_cache_valid(cache_it->second))
      {
        return cache_it->second.recommendations;
      }

      // Get candidate items using Bloom filters
      auto candidates = get_candidate_items(user_id, context);

      // Generate recommendations using LLaMA
      auto recommendations = m_llama->generate_recommendations(
          context, candidates, n_recommendations);

      // Update cache
      update_cache(user_id, recommendations);

      return recommendations;
    }

    void LlamaBloomRecommender::add_item(
        const std::string &item_id,
        const std::string &title,
        const std::string &description,
        const std::vector<std::string> &categories,
        const std::vector<std::string> &features)
    {
      // Create or update item info
      auto &item = m_items[item_id];
      item.title = title;
      item.description = description;
      item.categories = categories;
      item.features = features;

      // Update Bloom filter with features
      item.feature_filter.clear();
      for (const auto &feature : features)
      {
        item.feature_filter.add(feature);
      }
      for (const auto &category : categories)
      {
        item.feature_filter.add(category);
      }

      // Invalidate relevant caches
      cleanup_cache();
    }

    void LlamaBloomRecommender::add_user_interaction(
        const std::string &user_id,
        const std::string &item_id,
        const std::string &interaction_type,
        double timestamp)
    {
      // Update user's cache entry
      auto &cache_entry = m_user_cache[user_id];
      cache_entry.filter.add(item_id);
      cache_entry.timestamp = timestamp;

      // Clear cached recommendations as they're now outdated
      cache_entry.recommendations.clear();
    }

    bool LlamaBloomRecommender::is_cache_valid(const CacheEntry &entry) const
    {
      if (entry.recommendations.empty())
      {
        return false;
      }

      // Cache expires after 24 hours
      auto now = std::chrono::system_clock::now();
      auto now_ts = std::chrono::duration_cast<std::chrono::seconds>(
                        now.time_since_epoch())
                        .count();

      const double cache_ttl = 24 * 60 * 60; // 24 hours in seconds
      return (now_ts - entry.timestamp) < cache_ttl;
    }

    void LlamaBloomRecommender::update_cache(
        const std::string &key,
        const std::vector<std::pair<std::string, double>> &recommendations)
    {
      auto &entry = m_user_cache[key];
      entry.recommendations = recommendations;
      entry.timestamp = std::chrono::duration_cast<std::chrono::seconds>(
                            std::chrono::system_clock::now().time_since_epoch())
                            .count();

      cleanup_cache();
    }

    std::vector<std::string> LlamaBloomRecommender::get_candidate_items(
        const std::string &user_id,
        const std::string &context) const
    {
      std::vector<std::string> candidates;

      // Use Bloom filters to quickly filter potential candidates
      auto user_it = m_user_cache.find(user_id);

      for (const auto &[item_id, item_info] : m_items)
      {
        // Skip if user has already interacted with the item
        if (user_it != m_user_cache.end() &&
            user_it->second.filter.probably_contains(item_id))
        {
          continue;
        }

        // Use feature Bloom filter to check relevance
        bool potentially_relevant = false;
        for (const auto &feature : item_info.features)
        {
          if (context.find(feature) != std::string::npos)
          {
            potentially_relevant = true;
            break;
          }
        }

        if (potentially_relevant)
        {
          candidates.push_back(item_id);
        }
      }

      return candidates;
    }

    void LlamaBloomRecommender::cleanup_cache()
    {
      // Remove old entries if cache is too large
      while (m_user_cache.size() > m_cache_size)
      {
        // Find oldest entry
        auto oldest = std::min_element(
            m_user_cache.begin(),
            m_user_cache.end(),
            [](const auto &a, const auto &b)
            {
              return a.second.timestamp < b.second.timestamp;
            });

        m_user_cache.erase(oldest);
      }
    }

  } // namespace recommender
} // namespace biztools