import { APIGatewayProxyEvent } from 'aws-lambda';
import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { OrderRecord } from 'src/types/dynamo';
import { v4 as uuid } from 'uuid';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // get the table name
    const ordersTableName = process.env.ordersTable;
    // get the order information which has the product data in the body
    const order = JSON.parse(event.body);
    // get the user id and email from the requestand authorizer which connected to cognito
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const userEmail = event.requestContext?.authorizer?.claims?.email;
    // create time stamp and assign it to now
    const timestamp = Date.now();
    // form the full order to match between the model (record interface) and the order products data 
    const fullOrder: OrderRecord = {
      id: uuid(),
      pk: userId,
      sk: `order#${timestamp}`,

      userId,
      userEmail,
      dateCreated: timestamp,
      status: 'placed',
      items: order.items,
    };
    // post the order information to the dynamodb orders table 
    await Dynamo.write({
      data: fullOrder,
      tableName: ordersTableName,
    });

    return formatJSONResponse({ body: { message: 'order placed' } });
  } catch (error) {
    return formatJSONResponse({ statusCode: 500, body: error.message });
  }
};