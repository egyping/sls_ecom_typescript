import type { AWS } from '@serverless/typescript';

import functions from './serverless/functions';
import DynamoResources from './serverless/dynamodb';
import CognitoResources from './serverless/cognitoResources';

const serverlessConfiguration: AWS = {
  service: 'ecom-app',
  frameworkVersion: '3',

  plugins: ['serverless-esbuild'],
  custom: {
    tables: {
      productTable: '${sls:stage}-${self:service}-product-table',
      ordersTable: '${sls:stage}-${self:service}-orders-table',
    },
    profile: {
      dev: 'dev-profile',
      int: 'int-profile',
      prod: 'prod-profile',
    },
    
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    profile: '${self:custom.profile.${sls:stage}}',
    region: 'eu-central-1',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      productTable: '${self:custom.tables.productTable}',
      ordersTable: '${self:custom.tables.ordersTable}',
      region: '${self:provider.region}',
    },
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: 'dynamodb:*',
        Resource: [
          'arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/${self:custom.tables.productTable}',
          'arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/${self:custom.tables.productTable}/index/index1',
          'arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/${self:custom.tables.ordersTable}',
          'arn:aws:dynamodb:${self:provider.region}:${aws:accountId}:table/${self:custom.tables.ordersTable}/index/index1',
        ],
      },
    ],
  },
  functions,

  resources: {
    Resources: {
      ...DynamoResources,
      //...AssetsBucketAndCloudfront,
      ...CognitoResources,
    },
    Outputs: {
      OrdersDynamoTableName: {
        Value: '${self:custom.tables.ordersTable}',
        Export: {
          Name: 'OrdersDynamoTableName',
        },
      },
      ProductDynamoTableName: {
        Value: '${self:custom.tables.productTable}',
        Export: {
          Name: 'ProductDynamoTableName',
        },
      },
      UserPoolId: {
        Value: { Ref: 'CognitoUserPool' },
        Export: {
          Name: 'UserPoolId',
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
