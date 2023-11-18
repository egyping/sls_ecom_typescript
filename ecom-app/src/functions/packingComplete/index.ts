import { APIGatewayProxyEvent } from 'aws-lambda';
import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { OrderRecord } from 'src/types/dynamo';
import Authorisation from '@libs/Authorisation';

// external API call so the triggere from APIGatewayProxyEvent
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Use the Authorisation to authenticate the external call first
    // Authorisation just return and if sucsseed ti will continue 
    await Authorisation.apiKeyAuth(event);
  } catch (error) {
    console.log(error);
    return formatJSONResponse({
      statusCode: 401,
      body: { message: 'API Key auth failed' },
    });
  }


  try {
    // get the order table name 
    const ordersTableName = process.env.ordersTable;
    // get the order ID 
    const orderId = event.pathParameters.orderId;
    // get the order from the table
    const order = await Dynamo.get<OrderRecord>({
      pkValue: orderId,
      tableName: ordersTableName,
    });
    // check if the order exist
    if (!order || !order.id) {
      return formatJSONResponse({ statusCode: 404, body: {} });
    }
    // update the order status to packed in a variable
    const updatedOrder: OrderRecord = {
      ...order,
      status: 'packed',
      dateUpdated: Date.now(),
    };
    // update the order in dynamo table 
    await Dynamo.write({
      data: updatedOrder,
      tableName: ordersTableName,
    });

    return formatJSONResponse({ body: { message: 'order packing accepted' } });
  } catch (error) {
    return formatJSONResponse({ statusCode: 500, body: error.message });
  }
};