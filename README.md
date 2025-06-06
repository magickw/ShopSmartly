# ShopSmartly

ShopSmartly is a full-stack web application that allows users to scan product barcodes and compare prices across different retailers. Users can scan a product, view detailed pricing information from various stores, and access their scan history.

## Features

- **Barcode Scanning:** Instantly scan product barcodes using your device camera or manually enter barcodes.
- **Price Comparison:** View and compare prices from multiple retailers in real-time, with the best price highlighted.
- **Scan History:** Access a history of previously scanned products, with options to clear or revisit past scans.
- **Detailed Product Information:** Get product details and pricing breakdowns.

## System Architecture

The application follows a modern web architecture with the following components:

### Frontend

- **React-based SPA:** Built with TypeScript and React.
- **Tailwind CSS** for styling and shadcn/ui component library for accessible, reusable UI components.
- **Responsive Design:** Optimized for mobile devices.

### Backend

- **Express.js server** serving RESTful API endpoints for product lookup and scan history.
- **Integration with external barcode API services** for product lookup.
- **Development server with hot reloading and production build configuration.**

### Database

- **PostgreSQL** database via Drizzle ORM.
- **Schema** for products, stores, and prices, with in-memory fallback for development.

### State Management

- **React Query** for server state management.
- **Local component state** for UI interactions.

## Key Components

### Frontend Components

- **Scanner Module**
  - Camera access for barcode scanning
  - Manual barcode entry as fallback
  - Visual overlay for guiding the scanning process
- **Product Display**
  - Product information card
  - Price comparison across stores
  - Best price highlighting
- **History Module**
  - List of previously scanned products
  - Quick access to past scan results
  - Option to clear history
- **UI Components**
  - Reusable UI components from shadcn/ui
  - Toast notifications for user feedback
  - Loading and error states

### Backend Components

- **API Routes**
  - `/api/lookup/:barcode` - Fetches product info by barcode
  - `/api/history` - Manages scan history
  - External barcode lookup API integration
- **Data Storage**
  - Database models for products, stores, and prices
  - In-memory storage fallback for development
- **Server Setup**
  - Development server with hot reloading
  - Production build configuration

## Data Flow

### Barcode Scanning Process

1. User scans a barcode via camera or manual entry.
2. Frontend sends a request to the backend API.
3. Backend checks if the product exists in the database.
4. If not found, data is fetched from an external barcode API.
5. Product data is returned to the frontend and displayed.
6. Scan history is updated.

### Price Comparison

- For each product, price data from multiple stores is shown.
- Best price is highlighted for quick comparison.
- Store details and stock information are displayed.

### History Management

- Scans are saved to history with timestamps.
- User can access history to view past scans.
- History can be cleared by the user.

## External Dependencies

- **UI Libraries:** shadcn/ui (Radix UI), Tailwind CSS, Lucide React for icons
- **Data Management:** TanStack React Query, Zod for validation, Axios for API requests
- **Development Tools:** Vite, TypeScript, ESBuild
- **Backend Libraries:** Express, Drizzle ORM, Neon Serverless PostgreSQL client

## Database Schema

The database uses three main tables:

- **products**
  - `id`: Primary key
  - `barcode`: Unique product identifier
  - `title`: Product name
  - `brand`: Brand name
  - `category`: Product category
- **stores**
  - `id`: Primary key
  - `name`: Store name
  - `logo`: Store logo URL
- **prices**
  - `id`: Primary key
  - `productId`: Foreign key to products
  - `storeId`: Foreign key to stores
  - `price`: Price value
  - `currency`: Currency code
  - `inStock`: Stock status
  - `updatedAt`: Last update timestamp

## Deployment Strategy

- **Build Process**
  - Frontend: Vite build process
  - Backend: ESBuild for bundling the server
- **Runtime Environment**
  - Node.js 20
  - PostgreSQL 16
- **Startup Commands**
  - Development: `npm run dev`
  - Production: `npm run start`
- **Port Configuration**
  - Application runs on port `5000`
  - Mapped to port `80` for external access

## Getting Started

1. Ensure the PostgreSQL database is provisioned.
2. Set the required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `BARCODE_LOOKUP_API_KEY`: API key for barcode lookup service
3. Run `npm run dev` to start the development server.
4. Run `npm run db:push` to push the database schema.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any features, bug fixes, or suggestions.

## License

This project is licensed under the [MIT License](LICENSE).

---

Made with ❤️ by Baofeng Guo.
