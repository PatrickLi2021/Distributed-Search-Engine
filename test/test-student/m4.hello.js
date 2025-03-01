test('(1 pts) timing insert', (done) => {
    // inserting objects into distributed store
    let totalInserts = 0;
    let totalQueries = 0;
    let start1 = performance.now();
    for (const key of Object.keys(kv)) {
      distribution.mygroup.mem.put(kv[key], kv, (e, v) => {
        totalInserts += 1;
        if (totalInserts == 1000) {
          let end1 = performance.now();
          console.log("time to insert = " + (end1-start1) + " milliseconds");
  
          // timing time to query
          let start2 = performance.now();
          for (const key of Object.keys(kv)) {
            distribution.mygroup.mem.get(key, (e, v) => {
              totalQueries += 1;
              if (totalQueries == 1000) {
                let end2 = performance.now();
                console.log("time to query = " + (end2-start2) + " milliseconds");
                done();
              }
            });
          }
  
        }
      });
    }
  
  });
  