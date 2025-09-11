## 🎥 Demo Video

<video src="https://github.com/Hack-Vibe-2k25/Digital-Dynamos/blob/main/assets/WhatsApp%20Video%202025-09-12%20at%2004.15.36.mp4?raw=true" 
       controls 
       autoplay="false" 
       width="700">
  Your browser does not support the video tag.
</video>


# Virtusphere

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Node.js Version](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)

Virtusphere is a modern event management platform combining AI-powered assistance and emotion detection to enhance user experience. The project consists of a FastAPI backend providing emotion analysis and Groq API integration, and a Next.js frontend for browsing, hosting, and interacting with events.

## Table of Contents
- [Features](#features)
- [Demo](#demo)
- [Technologies Used](#technologies-used)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Deployment](#deployment)
- [Performance Considerations](#performance-considerations)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Features

### Core Functionality
- **Event Management**: Browse, search, and register for upcoming events with advanced filtering
- **Event Hosting**: Create, manage, and promote events through an intuitive admin dashboard
- **Real-time Interaction**: Live event chat and participant interaction features
- **User Profiles**: Comprehensive user management with attendance history and preferences

### AI & Analytics
- **AI Chatbot Assistant**: Powered by Groq API for intelligent event-related queries and recommendations
- **Emotion Detection**: Advanced sentiment analysis on generated text responses and user interactions
- **Smart Recommendations**: AI-driven event suggestions based on user behavior and preferences
- **Analytics Dashboard**: Real-time insights on event performance and user engagement

### User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: User-preferred theme selection with system detection
- **Accessibility**: WCAG 2.1 AA compliant interface
- **Multilingual Support**: Internationalization ready (i18n)

## Technologies Used

### Backend
- **FastAPI**: High-performance API framework with automatic OpenAPI documentation
- **TensorFlow**: Machine learning framework for emotion detection models
- **Groq API**: Lightning-fast LLM inference for AI assistant capabilities
- **NLTK**: Natural language processing for text analysis
- **SQLAlchemy**: Python SQL toolkit and ORM
- **Redis**: In-memory data structure store for caching and session management
- **Celery**: Distributed task queue for background processing

### Frontend
- **Next.js 14**: React framework with App Router and Server Side Rendering
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase**: Backend-as-a-Service for authentication and real-time features
- **Framer Motion**: Animation library for smooth UI transitions
- **React Query (TanStack Query)**: Data fetching and state management
- **Socket.IO**: Real-time bidirectional event-based communication

### DevOps & Deployment
- **Docker**: Containerization for consistent development and deployment
- **GitHub Actions**: CI/CD pipeline automation
- **Vercel**: Frontend deployment and hosting
- **Railway/Heroku**: Backend API deployment
- **Cloudinary**: Media management and optimization

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   AI Services   │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (Groq API)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   PostgreSQL    │    │   TensorFlow    │
│   (Auth/RT)     │    │   (Database)    │    │   (ML Models)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components
- **API Gateway**: FastAPI with automatic OpenAPI spec generation
- **Authentication**: JWT-based auth with Supabase integration
- **Real-time Features**: WebSocket connections for live updates
- **ML Pipeline**: TensorFlow models for emotion detection
- **Caching Layer**: Redis for improved performance
- **File Storage**: Cloudinary for media assets

## Getting Started

### Prerequisites
- Python 3.8+ with pip
- Node.js 18+ with npm/yarn
- PostgreSQL 13+ (or use Supabase)
- Redis 6+ (optional, for caching)
- Groq API key ([Get one here](https://console.groq.com/keys))

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/virtusphere.git
cd virtusphere

# Start all services with Docker Compose
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (see [Environment Variables](#environment-variables)):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Initialize the database:
   ```bash
   # Run database migrations
   alembic upgrade head
   
   # Seed initial data (optional)
   python scripts/seed_data.py
   ```

6. Download required NLTK data:
   ```bash
   python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('punkt')"
   ```

7. Start the development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Build for production (optional):
   ```bash
   npm run build
   npm start
   ```

## API Documentation

### Interactive API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Spec**: http://localhost:8000/openapi.json

### Key Endpoints

#### Events
- `GET /api/v1/events` - List all events with filtering and pagination
- `POST /api/v1/events` - Create a new event (authenticated)
- `GET /api/v1/events/{event_id}` - Get event details
- `PUT /api/v1/events/{event_id}` - Update event (owner only)
- `DELETE /api/v1/events/{event_id}` - Delete event (owner only)

#### AI Assistant
- `POST /api/v1/chat` - Send message to AI assistant
- `GET /api/v1/chat/history` - Get chat history
- `POST /api/v1/emotion/analyze` - Analyze text emotion

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile

### Rate Limiting
- API requests are limited to 100 requests per minute per IP
- Authenticated users have higher limits (1000 requests per minute)
- AI chat requests are limited to 10 per minute per user

## Environment Variables

### Backend (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/virtusphere
REDIS_URL=redis://localhost:6379/0

# API Keys
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_key_here  # Fallback for Groq

# Security
SECRET_KEY=your-super-secret-jwt-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Environment
ENVIRONMENT=development  # development, staging, production
DEBUG=true
CORS_ORIGINS=["http://localhost:3000"]
```

### Frontend (.env.local)
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Analytics (optional)
NEXT_PUBLIC_GA_ID=GA-XXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_CHAT=true
NEXT_PUBLIC_ENABLE_EMOTION_DETECTION=true
```

## Project Structure

```
virtusphere/
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── api/               # API routes and endpoints
│   │   │   ├── v1/           # API version 1
│   │   │   └── deps.py       # Dependencies and authentication
│   │   ├── core/             # Core application configuration
│   │   │   ├── config.py     # Settings and configuration
│   │   │   └── security.py   # Security utilities
│   │   ├── crud/             # Database CRUD operations
│   │   ├── db/               # Database configuration and models
│   │   │   ├── models/       # SQLAlchemy models
│   │   │   └── session.py    # Database session
│   │   ├── ml/               # Machine learning models and utilities
│   │   │   ├── emotion_detector.py
│   │   │   └── models/       # Trained ML models
│   │   ├── schemas/          # Pydantic schemas for request/response
│   │   ├── services/         # Business logic and external services
│   │   │   ├── groq_service.py
│   │   │   ├── email_service.py
│   │   │   └── event_service.py
│   │   └── utils/            # Utility functions
│   ├── tests/                # Backend tests
│   ├── alembic/              # Database migrations
│   ├── requirements.txt      # Python dependencies
│   └── main.py              # Application entry point
├── frontend/                  # Next.js frontend application
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # Authentication pages
│   │   ├── events/          # Event-related pages
│   │   ├── dashboard/       # User dashboard
│   │   └── admin/           # Admin panel
│   ├── components/          # Reusable React components
│   │   ├── ui/             # Base UI components
│   │   ├── forms/          # Form components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utility libraries and configurations
│   │   ├── api.ts          # API client configuration
│   │   ├── auth.ts         # Authentication utilities
│   │   └── utils.ts        # General utilities
│   ├── hooks/              # Custom React hooks
│   ├── store/              # State management (Zustand/Redux)
│   ├── styles/             # Global styles and Tailwind config
│   ├── types/              # TypeScript type definitions
│   └── public/             # Static assets
├── docs/                   # Project documentation
├── scripts/                # Utility scripts
├── docker-compose.yml      # Docker services configuration
├── Dockerfile.backend      # Backend container definition
├── Dockerfile.frontend     # Frontend container definition
└── README.md              # This file
```

## Usage Examples

### Creating an Event
```python
import requests

# Create a new event
event_data = {
    "title": "AI in Event Management",
    "description": "Learn how AI is transforming events",
    "start_time": "2024-12-15T18:00:00Z",
    "end_time": "2024-12-15T20:00:00Z",
    "location": "Virtual",
    "max_attendees": 100,
    "tags": ["AI", "Technology", "Virtual"]
}

response = requests.post(
    "http://localhost:8000/api/v1/events",
    json=event_data,
    headers={"Authorization": "Bearer your_token_here"}
)

print(response.json())
```

### Using the AI Assistant
```javascript
// Frontend example using the API client
import { apiClient } from '@/lib/api';

const sendChatMessage = async (message) => {
  try {
    const response = await apiClient.post('/api/v1/chat', {
      message: message,
      context: 'event_assistance'
    });
    
    console.log('AI Response:', response.data.response);
    console.log('Detected Emotion:', response.data.emotion);
  } catch (error) {
    console.error('Chat error:', error);
  }
};

// Send a message
await sendChatMessage("What events are happening this weekend?");
```

### Emotion Analysis
```python
from app.ml.emotion_detector import EmotionDetector

detector = EmotionDetector()
text = "I'm so excited about this upcoming conference!"
emotion = detector.predict_emotion(text)

print(f"Text: {text}")
print(f"Emotion: {emotion['emotion']}")
print(f"Confidence: {emotion['confidence']:.2f}")
```

## Testing

### Running Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_events.py

# Run tests with verbose output
pytest -v
```

### Running Frontend Tests
```bash
cd frontend

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Test Configuration
- **Backend**: Uses pytest with fixtures and factory patterns
- **Frontend**: Jest + Testing Library for unit tests, Playwright for E2E
- **API Testing**: Postman collections available in `/docs/api-tests/`

## Deployment

### Production Deployment with Docker

1. Build and deploy with Docker Compose:
   ```bash
   # Production build
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. Set up SSL/TLS with Let's Encrypt:
   ```bash
   # Using Certbot
   certbot --nginx -d yourdomain.com
   ```

### Cloud Deployment Options

#### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Railway (Backend)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway deploy
```

#### AWS/GCP/Azure
- Use provided Terraform configurations in `/infrastructure/`
- Configure CI/CD with GitHub Actions (`.github/workflows/`)

### Environment-Specific Configurations
- **Development**: Docker with hot reload
- **Staging**: Similar to production with debug enabled
- **Production**: Optimized builds, security headers, monitoring

## Performance Considerations

### Backend Optimization
- **Database**: Connection pooling, query optimization, indexing
- **Caching**: Redis for session storage and API response caching
- **Async Processing**: Celery for background tasks (email, ML processing)
- **API Rate Limiting**: Protect against abuse and ensure fair usage

### Frontend Optimization
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component with Cloudinary
- **Caching**: SWR/React Query for client-side caching
- **Bundle Analysis**: Use `npm run analyze` to check bundle sizes

### Monitoring and Analytics
- **APM**: Application Performance Monitoring with Sentry
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Custom metrics for business logic
- **Health Checks**: Automated health endpoints

## Security

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access Control**: Admin, user, and moderator roles
- **Password Security**: Bcrypt hashing with salt
- **Session Management**: Secure session handling

### API Security
- **CORS**: Properly configured for production
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Pydantic schemas for request validation
- **SQL Injection Prevention**: SQLAlchemy ORM usage

### Data Protection
- **HTTPS Only**: Force secure connections in production
- **Data Encryption**: Sensitive data encrypted at rest
- **Privacy Compliance**: GDPR-ready data handling
- **Audit Logging**: Track important user actions

## Troubleshooting

### Common Issues

#### Backend Issues
```bash
# Issue: Database connection error
# Solution: Check DATABASE_URL and ensure PostgreSQL is running
docker-compose up -d postgres

# Issue: GROQ API rate limit
# Solution: Check API key and usage limits
curl -H "Authorization: Bearer $GROQ_API_KEY" https://api.groq.com/openai/v1/models

# Issue: Import errors
# Solution: Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

#### Frontend Issues
```bash
# Issue: Module not found errors
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Issue: Build failures
# Solution: Check TypeScript errors
npm run type-check

# Issue: Environment variables not loading
# Solution: Restart dev server after changing .env.local
```

### Debug Mode
Enable debug logging:
```bash
# Backend
DEBUG=true uvicorn main:app --reload

# Frontend
npm run dev -- --debug
```

### Performance Issues
```bash
# Check backend performance
pip install py-spy
py-spy record -o profile.svg -d 30 -s -- python -m uvicorn main:app

# Check frontend bundle size
npm run analyze
```

## Roadmap

### Version 2.0 (Q2 2024)
- [ ] Advanced AI features (event recommendations, content generation)
- [ ] Mobile applications (iOS/Android with React Native)
- [ ] Payment integration (Stripe, PayPal)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Version 2.1 (Q3 2024)
- [ ] Video streaming integration
- [ ] Calendar integrations (Google, Outlook)
- [ ] Advanced notification system
- [ ] API webhooks for third-party integrations
- [ ] White-label solutions

### Future Considerations
- GraphQL API alongside REST
- Microservices architecture
- Real-time collaborative features
- Blockchain integration for ticketing
- AR/VR event experiences

