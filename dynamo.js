const { DynamoDB } = require("aws-sdk");

const tableName = "TABLE";

const getClient = () => {
  const localOptions = {
    region: "localhost",
    accessKeyId: "xxxx",
    secretAccessKey: "xxxx",
    endpoint: "http://localhost:8083",
  };
  // await new DynamoDB()
  //   .createTable({
  //     AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
  //     KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
  //     ProvisionedThroughput: {
  //       ReadCapacityUnits: 1,
  //       WriteCapacityUnits: 1,
  //     },
  //     TableName: tableName,
  //     StreamSpecification: {
  //       StreamEnabled: false,
  //     },
  //   })
  //   .promise();
  return new DynamoDB.DocumentClient(localOptions);
};

const client = getClient();

const getItemByPrimaryKey = async ({ pk }) => {
  console.warn(`db.getItemByPrimaryKey from ${tableName} with pk=${pk}`);

  const result = await client
    .get({
      TableName: tableName,
      Key: { pk },
    })
    .promise();
  console.warn(`db.getItemByPrimaryKey with pk=${pk} completed`);

  return result.Item;
};

const putItem = async (preparedItem) => {
  console.warn(`db.putItem to ${tableName} with key`, {
    pk: preparedItem.pk,
  });

  await client
    .put({
      TableName: tableName,
      Item: preparedItem,
    })
    .promise();

  console.warn(`db.putItem to ${tableName} completed`);
};

const updateItem = async (key, expression, attrNames, attrValues) => {
  console.warn(`db.updateItem to ${tableName}`, key);

  const result = await client
    .update({
      Key: key,
      TableName: tableName,
      UpdateExpression: expression,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
      ReturnValues: "UPDATED_NEW",
    })
    .promise();

  console.warn(`db.updateItem to ${tableName} completed`);

  return result;
};

const writeTransaction = async (putItems) => {
  console.warn(`db.transactWrite to ${tableName} `);
  await client
    .transactWrite({
      TransactItems: putItems.map((item) => ({
        Put: {
          TableName: tableName,
          Item: item,
        },
      })),
    })
    .promise();

  console.warn(`db.transactWrite to ${tableName} completed`);
};

const queryByPrimaryKey = async (pk) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: {
      "#pk": "pk",
    },
    ExpressionAttributeValues: {
      ":pk": pk,
    },
  };
  const queryResult = await client.query(params).promise();

  return queryResult.Items || [];
};

module.exports.getItemByPrimaryKey = getItemByPrimaryKey;
module.exports.putItem = putItem;
module.exports.writeTransaction = writeTransaction;
module.exports.updateItem = updateItem;
module.exports.queryByPrimaryKey = queryByPrimaryKey;
