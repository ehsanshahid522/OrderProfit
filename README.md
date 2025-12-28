# OrderProfit AI

True Profit Tracking for E-Commerce Sellers

## Overview

OrderProfit AI helps e-commerce sellers understand their real profit per order by tracking all costs including advertising, shipping, returns, and platform fees in one place. The application provides automatic profit calculations and AI-powered insights to help you make better business decisions.

## Features

- **Dashboard**: View key metrics at a glance including today's profit, monthly profit, total orders, and losses
- **Order Management**: Track all your orders with delivery status and automatic profit calculations
- **Cost Tracking**: Add and manage multiple cost types per order (advertising, courier, packaging, platform fees, returns, etc.)
- **Real Profit Calculation**: Automatically calculates net profit using the formula: Revenue - All Costs
- **AI Insights**: Get personalized business recommendations powered by Google Gemini

## Getting Started

1. **Sign Up**: Create an account with your business name and email
2. **Add Orders**: Start adding your orders with product details and prices
3. **Track Costs**: Add all associated costs for each order
4. **View Insights**: Monitor your dashboard and generate AI insights

## AI Insights Setup (Optional)

To enable AI-powered insights:

1. Get a free Google Gemini API key from: https://makersuite.google.com/app/apikey
2. Add the API key as an environment variable named `GEMINI_API_KEY` in your Supabase project settings
3. The AI insights feature will then provide personalized recommendations based on your business data

Without the API key, the application will still work perfectly for tracking orders and calculating profits.

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini API

## Security

- All data is protected with Row Level Security (RLS)
- Users can only access their own orders and costs
- Authentication is required for all features
- Secure password handling with Supabase Auth

## Support

For questions or issues, please refer to the application's built-in help or contact support.
