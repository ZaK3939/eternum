import { graphql } from "../gql";

export const GET_ETERNUM_OWNER_REALM_IDS = graphql(`
  query getEternumOwnerRealmIds($accountAddress: ContractAddress!) {
    s1EternumOwnerModels(where: { address: $accountAddress }, limit: 8000) {
      edges {
        node {
          address
          entity_id
          entity {
            models {
              __typename
              ... on s1_eternum_Realm {
                realm_id
              }
            }
          }
        }
      }
    }
  }
`);
