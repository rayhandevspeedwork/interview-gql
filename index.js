import { ApolloServer, gql } from 'apollo-server';
import fetch from 'node-fetch';

// Define the GraphQL schema
const typeDefs = gql`
  type Pokemon {
    id: Int
    name: String
    height: Int
    weight: Int
    abilities: [Ability]
  }

  type Ability {
    name: String
  }

  type Query {
    getPokemon(nameOrId: String!): Pokemon
    listPokemon(limit: Int, offset: Int): [Pokemon]
    getPokemonByType(type: String!): [Pokemon]
  }
`;

// Resolvers to fetch data from PokeAPI
const resolvers = {
  Query: {
    async getPokemon(_, { nameOrId }) {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${nameOrId}`);
      if (!response.ok) {
        throw new Error('Pokemon not found');
      }
      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        height: data.height,
        weight: data.weight,
        abilities: data.abilities.map((ability) => ({ name: ability.ability.name })),
      };
    },
    async listPokemon(_, { limit = 10, offset = 0 }) {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
      const data = await response.json();

      const promises = data.results.map(async (pokemon) => {
        const pokemonResponse = await fetch(pokemon.url);
        const pokemonData = await pokemonResponse.json();
        return {
          id: pokemonData.id,
          name: pokemonData.name,
          height: pokemonData.height,
          weight: pokemonData.weight,
          abilities: pokemonData.abilities.map((ability) => ({ name: ability.ability.name })),
        };
      });

      return Promise.all(promises);
    },
    async getPokemonByType(_, { type }) {
      const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
      if (!response.ok) {
        throw new Error('Type not found');
      }
      const data = await response.json();

      const promises = data.pokemon.map(async (pokemonEntry) => {
        const pokemonResponse = await fetch(pokemonEntry.pokemon.url);
        const pokemonData = await pokemonResponse.json();
        return {
          id: pokemonData.id,
          name: pokemonData.name,
          height: pokemonData.height,
          weight: pokemonData.weight,
          abilities: pokemonData.abilities.map((ability) => ({ name: ability.ability.name })),
        };
      });

      return Promise.all(promises);
    },
  },
};

// Create an Apollo Server instance
const server = new ApolloServer({ typeDefs, resolvers });

// Start the server
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
