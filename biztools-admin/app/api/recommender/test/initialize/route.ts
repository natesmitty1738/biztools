import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import path from 'path';

let recommenderInitialized = false;

export async function POST() {
  try {
    if (!recommenderInitialized) {
      // Initialize the recommender by running the Python script
      const projectRoot = path.resolve(process.cwd(), '../');
      const scriptPath = path.join(projectRoot, 'scripts', 'run_local_recommender.py');
      
      console.log(`Starting local recommender from ${scriptPath}`);
      
      const result = spawnSync('python', [scriptPath, '--initialize-only'], {
        cwd: projectRoot,
        encoding: 'utf-8',
        env: {
          ...process.env,
          PYTHONPATH: `${projectRoot}:${process.env.PYTHONPATH || ''}`,
        },
      });
      
      if (result.error) {
        console.error('Error running recommender script:', result.error);
        return NextResponse.json({ error: 'Failed to initialize recommender' }, { status: 500 });
      }
      
      if (result.status !== 0) {
        console.error('Script error:', result.stderr);
        return NextResponse.json({ error: 'Script execution failed' }, { status: 500 });
      }
      
      recommenderInitialized = true;
    }

    // Return sample data for the front-end regardless of script result
    return NextResponse.json({
      users: [
        { id: 'user1', name: 'Alice', preferences: ['electronics', 'gadgets'] },
        { id: 'user2', name: 'Bob', preferences: ['books', 'learning'] },
        { id: 'user3', name: 'Charlie', preferences: ['mixed', 'various'] }
      ],
      items: [
        { 
          id: 'item1', 
          title: 'Smartphone XS10',
          description: 'Latest smartphone with advanced camera and fast processor',
          categories: ['electronics', 'phones'],
          features: ['camera', '5G', 'waterproof']
        },
        { 
          id: 'item2', 
          title: 'Laptop Pro 15',
          description: 'Professional laptop with high performance',
          categories: ['electronics', 'computers'],
          features: ['16GB RAM', '1TB SSD', 'Intel i7']
        },
        { 
          id: 'item3', 
          title: 'Wireless Headphones',
          description: 'Noise cancelling wireless headphones with long battery life',
          categories: ['electronics', 'audio'],
          features: ['bluetooth', 'noise-cancelling', '40h battery']
        },
        { 
          id: 'item4', 
          title: 'Python Programming',
          description: 'Complete guide to Python programming language',
          categories: ['books', 'programming'],
          features: ['beginner-friendly', 'exercises', 'Python 3.9']
        },
        { 
          id: 'item5', 
          title: 'Machine Learning Basics',
          description: 'Introduction to machine learning concepts and applications',
          categories: ['books', 'technology', 'data science'],
          features: ['algorithms', 'practical examples', 'mathematics']
        },
        { 
          id: 'item6', 
          title: 'Winter Jacket',
          description: 'Warm winter jacket with water-resistant outer layer',
          categories: ['clothing', 'outerwear'],
          features: ['warm', 'water-resistant', 'hood']
        }
      ]
    });
  } catch (error) {
    console.error('Error initializing recommender:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 