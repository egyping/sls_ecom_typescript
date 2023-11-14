import { APIGatewayProxyEvent } from 'aws-lambda';
import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { ProductsRecord } from 'src/types/dynamo';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const productsTable = process.env.productTable;

    // get the product id from the path parameters 
    const productId = event.pathParameters.productId;
    // get the product data from the database
    const productData = await Dynamo.get<ProductsRecord>({
      pkValue: productId,
      tableName: productsTable,
    });
    // remove the pk and sk from the response data - create new var responseData restructured from productData without sk and pk 
    const { pk, sk, ...responseData } = productData;

    return formatJSONResponse({ body: responseData });
  } catch (error) {
    console.error(error);
    return formatJSONResponse({ statusCode: 500, body: error.message });
  }
};