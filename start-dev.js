#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';
import fetch from 'node-fetch';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logHeader = (message) => {
  log(`\n${'='.repeat(50)}`, 'blue');
  log(`${message}`, 'bright');
  log(`${'='.repeat(50)}`, 'blue');
};

const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logError = (message) => log(`❌ ${message}`, 'red');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ️  ${message}`, 'cyan');

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if .env file exists and has required variables
const checkEnvironment = () => {
  logHeader('CHECKING ENVIRONMENT');

  if (!existsSync('.env')) {
    logError('.env file not found');
    logInfo('Please create a .env file with your GEMINI_API_KEY');
    logInfo('Example: GEMINI_API_KEY=your_api_key_here');
    process.exit(1);
  }
  logSuccess('.env file exists');

  // Load environment variables
  const envConfig = config();
  if (envConfig.error) {
    logError('Failed to load .env file');
    logError(envConfig.error.message);
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    logError('GEMINI_API_KEY not found in .env file');
    logInfo('Please add GEMINI_API_KEY=your_api_key_here to your .env file');
    process.exit(1);
  }
  logSuccess('GEMINI_API_KEY configured');

  return true;
};

// Check if required dependencies are installed
const checkDependencies = () => {
  logHeader('CHECKING DEPENDENCIES');

  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      '@google/generative-ai',
      'express',
      'cors',
      'dotenv',
      'concurrently',
      'nodemon'
    ];

    for (const dep of requiredDeps) {
      if (!packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]) {
        logError(`Missing dependency: ${dep}`);
        logInfo('Run: npm install');
        process.exit(1);
      }
    }
    logSuccess('All dependencies are installed');
  } catch (error) {
    logError('Failed to check dependencies');
    logError(error.message);
    process.exit(1);
  }
};

// Check if ports are available
const checkPorts = async () => {
  logHeader('CHECKING PORTS');

  const checkPort = async (port) => {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        method: 'HEAD',
        timeout: 1000
      });
      return true; // Port is in use
    } catch {
      return false; // Port is available
    }
  };

  const frontendPort = 5173;
  const backendPort = 3001;

  const frontendInUse = await checkPort(frontendPort);
  const backendInUse = await checkPort(backendPort);

  if (frontendInUse) {
    logWarning(`Frontend port ${frontendPort} is already in use`);
    logInfo('The existing frontend server will be used');
  } else {
    logSuccess(`Frontend port ${frontendPort} is available`);
  }

  if (backendInUse) {
    logWarning(`Backend port ${backendPort} is already in use`);
    logInfo('Checking if it\'s our backend server...');

    try {
      const response = await fetch(`http://localhost:${backendPort}/api/health`);
      if (response.ok) {
        const health = await response.json();
        if (health.status === 'healthy') {
          logSuccess('Backend server is already running and healthy');
          return { frontendInUse, backendInUse: false }; // Don't start another backend
        }
      }
    } catch {
      logWarning('Port is in use but not by our backend server');
    }
  } else {
    logSuccess(`Backend port ${backendPort} is available`);
  }

  return { frontendInUse, backendInUse };
};

// Start the backend server
const startBackend = () => {
  return new Promise((resolve, reject) => {
    logInfo('Starting backend server...');

    const backend = spawn('node', ['server.js'], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'development' }
    });

    backend.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[BACKEND] ${message}`, 'magenta');
        if (message.includes('Server running on port')) {
          resolve(backend);
        }
      }
    });

    backend.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[BACKEND ERROR] ${message}`, 'red');
      }
    });

    backend.on('error', (error) => {
      logError(`Failed to start backend: ${error.message}`);
      reject(error);
    });

    backend.on('exit', (code) => {
      if (code !== 0) {
        logError(`Backend exited with code ${code}`);
        reject(new Error(`Backend process exited with code ${code}`));
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!backend.killed) {
        logError('Backend failed to start within 10 seconds');
        backend.kill();
        reject(new Error('Backend startup timeout'));
      }
    }, 10000);
  });
};

// Start the frontend server
const startFrontend = () => {
  return new Promise((resolve, reject) => {
    logInfo('Starting frontend server...');

    const frontend = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });

    frontend.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        log(`[FRONTEND] ${message}`, 'cyan');
        if (message.includes('Local:') || message.includes('ready in')) {
          resolve(frontend);
        }
      }
    });

    frontend.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message && !message.includes('Download the React DevTools')) {
        log(`[FRONTEND] ${message}`, 'yellow');
      }
    });

    frontend.on('error', (error) => {
      logError(`Failed to start frontend: ${error.message}`);
      reject(error);
    });

    frontend.on('exit', (code) => {
      if (code !== 0) {
        logError(`Frontend exited with code ${code}`);
        reject(new Error(`Frontend process exited with code ${code}`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!frontend.killed) {
        logError('Frontend failed to start within 30 seconds');
        frontend.kill();
        reject(new Error('Frontend startup timeout'));
      }
    }, 30000);
  });
};

// Wait for backend to be healthy
const waitForBackend = async (maxAttempts = 10) => {
  logInfo('Waiting for backend to be ready...');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3001/api/health', {
        timeout: 2000
      });

      if (response.ok) {
        const health = await response.json();
        if (health.status === 'healthy') {
          logSuccess('Backend is healthy and ready');
          return true;
        }
      }
    } catch {
      // Continue waiting
    }

    await sleep(1000);
  }

  logWarning('Backend health check timed out, but continuing...');
  return false;
};

// Main startup function
const main = async () => {
  try {
    logHeader('🚀 IDIOM WEAVER DEVELOPMENT STARTUP');

    // Pre-flight checks
    checkEnvironment();
    checkDependencies();

    const portStatus = await checkPorts();

    // Start servers based on port availability
    const processes = [];

    if (!portStatus.backendInUse) {
      const backend = await startBackend();
      processes.push(backend);
      await waitForBackend();
    }

    if (!portStatus.frontendInUse) {
      const frontend = await startFrontend();
      processes.push(frontend);
      await sleep(3000); // Give frontend time to start
    }

    logHeader('🎉 STARTUP COMPLETE');
    logSuccess('Frontend: http://localhost:5173');
    logSuccess('Backend API: http://localhost:3001/api/health');
    logInfo('Press Ctrl+C to stop all servers');

    // Handle graceful shutdown
    const cleanup = () => {
      log('\n🛑 Shutting down servers...', 'yellow');
      processes.forEach(process => {
        if (!process.killed) {
          process.kill('SIGTERM');
        }
      });

      setTimeout(() => {
        processes.forEach(process => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        });
        process.exit(0);
      }, 5000);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    // Keep the process alive
    if (processes.length > 0) {
      await Promise.all(
        processes.map(proc =>
          new Promise(resolve => proc.on('exit', resolve))
        )
      );
    } else {
      logInfo('All servers were already running. Use Ctrl+C to exit.');
      await new Promise(() => {}); // Keep alive indefinitely
    }

  } catch (error) {
    logError(`Startup failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the startup script
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
