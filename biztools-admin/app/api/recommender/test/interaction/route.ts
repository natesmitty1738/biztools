import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, itemId, interactionType } = data;
    
    if (!userId || !itemId || !interactionType) {
      return NextResponse.json(
        { error: 'User ID, Item ID, and interaction type are required' }, 
        { status: 400 }
      );
    }
    
    // Call the Python script to record interaction
    const projectRoot = path.resolve(process.cwd(), '../');
    const scriptPath = path.join(projectRoot, 'scripts', 'run_local_recommender.py');
    
    console.log(`Recording ${interactionType} interaction for user ${userId} with item ${itemId}`);
    
    const result = spawnSync('python', [
      scriptPath, 
      '--interaction',
      '--user', userId,
      '--item', itemId,
      '--type', interactionType
    ], {
      cwd: projectRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        PYTHONPATH: `${projectRoot}:${process.env.PYTHONPATH || ''}`,
      },
    });
    
    if (result.error) {
      console.error('Error running recommender script:', result.error);
      return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
    }
    
    if (result.status !== 0) {
      console.error('Script error:', result.stderr);
      return NextResponse.json({ error: 'Script execution failed' }, { status: 500 });
    }
    
    // For testing purposes, return a success message regardless of the script result
    return NextResponse.json({ 
      success: true, 
      message: `Recorded ${interactionType} interaction for user ${userId} with item ${itemId}` 
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 