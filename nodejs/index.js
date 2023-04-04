// const { gql } = require("graphql-request");
const client = require("./src/client");
const { generateJWT } = require("./src/jwt");
const express = require("express");
const { ApolloServer, gql } = require("apollo-server");

const typeDefs = gql`
  type AuthResponse {
    token: String
  }
  type Mutation {
    login(username: String!, password: String!): AuthResponse
  }
  type Query {
    hello: String
  }
`;
const resolvers = {
  Query: {
    hello: () => "Hello GraphQL world!👋"
  },
  Mutation: {
    login: login
  }
};

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON in request bodies
// app.use(express.json());

// app.listen(port, () => {
//   console.log(`Auth server running on port ${port}.`);
// });

const server = new ApolloServer({ typeDefs, resolvers });
server
  .listen({ port: 9000 })
  .then((serverInfo) => console.log(`Server running at ${serverInfo.url}`));

async function login(parent, args, contextValue, info) {
  if (args && (args?.username !== "admin" || args?.password !== "admin")) {
    // NOTE: THIS IS JUST FOR DEMO! NEED TO HANDLE ERROR PROPERLY.
    return {
      token: "INVALID"
    };
  }

  let { user } = await client.request(
    gql`
      query getUserByname {
        user {
          id
        }
      }
    `,
    {}
  );

  // Since we filtered on a non-primary key we got an array back
  user = user[0];

  if (!user) {
    return {
      token: "INVALID"
    };
  }

  return {
    token: generateJWT({
      defaultRole: "user", // NOTE: STATIC user ROLE FOR THIS DEMO
      allowedRoles: ["user"], // NOTE: STATIC user ROLE FOR THIS DEMO
      otherClaims: {
        "X-Hasura-User-Id": user.id
      }
    })
  };
}
