Gatsby GraphQL Tester Plugin
--------

A simple plugin with the intention of integration-testing source and transform Gatsby plugins, along with any others that might create / modify GraphQL.

It has in-built "snapshot testing" for GraphQL and the ability to enable deeper testing on the data itself.

### Usage

1. Create a simple Gatsby starter site (or cut it down to the bare minimum)
2. Add your plugin-under-test to the starter site's `gatsby-config.js`
3. Install this plugin
4. Add this plugin to the `gatsby-config.js` (see below) **after** your plugin
5. Add the GraphQL to query for
6. Run `GQL_TEST=update gatsby build` to generate the snapshot - commit these to source control

**Note**: `gatsby build` isn't your usual build; the tester plugin will terminate Gatsby via `process.exit()` (there are some spurious messages from Gatsby as one isn't supposed to exit like that).

Going forwards any breaking changes to the GraphQL will be picked up by the snapshot in - ideally - CI.

Deeper, more like unit tests can be enabled as well.

#### Sample config usage

```javascript

      resolve: 'gatsby-plugin-graphql-tester',
      options: {
        tests: [
          {
            name: 'allPosts',
            query: `
              query MyQuery {
                allPost {
                  nodes {
                    description
                    id
                    author {
                      name
                      id
                    }
                  }
                }
              }
            `,
            // test is optional; for deeper testing if you want/need it
            test: (data) => {
              const { allPost: { nodes }} = data;
              // Perform any tests on the incoming data
              if(nodes.length < 2) {
                return new Error(`Not enough posts created`)
              }
              return null;  // All is fine
            }
          }
        ]
      }
    }
```