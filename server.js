const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const stripe = require('stripe');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Initialize the app
const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5000', 'http://localhost:3000'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
}));
app.use(bodyParser.json());

// MongoDB Connection
let mongoMemoryServer;

async function startServer() {
  try {
    // Set up MongoDB Memory Server for development
    mongoMemoryServer = await MongoMemoryServer.create();
    const mongoUri = mongoMemoryServer.getUri();
    console.log(`Using MongoDB Memory Server: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB Memory Server');

    // Define Schema for the database models
    const paymentSchema = new mongoose.Schema({
      businessId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      amount: { type: Number, required: true },
      currency: { type: String, required: true },
      paymentMethod: { type: String, required: true },
      status: { type: String, default: 'pending' },
      stripePaymentIntentId: String,
      description: String,
      receiptUrl: String,
      metadata: { type: Object, default: {} },
    }, { timestamps: true });

    // Create models
    const Payment = mongoose.model('Payment', paymentSchema);

    // Routes
    app.get('/', (req, res) => {
      res.json({ message: 'Business Management API' });
    });

    // Create a payment intent for Stripe
    app.post('/api/create-payment-intent', async (req, res) => {
      try {
        const { amount, currency = 'usd', userId, businessId, description } = req.body;
        
        if (!amount || !userId || !businessId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create a payment intent
        const paymentIntent = await stripeClient.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: {
            userId,
            businessId,
            description
          },
        });

        // Create a record in the database
        await Payment.create({
          businessId: new mongoose.Types.ObjectId(businessId),
          userId: new mongoose.Types.ObjectId(userId),
          amount,
          currency,
          paymentMethod: 'stripe',
          status: 'pending',
          stripePaymentIntentId: paymentIntent.id,
          description,
        });

        // Return the client secret
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // API for checking Stripe integration status
    app.get('/api/stripe-status', async (req, res) => {
      try {
        const isConfigured = !!process.env.STRIPE_SECRET_KEY;
        
        if (isConfigured) {
          // Check if Stripe is actually working by making a simple API call
          const balance = await stripeClient.balance.retrieve();
          res.json({ 
            configured: true, 
            working: true,
            balance: balance.available[0]
          });
        } else {
          res.json({ configured: false, working: false });
        }
      } catch (error) {
        console.error("Stripe API error:", error);
        res.json({ 
          configured: !!process.env.STRIPE_SECRET_KEY, 
          working: false, 
          error: error.message 
        });
      }
    });

    // Stripe subscription flow - create a subscription
    app.post('/api/create-subscription', async (req, res) => {
      try {
        const { customerId, priceId } = req.body;
        
        if (!customerId || !priceId) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create a subscription
        const subscription = await stripeClient.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        });
      } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Start the server
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${port}`);
    });

    // Add graceful shutdown
    process.on('SIGINT', async () => {
      if (mongoMemoryServer) {
        await mongoose.disconnect();
        await mongoMemoryServer.stop();
        console.log('MongoDB Memory Server stopped');
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server
startServer();