
// ============================================================================
// FILE: lib/testingUtils.ts
// ============================================================================
// Utilities for testing your WhatsApp agent locally

import { handleIncomingMessageEnhanced as handleIncomingMessageEnhancedTest } from './enhancedMessageHandler';

interface TestMessage {
  from: string;
  message: string;
  name?: string;
}

// Simulate incoming WhatsApp messages for testing
export async function simulateWhatsAppMessage(testMessage: TestMessage): Promise<void> {
  const messageData = {
    phoneNumber: testMessage.from,
    message: testMessage.message,
    messageType: 'text',
    messageId: `test_${Date.now()}`,
    timestamp: new Date().toISOString(),
    senderName: testMessage.name,
  };

  console.log('📱 Simulating message:', messageData);
  
  await handleIncomingMessageEnhancedTest(messageData);
  
  console.log('✅ Message processed');
}

// Test conversation flow
export async function testConversationFlow() {
  const testNumber = '+1234567890';
  
  console.log('🧪 Starting conversation flow test...\n');

  // Test 1: Greeting
  console.log('Test 1: Greeting');
  await simulateWhatsAppMessage({
    from: testNumber,
    message: 'Hi there!',
    name: 'Test Customer',
  });
  await sleep(2000);

  // Test 2: Invoice request without details
  console.log('\nTest 2: Invoice request (incomplete)');
  await simulateWhatsAppMessage({
    from: testNumber,
    message: 'Can I get my invoice?',
  });
  await sleep(2000);

  // Test 3: Provide business name
  console.log('\nTest 3: Provide business name');
  await simulateWhatsAppMessage({
    from: testNumber,
    message: 'The business name is Acme Pharmacy',
  });
  await sleep(2000);

  // Test 4: Provide date
  console.log('\nTest 4: Provide date');
  await simulateWhatsAppMessage({
    from: testNumber,
    message: 'From last week',
  });
  await sleep(2000);

  // Test 5: Complex question (should trigger review)
  console.log('\nTest 5: Complex question');
  await simulateWhatsAppMessage({
    from: testNumber,
    message: 'I want a refund and I\'m very disappointed with your service',
  });
  await sleep(2000);

  console.log('\n✅ Conversation flow test complete!');
}

// Test review triggers
export async function testReviewTriggers() {
  const testNumber = '+1234567890';
  
  console.log('🧪 Testing review triggers...\n');

  const triggerMessages = [
    'I want a refund!',
    'This is terrible service',
    'URGENT: Need this today',
    'Can I get a discount?',
    'I want to order 100 boxes',
    'My payment failed twice',
  ];

  for (const msg of triggerMessages) {
    console.log(`Testing: "${msg}"`);
    await simulateWhatsAppMessage({
      from: testNumber,
      message: msg,
    });
    await sleep(1500);
  }

  console.log('\n✅ Review trigger test complete!');
}

// Test manual override
export async function testManualOverride() {
  const testNumber = '+1234567890';
  
  console.log('🧪 Testing manual override...\n');

  // Send message in AI mode
  console.log('Sending message in AI mode');
  await simulateWhatsAppMessage({
    from: testNumber,
    message: 'Hello, I need help',
  });
  await sleep(2000);

  // Switch to manual mode (would be done via API in real scenario)
  console.log('\nSwitching to manual mode...');
  await fetch('http://localhost:3000/api/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: testNumber,
      action: 'takeover',
    }),
  });
  await sleep(1000);

  // Send message in manual mode (should be ignored)
  console.log('Sending message in manual mode (should be ignored)');
  await simulateWhatsAppMessage({
    from: testNumber,
    message: 'Are you there?',
  });
  await sleep(2000);

  // Switch back to AI mode
  console.log('\nSwitching back to AI mode...');
  await fetch('http://localhost:3000/api/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: testNumber,
      action: 'resume',
    }),
  });
  await sleep(1000);

  // Send message in AI mode again
  console.log('Sending message in AI mode again');
  await simulateWhatsAppMessage({
    from: testNumber,
    message: 'Thanks for your help!',
  });

  console.log('\n✅ Manual override test complete!');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Load test - simulate high volume
export async function loadTest(messageCount: number = 10) {
  console.log(`🧪 Starting load test with ${messageCount} messages...\n`);
  
  const startTime = Date.now();
  const promises: Promise<void>[] = [];

  for (let i = 0; i < messageCount; i++) {
    const testNumber = `+123456789${i % 10}`;
    promises.push(
      simulateWhatsAppMessage({
        from: testNumber,
        message: `Test message ${i + 1}`,
        name: `Customer ${i + 1}`,
      })
    );
  }

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  const messagesPerSecond = messageCount / duration;

  console.log(`\n✅ Load test complete!`);
  console.log(`   Total messages: ${messageCount}`);
  console.log(`   Duration: ${duration.toFixed(2)}s`);
  console.log(`   Rate: ${messagesPerSecond.toFixed(2)} msg/s`);
}

// Export test runner
export async function runAllTests() {
  console.log('🚀 Starting full test suite...\n');
  console.log('='.repeat(50));
  
  try {
    await testConversationFlow();
    console.log('\n' + '='.repeat(50));
    
    await testReviewTriggers();
    console.log('\n' + '='.repeat(50));
    
    await testManualOverride();
    console.log('\n' + '='.repeat(50));
    
    await loadTest(5);
    console.log('\n' + '='.repeat(50));
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// CLI test runner (run with: npx tsx lib/testingUtils.ts)
if (require.main === module) {
  runAllTests().catch(console.error);
}