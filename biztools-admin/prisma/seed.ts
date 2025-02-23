const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const testItems = [
  {
    title: 'Invoice Generator Pro',
    description: 'Automated invoice creation and management tool with customizable templates and multi-currency support.',
    category: 'Billing',
    attributes: {
      features: ['Custom Templates', 'Multi-currency', 'Automated Reminders'],
      pricing: 'Premium',
      integration: 'Easy'
    },
    clicks: 15
  },
  {
    title: 'Smart Analytics Dashboard',
    description: 'Real-time business analytics with customizable dashboards and AI-powered insights.',
    category: 'Analytics',
    attributes: {
      features: ['Real-time Data', 'AI Insights', 'Custom Reports'],
      pricing: 'Enterprise',
      integration: 'Advanced'
    },
    clicks: 25
  },
  {
    title: 'Team Chat Plus',
    description: 'Secure team communication platform with video calls and file sharing capabilities.',
    category: 'Communication',
    attributes: {
      features: ['Video Calls', 'File Sharing', 'Thread Discussions'],
      pricing: 'Standard',
      integration: 'Easy'
    },
    clicks: 30
  },
  {
    title: 'Project Timeline',
    description: 'Visual project management tool with Gantt charts and resource allocation.',
    category: 'Project Management',
    attributes: {
      features: ['Gantt Charts', 'Resource Management', 'Timeline Export'],
      pricing: 'Premium',
      integration: 'Medium'
    },
    clicks: 20
  },
  {
    title: 'Customer CRM Lite',
    description: 'Simple but powerful CRM system for small businesses with email integration.',
    category: 'CRM',
    attributes: {
      features: ['Contact Management', 'Email Integration', 'Task Tracking'],
      pricing: 'Basic',
      integration: 'Easy'
    },
    clicks: 18
  },
  {
    title: 'Expense Tracker',
    description: 'Automated expense tracking and reporting with receipt scanning.',
    category: 'Finance',
    attributes: {
      features: ['Receipt Scanning', 'Expense Reports', 'Budget Tracking'],
      pricing: 'Standard',
      integration: 'Medium'
    },
    clicks: 22
  },
  {
    title: 'HR Portal',
    description: 'Complete HR management system with leave tracking and performance reviews.',
    category: 'HR',
    attributes: {
      features: ['Leave Management', 'Performance Reviews', 'Document Storage'],
      pricing: 'Enterprise',
      integration: 'Advanced'
    },
    clicks: 12
  },
  {
    title: 'Marketing Campaign Manager',
    description: 'All-in-one marketing campaign management with social media integration.',
    category: 'Marketing',
    attributes: {
      features: ['Social Media Integration', 'Campaign Analytics', 'Content Calendar'],
      pricing: 'Premium',
      integration: 'Medium'
    },
    clicks: 28
  },
  {
    title: 'Inventory Control System',
    description: 'Real-time inventory management with barcode scanning and alerts.',
    category: 'Inventory',
    attributes: {
      features: ['Barcode Scanning', 'Stock Alerts', 'Order Management'],
      pricing: 'Premium',
      integration: 'Advanced'
    },
    clicks: 16
  },
  {
    title: 'Document Flow',
    description: 'Document management system with version control and collaboration features.',
    category: 'Document Management',
    attributes: {
      features: ['Version Control', 'Collaboration', 'Search'],
      pricing: 'Standard',
      integration: 'Easy'
    },
    clicks: 24
  }
];

async function main() {
  console.log('Start seeding...');

  // Clear existing items
  await prisma.item.deleteMany();
  await prisma.clickEvent.deleteMany();
  await prisma.recommendationModel.deleteMany();

  // Create items
  for (const item of testItems) {
    const createdItem = await prisma.item.create({
      data: {
        title: item.title,
        description: item.description,
        category: item.category,
        attributes: item.attributes,
        clicks: item.clicks,
        lastClicked: item.clicks > 0 ? new Date() : null
      }
    });

    // Create some click events for items with clicks
    if (item.clicks > 0) {
      const clickEvents = Array.from({ length: item.clicks }, (_, i) => ({
        itemId: createdItem.id,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Spread over past days
        userId: `user${Math.floor(Math.random() * 5) + 1}` // Random user 1-5
      }));

      await prisma.clickEvent.createMany({
        data: clickEvents
      });
    }

    console.log(`Created item: ${item.title}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 