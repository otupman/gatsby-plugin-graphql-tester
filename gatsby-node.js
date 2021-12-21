const { writeFile, readFile } = require('fs/promises');
const HumanDiff = require('human-object-diff');

let TESTS = [];

exports.onPreInit = (_, {tests}) => {
  console.log(
    `logging: "${JSON.stringify(tests)}" to the console`
  )
  TESTS = tests;
}

exports.createPages = async ({ graphql, actions, reporter }) => {
  const action = process.env.GQL_TEST === 'update' ? 'update' : 'test';

  const { createPage } = actions

  const buildSnapshotFilepath = testName =>
    `gqltests/${testName}.gqlsnapshot.json`;
  const { diff } = new HumanDiff({});

  const results = await Promise.all(
    TESTS.map(async ({name: testName, query, test}) => {
      const data = await graphql(query);
      switch(action) {
        case 'update':
          await writeFile(buildSnapshotFilepath(testName), JSON.stringify(data));
          console.log(
            testName,
            'Updated.',
            'New data: ',
            JSON.stringify(data, undefined, 2),
          )
          break;
        case 'test':
          const expected = JSON.parse(
            await readFile(buildSnapshotFilepath(testName))
          )
          if(JSON.stringify(data) !== JSON.stringify(expected)) {
            const diffResult = diff(expected, data);
            console.error(
              'Test', testName, 'failed.',
              '\nQuery:', query,
              '\nDiff:', diffResult);
            return diffResult;
          }

          if(test) {
            try {
              const result = test(data.data);
              if (result !== null) {
                console.error('Test failed', result, query);
              }

              return result;
            } catch (e) {
              console.error('Test error', e, query);
              return e;
            }
          }
          else {
            return null;
          }
        default:
          throw new Error(`Unknown command ${action}`)
      }
    })
  );

  if(action === 'update') {
    process.exit(0);
  }

  const successCount = results.filter(result => result === null).length
  const failureCount = results.length - successCount;
  console.log('Finished. Pass:', successCount, 'Failures', results.length - successCount);

  process.exit(failureCount > 0 ? 100 : 0);
}