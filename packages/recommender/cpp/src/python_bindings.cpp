#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "biztools/recommender/llama_bloom_recommender.hpp"

namespace py = pybind11;
using namespace biztools::recommender;

PYBIND11_MODULE(biztools_recommender_cpp, m) {
    m.doc() = "LLaMA-powered recommender system with Bloom filter optimization";

    py::class_<LlamaBloomRecommender>(m, "LlamaBloomRecommender")
        .def(py::init<const std::string&, size_t, double>(),
             py::arg("llama_model_path"),
             py::arg("cache_size") = 10000,
             py::arg("false_positive_rate") = 0.01)
        
        .def("recommend",
             &LlamaBloomRecommender::recommend,
             py::arg("user_id"),
             py::arg("context"),
             py::arg("n_recommendations") = 10,
             "Generate recommendations for a user based on context")
        
        .def("similar_items",
             &LlamaBloomRecommender::similar_items,
             py::arg("item_id"),
             py::arg("n_similar") = 10,
             "Find similar items")
        
        .def("add_item",
             &LlamaBloomRecommender::add_item,
             py::arg("item_id"),
             py::arg("title"),
             py::arg("description"),
             py::arg("categories"),
             py::arg("features"),
             "Add or update an item in the catalog")
        
        .def("add_user_interaction",
             &LlamaBloomRecommender::add_user_interaction,
             py::arg("user_id"),
             py::arg("item_id"),
             py::arg("interaction_type"),
             py::arg("timestamp"),
             "Record a user interaction with an item");
} 