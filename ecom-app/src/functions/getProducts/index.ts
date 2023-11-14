import { APIGatewayProxyEvent } from 'aws-lambda';
import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { ProductsRecord } from 'src/types/dynamo';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // which table?
    const productsTable = process.env.productTable

    // get the group category and subcategory from the URL get request
    // || {} if no query string passed create empty object 
    const { group, category, subcategory } = event.queryStringParameters || {}
    console.log(event.queryStringParameters)

    // without group return error group is a must category and sub category are not 
    // group is a must since it is the pk in the item card 
    // sample "pk": "clothing",
    if (!group) {
      return formatJSONResponse({
        statusCode: 400,
        body: { message: 'missing group string parameters' },
      });
    }

    // query the exact product line sk is optional but good for filters
    // "sk": "mens#jackets#e132ee4f—acad—4553-871f-6abf8c4d26a6",

    // form considering no sk
    let sk = undefined
    // form if there is a category only and if there is both category and subcategory
    if (category) {
      sk = category
      if (subcategory){
        sk = '${category}#${subcategory}' 
      }
    }
    // productsResponse is array of products returning from the dynamo DB 
    // ProductsRecord is a model interface compose how the product response should be
    const productsResponse = await Dynamo.query<ProductsRecord>({
      tableName: productsTable, // which table
      index: 'index1', // which index
      pkValue: group, // group fetched from the get url 
      skBeginsWith: sk,
      skKey: sk ? 'sk': undefined, // the sk and if no value make it undefined
    })

    // create productData which array of objects returned from productsResponse without pk and sk
    const productData = productsResponse.map(({pk, sk, ...rest}) => rest)
    

    // return the productData
    return formatJSONResponse({ body: productData });

  } catch (error) {
    console.error(error);
    return formatJSONResponse({ statusCode: 500, body: error.message });
  }
};
