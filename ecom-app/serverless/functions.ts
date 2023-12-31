import { AWS } from '@serverless/typescript';

const corsSettings = {
  headers: [
    // Specify allowed headers
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
    'X-Amz-User-Agent',
  ],
  allowCredentials: false,
};


interface Authorizer {
  name: string;
  type: string;
  arn: {
    'Fn::GetAtt': string[];
  };
}
const authorizer: Authorizer = {
  name: 'authorizer',
  type: 'COGNITO_USER_POOLS',
  arn: { 'Fn::GetAtt': ['CognitoUserPool', 'Arn'] },
};

const iamGetSecret = {
  Effect: 'Allow',
  Action: ['secretsmanager:GetSecretValue'],
  Resource: '*',
};

const functions: AWS['functions'] = {
  getProducts: {
    handler: 'src/functions/getProducts/index.handler',
    events: [
      {
        http: {
          method: 'get',
          path: 'products',
          cors: corsSettings,
        },
      },
    ],
  },
  getProduct: {
    handler: 'src/functions/getProduct/index.handler',
    events: [
      {
        http: {
          method: 'get',
          path: 'product/{productId}',
          cors: corsSettings,
        },
      },
    ],
  },
  createOrder: {
    handler: 'src/functions/createOrder/index.handler',
    events: [
      {
        http: {
          method: 'post',
          path: 'orders',
          cors: corsSettings,
          authorizer,
        },
      },
    ],
  },

  streamHandler: {
    handler: 'src/functions/streamHandler/index.handler',
    events: [
      {
        stream: {
          type: 'dynamodb',
          arn: {
            // this mean that any time stream of the orderstable triggered it will execude this lambda
            // npm i -D serverless-iam-roles-per-function and add it to the plugins 
            'Fn::GetAtt': ['OrdersTable', 'StreamArn'],
          },
        },
      },
    ],
    // statement to provide the function access to the event bridge 
    //@ts-expect-error
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['events:PutEvents'],
        Resource:
          'arn:aws:events:${self:provider.region}:${aws:accountId}:event-bus/${self:custom.eventBrigeBusName}',
      },
    ],
  },

  ebOrderPlacedNotification: {
    handler: 'src/functions/ebOrderPlacedNotification/index.handler',
    events: [
      {
        eventBridge: {
          eventBus: '${self:custom.eventBrigeBusName}',
          pattern: {
            source: ['order.placed'],
          },
        },
      },
    ],
    // iamRoleStatementsInherit will add the role to the other roles in the serverless.ts because we need access to the products table
    //@ts-expect-error
    iamRoleStatementsInherit: true,
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['ses:sendEmail'],
        Resource: '*',
      },
    ],
  },
  
  ebOrderPlacedPicklist: {
    handler: 'src/functions/ebOrderPlacedPicklist/index.handler',
    events: [
      {
        eventBridge: {
          eventBus: '${self:custom.eventBrigeBusName}',
          pattern: {
            source: ['order.placed'],
          },
        },
      },
    ],
    //@ts-expect-error
    iamRoleStatements: [iamGetSecret],
  },

  packingComplete: {
    handler: 'src/functions/packingComplete/index.handler',
    events: [
      {
        http: {
          method: 'post',
          path: 'orderpacked/{orderId}',
          cors: corsSettings,
        },
      },
    ],
    // will access dynamo so we need iamRoleStatementsInherit to be true and we need secret manager access too
    //@ts-expect-error
    iamRoleStatementsInherit: true,
    iamRoleStatements: [iamGetSecret],
  },


  ebOrderPackedNotification: {
    handler: 'src/functions/ebOrderPackedNotification/index.handler',
    events: [
      {
        eventBridge: {
          eventBus: '${self:custom.eventBrigeBusName}',
          pattern: {
            source: ['order.packed'],
          },
        },
      },
    ],
    //@ts-expect-error
    iamRoleStatementsInherit: true,
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['ses:sendEmail'],
        Resource: '*',
      },
    ],
  },

  deliveryComplete: {
    handler: 'src/functions/deliveryComplete/index.handler',
    events: [
      {
        http: {
          method: 'post',
          path: 'orderdelivered/{orderId}',
          cors: corsSettings,
        },
      },
    ],
    //@ts-expect-error
    iamRoleStatementsInherit: true,
    iamRoleStatements: [iamGetSecret],
  },

  ebOrderDeliveredNotification: {
    handler: 'src/functions/ebOrderDeliveredNotification/index.handler',
    events: [
      {
        eventBridge: {
          eventBus: '${self:custom.eventBrigeBusName}',
          pattern: {
            source: ['order.delivered'],
          },
        },
      },
    ],
    //@ts-expect-error
    iamRoleStatementsInherit: true,
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['ses:sendEmail'],
        Resource: '*',
      },
    ],
  }
  
};

export default functions;
