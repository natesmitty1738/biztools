cmake_minimum_required(VERSION 3.15)
project(biztools_recommender_cpp VERSION 0.1.0)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Find dependencies
find_package(pybind11 REQUIRED)  # For Python bindings
find_package(xxHash REQUIRED)    # For fast hashing in Bloom filters

# LLaMA dependency - you'll need to provide the path to LLaMA library
set(LLAMA_ROOT "" CACHE PATH "Path to LLaMA library")
if(NOT LLAMA_ROOT)
    message(FATAL_ERROR "Please specify LLAMA_ROOT")
endif()

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${LLAMA_ROOT}/include
)

# Core library
add_library(biztools_recommender SHARED
    src/bloom_recommender.cpp
    src/llama_bloom_recommender.cpp
)

target_link_libraries(biztools_recommender
    PRIVATE
    xxHash::xxHash
    ${LLAMA_ROOT}/lib/libllama.so
)

# Python bindings
pybind11_add_module(biztools_recommender_cpp
    src/python_bindings.cpp
)

target_link_libraries(biztools_recommender_cpp
    PRIVATE
    biztools_recommender
)

# Installation
install(TARGETS biztools_recommender biztools_recommender_cpp
    LIBRARY DESTINATION lib
    RUNTIME DESTINATION bin
)

install(DIRECTORY include/
    DESTINATION include
    FILES_MATCHING PATTERN "*.hpp"
) 