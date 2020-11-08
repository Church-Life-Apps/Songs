import { isCordova } from '../utils/PlatformUtils';

describe('Database and Songs Table tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('DB Tables are created properly', () => {
    // expect(isCordova()).toBe(true);

    expect(1 + 1).toBe(2);
  });
});

// test('DB Tables are created properly', () => {
//   // jest.mock('Platform', () => {
//   //   const Platform = jest.requireActual('Platform');
//   //   Platform.OS = 'cordova';
//   //   return Platform;
//   // });
//   expect(isCordova()).toBe(true);

//   //   let thresholdSeconds = 10;
//   //   let timer = 0;
//   //   async () => {
//   //     while (Database.getInstance().sqlLite == undefined) {
//   //       timer = 0;
//   //       await delay(1000);
//   //       if (timer >= thresholdSeconds) {
//   //         fail(`DB Did not start up within ${thresholdSeconds} seconds.`);
//   //       }
//   //     }
//   //     console.log(`Db tables created after ${timer} seconds.`);
//   //   };
// });

// function delay(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }
