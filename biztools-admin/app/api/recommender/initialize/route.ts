import { NextResponse } from 'next/server';
import { RecommenderConfig } from '@/lib/recommender/types';
import { spawn } from 'child_process';
import path from 'path';

let recommenderProcess: any = null;

export async function POST(req: Request) {
  try {
    const config: RecommenderConfig = await req.json();

    // Kill existing process if any
    if (recommenderProcess) {
      recommenderProcess.kill();
    }

    // Start Python/C++ recommender process
    const scriptPath = path.join(process.cwd(), 'scripts', 'start_recommender.py');
    recommenderProcess = spawn('python', [
      scriptPath,
      '--llama-model', config.llamaModelPath,
      '--cache-size', String(config.cacheSize || 10000),
      '--fp-rate', String(config.falsePositiveRate || 0.01)
    ]);

    recommenderProcess.stdout.on('data', (data: Buffer) => {
      console.log('Recommender output:', data.toString());
    });

    recommenderProcess.stderr.on('data', (data: Buffer) => {
      console.error('Recommender error:', data.toString());
    });

    // Wait for initialization
    await new Promise((resolve) => {
      recommenderProcess.stdout.on('data', (data: Buffer) => {
        if (data.toString().includes('Recommender initialized')) {
          resolve(true);
        }
      });
    });

    return NextResponse.json({ status: 'initialized' });
  } catch (error) {
    console.error('Failed to initialize recommender:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initialize recommender' },
      { status: 500 }
    );
  }
} 