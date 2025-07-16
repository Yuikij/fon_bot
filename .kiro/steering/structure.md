# Project Structure & Organization

## Root Directory Layout
```
├── index.html              # Main application entry point
├── main.js                 # Application initialization and event handling
├── styles.css              # Global styles with modern CSS features
├── package.json            # Project metadata and dependencies
└── README.md               # Project documentation
```

## Core Application Modules
```
├── api.js                  # External API communication layer
├── config.js               # System prompts and application configuration
├── ui.js                   # DOM manipulation and UI component management
├── store.js                # Local storage and data persistence
└── script.js               # Legacy/additional scripting (if needed)
```

## Environment & Configuration
```
├── .env                    # Environment variables template
├── .dev.vars               # Cloudflare development variables
├── env-inject.js           # Runtime environment variable injection
├── keys.js                 # API keys (gitignored)
└── keys.example.js         # API key template
```

## Cloudflare Functions (Serverless API)
```
└── functions/
    └── api/
        └── analyze.js      # Image analysis API endpoint
```

## Build & Deployment
```
├── .wrangler/              # Cloudflare build artifacts
├── dist/                   # Build output directory
├── node_modules/           # Dependencies
└── package-lock.json       # Dependency lock file
```

## Documentation & Guides
```
├── QUICK_FIX.md           # Troubleshooting guide
├── SECURITY_GUIDE.md      # Security best practices
└── .gitignore             # Git ignore patterns
```

## Architecture Patterns

### Module Organization
- **Separation of Concerns**: Each module handles a specific responsibility
- **ES6 Modules**: Import/export pattern for clean dependencies
- **Configuration Centralization**: All settings in `config.js`
- **API Abstraction**: External calls isolated in `api.js`

### File Naming Conventions
- **Kebab-case**: For HTML and CSS files (`index.html`, `styles.css`)
- **Camel-case**: For JavaScript modules (`main.js`, `config.js`)
- **Uppercase**: For documentation (`README.md`, `SECURITY_GUIDE.md`)

### Code Organization Principles
- **Single Responsibility**: Each file has one primary purpose
- **Modular Design**: Features can be developed and tested independently
- **Environment Separation**: Development and production configurations isolated
- **Security First**: Sensitive data in environment variables, not source code

### Development Workflow
1. **Local Development**: Use `wrangler pages dev` for full-stack testing
2. **Environment Setup**: Copy template files and configure API keys
3. **Module Development**: Work on individual modules with clear interfaces
4. **Testing**: Use browser dev tools and local server for debugging
5. **Deployment**: Push to Cloudflare Pages with environment variables configured