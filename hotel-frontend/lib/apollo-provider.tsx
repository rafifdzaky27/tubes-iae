'use client';

import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { useState, createContext, useContext } from 'react';

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );
  if (networkError) console.error(`[Network error]: ${networkError}`);
});

// Service endpoints
const endpoints = {
  room: 'http://localhost:8001/graphql',
  guest: 'http://localhost:8003/graphql',
  reservation: 'http://localhost:8002/graphql',
  billing: 'http://localhost:8004/graphql',
};

// Create Apollo clients for each service
const createClients = () => {
  const clients: Record<string, ApolloClient<any>> = {};
  
  Object.entries(endpoints).forEach(([service, uri]) => {
    clients[service] = new ApolloClient({
      link: from([
        errorLink,
        new HttpLink({ uri })
      ]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'network-only',
        },
        query: {
          fetchPolicy: 'network-only',
        },
      },
    });
  });
  
  return clients;
};

// Default client for general use
const createDefaultClient = () => {
  return new ApolloClient({
    link: from([
      errorLink,
      new HttpLink({ uri: endpoints.reservation }) // Default to reservation service
    ]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
      },
      query: {
        fetchPolicy: 'network-only',
      },
    },
  });
};

// Create a context for service clients
const ServiceClientsContext = createContext<Record<string, ApolloClient<any>> | null>(null);

// Context to provide clients
export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const [clients] = useState(() => createClients());
  const [defaultClient] = useState(() => createDefaultClient());
  
  // We're using the default client for the ApolloProvider
  // Individual service clients can be accessed via the useServiceClient hook
  return (
    <ServiceClientsContext.Provider value={clients}>
      <ApolloProvider client={defaultClient}>
        {children}
      </ApolloProvider>
    </ServiceClientsContext.Provider>
  );
}

// Custom hook to access service clients
export function useServiceClient(service: 'room' | 'guest' | 'reservation' | 'billing') {
  const clients = useContext(ServiceClientsContext);
  if (!clients) {
    throw new Error('useServiceClient must be used within an ApolloWrapper');
  }
  return clients[service];
}
