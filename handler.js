const got = require("got");
const dynamo = require("./dynamo");

const success = {
  statusCode: 200,
  headers: { "Access-Control-Allow-Origin": "*" },
  body: "everything is alright",
};

const sendMessageToClient = async (url, connectionId, payload) => {
  await got
    .post(`${url}/@connections/${connectionId}`, {
      body: JSON.stringify(payload),
    })
    .catch((err) => {
      console.log("err is", err);
    });
};

const writeConnectionToDb = async (userId, connectionId) => {
  await dynamo.putItem({
    pk: userId,
    connectionId,
  });
};

const getConnectionIdsByUserId = async (userId) => {
  const data = await dynamo.queryByPrimaryKey(userId);
  return data.map((item) => item.connectionId);
};

const removeConnectionByUserUd = async (userId) => {
  // await dynamo.updateItem()
};

module.exports.defaultHandler = async (event, context) => {
  const connectionId = event.requestContext.connectionId;
  const message = event.body;
  const url = `http://localhost:3001`;
  const userId = "test_user";
  const connections = await getConnectionIdsByUserId(userId);
  await Promise.all(
    connections.map((connection) =>
      sendMessageToClient(url, connectionId, { message: `echo_${message}}` })
    )
  );
  return success;
};

module.exports.connectionHandler = async (event, context) => {
  const connectionId = event.requestContext.connectionId;
  if (event.requestContext.eventType === "CONNECT") {
    console.log({ connectionId }, "connect");
    const userId = "test_user";
    await writeConnectionToDb(userId, connectionId);
  } else if (event.requestContext.eventType === "DISCONNECT") {
    console.log({ connectionId }, "disconnect");
  }
  return success;
};

module.exports.sendMessage = async (event, context) => {
  console.log("send message");

  return success;
};

// not supported offline
module.exports.auth = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("auth");

  return {
    ...success,
    body: JSON.stringify({ auth: true, token: `${Date.now()}_token` }),
  };
};
