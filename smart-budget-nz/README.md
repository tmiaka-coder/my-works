# SmartBudget NZ

A minimalist, monochrome expense tracking app built to help users build financial awareness and track everyday living costs in New Zealand.

## Key Features

- **Receipt Data Entry & OCR**: Upload receipt photos (including iPhone HEIC format) or manually log expenses.
- **Store Quick-Select Buttons**: One-tap selection for major NZ retailers:
  - `PAK'nSAVE`
  - `New World`
  - `Woolworths`
  - `Kmart`
  - `The Warehouse`
- **Two-Tier Category Breakdown**: Categorize spending with Main Categories (e.g., *Food & Groceries*, *Fixed Expenses*) and Subcategories (e.g., *Produce*, *Dairy & Bakery*).
- **Partner Sharing & User Identification**: Track shared household expenses with customizable monochrome color badges for each user.
- **Supermarket Price Check**: Compare product prices across different NZ stores to identify standard and discount rates.
- **NZD to JPY Reference**: Real-time or manual exchange rate conversion settings.

## Design Concept

- **Monochrome & Chic**: Minimalist white/black base to eliminate visual clutter.
- **User Color Accents**: Subtle color indicators for seamless expense attribution between partners.

## 🛠 Tech Stack

- **Frontend**: React Native (Expo), TypeScript
- **Backend**: Firebase (Firestore, Authentication)
- **OCR Engine**: Google Cloud Vision API
- **Version Control**: Git / GitHub

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npx expo start