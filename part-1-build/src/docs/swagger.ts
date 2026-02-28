/**
 * Inline OpenAPI 3.0 specification for the Clinic Appointment System API.
 * Defined as a static object to work reliably in both dev and production builds.
 */
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Clinic Appointment System API',
    version: '1.0.0',
    description:
      'REST API for a simplified clinic appointment management system. All appointment endpoints require a Bearer JWT.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {},
        },
      },
      ErrorEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Human-readable error message' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'ADMIN'] },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          doctorId: { type: 'string', format: 'uuid' },
          dateTime: { type: 'string', format: 'date-time' },
          duration: { type: 'integer', example: 30 },
          status: { type: 'string', enum: ['SCHEDULED', 'CANCELLED'] },
          notes: { type: 'string', nullable: true },
          patient: { $ref: '#/components/schemas/User' },
          doctor: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: { description: 'API is running' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name', 'role'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['PATIENT', 'DOCTOR', 'ADMIN'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'Validation error' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful — returns token and user' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments (role-filtered)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['SCHEDULED', 'CANCELLED'] },
          },
          {
            name: 'date',
            in: 'query',
            schema: { type: 'string', example: '2027-03-15' },
          },
        ],
        responses: {
          200: { description: 'List of appointments' },
          401: { description: 'Missing or invalid token' },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Book an appointment (PATIENT only)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['doctorId', 'dateTime'],
                properties: {
                  doctorId: { type: 'string', format: 'uuid' },
                  dateTime: { type: 'string', format: 'date-time' },
                  duration: { type: 'integer', default: 30 },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Appointment booked' },
          400: { description: 'Validation error or past date' },
          403: { description: 'Only patients can book appointments' },
          404: { description: 'Doctor not found' },
          409: { description: 'Conflicting appointment for this doctor' },
        },
      },
    },
    '/appointments/{id}': {
      get: {
        tags: ['Appointments'],
        summary: 'Get a single appointment by ID',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Appointment details' },
          403: { description: 'Access denied' },
          404: { description: 'Not found' },
        },
      },
    },
    '/appointments/{id}/cancel': {
      patch: {
        tags: ['Appointments'],
        summary: 'Cancel an appointment',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Appointment cancelled' },
          400: { description: 'Already cancelled' },
          403: { description: 'Access denied' },
          404: { description: 'Not found' },
        },
      },
    },
  },
};
