# Technology Stack & Build System

## Frontend Architecture
- **Pure Vanilla JavaScript**: ES6+ modules with no framework dependencies
- **Modern CSS**: CSS3 with custom properties, gradients, and glassmorphism effects
- **HTML5**: Semantic markup with SEO optimization and structured data

## Deployment Platform
- **Cloudflare Pages**: Static site hosting with Functions for serverless API
- **Cloudflare Functions**: Serverless backend at `/functions/api/analyze.js`
- **Environment Variables**: Managed through `.dev.vars` (development) and Cloudflare dashboard (production)

## AI Integration
- **Google Gemini API**: Primary AI model for image analysis
- **OpenAI-compatible endpoint**: Using Gemini's OpenAI compatibility layer
- **Image Processing**: Base64 data URL handling for image uploads

## Development Tools
- **Wrangler**: Cloudflare's CLI tool for local development and deployment
- **Node.js**: Runtime requirement (>=14.0.0)
- **Local Server**: Static file serving for development

## Common Commands

### Development
```bash
# Start local development server
npm run dev
# or
wrangler pages dev . --compatibility-date=2024-03-01

# Alternative local servers
npx serve . --cors --single
python -m http.server 8000
```

### Deployment
```bash
# Deploy to Cloudflare Pages
wrangler pages deploy .

# Set environment variables
wrangler pages secret put GEMINI_API_KEY
```

### Environment Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
cp keys.example.js keys.js
```

## File Structure Conventions
- **Modular JavaScript**: Each feature in separate ES6 modules
- **Configuration**: Centralized in `config.js` with system prompts
- **API Layer**: Abstracted in `api.js` for external service calls
- **UI Components**: Separated in `ui.js` for DOM manipulation
- **Data Management**: Local storage handling in `store.js`

## Security Considerations
- **API Key Management**: Environment variables for sensitive data
- **CORS Handling**: Proper headers for cross-origin requests
- **Input Validation**: File type and size restrictions
- **Rate Limiting**: Built-in request throttling