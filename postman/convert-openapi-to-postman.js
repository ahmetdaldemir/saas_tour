#!/usr/bin/env node

/**
 * Convert OpenAPI 3.0 spec to Postman Collection v2.1
 */

const fs = require('fs');
const path = require('path');

const openApiSpecPath = path.join(__dirname, 'openapi-spec.json');
const outputPath = path.join(__dirname, 'SaaS-Tour-API.postman_collection.json');

// Read OpenAPI spec
const openApiSpec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf8'));

// Base collection structure
const collection = {
  info: {
    name: openApiSpec.info.title || 'SaaS Tour API',
    description: openApiSpec.info.description || '',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    _postman_id: require('crypto').randomUUID(),
  },
  item: [],
  variable: [],
};

// Add server variables as collection variables
if (openApiSpec.servers && openApiSpec.servers.length > 0) {
  // Use first server as default
  const defaultServer = openApiSpec.servers[0];
  if (defaultServer.variables) {
    Object.keys(defaultServer.variables).forEach(key => {
      collection.variable.push({
        key,
        value: defaultServer.variables[key].default || '',
        type: 'string',
      });
    });
  }
}

// Helper function to convert OpenAPI path to Postman request
function convertPathToRequest(path, method, operation) {
  const request = {
    name: operation.summary || `${method.toUpperCase()} ${path}`,
    request: {
      method: method.toUpperCase(),
      header: [],
      url: {
        raw: '{{base_url}}' + path,
        host: ['{{base_url}}'],
        path: path.split('/').filter(p => p),
      },
      description: operation.description || '',
    },
    response: [],
  };

  // Add authentication if required
  if (operation.security && operation.security.length > 0) {
    request.request.auth = {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{auth_token}}',
          type: 'string',
        },
      ],
    };
  }

  // Add request body if present
  if (operation.requestBody) {
    request.request.body = {
      mode: 'raw',
      raw: '',
      options: {
        raw: {
          language: 'json',
        },
      },
    };

    if (operation.requestBody.content && operation.requestBody.content['application/json']) {
      const schema = operation.requestBody.content['application/json'].schema;
      if (schema && schema.example) {
        request.request.body.raw = JSON.stringify(schema.example, null, 2);
      } else if (schema && schema.properties) {
        // Generate example from schema
        const example = {};
        if (schema.required) {
          schema.required.forEach(key => {
            const prop = schema.properties[key];
            if (prop.type === 'string') {
              example[key] = prop.example || (prop.format === 'email' ? 'user@example.com' : 'string');
            } else if (prop.type === 'integer' || prop.type === 'number') {
              example[key] = prop.example || 0;
            } else if (prop.type === 'boolean') {
              example[key] = prop.example || false;
            } else {
              example[key] = prop.example || null;
            }
          });
        }
        request.request.body.raw = JSON.stringify(example, null, 2);
      }
    }
  }

  // Add query parameters
  if (operation.parameters) {
    request.request.url.query = [];
    operation.parameters.forEach(param => {
      if (param.in === 'query') {
        request.request.url.query.push({
          key: param.name,
          value: param.example || '',
          description: param.description || '',
        });
      } else if (param.in === 'header') {
        request.request.header.push({
          key: param.name,
          value: param.example || '',
          description: param.description || '',
        });
      }
    });
  }

  return request;
}

// Group paths by tags
const pathsByTag = {};

Object.keys(openApiSpec.paths || {}).forEach(path => {
  const pathItem = openApiSpec.paths[path];
  Object.keys(pathItem).forEach(method => {
    if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
      const operation = pathItem[method];
      const tags = operation.tags || ['Other'];
      tags.forEach(tag => {
        if (!pathsByTag[tag]) {
          pathsByTag[tag] = [];
        }
        pathsByTag[tag].push({
          path,
          method,
          operation,
        });
      });
    }
  });
});

// Convert to Postman collection structure
Object.keys(pathsByTag).forEach(tag => {
  const folder = {
    name: tag,
    item: pathsByTag[tag].map(({ path, method, operation }) =>
      convertPathToRequest(path, method, operation)
    ),
  };
  collection.item.push(folder);
});

// Add collection-level variables
collection.variable.push(
  {
    key: 'base_url',
    value: 'http://berg.local.saastour360.test:5001/api',
    type: 'string',
  },
  {
    key: 'auth_token',
    value: '',
    type: 'string',
  }
);

// Write collection
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

console.log(`✅ Postman collection created: ${outputPath}`);
console.log(`📦 Collection contains ${collection.item.length} folders`);
console.log(`📝 Total requests: ${collection.item.reduce((sum, folder) => sum + folder.item.length, 0)}`);

