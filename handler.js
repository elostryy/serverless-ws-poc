const fetch = require("node-fetch");
const dynamo = require("./dynamo");

const success = {
  statusCode: 200,
};

const notFound = {
  statusCode: 404,
};

const createError = (err) => {
  console.error("Error happens", err);
  return {
    statusCode: 500,
    error: err,
  };
};

const sendMessageToClient = async (url, connectionId, payload) => {
  await fetch(`${url}/@connections/${connectionId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch((err) => {
    console.log("err is", err);
  });
};

const writeConnectionToDb = async (userId, connectionId) => {
  await dynamo.putItem({
    pk: userId,
    connectionId,
  });
};

const getConnectionIdByUserId = async (userId) => {
  const item = await dynamo.getItemByPrimaryKey({ pk: userId });
  return item ? item.connectionId : null;
};

const removeConnectionByUserUd = async (userId) => {
  // await dynamo.updateItem()
};

module.exports.defaultHandler = async (event, context) => {
  return success;
};

module.exports.connectionHandler = async (event, context) => {
  try {
    const connectionId = event.requestContext.connectionId;
    if (event.requestContext.eventType === "CONNECT") {
      const userId = event.headers.Auth;
      console.log({ connectionId, userId }, "connect");
      await writeConnectionToDb(userId, connectionId);
    } else if (event.requestContext.eventType === "DISCONNECT") {
      console.log({ connectionId }, "disconnect");
    }
    return success;
  } catch (e) {
    return createError(e);
  }
};

// http/sns
module.exports.sendMessage = async (event, context) => {
  try {
    console.log("send message");
    const { message, userId, type } = JSON.parse(event.body) || {};
    const url = process.env.API_URL || `http://localhost:3001`;
    const connectionId = await getConnectionIdByUserId(userId);
    console.log({ connectionId });
    if (!connectionId) {
      return notFound;
    }
    await sendMessageToClient(url, connectionId, {
      message: `echo_${message}}`,
      source: type,
    });
    return success;
  } catch (e) {
    return createError(e);
  }
};
