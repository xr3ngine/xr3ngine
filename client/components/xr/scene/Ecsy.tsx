import React, { useEffect } from 'react'
import Layout from '../../ui/Layout'
import ApolloClient from 'apollo-boost'
import { ApolloProvider, Query } from 'react-apollo'
import gql from 'graphql-tag'

// eslint-disable-next-line no-unused-vars
import { World } from 'ecsy'

<<<<<<< HEAD
const EcsyPage = (): any => {
  let world: any
  const client: any = new ApolloClient({
    uri: 'http://localhost:3030/graphql'
  })
=======
const EcsyPage = () => {
  let world: any
  let client: any
>>>>>>> Changed next setup, combined client+server types and interfaces, lots of client typescript fixes
  const ENTITY_QUERY = gql`
    {
      entity {
        id
        name
        type
        components {
          id
<<<<<<< HEAD
          type.
=======
          type
>>>>>>> Changed next setup, combined client+server types and interfaces, lots of client typescript fixes
        }
      }
    }
  `
  useEffect(() => {
<<<<<<< HEAD
=======
    client = new ApolloClient({
      uri: 'http://localhost:3030/graphql'
    })

>>>>>>> Changed next setup, combined client+server types and interfaces, lots of client typescript fixes
    world = new World()
    const testEntity = world.createEntity()
    console.log(testEntity)
    client
      .query({
        query: ENTITY_QUERY
      })
      .then((result) => {
<<<<<<< HEAD
        console.log(result.data)
        if (!result.data.entities) return
=======
>>>>>>> Changed next setup, combined client+server types and interfaces, lots of client typescript fixes
        result.data.entities.map((entity: any) => {
          world.createEntity()
          console.log(entity)
        })
        console.log(result.data)
      })
  }, [])

  return (
    <ApolloProvider client={client}>
      <Layout pageTitle="Home">
        <Query query={ENTITY_QUERY}>
          {({ loading, error, data }: any) => {
            if (loading) return <h4> Loading... </h4>
            if (error) return <h4> Error </h4>
            return (
              <div>
                {data.entity.map((entity: any) => (
                  <p key={entity}>
                    {entity.name} | {world.createEntity().id}{' '}
                  </p>
                ))}
              </div>
            )
          }}
        </Query>
      </Layout>
    </ApolloProvider>
  )
}

// const ENTITY_MUTATION = gql`
//   {
//     entity(name: 'testEntity', type: 'box', components: [
//       {
//           type: networked
//       }
//     ])
//       {
//         id
//         name
//         type
//       }
//   }
// `
export default EcsyPage
