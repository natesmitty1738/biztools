import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import path from 'path';

export async function POST() {
  try {
    // Call the Python script to build the search index
    const projectRoot = path.resolve(process.cwd(), '../');
    const scriptPath = path.join(projectRoot, 'scripts', 'fast_search.py');
    
    console.log('Building search index...');
    
    const result = spawnSync('python', [
      scriptPath, 
      '--build-index'
    ], {
      cwd: projectRoot,
      encoding: 'utf-8',
      env: {
        ...process.env,
        PYTHONPATH: `${projectRoot}:${process.env.PYTHONPATH || ''}`,
      },
    });
    
    if (result.error) {
      console.error('Error running script:', result.error);
      return NextResponse.json({ error: 'Failed to build search index' }, { status: 500 });
    }
    
    if (result.status !== 0) {
      console.error('Script error:', result.stderr);
      return NextResponse.json({ error: 'Script execution failed' }, { status: 500 });
    }
    
    let response;
    try {
      response = JSON.parse(result.stdout);
    } catch (error) {
      console.error('Error parsing script output:', error);
      return NextResponse.json({ success: true, message: 'Search index built successfully (raw output)' });
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error building search index:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 