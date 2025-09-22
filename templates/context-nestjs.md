# {{PROJECT_NAME}} - Project Context

## Architecture Overview

This is a **NestJS TypeScript Backend Application** with the following characteristics:

### Technology Stack
- **Backend Framework**: NestJS with TypeScript
- **Database**: PostgreSQL/MySQL with Prisma/TypeORM
- **Authentication**: JWT tokens, Okta/Auth0 integration
- **Testing**: Jest framework
- **Documentation**: Swagger/OpenAPI
- **Tech Stack**: {{TECH_STACK}}

### Key Features
- RESTful API endpoints
- Database ORM integration
- Authentication and authorization
- Health monitoring endpoints
- Comprehensive error handling
- Input validation with DTOs

### Project Structure
```
src/
├── modules/             # Feature modules
├── shared/              # Shared utilities
├── guards/              # Authentication guards
├── interceptors/        # Request/response interceptors
├── dto/                 # Data transfer objects
└── main.ts              # Application bootstrap
```

### Development Patterns
- Controller-Service-Repository pattern
- Dependency injection
- Decorators for metadata
- Pipe validation
- Exception filters

## Project Details
- **Name**: {{PROJECT_NAME}}
- **Description**: {{PROJECT_DESCRIPTION}}
- **Type**: NestJS Backend Application
