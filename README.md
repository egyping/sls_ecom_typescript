# sls_ecom_typescript

<< 01_blankTemplate >>
Create new git repo and clone it locally 
Now run the sis to create new sls project from the template of https://github.com/SamWSoftware/interviewAPI
sls create --template-url https://github.com/SamWSoftware/interviewAPI --path ecom-ap
adjust the dynamo tables to have two tables product and orders, orders table has stream
adjust the environment variables and remove unecessary things like assetbucket 
npm install 
01_blankTemplate has the starter after adjusting and removing the unecessary things (kickoff template )

<< 02_getProducts_API >>
change the region: 'us-east-1', as it was frankfurt

A sample of product 
{
    "id": "e132ee4f-acad—4553-871f-6abf8c4d26a6",
    "pk": "clothing",
    "sk": "mens#jackets#e132ee4f—acad—4553-871f-6abf8c4d26a6",
    "title": "Firewall Rain Jacket",
    "brand": "RAB",
    "description": "Lightweight rain jacket made for intrepid
    "colour": "red",
    "sizesAvailable": [
    { "sizeCode": 1, "displayValue": "small" },
    { "sizeCode": 2, "displayValue": "medium" },
    { "sizeCode": 3, "displayValue": "large" }
    ]
}
worked on the getProducts and types\dynamo
adjusted some settings at serverless.ts
sls deploy
sls deploy function -f getProducts
to deploy specific function 

test
https://m5o8u4ek01.execute-api.eu-central-1.amazonaws.com/dev/products
https://m5o8u4ek01.execute-api.eu-central-1.amazonaws.com/dev/products?fake=anything
400
{
    "message": "missing group string parameters"
}

test 
https://m5o8u4ek01.execute-api.eu-central-1.amazonaws.com/dev/products?group=clothing
200
[]

bulk upload data to dynamo table 

npx ts-node myScript.ts
npm install -g ts-node
ts-node seedData/writeSeedToFile.ts
https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/products?group=climbing

generate fake items data and upload it to dynamodb 
geenrating the data i will use the products.json directly as fake data generation always easy with chatgpt
so started from 
deploySeedToAWS


environment=dev ts-node ./seedData/deploySeedToAWS.ts 
this will execute the generate data and export the data to aws tables 

** Get Product **
create new function at src and serverless 
sls deploy
test
https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/product/7910750b-926c-4a5f-86c8-9cb32a92db4c



<< 03_createOrder >>
First create model (interface) for the order at the types then create the function which will form the order 
at serverless>functions create record for the createOrder function 
the variable authorizer represent cognito so any function has http (api gateway) and has authorizer variable 
means it secured by cognito and cognito data is passing 
authorizer connected to cognitoResources where the cloudformation of cognito is defined over there 
serverless.ts > has resources section > the section has CognitoResources > which point to cognitoResources
sls deploy
https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/orders
post test
its secured request need cognito token so how to create token?
you can do it through aws cli 
you can do it through https://getmycognitotoken.com
its sign up procss and fully handle by frontend and cognito nothing to do with the serverless backend
get the token and use bearer token 
you need to pass the followings in the post body  "" items: { id: ProductId; count: number; size?: number }[]; ""
raw - 
{
    "items": [
        {
        "id": "0ecc7acf-6bd6-479d-8645-0eb828901d98",
        "count": 2,
        "size": 60
        }
    ]
}


<< 04_streamHandler >>
now we can place orders 
we want that whenever new order get placed anoth lambda function to be executed 
this will happen through Dynamodb Streams enable trigger >> send to event bridge > EB trigger lambda function
streamHandler: lambda will be executed\triggered by dynamodbstream when new order get placed 
npm i -S @aws-sdk/client-eventbridge
to install the unmarshall 
npm i -S @aws-sdk/util-dynamodb 
you will need to eventBrigeBusName to the environments and cusotm 
this applied to the development D this needed for using iam roles attached to the stream function
allow the function to put event to the event bus
npm i -D serverless-iam-roles-per-function 
and serverless-iam-roles-per-function to the plugins list
by deploying you will get a new trigger at the order table in the console
now create new order and check 

>> new function ebOrderPlacedNotification this will email the user by new order placed 
the function listen to the event bridge new order and trigger ses to send email.
we will use the SES client so we need to create client at libs and install ses sdk
npm i -S @aws-sdk/client-ses

email verification at ses is a must



<< 05_warehouseOperationFunctions >>
As of now 
1- POST new order >> saved in orders table which has stream defined in the resource section

2- dynamo stream handler trigger streamHandler function >> streamHandler return event which send message to event bridge bus name eventBrigeBusName (ordersEventBus) with Source value of statusToSource = placed 
ordersEventBus has three Sources defined Placed, Packed and Delivered

3- ebOrderPlacedNotification function triggered by ordersEventBus(order.placed) the function use SES script to send the customer email with the details 

4- ebOrderPlacedPicklist triggered by order.placed event to- send the items details to the warehouse system 
this system is outside system we will call it by API so we will need Axio 
npm i -S axios
we will send to this API the details which exist in the order.placed event 
lets assume the warehouse system API https://httpstat.us/201 you will always get 201
we need to use secret manager to call the warehouseApiKey to access the api 
so we need to add secrets at libs 
npm i -S @aws-sdk/client-secrets-manager
the secret client script so whenever we want key we use secret.getSecret and pass the the secret name
this function since its triggered by EB and just call outside API using key saved in secret manager so while defining the function it just need access to the secret manager service so the function use Secret function located at the lib the secret takes the key value of the needed secret and expose the client of the secret manager to query about any secret .. another secret resource defined under serverless will save all our passwords which saved at the .env to the secret manager service in our case warehouseApiKey
function call the APiKey > the ApiKey query the libs\secrets the libs\secrets query the secret manager service about warehouseApiKey.
how the secret manager takes the password of warehouseApiKey this is through the secrets defined as a resource under serverless.
serverless.secrets points to env variable SecretString: '${env:warehouseApiKey}', which saved in .env.
how the .env will be populated? this is through useDotenv: true, which at serverless.ts
we also need to add the serverless\secrets as a resource at the serverless.ts and import it 
sls deploy 
will create the secret and the new lambda function
now create a new order
*to track the order check the following*
1- dynamodb orders table check if the order is created 
2- check the dynamodb streams triggers functions streamHandler cloudwatch logs
you should see here the orders data passed to EB with httpStatusCode: 200
3- check the /aws/lambda/ecom-app-dev-ebOrderPlacedNotification log group at clouwatch to check the success of order check if this exist "sent email" and check your mail 
4- check the /aws/lambda/ecom-app-dev-ebOrderPlacedPicklist cloudwatch group to check the api call
if this si showing that mean its called "warehouse API called"


<< Warehouse Picked Function >>
Previous step we sent the order pick lis tto the warehouse dummy API.
Now we will create function API so when the warehouse update the order status in our system.
In this function when the warehouse connect to us we need to authenticate them then the code logic update the status.
Authorisation > libs\Authorisation.
so they send us in the api gateway header the key we check if the key match one of the secret manager keys (get the exact secret from our .env though libs\secrets > seceret manager ) .
so we need to add one more secret sections in serverless\secrets and add the key to the .env in the following format since we have warehouse1 and warehouse2 for example 
{"warehouse1":"7910750b-926c-4a5f-86c8-9cb32a92db4c","warehouse2":"7910750b-926c-4a5f-86c8-9cb32a92db4c"}
sls deploy 
now test 
POST - https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/orderpacked/{orderId}
https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/orderpacked/f23b916a-31d6-40d0-b1b5-6ef1019973d6
Authorzation is API Key 
Key: Authorization
Value: the key itself 


<< Order Packed Notification Email >>
The order status changed to packed and if you remember the stream handler of dynamo get triggered when the order staus changed to placed, packed, and delivered on placed the send email function work adn on the order changed to packed we need to notify the user.
so at serverless\functions we define that on order.packed trigger the function ebOrderPackedNotification
its similar to order placed so nothing to mention much
sls deploy 
test change any order to packed you should receive an email

<< Order Packed notify the delivery company >>
similar to the orderPlacedPickList which inform the warehouse dummy API that the order is placed and we are passing to the the items details we will create orderPackedRequestDelivery to inform the DSP that we have new order to deliver.
instead of warehouseApiKey we will use deliveryApiKey which need entry at both secrets and .env
but here we need to pass the user data like user address whcih explained in the function 
this will fail since we dont have user address table 

<< DSP delivered and informing you  >>
its similar to the function PackingComplete which outside firm hit our API to update the order status to delivered
need to update the serverless\functions and secrets 

<< send notification on order delivered >>
similar to OrderPackedNotification and make your own orderDeliveredNotification
now test 
POST - https://5uf0knr5g9.execute-api.us-east-1.amazonaws.com/dev/orderdelivered/{orderId}


<< .env file contains >>
warehouseApiKey=7910750b-926c-4a5f-86c8-9cb32a92db4c
orderpackeApiKeys={"warehouse1":"7910750b-926c-4a5f-86c8-9cb32a92db4c","warehouse2":"7910750b-926c-4a5f-86c8-9cb32a92db4c"}
deliveryApiKey=7910750b-926c-4a5f-86c8-9cb32a92db4c
orderdeliveredApiKeys={"dhl":"7910750b-926c-4a5f-86c8-9cb32a92db4c"}

sls remove