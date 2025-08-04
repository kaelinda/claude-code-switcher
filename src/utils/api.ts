import chalk from 'chalk';
import axios from 'axios';
import { ProviderConfig } from './config';
import { getCurrentEnv } from './env';

export interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  error?: string;
}

export async function testProviderConnection(config: ProviderConfig): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ccx/1.0.0',
      ...config.headers
    };

    // Add provider-specific headers
    if (config.base_url.includes('anthropic.com')) {
      headers['x-api-key'] = config.api_key;
      headers['anthropic-version'] = '2023-06-01';
    } else if (config.base_url.includes('openai.com')) {
      headers['Authorization'] = `Bearer ${config.api_key}`;
    } else if (config.base_url.includes('bigmodel.cn')) {
      // 智谱清言特殊处理
      headers['Authorization'] = `Bearer ${config.api_key}`;
    } else if (config.base_url.includes('moonshot.cn')) {
      // 月之暗面Kimi特殊处理
      headers['Authorization'] = `Bearer ${config.api_key}`;
    } else if (config.base_url.includes('dashscope-intl.aliyuncs.com')) {
      // 阿里云Qwen特殊处理
      headers['Authorization'] = `Bearer ${config.api_key}`;
    } else {
      // Generic API key header
      headers['Authorization'] = `Bearer ${config.api_key}`;
    }

    // Test API endpoint
    const testEndpoint = getTestEndpoint(config.base_url);
    
    const response = await axios.post(testEndpoint, {
      model: config.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    }, {
      headers,
      timeout: 10000 // 10 seconds timeout
    });

    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      message: chalk.green('✓ Connection successful'),
      responseTime
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    
    if (error.response) {
      // API responded with error status
      return {
        success: false,
        message: chalk.red(`✗ API Error (${error.response.status})`),
        error: error.response.data?.error?.message || error.response.statusText,
        responseTime
      };
    } else if (error.request) {
      // No response received
      return {
        success: false,
        message: chalk.red('✗ Connection failed'),
        error: 'No response from server',
        responseTime
      };
    } else {
      // Request setup error
      return {
        success: false,
        message: chalk.red('✗ Request failed'),
        error: error.message,
        responseTime
      };
    }
  }
}

function getTestEndpoint(baseUrl: string): string {
  // Remove trailing slash and add appropriate endpoint
  const cleanUrl = baseUrl.replace(/\/$/, '');
  
  if (cleanUrl.includes('anthropic.com')) {
    return `${cleanUrl}/v1/messages`;
  } else if (cleanUrl.includes('openai.com')) {
    return `${cleanUrl}/v1/chat/completions`;
  } else if (cleanUrl.includes('bigmodel.cn')) {
    // 智谱清言使用Anthropic兼容接口
    return `${cleanUrl}/api/anthropic/v1/messages`;
  } else if (cleanUrl.includes('moonshot.cn')) {
    // 月之暗面Kimi使用Anthropic兼容接口
    return `${cleanUrl}/anthropic/v1/messages`;
  } else if (cleanUrl.includes('dashscope-intl.aliyuncs.com')) {
    // 阿里云Qwen使用代理接口
    return `${cleanUrl}/v1/messages`;
  } else if (cleanUrl.includes('anyrouter.top') || cleanUrl.includes('wenwen-ai.com')) {
    // 其他代理服务通常使用Anthropic兼容接口
    return `${cleanUrl}/v1/messages`;
  } else {
    // Generic endpoint - try Anthropic-compatible pattern first
    return `${cleanUrl}/v1/messages`;
  }
}

// Test current environment variables configuration
export async function testCurrentEnvConnection(): Promise<TestResult> {
  const env = getCurrentEnv();
  
  if (!env.ANTHROPIC_AUTH_TOKEN || !env.ANTHROPIC_BASE_URL) {
    return {
      success: false,
      message: chalk.red('✗ Environment variables not set'),
      error: 'ANTHROPIC_AUTH_TOKEN and ANTHROPIC_BASE_URL must be set'
    };
  }
  
  const config: ProviderConfig = {
    name: 'Current Environment',
    api_key: env.ANTHROPIC_AUTH_TOKEN,
    base_url: env.ANTHROPIC_BASE_URL,
    model: env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
  };
  
  return testProviderConnection(config);
}

export function formatTestResult(result: TestResult, providerName: string): void {
  console.log(chalk.cyan(`\nTesting ${providerName}:`));
  console.log(`  ${result.message}`);
  
  if (result.responseTime) {
    console.log(`  ${chalk.blue(`Response time: ${result.responseTime}ms`)}`);
  }
  
  if (result.error) {
    console.log(`  ${chalk.yellow(`Error: ${result.error}`)}`);
  }
  
  console.log(); // Add blank line
}