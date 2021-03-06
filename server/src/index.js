require('dotenv').config();

const { ApolloServer } = require('apollo-server');
const isEmail = require('isemail');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const { createStore } = require('./utils');

const LaunchAPI = require('./datasources/launch');
const UserAPI = require('./datasources/user');

// Creates a sequelize connection one. NOT for every request.
const store = createStore();

// set up any dataSources our resolvers need
const dataSources = () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
});

// The function that sets up the global context for each resolver, using the req.
const context = async ({ req }) => {
    // simple auth check on every request; not at all secure
    const auth = (req.headers && req.headers.authorization) || '';
    const email = Buffer.from(auth, 'base64').toString('ascii');

    // if the email isn't formatted validly, return null for user
    if (!isEmail.validate(email)) return { user: null };
    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = users && users[0] ? users[0] : null;

    return { user };
};

// Set up Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    dataSources,
    context,
 });

server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});
